package models.glance.mapzone

import models._
import models.glance.GlanceZone
import play.Logger
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import utils.ComUtils
import scala.concurrent.Future
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global


/**
 * Created by kennych on 12/1/15.
 */
case class GlanceThing (_id: BSONObjectID = BSONObjectID.generate,
                        glanceOrgId:String,
                        glanceUserId:String,
                        zoneId: String,
                        thingId:String,
                        thingName:String,
                        tags: List[String],
                        created: Long,
                        updated: Long)


object GlanceThing {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("GlanceThing")

  val tolerantGlanceReaders = new Reads[GlanceThing] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceThing(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(""),
        (js \ "zoneId").asOpt[String].getOrElse(""),
        (js \ "thingId").asOpt[String].getOrElse(""),
        (js \ "thingName").asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceThing] {
    def writes(z: GlanceThing): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID ->z.glanceUserId,
        "zoneId" -> z.zoneId,
        "thingId" -> z.thingId,
        "thingName" -> z.thingName,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGlanceReaders, glanceWrites)

  def insert(thing: GlanceThing) :Future[Boolean]= {
    GlanceThing.collection.insert(thing).map{
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.info("Successfully insert: "+thing.glanceOrgId+" glanceUserId:"+thing.glanceUserId+" zoneId:"+thing.zoneId+"with thingId:"+thing.thingId +" thingName:"+thing.thingName)
        true
      case _ =>
        Logger.error("Failed to insert thing object")
        false
    }

  }

  def addOrUpdate(thing:GlanceThing):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> thing.glanceOrgId,"glanceUserId" ->thing.glanceUserId,"zoneId" -> thing.zoneId,"thingId" ->thing.thingId)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceThing.collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,thing)
    }yield bRet
  }

  def addOrUpdate(existCount:Int,thing:GlanceThing):Future[Boolean] ={
    if(existCount >0) {
      update(thing)
    }else{
      insert(thing)
    }
  }

  def update(thing:GlanceThing):Future[Boolean] = {
    GlanceZone.collection.update(Json.obj("glanceOrgId" ->thing.glanceOrgId,"zoneId" -> thing.zoneId,"thingId" ->thing.thingId),
      Json.obj("$set" -> Json.obj("thingName" -> thing.thingName,ComUtils.CONST_PROPERTY_TAGS -> thing.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Successfully updated: glanceOrgId"+thing.glanceOrgId+" zoneId:"+thing.zoneId+" thingId:"+thing.thingId+ " with thingName:"+thing.thingName)
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId"+thing.glanceOrgId+" zoneId:"+thing.zoneId+" thingId:"+thing.thingId+ " with thingName:"+thing.thingName)
        false
    }
  }

  def delete(thing:GlanceThing): Future[Boolean] = {
    GlanceZone.collection.remove(Json.obj("glanceOrgId" ->thing.glanceOrgId,"zoneId"->thing.zoneId,"thingId" ->thing.thingId)).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Successfully deleted: "+thing.glanceOrgId +" glanceUserId:"+thing.glanceUserId +" zoneId:"+thing.zoneId+" thingId:"+thing.thingId)
        true
      case _ =>
        Logger.error("Failed to delete: "+thing.glanceOrgId +" glanceUserId:"+thing.glanceUserId +" zoneId:"+thing.zoneId+" thingId:"+thing.thingId)
        false
    }
  }

  def readAllThings(glanceOrgId:String,glanceUserId:String):Future[List[GlanceThing]] ={
    val findByOrgUserId  = (org: String) => GlanceZone.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj("zoneId" -> 1)).cursor[GlanceThing].collect[List]();
    findByOrgUserId(glanceOrgId)
  }

  def readThing(glanceOrgId:String,glanceUserId:String,zoneId:String,thingId:String):Future[Option[GlanceThing]] ={
    val findByName  = (org: String,zid:String,tid:String) => GlanceZone.collection.find(Json.obj("glanceOrgId" -> org,"zoneId" -> zid,"thingId" ->tid)).one[GlanceThing];
    findByName(glanceOrgId,zoneId,thingId)
  }
}