package models.glance

import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import play.api.libs.json._
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson._
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._
import scala.concurrent.Future

/**
 * Created by kennych on 6/20/17.
 */
case class GlanceDeviceAlias(_id: BSONObjectID = BSONObjectID.generate,
                             glanceOrgId: String,
                             id: String,
                             macAddress: String,
                             tags: List[String] = List(),
                             updated: Long = System.currentTimeMillis())

object GlanceDeviceAlias {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceDeviceAlias")
  val CACHE_NAME = "glanceDeviceAlias"

  val glanceDeviceAliasReaders = new Reads[GlanceDeviceAlias] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceDeviceAlias(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
        (js \ ComUtils.CONST_PROPERTY_ID).as[String],
        (js \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String],
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceDeviceAliasWrites = new Writes[GlanceDeviceAlias] {

    def writes(z: GlanceDeviceAlias): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_ID -> z.id,
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceDeviceAliasFormat = Format(glanceDeviceAliasReaders, glanceDeviceAliasWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_DEVICE_ALIAS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(credential: GlanceCredential, deviceAlias: GlanceDeviceAlias): Future[Boolean] = {
    val updateRecord = deviceAlias.copy(glanceOrgId = credential.glanceOrgId)
    collection.insert(updateRecord).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully insert:  glanceOrg:" + deviceAlias.glanceOrgId + " with GlanceDeviceAlias data" + Json.toJson(deviceAlias).toString())
        true
      case _ =>
        Logger.error("Failed insert:  glanceOrg:" + deviceAlias.glanceOrgId + " with GlanceDeviceAlias data" + Json.toJson(deviceAlias).toString())
        false
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, deviceAlias: GlanceDeviceAlias): Future[Boolean] = {
    if (existCount > 0) {
      update(credential, deviceAlias)
    } else {
      insert(credential, deviceAlias)
    }
  }

  def addOrUpdate(credential: GlanceCredential, deviceAlias: GlanceDeviceAlias, bUpdateCache: Boolean = true): Future[Boolean] = {
    if (deviceAlias == null) {
      Future {
        false
      }
    } else {
      val idQuery = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> deviceAlias.id)
      val macQuery = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_MACADDRESS -> deviceAlias.macAddress)
      val alreadyQuery = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> deviceAlias.id, ComUtils.CONST_PROPERTY_MACADDRESS -> deviceAlias.macAddress)

      val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
      for {
        already <- findExistCount(alreadyQuery)
        existCount <- {
          if (already <= 0)
            findExistCount(idQuery)
          else
            Future {
              1
            }
        }
        existMac <- {
          if (already <= 0)
            findExistCount(macQuery)
          else
            Future {
              1
            }
        }
        bDelete <- {
          if (already > 0)
            Future {
              true
            }
          else if (existMac > 0)
            deleteByMacAddress(credential, deviceAlias.macAddress)
          else
            Future {
              true
            }
        }
        bRet <- {
          if (already > 0)
            Future {
              true
            }
          else
            addOrUpdate(existCount, credential, deviceAlias)
        }
      } yield {
        if (bUpdateCache && bRet) {
          GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
        }
        bRet
      }
    }
  }

  def update(credential: GlanceCredential, deviceAlias: GlanceDeviceAlias): Future[Boolean] = {
    def copySetValues(z: GlanceDeviceAlias): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_ID -> z.id,
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      Logger.debug("GlanceDeviceAlias update:" + jsObj.toString())
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> deviceAlias.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> deviceAlias.id),
      Json.obj("$set" -> copySetValues(deviceAlias))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Successfully updated GlanceDeviceAlias: glanceOrgId" + deviceAlias.glanceOrgId + " with GlanceDeviceAlias:" + Json.toJson(deviceAlias).toString())
        true
      case _ =>
        Logger.error("Failed to update GlanceDeviceAlias: glanceOrgId" + deviceAlias.glanceOrgId + " with GlanceDeviceAlias:" + Json.toJson(deviceAlias).toString())
        false
    }
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceDeviceAlias]] = {
    val findByOrgId = (org: String) => collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_ID -> 1)).cursor[GlanceDeviceAlias].collect[List]();
    findByOrgId(credential.glanceOrgId).map { listObject =>
      GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,listObject)
      listObject
    }.recover {
      case _ =>
        GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,null)
        List()
    }
  }

  def delete(credential: GlanceCredential, device_id: String): Future[Boolean] = {
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> device_id)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully deleted: glanceOrgId:{}, id:{}",credential.glanceOrgId,device_id)
        GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.debug("Failed to delete: glanceOrgId:{}, id:{}",credential.glanceOrgId,device_id)
        false
    }.recover {
      case _ =>
        false
    }
  }

  def deleteByMacAddress(credential: GlanceCredential, macAddress: String, bUpdateCache: Boolean = false): Future[Boolean] = {
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully deleted: glanceOrgId:{}, macAddress:{}",credential.glanceOrgId, macAddress)
        if (bUpdateCache) {
          GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
        }
        true
      case _ =>
        Logger.error("Failed to delete: glanceOrgId:{}, macAddress:{}",credential.glanceOrgId, macAddress)
        false
    }.recover {
      case _ =>
        false
    }
  }

  def cleanCache(credential: GlanceCredential): Unit = {
    GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME,null)
  }

  def updateDeviceAliasCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      for {
        listDeviceAlias <- readAll(credential)
      } yield {
        true
      }
    }
    if (bCheckExists) {
      val optDeviceAlias = GlanceSyncCache.getGlanceCache[List[GlanceDeviceAlias]](CACHE_NAME)
      if(optDeviceAlias.isDefined){
        Future {
          true
        }
      }else{
        readAndSet
      }
    } else {
      readAndSet
    }
  }
}

