package controllers.glance

import controllers.glance.TrackBuilding._
import controllers.glance.Conf._
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Action, Controller}
import utils.{ComUtils, JsonResult}
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT
import scala.concurrent.Future

/**
 * Created by kennych on 1/21/16.
 */
object TrackCampus extends Controller with Guard {
  def trackCampusTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceTrackCampus(glanceOrgId = credential.glanceOrgId)
    Future{JsonResult(Json.toJson(t))}
  }

  def getById(campusId: String) =Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackCampus.readByCampusId(credential,campusId).map{ optCampus =>
      if (optCampus.isDefined){
        Ok(ComUtils.removeObjectCommonProperties(Json.toJson(optCampus.get).as[JsObject]))
      }else
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking campus found!")))
    }
  }
  def getAll()= Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackCampus.readAll(credential).map{ listCampuses =>
      val valueArray = listCampuses.map(campus => ComUtils.removeObjectCommonProperties(Json.toJson(campus).as[JsObject]))
      Ok(ComUtils.getJsonArray(valueArray))
    }.recover{
      case _ =>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking campus found!")))
    }
  }
  def getAllInfo()= Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackCampus.readAllWithDetail(credential).map{ listCampuses =>
      val campusesInfo:mutable.MutableList[JsObject]=new mutable.MutableList[JsObject]()
      listCampuses.foreach{ campus =>
        var listObj:mutable.MutableList[JsObject] =new mutable.MutableList[JsObject]
        var campusObj = ComUtils.removeObjectCommonProperties(Json.toJson(campus._1).as[JsObject])
        val tmpHashMapOfBuildingFloors =campus._2
        val keysOfBuildings =tmpHashMapOfBuildingFloors.keys.toList
        for(keyBuilding <- keysOfBuildings)
        {
          val tmpList:List[GlanceTrackFloor]  = tmpHashMapOfBuildingFloors(keyBuilding)
          var building = ComUtils.removeObjectCommonProperties(Json.toJson(keyBuilding).as[JsObject])
          building += (ComUtils.CONST_PROPERTY_FLOORS -> ComUtils.getJsonArray(tmpList.map((trackFloor:GlanceTrackFloor) => ComUtils.removeObjectCommonProperties(Json.toJson(trackFloor).as[JsObject]))))
          listObj +=building
        }
        campusObj += (ComUtils.CONST_PROPERTY_BUILDINGS -> ComUtils.getJsonArray(listObj.toList))
        campusesInfo += campusObj
      }
      Ok(ComUtils.getJsonArray(campusesInfo.toList))
    }.recover{
      case _ =>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking campus found!")))
    }
  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val glanceTrackCampus= request.body.as[GlanceTrackCampus](GlanceTrackCampus.tolerantGlanceTrackCampusReaders)
        GlanceTrackCampus.addOrUpdate(credential,glanceTrackCampus).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/update the tracking campus successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to add/update the tracking campus info.")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking campus info,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking campus info!")))}
      }
    }
  }

  def delete(campusId:String)=Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if (!isAdminLoggedIn) {
      Future {
        Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))
      }
    }else{
      GlanceTrackCampus.delete(credential,campusId).map{ bDelete =>
        if(bDelete){
          Ok(Json.toJson(GlanceStatus.successStatus("Remove campus info successfully for {}".format(campusId))))
        }else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to remove campus for {}".format(campusId))))
        }
      }
    }
  }

  def update(campusId:String)=Action.async(parse.json) {implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try {
        val trackCampus = request.body.as[GlanceTrackCampus](GlanceTrackCampus.tolerantGlanceTrackCampusReaders)
        val trackCampusTo = trackCampus.copy(glanceOrgId = credential.glanceOrgId, campusId = campusId)
        GlanceTrackCampus.addOrUpdate(credential, trackCampusTo).map { bRet: Boolean =>
          if (bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("update the tracking campus successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("update the tracking campus failed")))
        }
      } catch {
        case e: Exception =>
          Logger.error("Failed to add/update tracking campus info,exception:{}",e.getMessage)
          Future {
            InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking campus info!")))
          }
      }
    }
  }
  def addBuilding(campusId:String,buildingId:String)=Action.async(parse.empty) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceTrackCampus.addBuildingId(credential, campusId, buildingId).map { bRet =>
        if (bRet)
          Ok(Json.toJson(GlanceStatus.successStatus("update the tracking building into campus configuration successfully,campusId:{} buildingId:{}".format(campusId,buildingId))))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("update the tracking building into campus configuration failed,campusId:{} buildingId:{}".format(campusId,buildingId))))
      }
    }
  }

  def removeBuilding(campusId:String,buildingId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        bRemoveBuildingId <-GlanceTrackCampus.removeBuildingId(credential,campusId,buildingId)
        bDeleteBuilding <- GlanceTrackBuilding.deleteWithAllFloors(credential,buildingId)
      }yield{
        if(bRemoveBuildingId || bDeleteBuilding)
          Ok(Json.toJson(GlanceStatus.successStatus("remove the tracking building into campus configuration successfully,campusId:"+campusId+" buildingId:"+buildingId)))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("remove the tracking building into campus configuration failed,campusId:"+campusId+" buildingId:"+buildingId)))
      }
    }
  }

  def removeBuildingIdOnly(campusId:String,buildingId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceTrackCampus.removeBuildingId(credential, campusId, buildingId).map { bRemoveBuildingId =>
        if (bRemoveBuildingId)
          Ok(Json.toJson(GlanceStatus.successStatus("remove the tracking building into campus configuration successfully,campusId:{} buildingId:{}".format(campusId,buildingId))))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("remove the tracking building into campus configuration failed,campusId:{} buildingId:{}".format(campusId, buildingId))))
      }
    }
  }

  def readCampusWithBuildingsWithFloors(campusId:String)=Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,campusId).map{ tripleValue =>
      if(tripleValue._1 ==null)
      {
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking campus found!")))
      }else{
        var listObj:mutable.MutableList[JsObject] =new mutable.MutableList[JsObject]
        var valObj = ComUtils.removeObjectCommonProperties(Json.toJson(tripleValue._1).as[JsObject])
        val tmpHashMapOfBuildingFloors =tripleValue._3
        val keysOfBuildings =tmpHashMapOfBuildingFloors.keys.toList
        for(keyBuilding <- keysOfBuildings)
        {
          val tmpList:List[GlanceTrackFloor]  =tmpHashMapOfBuildingFloors(keyBuilding)
          var building = ComUtils.removeObjectCommonProperties(Json.toJson(keyBuilding).as[JsObject])
          building += (ComUtils.CONST_PROPERTY_FLOORS -> ComUtils.getJsonArray(tmpList.map((trackFloor:GlanceTrackFloor) => ComUtils.removeObjectCommonProperties(Json.toJson(trackFloor).as[JsObject]))))
          listObj +=building
        }
        valObj += (ComUtils.CONST_PROPERTY_BUILDINGS -> ComUtils.getJsonArray(listObj.toList))
        Ok(valObj)
      }
    }
  }

  //this is special APIs to generate for Configuration UI.
  def readDefaultTrackFloors()=Action.async(parse.empty) { implicit request =>
    val credential=remoteCredential
    def convertFloor_inline(floor:GlanceTrackFloor,buildings:List[GlanceTrackBuilding]):JsObject={
      val jsObj=Json.obj( ComUtils.CONST_PROPERTY_FLOORID->floor.floorId,
        ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,floor.floorId)),
        ComUtils.CONST_PROPERTY_FLOORNAME ->floor.floorName,
        ComUtils.CONST_PROPERTY_HIERARCHY ->floor.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME ->floor.mapName,
        ComUtils.CONST_PROPERTY_SWAPXY ->JsBoolean(floor.floorConf.glancePositionCalibrateSetting.swapXY),
        ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYX ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX),
        ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYY ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY),
        ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSX ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusX),
        ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSY ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusY),
        ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKWIDTH ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionTrackWidth),
        ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKHEIGHT ->JsNumber(floor.floorConf.glancePositionCalibrateSetting.cmxPositionTrackHeight)
      )
      jsObj
    }

    for{
      floors <-GlanceTrackCampus.readDefaultCampusFloors(credential)
      buildings <-GlanceTrackBuilding.readAll(credential)
    }yield{
      if(floors.length>0){
        val floorObjs =floors.map(floor => convertFloor_inline(floor,buildings))
        Ok(Json.obj(ComUtils.CONST_PROPERTY_DATA -> floorObjs))
      }
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus("None floor has been configured!")))
    }
  }

}
