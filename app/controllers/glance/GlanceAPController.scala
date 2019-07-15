package controllers.glance

import java.util.UUID

import controllers.glance.Conf._
import controllers.security.Guard
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import utils.{ComUtils, JsonResult}

import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT

import scala.concurrent.Future

/**
 * Created by kennych on 08/03/2018.
 */

//Controller to handle meraki AP data RESTFul API
object GlanceAPController extends Controller with Guard {

  def AccessPointTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceAccessPoint(glanceOrgId = credential.glanceOrgId,
      id="floor1_booth_glance",
      floorId="Floor Two",
      name="MerakiAP1",
      description="MerakiAP1",
      position = new GlancePosition(x=20,y=20)
    )
    Future{JsonResult(Json.toJson(t))}
  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val accessPoint=request.body.as[GlanceAccessPoint](GlanceAccessPoint.glanceAccessPointReaders)
        GlanceAccessPoint.addOrUpdate(credential,accessPoint).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/Update accessPoint successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to add/update accessPoint!")))
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Failed to add/update accessPoint, exception:{}",ex.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid data: add/update accessPoint!")))}
      }
    }
  }

  def getAll() = Action.async { implicit request =>
    val credential =remoteCredential
    GlanceAccessPoint.readAll(credential).map{ conf =>
      if(conf.length==0)
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched access point found!")))
      else
        JsonResult(Json.toJson(conf))
    }.recover{
      case _=>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched access point found, exception!")))
    }
  }

  def getAllDevices() = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      ipMappings <-  GlanceAssociationIPMacAddress.readAllCachedIPMappings(credential)
      accessPoints <- GlanceAccessPoint.readAllCombineConnectedDevice(credential,ipMappings)
    }yield{
      val tmpAccessPoints = accessPoints.map(p => p.copy(connectedDevices =  ipMappings.filter(ipDevice => ipDevice.merakiData.apMac==p.macAddress).map(device => device.macAddress)))
      if(tmpAccessPoints.length == 0)
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched access point found!")))
      else
        JsonResult(Json.toJson(GlanceAccessPoint.getFloorsAccessPoints(tmpAccessPoints)))
    }
  }
  
  def readDevicesByFloorId(floorIdName:String) = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      floorInfo <-GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,floorIdName)
      accessPoints <- {if(floorInfo==null)Future{List()} else GlanceAccessPoint.readAllByFloorIdName(credential,floorInfo.floorId)}
    }yield{
      if(accessPoints==null || accessPoints.length==0)
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched Access Point found!")))
      else
        JsonResult(Json.toJson(accessPoints))
    }
  }

  def deleteAccessPointById(accessPointId:String)= Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        GlanceAccessPoint.delete(credential,accessPointId).map{ bRet:Boolean =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Delete the access point successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Delete the access point failed")))
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Delete access point info failed,exception:{}",ex.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Delete access point info failed,exception!")))}
      }
    }
  }

  def deleteAccessPointByFloor(floorNameId:String)= Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        for{
          floorInfo <- GlanceTrackFloor.readByFloorId(credential,floorNameId)
          bRet <- {
            if(floorInfo.getOrElse(null)==null){Future{false}} else GlanceAccessPoint.deleteByFloorId(credential,floorInfo.get.floorId)
          }
        }yield {
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus(s"Delete the access point of floor $floorNameId successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus(s"Delete the access point of floor $floorNameId failed")))
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Delete access point info by floor failed,exception:{}",ex.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Delete access point info by floor failed,exception!")))}
      }
    }
  }
}
