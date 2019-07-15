package controllers.glance
import java.util.UUID

import controllers.amqp.GlanceSyncCache
import controllers.glance.GlanceAuth._
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import services.cisco.notification.NotificationService
import services.security.{AESEncrypt, GlanceCredential}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT
import play.api.Play.current;
import scala.concurrent.{Promise, Future}
import models.cmx.Implicits._

/**
 * Created by kennych on 12/29/16.
 */
object GlanceIPMapping extends Controller with Guard {

  def getCachedIPMapping() = Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        ipMappings <- GlanceAssociationIPMacAddress.readAllCachedIPMappings(credential)
      }yield{
        Ok(ComUtils.getJsonArray(ipMappings.map(p => Json.toJson(p).as[JsObject])))
      }
    }
  }

  def getIPByMac(macAddress:String)= Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        ipAddress <- GlanceAssociationIPMacAddress.readIPByMacAddress(credential,macAddress)
      } yield{
        Ok(ipAddress)
      }
    }
  }

  def getMacInfo(macAddress:String)=Action.async{ implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        ipAddress <- GlanceAssociationIPMacAddress.readMacLoc(credential,macAddress)
      } yield{
        if(ipAddress.isDefined)
          Ok(Json.toJson(ipAddress.get))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("The device could not be found!")))
      }
    }
  }

}
