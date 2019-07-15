package models.glance

import java.util.UUID
import utils.ComUtils
import controllers.amqp.GlanceSyncCache
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
import scala.collection.mutable
import scala.collection.mutable.HashMap
import scala.concurrent.Future
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.cache.Cache

/**
 * Created by kennych on 1/8/16.
 */
case class GlanceScreenToTrackFloor(_id: BSONObjectID = BSONObjectID.generate,
                                    glanceOrgId: String,
                                    screenId: String = UUID.randomUUID().toString(),
                                    floorId: String,
                                    matchIPAddress: Boolean = false, //if true match
                                    clientAddress: String,
                                    screenPosition: GlancePosition = new GlancePosition(1757, 861),
                                    showAllDevicesOnScreen: Boolean = false,
                                    enable: Boolean = true,
                                    tags: List[String] = List(),
                                    updated: Long = System.currentTimeMillis())

object GlanceScreenToTrackFloor {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceScreenToTrackFloor")

  val CACHE_NAME="glanceScreenToTrackFloor"
  val glanceScreenToTrackFloorReaders = new Reads[GlanceScreenToTrackFloor] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceScreenToTrackFloor(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ "screenId").asOpt[String].getOrElse(UUID.randomUUID().toString()),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).as[String],
        checkIsMatchIPAddress((js \ "clientAddress").as[String]),
        (js \ "clientAddress").as[String],
        (js \ "screenPosition").asOpt[GlancePosition].getOrElse(new GlancePosition(1757, 861)),
        (js \ ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN).asOpt[Boolean].getOrElse(false),
        (js \ ComUtils.CONST_PROPERTY_ENABLE).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  def checkIsMatchIPAddress(clientAddress: String): Boolean = {
    //check is IP4 or IP6
    if (clientAddress.contains('.') && clientAddress.split("\\.").length == 4)
      return true
    else {
      if (clientAddress.contains(':') && !clientAddress.contains("::") && clientAddress.split(":").length == 6)
        return false //macAddress
      else
        return true
    }
  }

  implicit val glanceScreenToTrackFloorWrites = new Writes[GlanceScreenToTrackFloor] {

    def writes(z: GlanceScreenToTrackFloor): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        "screenId" -> z.screenId,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        "matchIPAddress" -> checkIsMatchIPAddress(z.clientAddress),
        "clientAddress" -> z.clientAddress,
        "screenPosition" -> Json.toJson(z.screenPosition),
        ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN -> z.showAllDevicesOnScreen,
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceScreenToTrackFloorFormat = Format(glanceScreenToTrackFloorReaders, glanceScreenToTrackFloorWrites)

  def insert(credential: GlanceCredential, screenToFloor: GlanceScreenToTrackFloor): Future[Boolean] = {
    val updateFloor = screenToFloor.copy(glanceOrgId = credential.glanceOrgId)
    try{
      GlanceScreenToTrackFloor.collection.insert(updateFloor).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to insert:  glanceOrg:" + screenToFloor.glanceOrgId + " floorId:" + screenToFloor.floorId + "with address:" + screenToFloor.clientAddress)
          true
        case _ =>
          Logger.error("Failed  to insert:  glanceOrg:" + screenToFloor.glanceOrgId + " floorId:" + screenToFloor.floorId + "with address:" + screenToFloor.clientAddress)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert  screen to floor mapping,exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def updateCacheInfo(screenId: String, clientAddress: String, screenToTrackFloor: GlanceScreenToTrackFloor): Boolean = {
    def setScreenTrackFloorMap(optFloorMap: Option[HashMap[String, GlanceScreenToTrackFloor]], screenId: String, screenFloor: GlanceScreenToTrackFloor): HashMap[String, GlanceScreenToTrackFloor] = {
      if (optFloorMap.isDefined){
        optFloorMap.get(screenId) = screenFloor
        return optFloorMap.get
      }else{
        val floorMap = new HashMap[String, GlanceScreenToTrackFloor]()
        return floorMap
      }
    }

    val optScreenIdClientAddressMap = Cache.getAs[mutable.HashMap[String,String]](GlanceSyncCache.getCacheName(GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR_MAP))
    val optScreenTrackFloorMap = Cache.getAs[mutable.HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.getCacheName(GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR))

    if (optScreenIdClientAddressMap.isEmpty){
      return false
    }
    val idClientAddressMap = optScreenIdClientAddressMap.get
    var bFind: Boolean = false
    var screenIdFound: String = ""
    for(f: (String, String) <- idClientAddressMap){
      if (f._1 == screenId || f._2 == clientAddress) {
        screenIdFound = f._1
        bFind = true
      }
    }
    if (!bFind) {
      if (screenToTrackFloor != null) {
        idClientAddressMap += (screenId -> clientAddress)
      }
      return true
    }

    idClientAddressMap -= screenIdFound
    if (screenToTrackFloor != null) {
      if (screenId == "" || screenIdFound != screenId) {
        idClientAddressMap += (screenIdFound -> clientAddress)
        glanceScreenTrackFloorSetCache(setScreenTrackFloorMap(optScreenTrackFloorMap, screenIdFound, screenToTrackFloor).values.toList)
      }else {
        idClientAddressMap += (screenId -> clientAddress)
        glanceScreenTrackFloorSetCache(setScreenTrackFloorMap(optScreenTrackFloorMap, screenId, screenToTrackFloor).values.toList)
      }
    }
    true
  }

  def glanceScreenTrackFloorFromCache(): List[GlanceScreenToTrackFloor] = {
    val optList = Cache.getAs[mutable.HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.getCacheName(GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR))
    try {
      if (optList.isDefined){
        return optList.get.values.toList
      }else{
        return List[GlanceScreenToTrackFloor]()
      }
    } catch {
      case ex: Throwable =>
        return List[GlanceScreenToTrackFloor]()
    }
  }

  def glanceScreenTrackFloorSetCache(glanceScreenTrackFloors: List[GlanceScreenToTrackFloor]): Boolean = {
    try {
      if (glanceScreenTrackFloors == null || glanceScreenTrackFloors.size == 0) {
        GlanceSyncCache.setGlanceCache[HashMap[String,String]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR_MAP,null)
        GlanceSyncCache.setGlanceCache[HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR,null)
      } else {
        var screenIdClientAddressMap: HashMap[String, String] = new HashMap[String, String]()
        var screenIdScreenInfoMap: HashMap[String, GlanceScreenToTrackFloor] = new HashMap[String, GlanceScreenToTrackFloor]()
        for ( f: GlanceScreenToTrackFloor <- glanceScreenTrackFloors){
          screenIdClientAddressMap += (f.screenId -> f.clientAddress);
          screenIdScreenInfoMap += (f.screenId -> f)
        }
        GlanceSyncCache.setGlanceCache[HashMap[String,String]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR_MAP,screenIdClientAddressMap)
        GlanceSyncCache.setGlanceCache[HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR,screenIdScreenInfoMap)
      }
      true
    } catch {
      case ex: Exception =>
        Logger.error("Failed to read all screen track floors info from cache, exception:{}", ex.getMessage())
        false
     }
  }

  def glanceGetScreenCache(screenId_or_ClientAddress: String): GlanceScreenToTrackFloor = {
    val optScreenMap = GlanceSyncCache.getGlanceCache[HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR)
    if(optScreenMap.isEmpty)
      return null
    val screenMap =optScreenMap.get
    val matchScreens = screenMap.values.toList.filter(x => (x.clientAddress.compareToIgnoreCase(screenId_or_ClientAddress) == 0 || x.screenId.compareToIgnoreCase(screenId_or_ClientAddress) == 0))
    if (matchScreens.size > 0)
      matchScreens(0)
    else
      null
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, screenToFloor: GlanceScreenToTrackFloor): Future[Boolean] = {

    if (existCount > 0) {
      update(credential, screenToFloor)
    } else {
      insert(credential, screenToFloor)
    }
  }

  def addOrUpdate(credential: GlanceCredential, screenToFloor: GlanceScreenToTrackFloor): Future[Boolean] = {
    if (screenToFloor == null) {
      Future {
        false
      }
    } else {
      val tmpConf = screenToFloor.copy(glanceOrgId = credential.glanceOrgId)
      val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "clientAddress" -> screenToFloor.clientAddress)
      val findExistCount = (existQuery: BSONDocument) => {
        try{
          GlanceDBService.GlanceDB().command(Count(GlanceScreenToTrackFloor.collection.name, Some(existQuery)))
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to read count of screen to floor mapping for update count checking, exception:{}",exp.getMessage)
            Future{0}
        }
      }
      for {
        existCount <- findExistCount(query)
        bRet <- addOrUpdate(existCount, credential, tmpConf)
      } yield {
        glanceScreenTrackFloorSetCache(null) //clean cache if the value is updated, next to reload...
        bRet
      }
    }
  }

  def update(credential: GlanceCredential, screenToFloor: GlanceScreenToTrackFloor): Future[Boolean] = {
    def copySetValues(z: GlanceScreenToTrackFloor): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        "matchIPAddress" -> checkIsMatchIPAddress(z.clientAddress),
        "clientAddress" -> z.clientAddress,
        "screenPosition" -> z.screenPosition,
        ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN -> z.showAllDevicesOnScreen,
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      Logger.debug("GlanceScreenToTrackFloor update:" + jsObj.toString())
      jsObj
    }

    try{
      GlanceScreenToTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> screenToFloor.glanceOrgId, "clientAddress" -> screenToFloor.clientAddress),
        Json.obj("$set" -> copySetValues(screenToFloor))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to update GlanceTrackFloor: glanceOrgId" + screenToFloor.glanceOrgId + " floorId:" + screenToFloor.floorId + " with ClientAddress:" + screenToFloor.clientAddress)
          true
        case _ =>
          Logger.error("Failed to update GlanceTrackFloor: glanceOrgId" + screenToFloor.glanceOrgId + " floorId:" + screenToFloor.floorId + " with ClientAddress:" + screenToFloor.clientAddress)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update screen to floor mapping, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def updateByScreenId(credential: GlanceCredential, screenId: String, screenToFloor: GlanceScreenToTrackFloor): Future[Boolean] = {
    def copySetValues(z: GlanceScreenToTrackFloor): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        "matchIPAddress" -> checkIsMatchIPAddress(z.clientAddress),
        "clientAddress" -> z.clientAddress,
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }
    try{
      GlanceScreenToTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> screenToFloor.glanceOrgId, "screenId" -> screenId),
        Json.obj("$set" -> copySetValues(screenToFloor))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to update GlanceTrackFloor: glanceOrgId" + screenToFloor.glanceOrgId + " screenId" + screenToFloor.screenId + " floorId:" + screenToFloor.floorId + " with ClientAddress:" + screenToFloor.clientAddress)
          glanceScreenTrackFloorSetCache(null) //clean cache...
          true
        case _ =>
          Logger.error("Failed to update GlanceTrackFloor: glanceOrgId" + screenToFloor.glanceOrgId + " screenId" + screenToFloor.screenId + " floorId:" + screenToFloor.floorId + " with ClientAddress:" + screenToFloor.clientAddress)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update screen to floor mapping of screenId:{}, exception:{}",screenId,exp.getMessage)
        Future{false}
    }
  }

  def deleteByScreenId(credential: GlanceCredential, screenId: String): Future[Boolean] = {
    try{
      GlanceScreenToTrackFloor.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "screenId" -> screenId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete screen info: " + credential.glanceOrgId + " screenId:" + screenId)
          glanceScreenTrackFloorSetCache(null) //clean cache...
          true
        case _ =>
          Logger.error("Failed to delete screen info: " + credential.glanceOrgId + " screenId:" + screenId)
          false
      }.recover {
        case _ =>
          Logger.error("Failed to delete screen info, exception: " + credential.glanceOrgId + " screenId:" + screenId)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete screen to floor mapping by screenId:{}, exception:{}",screenId,exp.getMessage)
        Future{false}
    }
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceScreenToTrackFloor]] = {
    val findByOrgId = (org: String) => {
      try{
        GlanceScreenToTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj("screenId" -> 1)).cursor[GlanceScreenToTrackFloor].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read all screen to floor mapping, exception:{}",exp.getMessage)
          Future{List()}
      }

    };
    findByOrgId(credential.glanceOrgId).map { listObject =>
      glanceScreenTrackFloorSetCache(listObject) //update the cache...
      listObject
    }.recover {
      case _ =>
        glanceScreenTrackFloorSetCache(null)
        List()
    }
  }

  def readByScreenId(credential: GlanceCredential, screenId: String): Future[Option[GlanceScreenToTrackFloor]] = {
    val screen = glanceGetScreenCache(screenId)
    if (screen == null) {
      val findByName = (org: String, sid: String) => {
        try{
          GlanceScreenToTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org, "screenId" -> sid)).one[GlanceScreenToTrackFloor]
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to read screen to floor mapping by Id/Name:{}, exception:{}",screenId,exp.getMessage)
            Future{None}
        }
      };
      findByName(credential.glanceOrgId, screenId).map { info =>
        info
      }.recover {
        case _ =>
          None
      }
    } else {
      Future {
        Some(screen)
      }
    }
  }

  def readByClientAddress(credential: GlanceCredential, clientAddress: String): Future[Option[GlanceScreenToTrackFloor]] = {
    val screen = glanceGetScreenCache(clientAddress)
    if (screen == null) {
      val findByName = (org: String, cAddress: String) => {
        try{
          GlanceScreenToTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org, "clientAddress" -> cAddress)).one[GlanceScreenToTrackFloor]
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to read screen to floor mapping by clientAddress:{}, exception:{}",clientAddress,exp.getMessage)
            Future{None}
        }
      };
      findByName(credential.glanceOrgId, clientAddress).map { info =>
        info
      }.recover {
        case _ =>
          None
      }
    } else {
      Future {
        Some(screen)
      }
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    glanceScreenTrackFloorSetCache(null)
  }

  def updateScreenTrackFloorCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAll(credential).map{listScreens =>
        true
      }
    }
    if(bCheckExists){
      val optScreenMap = GlanceSyncCache.getGlanceCache[HashMap[String,GlanceScreenToTrackFloor]](GlanceSyncCache.CONST_ALL_SCREEN_TRACK_FLOOR)
      if(optScreenMap.isDefined){
        Future{true}
      }else{
        readAndSet
      }
    }else{
      readAndSet
    }
  }
}
