package models.glance

import com.fasterxml.jackson.annotation.JsonValue
import models.cmx.MapCoordinate
import services.cisco.database.GlanceDBService
import utils.ComUtils
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import play.Logger
import models._
import play.Logger
import play.api.Play.current
import play.api.libs.json._
import play.modules.reactivemongo.ReactiveMongoPlugin
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import reactivemongo.bson._
import services.security.GlanceCredential
import scala.concurrent.Future
import models.cmx.Implicits._

/**
 * Created by kennych on 11/4/16.
 */

case class GlanceFacilityImage(   _id: BSONObjectID = BSONObjectID.generate,
                                  glanceOrgId:String="",
                                  glanceUserId:String="",
                                  imageCategory:String=GlanceFacilityResource.IMAGE_RESOURCE_FACILITY, //system,category???
                                  imageName:String,
                                  imageDisplayName:String="",
                                  imageFileName:String,
                                  imageFileId:String="",
                                  tags:List[String]=List(),
                                  created:Long=System.currentTimeMillis(),
                                  updated:Long=System.currentTimeMillis())

object GlanceFacilityImage {
  import scala.concurrent.ExecutionContext.Implicits.global
  import play.api.libs.json._
  import play.api.libs.functional.syntax._

  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceFacilityImage")
  val CACHE_NAME="glanceFacilityImage"
  val IMAGE_RESOURCE_FACILITY="facility"

  implicit val tolerantFacilityImageReaders = new Reads[GlanceFacilityImage] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceFacilityImage(
          (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse("glance"),
          (js \ "imageCategory").asOpt[String].getOrElse(""),
          (js \ "imageName").as[String],
          (js \ "imageDisplayName").asOpt[String].getOrElse(""),
          (js \ "imageFileName").asOpt[String].getOrElse(""),
          (js \ "imageFileId").asOpt[String].getOrElse(""),
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

  implicit val glanceFacilityImageWrites = new Writes[GlanceFacilityImage] {
    def writes(z: GlanceFacilityImage): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        "imageCategory" ->z.imageCategory,
        "imageName" -> z.imageName,
        "imageDisplayName" -> z.imageDisplayName,
        "imageFileName" -> z.imageFileName,
        "imageFileId" -> z.imageFileId,
        ComUtils.CONST_PROPERTY_TAGS  -> ComUtils.getJsonArrayStr(z.tags),
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  val glanceFacilityImageWFormat = Format(tolerantFacilityImageReaders, glanceFacilityImageWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit ={
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_FACILITY_IMG_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(facilityImage: GlanceFacilityImage) :Future[Boolean]= {
    try{
      collection.insert(facilityImage).map{
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to insert: "+Json.toJson(facilityImage))
          true
        case _ =>
          Logger.error("Failed to insert: "+Json.toJson(facilityImage))
          false
      }
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to insert facility image:{}, exception:{}.",facilityImage.imageCategory,exp.getMessage)
        Future{false}
    }
  }

  def addOrUpdate(facilityImage:GlanceFacilityImage,bForce:Boolean=false):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> facilityImage.glanceOrgId,"imageCategory"->facilityImage.imageCategory,"imageName"->facilityImage.imageName)
    val findExistCount = (existQuery:BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to query count of  facility image:{}, exception:{}.",facilityImage.imageCategory,exp.getMessage)
          Future{0}
      }
    }
    for{
      existCount <-findExistCount(query)
      bRet <- addOrUpdate(existCount,facilityImage,bForce)
    }yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,null)
        sendCacheSyncMessage(ComUtils.getCredential())
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,facilityImage:GlanceFacilityImage,bForce:Boolean):Future[Boolean] ={
    if(existCount >0) {
      update(facilityImage,bForce)
    }else{
      insert(facilityImage)
    }
  }

  def update(facilityImage:GlanceFacilityImage,bForce:Boolean=false):Future[Boolean] = {
    def copySetValues(z:GlanceFacilityImage):JsObject ={
      val jsObj = Json.obj(
        "imageDisplayName" ->z.imageDisplayName,
        "imageFileId" -> z.imageFileId,
        "imageFileName" -> z.imageFileName,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    try{
      collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->facilityImage.glanceOrgId,"imageCategory"->facilityImage.imageCategory,"imageName"->facilityImage.imageName),
        Json.obj("$set" -> copySetValues(facilityImage))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to update: "+Json.toJson(facilityImage))
          true
        case _ =>
          Logger.error("Failed to update:"+ Json.toJson(facilityImage))
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update facility image:{}, exception:{}.",facilityImage.imageCategory,exp.getMessage)
        Future{false}
    }
  }

  def readFacilityImage(credential:GlanceCredential,imageCategory:String,imageName:String):Future[Option[GlanceFacilityImage]] ={

    for {
      allFacilities <- readAll(credential)
    }yield {
      Logger.debug("Read facility image, category:{}, imageName:{}",imageCategory,imageName)
      val matches = allFacilities.filter( p => p.imageCategory==imageCategory && p.imageName==imageName)
      if(matches.length>0)
        Some(matches(0))
      else
        None
    }
  }

  def deleteByCategory(credential: GlanceCredential, imageCategory:String): Future[Boolean] = {
    try{
      collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,"imageCategory"-> imageCategory)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" imageCategory:"+imageCategory)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete: "+credential.glanceOrgId +" imageCategory:"+imageCategory)
          false
      }.recover{
        case _ =>
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete  facility image:{}, exception:{}.",imageCategory,exp.getMessage)
        Future{false}
    }
  }


  def deleteAll(credential: GlanceCredential):Future[Boolean]={
    try{
      collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete all facility images:{}",credential.glanceOrgId)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to delete all facility images:{}",credential.glanceOrgId)
          false
      }.recover{
        case _ =>
          Logger.error("Failed to delete all facility images:{}, exception.",credential.glanceOrgId)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete all facility images:{}, exception:{}.",credential.glanceOrgId,exp.getMessage)
        Future{false}
    }
  }


  def readAll(credential: GlanceCredential):Future[List[GlanceFacilityImage]]={
    val findByOrgUserId  = (org: String) => {
      try{
        collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj("imageName" -> 1)).cursor[GlanceFacilityImage].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to real all facility images:{}, exception:{}.",credential.glanceOrgId,exp.getMessage)
          Future{List()}
      }
    };
    val optCaches =GlanceSyncCache.getGlanceCache[List[GlanceFacilityImage]](CACHE_NAME)
    if (optCaches.isDefined) {
      Future{optCaches.get}
    }else{
      findByOrgUserId(credential.glanceOrgId).map{ listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,{
          if(listObject.length>0)
            listObject
          else
            null
        }
        )
        listObject
      }.recover{
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,List())
          List()
      }
    }
  }

  def readAllByCategory(credential: GlanceCredential,imageCategory:String):Future[List[GlanceFacilityImage]]={
    readAll(credential).map{ listAll =>
      listAll.filter(p => p.imageCategory== imageCategory)
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,null)
  }

  def updateCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={

    def readAndSet():Future[Boolean]={
      readAll(credential).map{ caches =>
        if(caches==null || caches.size<=0)
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceFacilityImage]](CACHE_NAME,caches)
        true
      }
    }

    if(bCheckExists){
      val optCaches =GlanceSyncCache.getGlanceCache[List[GlanceFacilityImage]](CACHE_NAME)
      if (optCaches.isDefined){
        Future{true}
      }else{
        readAndSet
      }
    }else{
      readAndSet
    }
  }

}
