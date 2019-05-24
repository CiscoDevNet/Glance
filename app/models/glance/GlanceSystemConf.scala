package models.glance

import com.fasterxml.jackson.annotation.JsonValue
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import play.api.libs.json.{JsValue, Json, JsObject}
import play.api.mvc.Action
import play.api.mvc.BodyParsers.parse
import play.modules.reactivemongo.ReactiveMongoPlugin
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import services.common.ConfigurationService
import services.security.{AESEncrypt, GlanceCredential}
import utils.ComUtils
import scala.concurrent.duration.Duration
// Reactive Mongo imports
import reactivemongo.api.Cursor
import scala.concurrent.Future
import java.util.{UUID, Date}
import play.api.cache.Cache

/**
 * Created by kennych on 11/30/15.
 */

case class GlanceLdapSetting(photoUrl:String="",
                             serverAddress:String="",
                             ldapUser:String="",
                             ldapPass:String="")

case class GlanceCMXSetting(cmxHost:String=scala.util.Properties.envOrElse("CMX_HOST", ""),
                            cmxPort:Int=443,
                            cmxProtocol:String="https",
                            cmxUserName:String=scala.util.Properties.envOrElse("CMX_USER", ""),
                            cmxPassword:String=scala.util.Properties.envOrElse("CMX_PASS", ""),
                            cmxClientPath:String="/api/location/v2/clients",
                            cmxConnectedPath:String="api/connect/v1/clients",
                            cmxNotificationPath:String="/api/config/v1/notifications",
                            cmxMapPath:String="/api/config/v1/maps",
                            cmxHistory:String="/api/location/v1/historylite/clients",
                            cmxImageSourcePath:String="",
                            cmxImageNamePath:String="",
                            cmxTimezone:String="-0700",
                            cmxSupportMacAddressQuery:Boolean=true,
                            cmxVersion:String="10.0")
case class GlanceReceiverSetting(receiverProtocol:String="http",
                                 receiverHostName:String=scala.util.Properties.envOrElse("GLANCE_HOST", ""),
                                 receiverHostPort:Int=9000,
                                 receiverCallbackAPIPath:String="/api/v1/callback/notification")
//default as our test account...
case class TropoSetting(tropoAuthToken:String=ConfigurationService.getString("tropo.smsToken", "0d753570025e434db248cf1dac43478e45383a6336531a9186e1602d7d162eb7a6aac1f1c5862a74234a43391"),
                        tropoSessionUrl:String=ConfigurationService.getString("tropo.uri", "https://api.tropo.com/1.0/sessions"))

case class SparkSetting(uri:String="https://api.ciscospark.com/v1/messages",account:String="",displayName:String="DevNet Glance",avatar:String="",token:String="")

//case class SparkAccount(id:String, email:String,displayName:String="",avatar:String="")
case class GlanceSystemConf(  _id: BSONObjectID = BSONObjectID.generate,
                              glanceOrgId:String="",
                              assignedTenantId:String=ComUtils.glanceInstantId,
                              glanceCmxSetting:GlanceCMXSetting=new GlanceCMXSetting(),
                              glanceReceiverSetting:GlanceReceiverSetting=new GlanceReceiverSetting(),
                              tropoSetting:TropoSetting=new TropoSetting(),
                              sparkSetting:SparkSetting=new SparkSetting("https://api.ciscospark.com/v1/messages","","DevNet Glance","",""),
                              recognitionUrl:String="",
                              merakiValidator:String="1212053e6a917d0e49e877d03728bfd421767c19",
                              merakiSecret:String="glance123",
                              merakiNotificatonUrl:String="http(s)://your_host/api/v1/callback/meraki/glance/floor1",
                              zoneCountThreshold:Long=ComUtils.DEFAULT_ZONECOUNT_THRESHOLD,
                              defaultTrackingCampus:String="",
                              historyDataExpiredDays:Long =0,
                              defaultTimeZone:String="-0700",
                              companyName:String ="Glance, DevNet",
                              animationSupport:Boolean=ComUtils.defaultAnimationSupport, //this option has not be supported
                              userDataImportSupported:Boolean=ComUtils.DEFAULT_USERDARAIMORTSUPPORT,
                              usingInMemoryImportedUserData:Boolean=ComUtils.DEFAULT_INMEMORYIMPORTUSERDATA,
                              currentSchemaVersion:String=ComUtils.DEFAULT_DATASCHEMAVERSION,
                              showCountOfDevices:String =ComUtils.CONST_GLANCE_ALL, //all, BLE, IP,...
                              ldapSetting:GlanceLdapSetting=new GlanceLdapSetting(),
                              tags:List[String]=List(),
                              updated:Long=System.currentTimeMillis())
object GlanceSystemConf {
  val instanceId ="InstanceId"

  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceSystemConfigure")

  import play.api.libs.json._
  import play.api.libs.functional.syntax._
  import reactivemongo.bson._
  import scala.concurrent.ExecutionContext.Implicits.global

  val glanceLdapSettingReaders: Reads[GlanceLdapSetting] = (
      (__ \ "photoUrl").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"http://www.glancedemo.demo/dir/photo/zoom/%s.jpg")) and
      (__ \ "serverAddress").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "ldapUser").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "ldapPass").readNullable[String].map(v => ComUtils.readNullStringDefault(v,""))
    )(GlanceLdapSetting.apply _)

  implicit val glanceLdapSettingWrites = new Writes[GlanceLdapSetting] {
    def writes(z: GlanceLdapSetting): JsValue = {
      Json.obj(
        "photoUrl" -> z.photoUrl,
        "serverAddress" -> z.serverAddress,
        "ldapUser" ->z.ldapUser,
        "ldapPass" -> z.ldapPass
      )
    }
  }

  implicit val glanceLdapSettingFormat = Format(glanceLdapSettingReaders, glanceLdapSettingWrites)

  val glanceCMXSettingReaders: Reads[GlanceCMXSetting] = (
    (__ \ "cmxHost").read[String] and
      (__ \ "cmxPort").read[Int] and
      (__ \ "cmxProtocol").read[String] and
      (__ \ "cmxUserName").read[String] and
      (__ \ "cmxPassword").read[String] and
      (__ \ "cmxClientPath").read[String] and
      (__ \ "cmxConnectedPath").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"/api/connect/v1/clients")) and
      (__ \ "cmxNotificationPath").read[String] and
      (__ \ "cmxMapPath").read[String] and
      (__ \ "cmxHistory").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"/api/location/v1/historylite/clients")) and
      (__ \ "cmxImageSourcePath").read[String]  and
      (__ \ "cmxImageNamePath").read[String] and
      (__ \ "cmxTimezone").read[String]  and
      (__ \ "cmxSupportMacAddressQuery").read[Boolean] and
      (__ \ "cmxVersion").read[String]
    )(GlanceCMXSetting.apply _)

  implicit val glanceCMXSettingWrites = new Writes[GlanceCMXSetting] {
    def writes(z: GlanceCMXSetting): JsValue = {
      Json.obj(
        "cmxHost" -> z.cmxHost,
        "cmxPort" -> z.cmxPort,
        "cmxProtocol" ->z.cmxProtocol,
        "cmxUserName" -> z.cmxUserName,
        "cmxPassword" -> z.cmxPassword,
        "cmxClientPath" -> z.cmxClientPath,
        "cmxConnectedPath" ->z.cmxConnectedPath,
        "cmxNotificationPath" -> z.cmxNotificationPath,
        "cmxMapPath" -> z.cmxMapPath,
        "cmxHistory" -> z.cmxHistory,
        "cmxImageSourcePath" -> z.cmxImageSourcePath,
        "cmxImageNamePath" -> z.cmxImageNamePath,
        "cmxTimezone" -> z.cmxTimezone,
        "cmxSupportMacAddressQuery" -> z.cmxSupportMacAddressQuery,
        "cmxVersion" -> z.cmxVersion
      )
    }
  }

  implicit val glanceCMXSettingFormat = Format(glanceCMXSettingReaders, glanceCMXSettingWrites)

  val glanceReceiverSettingReaders: Reads[GlanceReceiverSetting] = (
    (__ \ "receiverProtocol").read[String] and
      (__ \ "receiverHostName").read[String] and
      (__ \ "receiverHostPort").read[Int] and
      (__ \ "receiverCallbackAPIPath").read[String]
    )(GlanceReceiverSetting.apply _)

  implicit val glanceReceiverSettingWrites = new Writes[GlanceReceiverSetting] {
    def writes(z: GlanceReceiverSetting): JsValue = {
      Json.obj(
        "receiverProtocol" -> z.receiverProtocol,
        "receiverHostName" -> z.receiverHostName,
        "receiverHostPort" ->z.receiverHostPort,
        "receiverCallbackAPIPath" -> z.receiverCallbackAPIPath
      )
    }
  }

  implicit val glanceReceiverSettingFormat = Format(glanceReceiverSettingReaders, glanceReceiverSettingWrites)

  val tropoSettingReaders: Reads[TropoSetting] = (
    (__ \ "tropoAuthToken").read[String] and
      (__ \ "tropoSessionUrl").read[String]
    )(TropoSetting.apply _)

  implicit val tropoSettingWrites = new Writes[TropoSetting] {
    def writes(z: TropoSetting): JsValue = {
      Json.obj(
        "tropoAuthToken" -> z.tropoAuthToken,
        "tropoSessionUrl" -> z.tropoSessionUrl
      )
    }
  }

  implicit val tropoSettingFormat = Format(tropoSettingReaders, tropoSettingWrites)

  val sparkSettingReaders: Reads[SparkSetting] = (
      (__ \ "uri").read[String] and
      (__ \ "account").read[String] and
      (__ \ "displayName").read[String] and
      (__ \ "avatar").read[String] and
      (__ \ "token").read[String]
    )(SparkSetting.apply _)

  implicit val sparkSettingWrites = new Writes[SparkSetting] {
    def writes(z: SparkSetting): JsValue = {
      Json.obj(
        "uri" -> z.uri,
        "account" -> z.account,
        "displayName" -> z.displayName,
        "avatar" -> z.avatar,
        "token" -> z.token
      )
    }
  }
  implicit val sparkSettingFormat = Format(sparkSettingReaders, sparkSettingWrites)

  implicit val tolerantGlanceConfReaders = new Reads[GlanceSystemConf] {
    def reads(js: JsValue) = {
      try {
        val glanceReceiver:GlanceReceiverSetting =(js \ "glanceReceiverSetting").as[GlanceReceiverSetting]

        JsSuccess(GlanceSystemConf(
          (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ "assignedTenantId").asOpt[String].getOrElse(ComUtils.glanceInstantId),
          (js \ "glanceCmxSetting").as[GlanceCMXSetting],
          (js \ "glanceReceiverSetting").as[GlanceReceiverSetting],
          (js \ "tropoSetting").as[TropoSetting],
          (js \ "sparkSetting").asOpt[SparkSetting].getOrElse(new SparkSetting()),
          (js \ "recognitionUrl").asOpt[String].getOrElse(""),
          (js \ "merakiValidator").asOpt[String].getOrElse("3412053e6a917d0e49e878803728bfd561789c19"),
          (js \ "merakiSecret").asOpt[String].getOrElse("glance123"),
          (js \ "merakiNotificatonUrl").asOpt[String].getOrElse({
            if((glanceReceiver.receiverProtocol=="http" && glanceReceiver.receiverHostPort==80) || (glanceReceiver.receiverHostPort==443 && glanceReceiver.receiverProtocol=="https"))
              glanceReceiver.receiverProtocol +"://"+glanceReceiver.receiverHostName+"/api/v1/callback/meraki/glance/floor1"
            else
              glanceReceiver.receiverProtocol +"://"+glanceReceiver.receiverHostName+":"+glanceReceiver.receiverHostPort+"/api/v1/callback/meraki/glance/floor1"
          }
          ),
          (js \ "zoneCountThreshold").asOpt[Long].getOrElse(ComUtils.DEFAULT_ZONECOUNT_THRESHOLD),
          (js \ "defaultTrackingCampus").asOpt[String].getOrElse(""),
          (js \ "historyDataExpiredDays").asOpt[Long].getOrElse(0),
          (js \ "defaultTimeZone").asOpt[String].getOrElse("-0700"),
          (js \ "companyName").asOpt[String].getOrElse("Glance, DevNet, Cisco"),
          (js \ "animationSupport").asOpt[Boolean].getOrElse(ComUtils.defaultAnimationSupport),
          (js \ "userDataImportSupported").asOpt[Boolean].getOrElse(ComUtils.DEFAULT_USERDARAIMORTSUPPORT),
          (js \ "usingInMemoryImportedUserData").asOpt[Boolean].getOrElse(ComUtils.DEFAULT_INMEMORYIMPORTUSERDATA),
          (js \ "currentSchemaVersion").asOpt[String].getOrElse(ComUtils.DEFAULT_DATASCHEMAVERSION),
          (js \ "showCountOfDevices").asOpt[String].getOrElse(ComUtils.DEFAULT_SHOWCOUNTOFDEVICES),
          (js \ "ldapSetting").asOpt[GlanceLdapSetting].getOrElse(new GlanceLdapSetting()),
          (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }


  implicit val glanceConfWrites = new Writes[GlanceSystemConf] {
    def writes(z: GlanceSystemConf): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        "assignedTenantId" ->z.assignedTenantId,
        "glanceCmxSetting" -> Json.toJson(z.glanceCmxSetting),
        "glanceReceiverSetting" -> Json.toJson(z.glanceReceiverSetting),
        "tropoSetting" -> Json.toJson(z.tropoSetting),
        "sparkSetting" -> Json.toJson(z.sparkSetting),
        "recognitionUrl" -> z.recognitionUrl,
        "merakiValidator" ->z.merakiValidator,
        "merakiSecret" ->z.merakiSecret,
        "zoneCountThreshold" -> z.zoneCountThreshold,
        "defaultTrackingCampus" -> z.defaultTrackingCampus,
        "historyDataExpiredDays" ->z.historyDataExpiredDays,
        "defaultTimeZone" -> z.defaultTimeZone,
        "companyName" -> z.companyName,
        "animationSupport" ->z.animationSupport,
        "userDataImportSupported"->z.userDataImportSupported,
        "usingInMemoryImportedUserData" ->z.usingInMemoryImportedUserData,
        "currentSchemaVersion" ->z.currentSchemaVersion,
        "showCountOfDevices" ->z.showCountOfDevices,
        "ldapSetting" -> z.ldapSetting,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceConfFormat = Format(tolerantGlanceConfReaders, glanceConfWrites)
  val CACHE_NAME="systemConf"

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_SYSCONF_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(sysConf: GlanceSystemConf) = {
    GlanceSystemConf.collection.insert(sysConf).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert GlanceSystemConf:"+Json.toJson(sysConf).toString())
        true
      case _ =>
        Logger.error("Failed to insert GlanceSystemConf:"+Json.toJson(sysConf).toString())
        false
    }
  }

  def addOrUpdate(credential:GlanceCredential,confName:String,subConfName:String,confValue:JsValue):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_DBID -> credential.glanceOrgId)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceMap.collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,credential,confName,subConfName,confValue)
    }yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,credential:GlanceCredential,confName:String,subConfName:String,confValue:JsValue):Future[Boolean] ={

    var confValueEx=confValue
    if(confName=="glanceCmxSetting" &&  subConfName=="cmxPassword")
    {
      confValueEx=JsString(AESEncrypt.encrypt(confValue.asOpt[String].getOrElse("")))
    }

    if(existCount >0){
      update(credential,confName,subConfName,confValueEx)
    }else{
      val conf =new GlanceSystemConf(glanceOrgId = credential.glanceOrgId)
      for{
        bInsert <- insert(conf)
        bUpdate <- {
          if (bInsert==true)
            update(credential,confName,subConfName,confValueEx)
          else
            Future{false}
        }
      } yield bUpdate
    }
  }
  //update sub conf...
  def update(credential:GlanceCredential,confName:String,subConfName:String,confValue:JsValue):Future[Boolean] = {
    var keyName:String=confName
    if(subConfName!="")
      keyName =keyName+"."+subConfName
    Logger.debug("Conf update KeyName:"+keyName)
    GlanceSystemConf.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId),
      Json.obj("$set" -> Json.obj(keyName -> confValue,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update: "+credential.glanceOrgId+" confName:"+confName+"with value:"+confValue.toString())
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update: "+credential.glanceOrgId+" confName:"+confName+"with value:"+confValue.toString())
        false
    }
  }

  def update(credential:GlanceCredential,confName:String,confValue:JsValue):Future[Boolean] = {
    var confValueEx =confValue
    if(confName=="glanceCmxSetting"){
      val cmxPass:String =AESEncrypt.encrypt((confValue \ "cmxPassword").asOpt[String].getOrElse(""))
      var confObj =confValue.as[JsObject]
      confObj -= "cmxPassword"
      confObj +=  ("cmxPassword", JsString(cmxPass))
      confValueEx =confObj
    }

    GlanceSystemConf.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId),
      Json.obj("$set" -> Json.obj(confName -> confValueEx,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.info("Succeeded to update: "+credential.glanceOrgId+" confName:"+confName+"with value:"+confValue.toString())
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update: "+credential.glanceOrgId+" confName:"+confName+"with value:"+confValue.toString())
        false
    }
  }

  def updateSettingViaDirectlyPropertySet(credential:GlanceCredential,updateSettings:JsObject):Future[Boolean]={

    GlanceSystemConf.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId),updateSettings).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update glance system settings by batch:"+updateSettings.toString())
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update glance system settings by batch:"+updateSettings.toString())
        false
    }

  }

  def delete(credential: GlanceCredential): Future[Boolean] = {
    GlanceSystemConf.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId)).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.info("Succeeded to delete conf: "+credential.glanceOrgId)
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.info("Failed to delete conf: "+credential.glanceOrgId)
        false
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,null)
  }

  def readConf(credential:GlanceCredential):Future[GlanceSystemConf] ={
    def checkExist(optConf:Option[GlanceSystemConf]):Future[GlanceSystemConf]={
      if(optConf.isDefined) {
        val sysConf =optConf.get
        val cmxPass = AESEncrypt.decrypt(sysConf.glanceCmxSetting.cmxPassword, sysConf.glanceCmxSetting.cmxPassword)
        val cmxSettings = sysConf.glanceCmxSetting.copy(cmxPassword = cmxPass)
        val sysConfEx = sysConf.copy(glanceCmxSetting = cmxSettings)
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,sysConfEx)
        Future {sysConfEx}
      }else{
        val sysConf:GlanceSystemConf =new GlanceSystemConf(glanceOrgId = credential.glanceOrgId)
        GlanceSystemConf.insert(sysConf).map{ bRet =>
          sysConf
        }
      }
    }

    val optCacheConf = GlanceSyncCache.getGlanceCache[GlanceSystemConf](CACHE_NAME)
    if(optCacheConf.isDefined) {
      Future{optCacheConf.get}
    }else{
      val findByGlanceOrgId  = (org: String) => GlanceSystemConf.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).one[GlanceSystemConf];
      for{
        optConf <- findByGlanceOrgId(credential.glanceOrgId)
        jsObj   <- checkExist(optConf)
      }yield jsObj
    }
  }

  def readConf(credential:GlanceCredential,confName:String):Future[JsObject] ={
    def checkExist(optConf:Option[GlanceSystemConf]):Future[JsObject]={
      if(optConf.isDefined) {
        val sysConf = optConf.get
        val cmxPass = AESEncrypt.decrypt(sysConf.glanceCmxSetting.cmxPassword, sysConf.glanceCmxSetting.cmxPassword)
        val cmxSettings = sysConf.glanceCmxSetting.copy(cmxPassword = cmxPass)
        val sysConfEx = sysConf.copy(glanceCmxSetting = cmxSettings)
        GlanceSyncCache.setGlanceCache[GlanceSystemConf](CACHE_NAME,sysConfEx)
        Future {getValueOf(confName, sysConfEx)}
      }else {
        val sysConf: GlanceSystemConf = new GlanceSystemConf(glanceOrgId = credential.glanceOrgId)
        for {
          bRet <- GlanceSystemConf.insert(sysConf)
        } yield {
          Json.obj()
        }
      }
    }

    def getValueOf(confName:String,sysConf:GlanceSystemConf):JsObject ={
      try {
        val jsObj = Json.toJson(sysConf)
        return Json.obj("value" -> (jsObj \ confName))
      }catch{
        case e:NoSuchFieldException =>
          Logger.error("Failed to read conf, no such field:{}, exception:{}",confName,e.getMessage)
          Json.obj()
        case exp:Throwable =>
          Logger.error("Failed to read conf, field:{}, exception:{}",confName,exp.getMessage)
          Json.obj()
      }
    }
    val optCacheConf =GlanceSyncCache.getGlanceCache[GlanceSystemConf](CACHE_NAME)
    if(optCacheConf.isDefined) {
      Future {
        getValueOf(confName, optCacheConf.get)
      }
    }else{
      val findByGlanceOrgId  = (org: String) => GlanceSystemConf.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).one[GlanceSystemConf];
      for{
        optConf <- findByGlanceOrgId(credential.glanceOrgId)
        jsObj   <- checkExist(optConf)
      }yield jsObj
    }
  }

}