package models.glance.mapzone

import reactivemongo.play.json._
import controllers.amqp.GlanceSyncCache
import models._
import models.cmx.Floor
import models.cmx.Implicits._
import play.Logger
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import _root_.utils.ComUtils
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future


/**
 * Created by kennych on 12/1/15.
 */
case class GlanceFloor (_id: BSONObjectID = BSONObjectID.generate,
                        glanceOrgId:String,
                        glanceUserId:String,
                        campusId:String,
                        buildingId:String,
                        floorId: String,
                        floorName:String,
                        floorRef:Floor,
                        tags: List[String],
                        created: Long,
                        updated: Long)


object GlanceFloor {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("GlanceFloor")

  val CACHE_NAME = "GlanceFloor"
  val tolerantGlanceReaders = new Reads[GlanceFloor] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceFloor(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORREF).as[Floor](tolerantFloorReaders),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceFloor] {
    def writes(z: GlanceFloor): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID ->z.glanceUserId,
        ComUtils.CONST_PROPERTY_CAMPUSID -> z.campusId,
        ComUtils.CONST_PROPERTY_BUILDINGID -> z.buildingId,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        ComUtils.CONST_PROPERTY_FLOORNAME -> z.floorName,
        ComUtils.CONST_PROPERTY_FLOORREF -> z.floorRef.asInstanceOf[JsValue],
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGlanceReaders, glanceWrites)


  def insert(floor: GlanceFloor):Future[Boolean] = {
    try{
      GlanceThing.collection.insert(floor).map{
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully insert: "+floor.glanceOrgId+" glanceUserId:"+floor.glanceUserId+" campusId:"+floor.campusId+"with buildingId:"+floor.buildingId +"with floorId:"+floor.floorId+ " floorName:"+floor.floorName)
          true
        case _ =>
          Logger.error("Failed to insert: "+floor.glanceOrgId+" glanceUserId:"+floor.glanceUserId+" campusId:"+floor.campusId+"with buildingId:"+floor.buildingId +"with floorId:"+floor.floorId+ " floorName:"+floor.floorName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert glance floor,floorId:{}, exception:{}",floor.floorId,exp.getMessage)
        Future{false}
    }
  }

  def addOrUpdate(floor:GlanceFloor):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> floor.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> floor.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->floor.buildingId,ComUtils.CONST_PROPERTY_FLOORID -> floor.floorId)
    val findExistCount = (existQuery:BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count( GlanceFloor.collection.name,Some(existQuery)))
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to query count of glance floor,floorId:{}, exception:{}",floor.floorId,exp.getMessage)
          Future{0}
      }
    }
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,floor)
    }yield bRet
  }

  def addOrUpdate(existCount:Int,floor:GlanceFloor):Future[Boolean] ={
    if(existCount >0) {
      update(floor)
    }else{
      insert(floor)
    }
  }

  def update(floor:GlanceFloor):Future[Boolean] = {
    try{
      GlanceFloor.collection.update(Json.obj("glanceOrgId" ->floor.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> floor.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->floor.buildingId,ComUtils.CONST_PROPERTY_FLOORID ->floor.floorId),
        Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_FLOORNAME -> floor.floorName,ComUtils.CONST_PROPERTY_TAGS -> floor.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated: glanceOrgId"+floor.glanceOrgId+" glanceUserId:"+floor.glanceUserId+" campus:"+floor.campusId+" buildingId:"+floor.buildingId+" floorId:"+floor.floorId+  " with floorName:"+floor.floorName)
          true
        case _ =>
          Logger.error("Failed to update: glanceOrgId"+floor.glanceOrgId+" glanceUserId:"+floor.glanceUserId+" campus:"+floor.campusId+" buildingId:"+floor.buildingId+" floorId:"+floor.floorId+  " with floorName:"+floor.floorName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update glance floor,floorId:{}, exception:{}",floor.floorId,exp.getMessage)
        Future{false}
    }
  }

  def delete(floor:GlanceFloor): Future[Boolean] = {
    try{
      GlanceFloor.collection.remove(Json.obj("glanceOrgId" ->floor.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID->floor.campusId,ComUtils.CONST_PROPERTY_BUILDINGID ->floor.buildingId,ComUtils.CONST_PROPERTY_FLOORID->floor.floorId)).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully deleted: "+floor.glanceOrgId +" glanceUserId:"+floor.glanceUserId +" campusId:"+floor.campusId+" buildingId:"+floor.buildingId+" floorId:"+floor.floorId)
          true
        case _ =>
          Logger.error("Failed to delete: "+floor.glanceOrgId +" glanceUserId:"+floor.glanceUserId +" campusId:"+floor.campusId+" buildingId:"+floor.buildingId+" floorId:"+floor.floorId)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete glance floor,floorId:{}, exception:{}",floor.floorId,exp.getMessage)
        Future{false}
    }
  }

  def readAllFloors(glanceOrgId:String,glanceUserId:String):Future[List[GlanceFloor]] ={
    val findByOrgUserId  = (org: String) => {
      try{
        GlanceFloor.collection.find(Json.obj("glanceOrgId" -> org)).cursor[GlanceFloor].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read glance floor,orgId:{}, exception:{}",glanceOrgId,exp.getMessage)
          Future{List()}
      }
    };
    findByOrgUserId(glanceOrgId)
  }

  def readFloor(glanceOrgId:String,glanceUserId:String,campusId:String,buildingId:String,floorId:String):Future[Option[GlanceFloor]] ={
    val findByName  = (org: String,user:String,cid:String,bid:String,fid:String) => {
      try{
        GlanceFloor.collection.find(Json.obj("glanceOrgId" -> org,"glanceUserId" -> user,ComUtils.CONST_PROPERTY_CAMPUSID -> cid,ComUtils.CONST_PROPERTY_BUILDINGID ->bid,ComUtils.CONST_PROPERTY_FLOORID ->fid)).one[GlanceFloor]
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read glance floor,orgId:{},campusId:{},buildingId:{}, exception:{}",glanceOrgId,campusId,buildingId,exp.getMessage)
          Future{None}
      }
    };
    findByName(glanceOrgId,glanceUserId,campusId,buildingId,floorId)
  }
  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceFloor]](CACHE_NAME,null)
  }

  def updateGlanceFloorCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      for {
        listFloors <- readAllFloors(credential.glanceOrgId,credential.glanceUserId)
      } yield {
        if (listFloors == null || listFloors.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceFloor]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceFloor]](CACHE_NAME,listFloors)
        true
      }
    }
    if (bCheckExists) {
      val optFloors = GlanceSyncCache.getGlanceCache[List[GlanceFloor]](CACHE_NAME)
      if(optFloors.isDefined){
        Future {
          true
        }
      }else
        readAndSet
    } else {
      readAndSet
    }
  }

}
