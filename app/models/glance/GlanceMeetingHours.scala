package models.glance

import utils.ComUtils
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
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

/**
 * Created by kennych on 12/11/15.
 */
case class GlanceMeetingHours(_id: BSONObjectID = BSONObjectID.generate,
                        glanceOrgId:String="",
                        floorId:String="",
                        visitingDay:String="",
                        meetingMinutes:Double=120.0,
                        tags: List[String]= List(),
                        updated: Long=System.currentTimeMillis())


object GlanceMeetingHours{
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceMeetingHours")
  val CACHE_NAME ="glanceMeetingHours"

  def init(): Unit ={
    Logger.info("GlanceMeetingHours Init!")
  }

  def trackFloorMeetingHours(floorId:String,credential: GlanceCredential): Unit ={
    Logger.info("trackFloorMeetingHours-function is not implemented yet!")
  }

  val tolerantGLanceReaders = new Reads[GlanceMeetingHours] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceMeetingHours(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ "visitingDay").asOpt[String].getOrElse(""),
        (js \ "meetingMinutes").asOpt[Double].getOrElse(120.0),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceMeetingHours] {
    def writes(z: GlanceMeetingHours): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_FLOORID ->z.floorId,
        "visitingDay" ->z.visitingDay,
        "meetingMinutes" -> z.meetingMinutes,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceFormat = Format(tolerantGLanceReaders, glanceWrites)

  def getMeetingHours(credential: GlanceCredential,floorIdIn:String,visitingDayIn:String): Future[Option[GlanceMeetingHours]] ={
    val findByName  = (org: String,fid:String,vday:String) => GlanceMeetingHours.collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_FLOORID -> fid,"visitingDay" -> vday)).one[GlanceMeetingHours];
    findByName(credential.glanceOrgId,floorIdIn,visitingDayIn).map{ info =>
      if (info.isDefined)
        info
      else
        Some(new GlanceMeetingHours(glanceOrgId=credential.glanceOrgId,floorId=floorIdIn,visitingDay=visitingDayIn,meetingMinutes = 120))
    }.recover{
      case _ =>
        Logger.error("Read meetingHours information failed")
        Some(new GlanceMeetingHours(glanceOrgId=credential.glanceOrgId,floorId=floorIdIn,visitingDay=visitingDayIn,meetingMinutes = 120))
    }
  }

  def getDefaultMeetingHours(credential:GlanceCredential,floorIdIn:String,visitingDayIn:String):GlanceMeetingHours ={
      val defaultVal =new GlanceMeetingHours(glanceOrgId=credential.glanceOrgId,floorId=floorIdIn,visitingDay=visitingDayIn,meetingMinutes = 120)
      defaultVal
  }

  def setMeetingHours(credential:GlanceCredential,floorId:String,visitingDay:String,meetingMinutes:Double): Future[Boolean] ={
    GlanceMeetingHours.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID->floorId,"visitingDay" -> visitingDay),
      Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID -> floorId,"meetingMinutes" -> meetingMinutes, "visitingDay" ->visitingDay,ComUtils.CONST_PROPERTY_UPDATED ->System.currentTimeMillis())),upsert = true).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update: "+credential.glanceOrgId+" floorId:"+floorId+" meetingMinutes:"+meetingMinutes+ " visiting Day:"+visitingDay)
        true
      case _ =>
        Logger.error("Failed to update: "+credential.glanceOrgId+" floorId:"+floorId+" meetingMinutes:"+meetingMinutes+ " visiting Day:"+visitingDay)
        false
    }
  }
}

