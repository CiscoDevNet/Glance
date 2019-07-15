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
import scala.collection.mutable.MutableList
import scala.concurrent.Future
/**
 * Created by kennych on 1/6/16.
 */

case class GlanceUILayout(uiLayout:String="vertical",
                          uiBoothCount:Long=1)

case class  MockSetting(mockExpertSize:Long=50,
                        mockExpertMove:Long=5,
                        mockUpdateSeconds:Long=5,
                        mockPositionRandomMinX:Long=10,
                        mockPositionRandomMaxX:Long=1024,
                        mockPositionRandomMinY:Long=10,
                        mockPositionRandomMaxY:Long=768)

case class CheckIntervalSetting(expertIdleExpireMinutes:Long=5,
                                 expertActiveCheckInterval:Long =20, //seconds
                                 expertActiveCheckPageSize:Long=500,
                                 cmxVisitorScanIntervalSeconds:Long=20,
                                 cmxActiveExpertScanIntervalSeconds:Long=20,
                                 cmxVisitorInfoIntervalSeconds:Long=5,// push visitor info???
                                 cmxStaffUpdateIntervalMinutes:Long=1)

case class DefaultCheckInPositionSetting(defaultPositionX:Double=0.0,
                                         defaultPositionY:Double=0.0,
                                         defaultPositionRandom:Int=50)


case class GlancePositionCalibrateSetting(swapXY:Boolean=false,
                                          cmxScaleRate:Double=1.0,
                                          cmxPositionAmplifyX:Double=1.0,
                                          cmxPositionAmplifyY:Double=1.0,
                                          cmxPositionPlusX:Double=0.0,
                                          cmxPositionPlusY:Double=0.0,
                                          cmxPositionTrackWidth:Double=0.0,
                                          cmxPositionTrackHeight:Double=0.0)


case class OmniCalibrateSetting(calibratePos0:GlancePosition=new GlancePosition(0,0),
                                calibratePos1:GlancePosition=new GlancePosition(0,0),
                                calibratePos2:GlancePosition=new GlancePosition(0,0),
                                calibratePos3:GlancePosition=new GlancePosition(0,0),
                                calibrateCustomizedPos0:GlancePosition=new GlancePosition(0,0),
                                calibrateCustomizedPos1:GlancePosition=new GlancePosition(0,0),
                                calibrateCustomizedPos2:GlancePosition=new GlancePosition(0,0),
                                calibrateCustomizedPos3:GlancePosition=new GlancePosition(0,0))

case class GlanceFloorConf(nameSpace:String=ComUtils.getTenantOrgId(),
                           defaultTimeZone:String="-0700",
                           defaultMeetingMinutes:Double=120.0,
                           maxImageFileSize:Long=50, //mega
                           defaultSMSNotificationMessage:String="",
                           defaultCheckInPositionSetting:DefaultCheckInPositionSetting=new DefaultCheckInPositionSetting(),
                           glanceUILayout:GlanceUILayout=new GlanceUILayout(),
                           //position calibrate
                           glancePositionCalibrateSetting:GlancePositionCalibrateSetting=new GlancePositionCalibrateSetting(),
                           // visitor scan conf
                           checkIntervalSetting:CheckIntervalSetting =new CheckIntervalSetting(),
                            //mockup data settings
                           usingMockData:Boolean=false,
                           mockSetting:MockSetting=new MockSetting(),
                           //calibrate
                           omniCalibrateEnabled:Boolean=false,
                           omniCalibrateSetting:OmniCalibrateSetting=new OmniCalibrateSetting())

case class GlanceTrackFloor( _id: BSONObjectID = BSONObjectID.generate,
                             glanceOrgId:String=ComUtils.getTenantOrgId(),
                             floorId:String=UUID.randomUUID().toString(),
                             floorName:String="",
                             hierarchy:String="",
                             mapName:String="",
                             width:Long=0,
                             depth:Long=0,
                             map:JsValue=Json.toJson(""),
                             mask:JsValue=Json.toJson(""),
                             floorInfo:JsObject=Json.obj(),  //point to cmx floor info...
                             floorConf:GlanceFloorConf=new GlanceFloorConf(),
                             glanceCmxSetting:GlanceCMXSetting=new GlanceCMXSetting(),
                             cmxServiceType:String=ComUtils.SERVICE_TYPE_CMX,
                             floorLevel:Int=0,
                             enable:Boolean=true,
                             tags: List[String]= List(),
                             updated: Long=System.currentTimeMillis())


object GlanceTrackFloor{
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceTrackFloor")
  val CACHE_NAME="glanceTrackFloor"

  val glanceUILayoutReaders: Reads[GlanceUILayout] = (
      (__ \ "uiLayout").read[String] and
      (__ \ "uiBoothCount").read[Long]
    )(GlanceUILayout.apply _)

  implicit val glanceUILayoutWrites = new Writes[GlanceUILayout] {
    def writes(z: GlanceUILayout): JsValue = {
      Json.obj(
        "uiLayout" -> z.uiLayout,
        "uiBoothCount" -> z.uiBoothCount
      )
    }
  }

  implicit val glanceUILayoutFormat = Format(glanceUILayoutReaders, glanceUILayoutWrites)

  val mockSettingReaders: Reads[MockSetting] = (
        (__ \ "mockExpertSize").read[Long] and
        (__ \ "mockExpertMove").read[Long] and
        (__ \ "mockUpdateSeconds").read[Long] and
        (__ \ "mockPositionRandomMinX").read[Long] and
        (__ \ "mockPositionRandomMaxX").read[Long] and
        (__ \ "mockPositionRandomMinY").read[Long] and
        (__ \ "mockPositionRandomMaxY").read[Long]
    )(MockSetting.apply _)

  implicit val mockSettingWrites = new Writes[MockSetting] {
    def writes(z: MockSetting): JsValue = {
      Json.obj(
        "mockExpertSize" -> z.mockExpertSize,
        "mockExpertMove" -> z.mockExpertMove,
        "mockUpdateSeconds" -> z.mockUpdateSeconds,
        "mockPositionRandomMinX" -> z.mockPositionRandomMinX,
        "mockPositionRandomMaxX" -> z.mockPositionRandomMaxX,
        "mockPositionRandomMinY" -> z.mockPositionRandomMinY,
        "mockPositionRandomMaxY" -> z.mockPositionRandomMaxY
      )
    }
  }

  implicit val mockSettingFormat = Format(mockSettingReaders, mockSettingWrites)

  val checkIntervalSettingReaders: Reads[CheckIntervalSetting] = (
      (__ \ "expertIdleExpireMinutes").read[Long] and
      (__ \ "expertActiveCheckInterval").read[Long] and
      (__ \ "expertActiveCheckPageSize").read[Long] and
      (__ \ "cmxVisitorScanIntervalSeconds").read[Long] and
      (__ \ "cmxActiveExpertScanIntervalSeconds").read[Long] and
      (__ \ "cmxVisitorInfoIntervalSeconds").read[Long] and
      (__ \ "cmxStaffUpdateIntervalMinutes").read[Long]
    )(CheckIntervalSetting.apply _)

  implicit val checkIntervalSettingsWrites = new Writes[CheckIntervalSetting] {
    def writes(z: CheckIntervalSetting): JsValue = {
      Json.obj(
        "expertIdleExpireMinutes" -> z.expertIdleExpireMinutes,
        "expertActiveCheckInterval" -> z.expertActiveCheckInterval,
        "expertActiveCheckPageSize" -> z.expertActiveCheckPageSize,
        "cmxVisitorScanIntervalSeconds" -> z.cmxVisitorScanIntervalSeconds,
        "cmxActiveExpertScanIntervalSeconds" -> z.cmxActiveExpertScanIntervalSeconds,
        "cmxVisitorInfoIntervalSeconds" -> z.cmxVisitorInfoIntervalSeconds,
        "cmxStaffUpdateIntervalMinutes" -> z.cmxStaffUpdateIntervalMinutes
      )
    }
  }

  implicit val checkIntervalSettingFormat = Format(checkIntervalSettingReaders, checkIntervalSettingsWrites)


  val defaultCheckInPositionSettingReaders: Reads[DefaultCheckInPositionSetting] = (
      (__ \ "defaultPositionX").read[Double] and
      (__ \ "defaultPositionY").read[Double] and
      (__ \ "defaultPositionRandom").read[Int]
    )(DefaultCheckInPositionSetting.apply _)

  implicit val defaultCheckInPositionSettingWrites = new Writes[DefaultCheckInPositionSetting] {
    def writes(z: DefaultCheckInPositionSetting): JsValue = {
      Json.obj(
        "defaultPositionX" -> z.defaultPositionX,
        "defaultPositionY" -> z.defaultPositionY,
        "defaultPositionRandom" -> z.defaultPositionRandom
      )
    }
  }

  implicit val defaultCheckInPositionSettingFormat = Format(defaultCheckInPositionSettingReaders, defaultCheckInPositionSettingWrites)

  val glancePositionCalibrateSettingReaders: Reads[GlancePositionCalibrateSetting] = (
      (__ \ ComUtils.CONST_PROPERTY_SWAPXY).read[Boolean] and
      (__ \ ComUtils.CONST_PROPERTY_CMXSCALERATE).read[Double] and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYX).read[Double] and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYY).read[Double] and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSX).read[Double] and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSY).read[Double] and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKWIDTH).readNullable[Double].map(v => ComUtils.readNullDoubleDefault(v,0.0)) and
      (__ \ ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKHEIGHT).readNullable[Double].map(v => ComUtils.readNullDoubleDefault(v,0.0))
    )(GlancePositionCalibrateSetting.apply _)

  implicit val glancePositionCalibrateSettingWrites = new Writes[GlancePositionCalibrateSetting] {
    def writes(z: GlancePositionCalibrateSetting): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_SWAPXY -> z.swapXY,
        ComUtils.CONST_PROPERTY_CMXSCALERATE -> z.cmxScaleRate,
        ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYX -> z.cmxPositionAmplifyX,
        ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYY -> z.cmxPositionAmplifyY,
        ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSX -> z.cmxPositionPlusX,
        ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSY -> z.cmxPositionPlusY,
        ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKWIDTH -> z.cmxPositionTrackWidth,
        ComUtils.CONST_PROPERTY_CMXPOSITIONTRACKHEIGHT ->z.cmxPositionTrackHeight
      )
    }
  }

  implicit val glancePositionCalibrateSettingFormat = Format(glancePositionCalibrateSettingReaders, glancePositionCalibrateSettingWrites)

  val omniCalibrateSettingReaders: Reads[OmniCalibrateSetting] = (
      (__ \ "calibratePos0").read[GlancePosition] and
      (__ \ "calibratePos1").read[GlancePosition] and
      (__ \ "calibratePos2").read[GlancePosition] and
      (__ \ "calibratePos3").read[GlancePosition] and
      (__ \ "calibrateCustomizedPos0").read[GlancePosition] and
      (__ \ "calibrateCustomizedPos1").read[GlancePosition] and
      (__ \ "calibrateCustomizedPos2").read[GlancePosition] and
      (__ \ "calibrateCustomizedPos3").read[GlancePosition]
    )(OmniCalibrateSetting.apply _)

  implicit val omniCalibrateSettingWrites = new Writes[OmniCalibrateSetting] {
    def writes(z: OmniCalibrateSetting): JsValue = {
      Json.obj(
        "calibratePos0" -> z.calibratePos0,
        "calibratePos1" -> z.calibratePos1,
        "calibratePos2" -> z.calibratePos2,
        "calibratePos3" -> z.calibratePos3,
        "calibrateCustomizedPos0" -> z.calibrateCustomizedPos0,
        "calibrateCustomizedPos1" -> z.calibrateCustomizedPos1,
        "calibrateCustomizedPos2" -> z.calibrateCustomizedPos2,
        "calibrateCustomizedPos3" -> z.calibrateCustomizedPos3
      )
    }
  }

  implicit val omniCalibrateSettingFormat = Format(omniCalibrateSettingReaders, omniCalibrateSettingWrites)

  val glanceFloorConfReaders: Reads[GlanceFloorConf] = (
      (__ \ "nameSpace").read[String] and
      (__ \ "defaultTimeZone").read[String] and
      (__ \ "defaultMeetingMinutes").read[Double] and
      (__ \ "maxImageFileSize").read[Long] and
      (__ \ "defaultSMSNotificationMessage").read[String] and
      (__ \ "defaultCheckInPositionSetting").read[DefaultCheckInPositionSetting] and
      (__ \ "glanceUILayout").read[GlanceUILayout] and
      (__ \ "glancePositionCalibrateSetting").read[GlancePositionCalibrateSetting] and
      (__ \ "checkIntervalSetting").read[CheckIntervalSetting] and
      (__ \ "usingMockData").read[Boolean] and
      (__ \ "mockSetting").read[MockSetting] and
      (__ \ "omniCalibrateEnabled").read[Boolean] and
      (__ \ "omniCalibrateSetting").read[OmniCalibrateSetting]
  )(GlanceFloorConf.apply _)

  implicit val glanceFloorConfWrites = new Writes[GlanceFloorConf] {
    def writes(z: GlanceFloorConf): JsValue = {
      Json.obj(
        "nameSpace" -> z.nameSpace,
        "defaultTimeZone" -> z.defaultTimeZone,
        "defaultMeetingMinutes" -> z.defaultMeetingMinutes,
        "maxImageFileSize" -> z.maxImageFileSize,
        "defaultSMSNotificationMessage" -> z.defaultSMSNotificationMessage,
        "defaultCheckInPositionSetting" -> z.defaultCheckInPositionSetting,
        "glanceUILayout" -> z.glanceUILayout,
        "glancePositionCalibrateSetting" -> z.glancePositionCalibrateSetting,
        "checkIntervalSetting" -> z.checkIntervalSetting,
        "usingMockData" -> z.usingMockData,
        "mockSetting" -> z.mockSetting,
        "omniCalibrateEnabled" -> z.omniCalibrateEnabled,
        "omniCalibrateSetting" -> z.omniCalibrateSetting
      )
    }
  }

  implicit val glanceFloorConfFormat = Format(glanceFloorConfReaders, glanceFloorConfWrites)

  val tolerantGlanceTrackFloorReaders = new Reads[GlanceTrackFloor] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceTrackFloor(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).as[String],
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(UUID.randomUUID().toString()),
        (js \ ComUtils.CONST_PROPERTY_FLOORNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_HIERARCHY).as[String],
        (js \ ComUtils.CONST_PROPERTY_MAPNAME).as[String],
        (js \ "width").asOpt[Long].getOrElse(0),
        (js \ "depth").asOpt[Long].getOrElse(0),
        (js \ "map").asOpt[JsValue].getOrElse(Json.toJson("")),
        (js \ "mask").asOpt[JsValue].getOrElse(Json.toJson("")),
        (js \ ComUtils.CONST_PROPERTY_FLOORINFO).asOpt[JsObject].getOrElse(Json.obj()),
        (js \ ComUtils.CONST_PROPERTY_FLOORCONF).asOpt[GlanceFloorConf].getOrElse(new GlanceFloorConf()),
        (js \ "glanceCmxSetting").asOpt[GlanceCMXSetting](GlanceSystemConf.glanceCMXSettingReaders).getOrElse(new GlanceCMXSetting()),
        (js \ "cmxServiceType").asOpt[String].getOrElse(ComUtils.SERVICE_TYPE_CMX),
        (js \ ComUtils.CONST_PROPERTY_FLOORLEVEL).asOpt[Int].getOrElse(0),
        (js \ ComUtils.CONST_PROPERTY_ENABLE).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceTrackFloorWrites = new Writes[GlanceTrackFloor] {
    def writes(z: GlanceTrackFloor): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_FLOORID ->z.floorId,
        ComUtils.CONST_PROPERTY_FLOORNAME ->z.floorName,
        ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "width"   ->z.width,
        "depth"   ->z.depth,
        "map"     ->z.map,
        "mask"    ->z.mask,
        ComUtils.CONST_PROPERTY_FLOORINFO ->z.floorInfo,
        ComUtils.CONST_PROPERTY_FLOORCONF ->Json.toJson(z.floorConf),
        "glanceCmxSetting" -> Json.toJson(z.glanceCmxSetting)(GlanceSystemConf.glanceCMXSettingWrites),
        "cmxServiceType" -> z.cmxServiceType,
        ComUtils.CONST_PROPERTY_FLOORLEVEL ->z.floorLevel,
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceTrackFloorFormat = Format(tolerantGlanceTrackFloorReaders, glanceTrackFloorWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_FLOORS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }
  
  def insert(credential:GlanceCredential,trackFoor: GlanceTrackFloor) :Future[Boolean]= {
    val updateFloor =trackFoor.copy(glanceOrgId = credential.glanceOrgId)
    collection.insert(updateFloor).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert:  glanceOrg:"+trackFoor.glanceOrgId+" floorId:"+trackFoor.floorId+"with floorName:"+trackFoor.floorName)
        true
      case _ =>
        Logger.error("Failed to insert:  glanceOrg:"+trackFoor.glanceOrgId+" floorId:"+trackFoor.floorId+"with floorName:"+trackFoor.floorName)
        false
    }
  }

  def findFloorId(credential:GlanceCredential,floorHierarchyIdOrName:String):Future[String]={
    readFloorInfoByIdOrName(credential,floorHierarchyIdOrName).map{ floor =>
      if(floor==null)
        ""
      else
        floor.floorId
    }.recover{
      case _ =>
        Logger.error("Failed to read floor Id by name, hierarchy and id")
        ""
    }
  }

  def addOrUpdate(credential:GlanceCredential,conf:GlanceTrackFloor):Future[Boolean] ={
    addOrUpdate(credential,conf,"")
  }

  //appended floor id to building conf...
  def addOrUpdate(credential:GlanceCredential,trackFloor:GlanceTrackFloor,buildingId:String):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_HIERARCHY ->trackFloor.hierarchy)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,credential,trackFloor)
      floorId <- {
        if(buildingId=="")
          Future{""}
        else if(existCount <=0)
          Future{trackFloor.floorId}
        else if(buildingId!="")
          findFloorId(credential,trackFloor.hierarchy)
        else
          Future{""}
      }
      bAppendBuildingFloors <-{
        if(buildingId=="" || floorId=="")
          Future{false}
        else{
          GlanceTrackBuilding.addFloorInfo(credential,buildingId,floorId)
        }
      }
    }yield {
      if(bAppendBuildingFloors){
        GlanceSyncCache.setGlanceCache[List[GlanceTrackBuilding]](GlanceTrackBuilding.CACHE_NAME,null)
        GlanceTrackBuilding.sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,credential:GlanceCredential,conf:GlanceTrackFloor):Future[Boolean] ={

    if(existCount >0) {
      update(credential,conf).map{ bRet =>
        if(bRet){
          GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null) //if updated, just clean cache to reload...
          sendCacheSyncMessage(ComUtils.getCredential())
        }
        bRet
      }
    }else{
      insert(credential,conf).map{ bRet =>
        if(bRet){
          GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
          sendCacheSyncMessage(ComUtils.getCredential())
        } //if updated, just clean cache to reload...
        bRet
      }
    }
  }

  def update(credential:GlanceCredential,conf:GlanceTrackFloor):Future[Boolean] = {
    def copySetValues(z:GlanceTrackFloor):JsValue ={
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_FLOORNAME -> z.floorName,
        //Hierarchy will be updated by other interface.
        //ComUtils.CONST_PROPERTY_HIERARCHY -> z.hierarchy,
        ComUtils.CONST_PROPERTY_FLOORINFO -> z.floorInfo,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        ComUtils.CONST_PROPERTY_FLOORCONF ->Json.toJson(z.floorConf),
        ComUtils.CONST_PROPERTY_ENABLE  -> z.enable,
        ComUtils.CONST_PROPERTY_FLOORLEVEL ->z.floorLevel,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_HIERARCHY->conf.hierarchy),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("succeeded to update GlanceTrackFloor: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" with hierarchy:"+conf.hierarchy)
        GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null) //if updated, just clean cache to reload...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.debug("Failed to update GlanceTrackFloor: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" with hierarchy:"+conf.hierarchy)
        false
    }
  }

  def updateFloorForLowe(credential: GlanceCredential,floorId:String,updateSettings:JsObject):Future[Boolean]={

    GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId),
      updateSettings).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.info("Succeeded to update floor settings:"+floorId)
        GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null) //if updated, just clean cache to reload...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update floor settings:"+floorId)
        false
    }

  }

  def readFloorInfoByIdOrName(credential: GlanceCredential,id_or_name:String): Future[GlanceTrackFloor]={
    readFloorInfoByIdOrName(credential.glanceOrgId,id_or_name)
  }

  def readFloorInfoByIdOrName(orgId:String,id_or_name:String): Future[GlanceTrackFloor] ={
    val listQuery:MutableList[JsObject] =MutableList[JsObject](Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> id_or_name),Json.obj(ComUtils.CONST_PROPERTY_FLOORNAME -> id_or_name),Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> id_or_name))
    val findByIdName  = (org: String,id_or_name:String) => {
      try{
        GlanceTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,
        "$or"->listQuery)).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackFloor].collect[List]()
      }catch {
        case exp:Throwable=>
          Logger.error("Failed to read track floors by Id/Name:{}, exception:{}",id_or_name,exp.getMessage)
          Future{List()}
      }
    };

    def readByOrgAndName(org:String,idName:String):Future[GlanceTrackFloor]={
      try{
        findByIdName(orgId,id_or_name).map { listObject=>
          if(listObject.length ==0)
            null
          else
            listObject(0)
        }
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to track floor info by Id/Name:{}",id_or_name)
          Future{null}
      }
    }

    val optCacheFloors =GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
    if(optCacheFloors.isDefined) {
      val floors = optCacheFloors.get
      val list = floors.filter(x => (x.floorId == id_or_name) || (x.floorName == id_or_name) || (x.hierarchy == id_or_name))
      if (list.size > 0)
        Future { list(0) }
      else
        readByOrgAndName(orgId, id_or_name)
    }else
      readByOrgAndName(orgId,id_or_name)
  }

  def readFloorsByMapName(orgId:String,mapName:String):Future[List[GlanceTrackFloor]]={
    val findBymapName  = (org: String,mName:String) => {
      try{
        GlanceTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,
        ComUtils.CONST_PROPERTY_MAPNAME-> mName)).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackFloor].collect[List]()
      }catch {
        case exp: Throwable =>
          Logger.error("Failed to read floors by Map Name,exception:{}",exp.getMessage)
          Future{List()}
      }
    };
    val optCacheFloors =GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
    if(optCacheFloors.isDefined){
      val floors = optCacheFloors.get
      val list =floors.filter(x => (x.mapName ==mapName))
      if(floors.size>0)
        Future{list}
      else
        findBymapName(orgId,mapName)
    }else{
      findBymapName(orgId,mapName)
    }
  }

  def readAll(credential:GlanceCredential):Future[List[GlanceTrackFloor]] ={
    val optTrackFloors=GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
    if(optTrackFloors.isDefined) {
      Future {optTrackFloors.get}
    }else{
      val findByOrgId  = (org: String) => {
        try{
          GlanceTrackFloor.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> 1)).cursor[GlanceTrackFloor].collect[List]()
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to read track floors, excpetion:{}",exp.getMessage)
            Future{List()}
        }
      };
      findByOrgId(credential.glanceOrgId).map{ listObject =>
        if(listObject.length>0)
          GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,listObject)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
        listObject
      }.recover{
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
          List()
      }
    }
  }

  def readAllOfBuilding(credential:GlanceCredential,glanceTrackBuilding: GlanceTrackBuilding):Future[List[GlanceTrackFloor]] ={
    val floorIds=glanceTrackBuilding.buildingConf.floors
    val findByOrgId  = (org: String,floors:List[String]) => {
      try{
        GlanceTrackFloor.collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_FLOORID ->Json.obj("$in" ->floors))).sort(Json.obj(ComUtils.CONST_PROPERTY_FLOORLEVEL -> 1)).cursor[GlanceTrackFloor].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read track floors of building, excpetion:{}",exp.getMessage)
          Future{List()}
      }
    };

    def findByFloorIds(org:String,floorIdList:List[String]):Future[List[GlanceTrackFloor]]={
      findByOrgId(org, floorIdList).map { listObject =>
        listObject
      }.recover {
        case _ =>
          List()
      }
    }

    val optTrackFloors =GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
    optTrackFloors match {
      case Some(floors) =>
        val list =floors.filter(x => floorIds.contains(x.floorId))
        if(list.size>0)Future{
          list.sortWith((xFloor1,xFloor2) => xFloor1.floorLevel < xFloor2.floorLevel)
          //list
        }
        else
          findByFloorIds(credential.glanceOrgId,glanceTrackBuilding.buildingConf.floors)
      case _ =>
        findByFloorIds(credential.glanceOrgId,glanceTrackBuilding.buildingConf.floors)
    }
  }

  def readByFloorId(credential: GlanceCredential,floorId:String):Future[Option[GlanceTrackFloor]] ={
    val findByName  = (org: String,fid:String) => {
      try{
        GlanceTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_FLOORID -> floorId)).one[GlanceTrackFloor]
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to read track floor by Id, exception:{}",exp.getMessage)
          Future{None}
      }
    };
    def readById(org:String,fid:String):Future[Option[GlanceTrackFloor]]={
      findByName(org,fid).map{ info =>
        info
      }.recover{
        case _=>
          None
      }
    }
    val optTrackFloors =GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
    if(optTrackFloors.isDefined) {
      val floors = optTrackFloors.get
      val list = floors.filter(x => x.floorId == floorId)
      if (list.size > 0)
        Future { Some(list(0))}
      else
        readById(credential.glanceOrgId, floorId)
    }else
      readById(credential.glanceOrgId,floorId)
  }
  //util func
  def findMatchFloors(allTrackFloors:List[GlanceTrackFloor],matchHierarchy:String):List[GlanceTrackFloor]= {
    val list = allTrackFloors.filter(x => x.hierarchy.compareToIgnoreCase(matchHierarchy) == 0 || (ComUtils.hierarchyLevel(x.hierarchy,ComUtils.HIERARCHY_SPLIT)>=3 && ComUtils.hierarchyLevel(matchHierarchy,ComUtils.HIERARCHY_SPLIT) >=3 &&  x.hierarchy.indexOf(matchHierarchy + ComUtils.HIERARCHY_SPLIT) == 0) || (ComUtils.hierarchyLevel(x.hierarchy,ComUtils.HIERARCHY_SPLIT)>=3 && ComUtils.hierarchyLevel(matchHierarchy) >=3 && matchHierarchy.indexOf(x.hierarchy + ComUtils.HIERARCHY_SPLIT) == 0))
    ComUtils.distinctBy(list)(_.floorId)
  }

  def delete(credential: GlanceCredential, floorId:String): Future[Boolean] = {
    GlanceTrackFloor.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.debug("Failed to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        false
    }.recover{
      case _ =>
        Logger.debug("Exception, failed to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        false
    }
  }

  def updateAmplifyRates(credential: GlanceCredential,optFloor:Option[GlanceTrackFloor],mapName:String,hierachy:String,swapXY:Boolean):Future[Boolean]={
    def updateAmplify(xAmplify:Double,yAmplify:Double):Future[Boolean]={
      for{
        bXUpdate <- {
          GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> optFloor.get.floorId),
            Json.obj("$set" -> Json.obj("floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX" -> JsNumber(xAmplify)))).map{
            case LastError(true, _, _, _, _, _, _) =>
              true
            case _ =>
              false
          }
        }
        bYUpdate <- {
          GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> optFloor.get.floorId),
            Json.obj("$set" -> Json.obj("floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY" -> JsNumber(yAmplify)))).map{
            case LastError(true, _, _, _, _, _, _) =>
              true
            case _ =>
              false
          }
        }
      }yield {
        bXUpdate && bYUpdate
      }
    }

    for{
      trackedFloors <-GlanceTrackFloor.readAll(credential)
      cmxFloors <- {
        val floors= trackedFloors.filter(p => ComUtils.isCmxServiceType(p.cmxServiceType) && ComUtils.isCorrectHierarchy(p.hierarchy))
        if(floors.length>0)
          GlanceHistory.readAllMapInfo(credential)
        else
          Future{List()}
      }
      mapInfoList <-GlanceMapSizeInfo.readAllConf(credential)
      bUpdateInfo <-{
        if(!optFloor.isDefined || mapName=="" || hierachy=="")
          Future{false}
        else{
          val matchFloors =cmxFloors.filter(p => p.hierarchyName==hierachy)
          val matchMaps =mapInfoList.filter(p1 =>p1.mapName==mapName)
          if(matchFloors.length<=0 || matchMaps.length<=0)
            Future{false}
          else{
            var xAmplify:Double=0.0
            var yAmplify:Double=0.0
            //Logger.debug("CMX Map Info, Width:"+matchFloors(0).dimension.width+" height:"+matchFloors(0).dimension.length)
            //Logger.debug("Glance Map Info, Width:"+matchMaps(0).width+" length:"+matchMaps(0).height)
            val width ={
              if(optFloor.get.floorConf.glancePositionCalibrateSetting.cmxPositionTrackWidth.toInt<1)
                matchMaps(0).width
              else
                optFloor.get.floorConf.glancePositionCalibrateSetting.cmxPositionTrackWidth.toInt
            }
            val height ={
              if(optFloor.get.floorConf.glancePositionCalibrateSetting.cmxPositionTrackHeight.toInt<1)
                matchMaps(0).height
              else
                optFloor.get.floorConf.glancePositionCalibrateSetting.cmxPositionTrackHeight.toInt
            }
            if(swapXY)
            {
              xAmplify =ComUtils.getDigitPrecision(height/matchFloors(0).dimension.length,4)
              yAmplify =ComUtils.getDigitPrecision(width/matchFloors(0).dimension.width,4)
            }else{
              xAmplify =ComUtils.getDigitPrecision(width/matchFloors(0).dimension.width,4)
              yAmplify =ComUtils.getDigitPrecision(height/matchFloors(0).dimension.length,4)
            }
            updateAmplify(xAmplify,yAmplify)
          }
        }
      }

    }yield {
      bUpdateInfo
    }
  }

  def updateTrackFloorInfoBySubName(credential: GlanceCredential,floorIdName:String,floorItemName:String,floorSubItemName:String,floorSubSubItemName:String,jsValue: JsValue):Future[Boolean]={
    val listQuery:MutableList[JsObject] =MutableList[JsObject](Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> floorIdName),Json.obj(ComUtils.CONST_PROPERTY_FLOORNAME -> floorIdName),Json.obj(ComUtils.CONST_PROPERTY_HIERARCHY -> floorIdName))
    val findByIdName  = (org: String,id_or_name:String) => GlanceTrackFloor.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,
        "$or"->listQuery)).one[GlanceTrackFloor]

    def updateTrackFloorItemsBySubName(optFloor:Option[GlanceTrackFloor],itemName:String,SubItemName:String,value:JsValue):Future[Boolean]={
      if(optFloor.isDefined){
        val floor = optFloor.get
        var eUpdate: Future[LastError] = Future {
          null
        }
        if (floorSubItemName == "") {
          eUpdate = GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floor.floorId),
            Json.obj("$set" -> Json.obj(floorItemName -> jsValue)))
        } else {
          if (floorSubSubItemName == "")
            eUpdate = GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floor.floorId),
              Json.obj("$set" -> Json.obj(floorItemName + "." + floorSubItemName -> jsValue)))
          else
            eUpdate = GlanceTrackFloor.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floor.floorId),
              Json.obj("$set" -> Json.obj(floorItemName + "." + floorSubItemName + "." + floorSubSubItemName -> jsValue)))
        }
        eUpdate.map {
          case LastError(true, _, _, _, _, _, _) =>
            Logger.info("Succeeded to update track floorInfo:  glanceOrg:" + credential.glanceOrgId + " floorId:" + floor.floorId + "with floorName:" + floor.floorName)
            true
          case _ =>
            Logger.info("Failed to update track floorInfo:  glanceOrg:" + credential.glanceOrgId + " floorId:" + floor.floorId + "with floorName:" + floor.floorName)
            false
        }
      }else {
        Future{false}
      }
    }

    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      optFloor <- findByIdName(credential.glanceOrgId,floorIdName)
      bMapInfoChanged <-{
        if(floorItemName ==ComUtils.CONST_PROPERTY_FLOORCONF && floorSubItemName=="glancePositionCalibrateSetting" && floorSubSubItemName==ComUtils.CONST_PROPERTY_SWAPXY)
        {
          if(optFloor.isEmpty)
            Future{false}
          else if(optFloor.get.floorConf.glancePositionCalibrateSetting.swapXY!= jsValue.asOpt[Boolean].getOrElse(false))
            Future{true}
          else
            Future{false}
        }
        else if(floorSubItemName!="" || optFloor.isEmpty)
          Future{ false }
        else if(floorItemName == ComUtils.CONST_PROPERTY_MAPNAME && optFloor.get.mapName != jsValue.asOpt[String].getOrElse(""))
          Future{true}
        else if(floorItemName == ComUtils.CONST_PROPERTY_HIERARCHY && optFloor.get.hierarchy!=jsValue.asOpt[String].getOrElse(""))
          Future{true}
        else
          Future{false}
      }
      bNeedUpdateBuildingSizeInfo <-{
        if(optFloor.isEmpty)
          Future{false}
        else if(floorItemName ==ComUtils.CONST_PROPERTY_MAPNAME && optFloor.get.mapName != jsValue.asOpt[String].getOrElse(""))
          Future{true}
        else
          Future{false}
      }
      bRet <- updateTrackFloorItemsBySubName(optFloor,floorItemName,floorSubItemName,jsValue)
      bSwapXY <- Future{
        if(floorItemName ==ComUtils.CONST_PROPERTY_FLOORCONF && floorSubItemName=="glancePositionCalibrateSetting" && floorSubSubItemName==ComUtils.CONST_PROPERTY_SWAPXY)
          jsValue.asOpt[Boolean].getOrElse(false)
        else if(optFloor.isDefined)
          optFloor.get.floorConf.glancePositionCalibrateSetting.swapXY
        else
          false
      }
      bUpdateXYCalibrate <- {
        var mapName:String ={if(optFloor.isDefined)optFloor.get.mapName else ""}
        var hierarchy:String={if(optFloor.isDefined)optFloor.get.hierarchy else ""}
        if(bMapInfoChanged && floorItemName ==ComUtils.CONST_PROPERTY_MAPNAME)
          mapName =jsValue.asOpt[String].getOrElse(optFloor.get.mapName)
        if(bMapInfoChanged && floorItemName ==ComUtils.CONST_PROPERTY_HIERARCHY)
          hierarchy =jsValue.asOpt[String].getOrElse(optFloor.get.hierarchy)
        Logger.debug("mapName:"+mapName +" hierarchy:"+hierarchy)
        if(!bMapInfoChanged)
          Future{true}
        else
          updateAmplifyRates(credential,optFloor,mapName,hierarchy,bSwapXY)
      }
      bUpdateBuildingSizeInfo <- {
        if(optFloor.isDefined && bNeedUpdateBuildingSizeInfo)
          GlanceTrackCampus.updateBuildingSizeOfFloor(credential,sysConf.defaultTrackingCampus,optFloor.get.floorId)
        else
          Future{false}
      }
    } yield{
      if(bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean the cache and make it force reload.
      bRet
    }
  }

//  //provide api to reset position calibrate settings
//  def recalculateCalibrationSettings(credential:GlanceCredential):Unit=
//  {
//    //This function is not implemented yet.
//  }


  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
  }
  def updateTrackFloorCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAll(credential).map{listFloors =>
        if(listFloors==null || listFloors.size<=0)
           GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,null)
        else
           GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](CACHE_NAME,listFloors)
        true
      }
    }
    if(bCheckExists){
      val optFloors =GlanceSyncCache.getGlanceCache[List[GlanceTrackFloor]](CACHE_NAME)
      if(optFloors.isDefined)
          Future{true}
      else
          readAndSet
    }else
      readAndSet
  }
}
