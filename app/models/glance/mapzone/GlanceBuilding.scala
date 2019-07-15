package models.glance.mapzone

import reactivemongo.play.json._
import controllers.amqp.GlanceSyncCache
import models._
import models.cmx.Building
import play.Logger
import play.api.libs.json.{Json, JsObject}
//import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import _root_.utils.ComUtils
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import models.cmx.Implicits._
import scala.concurrent.Future


/**
 * Created by kennych on 12/1/15.
 */
case class GlanceBuilding (_id: BSONObjectID = BSONObjectID.generate,
                           glanceOrgId:String,
                           glanceUserId:String,
                           campusId:String,
                           buildingId: String,
                           buildingName: String,
                           buildingRef:Building,
                           tags: List[String],
                           created: Long,
                           updated: Long)

object GlanceBuilding {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("GlanceBuilding")
  val CACHE_NAME = "GlanceBuilding"
  val tolerantGlanceReaders = new Reads[GlanceBuilding] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceBuilding(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_BUILDINGNAME).asOpt[String].getOrElse(""),
        (js \ "buildingRef").as[Building](tolerantBuildingReaders),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceBuilding] {
    def writes(z: GlanceBuilding): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID ->z.glanceUserId,
        ComUtils.CONST_PROPERTY_CAMPUSID -> z.campusId,
        ComUtils.CONST_PROPERTY_BUILDINGID -> z.buildingId,
        ComUtils.CONST_PROPERTY_BUILDINGNAME -> z.buildingName,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGlanceReaders, glanceWrites)


  def insert(building: GlanceBuilding):Future[Boolean] = {
    try{
      GlanceThing.collection.insert(building).map{
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.info("Successfully insert: "+building.glanceOrgId+" glanceUserId:"+building.glanceUserId+" campusId:"+building.campusId+"with buildingId:"+building.buildingId +" buildName:"+building.buildingName)
          true
        case _ =>
          Logger.error("Failed to insert: "+building.glanceOrgId+" glanceUserId:"+building.glanceUserId+" campusId:"+building.campusId+"with buildingId:"+building.buildingId +" buildName:"+building.buildingName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert glance building, exception:{}",exp.getMessage)
        Future{false}
    }

  }

  def addOrUpdate(building:GlanceBuilding):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> building.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> building.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->building.buildingId)
    val findExistCount = (existQuery:BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count( GlanceBuilding.collection.name,Some(existQuery)))
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to query count of glance building, exception:{}",exp.getMessage)
          Future{0}
      }
    }
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,building)
    }yield bRet
  }

  def addOrUpdate(existCount:Int,building:GlanceBuilding):Future[Boolean] ={

    if(existCount >0) {
      update(building)
    }else{
      insert(building)
    }
  }

  def update(building:GlanceBuilding):Future[Boolean] = {
    try{
      GlanceBuilding.collection.update(Json.obj("glanceOrgId" ->building.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> building.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->building.buildingId),
        Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_BUILDINGNAME -> building.buildingName,ComUtils.CONST_PROPERTY_TAGS -> building.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated: glanceOrgId"+building.glanceOrgId+" glanceUserId:"+building.glanceUserId+" campus:"+building.campusId+" buildingId:"+building.buildingId+" with buildingName:"+building.buildingName)
          true
        case _ =>
          Logger.error("Failed to update: glanceOrgId"+building.glanceOrgId+" glanceUserId:"+building.glanceUserId+" campus:"+building.campusId+" buildingId:"+building.buildingId+" with buildingName:"+building.buildingName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update glance building, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def delete(building:GlanceBuilding): Future[Boolean] = {
    try{
      GlanceBuilding.collection.remove(Json.obj("glanceOrgId" ->building.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID->building.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->building.buildingId)).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully deleted: "+building.glanceOrgId +" campusId:"+building.campusId+" buildingId:"+building.buildingId)
          true
        case _ =>
          Logger.error("Failed to delete: "+building.glanceOrgId +" campusId:"+building.campusId+" buildingId:"+building.buildingId)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete glance building, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def readAllBuildings(glanceOrgId:String,glanceUserId:String):Future[List[GlanceBuilding]] ={
    val findByOrgUserId  = (org: String) => {
      try{
        GlanceBuilding.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_BUILDINGNAME -> 1)).cursor[GlanceBuilding].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read all glance building, exception:{}",exp.getMessage)
          Future{List()}
      }
    };
    findByOrgUserId(glanceOrgId)
  }

  def readBuilding(glanceOrgId:String,glanceUserId:String,campusId:String,buildingId:String):Future[Option[GlanceBuilding]] ={
    val findByName  = (org: String,cid:String,bid:String) => {
      try{
        GlanceBuilding.collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_CAMPUSID -> cid,ComUtils.CONST_PROPERTY_BUILDINGID ->bid)).one[GlanceBuilding]
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read glance building by campusId:{},buuldingId:{}, exception:{}",campusId,buildingId,exp.getMessage)
          Future{None}
      }
    };
    findByName(glanceOrgId,campusId,buildingId)
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceBuilding]](CACHE_NAME,null)
  }

  def updateGlanceBuildingCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      for {
        listBuildings <- readAllBuildings(credential.glanceOrgId,credential.glanceUserId)
      } yield {
        if (listBuildings == null || listBuildings.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceBuilding]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceBuilding]](CACHE_NAME,listBuildings)
        true
      }
    }
    if (bCheckExists) {
      val optBuildings = GlanceSyncCache.getGlanceCache[List[GlanceBuilding]](CACHE_NAME)
      if (optBuildings.isDefined){
        Future{true}
      }else{
        readAndSet
      }
    } else {
      readAndSet
    }
  }

}