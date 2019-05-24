package controllers.glance

import java.util.UUID

import controllers.amqp.GlanceSyncCache
import controllers.glance.GlanceAuth._
import controllers.security.Guard
import models.cmx.{Zone, MapCoordinate}
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import services.security.{AESEncrypt, GlanceCredential}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT
import play.api.Play.current;
import scala.concurrent.{Promise, Future}
import models.cmx.Implicits._

/**
 * Created by kennych on 6/20/17.
 */
object GlanceDeviceAliasController extends Controller with Guard {

  def readAll() = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    for{
      deviceAlias <- GlanceDeviceAlias.readAll(credential)
      allMacAddress <- RegisteredUser.readTrackedMacAddress(credential)
    }yield{
      val aliasList = deviceAlias.map(p => p.macAddress)
      val filteredMacAddress = allMacAddress.filter( p => !aliasList.contains(p))
      val tmpList = deviceAlias ::: filteredMacAddress.map(p => new GlanceDeviceAlias(glanceOrgId=credential.glanceOrgId,id =p,macAddress =p))
      Ok(ComUtils.getJsonArray(tmpList.map(p => ComUtils.removeObjectCommonProperties(Json.toJson(p).as[JsObject]))))
    }
  }

  def addDeviceAlias() =Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val deviceAlias=request.body.as[GlanceDeviceAlias](GlanceDeviceAlias.glanceDeviceAliasReaders)
        GlanceDeviceAlias.addOrUpdate(credential,deviceAlias).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/Update device alias successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to add/update  device alias!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to update device alias,exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid data: add/update  device alias!")))}
      }
    }
  }

  def updateDeviceAlias(device_id:String,macAddress:String) = Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val deviceAlias= new GlanceDeviceAlias(glanceOrgId=credential.glanceOrgId,id=device_id,macAddress=macAddress)
        GlanceDeviceAlias.addOrUpdate(credential,deviceAlias).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/Update device alias successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to add/update  device alias!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update device alias,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Invalid data: add/update  device alias!")))}
      }
    }
  }

  def deleteDeviceAlias(device_id:String) = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        GlanceDeviceAlias.delete(credential,device_id).map{ bRet:Boolean =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Delete the device alias successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Delete the device alias failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to delete alias,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Invalid data: delete device alias!")))}
      }
    }
  }

}