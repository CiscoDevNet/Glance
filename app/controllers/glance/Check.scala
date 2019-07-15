package controllers.glance

import controllers.amqp.GlanceSyncCache
import controllers.glance.Avatar._
import utils.ComUtils.MAX_CONTENT
import controllers.glance.GlanceUser._
import controllers.glance.InterestPoints._
import controllers.glance.guestaccess.GuestCheckIn
import models.common.GlanceStatus
import models.glance._
import models.glance.guestaccess.GlanceGuestCheckIn
import play.Logger
import play.api.Play
import play.api.libs.iteratee.Enumerator
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import akka.actor.{ Actor, Props, actorRef2Scala }
import akka.pattern.ask
import play.api.Play.current
import play.api.libs.concurrent.Akka
import akka.util.Timeout
import services.cisco.notification.NotificationService
import services.security.GlanceCredential
import utils.{ComUtils, JsonResult}
import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.util.Success

/**
 * Created by kennych on 11/5/15.
 */
object Check extends Controller with Guard {
  val checkPage_path ="/check.html"
  val fileCheckPage_path ="/public/check.html"
  def getHeaderInfo(request:RequestHeader,headerName:String):String={
    val ipAddress:Option[String] = request.headers.get(headerName)
    ipAddress match {
      case Some(value) =>
        value
      case _ =>
        null
    }
  }

  def checkPage() =Action.async { implicit request =>
    val credential =remoteCredential
    val ipAddress =remoteXAddress
    val queryId =remoteQueryString(request,ComUtils.CONST_PROPERTY_ID,"")
    Logger.info("remoteIP Address path:$urlPath, ipAddress:$ipAddress")
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      macAddress <-RegisteredUser.getMacAddress(sysConf,ipAddress)
      optUser <-RegisteredUser.readRegisteredUserByMac(credential,macAddress)
    } yield {
      optUser match{
        case Some(user) =>
          if(user.id.compareToIgnoreCase(queryId)==0) //if already has some userid, return content
          {
            val contentStream = this.getClass.getResourceAsStream(fileCheckPage_path)
            Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML)
          }else{
            //if id doest not match, redirect to actual id.
            if(queryId==""){
              Redirect("{}?id={}".format(checkPage_path,user.id),302)
            }else{
              Redirect(checkPage_path,302)
            }
          }
        case _ =>
          if(queryId==""){
            val contentStream = this.getClass.getResourceAsStream(fileCheckPage_path)
            Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML)
           }else{
            //if the query id exist, but no user id match, just direct to default check page to select from beginning
            Redirect(checkPage_path,302)
          }
      }
    }
  }

  def userId_checkIn(expert_id:String,macAddress:String)=Action.async(parse.anyContent) { implicit request =>
    val credential =remoteCredential
    for{
      bUpdate <-{
        if(macAddress ==""){
          RegisteredUser.checkoutByForce(credential, expert_id)
        }else{
          RegisteredUser.updateMacAddress(credential,expert_id,macAddress)
        }
      }
    }yield {
      if(bUpdate)
          GlanceWebSocketActor.listenNotificationForAllFloors(credential)
      Ok(Json.toJson(GlanceStatus.successStatus(s"Update $expert_id checkin status successfully!")))
    }
  }

  private def getResult(bRet: Boolean,successMsg:String,failureMsg:String): Result = {
    if (bRet == true)
      return JsonResult(Json.toJson(GlanceStatus.successStatus(successMsg)))
    else
      return NotFound(Json.toJson(GlanceStatus.failureStatus(failureMsg)))
  }

  private def updateGuestCheckIn(credential:GlanceCredential,ipAddress:String,guestName:String): Future[Boolean] ={
    Logger.info(s"updateGuestCheckIn of IP:$ipAddress")
    for {
      sysConf <- GlanceSystemConf.readConf(credential)
      macAddress <- RegisteredUser.getMacAddress(sysConf, ipAddress)
      bRet <- {
        if (macAddress == "")
          Future{false}
        else{
          val appName = "Glance.selfRegistration"
          val phoneNumber: String = ""
          val email: String = ""
          val guestId =ComUtils.GUEST_ACCOUNT_PREFIX + macAddress.hashCode().toString()
          var tmpGuestName =guestName
          if(guestName == "")
            tmpGuestName=guestId
          val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
            glanceUserId = credential.glanceUserId,
            appName = appName,
            guestId = guestId,
            guestName = tmpGuestName,
            ipAddress = ipAddress,
            macAddress = macAddress,
            phoneNumber = phoneNumber,
            email = email,
            checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
            checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
            checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
            notificationCallback = "")
          GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
        }
      }
    } yield {
      if(bRet && macAddress!=""){
        GlanceWebSocketActor.removeGuestByMacAddress(macAddress)
      }
      bRet
    }
  }

  def checkIn(expert_id: String) = Action.async(parse.tolerantFormUrlEncoded) { implicit request =>
    val credential =remoteCredential
    val ipAddress =remoteXAddress
    Logger.info(s"remoteIP Address:$ipAddress")
    for {
        findExpert <- RegisteredUser.readUserByUserId(credential,expert_id)
        bRet<- {
          findExpert match{
            case Some(expert) =>
              RegisteredUser.checkIn(credential,expert_id,ipAddress)
            case None =>
              val guestName=remoteExtractDataString(request.body.get("name"))
              updateGuestCheckIn(credential,ipAddress,guestName)
          }
        }
    }yield  {
      if(bRet){
        NotificationService.syncAllDataToInstances
      }
      getResult(bRet,"Update check-in status successfully!","Update check-in status failed!")
    }
  }

  def checkOutByForce(expert_id: String) = Action.async(parse.empty) { implicit request =>
    val credential =ComUtils.getCredential()
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        findExpert <- RegisteredUser.readUserByUserId(credential,expert_id)
        bRet <- {
          findExpert match{
            case Some(expert) =>
              RegisteredUser.checkoutByForce(credential, expert_id)
            case None =>
              GlanceGuestCheckIn.checkoutByForce(credential, expert_id)
          }
        }
      } yield {
        getResult(bRet,"Update force check-out status successfully!","Update force check-out status failed!")
      }
    }
  }

  def checkOut(expert_id: String) = Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        findExpert <- RegisteredUser.readUserByUserId(credential,expert_id)
        bRet <- {
          findExpert match {
            case Some(expert) =>
              RegisteredUser.checkoutByForce(credential, expert_id)
            case None =>
              GlanceGuestCheckIn.checkoutByForce(credential, expert_id)
          }
        }
      } yield {
        getResult(bRet,"Update check-out status successfully!","Update check-out status failed!")
      }
    }
  }

}

