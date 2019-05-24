package models.glance

import java.util.UUID
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import play.api.libs.json._
import play.api.libs.functional.syntax._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.collection.mutable
import scala.concurrent.{Future, Promise}

/**
 * Created by kennych on 1/20/16.
 */
case class GlanceCampusConf(nameSpace: String = ComUtils.getTenantOrgId(),
                            buildings: List[String] = List())

case class GlanceTrackCampus(_id: BSONObjectID = BSONObjectID.generate,
                             glanceOrgId: String = ComUtils.getTenantOrgId(),
                             campusId: String = UUID.randomUUID().toString(),
                             campusName: String = "",
                             hierarchy: String = "",
                             mapName: String = "",
                             campusInfo: JsObject = Json.obj(), //point to cmx Building info...
                             campusConf: GlanceCampusConf = new GlanceCampusConf(),
                             enable: Boolean = true,
                             tags: List[String] = List(),
                             updated: Long = System.currentTimeMillis())

object GlanceTrackCampus {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceTrackCampus")
  val CACHE_NAME = "glanceTrackCampus"

  val glanceCampusConfReaders: Reads[GlanceCampusConf] = (
      (__ \ "nameSpace").read[String] and
      (__ \ ComUtils.CONST_PROPERTY_BUILDINGS).read[List[String]]
    )(GlanceCampusConf.apply _)

  implicit val glanceCampusConfWrites = new Writes[GlanceCampusConf] {
    def writes(z: GlanceCampusConf): JsValue = {
      Json.obj(
        "nameSpace" -> z.nameSpace,
        ComUtils.CONST_PROPERTY_BUILDINGS -> z.buildings
      )
    }
  }

  implicit val glanceCampusConfFormat = Format(glanceCampusConfReaders, glanceCampusConfWrites)

  val tolerantGlanceTrackCampusReaders = new Reads[GlanceTrackCampus] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceTrackCampus(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).as[String],
        (js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse(UUID.randomUUID().toString()),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_HIERARCHY).as[String],
        (js \ ComUtils.CONST_PROPERTY_MAPNAME).as[String],
        (js \ ComUtils.CONST_PROPERTY_CAMPUSINFO).asOpt[JsObject].getOrElse(Json.obj()),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSCONF).asOpt[GlanceCampusConf].getOrElse(new GlanceCampusConf()),
        (js \ ComUtils.CONST_PROPERTY_ENABLE).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceTrackCampusWrites = new Writes[GlanceTrackCampus] {
    def writes(z: GlanceTrackCampus): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_CAMPUSID -> z.campusId,
        ComUtils.CONST_PROPERTY_CAMPUSNAME -> z.campusName,
        ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        ComUtils.CONST_PROPERTY_CAMPUSINFO -> z.campusInfo,
        ComUtils.CONST_PROPERTY_CAMPUSCONF -> Json.toJson(z.campusConf),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceTrackCampusFormat = Format(tolerantGlanceTrackCampusReaders, glanceTrackCampusWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_CAMPUSES_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceTrackCampus]] = {
    val optTrackCampuses = GlanceSyncCache.getGlanceCache[List[GlanceTrackCampus]](CACHE_NAME)
    if(optTrackCampuses.isDefined) {
      Future { optTrackCampuses.get}
    }else{
      val findByOrgId = (org: String) => GlanceTrackCampus.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackCampus].collect[List]();
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,listObject)
        listObject
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
          List()
      }
    }
  }

  def readAllOfList(credential: GlanceCredential,campuses:List[String]): Future[List[GlanceTrackCampus]] = {
    def readByOrgWithFilters():Future[List[GlanceTrackCampus]]= {
      val findByOrgId = (org: String) => GlanceTrackCampus.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_CAMPUSID ->Json.obj("$in" ->campuses))).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackCampus].collect[List]();
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,listObject)
        listObject.filter(p => campuses.contains(p.campusId))
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
          List()
      }
    }
    val optTrackCampuses = GlanceSyncCache.getGlanceCache[List[GlanceTrackCampus]](CACHE_NAME)
    if(optTrackCampuses.isDefined) {
      val trackCampuses =optTrackCampuses.get
      val matchedList = trackCampuses.filter(p => campuses.contains(p.campusId))
      if (matchedList.length > 0)
        Future { matchedList }
      else {
        readByOrgWithFilters
      }
    }else{
      readByOrgWithFilters
    }
  }

  private def readAllCampusInfoMapList(credential: GlanceCredential,trackCampuses:List[GlanceTrackCampus]):Future[List[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]={
    val p = Promise[List[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]
    val f = p.future
    val campusInfoMapList:mutable.MutableList[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]=new mutable.MutableList[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]()
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      for(campus <- trackCampuses){
        readCampusBuildings(campus,credential).map{ campusInfo =>
          campusInfoMapList += (campus -> campusInfo)
          val count =completed.incrementAndGet()
          if(count>=trackCampuses.length)
            p.success(campusInfoMapList.toList)
        }.recover{
          case _=>
            Logger.error("Failed to read all info of campus:"+campus.campusId)
            val count =completed.incrementAndGet()
            if(count>=trackCampuses.length)
              p.success(campusInfoMapList.toList)
        }
      }
      if(trackCampuses.length<=0)
        p.success(List())
    }
    f.map{ campusesInfo =>
      campusesInfo
    }.recover{
      case _=>
        List()
    }
  }

  def readAllWithDetailOfList(credential: GlanceCredential,campuses:List[String]): Future[List[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]] = {

    for{
      trackCampuses <-readAllOfList(credential,campuses)
      allInfo <-readAllCampusInfoMapList(credential,trackCampuses)
    }yield{
      allInfo
    }
  }

  def readAllWithDetail(credential: GlanceCredential): Future[List[(GlanceTrackCampus,mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]] = {
      for{
        campuses <-readAll(credential)
        allInfo <- readAllCampusInfoMapList(credential,campuses)
      }yield{
          allInfo
      }
  }

  def addBuildingId(credential: GlanceCredential, campusId: String, buildingId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campusId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackCampus.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addBuildingId(existCount, credential, campusId, buildingId)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      }
      bRet
    }

  }

  def addBuildingId(existCount: Int, credential: GlanceCredential, campusId: String, buildingId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future {
        false
      }
    } else {
      GlanceTrackCampus.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campusId),
        Json.obj("$addToSet" -> Json.obj("campusConf.buildings" -> buildingId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to add building floor: OrgId:" + credential.glanceOrgId + " campus:" + campusId + " with buildingId:" + buildingId)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null) //clean cache and re-load...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to add building floor: OrgId:" + credential.glanceOrgId + " campus:" + campusId + " with buildingId:" + buildingId)
          false
      }
    }
  }

  def removeBuildingId(credential: GlanceCredential, campusId: String, buildingId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campusId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackCampus.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- removeBuildingId(existCount, credential, campusId, buildingId)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean the cache info....
      bRet
    }
  }

  def removeBuildingId(existCount: Int, credential: GlanceCredential, campusId: String, buildingId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future {
        false
      }
    } else {
      GlanceTrackCampus.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campusId),
        Json.obj("$pull" -> Json.obj("campusConf.buildings" -> buildingId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to remove building floor: OrgId:" + credential.glanceOrgId + " campus:" + campusId + " with buildingId:" + buildingId)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null) //clean to reload
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to remove building floor: OrgId:" + credential.glanceOrgId + " campus:" + campusId + " with buildingId:" + buildingId)
          false
      }
    }
  }


  //DB API
  def insert(credential: GlanceCredential, t: GlanceTrackCampus): Future[Boolean] = {
    val updateCampus = t.copy(glanceOrgId = credential.glanceOrgId)
    GlanceTrackCampus.collection.insert(updateCampus).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.info("Successfully insert tracking campus:  glanceOrg:" + t.glanceOrgId + " with campusData:" + Json.toJson(updateCampus).toString())
        true
      case _ =>
        Logger.info("Failed insert tracking campus:  glanceOrg:" + t.glanceOrgId + " with campusData:" + Json.toJson(updateCampus).toString())
        false
    }
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceTrackCampus): Future[Boolean] = {
    addOrUpdate(credential,conf,"")
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceTrackCampus,serverId:String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> conf.campusId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackCampus.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addOrUpdate(existCount, credential, conf)
      bUpdateServerCampus <-{
        if(bRet && serverId!="") {
          GlanceTenantServer.addCampusId(credential,serverId,conf.campusId)
        }
        else
          Future{false}
      }

    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean to reload
      if(bUpdateServerCampus){
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](GlanceTenantServer.CACHE_NAME,null)
        GlanceTenantServer.sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, conf: GlanceTrackCampus): Future[Boolean] = {

    if (existCount > 0) {
      update(credential, conf)
    } else {
      insert(credential, conf)
    }
  }

  def update(credential: GlanceCredential, conf: GlanceTrackCampus): Future[Boolean] = {
    def copySetValues(z: GlanceTrackCampus): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_CAMPUSNAME -> z.campusName,
        ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        ComUtils.CONST_PROPERTY_CAMPUSINFO -> z.campusInfo,
        ComUtils.CONST_PROPERTY_CAMPUSCONF -> Json.toJson(z.campusConf),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    GlanceTrackCampus.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> conf.campusId),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update GlanceTrackCampus: glanceOrgId" + conf.glanceOrgId + " withData:" + Json.toJson(conf).toString())
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null) //clean to reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update GlanceTrackCampus: glanceOrgId" + conf.glanceOrgId + " withData:" + Json.toJson(conf).toString())
        false
    }
  }

  def delete(credential: GlanceCredential, campusId: String): Future[Boolean] = {
    GlanceTrackCampus.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campusId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.info("Succeeded to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " campusId:" + campusId)
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null) //clean to reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " campusId:" + campusId)
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " campusId:" + campusId)
        false
    }
  }

  def deleteAllBuildings(credential: GlanceCredential,campusId:String):Future[Boolean]={
    def deleteSubItemsOfCampus(optTrackCampus:Option[GlanceTrackCampus]):Future[Boolean]={
      if(optTrackCampus.isEmpty) {
          Future{false}
      }else {
        val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
        val completed = new java.util.concurrent.atomic.AtomicLong()
        val p = Promise[List[Boolean]]
        val f = p.future
        Future {
          val buildings = optTrackCampus.get.campusConf.buildings
          for(buildingId <- buildings) {
            GlanceTrackBuilding.deleteWithAllFloors(credential,buildingId).map{ bRet =>
              results+= bRet
              val count =completed.incrementAndGet()
              if(count>= buildings.length)
                p.success(results.toList)

            }.recover{
              case _=>
                results+=false
                val count =completed.incrementAndGet()
                if(count>= buildings.length)
                  p.success(results.toList)
            }
          }
          if (buildings.length <= 0)
            p.success(results.toList)
        }
        f.map{ results =>
          val nFailed =results.filter(p => p!=true).length
          (results.length==0 || nFailed==0)
        }.recover{
          case _=>
            Logger.error("Failed to delete building and subitems' info!")
            false
        }
      }
    }
    for{
      optCampusInfo <- GlanceTrackCampus.readByCampusId(credential,campusId)
      bDeleteBuildings <- deleteSubItemsOfCampus(optCampusInfo)
    }yield {
        bDeleteBuildings
    }
  }

  def readByCampusId(credential: GlanceCredential, campusId: String): Future[Option[GlanceTrackCampus]] = {
    def findById(org: String, cid: String): Future[Option[GlanceTrackCampus]] = {
      val findByName = (org: String, cid: String) => GlanceTrackCampus.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org, ComUtils.CONST_PROPERTY_CAMPUSID -> cid)).one[GlanceTrackCampus];
      findByName(org, cid).map { info =>
        info
      }.recover {
        case _ =>
          None
      }
    }
    val optCampuses = GlanceSyncCache.getGlanceCache[List[GlanceTrackCampus]](CACHE_NAME)
    if(optCampuses.isDefined) {
      val campuses = optCampuses.get
      val list = campuses.filter(x => x.campusId == campusId)
      if (list.size > 0)
        Future { Some(list(0))}
      else
        findById(credential.glanceOrgId, campusId)
    }else{
        findById(credential.glanceOrgId, campusId)
    }
  }

  def readCampusBuildings(glanceTrackCampus: GlanceTrackCampus, credential: GlanceCredential): Future[mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]]] = {
    val p = Promise[mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]]]
    val f = p.future
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      val buildingFloorsMap: mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]] = new mutable.HashMap()
      if (glanceTrackCampus.campusConf.buildings.length == 0) {
        p.success(buildingFloorsMap)
      }
      else {
        for (cl <- 0 to (glanceTrackCampus.campusConf.buildings.length - 1)) {
          GlanceTrackBuilding.readBuildingWithFloors(credential, glanceTrackCampus.campusConf.buildings(cl)).map { tupValue: (GlanceTrackBuilding, List[GlanceTrackFloor]) =>
            buildingFloorsMap(tupValue._1) = tupValue._2
            val count =completed.incrementAndGet()
            if (count >= glanceTrackCampus.campusConf.buildings.length)
              p.success(buildingFloorsMap)
          }.recover {
            case _ =>
              val count =completed.incrementAndGet()
              if (count >= glanceTrackCampus.campusConf.buildings.length)
                p.success(buildingFloorsMap)
          }
        }
      }
    }

    f.map { buildingFloorsMap =>
      Logger.debug("readCampusBuildings :" + buildingFloorsMap.size)
      buildingFloorsMap
    }
  }

  private def readAllCampusBuildingInfo(optGlanceTrackCampus: Option[GlanceTrackCampus], credential: GlanceCredential): Future[mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]]] = {
    val buildingFloorsMap: mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]] = new mutable.HashMap()
    if(optGlanceTrackCampus.isDefined) {
      readCampusBuildings(optGlanceTrackCampus.get, credential)
    }else{
        Future {buildingFloorsMap}
    }
  }

  def readCampusWithBuildingsWithFloors(credential: GlanceCredential, campusId: String): Future[(GlanceTrackCampus, List[GlanceTrackBuilding], mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])] = {
    if (campusId == "") {
      Future {(null, List(), null)}
    } else {
      for {
        optCampus <- readByCampusId(credential, campusId)
        floorsMap <- readAllCampusBuildingInfo(optCampus, credential)
      } yield {
        (optCampus.getOrElse(null), floorsMap.keys.toList, floorsMap)
      }
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
  }

  def updateTrackCampusCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAll(credential).map{listCampuses =>
        if(listCampuses==null || listCampuses.size<=0)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](CACHE_NAME,listCampuses)
        true
      }
    }
    if(bCheckExists){
      val optCampuses =GlanceSyncCache.getGlanceCache[List[GlanceTrackCampus]](CACHE_NAME)
      if(optCampuses.isDefined) {
        Future { true }
      }else{
        readAndSet
      }
    }else{
      readAndSet
    }
  }

  def updateBuildingSizeOfFloor(credential:GlanceCredential,campusId:String,floorId:String):Future[Boolean] ={
    def readBuildingFloorMapOfCampus_inline(optTrackCampus:Option[GlanceTrackCampus]):Future[(GlanceTrackBuilding,List[String])]= {
      if (!optTrackCampus.isDefined)
        Future {
          (null, List())
        }
      else {
        val p = Promise[(GlanceTrackBuilding, List[String])]
        val f = p.future
        val nCompleted = new java.util.concurrent.atomic.AtomicLong()
        Future {
          val buildingIds = optTrackCampus.get.campusConf.buildings
          for (buildingId <- buildingIds) {
            GlanceTrackBuilding.readByBuildingId(credential, buildingId).map { optBuilding =>
              val count = nCompleted.incrementAndGet()
              if (optBuilding.isDefined && optBuilding.get.buildingConf.floors.indexOf(floorId) >= 0)
                p.success((optBuilding.get, optBuilding.get.buildingConf.floors))
              else if (count >= buildingIds.length)
                p.success((null, List()))
            }.recover {
              case _ =>
                val count = nCompleted.incrementAndGet()
                if (count >= buildingIds.length)
                  p.success((null, List()))
            }
          }
          if (buildingIds.length == 0)
            p.success((null, List()))
        }
        f.map { bf =>
          bf
        }.recover {
          case _ =>
            (null, List())
        }
      }
    }
    def readMapNamesOfFloors_inline(floors:List[String]):Future[List[String]]={
      val p = Promise[List[String]]
      val names:mutable.MutableList[String] =new mutable.MutableList[String]()
      val f = p.future
      val nCompleted=new java.util.concurrent.atomic.AtomicLong()
      Future{
        for(floorId <- floors)
        {
          GlanceTrackFloor.readByFloorId(credential,floorId).map { optFloor =>
            if(optFloor.isDefined)
              names += optFloor.get.mapName
            val count =nCompleted.incrementAndGet()
            if(count == floors.length)
              p.success(names.toList)
          }.recover {
            case _=>
              val count =nCompleted.incrementAndGet()
              if(count == floors.length)
                p.success(names.toList)
          }
        }
        if(floors.length==0)
          p.success(List())
      }
      f.map{ names =>
        names.map(x => x.trim).filter( p => p.length!=0)
      }.recover{
        case _=>
          List()
      }
    }

    for{
      optTrackCampus <- GlanceTrackCampus.readByCampusId(credential,campusId)
      (building:GlanceTrackBuilding,floors:List[String]) <- readBuildingFloorMapOfCampus_inline(optTrackCampus)
      mapNames <-{
        if(building==null || floors.length<=0)
          Future{List()}
        else
          readMapNamesOfFloors_inline(floors)
      }
      maxWidth  <- GlanceMapSizeInfo.readMaxWidth(credential,mapNames)
      maxHeight <- GlanceMapSizeInfo.readMaxHeight(credential,mapNames)
      bUpdateBuildingInfo <- {
        if(building==null || mapNames.length<=0)
          Future{false}
        else{
          GlanceTrackBuilding.updateBuildingSizeInfo(credential,building.buildingId,maxWidth,maxHeight)
        }
      }
    }yield{
      bUpdateBuildingInfo
    }
  }

  def updateBuildingSizeForMapName(credential: GlanceCredential,mapName:String):Future[Boolean]={
    def updateSizeInfoOfBuildingsWhichContainFloors_inline(sysConf:GlanceSystemConf,floors:List[GlanceTrackFloor]):Future[Boolean]={
      val p=Promise[Boolean]
      var bStatus =false;
      val f=p.future
      val nCompleted = new java.util.concurrent.atomic.AtomicLong()
      Future{
        for(trackFloor <- floors){
          GlanceTrackCampus.updateBuildingSizeOfFloor(credential,sysConf.defaultTrackingCampus,trackFloor.floorId).map{ bSuccess =>
            bStatus ||= bSuccess
            val count =nCompleted.incrementAndGet()
            if(count== floors.length)
              p.success(bStatus)
          }.recover{
            case _=>
              Logger.error("Failed to updateBuildingSizeOfFloor for mapName:{}",mapName)
              val count =nCompleted.incrementAndGet()
              if(count==floors.length)
                p.success(bStatus)
          }

        }
        if(floors.length<=0)
          p.success(false)
      }

      f.map{ bSuccess =>
        bSuccess
      }.recover{
        case _=>
          Logger.error("Failed to update buildings size info by mapName:{}",mapName)
          false
      }
    }
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      floors  <- GlanceTrackFloor.readFloorsByMapName(credential.glanceOrgId,mapName)
      bUpdate <- updateSizeInfoOfBuildingsWhichContainFloors_inline(sysConf,floors)
    }yield{
        bUpdate
    }
  }

  def readDefaultCampusFloors(credential: GlanceCredential):Future[List[GlanceTrackFloor]]={
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      campus  <- {
        if(sysConf.defaultTrackingCampus=="")
          Future{None}
        else
          GlanceTrackCampus.readByCampusId(credential,sysConf.defaultTrackingCampus)
      }
      building <- {
        if(campus.isDefined && campus.get.campusConf.buildings.length>0){
          GlanceTrackBuilding.readByBuildingId(credential,campus.get.campusConf.buildings(0))
        }else{
          Future{None}
        }
      }
      floors <- {
        if(building.isDefined && building.get.buildingConf.floors.length>0)
        {
          GlanceTrackFloor.readAllOfBuilding(credential,building.get)
        }else{
          Future{List()}
        }
      }
    }yield{
       floors
    }
  }
}
