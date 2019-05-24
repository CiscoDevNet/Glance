package models.glance

import java.util.UUID
import _root_.utils.ComUtils
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
import scala.concurrent.{Promise, Future}

/**
 * Created by kennych on 1/19/16.
 */
case class GlanceBuildingConf(nameSpace: String = ComUtils.getTenantOrgId(),
                              floors: List[String] = List())

case class GlanceTrackBuilding(_id: BSONObjectID = BSONObjectID.generate,
                               glanceOrgId: String = ComUtils.getTenantOrgId(),
                               buildingId: String = UUID.randomUUID().toString(),
                               buildingName: String = "",
                               hierarchy: String = "",
                               mapName: String = "",
                               width: Long = 1757,
                               depth: Long = 861,
                               buildingInfo: JsObject = Json.obj(), //point to cmx Building info...
                               buildingConf: GlanceBuildingConf = new GlanceBuildingConf(),
                               position:GlancePositionEx=new GlancePositionEx(0,0),
                               enable: Boolean = true,
                               tags: List[String] = List(),
                               updated: Long = System.currentTimeMillis())

object GlanceTrackBuilding {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceTrackBuilding")
  val CACHE_NAME = "glanceTrackBuilding"

  val glanceBuildingConfReaders: Reads[GlanceBuildingConf] = (
      (__ \ "nameSpace").read[String] and
      (__ \ ComUtils.CONST_PROPERTY_FLOORS).read[List[String]]
    )(GlanceBuildingConf.apply _)

  implicit val glanceBuildingConfWrites = new Writes[GlanceBuildingConf] {
    def writes(z: GlanceBuildingConf): JsValue = {
      Json.obj(
        "nameSpace" -> z.nameSpace,
        ComUtils.CONST_PROPERTY_FLOORS -> z.floors
      )
    }
  }

  implicit val glanceBuildingConfFormat = Format(glanceBuildingConfReaders, glanceBuildingConfWrites)

  val tolerantGlanceTrackBuildingReaders = new Reads[GlanceTrackBuilding] {
    def reads(js: JsValue) = {
      def getPos():GlancePositionEx ={
        if((js \ ComUtils.CONST_PROPERTY_POSITION)!=null){
          val posArr:List[Long] ={
            try {
              (js \ ComUtils.CONST_PROPERTY_POSITION).as[Seq[Long]].toList
            }catch{
              case exp:Throwable =>
                List(0)
            }
          }
          val refId =(js \ "referenceId").asOpt[String].getOrElse("")
          val mapHierarchy=(js \ "mapHierarchy").asOpt[String].getOrElse("")
          if(posArr==null || posArr.size <2)
          {
            val pos =(js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[GlancePosition].getOrElse(new GlancePosition(0,0,mapHierarchy,refId))
            new GlancePositionEx(pos.x,pos.y,mapHierarchy,refId)
          }
          else
          {
            new GlancePositionEx(posArr(0),posArr(1),mapHierarchy,refId)
          }
        }else{
          val refId =(js \ "referenceId").asOpt[String].getOrElse("")
          val mapHierarchy=(js \ "mapHierarchy").asOpt[String].getOrElse("")
          new GlancePositionEx(x=0,y=0,mapHierarchy,refId)
        }
      }

      JsSuccess(GlanceTrackBuilding(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).as[String],
        (js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse(UUID.randomUUID().toString()),
        (js \ ComUtils.CONST_PROPERTY_BUILDINGNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_HIERARCHY).as[String],
        (js \ ComUtils.CONST_PROPERTY_MAPNAME).as[String],
        (js \ "width").asOpt[Long].getOrElse(1757),
        (js \ "depth").asOpt[Long].getOrElse(861),
        (js \ "buildingInfo").asOpt[JsObject].getOrElse(Json.obj()),
        (js \ "buildingConf").asOpt[GlanceBuildingConf].getOrElse(new GlanceBuildingConf()),
        getPos(),
        (js \ ComUtils.CONST_PROPERTY_ENABLE).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceTrackBuildingWrites = new Writes[GlanceTrackBuilding] {
    def writes(z: GlanceTrackBuilding): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_BUILDINGID -> z.buildingId,
        ComUtils.CONST_PROPERTY_BUILDINGNAME -> z.buildingName,
        ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "width" -> z.width,
        "depth" -> z.depth,
        "buildingInfo" -> z.buildingInfo,
        "buildingConf" -> Json.toJson(z.buildingConf),
        ComUtils.CONST_PROPERTY_POSITION -> Json.toJson(z.position),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceTrackBuildingFormat = Format(tolerantGlanceTrackBuildingReaders, glanceTrackBuildingWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_BUILDINGS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceTrackBuilding]] = {
    val optTrackBuildings = GlanceSyncCache.getGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME)
    if(optTrackBuildings.isDefined) {
      Future {optTrackBuildings.get}
    }else{
      val findByOrgId = (org: String) => GlanceTrackBuilding.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackBuilding].collect[List]();
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,listObject)
        listObject
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null)
          List()
      }
    }
  }

  def addFloorInfo(credential: GlanceCredential, buildingId: String, floorId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackBuilding.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addFloorInfo(existCount, credential, buildingId, floorId)
    } yield {
      if (bRet){
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null) //clean and reload
        sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addFloorInfo(existCount: Int, credential: GlanceCredential, buildingId: String, floorId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future {false}
    } else {
      GlanceTrackBuilding.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId),
        Json.obj("$addToSet" -> Json.obj("buildingConf.floors" -> floorId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to add building floor: OrgId:" + credential.glanceOrgId + " buildingId:" + buildingId + " with floorId:" + floorId)
          true
        case _ =>
          Logger.error("Failed to add building floor: OrgId:" + credential.glanceOrgId + " buildingId:" + buildingId + " with floorId:" + floorId)
          false
      }
    }
  }

  def removeFloorInfo(credential: GlanceCredential, buildingId: String, floorId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackBuilding.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- removeFloorInfo(existCount, credential, buildingId, floorId)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean and reload
      bRet
    }

  }

  def removeFloorInfo(existCount: Int, credential: GlanceCredential, buildingId: String, floorId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future { false}
    } else {
      GlanceTrackBuilding.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId),
        Json.obj("$pull" -> Json.obj("buildingConf.floors" -> floorId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to remove building floor: OrgId:" + credential.glanceOrgId + " buildingId:" + buildingId + " with floorId:" + floorId)
          true
        case _ =>
          Logger.error("Failed to remove building floor: OrgId:" + credential.glanceOrgId + " buildingId:" + buildingId + " with floorId:" + floorId)
          false
      }
    }
  }

  def insert(credential: GlanceCredential, t: GlanceTrackBuilding): Future[Boolean] = {
    val updateBuilding = t.copy(glanceOrgId = credential.glanceOrgId)
    GlanceTrackBuilding.collection.insert(updateBuilding).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert tracking build:  glanceOrg:" + t.glanceOrgId + " with buildingData:" + Json.toJson(updateBuilding).toString())
        true
      case _ =>
        Logger.error("Failed insert tracking build:  glanceOrg:" + t.glanceOrgId + " with buildingData:" + Json.toJson(updateBuilding).toString())
        false
    }
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceTrackBuilding): Future[Boolean] = {
    addOrUpdate(credential,conf,"")
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceTrackBuilding,campusId:String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> conf.buildingId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackBuilding.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addOrUpdate(existCount, credential, conf)
      bUpdateBuilding <-{
        if(campusId=="")
          Future{false}
        else
          GlanceTrackCampus.addBuildingId(credential,campusId,conf.buildingId)
      }
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean and reload
      if(bUpdateBuilding){
        //sync the campus info...
        GlanceSyncCache.setGlanceCache[List[GlanceTrackCampus]](GlanceTrackCampus.CACHE_NAME,null)
        GlanceTrackCampus.sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, conf: GlanceTrackBuilding): Future[Boolean] = {

    if (existCount > 0) {
      update(credential, conf)
    } else {
      insert(credential, conf)
    }
  }


  def update(credential: GlanceCredential, conf: GlanceTrackBuilding): Future[Boolean] = {
    def copySetValues(z: GlanceTrackBuilding): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_BUILDINGNAME -> z.buildingName,
        ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "buildingInfo" -> z.buildingInfo,
        "buildingConf" -> Json.toJson(z.buildingConf),
        "width" -> JsNumber(z.width),
        "depth"->JsNumber(z.depth),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    GlanceTrackBuilding.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> conf.buildingId),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update GlanceTrackBuilding: glanceOrgId" + conf.glanceOrgId + " withData:" + Json.toJson(conf).toString())
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null) //clean and reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update GlanceTrackBuilding: glanceOrgId" + conf.glanceOrgId + " withData:" + Json.toJson(conf).toString())
        false
    }
  }

  def delete(credential: GlanceCredential, buildingId: String): Future[Boolean] = {
    GlanceTrackBuilding.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " buildingId:" + buildingId)
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null) //clean and reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " buildingId:" + buildingId)
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " buildingId:" + buildingId)
        false
    }
  }

  def deleteWithAllFloors(credential: GlanceCredential, buildingId: String):Future[Boolean]={
    def deleteFloorsOfBuilding_inline(optBuildingInfo:Option[GlanceTrackBuilding]):Future[Boolean]={
      val p = Promise[List[Boolean]]
      val f = p.future
      Future {
        val completed = new java.util.concurrent.atomic.AtomicLong()
        val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
        val floors:List[String] ={
          if(optBuildingInfo.isDefined)
            optBuildingInfo.get.buildingConf.floors
          else
            List()
        }
        for(floorId <- floors){
          GlanceTrackFloor.delete(credential,floorId).map{ bRet =>
            results += bRet
            val count =completed.incrementAndGet()
            if(count>=floors.length)
              p.success(results.toList)
          }.recover{
            case _=>
              results+= false
              val count =completed.incrementAndGet()
              if(count>=floors.length)
                p.success(results.toList)
          }
        }
        if(floors.length<=0)
          p.success(List())
      }

      f.map{ bResults =>
        val nFailed =bResults.filter(p => p!=true)
        if(nFailed ==0 || bResults.length<=0)
          true
        else
          false
      }.recover{
        case _=>
          false
      }
    }
    for{
      buildingInfo <-readByBuildingId(credential,buildingId)
      bDelete <-{
        if(buildingInfo.isDefined)
          delete(credential,buildingId)
        else
          Future{true}
      }
      bDeleteFloors <- deleteFloorsOfBuilding_inline(buildingInfo)
    }yield {
      bDelete && bDeleteFloors
    }

  }

  def readByBuildingId(credential: GlanceCredential, buildingId: String): Future[Option[GlanceTrackBuilding]] = {
    def readById(org: String, bid: String): Future[Option[GlanceTrackBuilding]] = {
      val findByName = (org: String, bid: String) => GlanceTrackBuilding.collection.find(Json.obj("glanceOrgId" -> org, ComUtils.CONST_PROPERTY_BUILDINGID -> bid)).one[GlanceTrackBuilding];
      findByName(org, bid).map { info =>
        info
      }.recover {
        case _ =>
          None
      }
    }
    val optBuildings = GlanceSyncCache.getGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME)
    optBuildings match {
      case Some(buildings) =>
        val list = buildings.filter(x => x.buildingId == buildingId)
        if (list.size > 0) Future {
          Some(list(0))
        }
        else
          readById(credential.glanceOrgId, buildingId)
      case _ =>
        readById(credential.glanceOrgId, buildingId)
    }
  }

  def readBuildingWithFloors(credential: GlanceCredential, buildingId: String): Future[(GlanceTrackBuilding, List[GlanceTrackFloor])] = {
    for {
      optBuilding <- readByBuildingId(credential, buildingId)
      floors <- {
        if(optBuilding.isEmpty) {
          Future { List() }
        }else {
          GlanceTrackFloor.readAllOfBuilding(credential, optBuilding.get)
        }
      }
    } yield {
      (optBuilding.getOrElse(null), floors)
    }
  }

  def readBuildingIdByFloorId(credential: GlanceCredential,floorId:String):Future[String]={
    readAll(credential).map{buildings=>
      var matchBuildingId:String =""
      if(buildings.length>0){
        for(cl <-0 to buildings.length-1){
          if(buildings(cl).buildingConf.floors.contains(floorId))
            matchBuildingId=buildings(cl).buildingId
        }
      }
      matchBuildingId
    }
  }

  def findMatchBuildingIdByFloorId(buildings:List[GlanceTrackBuilding],floorId:String):String={
    var matchBid:String=""
    if (floorId =="")
      return matchBid
    for(building <- buildings)
    {
      if(building.buildingConf.floors.contains(floorId))
        matchBid= building.buildingId
    }
    matchBid
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null)
  }

  def updateTrackBuildingCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      readAll(credential).map{ listBuildings =>
        if (listBuildings == null || listBuildings.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,listBuildings)
        true
      }
    }
    if (bCheckExists) {
      val optBuildings = GlanceSyncCache.getGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME)
      if(optBuildings.isDefined) {
        Future { true }
      }else
        readAndSet
    } else {
      readAndSet
    }
  }

  def updateBuildingSizeInfo(credential: GlanceCredential,buildingId:String,maxWidth:Double,maxHeight:Double):Future[Boolean]={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID  -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceTrackBuilding.collection.name, Some(existQuery)))
    def updateWidthAndHeight():Future[Boolean]={
      GlanceTrackBuilding.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID  -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId),
        Json.obj("$set" -> Json.obj("width"-> maxWidth,"depth"-> maxHeight))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to update GlanceTrackBuilding: glanceOrgId" + credential.glanceOrgId +" building:"+buildingId+ " maxWidth:" + maxWidth +" maxHeight:"+maxHeight)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](CACHE_NAME,null) //clean and reload
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to update GlanceTrackBuilding: glanceOrgId" + credential.glanceOrgId +" building:"+buildingId+ " maxWidth:" + maxWidth +" maxHeight:"+maxHeight)
          false
      }
    }

    for {
      existCount <- findExistCount(query)
      bUpdate <- {
        if(existCount<=0)
          Future{false}
        else{
          updateWidthAndHeight()
        }
      }
    }yield{
      bUpdate
    }
  }
}
