import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer, GlanceSyncConsumer}
import filters.CORSFilter
import models.glance.{RegisteredUser, GlanceSystemConf, GlanceVisitor, GlanceMeetingHours}
import play.Logger
import play.api.libs.json.{JsString, Json}
import services.cisco.database.GlanceDBService
import services.cisco.indoor.CMXVisitorScan
//import services.pathfinding.{PathFindingUsage, PathFindingMaskNode, PathFindingMaskNodeFactory, PathFindingMaskNodeMap}
import utils.{JsonResult, ComUtils}
import play.api._
import play.api.mvc._
import play.api.GlobalSettings
import reactivemongo.api.indexes.{IndexType, Index, NSIndex}
import play.api.Play.current
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

object Global extends WithFilters(new CORSFilter()) with GlobalSettings {
  override def onStart(app: Application) {

    // temperate comment out
    try{
      GlanceDBService.Init()
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to init db service exception:"+exp.getMessage)
    }
    //init Path finding.
//    PathFindingUsage.Init(ComUtils.getCredential()).map{ bInit =>
//      Logger.info("GlancePathFindingUsage Initialized!")
//    }
    //RegisteredUser.versionDataConvert(ComUtils.getCredential())
    //RegisteredUser.InitUserDataImport(ComUtils.getCredential())

    Logger.info(s"call MQ")
//    try {
//      GlanceSyncConsumer.createExchange().map { optCode =>
//        optCode match {
//          case Some(code) =>
//            Logger.debug("Create glance.exchange.data return code:"+code)
//          case None =>
//            Logger.warn("Create glance.exchange.data return code failed")
//        }
//      }
//    }catch {
//      case ex:Throwable =>
//        Logger.error("Failed to create glance.exchange.data!"+ex.getMessage())
//    }

    if (GlanceSyncCache.getMessageQueueEnabled()) {
      GlanceSyncConsumer.makeConnection();
      GlanceSyncProducer.makeConnection();
    }
    GlanceMeetingHours.init()
    GlanceVisitor.init()
    CMXVisitorScan.init()

    Logger.info(s"Glance (${play.api.Play.mode}) started")
    //init the value for list...
    try{
      val receiveHost = scala.util.Properties.envOrElse("GLANCE_HOST", "")
      if (receiveHost.compareToIgnoreCase("") != 0) {
        GlanceSystemConf.addOrUpdate(ComUtils.getCredential(), "glanceReceiverSetting", "receiverHostName", JsString(receiveHost)).map { result =>
          Logger.info("Update glanceReceiverSetting.receiverHostName successfully")
        }
      }
      val cmxHost = scala.util.Properties.envOrElse("CMX_HOST", "")
      if (cmxHost.compareToIgnoreCase("") != 0) {
        GlanceSystemConf.addOrUpdate(ComUtils.getCredential(), "glanceCmxSetting", "cmxHost", JsString(cmxHost)).map { result =>
          Logger.info("Update glanceCmxSetting.cmxHost successfully")
        }
      }
      val cmxAcc = scala.util.Properties.envOrElse("CMX_ACC", "")
      if (cmxAcc.compareToIgnoreCase("") != 0) {
        var acc = cmxAcc
        var accPass = ""
        val list = cmxAcc.split(":")
        if (list.size >= 2) {
          acc = list(0)
          accPass = list(1)
        }
        GlanceSystemConf.addOrUpdate(ComUtils.getCredential(), "glanceCmxSetting", "cmxUserName", JsString(acc)).map { result =>
          Logger.info("Update glanceCmxSetting.cmxUserName successfully")
        }
        GlanceSystemConf.addOrUpdate(ComUtils.getCredential(), "glanceCmxSetting", "cmxPassword", JsString(accPass)).map { result =>
          Logger.info("Update glanceCmxSetting.cmxPassword successfully")
        }
      }
    } catch{
      case ex:Throwable =>
        Logger.error("Failed to update setting from environment variables:{}",ex.getMessage())
    }
  }

  override def onStop(app: Application) {
    Logger.info(s"Glance Service(${play.api.Play.mode}) stopped")
  }
}
