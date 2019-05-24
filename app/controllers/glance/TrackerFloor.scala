package controllers.glance

import java.util.UUID

import controllers.amqp.GlanceSyncCache
import controllers.glance.Conf._
import controllers.glance.InterestPoints._
import controllers.security.Guard
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import utils.{ComUtils, JsonResult}

import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT

import scala.concurrent.Future

/**
 * Created by kennych on 1/7/16.
 */

object TrackerFloor extends Controller with Guard {
  def getAll() = Action.async { implicit request =>
    val credential =remoteCredential
    GlanceTrackFloor.readAll(credential).map{ conf =>
        if(conf.length==0)
          NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking floor found!")))
          //JsonResult(Json.toJson(List(new GlanceTrackFloor(glanceOrgId = credential.glanceOrgId))))
        else
          JsonResult(Json.toJson(conf))
    }.recover{
      case _=>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking floor found, exception!")))
    }
  }

  def trackerFloorTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceTrackFloor(glanceOrgId = credential.glanceOrgId)
    Future{JsonResult(Json.toJson(t))}
  }

  def getById(floorId: String) =Action.async {implicit request =>
    val credential =remoteCredential
    GlanceTrackFloor.readByFloorId(credential,floorId).map{ optConf =>
      optConf match{
        case Some(conf) =>
          JsonResult(Json.toJson(conf))
        case _ =>
          NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking floor found!")))
      }
    }.recover{
      case _=>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched tracking floor found,exception!")))
    }

  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackFloor=request.body.as[GlanceTrackFloor](GlanceTrackFloor.tolerantGlanceTrackFloorReaders)
        GlanceTrackFloor.addOrUpdate(credential,trackFloor).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/Update the tracking floor successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update tracking floor failed!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Incorrect data: add/update tracking floor info,exception:{}",e.getMessage())
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking floor info!")))}
      }
    }

  }

  def addToBuilding(buildingId:String)=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackFloor=request.body.as[GlanceTrackFloor](GlanceTrackFloor.tolerantGlanceTrackFloorReaders)
        GlanceTrackFloor.addOrUpdate(credential,trackFloor,buildingId).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/Update the tracking floor to building successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update tracking floor to building failed!")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking floor to building,exception:{}",e.getMessage())
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect data: add/update tracking floor to building info!")))}
      }
    }

  }



  def update(floorId:String)=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val trackFloor=request.body.as[GlanceTrackFloor](GlanceTrackFloor.tolerantGlanceTrackFloorReaders)
        val trackFloorTo=trackFloor.copy(glanceOrgId = credential.glanceOrgId,floorId=floorId)
        GlanceTrackFloor.addOrUpdate(credential,trackFloorTo).map{ bRet:Boolean =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("update the tracking floor successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("update the tracking floor failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update tracking floor info,exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: add/update tracking floor info!")))}
      }
    }

  }

  def updateFloorForGlance(floorId:String)=Action.async(parse.multipartFormData) {implicit request =>
    val credential =remoteCredential
    def getDataPartValue(url: Option[Seq[String]],defaultValue:String=""): String = {
      url match {
        case Some(seqString: Seq[String]) =>
          seqString.head
        case _ =>
          defaultValue
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
    def parseAsBoolean(strVal:String,defVal:Boolean):Boolean={
      try{
        strVal.toBoolean
      }catch {
        case exp:Throwable =>
          defVal
      }
    }
    def parseAsDouble(strVal:String,defVal:Double):Double={
      try{
        strVal.toDouble
      }catch {
        case exp:Throwable =>
          defVal
      }
    }

    val redirectUrl =getDataPartValue(request.body.dataParts.get("url"))
    val floorIdX =getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_FLOORID))
    val floorName =getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_FLOORNAME))
    val hierarchy =getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_HIERARCHY))
    val mapName =getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_MAPNAME))
    val swapXY =parseAsBoolean(getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_SWAPXY)),false)
    val cmxPositionAmplifyX =parseAsDouble(getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYX)),1.0)
    val cmxPositionAmplifyY =parseAsDouble(getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYY)),1.0)
    val cmxPositionPlusX =parseAsDouble(getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSX)),0.0)
    val cmxPositionPlusY =parseAsDouble(getDataPartValue(request.body.dataParts.get(ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSY)),0.0)
    /*
    */
    val cmxAreaWidth =parseAsDouble(getDataPartValue(request.body.dataParts.get("cmxAreaWidth")),0.0)
    val cmxAreaDeep  =parseAsDouble(getDataPartValue(request.body.dataParts.get("cmxAreaDeep")),0.0)
    if(!isAdminLoggedIn)
    {
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        sysConf <-GlanceSystemConf.readConf(credential)
        updateSet <- Future{
          Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_FLOORNAME -> floorName,
            ComUtils.CONST_PROPERTY_HIERARCHY -> hierarchy,
            ComUtils.CONST_PROPERTY_MAPNAME -> mapName,
            "floorConf.glancePositionCalibrateSetting.swapXY" -> swapXY,
            "floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX" -> cmxPositionAmplifyX,
            "floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY" -> cmxPositionAmplifyY,
            "floorConf.glancePositionCalibrateSetting.cmxPositionPlusX" -> cmxPositionPlusX,
            "floorConf.glancePositionCalibrateSetting.cmxPositionPlusY" -> cmxPositionPlusY,
            "floorConf.glancePositionCalibrateSetting.cmxPositionTrackWidth" -> cmxAreaWidth,
            "floorConf.glancePositionCalibrateSetting.cmxPositionTrackHeight" -> cmxAreaDeep,
            "floorConf.defaultTimeZone" -> sysConf.defaultTimeZone,
            ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis())
          )
        }
        optFloor <- GlanceTrackFloor.readByFloorId(credential,floorIdX)
        bUpdateSetting <- {
          if(optFloor.isDefined)
            GlanceTrackFloor.updateFloorForLowe(credential,floorIdX,updateSet)
          else
            Future{false}
        }
        bUpdateCalibrateSetting <- Future{
          //        if( (cmxPositionAmplifyX<=1.0001 && cmxPositionAmplifyX.toInt>=1) && (cmxPositionAmplifyY<=1.0001 &&cmxPositionAmplifyY.toInt>=1) &&
          //          (cmxPositionPlusX<=0.0001 && cmxPositionPlusX.toInt>=0) && (cmxPositionPlusY<=0.0001 &&cmxPositionPlusY.toInt>=0) &&
          //          (cmxAreaWidth<=0.0001 && cmxAreaWidth.toInt>=0) && (cmxAreaDeep<=0.0001 &&cmxAreaDeep.toInt>=0)  &&
          //          optFloor.isDefined)
          if( (cmxPositionAmplifyX<=1.0001 && cmxPositionAmplifyX.toInt>=1) && (cmxPositionAmplifyY<=1.0001 &&cmxPositionAmplifyY.toInt>=1) &&
            optFloor.isDefined)
          {
            if(!(cmxPositionPlusX<=0.0001 && cmxPositionPlusX.toInt>=0) && (cmxPositionPlusY<=0.0001 &&cmxPositionPlusY.toInt>=0)
            )
              true
            else if(!(cmxPositionPlusX<=0.0001 && cmxPositionPlusX.toInt>=0) && (cmxPositionPlusY<=0.0001 &&cmxPositionPlusY.toInt>=0))
              false
            else
              true
          }else{
            false
          }
        }
        bUpdateBuilding <-{
          if(bUpdateCalibrateSetting && optFloor.isDefined)
          {
            GlanceTrackCampus.updateBuildingSizeOfFloor(credential,sysConf.defaultTrackingCampus,optFloor.get.floorId)
          }
          else
            Future{false}
        }
        bUpdateCalibrate <-{
          if(bUpdateCalibrateSetting)
            GlanceTrackFloor.updateAmplifyRates(credential,optFloor,mapName,hierarchy,swapXY)
          else
            Future{false}
        }
      }yield {
        if(bUpdateSetting){
          if(bUpdateBuilding || bUpdateCalibrate)
          {
            GlanceSyncCache.setGlanceCache[List[GlanceTrackFloor]](GlanceTrackFloor.CACHE_NAME,null)
            GlanceTrackFloor.sendCacheSyncMessage(credential)
          } //if updated, just clean cache to reload...
          GlanceWebSocketActor.listenNotificationForAllFloors(credential)
          Redirect(redirectUrl)
        }
        else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update the floor settings")))
        }
      }
    }
  }

  def delete(floorId:String)=Action.async(parse.empty) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{

        GlanceTrackFloor.delete(credential,floorId).map{ bRet:Boolean =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Delete the tracking floor successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Delete the tracking floor failed")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to delete tracking floor,exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: delete tracking floor!")))}
      }
    }
  }

  def verifyConf(confName:String,subConfName:String,subSubConfName:String,jsValue:JsValue):Boolean={
    import reflect.runtime.universe._
    Logger.info("verifyConf: confName: {},subConfName:{",confName,subConfName)
    def isString(jsValue:JsValue):Boolean={
      try{
        val value:String =jsValue.as[String]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }

    def isDouble(jsValue:JsValue):Boolean={
      try{
        Logger.info("isDouble Value:"+jsValue.toString())
        val value:Double =jsValue.as[Double]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isInt(jsValue:JsValue):Boolean={
      try{
        val value:Int =jsValue.as[Int]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }

    def isBoolean(jsValue:JsValue):Boolean={
      try{
        val value:Boolean =jsValue.as[Boolean]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }

    def isLong(jsValue:JsValue):Boolean={
      try{
        val value:Long =jsValue.as[Long]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isListString(jsValue:JsValue):Boolean={
      try{
        val value:List[String] =jsValue.as[List[String]]
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isGlancePosition(jsValue: JsValue):Boolean= {
      try{
        val value:GlancePosition =jsValue.as[GlancePosition](GlancePosition.tolerantPositionReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
//    def isTropoSetting(jsValue:JsValue):Boolean={
//      try{
//        val value:TropoSetting =jsValue.as[TropoSetting](GlanceSystemConf.tropoSettingReaders)
//        true
//      } catch {
//        case _ =>
//          false
//      }
//    }
    def isDefaultCheckInPositionSetting(jsValue: JsValue):Boolean={
      try{
        val value:DefaultCheckInPositionSetting =jsValue.as[DefaultCheckInPositionSetting](GlanceTrackFloor.defaultCheckInPositionSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isGlanceUILayout(jsValue: JsValue):Boolean={
      try{
        val value:GlanceUILayout =jsValue.as[GlanceUILayout](GlanceTrackFloor.glanceUILayoutReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isFloorConf(jsValue:JsValue):Boolean={
      try{
        val value:GlanceFloorConf =jsValue.as[GlanceFloorConf](GlanceTrackFloor.glanceFloorConfReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }

    def isGlancePositionCalibrateSetting(jsValue: JsValue):Boolean={
      try{
        val value:GlancePositionCalibrateSetting =jsValue.as[GlancePositionCalibrateSetting](GlanceTrackFloor.glancePositionCalibrateSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isCheckIntervalSetting(jsValue: JsValue):Boolean={
      try{
        val value:GlancePositionCalibrateSetting =jsValue.as[GlancePositionCalibrateSetting](GlanceTrackFloor.glancePositionCalibrateSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isMockSetting(jsValue: JsValue):Boolean={
      try{
        val value:MockSetting =jsValue.as[MockSetting](GlanceTrackFloor.mockSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    def isOmniCalibrateSetting(jsValue: JsValue):Boolean= {
      try{
        val value:OmniCalibrateSetting =jsValue.as[OmniCalibrateSetting](GlanceTrackFloor.omniCalibrateSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }


    def isCmxSetting(jsValue:JsValue):Boolean={
      try{
        val value:GlanceCMXSetting =jsValue.as[GlanceCMXSetting](GlanceSystemConf.glanceCMXSettingReaders)
        true
      } catch {
        case _:Throwable =>
          false
      }
    }
    if(subConfName==""){
      try{
        if(!ComUtils.objectHasProperty(new GlanceTrackFloor(),confName))
          return false
        confName match{
          case "glanceOrgId" | ComUtils.CONST_PROPERTY_FLOORID | ComUtils.CONST_PROPERTY_FLOORNAME  | ComUtils.CONST_PROPERTY_HIERARCHY | ComUtils.CONST_PROPERTY_MAPNAME =>
            isString(jsValue)
          case ComUtils.CONST_PROPERTY_FLOORINFO =>
            true
          case ComUtils.CONST_PROPERTY_FLOORCONF =>
            isFloorConf(jsValue)
          case "glanceCmxSetting" =>
            isCmxSetting(jsValue)
          case ComUtils.CONST_PROPERTY_FLOORLEVEL =>
            isInt(jsValue)
          case ComUtils.CONST_PROPERTY_ENABLE =>
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
          return false
        case _:Throwable =>
          return false
      }
    }else{
      try {
        Logger.info("Glance Tracking Floor Conf settings,Conf:"+confName+" subConfName:"+subConfName)
        if(!ComUtils.objectHasProperty(new GlanceTrackFloor(),confName))
          return false
        confName match{
          case "glanceCmxSetting" =>
            return ComUtils.objectHasProperty(new GlanceCMXSetting(),subConfName)
          case ComUtils.CONST_PROPERTY_FLOORCONF =>
            {
              def verifyFloorConf(floorItemName:String,floorSubItemName:String, jsValue:JsValue): Boolean ={
                if(floorSubItemName==""){
                  floorItemName match{
                    case "nameSpace" | "defaultTimeZone" |"defaultSMSNotificationMessage" =>
                      return isString(jsValue)
                    case "defaultMeetingMinutes" =>
                      return isDouble(jsValue)
                    case "maxImageFileSize"   =>
                      return isInt(jsValue)
                    case "defaultCheckInPositionSetting" =>
                      return isDefaultCheckInPositionSetting(jsValue)
                    case "glanceUILayout" =>
                      return isGlanceUILayout(jsValue)
                    case "glancePositionCalibrateSetting" =>
                      return isGlancePositionCalibrateSetting(jsValue)
                    case "checkIntervalSetting" =>
                      return isCheckIntervalSetting(jsValue)
                    case "usingMockData" |"omniCalibrateEnabled" =>
                      return isBoolean(jsValue)
                    case "mockSetting" =>
                        return isMockSetting(jsValue)
                    case "omniCalibrateSetting" =>
                        return isOmniCalibrateSetting(jsValue)
                    case  _=>
                      true
                  }
                }
                else{
                  floorItemName match{
                    case "defaultCheckInPositionSetting" =>
                      def checkDefaultCheckInPositionSettings(itemName:String,jsValue: JsValue):Boolean={
                          itemName match {
                            case "defaultPositionX"|"defaultPositionY" =>
                                isDouble(jsValue)
                            case  "defaultPositionRandom" =>
                              isInt(jsValue)
                            case _=>
                              return ComUtils.objectHasProperty(new DefaultCheckInPositionSetting(),floorSubItemName)
                          }
                      }
                      return checkDefaultCheckInPositionSettings(floorSubItemName,jsValue)
                    case "glanceUILayout" =>
                      def checkGlanceUILayout(itemName:String,jsValue: JsValue):Boolean={
                        itemName match{
                          case "uiLayout" =>
                            isString(jsValue)
                          case "uiBoothCount" =>
                            isLong(jsValue)
                          case _=>
                            return ComUtils.objectHasProperty(new GlanceUILayout(),floorSubItemName)
                        }
                      }
                      return checkGlanceUILayout(floorSubItemName,jsValue)
                    case "glancePositionCalibrateSetting" =>
                      Logger.info("Glance Tracking Floor Conf settings,Conf:"+floorItemName+" floorSubItemName:"+floorSubItemName)
                      def checkGlancePositionCalibrateSetting(itemName:String,jsValue: JsValue):Boolean={
                        itemName match{
                          case ComUtils.CONST_PROPERTY_SWAPXY =>
                            isBoolean(jsValue)
                          case "cmxScaleRate" | ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYX | ComUtils.CONST_PROPERTY_CMXPOSITIONAMPLIFYY | ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSX | ComUtils.CONST_PROPERTY_CMXPOSITIONPLUSY =>
                            Logger.info("Glance Tracking Floor Conf settings,Conf:"+floorItemName+" floorSubItemName:"+floorSubItemName)
                            isDouble(jsValue)
                          case _=>
                            return ComUtils.objectHasProperty(new GlancePositionCalibrateSetting(),floorSubItemName)
                        }
                      }
                      return checkGlancePositionCalibrateSetting(floorSubItemName,jsValue)
                    case "checkIntervalSetting" =>
                      def checkIntervalSetting(itemName:String,jsValue: JsValue):Boolean={
                        itemName match{
                          case "expertIdleExpireMinutes" | "expertActiveCheckInterval" | "expertActiveCheckPageSize"
                            |"cmxVisitorScanIntervalSeconds" | "cmxActiveExpertScanIntervalSeconds"
                            | "cmxVisitorInfoIntervalSeconds" |"cmxStaffUpdateIntervalMinutes" =>
                            isLong(jsValue)
                          case _=>
                            return ComUtils.objectHasProperty(new CheckIntervalSetting(),floorSubItemName)
                        }
                      }
                      return checkIntervalSetting(floorSubItemName,jsValue)
                    case "mockSetting" =>
                      def checkMockSetting(itemName:String,jsValue: JsValue):Boolean={
                        itemName match{
                          case "mockExpertSize"| "mockExpertMove"
                               | "mockUpdateSeconds" | "mockPositionRandomMinX"
                               | "mockPositionRandomMaxX" | "mockPositionRandomMinY" | "mockPositionRandomMaxY"=>
                            isLong(jsValue)
                          case _=>
                            return ComUtils.objectHasProperty(new MockSetting(),floorSubItemName)
                        }
                      }
                      return checkMockSetting(floorSubItemName,jsValue)
                    case "omniCalibrateSetting" =>
                      def checkOmniCalibrateSetting(itemName:String,jsValue: JsValue):Boolean={
                        itemName match {
                          case "calibratePos0" | "calibratePos1" |"calibratePos2"
                          | "calibratePos3" | "calibrateCustomizedPos0" | "calibrateCustomizedPos1"
                          | "calibrateCustomizedPos2" | "calibrateCustomizedPos3"=>
                            isGlancePosition(jsValue)
                          case _=>
                            return ComUtils.objectHasProperty(new OmniCalibrateSetting(),floorSubItemName)
                        }
                      }
                      return checkOmniCalibrateSetting(floorSubItemName,jsValue)
                    case  _=>
                      return verifyFloorConf(floorItemName,"",jsValue)
                  }
                }
              }
              return ComUtils.objectHasProperty(new GlanceFloorConf(),subConfName) && verifyFloorConf(subConfName,subSubConfName,jsValue)
            }
          case _ =>
            false
        }
      }catch{
        case ex:Throwable=>
          Logger.error("Exception when check conf value pair,exception:{}",ex.getMessage)
          false
      }
    }
  }

  //fixme ....
  def updateFloorInfoBySubName(floorNameOrId:String,confName:String,subName:String="",subSubName:String="")=Action.async(parse.json){implicit request =>
    val credential =remoteCredential
    val jsValue =(request.body \ "value").as[JsValue]
    Logger.info("Glance Track floor update conf settings!"+Json.toJson(jsValue))
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(verifyConf(confName,subName,subSubName,jsValue)==false)
      {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Please check the value and name:"+confName+" value pairs")))}
      }else{
        GlanceTrackFloor.updateTrackFloorInfoBySubName(credential,floorNameOrId,confName,subName,subSubName,jsValue).map{ result =>
          JsonResult(Json.toJson(GlanceStatus.successStatus("Update "+confName+" success")))
        }
      }
    }
  }

  def updateFloorInfoBySubNameViaGet(floorNameOrId:String,confName:String,subName:String="",subSubName:String="")=Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    val value = remoteQueryString(request, "value","")
    def parseValueAsObject(strValue: String): JsValue = {
      try{
        val jsonValue = Json.parse(strValue)
        jsonValue
      }catch{
      case ex: Throwable =>
        Logger.info("Failed to parse query string value as Json object:"+strValue)
        JsString(strValue)
      }
    }
    val jsValue: JsValue = parseValueAsObject(value)
    Logger.info("Glance Track floor update conf settings!"+Json.toJson(jsValue))
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(value.compareTo("")==0 || verifyConf(confName,subName,subSubName,jsValue)==false)
      {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Please check the value and name:"+confName+" value pairs")))}
      }else{
        GlanceTrackFloor.updateTrackFloorInfoBySubName(credential,floorNameOrId,confName,"","",jsValue).map{ result =>
          JsonResult(Json.toJson(GlanceStatus.successStatus("Update "+confName+" success")))
        }
      }
    }
  }



}
