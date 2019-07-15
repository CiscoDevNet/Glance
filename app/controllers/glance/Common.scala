package controllers.glance

import java.io.{FileOutputStream, OutputStream, BufferedOutputStream, File}
import java.net.InetAddress

import com.fasterxml.jackson.databind.ObjectMapper
import controllers.amqp.GlanceMemcached
import controllers.glance.Avatar._
import controllers.glance.Conf._
import controllers.glance.ScreenToTrackerFloor._
import controllers.glance.console.Backup._
import controllers.glance.guestaccess.GuestCheckIn._
import models.common.GlanceStatus
import models.glance._
import org.apache.commons.io.FileUtils
import play.Logger
import play.api.libs.iteratee.Enumerator
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc.{Action, Controller}
import akka.actor.{ Actor, Props, actorRef2Scala }
import akka.pattern.ask
import play.api.Play.current
import play.api.libs.concurrent.Akka
import akka.util.Timeout
import services.cisco.instanceSync.MemCached
//import services.common.DataService
import utils.{ComUtils, JsonResult}
import scala.collection.immutable.HashMap
import scala.collection.mutable
import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.io.{BufferedSource, Source}
import scala.util.Success

/**
 * Created by kennych on 11/4/15.
 */
object Common extends Controller with Guard {
  
  def LocalIPAddress() = Action.async { implicit request =>
    val credential = remoteCredential
    def getIPAddress(): String = {
      val IP: InetAddress = InetAddress.getLocalHost();
      IP.getHostAddress()
    }
    Future {
      JsonResult(Json.obj("Current IPAddress of back-end server" -> getIPAddress()))
    }
  }

  def remoteAddressAndMacAddress() = Action.async { implicit request =>
    val credential = remoteCredential
    val ipAddress = remoteXAddress
    val ipAddressAllchains = remoteAddressAllchains
    for {
      sysConf <- GlanceSystemConf.readConf(credential)
      macAddress <- RegisteredUser.getMacAddress(sysConf, credential, ipAddress)
    } yield {
      JsonResult(Json.obj(ComUtils.CONST_PROPERTY_IPADDRESS -> ipAddress, ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress, "ipAddressAllChains" -> ipAddressAllchains))
    }
  }

  def utilShowCurrentVisitorScanningId() = Action.async { implicit request =>
    for {
      optInstanceId <- GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_ALLDATA)
      optFlag <- GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_FLAG)
    } yield {
      val tmpInstanceId = optInstanceId.getOrElse("")
      val currentInstance = ComUtils.glanceInstantId
      val flags = optFlag.getOrElse("0")
      JsonResult(Json.obj("scanningInstanceId" -> tmpInstanceId, "currentInstance" -> currentInstance, "flags" -> flags))
    }
  }

  def logfile() = Action.async { implicit request =>
    Future {
      import scala.io.Source
      def formatLine(line: String): String = {
        "<p>" + line + "</p>"
      }
      val logItems = Iterable[String]("<!DOCTYPE html><html><body>") ++ Source.fromFile(new File("/logs/application.log")).getLines().map(f => formatLine(f)) ++ Iterable[String]("<body><html>")
      Ok.chunked(Enumerator.enumerate(logItems).andThen(Enumerator.eof)).as("text/html")
    }
  }

  def updateRegisterTest() = Action.async { implicit request =>
    if (!isAdminLoggedIn) {
      Future {
        Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))
      }
    } else {
      GlanceWebSocketActor.updateAllRegister(true)
      Future {
        Ok {
          Json.toJson(GlanceStatus.successStatus("Register update message has been sent!"))
        }
      }
    }
  }

  def showAllCampusInfo() = Action.async { implicit request =>
    val credential = remoteCredential
    val clientAddress = remoteXAddress
    if (!isAdminLoggedIn) {
      Future {
        Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))
      }
    } else {
      for {
        bRet <- {
          GlanceWebSocketActor.updateAllNActiveExpert(credential)
        }
        sysConf <- {
          GlanceSystemConf.readConf(credential)
        }
        campusInfo <- {
          GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential, sysConf.defaultTrackingCampus)
        }
        interestPoints <- {
          GlanceInterestPoint.readAll(credential)
        }
        glanceZones <- {
          GlanceZone.readAllConf(credential.glanceOrgId)
        }
        facilities <- {
          GlanceFacilityResource.readAll(credential)
        }
        zoneCounting <- {
          Visitor.getHeatmapOfVisitorsByZones("all", "", credential)
        }
        cachedConnectedDevices <-{
          GlanceAssociationIPMacAddress.readAllCachedIPMappings(credential)
        }
        accessPoints <- {
          GlanceAccessPoint.readAllCombineConnectedDevice(credential,cachedConnectedDevices)
        }
        msg <- Future{
          GlanceWebSocketActor.getRefreshInfo(credential, sysConf, clientAddress, campusInfo, interestPoints, glanceZones, facilities, zoneCounting,accessPoints)
        }
        floors <- {
          GlanceTrackCampus.readDefaultCampusFloors(credential)
        }
      } yield {
        Ok(Json.obj("staff" -> msg))
      }
    }
  }

  def dataVersionConverter() = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if (!isAdminLoggedIn) {
      Future {
        Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))
      }
    } else {
      for {
        bConvert <- RegisteredUser.versionDataConvert(credential)
      } yield {
        if (bConvert)
          Ok(Json.toJson(GlanceStatus.successStatus("Converted data schema version successfully!")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to convert data schema version!")))
      }
    }
  }
}