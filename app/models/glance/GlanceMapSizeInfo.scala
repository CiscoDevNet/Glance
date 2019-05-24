package models.glance

import services.cisco.database.GlanceDBService
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import reactivemongo.bson._
import services.security.GlanceCredential
import scala.collection.mutable
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._

/**
 * Created by kennych on 9/6/16.
 */

case class GlanceMapSizeInfo( glanceOrgId:String="",
                          glanceUserId:String="",
                          mapName:String,x:Double=0.0,
                          y:Double=0.0, width:Double=0.0,
                          height:Double=0.0,
                          extraInfo:JsValue=Json.obj(),
                          created:Long=System.currentTimeMillis(),
                          updated:Long=System.currentTimeMillis())

object GlanceMapSizeInfo {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceMapSizeInfo")
  val CACHE_NAME="glanceMapSizeInfo"
  implicit val tolerantGlanceMapInfoReaders = new Reads[GlanceMapSizeInfo] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceMapSizeInfo(
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(ComUtils.getTenantUserId()),
          (js \ ComUtils.CONST_PROPERTY_MAPNAME).as[String],
          (js \ "x").asOpt[Double].getOrElse(0.0),
          (js \ "y").asOpt[Double].getOrElse(0.0),
          (js \ "width").asOpt[Double].getOrElse(0.0),
          (js \ "height").asOpt[Double].getOrElse(0.0),
          (js \ "extraInfo").asOpt[JsValue].getOrElse(Json.obj()),
          (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val glanceMapInfoWrites = new Writes[GlanceMapSizeInfo] {
    def writes(z: GlanceMapSizeInfo): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "x" -> z.x,
        "y" -> z.y,
        "width" -> z.width,
        "height" -> z.height,
        "extraInfo" -> z.extraInfo,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  val glanceMapInfoFormat = Format(tolerantGlanceMapInfoReaders, glanceMapInfoWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit ={
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_MAPINFO_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(mapSizeInfo: GlanceMapSizeInfo) :Future[Boolean]= {
    this.collection.insert(mapSizeInfo).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully insert:  glanceOrgId:"+mapSizeInfo.glanceOrgId+" mapName:"+mapSizeInfo.mapName+"with x:"+mapSizeInfo.x+" y:"+mapSizeInfo.y+" width:"+mapSizeInfo.width+" height:"+mapSizeInfo.height)
        true
      case _ =>
        Logger.error("Failed to insert:  glanceOrgId:"+mapSizeInfo.glanceOrgId+" mapName:"+mapSizeInfo.mapName+"with x:"+mapSizeInfo.x+" y:"+mapSizeInfo.y+" width:"+mapSizeInfo.width+" height:"+mapSizeInfo.height)
        false
    }

  }

  def addOrUpdate(mapSizeInfo:GlanceMapSizeInfo,bForce:Boolean=false):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> mapSizeInfo.glanceOrgId,ComUtils.CONST_PROPERTY_MAPNAME -> mapSizeInfo.mapName)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,mapSizeInfo,bForce)
    }yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,null)
        sendCacheSyncMessage(ComUtils.getCredential())
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,conf:GlanceMapSizeInfo,bForce:Boolean):Future[Boolean] ={

    if(existCount >0) {
      update(conf,bForce)
    }else {
      insert(conf)
    }
  }

  def update(conf:GlanceMapSizeInfo,bForce:Boolean=false):Future[Boolean] = {
    def copySetValues(z:GlanceMapSizeInfo):JsValue ={
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "x" -> z.x,
        "y" -> z.y,
        "width" -> z.width,
        "height" -> z.height,
        "extraInfo" -> z.extraInfo,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_MAPNAME -> conf.mapName),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+conf.glanceOrgId+" mapName:"+conf.mapName+" with x:"+conf.x+" y:"+conf.y+" width:"+conf.width+" height:"+conf.height)
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId"+conf.glanceOrgId+" mapName:"+conf.mapName+" with x:"+conf.x+" y:"+conf.y+" width:"+conf.width+" height:"+conf.height)
        false
    }
  }

  def delete(credential: GlanceCredential, mapName:String): Future[Boolean] = {
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_MAPNAME-> mapName)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete mapInfo: "+credential.glanceOrgId +" mapName:"+mapName)
        GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete mapInfo, glanceOrgId:{},mapName:{}",credential.glanceOrgId,mapName)
        false
    }.recover{
      case _ =>
        Logger.error("Failed to delete mapInfo, glanceOrgId:{},mapName:{}, exception.",credential.glanceOrgId,mapName)
        false
    }
  }

  def readMapSizeInfoByName(credential: GlanceCredential,mapName:String):Future[GlanceMapSizeInfo]={
    val findByName  = (org: String,name:String) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_MAPNAME -> name)).one[GlanceMapSizeInfo];
    findByName(credential.glanceOrgId,mapName).map{ optMapSizeInfo =>
      if(optMapSizeInfo.isDefined)
        optMapSizeInfo.get
      else
        null
    }.recover{
      case _ =>
        Logger.error("Failed to read map size info by name:{}, exception.",mapName)
        null
    }
  }
  def readAllConf(credential: GlanceCredential):Future[List[GlanceMapSizeInfo]] ={
    val findByOrgMapName  = (org: String) => collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_MAPNAME -> 1)).cursor[GlanceMapSizeInfo].collect[List]();
    val optCacheInfo =GlanceSyncCache.getGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME)
    if (optCacheInfo.isDefined) {
      Future {
        optCacheInfo.get
      }
    }else{
      findByOrgMapName(credential.glanceOrgId).map{ listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,listObject)
        listObject
      }.recover{
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,List())
          List()
      }
    }
  }

  def readByFloors(credential: GlanceCredential,floors:List[GlanceTrackFloor]):Future[List[GlanceMapSizeInfo]]={
    readAllConf(credential).map{mapInfoList =>
      val tmpList:mutable.MutableList[GlanceMapSizeInfo]=mutable.MutableList[GlanceMapSizeInfo]()
      for(floor <- floors){
        val matchItems = mapInfoList.filter(p => p.mapName.compare(floor.mapName)==0)
        if(matchItems.length>0){
           tmpList += matchItems(0)
        }else{
          //if  not found just using the temp...
          tmpList += new GlanceMapSizeInfo(credential.glanceOrgId,credential.glanceUserId,"")
        }
      }
      tmpList.toList
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,null)
  }

  def updateMapInfoCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      readAllConf(credential).map{infoList =>
        if(infoList==null || infoList.size<=0)
          GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME,infoList)
        true
      }
    }

    if(bCheckExists){
      val optMapInfoList =GlanceSyncCache.getGlanceCache[List[GlanceMapSizeInfo]](CACHE_NAME)
      if (optMapInfoList.isDefined) {
        Future { true }
      }else
        readAndSet
    } else {
      readAndSet
    }
  }

  def readMaxWidth(credential: GlanceCredential,names:List[String]):Future[Double]={
    val findByNames  = (org: String,namesIn:List[String]) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_MAPNAME -> Json.obj("$in"-> namesIn))).sort(Json.obj("width" -> -1)).one[GlanceMapSizeInfo];
    findByNames(credential.glanceOrgId,names).map{ optMapSizeInfo =>
      if(optMapSizeInfo.isDefined)
        optMapSizeInfo.get.width
      else
        0.0
    }.recover{
      case _ =>
        Logger.error("Failed to read max width value of map names: {}",names.mkString(","))
        0.0
    }
  }

  def readMaxHeight(credential: GlanceCredential,names:List[String]):Future[Double]={
    val findByNames  = (org: String,namesIn:List[String]) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_MAPNAME -> Json.obj("$in"-> namesIn))).sort(Json.obj("height" -> -1)).one[GlanceMapSizeInfo];
    findByNames(credential.glanceOrgId,names).map{ optMapSizeInfo =>
      if(optMapSizeInfo.isDefined)
        optMapSizeInfo.get.height
      else
        0.0
    }.recover{
      case _ =>
        Logger.error("Failed to read max height value of map names:"+names.mkString(","))
        0.0
    }
  }
}
