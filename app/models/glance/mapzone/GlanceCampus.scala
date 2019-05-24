package models.glance.mapzone

import reactivemongo.play.json._
import controllers.amqp.GlanceSyncCache
import models._
import models.cmx.Campus
import models.cmx.Implicits._
import play.Logger
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import _root_.utils.ComUtils
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future


/**
 * Created by kennych on 12/1/15.
 */
case class GlanceCampus(_id: BSONObjectID = BSONObjectID.generate,
                        glanceOrgId:String,
                        glanceUserId:String,
                        campusId: String,
                        campusName: String,
                        campusRef: Campus,
                        tags: List[String],
                        created: Long,
                        updated: Long)

object GlanceCampus {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("GlanceCampus")
  val CACHE_NAME = "GlanceCampus"
  val tolerantGlanceReaders = new Reads[GlanceCampus] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceCampus(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSNAME).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSREF).as[Campus](tolerantCampusReaders),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceCampus] {
    def writes(z: GlanceCampus): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID ->z.glanceUserId,
        ComUtils.CONST_PROPERTY_CAMPUSID -> z.campusId,
        ComUtils.CONST_PROPERTY_CAMPUSNAME -> z.campusName,
        ComUtils.CONST_PROPERTY_CAMPUSREF  -> z.campusRef.asInstanceOf[JsValue],
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGlanceReaders, glanceWrites)


  def insert(campus: GlanceCampus):Future[Boolean] = {
    try{
      GlanceCampus.collection.insert(campus).map{
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully insert: "+campus.glanceOrgId+" glanceUserId:"+campus.glanceUserId+" campusId:"+campus.campusId+" campusName:"+campus.campusName)
          true
        case _ =>
          Logger.error("Failed to insert: "+campus.glanceOrgId+" glanceUserId:"+campus.glanceUserId+" campusId:"+campus.campusId+" campusName:"+campus.campusName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert glance campus, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def addOrUpdate(campus:GlanceCampus):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> campus.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> campus.campusId,ComUtils.CONST_PROPERTY_CAMPUSNAME ->campus.campusName)
    val findExistCount = (existQuery:BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count( GlanceCampus.collection.name,Some(existQuery)))
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to query glance campus,campus Id:{}, exception:{}",campus.campusId,exp.getMessage)
          Future{0}
      }
    }
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,campus)
    }yield bRet
  }

  def addOrUpdate(existCount:Int,campus:GlanceCampus):Future[Boolean] ={
    if(existCount >0) {
      update(campus)
    }else{
      insert(campus)
    }
  }

  def update(campus:GlanceCampus):Future[Boolean] = {
    try{
      GlanceCampus.collection.update(Json.obj("glanceOrgId" ->campus.glanceOrgId,ComUtils.CONST_PROPERTY_CAMPUSID -> campus.campusId),
        Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_CAMPUSNAME -> campus.campusName,ComUtils.CONST_PROPERTY_TAGS -> campus.tags,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated: glanceOrgId"+campus.glanceOrgId+" glanceUserId:"+campus.glanceUserId+" campusId:"+campus.campusId+" campusName:"+campus.campusName)
          true
        case _ =>
          Logger.error("Failed to update: glanceOrgId"+campus.glanceOrgId+" glanceUserId:"+campus.glanceUserId+" campusId:"+campus.campusId+" campusName:"+campus.campusName)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update glance campus,campus Id:{}, exception:{}",campus.campusId,exp.getMessage)
        Future{false}
    }

  }

  def delete(campus:GlanceCampus): Future[Boolean] = {
    try{
      GlanceCampus.collection.remove(Json.obj("glanceOrgId" ->campus.glanceOrgId, ComUtils.CONST_PROPERTY_CAMPUSID -> campus.campusId)).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully deleted: "+campus.glanceOrgId +" glanceUserId:"+campus.glanceUserId +" campusId:"+campus.campusId)
          true
        case _ =>
          Logger.warn("Failed to delete: "+campus.glanceOrgId +" glanceUserId:"+campus.glanceUserId +" campusId:"+campus.campusId)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete glance campus,orgId:{}, exception:{}",campus.glanceOrgId,exp.getMessage)
        Future{false}
    }
  }

  def readAllCampuses(glanceOrgId:String,glanceUserId:String):Future[List[GlanceCampus]] ={
    val findByOrgUserId  = (org: String,user:String) => {
      try{
        GlanceCampus.collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_CAMPUSNAME -> 1)).cursor[GlanceCampus].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read all glance campus,orgId:{}, exception:{}",glanceOrgId,exp.getMessage)
          Future{List()}
      }
    };
    findByOrgUserId(glanceOrgId,glanceUserId)
  }

  def readCampus(glanceOrgId:String,glanceUserId:String,campusId:String):Future[Option[GlanceCampus]] ={
    val findByName  = (org: String,user:String,cid:String) => {
      try{
        GlanceCampus.collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_CAMPUSID -> cid)).one[GlanceCampus]
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read glance campus,orgId:{},campusId:{}, exception:{}",glanceOrgId,campusId,exp.getMessage)
          Future{None}
      }
    };
    findByName(glanceOrgId,glanceUserId,campusId)
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceCampus]](CACHE_NAME,null)
  }

  def updateGlanceCampusCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      for {
        listCampus <- readAllCampuses(credential.glanceOrgId,credential.glanceUserId)
      } yield {
        if (listCampus == null || listCampus.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceCampus]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceCampus]](CACHE_NAME,listCampus)
        true
      }
    }
    if (bCheckExists) {
      val optCampus = GlanceSyncCache.getGlanceCache[List[GlanceCampus]](CACHE_NAME)
      if (optCampus.isDefined){
        Future {
          true
        }
      }else
        readAndSet
    } else {
      readAndSet
    }
  }

}