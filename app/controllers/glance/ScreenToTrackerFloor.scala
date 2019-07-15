package controllers.glance

import java.util.UUID
//import controllers.glance.Conf._
//import controllers.glance.Conf.verifyConf
//import controllers.glance.TrackCampus._
//import controllers.glance.TrackerFloor._
import controllers.security.Guard
import models.cmx.MapCoordinate
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import services.cisco.notification.NotificationService
import services.security.GlanceCredential
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

/**
 * Created by kennych on 1/8/16.
 */
object ScreenToTrackerFloor  extends Controller with Guard{

  def getAll() = Action.async { implicit request =>
    val credential =remoteCredential
    GlanceScreenToTrackFloor.readAll(credential).map{ screens =>
       val valueArray = screens.map(screen => ComUtils.removeObjectCommonProperties(Json.toJson(screen).as[JsObject]))
       Ok(ComUtils.getJsonArray(valueArray))
    }
  }

  def screenToTrackerFloorTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceScreenToTrackFloor(glanceOrgId = credential.glanceOrgId,screenId = UUID.randomUUID().toString(),clientAddress="169.254.112.25",floorId=UUID.randomUUID().toString())
    Future{Ok(Json.toJson(t))}
  }

  def getByScreenId(screenId: String) =Action.async { implicit request =>
    val credential = remoteCredential
    GlanceScreenToTrackFloor.readByScreenId(credential, screenId).map { optScreen =>
      if (optScreen.isDefined) {
        Ok(ComUtils.removeObjectCommonProperties(Json.toJson(optScreen.get).as[JsObject]))
      } else
        NotFound(Json.toJson(GlanceStatus.failureStatus("No match tracking floor found!")))
    }
  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackFloor=request.body.as[GlanceScreenToTrackFloor](GlanceScreenToTrackFloor.glanceScreenToTrackFloorReaders)
        GlanceScreenToTrackFloor.addOrUpdate(credential,trackFloor).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/Update the tracking screen successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking screen found!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking screen info,exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking screen info!")))}
      }
    }

  }

  def update(screenId:String)=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    try{
      val trackFloor=request.body.as[GlanceScreenToTrackFloor](GlanceScreenToTrackFloor.glanceScreenToTrackFloorReaders)
      val trackFloorTo=trackFloor.copy(glanceOrgId = credential.glanceOrgId,screenId=screenId)
      GlanceScreenToTrackFloor.updateByScreenId(credential,screenId,trackFloorTo).map{ bRet:Boolean =>
        if(bRet)
          Ok(Json.toJson(GlanceStatus.successStatus("update the tracking screenId successfully")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("update the tracking screenId failed")))
      }
    }catch{
      case e:Throwable =>
        Logger.error("Failed to  add/update tracking screenId info,exception:{}",e.getMessage)
        Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking screenId info!")))}
    }
  }

  def registerScreenDevice(screen_at_floorId:String) =Action.async(parse.json) { implicit request =>
    val screenPosition:GlancePosition =request.body.asOpt[GlancePosition](GlancePosition.tolerantPositionReaders).getOrElse(new GlancePosition(x=0,y=0))
    val ipAddress =remoteXAddress
    val credential =remoteCredential
    def buildScreenTrackInfo(credential:GlanceCredential,floorInfo:GlanceTrackFloor,mapSizes:List[GlanceMapSizeInfo]): Future[GlanceScreenToTrackFloor] ={
      val trackFloor=new GlanceScreenToTrackFloor(floorId = {
        if(floorInfo==null)
          ""
        else
          floorInfo.floorId
        },
        glanceOrgId=credential.glanceOrgId,
        matchIPAddress=true,clientAddress = ipAddress,showAllDevicesOnScreen=true,screenPosition={
          if(floorInfo==null)
            screenPosition
          else{
            val (_,posArr) =NotificationService.getPositionArr(new MapCoordinate(screenPosition.x.toDouble,screenPosition.y.toDouble),floorInfo,null,mapSizes)
            screenPosition.copy(x=posArr(0).toLong,y=posArr(1).toLong)
          }
        })
        Future{trackFloor}
    }

    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        for{
          floorInfo <-GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,screen_at_floorId)
          mapSizes<- GlanceMapSizeInfo.readAllConf(credential)
          trackScreenFloor <-buildScreenTrackInfo(credential,floorInfo,mapSizes)
          bRet <-{
            if(floorInfo==null)
              Future{false}
            else
              GlanceScreenToTrackFloor.addOrUpdate(credential,trackScreenFloor)
          }

        }yield{
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Register Screen Device Id successfully!")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Register Screen Device Id failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to register screen device id, exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: Register Screen Device Id!")))}
      }
    }
  }

  def registerScreenDeviceByGet(screen_at_floorId:String) =Action.async { implicit request =>
    def tryParseLong(strValue:String):Long={
      try{
          strValue.toLong
      } catch {
        case ex:Throwable =>
          Logger.error("Incorrect parameter value:{},exception:{}",strValue,ex.getMessage)
          0
      }
    }

    val xParameter=tryParseLong(remoteQueryString(request,"x","0"))
    val yParameter=tryParseLong(remoteQueryString(request,"y","0"))
    val screenPosition:GlancePosition =new GlancePosition(x=xParameter,y=yParameter)
    val ipAddress =remoteXAddress
    val credential =remoteCredential
    def buildScreenTrackInfo(credential:GlanceCredential,floorInfo:GlanceTrackFloor,mapSizes:List[GlanceMapSizeInfo]): GlanceScreenToTrackFloor ={
      val trackFloor=new GlanceScreenToTrackFloor(floorId=floorInfo.floorId,
        glanceOrgId=credential.glanceOrgId,
        matchIPAddress=true,clientAddress = ipAddress,showAllDevicesOnScreen=true,screenPosition={
          if(floorInfo==null)
            screenPosition
          else{
            val (_,posArr) =NotificationService.getPositionArr(new MapCoordinate(screenPosition.x.toDouble,screenPosition.y.toDouble),floorInfo,null,mapSizes)
            screenPosition.copy(x=posArr(0).toLong,y=posArr(1).toLong)
          }
        })
      trackFloor
    }
    try{
      for{
        floorInfo <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,screen_at_floorId)
        mapSizes <- GlanceMapSizeInfo.readAllConf(credential)
        trackScreenFloor <- Future{if(floorInfo==null) null else buildScreenTrackInfo(credential,floorInfo,mapSizes)}
        bRet <-{if(floorInfo==null) Future{false} else GlanceScreenToTrackFloor.addOrUpdate(credential,trackScreenFloor)}
      }yield{
        if(bRet)
           Redirect("/", 302)  //redirect to main window.
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Register screen device id failed")))
      }
    }catch{
      case e:Throwable =>
        Logger.error("Failed to register screen device id,exception:{}",e.getMessage)
        Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: Register screen device id!")))}
    }
  }

}
