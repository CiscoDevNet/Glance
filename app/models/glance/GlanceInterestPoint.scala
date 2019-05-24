package models.glance

import java.util.UUID
import _root_.utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson._
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._
import scala.concurrent.Future

/**
 * Created by kennych on 6/27/16.
 */
case class GlanceInterestPoint(_id: BSONObjectID = BSONObjectID.generate,
                          glanceOrgId: String,
                          id:String,
                          category:String="area",
                          floorId:String="",
                          name:String="",
                          description:String="",
                          position:GlancePosition=new GlancePosition(0,0),
                          startTime: Long=System.currentTimeMillis(),
                          endTime:Long= System.currentTimeMillis(),
                          tags: List[String] = List(),
                          updated: Long = System.currentTimeMillis())

object GlanceInterestPoint {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceInterestPoints")
  val CACHE_NAME = "glanceInterestPoints"

  val glanceInterestPointReaders = new Reads[GlanceInterestPoint] {
    def reads(js: JsValue) = {
      Logger.info("GlanceInterestPoint: to be parsed:" + js.toString())

      JsSuccess(GlanceInterestPoint(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
        (js \ ComUtils.CONST_PROPERTY_ID).as[String],
        (js \ "category").asOpt[String].getOrElse("area"),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).as[String],
        (js \ "name").as[String],
        (js \ "description").asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_POSITION).as[GlancePosition],
        (js \ "startTime").asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ "endTime").asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceInterestPointWrites = new Writes[GlanceInterestPoint] {

    def writes(z: GlanceInterestPoint): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_ID -> z.id,
        ComUtils.CONST_PROPERTY_POSITION -> z.position,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        "name" -> z.name,
        "description" -> z.description,
        ComUtils.CONST_PROPERTY_POSITION -> z.position,
        "startTime" -> z.startTime,
        "endTime" -> z.endTime,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceInterestPointFormat = Format(glanceInterestPointReaders, glanceInterestPointWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_INTEREST_POINT_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(credential: GlanceCredential, interestPoint: GlanceInterestPoint): Future[Boolean] = {
    val updateFloor = interestPoint.copy(glanceOrgId = credential.glanceOrgId)
    GlanceInterestPoint.collection.insert(updateFloor).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert:  glanceOrg:" + interestPoint.glanceOrgId + " floorId:" + interestPoint.floorId + " with Interesting Point data" + Json.toJson(interestPoint).toString())
        true
      case _ =>
        Logger.error("Failed to insert:  glanceOrg:" + interestPoint.glanceOrgId + " floorId:" + interestPoint.floorId + " with Interesting Point data" + Json.toJson(interestPoint).toString())
        false
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, conf: GlanceInterestPoint): Future[Boolean] = {
    if (existCount > 0) {
      update(credential, conf)
    } else {
      insert(credential, conf)
    }
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceInterestPoint): Future[Boolean] = {
    if (conf == null) {
      Future {
        false
      }
    } else {
      def getQuery(floorInfo:GlanceTrackFloor):BSONDocument={
        BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorInfo.floorId,ComUtils.CONST_PROPERTY_ID -> conf.id)
      }
      val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceInterestPoint.collection.name, Some(existQuery)))
      for {
        floorInfo <-GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,conf.floorId)
        existCount <- {if(floorInfo==null) Future{0} else findExistCount(getQuery(floorInfo))}
        bRet <- {if(floorInfo==null) Future{false} else addOrUpdate(existCount, credential, conf.copy(floorId=floorInfo.floorId,glanceOrgId = credential.glanceOrgId))}
      } yield {
        if(bRet) {
          //clean the cache...
          GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
        }
        bRet
      }
    }
  }

  def update(credential: GlanceCredential, conf: GlanceInterestPoint): Future[Boolean] = {
    def copySetValues(z: GlanceInterestPoint): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        ComUtils.CONST_PROPERTY_ID -> z.id,
        "category" -> z.category,
        "name" -> z.name,
        "description" -> z.description,
        ComUtils.CONST_PROPERTY_POSITION -> z.position,
        "startTime" -> z.startTime,
        "endTime" -> z.endTime,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      Logger.debug("GlanceInterestPoint update:" + jsObj.toString())
      jsObj
    }

    GlanceInterestPoint.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId,ComUtils.CONST_PROPERTY_ID -> conf.name),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update GlanceTrackFloor: glanceOrgId" + conf.glanceOrgId + " floorId:" + conf.floorId + " with GlanceInterestPoint:" + Json.toJson(conf).toString())
        true
      case _ =>
        Logger.error("Succeeded to update GlanceTrackFloor: glanceOrgId" + conf.glanceOrgId + " floorId:" + conf.floorId + " with GlanceInterestPoint:" + Json.toJson(conf).toString())
        false
    }
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceInterestPoint]] = {
    val findByOrgId = (org: String) => GlanceInterestPoint.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> 1,"startTime" ->1)).cursor[GlanceInterestPoint].collect[List]();
    try{
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,listObject)
        listObject
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,null)
          List()
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to read Interest Points: glanceOrgId:{}",credential.glanceOrgId)
        Future{List()}
    }

  }

  def readAllByFloorIdName(credential: GlanceCredential,floorId:String): Future[List[GlanceInterestPoint]] = {
    def readByFloorId(fid:String):Future[List[GlanceInterestPoint]]={
      val findByOrgId = (org: String) => GlanceInterestPoint.collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_FLOORID -> floorId)).sort(Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> 1,"startTime" ->1)).cursor[GlanceInterestPoint].collect[List]();
      try{
        findByOrgId(credential.glanceOrgId).map { listObject =>
          listObject
        }.recover {
          case _ =>
            List()
        }
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read Interest Points: glanceOrgId:{},floorId:{}",credential.glanceOrgId,floorId)
          Future{List()}
      }

    }
    val optInterestPoints= GlanceSyncCache.getGlanceCache[List[GlanceInterestPoint]](CACHE_NAME)
    if(optInterestPoints.isDefined){
      val list = optInterestPoints.get.filter(p => p.floorId==floorId)
      if(list.length>=0)
        Future{list.sortWith((x1,x2) => x1.startTime >=x2.startTime)}
      else
        readByFloorId(floorId)
    }else{
      readByFloorId(floorId)
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,null)
  }

  def updateInterestPointCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAll(credential).map{listInterestPoints =>
        true
      }
    }
    if(bCheckExists){
      val optInterestPoints = GlanceSyncCache.getGlanceCache[List[GlanceInterestPoint]](CACHE_NAME)
      if(optInterestPoints.isDefined){
        Future{true}
      }else{
        readAndSet
      }
    }else{
      readAndSet
    }
  }

  def delete(credential: GlanceCredential, interestPointId:String): Future[Boolean] = {
    GlanceInterestPoint.collection.remove(Json.obj("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> interestPointId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.error("Succeeded to delete interest point: glanceOrgId:{},interestPointId:{}",credential.glanceOrgId,interestPointId)
        GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete interest point: glanceOrgId:{},interestPointId:{}",credential.glanceOrgId,interestPointId)
        false
    }.recover{
      case _ =>
        Logger.error("Failed to delete interest point: glanceOrgId:{},interestPointId:{},exception.",credential.glanceOrgId,interestPointId)
        false
    }
  }

  def deleteByFloorId(credential: GlanceCredential, floorId:String): Future[Boolean] = {
    GlanceInterestPoint.collection.remove(Json.obj("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete interest point,glanceOrgId:{},floorId:{}",credential.glanceOrgId,floorId)
        GlanceSyncCache.setGlanceCache[List[GlanceInterestPoint]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.debug("Failed to delete interest point,glanceOrgId:{},floorId:{}",credential.glanceOrgId,floorId)
        false
    }.recover{
      case _ =>
        Logger.debug("Failed to delete interest point,glanceOrgId:{},floorId:{},exception.",credential.glanceOrgId,floorId)
        false
    }
  }
}