package controllers.glance.callback

import java.net.InetAddress

import controllers.glance.Common._
import controllers.glance.GlanceUser
import controllers.glance.GlanceUser._
import models.common.GlanceStatus
import models.glance.{GlanceTrackFloor, GlanceTrackCampus, GlanceSystemConf, RegisteredUser}
import models.meraki.MerakiNotification
import play.api.libs.iteratee.Enumerator
import play.Logger
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc.{Result, Action, Controller}
import play.api.Play.current
import play.modules.reactivemongo.MongoController
import reactivemongo.bson.{BSONString, BSONDocument, BSONObjectID,BSONValue}
import reactivemongo.bson.DefaultBSONHandlers._
import services.cisco.notification.NotificationService
import utils.{ComUtils, JsonResult}
import scala.concurrent.{Future, Await}
import scala.concurrent.duration.Duration
import scala.util._

/**
 * Created by kennych on 12/22/15.
 */
object GlanceCallback extends Controller with Guard{

  import scala.concurrent.ExecutionContext.Implicits.global._
  import play.api.libs.json._
  import play.api.libs.functional.syntax._
  import reactivemongo.api.gridfs._
  import reactivemongo.api.gridfs.Implicits._
  import play.modules.reactivemongo.ReactiveMongoPlugin
  import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
  import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader
  import scala.concurrent.ExecutionContext.Implicits.global

  var localIPAddress = ""
  val validator = "5e12053e6a917d0e49e877d03728bfd421767c19"
  val secret = "glance123"
  /*max content length to 50 M*/
  val MAX_NOTIFICATION_CONTENT_LENGTH = 1024*1024*50
  def notification(glanceOrgId:String,floorId:String) = Action.async(parse.json(MAX_NOTIFICATION_CONTENT_LENGTH)){ implicit request =>
    val credential2 = remoteCredential
    def getLocalIPAddress(): String ={
      import java.net.InetAddress
      val IP:InetAddress =InetAddress.getLocalHost();
      IP.getHostAddress()
    }

    try{
      if(localIPAddress=="")
        localIPAddress = getLocalIPAddress()
    }catch{
      case ex:Throwable =>
        localIPAddress = ""
    }
    Logger.debug("received Notification orgId:{},floorId:{}",glanceOrgId,floorId)
    val credential=ComUtils.getCredential(orgId =glanceOrgId,userId=credential2.glanceUserId)
    Future{
      NotificationService.handleNotificationData(credential,request.body)
      Ok(Json.obj("backend IP Address"->localIPAddress))
    }
  }

  def merakiNotification(glanceOrgId:String,floorId:String)= Action.async(parse.json(MAX_NOTIFICATION_CONTENT_LENGTH)) { implicit request =>
    val credential2 = remoteCredential
    def getLocalIPAddress(): String = {
      import java.net.InetAddress
      val IP: InetAddress = InetAddress.getLocalHost();
      IP.getHostAddress()
    }

    try {
      if (localIPAddress == "")
        localIPAddress = getLocalIPAddress()
    } catch {
      case ex: Throwable =>
        localIPAddress = ""
    }

    Logger.debug("received Meraki notification orgId:{},floorId:{}", glanceOrgId,floorId)
    //val credential = ComUtils.getCredential(orgId = glanceOrgId, userId = credential2.glanceUserId)
    val credential = credential2
    for{
      sysConf <-GlanceSystemConf.readConf(credential)
      trackFloors <-GlanceTrackFloor.readAll(credential)
    }yield {
      try{
        import models.meraki.Implicits._
        if(request.body==null){
          Logger.error("Invalid Meraki Request from {}",remoteAddressAllchains(request))
          Ok(Json.obj("status" -> "Invalid Meraki request"))
        }else{
          val merakiNotification =request.body.as[MerakiNotification]
          Logger.info("Parse Meraki notification data successfully!")
          if(merakiNotification.secret==sysConf.merakiSecret)
          {
            val hierarchys:List[String] =trackFloors.map(p => p.hierarchy).filter(p => p.trim()!="")
            val notificationFloors ={
              if(merakiNotification.data!=null){
                Logger.debug("Received post notification floors:{}",merakiNotification.data.apFloors.mkString(";"))
                merakiNotification.data.apFloors.filter(p => p.trim()!="")
              }
              else
                List()
            }
            val matchedHierarchys = notificationFloors.filter(p => hierarchys.contains(p))
            if(matchedHierarchys.length>0)
              NotificationService.handleMerakiNotificationData(credential,merakiNotification)
            else
              Logger.info("The floor is not been tracked currently,ignore:{}",notificationFloors.mkString(","))
            Ok(Json.obj("Backend IP address" -> localIPAddress))
          }else
          {
            Unauthorized(Json.obj("Backend IP address" -> localIPAddress,"Error message" -> "Invalid secret!"))
          }
        }
      }catch {
        case exp:Throwable =>
          Logger.error("Log failure of Meraki message :{}",exp.getMessage)
          Logger.info("Meraki request from {}", remoteAddressAllchains(request))
          if(request.body==null)
            Logger.error("Received Meraki notification:null body.")
          else
             Logger.error("Received Meraki notification:{}", request.body.toString())
          Ok(Json.obj("Backend IP address" -> localIPAddress,"Error message" ->exp.getMessage))
      }
    }
  }

  def merakiNotificationValidator(glanceOrgId:String,floorId:String)= Action.async { implicit request =>
    val credential = remoteCredential
    Logger.debug("Getting Meraki validator orgId:{},floorId:{}",glanceOrgId,floorId)
    for{
      sysConf <-GlanceSystemConf.readConf(credential)
    }yield {
      Ok(sysConf.merakiValidator)
    }
  }

  //highlight control to support cmd to highlight or show hide experts
  def highLightCallback(expertGuestId:String)=Action.async(parse.anyContent) { implicit request =>
    val credential=remoteCredential
    for{
      experts <-GlanceUser.readCurrentActiveUsers(credential)
    }yield {
      val finds=experts.filter(p => p.id.compareToIgnoreCase(expertGuestId)==0 || p.name.toLowerCase.contains(expertGuestId.toLowerCase)==0)
      if(finds.length>0){
        if(NotificationService.sendHighLightCmd(finds.map(p=> p.id),credential))
          Ok(Json.toJson(GlanceStatus.successStatus("Send cmd successfully!")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("No expert found!")))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("No expert found!")))
      }
    }
  }

  def controlCallback(cmd:String)=Action.async(parse.anyContent) { implicit request =>
    val credential=remoteCredential
    if(NotificationService.sendShowHideCmd(List(cmd),credential))
      Future{
        Ok(Json.toJson(GlanceStatus.successStatus("Send cmd successfully!")))
      }
    else
      Future{
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect cmd!")))
      }
  }

}
