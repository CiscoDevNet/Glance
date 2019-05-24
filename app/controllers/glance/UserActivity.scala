package controllers.glance

import controllers.amqp.GlanceMemcached
import models.glance.{GlanceUserActivity, GlanceTrackFloor, GlanceVisitor}

import controllers.security.Guard
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Action, Controller}
import utils.{ComUtils, JsonResult}
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.duration._
/**
 * Created by kennych on 7/6/16.
 */
object UserActivity extends Controller with Guard {
  val hoursList =List( "00:00 - 00:59 AM",
    "01:00 - 01:59 AM",
    "02:00 - 02:59 AM",
    "03:00 - 03:59 AM",
    "04:00 - 04:59 AM",
    "05:00 - 05:59 AM",
    "06:00 - 06:59 AM",
    "07:00 - 07:59 AM",
    "08:00 - 08:59 AM",
    "09:00 - 09:59 AM",
    "10:00 - 10:59 AM",
    "11:00 - 11:59 AM",
    "12:00 - 12:59 PM",
    "13:00 - 13:59 PM",
    "14:00 - 14:59 PM",
    "15:00 - 15:59 PM",
    "16:00 - 16:59 PM",
    "17:00 - 17:59 PM",
    "18:00 - 18:59 PM",
    "19:00 - 19:59 PM",
    "20:00 - 20:59 PM",
    "21:00 - 21:59 PM",
    "22:00 - 22:59 PM",
    "23:00 - 23:59 PM")

  def getVisitorsByHours(category:String,floorIdName:String) =Action.async { implicit request =>
    val credential =remoteCredential
    def getCachedAnalyze_inline(category:String):Future[Option[JsValue]]={
      GlanceMemcached.getGlobalMemcachedData("useractivityanalyze."+category).map{ optValue =>
        val jsValue =optValue.getOrElse("")
        if(jsValue=="")
          None
        else{
          try {
            Some(Json.parse(jsValue))
          } catch {
            case ex: Throwable =>
              Logger.error("Failed to parse cached data,exception:{}",ex.getMessage)
              None
          }
        }
      }.recover{
        case _=>
          None
      }
    }

    def getAllDataList_inline(AllCountsMap: mutable.HashMap[String,mutable.HashMap[String,Int]],days:List[String],hours:List[String]):List[List[Int]] ={
      import scala.collection.mutable
      val AllCounts: mutable.MutableList[List[Int]]=new mutable.MutableList[List[Int]]()
      for(day <- days)
      {
        val counts =new mutable.MutableList[Int]()
        for(hour <- hours)
        {
          Logger.info("Day:"+day +" hour:"+hour + " Count:"+ AllCountsMap(day)(hour))
          counts += AllCountsMap(day)(hour)
        }
        AllCounts += counts.toList
      }
      AllCounts.toList
    }

    def getDBdAnalyze(category:String):Future[JsValue] = {
      for {
        floorInfo <- {if(floorIdName=="")Future{null} else GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,floorIdName)}
        visitingDays <-{if(floorInfo==null) GlanceUserActivity.glanceUserVisitingDays(credential,"",category) else GlanceUserActivity.glanceUserVisitingDays(credential,floorInfo.floorId,category)}
        visitingHours <-{if(floorInfo==null) GlanceUserActivity.glanceUserAllVisitingHours(credential,"",visitingDays,category) else GlanceUserActivity.glanceUserAllVisitingHours(credential,floorInfo.floorId,visitingDays,category)}
        allDayHourCounts <- {if(floorInfo==null)GlanceUserActivity.guestAllDayHoursCount(credential,"",ComUtils.filterLastWeekDays(visitingDays),visitingHours,category) else GlanceUserActivity.guestAllDayHoursCount(credential,floorInfo.floorId,ComUtils.filterLastWeekDays(visitingDays),visitingHours,category)}
      } yield{
        val visitingHoursList = visitingHours.sortWith((x1,x2) => hoursList.indexOf(x1)<= hoursList.indexOf(x2))
        val visitingDayHourCounts =Json.obj("visitingDays" ->ComUtils.getJsonArrayStr(visitingDays),
          "visitingHours" ->ComUtils.getJsonArrayStr(visitingHoursList),
          "visitingDayHourCounts" -> ComUtils.getJsonArrayValue(getAllDataList_inline(allDayHourCounts,visitingDays,visitingHours).map( f => ComUtils.getJsonArrayInt(f))))
        GlanceMemcached.setGlobalMemcachedData("useractivityanalyze."+category,visitingDayHourCounts.toString(),1.minute)
        visitingDayHourCounts
      }
    }
    for{
      optVisitingDayHourCountsCache <- getCachedAnalyze_inline(category)
      visitingDayHourCounts <- {
        if (optVisitingDayHourCountsCache.isEmpty) {
          Logger.debug("Using read Analyze data!")
          getDBdAnalyze(category)
        }
        else{
          Logger.debug("Using cached Analyze data!")
          Future{optVisitingDayHourCountsCache.get}
        }
      }
    }yield{
      Ok(visitingDayHourCounts)
    }
  }
}
