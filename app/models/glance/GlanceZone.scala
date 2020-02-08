package models.glance

import java.util.{Date, UUID}
import utils.{ComUtils, GlanceLoc}
import com.sksamuel.scrimage.RGBColor
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import java.util.UUID
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import models.cmx.Implicits._
import models.cmx.{MapCoordinate, Zone}
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
import services.cisco.database.GlanceDBService
import services.cisco.notification.NotificationService
import services.security.GlanceCredential
import scala.collection.mutable
import scala.collection.mutable.MutableList
import scala.concurrent.{Await, Promise, Future}
import scala.util.Random
import scala.concurrent.duration._
import play.api.libs.iteratee.Enumerator
import reactivemongo.core.commands.{Count, LastError}
//import reactivemongo.play.json._


/**
 * Created by kennych on 12/1/15.
 */
case class GlanceZone (_id: BSONObjectID = BSONObjectID.generate,
                       glanceOrgId:String="",
                       glanceUserId:String="",
                       floorId:String,
                       zoneId: String=UUID.randomUUID().toString,
                       zoneName:String,
                       zoneDisplayName:String="",
                       zone:Zone,
                       color:RGBColor=RGBColor(0,0,0,1),
                       labelPosition:MapCoordinate=new MapCoordinate(0,0,0),
                       systemZone:Boolean=false, //by default the zone is customer added zone
                       zoneEnabled:Boolean=true,
                       temporary:Boolean =false,
                       tags: List[String]=List(),
                       updated: Long=System.currentTimeMillis())


object GlanceZone {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceZone")

  //import play.api.libs.json._
  //import reactivemongo.bson._

  import scala.concurrent.ExecutionContext.Implicits.global
  val CACHE_NAME="glanceZone"
  def sendCacheSyncMessage(credential: GlanceCredential): Unit ={

    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_ZONES_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def rrggbbToRGBColor(colors:String):RGBColor={
    if(colors.indexOf("#")==0){
      try{
        val r =colors.substring(1,3)
        val g =colors.substring(3,5)
        val b =colors.substring(5,7)
        val ri=Integer.parseInt(r, 16)
        val gi=Integer.parseInt(g, 16)
        val bi=Integer.parseInt(b, 16)
        RGBColor(ri,gi,bi)
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to parse rrggbb RGBColor, exception:{}",exp.getMessage)
          RGBColor(new Random().nextInt(255),new Random().nextInt(255),new Random().nextInt(255))
      }
    }else{
      RGBColor(new Random().nextInt(255),new Random().nextInt(255),new Random().nextInt(255))
    }
  }
  def randomRGBColor():RGBColor = {
    //ComUtils.outputErrorMsg("Call randomRGBColor:XXXX")
    RGBColor(new Random().nextInt(255),new Random().nextInt(255),new Random().nextInt(255))
  }

  def blankRGBColor():RGBColor= {
      RGBColor(0,0,0,1)
  }

  def rgbColorToRRGGBB(color: RGBColor):String={
    def appendPadding(hexStr:String):String={
      var retStr=hexStr
      if(hexStr.length<2){
        for(cl<-hexStr.length to 1)
          retStr ="0"+retStr
      }
      retStr
    }
    val tmpVal ="#"+ appendPadding(color.red.toHexString) +appendPadding(color.green.toHexString)+ appendPadding(color.blue.toHexString)
    tmpVal
  }

  val tolerantGlanceZoneReaders = new Reads[GlanceZone] {

    def reads(js: JsValue) = {
      JsSuccess(GlanceZone(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
        (js \ ComUtils.CONST_PROPERTY_USERID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_ZONEID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_ZONENAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_ZONE).as[Zone],
        rrggbbToRGBColor((js \ ComUtils.CONST_PROPERTY_COLOR).asOpt[String].getOrElse("")),
        (js \ ComUtils.CONST_PROPERTY_LABELPOSITION).asOpt[MapCoordinate].getOrElse(new MapCoordinate(0,0,0)),
        (js \ ComUtils.CONST_PROPERTY_SYSTEMZONE).asOpt[Boolean].getOrElse(false),
        (js \ ComUtils.CONST_PROPERTY_ZONEENABLED).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TEMPORARY).asOpt[Boolean].getOrElse(false),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceZoneWrites = new Writes[GlanceZone] {

    def writes(z: GlanceZone): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_USERID ->z.glanceUserId,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        ComUtils.CONST_PROPERTY_ZONEID -> z.zoneId,
        ComUtils.CONST_PROPERTY_ZONENAME -> z.zoneName,
        ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> z.zoneDisplayName,
        ComUtils.CONST_PROPERTY_ZONE -> Json.toJson(z.zone),
        ComUtils.CONST_PROPERTY_COLOR -> rgbColorToRRGGBB(z.color),
        ComUtils.CONST_PROPERTY_LABELPOSITION ->Json.toJson(z.labelPosition),
        ComUtils.CONST_PROPERTY_SYSTEMZONE -> z.systemZone,
        ComUtils.CONST_PROPERTY_ZONEENABLED ->z.zoneEnabled,
        ComUtils.CONST_PROPERTY_TEMPORARY ->z.temporary,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGlanceZoneReaders, glanceZoneWrites)

  def insert(t: GlanceZone):Future[Boolean] = {
    GlanceZone.collection.insert(t).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert: "+t.glanceOrgId+" floorId:"+t.floorId+"with zoneId:"+t.zoneId +" zoneName:"+t.zoneName)
        true
      case _ =>
        Logger.error("Failed to insert: "+t.glanceOrgId+" floorId:"+t.floorId+"with zoneId:"+t.zoneId +" zoneName:"+t.zoneName)
        false
    }
  }

  def addOrUpdate(conf:GlanceZone):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID-> conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId, {
      if(conf.zoneName!="")
        (ComUtils.CONST_PROPERTY_ZONENAME -> conf.zoneName)
      else
        (ComUtils.CONST_PROPERTY_ZONEID -> conf.zoneId)
    })
    val querySysZone = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE ->true,ComUtils.CONST_PROPERTY_ZONENAME ->conf.zoneName)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceZone.collection.name,Some(existQuery)))
    for{
       existCountSys <-findExistCount(querySysZone)
       existCount <-findExistCount(query)
       bRet <- {
         if(conf.systemZone)
           addOrUpdateSysZone(existCountSys, conf)
         else
           addOrUpdate(existCount, conf)
       }
    }yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(ComUtils.getCredential(orgId=conf.glanceOrgId)) //fixme
      }
      bRet
    }
  }

  def addOrUpdateSysZone(existCount:Int,conf:GlanceZone):Future[Boolean] = {
    if(existCount >0) {
      updateSysZone(conf)
    }else{
      Logger.error("Failed to add system zone record by manually from GlanceAPI")
      Future{false}
    }

  }

  def updateSysZone(conf:GlanceZone):Future[Boolean] = {

    GlanceZone.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE ->true,ComUtils.CONST_PROPERTY_ZONENAME -> conf.zoneName),
      Json.obj("$set" -> {
          var obj:JsObject = Json.obj(ComUtils.CONST_PROPERTY_TAGS -> conf.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis())
          if(conf.zoneDisplayName!="")
            obj += (ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> JsString(conf.zoneDisplayName))
          if(GlanceZone.rgbColorToRRGGBB(conf.color)!="#000000")
            obj += (ComUtils.CONST_PROPERTY_COLOR -> JsString(GlanceZone.rgbColorToRRGGBB(conf.color)))
          obj += (ComUtils.CONST_PROPERTY_ZONEENABLED -> JsBoolean(conf.zoneEnabled))
          obj += (ComUtils.CONST_PROPERTY_TEMPORARY -> JsBoolean(conf.temporary))
          obj
        }
      )).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" zoneId:"+conf.zoneId+ " with zoneName:"+conf.zoneName)
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(ComUtils.getCredential(orgId=conf.glanceOrgId)) //fixme
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" zoneId:"+conf.zoneId+ " with zoneName:"+conf.zoneName)
        false
    }
  }


  def addOrUpdate(existCount:Int,glanceZone:GlanceZone):Future[Boolean] ={

    if(existCount >0) {
      update(glanceZone)
    }else{
      insert(glanceZone)
    }
  }

  def updateTemporaryZones(credential:GlanceCredential,temporaryZones:List[GlanceZone]):Future[Boolean]={
    //check if already exists...
    def checkNeedUpdate(temporaryZones:List[GlanceZone],dbTempZones:List[GlanceZone]):Boolean={
      val floors = temporaryZones.map(p => p.floorId).distinct
      floors.map{ floorId =>
        val zones = temporaryZones.filter(p => p.floorId.compareToIgnoreCase(floorId) ==0).map(p =>p.zoneId)
        val dbZones =dbTempZones.filter(p => p.floorId.compareToIgnoreCase(floorId) ==0).map(p => p.zoneId)
        if(zones.length != dbZones.length)
          return true
        val diff =zones.diff(dbZones)
        if(diff.length>0)
          return true
      }
      return false
    }

    for{
      allZones <- readAllConf(credential)
      bNeedUpdate <- Future{ checkNeedUpdate(temporaryZones,allZones.filter(p => p.temporary==true))}
      bUpdated <-{
        if(bNeedUpdate){
          for{
            bDelete <- deleteAllTempZones(temporaryZones)
            (bInsert,count) <- insertTemporaryZones(temporaryZones)
          }yield{
            if(bDelete || bInsert)
              sendCacheSyncMessage(ComUtils.getCredential(orgId=ComUtils.getCredential().glanceOrgId)) //fixme
            bInsert
          }
        }else
          Future{true}
      }
    }yield{
      bUpdated
    }
  }

  def deleteAllTempZones(temporaryZones:List[GlanceZone]):Future[Boolean]={
    val floors = temporaryZones.map(p => p.floorId).distinct
    if(floors.length<=0)
      Future{false}
    else{
      GlanceZone.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> Json.obj("$in" -> floors),"temporary" -> true )).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete temporary zones,floorId:"+ floors.mkString(";"))
          GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
          true
        case _ =>
          Logger.error("Failed to delete temporary zones,floorId:"+ floors.mkString(";"))
          false
      }
    }
  }

  def insertTemporaryZones(temporaryZones:List[GlanceZone]):Future[(Boolean,Int)]={
    val tempCheckedZone = temporaryZones.map(_.copy(temporary = true))
    if(temporaryZones.length>0){
      val enumerator = Enumerator.enumerate(tempCheckedZone)
      collection.bulkInsert(enumerator).map { nCount =>
        Logger.debug("Succeeded to insert new added temporary zones" + (new Date()).toString + " count:" + nCount)
        if (nCount > 0)
          (true,nCount)
        else
          (false,0)
      }.recover{
        case _=>
          Logger.error("Failed to insert the tempory zones by batch")
          (false,0)
      }
    }else{
      Future{(true,0)}
    }
  }

  def update(conf:GlanceZone):Future[Boolean] = {
    GlanceZone.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> conf.floorId,{
        if(conf.zoneName!="")
          (ComUtils.CONST_PROPERTY_ZONENAME ->conf.zoneName)
        else
          (ComUtils.CONST_PROPERTY_ZONEID ->conf.zoneId)
      }),
      Json.obj("$set" -> {
          var obj:JsObject =Json.obj(ComUtils.CONST_PROPERTY_TAGS -> conf.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis())
          if(conf.zoneDisplayName!="")
            obj += (ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> JsString(conf.zoneDisplayName))
          if(GlanceZone.rgbColorToRRGGBB(conf.color)!="#000000")
            obj += (ComUtils.CONST_PROPERTY_COLOR -> JsString(GlanceZone.rgbColorToRRGGBB(conf.color)))
          else{
            obj += (ComUtils.CONST_PROPERTY_COLOR -> JsString(GlanceZone.rgbColorToRRGGBB(GlanceZone.randomRGBColor())))
          }
          obj += (ComUtils.CONST_PROPERTY_ZONEENABLED -> JsBoolean(conf.zoneEnabled))
          obj += (ComUtils.CONST_PROPERTY_TEMPORARY -> JsBoolean(conf.temporary))

          if(conf.zone.zoneCoordinate.length>0){
            obj += (ComUtils.CONST_PROPERTY_ZONE -> Json.toJson(conf.zone.copy(name={
              if(conf.zoneName!="")
                conf.zoneName
              else
                conf.zone.name
            })))
          }
          obj
        }
      )
    ).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" zoneId:"+conf.zoneId+ " with zoneName:"+conf.zoneName)
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId"+conf.glanceOrgId+" floorId:"+conf.floorId+" zoneId:"+conf.zoneId+ " with zoneName:"+conf.zoneName)
        false
    }
  }

  def delete(conf:GlanceZone): Future[Boolean] = {
    GlanceZone.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID->conf.floorId,"zoneId" ->conf.zoneId)).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to delete: "+conf.glanceOrgId +" floorId:"+conf.floorId+" zoneId:"+conf.zoneId)
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(ComUtils.getCredential(orgId=conf.glanceOrgId)) //fixme
        true
      case _ =>
        Logger.error("Failed to delete: "+conf.glanceOrgId +" floorId:"+conf.floorId+" zoneId:"+conf.zoneId)
        false
    }
  }

  def readAllConf(credential: GlanceCredential):Future[List[GlanceZone]]={
    readAllConf(credential.glanceOrgId)
  }

  def readAllConf(glanceOrgId:String):Future[List[GlanceZone]] ={
    val findByOrgUserId  = (org: String) => GlanceZone.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> 1,ComUtils.CONST_PROPERTY_ZONENAME -> 1)).cursor[GlanceZone].collect[List]();

    val optZones =GlanceSyncCache.getGlanceCache[List[GlanceZone]](CACHE_NAME)
    if(optZones.isDefined) {
      Future { optZones.get }
    }else {
      try {
          findByOrgUserId(glanceOrgId).map { listObject =>
            if (listObject.length > 0)
              GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,listObject)
            else
              GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
            Logger.debug("Read Glance zones count:" + listObject.length)
            listObject
          }.recover {
            case _ =>
              Logger.error("Read Glance zones failed, unknown exception!")
              GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
              List()
          }
      } catch {
        case exp:Throwable =>
          Logger.error("Read Glance zones failed, exception:{}",exp.getMessage)
          Future{List()}
      }
    }
  }

  def readAllConfByFloors(glanceOrgId:String,floorId:String,floors:List[GlanceTrackFloor]):Future[Map[GlanceTrackFloor,List[GlanceZone]]] ={

    if(floorId.length == 0){
      readAllConf(glanceOrgId).map{zones=>
        var map = Map[GlanceTrackFloor,List[GlanceZone]]()
        for(floor <- floors){
          map += (floor -> zones.filter(p => p.floorId == floor.floorId).toList)
        }
        map
      }
    }else {
      for {
        zones <- readAllConf(glanceOrgId)
        floorForFloorId <- GlanceTrackFloor.readFloorInfoByIdOrName(glanceOrgId,floorId)
      } yield {
        var singleMap = Map[GlanceTrackFloor,List[GlanceZone]]()
        singleMap += ( floorForFloorId -> zones.filter(p => p.floorId ==floorForFloorId.floorId).toList)
        singleMap
      }
    }
  }


  def readAllConfByFloor(glanceOrgId:String,floorId:String):Future[List[GlanceZone]] ={
    readAllConf(glanceOrgId).map{zones =>
      zones.filter(p => p.floorId ==floorId)
    }
  }

  def readConf(glanceOrgId:String,floorId:String,zoneId:String):Future[Option[GlanceZone]] ={
    readAllConf(glanceOrgId).map{ zones =>
      val tmpZones =zones.filter(p => (p.floorId ==floorId && (p.zoneId==zoneId || p.zoneName==zoneId || p.zone.name==zoneId)))
      if(tmpZones.length>0)
        Some(tmpZones(0))
      else
        None
    }
  }

  def readConfByNameId(glanceOrgId:String,zoneNameId:String):Future[Option[GlanceZone]] ={
    def checkEqual(val1:String,val2:String):Boolean={
      try{
        (val1.compareToIgnoreCase(val2)==0)
      }catch {
        case exp:Throwable =>
          false
      }
    }
    readAllConf(glanceOrgId).map{zones =>
      val tmpZones =zones.filter(p => p.floorId!="" && (checkEqual(p.zoneId,zoneNameId) || checkEqual(p.zoneName,zoneNameId) || checkEqual(p.zoneDisplayName,zoneNameId) || checkEqual(p.zone.name,zoneNameId)))
      if(tmpZones.length>0)
        Some(tmpZones(0))
      else
        None
    }
  }

  def updateLabelPosition(credential:GlanceCredential,floorId:String,matchZone:GlanceZone,position:MapCoordinate):Future[Boolean]={
    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId,"zone.name" -> matchZone.zoneName),
      Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_LABELPOSITION -> Json.toJson(position),ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+credential.glanceOrgId+" floorId:"+floorId+" for zone:"+matchZone.zone.name+" with position:"+Json.toJson(position))
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
        sendCacheSyncMessage(credential) //fixme
        true
      case _ =>
        Logger.error("Failed to updated: glanceOrgId"+credential.glanceOrgId+" floorId:"+floorId+" for zone:"+matchZone.zone.name+" with position:"+Json.toJson(position))
        false
    }

  }
  def addOrUpdateSystemZone(existCount:Int, credential: GlanceCredential,fId:String,cmxZone:Zone,defaultColor:String,systemZone:Boolean=true):Future[Boolean]={

    def zoneIsPointOrLine(zone:Zone):Boolean={
      if(zone.zoneCoordinate.length>1){
        !(zone.zoneCoordinate.map(p =>p.x+"."+p.y).distinct.length>=3)
      }else
        true
    }
    def updateSystemZoneInfo(cred: GlanceCredential,floorId:String,zone:Zone,sysZone:Boolean):Future[Boolean]={
      GlanceZone.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->cred.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE -> sysZone,"zone.name" -> zone.name),
        if(zoneIsPointOrLine(zone))
          Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_ZONE -> Json.toJson(zone),ComUtils.CONST_PROPERTY_SYSTEMZONE -> true,ComUtils.CONST_PROPERTY_ZONEENABLED ->false,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))
        else
          Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_ZONE -> Json.toJson(zone),ComUtils.CONST_PROPERTY_SYSTEMZONE -> true,ComUtils.CONST_PROPERTY_ZONEENABLED ->true,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))
      ).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to update: glanceOrgId"+cred.glanceOrgId+" floorId:"+floorId+" with zone:"+Json.toJson(zone))
          GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
          sendCacheSyncMessage(credential) //fixme
          true
        case _ =>
          Logger.error("Failed to updated system zone to Glance Zone: glanceOrgId"+cred.glanceOrgId+" floorId:"+floorId+" with zone:"+Json.toJson(zone))
          false
      }
    }

    if(existCount>0){
      updateSystemZoneInfo(credential,fId,cmxZone,systemZone)
    }else{
      val tmpZone =new GlanceZone(glanceOrgId = credential.glanceOrgId,
                                  glanceUserId = credential.glanceUserId,
                                  floorId=fId,
                                  zoneName =cmxZone.name,
                                  zoneDisplayName =cmxZone.name,
                                  zone=cmxZone.copy(),
                                  zoneEnabled = (!zoneIsPointOrLine(cmxZone)),
                                  color =GlanceZone.rrggbbToRGBColor(defaultColor),
                                  systemZone = true)
      insert(tmpZone)
    }
  }

  def updateSystemZone(credential: GlanceCredential,floorId:String,cmxZone:Zone,defaultColor:String):Future[Boolean]={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE ->true,"zone.name" ->cmxZone.name)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceZone.collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdateSystemZone(existCount,credential,floorId,cmxZone,defaultColor,true)
    }yield bRet
  }

  def updateSystemZones(credential:GlanceCredential,floorId:String,cmxZones:List[Zone]):Future[Boolean]={
    //mark all unmatched system zones as disabled
    def markUnmatchedZoneDisabled(cred:GlanceCredential,fId:String,zones:List[Zone]):Future[Boolean]={
      GlanceZone.collection.update({
        if(cmxZones.length>0)
          Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->cred.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE -> true, "zone.name" ->Json.obj("$nin" ->ComUtils.getJsonArrayStr(zones.map(z => z.name))))
        else
          Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->cred.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE -> true)
      },
        Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_ZONEENABLED -> false,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis())),multi = true).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to update all unmatched zones to disabled"+cred.glanceOrgId+" floorId:"+floorId+" with zones:"+ComUtils.getJsonArrayStr(zones.map(z =>z.name)))
          true
        case _ =>
          Logger.error("Failed to update all unmatched zones to disabled"+cred.glanceOrgId+" floorId:"+floorId+" with zones:"+ComUtils.getJsonArrayStr(zones.map(z =>z.name)))
          false
      }
    }

    def getDefaultColor(cred:GlanceCredential,fid:String,zone:Zone,defaultColors:List[String]):Future[String]= {
      def filterContainedZones(glanceZones:List[GlanceZone]):List[GlanceZone]={
        val toRemoveList:mutable.MutableList[String]=mutable.MutableList[String]()

        for(cl <- 0 to glanceZones.length-1){
            for(cl2 <- cl+1 to glanceZones.length-1)
            {
              val polyCl =glanceZones(cl).zone.zoneCoordinate.map( zc => GlanceLoc(zc.x,zc.y))
              val polyCl2=glanceZones(cl2).zone.zoneCoordinate.map(zc => GlanceLoc(zc.x,zc.y))
              if(ComUtils.isPolygonInPolygon(polyCl,polyCl2))
                toRemoveList += glanceZones(cl2).zone.name
              else if(ComUtils.isPolygonInPolygon(polyCl2,polyCl))
                toRemoveList += glanceZones(cl).zone.name
            }
        }
        if(toRemoveList.length>0){
          glanceZones.filter(p => !toRemoveList.contains(p.zone.name))
        }else{
          glanceZones
        }
      }
      def zoneOverlapped(gZone:GlanceZone,zone:Zone):Boolean= {
        var bOverlapped:Boolean =false
        val polygon:List[GlanceLoc] =zone.zoneCoordinate.map(zc => GlanceLoc(zc.x,zc.y))
        for(cl <- 0 to gZone.zone.zoneCoordinate.length-1) {
            bOverlapped =bOverlapped || ComUtils.isPointInPolygon(polygon,GlanceLoc(gZone.zone.zoneCoordinate(cl).x,gZone.zone.zoneCoordinate(cl).y))
        }
        bOverlapped
      }

      def northColors(allZones:List[GlanceZone],zone:Zone):List[String]={
        val colors = allZones.filter(p => {
          var bFilterY:Boolean=false
          var bFilterX:Boolean=false
          val xMax =zone.zoneCoordinate.map(zc =>zc.x).max
          val xMin =zone.zoneCoordinate.map(zc =>zc.x).min
          val yMin =zone.zoneCoordinate.map(zc =>zc.y).min
          for(mapCoordinate <- p.zone.zoneCoordinate)
          {
            bFilterY = bFilterY || (mapCoordinate.y <= yMin)
            bFilterX = bFilterX || (mapCoordinate.x >= xMin  && mapCoordinate.x <= xMax)
          }
          bFilterX && bFilterY && p.zone.name !=zone.name
        })

        val overlappedZones =colors.filter(p => zoneOverlapped(p,zone))
        var noneOverlappedZones =filterContainedZones(colors.filter(p => !zoneOverlapped(p,zone)))
        if(noneOverlappedZones.length>0){
          noneOverlappedZones=noneOverlappedZones.sortWith((leftE,rightE) =>{
            var xMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).min
            var xMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).min
            if(xMinLeftE < zone.zoneCoordinate.map(zc=> zc.x).min)
              xMinLeftE=zone.zoneCoordinate.map(zc=> zc.x).min
            if(xMinRightE < zone.zoneCoordinate.map(zc=> zc.x).min)
              xMinRightE=zone.zoneCoordinate.map(zc=> zc.x).min

            var xMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).max
            var xMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).max
            if(xMaxLeftE > zone.zoneCoordinate.map(zc=> zc.x).max)
              xMaxLeftE=zone.zoneCoordinate.map(zc=> zc.x).max
            if(xMaxRightE < zone.zoneCoordinate.map(zc=> zc.x).max)
              xMaxRightE=zone.zoneCoordinate.map(zc=> zc.x).max

            val yMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).max
            val yMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).max

            if(yMaxLeftE>yMaxRightE){
              true
            }else if(yMaxLeftE < yMaxRightE)
              false
            else{
              (xMaxLeftE - xMinLeftE) > (xMaxRightE - xMinRightE)
            }
          })
          noneOverlappedZones =List(noneOverlappedZones(0))
        }

        (noneOverlappedZones ::: overlappedZones).map(nc => GlanceZone.rgbColorToRRGGBB(nc.color))
      }

      def southColors(allzones:List[GlanceZone],zone:Zone):List[String]={
        val colors = allzones.filter(p => {
          var bFilterY:Boolean=false
          var bFilterX:Boolean=false
          val xMax =zone.zoneCoordinate.map(zc =>zc.x).max
          val xMin =zone.zoneCoordinate.map(zc =>zc.x).min
          val yMin =zone.zoneCoordinate.map(zc =>zc.y).min
          for(cn <-0 to p.zone.zoneCoordinate.length-1)
          {
            bFilterY = bFilterY || (p.zone.zoneCoordinate(cn).y >= yMin)
            bFilterX = bFilterX || (p.zone.zoneCoordinate(cn).x >= xMin  && p.zone.zoneCoordinate(cn).x <= xMax)
          }
          bFilterX && bFilterY && p.zone.name !=zone.name
        })
        val overlappedZones =colors.filter(p => zoneOverlapped(p,zone))
        var noneOverlappedZones =filterContainedZones(colors.filter(p => !zoneOverlapped(p,zone)))
        if(noneOverlappedZones.length>0){
          noneOverlappedZones=noneOverlappedZones.sortWith((leftE,rightE) =>{
            var xMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).min
            var xMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).min
            if(xMinLeftE < zone.zoneCoordinate.map(zc=> zc.x).min)
              xMinLeftE=zone.zoneCoordinate.map(zc=> zc.x).min
            if(xMinRightE < zone.zoneCoordinate.map(zc=> zc.x).min)
              xMinRightE=zone.zoneCoordinate.map(zc=> zc.x).min

            var xMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).max
            var xMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).max
            if(xMaxLeftE > zone.zoneCoordinate.map(zc=> zc.x).max)
              xMaxLeftE=zone.zoneCoordinate.map(zc=> zc.x).max
            if(xMaxRightE < zone.zoneCoordinate.map(zc=> zc.x).max)
              xMaxRightE=zone.zoneCoordinate.map(zc=> zc.x).max

            val yMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).min
            val yMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).min

            if(yMinLeftE < yMinRightE){
              true
            }else if(yMinLeftE > yMinRightE)
              false
            else{
              (xMaxLeftE - xMinLeftE) > (xMaxRightE - xMinRightE)
            }
          })
          noneOverlappedZones =List(noneOverlappedZones(0))
        }

        (noneOverlappedZones ::: overlappedZones).map(nc => GlanceZone.rgbColorToRRGGBB(nc.color))
      }

      def westColors(allzones:List[GlanceZone],zone:Zone):List[String]={
        val colors = allzones.filter(p => {
          var bFilterY:Boolean=false
          var bFilterX:Boolean=false
          val yMax =zone.zoneCoordinate.map(zc =>zc.y).max
          val yMin =zone.zoneCoordinate.map(zc =>zc.y).min
          val xMin =zone.zoneCoordinate.map(zc =>zc.x).min
          for(cn <-0 to p.zone.zoneCoordinate.length-1)
          {
            bFilterX = bFilterX || (p.zone.zoneCoordinate(cn).x <= xMin)
            bFilterY = bFilterY || (p.zone.zoneCoordinate(cn).y >= yMin  && p.zone.zoneCoordinate(cn).y <= yMax)
          }
          bFilterX && bFilterY && p.zone.name !=zone.name
        })

        val overlappedZones =colors.filter(p => zoneOverlapped(p,zone))
        var noneOverlappedZones =filterContainedZones(colors.filter(p => !zoneOverlapped(p,zone)))

        if(noneOverlappedZones.length>0){
          noneOverlappedZones=noneOverlappedZones.sortWith((leftE,rightE) =>{
            var yMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).min
            var yMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).min
            if(yMinLeftE < zone.zoneCoordinate.map(zc=> zc.y).min)
              yMinLeftE=zone.zoneCoordinate.map(zc=> zc.y).min
            if(yMinRightE < zone.zoneCoordinate.map(zc=> zc.y).min)
              yMinRightE=zone.zoneCoordinate.map(zc=> zc.y).min

            var yMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).max
            var yMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).max
            if(yMaxLeftE > zone.zoneCoordinate.map(zc=> zc.y).max)
              yMaxLeftE=zone.zoneCoordinate.map(zc=> zc.y).max
            if(yMaxRightE < zone.zoneCoordinate.map(zc=> zc.y).max)
              yMaxRightE=zone.zoneCoordinate.map(zc=> zc.y).max

            val xMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).max
            val xMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).max

            if(xMaxLeftE>xMaxRightE){
              true
            }else if(xMaxLeftE < xMaxRightE)
              false
            else{
              (yMaxLeftE - yMinLeftE) > (yMaxRightE - yMinRightE)
            }
          })
          noneOverlappedZones =List(noneOverlappedZones(0))
        }

        (noneOverlappedZones ::: overlappedZones).map(nc => GlanceZone.rgbColorToRRGGBB(nc.color))
      }

      def eastColors(allzones:List[GlanceZone],zone:Zone):List[String]={
        val colors = allzones.filter(p => {
          var bFilterY:Boolean=false
          var bFilterX:Boolean=false
          val yMax =zone.zoneCoordinate.map(zc =>zc.y).max
          val yMin =zone.zoneCoordinate.map(zc =>zc.y).min
          val xMax =zone.zoneCoordinate.map(zc =>zc.x).max
          for(mapCoordinate <- p.zone.zoneCoordinate)
          {
            bFilterX = bFilterX || (mapCoordinate.x >= xMax)
            bFilterY = bFilterY || (mapCoordinate.y >= yMin  && mapCoordinate.y <= yMax)
          }
          bFilterX && bFilterY && p.zone.name !=zone.name
        })

        val overlappedZones =colors.filter(p => zoneOverlapped(p,zone))
        var noneOverlappedZones =filterContainedZones(colors.filter(p => !zoneOverlapped(p,zone)))

        if(noneOverlappedZones.length>0){
          noneOverlappedZones=noneOverlappedZones.sortWith((leftE,rightE) =>{
            var yMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).min
            var yMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).min
            if(yMinLeftE < zone.zoneCoordinate.map(zc=> zc.y).min)
              yMinLeftE=zone.zoneCoordinate.map(zc=> zc.y).min
            if(yMinRightE < zone.zoneCoordinate.map(zc=> zc.y).min)
              yMinRightE=zone.zoneCoordinate.map(zc=> zc.y).min

            var yMaxLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.y).max
            var yMaxRightE =rightE.zone.zoneCoordinate.map(zc=> zc.y).max
            if(yMaxLeftE > zone.zoneCoordinate.map(zc=> zc.y).max)
              yMaxLeftE=zone.zoneCoordinate.map(zc=> zc.y).max
            if(yMaxRightE < zone.zoneCoordinate.map(zc=> zc.y).max)
              yMaxRightE=zone.zoneCoordinate.map(zc=> zc.y).max

            val xMinLeftE =leftE.zone.zoneCoordinate.map(zc=> zc.x).min
            val xMinRightE =rightE.zone.zoneCoordinate.map(zc=> zc.x).min

            if(xMinLeftE < xMinRightE){
              true
            }else if(xMinLeftE > xMinLeftE)
              false
            else{
              (yMaxLeftE - yMinLeftE) > (yMaxRightE - yMinRightE)
            }
          })
          noneOverlappedZones =List(noneOverlappedZones(0))
        }

        (noneOverlappedZones ::: overlappedZones).map(nc => GlanceZone.rgbColorToRRGGBB(nc.color))
      }

      for{
        uRet <- Future{
          cleanCache(cred)
          sendCacheSyncMessage(cred)
        }
        allZones <- readAllConfByFloor(cred.glanceOrgId,fid)
      }yield{
        val nColors=northColors(allZones,zone)
        val sColors=southColors(allZones,zone)
        val wColors=westColors(allZones,zone)
        val eColors=eastColors(allZones,zone)
        val filterColors =nColors ::: sColors  ::: wColors ::: eColors
        //filter all the colors...
        val selectedColors =defaultColors.filter( pc => !(filterColors.indexOf(pc) >=0))
        if(selectedColors.length>0)
          selectedColors(0)
        else
          GlanceZone.rgbColorToRRGGBB(GlanceZone.randomRGBColor())
      }
    }

    //update system zones from cmx
    def updateZone(cred:GlanceCredential,fid:String,cmxZone:Zone): Future[Boolean]={
      for{
        defaultColors <- GlanceZoneColor.readAllDefaultColors(credential)
        color <- Future{
          if(defaultColors.length>0)
             defaultColors(0)
          else
            GlanceZone.rgbColorToRRGGBB(GlanceZone.randomRGBColor())
        }
        bUpdate <- updateSystemZone(credential,floorId,cmxZone,color)
      } yield{
        bUpdate
      }
    }
    val p = Promise[Boolean]
    val fUpdateZones = p.future
    Future{
      val iIndex:Int =0
      def updateNext(cred:GlanceCredential,fId:String,zones:List[Zone],nIndex:Int):Unit={
        updateZone(credential,fId,zones(nIndex)).map { bUpdate =>
          Logger.debug("update Zone Info completed:"+bUpdate)
          if(nIndex< zones.length-1)
            updateNext(cred,fId,zones,nIndex+1)
          else
            p.success(true)
        }.recover{
          case _=>
            if(nIndex< zones.length-1)
              updateNext(cred,fId,zones,nIndex+1)
            else
              p.success(true)
        }
      }
      if(cmxZones.length<=0)
        p.success(true)
      else
         updateNext(credential,floorId,cmxZones,iIndex)
    }

    for{
      bMaskDisabled <-markUnmatchedZoneDisabled(credential,floorId,cmxZones)
      bSuccess <- fUpdateZones
    }yield{
      bSuccess || bMaskDisabled
    }
  }

  def deleteAllSysZones(credential: GlanceCredential):Future[Boolean]={
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_SYSTEMZONE ->true)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" for all system zones")
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete: "+credential.glanceOrgId +" for all system zones")
        false
    }.recover{
      case _ =>
        Logger.error("Exception, failed to delete: "+credential.glanceOrgId +" for all system zones")
        false
    }
  }

  def disableAllNonCMXSystemZones(credential: GlanceCredential,noneCMXFloors:List[GlanceTrackFloor]):Future[Boolean]={
    if(noneCMXFloors.length<=0) {
      Future{true}
    }else{
      try{
        GlanceZone.collection.update(
          Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_SYSTEMZONE -> true, ComUtils.CONST_PROPERTY_FLOORID ->Json.obj("$in" ->ComUtils.getJsonArrayStr(noneCMXFloors.map(z => z.floorId)))),
          Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_ZONEENABLED -> false,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis())),multi = true).map {
          case LastError(true, _, _, _, _, _, _) =>
            Logger.debug("Succeeded to disable all none cmx floor zones:"+credential.glanceOrgId+" floors:"+noneCMXFloors.map(z => z.floorId).mkString(";"))
            true
          case _ =>
            Logger.error("Failed to disable all none cmx floor zones:"+credential.glanceOrgId+" floors:"+noneCMXFloors.map(z => z.floorId).mkString(";"))
            false
        }
      }catch {
        case exp:Throwable =>
          Logger.error("Exception, failed to disable no more CMX zones: "+credential.glanceOrgId +" for all system zones, exception:{}",exp.getMessage)
          Future{false}
      }
    }
  }

  def updateAllSysZones(credential: GlanceCredential):Future[Boolean]={

    for{
      floors <- {
        GlanceTrackCampus.readDefaultCampusFloors(credential)
      }

      cmxFloors <- {
        val tmpFloors= floors.filter(p => ComUtils.isCmxServiceType(p.cmxServiceType) && ComUtils.isCorrectHierarchy(p.hierarchy))
        if(tmpFloors.length>0)
          GlanceHistory.readAllMapInfo(credential)
        else
          Future{List()}
      }
      mapSizes <-{
        GlanceMapSizeInfo.readAllConf(credential)
      }
      bDisableAllNonCMXFloorZones <-{
        val noneCMXFloors   =floors.filter(p =>p.hierarchy!="" && !(ComUtils.isCmxServiceType(p.cmxServiceType)&&ComUtils.isCorrectHierarchy(p.hierarchy)))
        disableAllNonCMXSystemZones(credential,noneCMXFloors)
      }
      bUpdateSysZones <- {
        val hierarchyFloors =floors.filter(p =>p.hierarchy!="" && ComUtils.isCmxServiceType(p.cmxServiceType) && ComUtils.isCorrectHierarchy(p.hierarchy))
        val p = Promise[Boolean]
        val f = p.future
        Future{
          val completed =new java.util.concurrent.atomic.AtomicLong()
          for(cl <-0 to hierarchyFloors.length-1){
            val floor =hierarchyFloors(cl)
            val matchFloors =cmxFloors.filter(p => p.hierarchyName==floor.hierarchy)
            if(matchFloors.length>0){
              val tmpZones =matchFloors(0).zones.map(zn => {
                  zn.copy(zoneCoordinate = zn.zoneCoordinate.map(zc => {
                    val (_, positionArray) =NotificationService.getPositionArr(zc,floor,null,mapSizes)
                    new MapCoordinate(positionArray(0),positionArray(1),zc.z,zc.unit)
                  } ))
                }
              ).filter(zn => zn.zoneType =="ZONE")
              GlanceZone.updateSystemZones(credential,floor.floorId,tmpZones).map{ bUpdate =>
                val tmpCompleted =completed.incrementAndGet()
                if(tmpCompleted >=hierarchyFloors.length)
                  p.success(true)
              }.recover{
                case _=>
                  val tmpCompleted =completed.incrementAndGet()
                  if(tmpCompleted>=hierarchyFloors.length)
                    p.success(true)
              }
            }else{
              val tmpCompleted =completed.incrementAndGet()
              if(tmpCompleted >= hierarchyFloors.length)
                p.success(true)
            }
          }
          if(hierarchyFloors.length<=0)
            p.success(true)
        }
        f.map{ bSuccess =>
          bSuccess
        }.recover{
          case _=>
            Logger.error("Exception, failed to wait all zones to be updated!")
            false
        }
      }
      bUpdateCache <- Future{
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      }
    }yield {
      bUpdateSysZones
    }
  }

  def deleteZone(credential:GlanceCredential,floorId:String,zoneName:String):Future[Boolean]={
    val listQuery:MutableList[JsObject] = MutableList[JsObject](Json.obj("zone.name" -> zoneName),Json.obj(ComUtils.CONST_PROPERTY_ZONENAME -> zoneName),Json.obj(ComUtils.CONST_PROPERTY_ZONEID -> zoneName))
    try{
      collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID-> floorId,ComUtils.CONST_PROPERTY_SYSTEMZONE ->false,"$or" ->listQuery)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" floorId:"+floorId+" zoneName:"+zoneName)
          GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete: "+credential.glanceOrgId +" floorId:"+floorId+" zoneName:"+zoneName)
          false
      }.recover{
        case _ =>
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Exception, failed to delete zone, floorId:{},zoneName:{}, exception:{}",floorId,zoneName,exp.getMessage)
        Future{false}
    }


  }

  def deleteZoneByFloor(credential:GlanceCredential,floorId:String):Future[Boolean]={
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID-> floorId,"systemZone" ->false)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        false
    }.recover{
      case _ =>
        Logger.error("Exception, failed to delete: "+credential.glanceOrgId +" floorId:"+floorId)
        false
    }

  }


  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
  }

  def updateZonesCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={

    def readAndSet():Future[Boolean]={
      readAllConf(credential.glanceOrgId).map{zones =>
        if(zones==null || zones.size<=0)
          GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceZone]](CACHE_NAME,zones)
        true
      }
    }
    if(bCheckExists){
      val optZones =GlanceSyncCache.getGlanceCache[List[GlanceZone]](CACHE_NAME)
      if(optZones.isDefined){
        Future{true}
      }else
        readAndSet
    }else{
      readAndSet
    }
  }

  def updateSystemZoneLabelPosition(credential: GlanceCredential,floorId:String,zoneName:String,position:MapCoordinate):Future[Boolean]={
    for{
      allZones <- readAllConf(credential)
      matchZone <- Future{
        var zones =allZones.filter(p => (p.zoneName == zoneName || p.zone.name == zoneName || p.zoneId == zoneName))
        if(floorId!="")
          zones =zones.filter( p => p.floorId==floorId)
        if(zones.length>0)
          zones(0)
        else
          null
      }
      bUpdateLabelPosition <- {
        if(matchZone==null)
          Future{false}
        else
          updateLabelPosition(credential,floorId,matchZone,position)
      }
    }yield{
      bUpdateLabelPosition
    }
  }
}
