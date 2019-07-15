package services.cisco.indoor

import akka.actor.Actor
import controllers.amqp.GlanceSyncCache
import models.cmx.Campus
import models.cmx.Implicits._
import models.glance.{GlanceTrackFloor, GlanceTrackBuilding, GlanceSystemConf}
import play.Logger
import play.api.libs.json.{JsValue, JsArray, JsObject, Json}
import play.api.libs.ws.{WSAuthScheme, WSResponse, WS, WSRequestHolder}
import services.common.{SchedulingService, ConfigurationService}
import play.api.Play.current
import services.security.GlanceCredential
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._

/**
 * Created by kennych on 12/25/15.
 */
object CMXService {
  def init(): Unit ={
      Logger.debug("CMXService Init")
  }

  def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 2*60*1000) : WSRequestHolder = {
    Logger.debug("URI:{},user:{},password:{}",s"$baseUri$api",cmxConf.glanceCmxSetting.cmxUserName,cmxConf.glanceCmxSetting.cmxPassword)
    val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
    holder.withHeaders("Content-Type" -> "application/json")
    if(json) holder.withHeaders("Accept" -> "application/json")
    else holder
  }

  def loadMapData(credential: GlanceCredential,cmxConf:GlanceSystemConf):Future[Option[JsValue]] ={
    val baseUri =ComUtils.getBaseUri(cmxConf)
    val holder: WSRequestHolder = createRequest(cmxConf,baseUri,cmxConf.glanceCmxSetting.cmxMapPath,json = true,timeout = 1000*60*5)
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
//          Logger.debug("Get CMX map data success:{}",response.json.toString());
//          Logger.debug("Get map data success,datalen:"+response.json.toString().length)
          Some(response.json)
        case _ =>
          Logger.error("Get CMX map data failed:"+response.status)
          None
      }
    }
    holder.get().map(response).recover{
      case _ =>
        Logger.error("Get map data failed, unknown exception")
        None
    }
  }

  def parseCampusData(campusData:JsValue,glanceCmxConf:GlanceSystemConf):Future[List[Campus]] ={
      val p = Promise[List[Campus]]
      val f = p.future
      Future{
        val parsedCampusList:mutable.MutableList[Campus] =new mutable.MutableList[Campus]()
        var campusList:List[JsValue] =List()
        if(ComUtils.isCMX8(glanceCmxConf.glanceCmxSetting.cmxVersion)){
            campusList = (campusData \ "Maps" \ "Campus").as[List[JsValue]]
        }else{
            campusList = (campusData \ ComUtils.CONST_PROPERTY_CAMPUSES).as[List[JsValue]]
        }
        val completedCount=new java.util.concurrent.atomic.AtomicLong()
        for (jsValue <- campusList){
          try{
            val campus = jsValue.as[Campus](tolerantCampusReaders)
            parsedCampusList += campus
            val count = completedCount.incrementAndGet()
            Logger.debug("Completed count:"+count)
          }catch{
            case exp:Throwable =>
              val count =completedCount.incrementAndGet()
              Logger.error("Failed to parse campus info:"+jsValue.toString()+ " exception:"+exp.getMessage()+",completed count:"+count)
          }
          if(completedCount.get() >= campusList.length)
              p.success(parsedCampusList.toList)
        }
        if(campusList.length==0)
          p.success(List())
      }
      f.map{ campuses =>
        campuses
      }.recover{
        case _ =>
          List()
      }
  }

  def parseMapInfo(mapData:Option[JsValue],glanceSysConf:GlanceSystemConf):Future[List[Campus]] ={
    mapData match {
      case Some(campusData) =>
          parseCampusData(campusData,glanceSysConf)
      case None =>
        Future{List()}
    }
  }
  //update the campus, building & floors information.
  def loadCampusInfo(credential:GlanceCredential,glanceSysConf:GlanceSystemConf,bUpdateByForce:Boolean=false): Future[List[Campus]] ={
    val optCampus = GlanceSyncCache.getGlanceCache[List[Campus]](ComUtils.GLANCE_CAMPUSES_CACHE)
    if(optCampus.isDefined)
      Future{
        Logger.debug("Just return the cached campuses data!")
        optCampus.get
      }
    else{
      for{
        mapData <- loadMapData(credential,glanceSysConf)
        campuses <- parseMapInfo(mapData,glanceSysConf)
      } yield  {
        if(campuses.length>0)
          GlanceSyncCache.setGlanceCache[List[Campus]](ComUtils.GLANCE_CAMPUSES_CACHE, campuses)
        campuses
      }
    }
  }
}
