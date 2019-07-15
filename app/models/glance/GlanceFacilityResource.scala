package models.glance

import models._
import com.fasterxml.jackson.annotation.JsonValue
import reactivemongo.play.json._
import play.api.libs.json.{Json, JsObject}
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import models.cmx.MapCoordinate
import services.cisco.database.GlanceDBService
import utils.ComUtils
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson._
import services.security.GlanceCredential
import scala.concurrent.Future
import models.cmx.Implicits._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._

/**
 * Created by kennych on 9/29/16.
 */
case class GlanceFacilityResource(_id: BSONObjectID = BSONObjectID.generate,
                                  glanceOrgId:String="",
                                  glanceUserId:String="",
                                  floorId:String,
                                  name:String,
                                  displayName:String="",
                                  imageCategory:String=GlanceFacilityResource.IMAGE_RESOURCE_FACILITY, //system,category???
                                  imageName:String="",
                                  facilityCoordinate:List[MapCoordinate]=List(),
                                  extraInfo:JsValue=Json.obj(),
                                  tags:List[String]=List(),
                                  created:Long=System.currentTimeMillis(),
                                  updated:Long=System.currentTimeMillis())


object GlanceFacilityResource {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceFacilityResource")

  val CACHE_NAME = "glanceFacilityResource"
  val IMAGE_RESOURCE_FACILITY = "facility"

  def getDefaultImageDisplayName(glanceImageResource: GlanceFacilityResource): String = {
    if (glanceImageResource.displayName == "")
      glanceImageResource.imageCategory + "_" + glanceImageResource.imageName
    else
      glanceImageResource.displayName
  }

  implicit val tolerantGlanceImageResourceReaders = new Reads[GlanceFacilityResource] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceFacilityResource(
          (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(ComUtils.getTenantUserId()),
          (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
          (js \ "name").as[String],
          (js \ "displayName").asOpt[String].getOrElse(""),
          (js \ "imageCategory").asOpt[String].getOrElse(IMAGE_RESOURCE_FACILITY),
          (js \ "imageName").asOpt[String].getOrElse(""),
          (js \ "facilityCoordinate").asOpt[List[MapCoordinate]].getOrElse(List()),
          (js \ "extraInfo").asOpt[JsValue].getOrElse(Json.obj()),
          (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val glanceImageResourceWrites = new Writes[GlanceFacilityResource] {
    def writes(z: GlanceFacilityResource): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        "name" -> z.name,
        ComUtils.CONST_PROPERTY_ID -> z.name, //name as id...
        "displayName" -> getDefaultImageDisplayName(z),
        "imageCategory" -> z.imageCategory,
        "imageName" -> z.imageName,
        "imagePath" -> JsString("/api/v1/image/facility/" + z.imageCategory + "/" + z.imageName),
        "facilityCoordinate" -> ComUtils.getJsonArray(z.facilityCoordinate.map(p => Json.toJson(p).as[JsObject])),
        "extraInfo" -> z.extraInfo,
        ComUtils.CONST_PROPERTY_TAGS -> ComUtils.getJsonArrayStr(z.tags),
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  val glanceImageResourceFormat = Format(tolerantGlanceImageResourceReaders, glanceImageResourceWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_IMAGERESOURCE_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(facilityResource: GlanceFacilityResource): Future[Boolean] = {
    collection.insert(facilityResource).map {
      case LastError(true, _, _, _, _, _, _) =>
        true
      case _ =>
        Logger.error("Failed to insert: " + Json.toJson(facilityResource))
        false
    }
  }

  def addOrUpdate(facilityResource: GlanceFacilityResource, bForce: Boolean = false): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> facilityResource.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> facilityResource.floorId, "name" -> facilityResource.name)
    val findExistCount = (existQuery: BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
      }catch {
        case exp:Throwable=>
          Logger.error("Failed to queury facilityResource count, exception:{}",exp.getMessage)
          Future{0}
      }
    }
    for {
      existCount <- findExistCount(query)
      bRet <- addOrUpdate(existCount, facilityResource, bForce)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,null)
        sendCacheSyncMessage(ComUtils.getCredential())
      }
      bRet
    }
  }

  def addOrUpdate(existCount: Int, facilityResource: GlanceFacilityResource, bForce: Boolean): Future[Boolean] = {
    if (existCount > 0) {
      update(facilityResource, bForce)
    } else {
      insert(facilityResource)
    }
  }

  def update(conf: GlanceFacilityResource, bForce: Boolean = false): Future[Boolean] = {
    def copySetValues(z: GlanceFacilityResource): JsValue = {
      var jsObj = Json.obj(
        "displayName" -> getDefaultImageDisplayName(z),
        "imageCategory" -> z.imageCategory,
        "imageName" -> z.imageName,
        "extraInfo" -> z.extraInfo,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      if (z.facilityCoordinate.length > 0) {
        jsObj += ("facilityCoordinate" -> ComUtils.getJsonArray(z.facilityCoordinate.map(p => Json.toJson(p).as[JsObject])))
      }
      jsObj
    }

    try{
      collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId, "name" -> conf.name),
        Json.obj("$set" -> copySetValues(conf))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          true
        case _ =>
          Logger.error("Failed to update:" + Json.toJson(conf))
          false
      }
    }catch {
      case exp:Throwable=>
        Logger.error("Failed to update facilityResource, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def readConf(credential: GlanceCredential, floorId: String, name: String): Future[Option[GlanceFacilityResource]] = {
    for {
      floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId, floorId)
      allFacilities <- readAll(credential)
    } yield {
      val fid = {
        if (floor == null)
          ""
        else
          floor.floorId
      }
      val matches = allFacilities.filter(p => p.floorId == fid && p.name == name)
      if (matches.length > 0)
        Some(matches(0))
      else
        None
    }
  }

  def deleteByFloorId(credential: GlanceCredential, floorId: String): Future[Boolean] = {
    try{
      collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete by floor: " + credential.glanceOrgId + " floorId:" + floorId)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete, glanceOrgId:{},floorId:{}", credential.glanceOrgId, floorId)
          false
      }.recover {
        case _ =>
          Logger.error("Failed to delete, glanceOrgId:{},floorId:{}, exception.", credential.glanceOrgId, floorId)
          false
      }
    }catch {
      case exp:Throwable=>
        Logger.error("Failed to remove facilityResource by floor:{}, exception:{}",floorId,exp.getMessage)
        Future{false}
    }
  }

  def deleteByFloor(credential: GlanceCredential, floorIdName: String): Future[Boolean] = {
    for {
      floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId, floorIdName)
      bDelete <- deleteByFloorId(credential, {
        if (floor != null)
          floor.floorId
        else
          floorIdName
      }
      )
    } yield {
      bDelete
    }
  }

  def deleteAll(credential: GlanceCredential): Future[Boolean] = {
    try{
      collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.info("Succeeded to delete all facility resource by glanceOrgId:{}", credential.glanceOrgId)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.info("Failed to delete all facility resource by glanceOrgId:{}", credential.glanceOrgId)
          false
      }.recover {
        case _ =>
          Logger.info("Failed to delete all facility resource by glanceOrgId:{}, exception.", credential.glanceOrgId)
          false
      }
    }catch {
      case exp:Throwable=>
        Logger.error("Failed to remove facilityResource, exception:{}",exp.getMessage)
        Future{false}
    }
  }


  def readAll(credential: GlanceCredential): Future[List[GlanceFacilityResource]] = {
    val findByOrgUserId = (org: String) => {
      try{
        collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> 1)).cursor[GlanceFacilityResource].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.info("Failed to read all facility resource by glanceOrgId:{}, exception:{}",credential.glanceOrgId,exp.getMessage)
          Future{List()}
      }

    };
    val optCaches = GlanceSyncCache.getGlanceCache[List[GlanceFacilityResource]](CACHE_NAME)
    if (optCaches.isDefined) {
      Future {
        optCaches.get
      }
    } else {
      findByOrgUserId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,{
            if(listObject.length>0)
              listObject
            else
              null
          }
          )
        listObject
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,List())
          List()
      }
    }
  }

  def readAllByFloorId(credential: GlanceCredential, floorId: String): Future[List[GlanceFacilityResource]] = {
    for {
      floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId, floorId)
      listAll <- readAll(credential)
    } yield {
      val fid = {
        if (floor != null)
          floor.floorId
        else if (floorId == "public")
          "" //only public set ""
        else
          floorId
      }
      listAll.filter(p => p.floorId == fid)
    }
  }

  def cleanCache(credential: GlanceCredential): Unit = {
    GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,null)
  }

  def updateCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {

    def readAndSet(): Future[Boolean] = {
      readAll(credential).map { caches =>
        if (caches == null || caches.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityResource]](CACHE_NAME,caches)
        true
      }
    }

    if (bCheckExists) {
      val optCaches = GlanceSyncCache.getGlanceCache[List[GlanceFacilityResource]](CACHE_NAME)
      if (!optCaches.isDefined)
        readAndSet
      else{
        Future {
          true
        }
      }
    }
    else {
      readAndSet
    }
  }
}