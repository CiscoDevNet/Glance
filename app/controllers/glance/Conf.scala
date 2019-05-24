package controllers.glance

import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import models.glance.guestaccess.GlanceGuestCheckIn
import play.Logger
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import services.security.{AESEncrypt, GlanceCredential}
import utils.{ComUtils, JsonResult}

import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT

import scala.concurrent.Future
import models.cmx.Implicits._
/**
 * Created by kennych on 11/4/15.
 */
object Conf extends Controller with Guard {
  import  play.api.Play.current;

  def confTemplate()=Action { implicit request =>
    val credential =remoteCredential
    val conf =new GlanceSystemConf(glanceOrgId = credential.glanceOrgId)
    Ok(Json.toJson(conf))
  }

  def getAll() = Action.async { implicit request =>
    val credential =remoteCredential
    if(false && !isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceSystemConf.readConf(credential).map{ conf =>
        Ok(Json.toJson(conf))
      }
    }
  }
  def cmxTest()=Action.async { implicit request =>
    val credential =remoteCredential
    def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 2*60*1000) : WSRequestHolder = {
      Logger.info("URI:"+s"$baseUri$api")
      val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
      holder.withHeaders("Content-Type" -> "application/json")
      if(json) holder.withHeaders("Accept" -> "application/json")
      else holder
    }
    def getActiveClientCount(credential: GlanceCredential,cmxConf:GlanceSystemConf):Future[Option[JsValue]] = {
      val clientPath: String = "/api/location/v2/clients/count"
      val holder: WSRequestHolder = createRequest(cmxConf, ComUtils.getBaseUri(cmxConf), clientPath)
      val response = (response: WSResponse) => {
        response.status match {
          case 200 =>
            //Logger.info("Get map data success:"+response.json.toString());
            Some(response.json)
          case _ =>
            Logger.error("getActiveClientCount data failed:" + response.status)
            None
        }
      }
      holder.get().map(response).recover {
        case _ =>
          Logger.error("getActiveClientCount data failed,exception")
          None
      }
    }
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      optData <- getActiveClientCount(credential,sysConf) //try to access a CMX API to make sure function call works
    }yield {
      if(optData.isDefined)
        Ok(optData.get.toString())
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to access CMX API, please check your CMX settings!")))
    }
  }

  //for Glance Config, this is light version to return small config item set
  def getAllForGlanceConfUIDirectly() = Action.async { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceSystemConf.readConf(credential).map{ conf =>
        val dataObj =Json.obj("cmxHost"-> conf.glanceCmxSetting.cmxHost,
          "cmxPort" ->conf.glanceCmxSetting.cmxPort,
          "cmxProtocol" ->conf.glanceCmxSetting.cmxProtocol,
          "cmxUserName" ->conf.glanceCmxSetting.cmxUserName,
          "cmxPassword"->conf.glanceCmxSetting.cmxPassword,
          "cmxTimezone"->conf.glanceCmxSetting.cmxTimezone,
          "receiverProtocol" ->conf.glanceReceiverSetting.receiverProtocol,
          "receiverHostName" ->conf.glanceReceiverSetting.receiverHostName,
          "receiverHostPort" ->conf.glanceReceiverSetting.receiverHostPort,
          "defaultTimezone" ->conf.defaultTimeZone,
          "tropoAuthToken" ->conf.tropoSetting.tropoAuthToken,
          "sparkAccount" -> conf.sparkSetting.account,
          "sparkDisplayName" -> conf.sparkSetting.displayName,
          "sparkToken" -> conf.sparkSetting.token)
        JsonResult(Json.obj(ComUtils.CONST_PROPERTY_DATA -> dataObj))
      }
    }
  }

  def parseAsInt(strVal:String,defVal:Int):Int={
    try{
      strVal.toInt
    }catch {
      case exp:Throwable =>
        defVal
    }
  }

  def updateSystemSetting() = Action.async(parse.multipartFormData) { implicit request =>
    val credential =remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    val cmxHost =remoteExtractDataString(request.body.dataParts.get("cmxHost"))
    val cmxPort =parseAsInt(remoteExtractDataString(request.body.dataParts.get("cmxPort"),"443"),443)
    val cmxProtocol =remoteExtractDataString(request.body.dataParts.get("cmxProtocol"))
    val cmxUserName =remoteExtractDataString(request.body.dataParts.get("cmxUserName"))
    val cmxPassword =AESEncrypt.encrypt(remoteExtractDataString(request.body.dataParts.get("cmxPassword")))
    val cmxTimezone =remoteExtractDataString(request.body.dataParts.get("cmxTimezone"))
    val receiverProtocol =remoteExtractDataString(request.body.dataParts.get("receiverProtocol"))
    val receiverHostName =remoteExtractDataString(request.body.dataParts.get("receiverHostName"))
    val receiverHostPort =parseAsInt(remoteExtractDataString(request.body.dataParts.get("receiverHostPort"),"80"),80)
    val defaultTimezone =remoteExtractDataString(request.body.dataParts.get("defaultTimezone"))
    val tropoAuthToken =remoteExtractDataString(request.body.dataParts.get("tropoAuthToken"))
    val sparkAccount =remoteExtractDataString(request.body.dataParts.get("sparkAccount"),"devnetglance@sparkbot.io")
    val sparkDisplayName =remoteExtractDataString(request.body.dataParts.get("sparkDisplayName"),"DevNet Glance")
    val sparkToken =remoteExtractDataString(request.body.dataParts.get("sparkToken"),"MTQxMzg2NjQtYTQyMi00YzU4LWJiNzMtMjQ4ODEzYjg5NWUwNjhlZjAxYWMtNGI0")

    val updateSet=Json.obj("$set" -> Json.obj("glanceCmxSetting.cmxHost" -> cmxHost,
                  "glanceCmxSetting.cmxPort" -> JsNumber(cmxPort),
                  "glanceCmxSetting.cmxProtocol" -> cmxProtocol,
                  "glanceCmxSetting.cmxUserName" -> cmxUserName,
                  "glanceCmxSetting.cmxPassword" -> cmxPassword,
                  "glanceCmxSetting.cmxTimezone" -> cmxTimezone,
                  "glanceReceiverSetting.receiverProtocol" -> receiverProtocol,
                  "glanceReceiverSetting.receiverHostName" -> receiverHostName,
                  "glanceReceiverSetting.receiverHostPort" -> JsNumber(receiverHostPort),
                  "glanceReceiverSetting.receiverCallbackAPIPath" -> (new GlanceReceiverSetting()).receiverCallbackAPIPath, //force update the callback url..
                  "defaultTimezone" -> defaultTimezone,
                  "tropoSetting.tropoAuthToken" -> tropoAuthToken,
                  "sparkSetting.uri" -> "https://api.ciscospark.com/v1/messages",
                  "sparkSetting.avatar" -> "",
                  "sparkSetting.account" -> sparkAccount,
                  "sparkSetting.displayName" -> sparkDisplayName,
                  "sparkSetting.token" -> sparkToken,
                  ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        bUpdateSetting <- GlanceSystemConf.updateSettingViaDirectlyPropertySet(credential,updateSet)
      }yield {
        if(bUpdateSetting)
          Redirect(redirectUrl)
        else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update the system settings")))
        }
      }
    }
  }

  def getByName(name: String) =Action.async {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceSystemConf.readConf(credential,name).map{ conf =>
        JsonResult(conf)
      }
    }
  }

  //following are the APIs to read/set conf properties by names
  def zoneCountThreshold()=Action.async {implicit request =>
    val credential =remoteCredential
    val name ="zoneCountThreshold"
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceSystemConf.readConf(credential,name).map{ conf =>
        JsonResult(conf)
      }
    }
  }

  def setZoneCountThreshold(count:Long)= Action.async(parse.anyContent) {implicit request =>
    val credential =remoteCredential
    val name ="zoneCountThreshold"
    val jsValue =JsNumber(count)
    Logger.debug(s"Set zoneCountThreshold, value:$count")
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(verifyConf(name,"",jsValue)==false)
      {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("No zoneCountThreshold value pairs")))}
      }else{
        GlanceSystemConf.addOrUpdate(credential,name,"",jsValue).map{ result =>
          JsonResult(Json.toJson(GlanceStatus.successStatus(s"Update $name success")))
        }
      }
    }
  }

  def setByName(name: String) =Action.async(parse.json) { implicit request =>
    val credential =remoteCredential
    val jsValue =(request.body \ "value").as[JsValue]
    Logger.info("Conf setByName value,name:{},value:{}",name,Json.toJson(jsValue))
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(verifyConf(name,"",jsValue)==false)
      {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus(s"Please check the value and name:$name value pairs")))}
      }else{
        GlanceSystemConf.addOrUpdate(credential,name,"",jsValue).map{ result =>
          JsonResult(Json.toJson(GlanceStatus.successStatus(s"Update value of $name success")))
        }
      }
    }
  }

  def verifyConf(confName:String,subConfName:String,jsValue:JsValue):Boolean={
      import reflect.runtime.universe._
    Logger.info("verifyConf:"+confName +" subConfName:"+subConfName)
      def isBoolean(jsValue:JsValue):Boolean= {
        try{
          val value:Boolean =jsValue.as[Boolean]
          Logger.info(s"Verify config value(convert Boolean successfully):$value")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to Boolean:{}",ex.getMessage)
            false
        }
      }
      def isString(jsValue:JsValue):Boolean={
          try{
            val value:String =jsValue.as[String]
            Logger.info(s"Verify config value(convert String successfully):$value")
            true
          } catch {
            case ex:Throwable =>
              Logger.error("Failed to parse the value to String:{}",ex.getMessage)
              false
          }
      }
      def isLong(jsValue:JsValue):Boolean={
        try{
          val value:Long =jsValue.as[Long]
          Logger.info(s"Verify config value(convert Long successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to Long:{}",ex.getMessage)
            false
        }
      }
      def isListString(jsValue:JsValue):Boolean={
        try{
          val value:List[String] =jsValue.as[List[String]]
          Logger.info(s"Verify config value(convert String List successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to List[String]",ex.getMessage)
            false
        }
      }
      def isSparkSetting(jsValue: JsValue):Boolean={
        try{
          val value:SparkSetting =jsValue.as[SparkSetting](GlanceSystemConf.sparkSettingReaders)
          Logger.info(s"Verify config value(convert SparkSetting successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to SparkSetting:{}",ex.getMessage)
            false
        }
      }

      def isTropoSetting(jsValue:JsValue):Boolean={
        try{
          val value:TropoSetting =jsValue.as[TropoSetting](GlanceSystemConf.tropoSettingReaders)
          Logger.info(s"Verify config value(convert TropoSetting successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to TropoSetting:{}",ex.getMessage)
            false
        }
      }
      def isCmxSetting(jsValue:JsValue):Boolean={
        try{
          val value:GlanceCMXSetting =jsValue.as[GlanceCMXSetting](GlanceSystemConf.glanceCMXSettingReaders)
          Logger.info(s"Verify config value(convert GlanceCMXSetting successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to GlanceCMXSetting:{}",ex.getMessage)
            false
        }
      }
      def isReceiverSetting(jsValue: JsValue):Boolean={
        try{
          val value:GlanceReceiverSetting =jsValue.as[GlanceReceiverSetting](GlanceSystemConf.glanceReceiverSettingReaders)
          Logger.info(s"Verify config value(convert GlanceReceiverSetting successfully)")
          true
        } catch {
          case ex:Throwable =>
            Logger.error("Failed to parse the value to GlanceReceiverSetting:{}",ex.getMessage)
            false
        }
      }
      if(subConfName==""){
        try{
          if(!ComUtils.objectHasProperty(new GlanceSystemConf(),confName))
              return false
           confName match{
            case "glanceOrgId" =>
              isString(jsValue)
            case "assignedTenantId" =>
              isString(jsValue)
            case "glanceCmxSetting" =>
              isCmxSetting(jsValue)
            case "glanceReceiverSetting" =>
              isReceiverSetting(jsValue)
            case "tropoSetting" =>
              isTropoSetting(jsValue)
            case "sparkSetting" =>
              isSparkSetting(jsValue)
            case "merakiValidator" =>
              isString(jsValue)
            case "merakiSecret" =>
              isString(jsValue)
            case "zoneCountThreshold" =>
              isLong(jsValue)
            case "defaultTrackingCampus" =>
              isString(jsValue)
            case "recognitionUrl" =>
              isString(jsValue)
            case "showCountOfDevices" =>
              isString(jsValue)
            case "companyName" =>
              isString(jsValue)
            case "defaultTimeZone" =>
              isString(jsValue)
            case "animationSupport" =>
              isBoolean(jsValue)  //this option has not been supported
            case "userDataImportSupported" =>
              isBoolean(jsValue)
            case "usingInMemoryImportedUserData"=>
              isBoolean(jsValue)
            case ComUtils.CONST_PROPERTY_TAGS =>
                isListString(jsValue)
            case ComUtils.CONST_PROPERTY_UPDATED =>
              isLong(jsValue)
            case _ =>
              false
          }
        }catch{
          case e: NoSuchFieldException =>
            Logger.error("Exception when check conf value pair,confName:{},exception:{}",confName,e.getMessage)
            return false
          case ex:Throwable =>
            Logger.error("Exception when check conf value pair,confName:{},exception:{}",confName,ex.getMessage)
            return false
        }
      }else{
        try {
          if(!ComUtils.objectHasProperty(new GlanceSystemConf(),confName))
            return false
          confName match{
            case "glanceCmxSetting" =>
              return ComUtils.objectHasProperty(new GlanceCMXSetting(),subConfName)
            case "glanceReceiverSetting" =>
              return ComUtils.objectHasProperty(new GlanceReceiverSetting(),subConfName)
            case "tropoSetting" =>
              return ComUtils.objectHasProperty(new TropoSetting(),subConfName)
            case "sparkSetting" =>
              return ComUtils.objectHasProperty(new SparkSetting(),subConfName)
            case _ =>
              false
          }
        }catch{
          case ex:Throwable =>
            Logger.error("Exception when check conf value pair,confName:{},exception:{}",confName,ex.getMessage)
            false
        }
      }
  }

  def setByNameWithSubName(name: String,subName:String) =Action.async(parse.json) { implicit request =>
    val credential =remoteCredential
    val jsValue =(request.body \ "value").as[JsValue]
    Logger.debug("Conf setByNameWithSubName value!"+Json.toJson(jsValue))
    if(!isAdminLoggedIn)
    {
     Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(verifyConf(name,subName,jsValue) == false)
      {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus(s"Please check the value and name:$name, value pairs")))}
      }else{
        GlanceSystemConf.addOrUpdate(credential,name,subName,jsValue).map{ result =>
          try{
            if("animationSupport" == name)
            {
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_MAPSYNC,Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
              Logger.info("Animation enumlator for path-finding has not been implemented!")
            }else if("userDataImportSupported" == name){
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_USERIMPORTCONFIGSYNC,Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
              RegisteredUser.InitUserDataImport(credential)
            }else if("usingInMemoryImportedUserData" == name){
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_USING_INMEMORY_IMPORTDATA_SYNC,Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
              //udpdate the user import settings...
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_USERIMPORTCONFIGSYNC,Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
              RegisteredUser.InitUserDataImport(credential)
            }
          }
          catch{
            case exp:Throwable =>
              Logger.error("Failed to force re-initialize the path finding data!")
          }
          JsonResult(Json.toJson(GlanceStatus.successStatus(s"Update value of $name successfully")))
        }
      }
    }

  }

  //read all raw floors(which matches floors that have been configured in Glance system) info from CMX settings...
  def readAllCMXFloors()=Action.async { implicit request =>
    val credential=remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      GlanceHistory.readAllMapInfo(credential).map{ floors =>
        if(floors.length>0)
          Ok(Json.toJson(ComUtils.getJsonArrayValue(floors.map(x =>Json.toJson(x)(floorWrites)))))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("No floor is found!")))
      }.recover{
        case _ =>
          Logger.error("Failed to read cmx floor settings from CMX system!")
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to read CMX floors' info!")))
      }
    }
  }

  def cleanAllCheckInUserData()=Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if (!isAdminLoggedIn)
    {
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        bCleanRegisterUserData <- RegisteredUser.deleteAll(credential)
        bCleanGuestUser <- GlanceGuestCheckIn.deleteAll(credential)
      } yield {
        if (bCleanRegisterUserData || bCleanGuestUser) {
          Ok(Json.toJson(GlanceStatus.successStatus("All check-in user data of Glance system has been cleaned!")))
        } else {
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to clean all check-in user data of Glance system'!")))
        }
      }
    }
  }
}
