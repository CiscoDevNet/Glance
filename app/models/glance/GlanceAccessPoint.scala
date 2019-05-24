package models.glance

import java.util.UUID
import utils.ComUtils
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
 * Created by kennych on 08/03/2018.
 */
case class GlanceAccessPoint (_id: BSONObjectID = BSONObjectID.generate,
                               glanceOrgId: String,
                               id:String,
                               floorId:String="",
                               buildingId:String="",
                               macAddress:String="",
                               name:String="",
                               modelNo:String="",
                               category:String="ap",
                               description:String="",
                               position:GlancePosition=new GlancePosition(0,0),
                               connectedDevices:List[String]=List(),
                               connectedDevicesCount:Int=0,
                               online:Boolean=true,
                               startTime: Long=System.currentTimeMillis(),
                               endTime:Long= System.currentTimeMillis(),
                               tags: List[String] = List(),
                               updated: Long = System.currentTimeMillis())

object GlanceAccessPoint {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceAccessPoint")

  val CACHE_NAME = "glanceAccessPoint"
  val CONST_PROPERTY_IID = "_id"
  val CONST_PROPERTY_GLANCEORGID = "glanceOrgId"
  val CONST_PROPERTY_ID = "id"
  val CONST_PROPERTY_FLOORID = "floorId"
  val CONST_PROPERTY_BUILDINGID = "buildingId"
  val CONST_PROPERTY_MACADDRESS = "macAddress"
  val CONST_PROPERTY_NAME = "name"
  val CONST_PROPERTY_MODELNO = "modelNo"
  val CONST_PROPERTY_CATEGORY = "category"
  val CONST_PROPERTY_DESCRIPTION = "description"
  val CONST_PROPERTY_POSITION = "position"
  val CONST_PROPERTY_CONNECTEDDEVICES = "connectedDevices"
  val CONST_PROPERTY_CONNECTEDDEVICESCOUNT = "connectedDevicesCount"
  val CONST_PROPERTY_ONLINE = "online"
  val CONST_PROPERTY_STARTTIME = "startTime"
  val CONST_PROPERTY_ENDTIME = "endTime"
  val CONST_PROPERTY_TAGS = "tags"
  val CONST_PROPERTY_UPDATED = "updated"
  val CONST_PROPERTY_COUNT = "count"

  val glanceAccessPointReaders = new Reads[GlanceAccessPoint] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceAccessPoint(
        (js \ CONST_PROPERTY_IID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
        (js \ CONST_PROPERTY_ID).as[String],
        (js \ CONST_PROPERTY_FLOORID).as[String],
        (js \ CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse(""),
        (js \ CONST_PROPERTY_MACADDRESS).asOpt[String].getOrElse(""),
        (js \ CONST_PROPERTY_NAME).as[String],
        (js \ CONST_PROPERTY_MODELNO).asOpt[String].getOrElse(""),
        (js \ CONST_PROPERTY_CATEGORY).asOpt[String].getOrElse("ap"),
        (js \ CONST_PROPERTY_DESCRIPTION).asOpt[String].getOrElse(""),
        (js \ CONST_PROPERTY_POSITION).as[GlancePosition],
        (js \ CONST_PROPERTY_CONNECTEDDEVICES).asOpt[List[String]].getOrElse(List()),
        (js \ CONST_PROPERTY_CONNECTEDDEVICES).asOpt[List[String]].getOrElse(List()).length,
        (js \ CONST_PROPERTY_ONLINE).asOpt[Boolean].getOrElse(true),
        (js \ CONST_PROPERTY_STARTTIME).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ CONST_PROPERTY_ENDTIME).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceAccessPointWrites = new Writes[GlanceAccessPoint] {

    def writes(z: GlanceAccessPoint): JsValue = {
      Json.obj(
        CONST_PROPERTY_IID -> z._id,
        CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        CONST_PROPERTY_ID -> z.id,
        CONST_PROPERTY_FLOORID -> z.floorId,
        CONST_PROPERTY_BUILDINGID -> z.buildingId,
        CONST_PROPERTY_MACADDRESS ->z.macAddress,
        CONST_PROPERTY_NAME -> z.name,
        CONST_PROPERTY_MODELNO -> z.modelNo,
        CONST_PROPERTY_CATEGORY ->z.category,
        CONST_PROPERTY_DESCRIPTION -> z.description,
        CONST_PROPERTY_POSITION -> z.position,
        CONST_PROPERTY_CONNECTEDDEVICES -> z.connectedDevices,
        CONST_PROPERTY_CONNECTEDDEVICESCOUNT -> z.connectedDevices.length,
        CONST_PROPERTY_ONLINE -> z.online,
        CONST_PROPERTY_STARTTIME -> z.startTime,
        CONST_PROPERTY_ENDTIME -> z.endTime,
        CONST_PROPERTY_TAGS -> z.tags,
        CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceAccessPointFormat = Format(glanceAccessPointReaders, glanceAccessPointWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_ACCESS_POINT_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(credential: GlanceCredential, accessPoint: GlanceAccessPoint): Future[Boolean] = {
    val updateRecord = accessPoint.copy(glanceOrgId = credential.glanceOrgId)
    try{
      collection.insert(updateRecord).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully insert:  glanceOrg:" + accessPoint.glanceOrgId + " floorId:" + accessPoint.floorId + " with access point data" + Json.toJson(accessPoint).toString())
          true
        case _ =>
          Logger.error("Failed insert:  glanceOrg:" + accessPoint.glanceOrgId + " floorId:" + accessPoint.floorId + " with access point data" + Json.toJson(accessPoint).toString())
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert glance access point,orgId:{},floorId:{}, exception:{}",credential.glanceOrgId,accessPoint.floorId,exp.getMessage)
        Future{false}
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, accessPoint: GlanceAccessPoint): Future[Boolean] = {
    if (existCount > 0) {
      update(credential, accessPoint)
    } else {
      insert(credential, accessPoint)
    }
  }

  def addOrUpdate(credential: GlanceCredential, accessPoint: GlanceAccessPoint): Future[Boolean] = {
    if (accessPoint == null) {
      Future {
        false
      }
    } else {
      def getQuery(floorInfo:GlanceTrackFloor):BSONDocument={
        BSONDocument(CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, CONST_PROPERTY_FLOORID -> floorInfo.floorId,CONST_PROPERTY_ID -> accessPoint.id)
      }
      val findExistCount = (existQuery: BSONDocument) => {
        try{
          GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
        }catch{
          case exp:Throwable =>
            Logger.error("Failed to read Glance Access Point: glanceOrgId:{}",credential.glanceOrgId)
            Future{0}
        }
      }
      for {
        floorInfo <-GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,accessPoint.floorId)
        buildingId <-GlanceTrackBuilding.readBuildingIdByFloorId(credential,floorInfo.floorId)
        existCount <- {if(floorInfo==null) Future{0} else findExistCount(getQuery(floorInfo))}
        bRet <- {if(floorInfo==null) Future{false} else addOrUpdate(existCount, credential, accessPoint.copy(floorId=floorInfo.floorId,buildingId =buildingId,glanceOrgId = credential.glanceOrgId))}
      } yield {
        if(bRet) {
          //clean the cache...
          GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
        }
        bRet
      }
    }
  }

  def update(credential: GlanceCredential, conf: GlanceAccessPoint): Future[Boolean] = {
    def copySetValues(z: GlanceAccessPoint): JsValue = {
      val jsObj = Json.obj(
        CONST_PROPERTY_FLOORID -> z.floorId,
        CONST_PROPERTY_BUILDINGID ->z.buildingId,
        CONST_PROPERTY_ID -> z.id,
        CONST_PROPERTY_CATEGORY -> z.category,
        CONST_PROPERTY_MACADDRESS ->z.macAddress,
        CONST_PROPERTY_NAME -> z.name,
        CONST_PROPERTY_MODELNO ->z.modelNo,
        CONST_PROPERTY_DESCRIPTION -> z.description,
        CONST_PROPERTY_POSITION -> z.position,
        CONST_PROPERTY_CONNECTEDDEVICES ->z.connectedDevices,
        CONST_PROPERTY_ONLINE ->z.online,
        CONST_PROPERTY_STARTTIME -> z.startTime,
        CONST_PROPERTY_ENDTIME -> z.endTime,
        CONST_PROPERTY_TAGS -> z.tags,
        CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      //Logger.info("GlanceAccessPoint update:" + jsObj.toString())
      jsObj
    }

    try{
      collection.update(Json.obj(CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId, CONST_PROPERTY_FLOORID -> conf.floorId,CONST_PROPERTY_ID -> conf.name),
        Json.obj("$set" -> copySetValues(conf))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated Glance Access Point: glanceOrgId" + conf.glanceOrgId + " floorId:" + conf.floorId + " with Glance Access Point:" + Json.toJson(conf).toString())
          true
        case _ =>
          Logger.error("Failed to update Glance Access Point: glanceOrgId" + conf.glanceOrgId + " floorId:" + conf.floorId + " with Glance Access Point:" + Json.toJson(conf).toString())
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to read glance floor,orgId:{},floorId:{},name:{}, exception:{}",credential.glanceOrgId,conf.floorId,conf.name,exp.getMessage)
        Future{false}
    }
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceAccessPoint]] = {
    val findByOrgId = (org: String) => {
      try{
        collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj(CONST_PROPERTY_FLOORID -> 1,CONST_PROPERTY_STARTTIME ->1)).cursor[GlanceAccessPoint].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read Glance Access Point: glanceOrgId:{}",credential.glanceOrgId)
          Future{List()}
      }
    };
    findByOrgId(credential.glanceOrgId).map { listObject =>
      GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,listObject)
      listObject
    }.recover {
      case _ =>
        GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,null)
        List()
    }
  }

  def getFloorsAccessPoints(accessPoints:List[GlanceAccessPoint]):JsObject={
    def convertGlanceAccessPointToObject(accessPoint:GlanceAccessPoint):JsObject={
      var obj =Json.toJson(accessPoint).as[JsObject]
      obj =ComUtils.removeObjectCommonProperties(obj)

      if(obj.keys.contains(CONST_PROPERTY_POSITION))
        obj ++= Json.obj(CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(accessPoint.position.x.toInt,accessPoint.position.y.toInt)))
      else
        obj += (CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))
      obj += (CONST_PROPERTY_COUNT -> JsNumber(accessPoint.connectedDevices.length))
      obj
    }
    val floors = accessPoints.map(p=> p.floorId).distinct
    var floorAps:JsObject =Json.obj()
    floors.map{ floorId =>
      val accessPointsArr = accessPoints.map(p => convertGlanceAccessPointToObject(p))
      floorAps +=(floorId,ComUtils.getJsonArray(accessPointsArr))
    }
    floorAps
  }

  def readAllCombineConnectedDevice(credential: GlanceCredential,connectedDevices:List[GlanceAssociationIPMacAddress]): Future[List[GlanceAccessPoint]] = {
    readAll(credential).map{ accessPoints =>
      val tmpAccessPoints = accessPoints.map(p => p.copy(connectedDevices =  connectedDevices.filter(ipDevice => ipDevice.merakiData.apMac==p.macAddress).map(device => device.macAddress)))
      tmpAccessPoints
    }
  }

  def readAllByFloorIdName(credential: GlanceCredential,floorId:String): Future[List[GlanceAccessPoint]] = {
    def readByFloorId(fid:String):Future[List[GlanceAccessPoint]]={
      val findByOrgId = (org: String) => {
        try{
          collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org,CONST_PROPERTY_FLOORID -> floorId)).sort(Json.obj(CONST_PROPERTY_FLOORID -> 1,"startTime" ->1)).cursor[GlanceAccessPoint].collect[List]()
        }catch{
          case exp:Throwable =>
            Logger.error("Failed to read Glance Access Point: glanceOrgId:{},floorId:{},exception:{}",credential.glanceOrgId,floorId,exp.getMessage)
            Future{List()}
        }
      };
      findByOrgId(credential.glanceOrgId)
    }
    val optInterestPoints= GlanceSyncCache.getGlanceCache[List[GlanceAccessPoint]](CACHE_NAME)
    if (optInterestPoints.isDefined){
      val list = optInterestPoints.get.filter(p => p.floorId==floorId)
      if(list.length>=0)
        Future{list.sortWith((x1,x2) => x1.startTime >=x2.startTime)}
      else
        readByFloorId(floorId)
    }else
      readByFloorId(floorId)
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,null)
  }

  def updateAccessPointCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAll(credential).map{ interestPoints =>
        true
      }
    }
    if(bCheckExists){
      val optAccessPoints = GlanceSyncCache.getGlanceCache[List[GlanceAccessPoint]](CACHE_NAME)
      if (optAccessPoints.isDefined){
        Future{true}
      }else
        readAndSet
    }else{
      readAndSet
    }
  }

  def delete(credential: GlanceCredential, accessPointId:String): Future[Boolean] = {
    try{
      collection.remove(Json.obj(CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, CONST_PROPERTY_ID -> accessPointId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully deleted: "+credential.glanceOrgId +" accessPointId:"+accessPointId)
          GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete: "+credential.glanceOrgId +" accessPointId:"+accessPointId)
          false
      }
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to delete Glance Access Point: glanceOrgId:{},accessPointId:{},exception:{}",credential.glanceOrgId,accessPointId,exp.getMessage)
        Future{false}
    }
  }

  def deleteByFloorId(credential: GlanceCredential, floorId:String): Future[Boolean] = {
    try{
      collection.remove(Json.obj(CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, CONST_PROPERTY_FLOORID -> floorId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully deleted: "+credential.glanceOrgId +" floorId:"+floorId)
          GlanceSyncCache.setGlanceCache[List[GlanceAccessPoint]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete: "+credential.glanceOrgId +" floorId:"+floorId)
          false
      }
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to delete Glance Access Point by floorId: ,exception:{}",floorId,exp.getMessage)
        Future{false}
    }
  }

}