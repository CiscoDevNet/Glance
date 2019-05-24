package controllers.glance

import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Action, Controller}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

/**
 * Created by kennych on 1/21/16.
 */
object TrackBuilding extends Controller with Guard {

  def trackerBuildingTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceTrackBuilding(glanceOrgId = credential.glanceOrgId)
    Future{Ok(ComUtils.removeObjectCommonProperties(Json.toJson(t).as[JsObject]))}
  }

  def getById(buildingId: String) =Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackBuilding.readByBuildingId(credential,buildingId).map{ optConf =>
      if(optConf.isDefined){
        Ok(ComUtils.removeObjectCommonProperties(Json.toJson(optConf.get).as[JsObject]))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking building found!")))
      }
    }
  }
  def getAll()=Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackBuilding.readAll(credential).map{ buildings =>
      val valueArray =buildings.map(building => ComUtils.removeObjectCommonProperties(Json.toJson(building).as[JsObject]))
      Ok(ComUtils.getJsonArray(valueArray))
    }.recover{
      case _ =>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking building found!")))
    }
  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackBuilding=request.body.as[GlanceTrackBuilding](GlanceTrackBuilding.tolerantGlanceTrackBuildingReaders)
        GlanceTrackBuilding.addOrUpdate(credential,trackBuilding).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/update the tracking building successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/update tracking building failed!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking building info,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking building info!")))}
      }
    }
  }

  def addToCampus(campusId:String)=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackBuilding=request.body.as[GlanceTrackBuilding](GlanceTrackBuilding.tolerantGlanceTrackBuildingReaders)
        GlanceTrackBuilding.addOrUpdate(credential,trackBuilding,campusId).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/update the tracking building successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/update the tracking building failed!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking building info,exception",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking building info!")))}
      }
    }
  }

  def update(buildingId:String)=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackBuilding=request.body.as[GlanceTrackBuilding](GlanceTrackBuilding.tolerantGlanceTrackBuildingReaders)
        val trackBuildingTo=trackBuilding.copy(glanceOrgId = credential.glanceOrgId,buildingId=buildingId)
        GlanceTrackBuilding.addOrUpdate(credential,trackBuildingTo).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("update the tracking building successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("update the tracking building failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking building info,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking building info!")))}
      }
    }
  }

  def delete(buildingId:String)=Action.async(parse.anyContent) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        GlanceTrackBuilding.delete(credential,buildingId).map{ bRet:Boolean =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("delete the tracking building successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("delete the tracking building failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to delete tracking building info,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: delete tracking building info!")))}
      }
    }
  }
  def addFloor(buildingId:String,floorId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceTrackBuilding.addFloorInfo(credential,buildingId,floorId).map{bRet =>
        if(bRet)
          Ok(Json.toJson(GlanceStatus.successStatus("Update the tracking floor into building settings successfully,buildingId:{} floorId:{}".format(buildingId,floorId))))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update the tracking floor into building settings,buildingId:{} floorId:{}".format(buildingId,floorId))))
      }
    }
  }

  def removeFloor(buildingId:String,floorId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        bRemoveFromBuilding <-GlanceTrackBuilding.removeFloorInfo(credential,buildingId,floorId)
        bDelete  <-GlanceTrackFloor.delete(credential,floorId)
      }yield{
        if(bRemoveFromBuilding || bDelete)
          Ok(Json.toJson(GlanceStatus.successStatus("Remove the tracking floor into building settings successfully,buildingId:{} floorId:{}".format(buildingId,floorId))))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Remove the tracking floor into building settings failed,buildingId:{} floorId:{}".format(buildingId,floorId))))
      }
    }
  }

  def removeFloorIdOnly(buildingId:String,floorId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
        GlanceTrackBuilding.removeFloorInfo(credential,buildingId,floorId).map{ bRemoveFromBuilding =>
          if(bRemoveFromBuilding)
            Ok(Json.toJson(GlanceStatus.successStatus("Remove the tracking floor into building settings successfully,buildingId:{},floorId:{}".format(buildingId,floorId))))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to remove the tracking floor into building settings,buildingId:{}, floorId:{}".format(buildingId,floorId))))
        }
    }
  }

  def readBuildingWithFloors(buildingId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    GlanceTrackBuilding.readBuildingWithFloors(credential,buildingId).map{ tupValue:(GlanceTrackBuilding,List[GlanceTrackFloor]) =>
      if(tupValue._1==null){
        NotFound(Json.toJson(GlanceStatus.failureStatus("Could not find the track building info:{}".format(buildingId))))
      }else{
        var retObj =Json.toJson(tupValue._1).as[JsObject]
        retObj += (ComUtils.CONST_PROPERTY_FLOORS -> ComUtils.getJsonArray(tupValue._2.map((x:GlanceTrackFloor) => ComUtils.removeObjectCommonProperties(Json.toJson(x).as[JsObject]))))
        Ok(retObj)
      }
    }
  }
}
