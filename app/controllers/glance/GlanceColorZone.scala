package controllers.glance

import java.util.UUID

import controllers.amqp.GlanceSyncCache
import controllers.glance.Avatar._
import controllers.glance.GlanceAuth._
import controllers.glance.GlanceUser._
import controllers.glance.TrackerFloor._
import controllers.security.Guard
import models.cmx.Notitification.Implicits._
import models.cmx.{Zone, MapCoordinate}
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import services.cisco.notification.NotificationService
import services.security.{AESEncrypt, GlanceCredential}
import utils.ComUtils
import scala.concurrent.ExecutionContext.Implicits.global
import utils.ComUtils.MAX_CONTENT
import play.api.Play.current
import scala.concurrent.{Promise, Future}
import models.cmx.Implicits._

/**
 * Created by kennych on 11/1/16.
 */
object GlanceColorZone extends Controller with Guard {

  def glanceZoneTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceZone(glanceOrgId = credential.glanceOrgId,
      zoneName = "TemplateName",
      floorId = "tempFloorId",
      temporary = true,
      zone = new Zone(name="TemplateName",zoneCoordinate=List(new MapCoordinate(0,0,0)))
    )
    Future{Ok(Json.toJson(t))}
  }

  //update zones info from cmx system
  def updateSystemZones() = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        bDeleteAllSysZones <- GlanceZone.deleteAllSysZones(credential)
        bUpdateSysZones <- GlanceZone.updateAllSysZones(credential)
      } yield {
        if (bUpdateSysZones)
          Ok(Json.toJson(GlanceStatus.successStatus("Update system zones for tracking floors successfully!")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update system zones for tracking floors!")))
      }
    }
  }

  def getDefaultColors() = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    for {
      colors <- GlanceZoneColor.readAllDefaultColors(credential)
    } yield {
      Ok(Json.obj("colors" -> ComUtils.getJsonArrayStr(colors)))
    }
  }

  //update tempory zones from UI svg parser
  def addTempZones()= Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    try {
      val zones = request.body.asOpt[List[JsValue]].getOrElse(List())
      val tempZones:List[GlanceZone] = zones.map(p => p.as[GlanceZone](GlanceZone.tolerantGlanceZoneReaders))
      for{
        bUpdate <- GlanceZone.updateTemporaryZones(credential,tempZones)
      }yield{
        if (bUpdate)
          Ok(Json.toJson(GlanceStatus.successStatus("Add/Update the tracking temporary zones successfully")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update tracking temporary zones failed!")))
      }
    }catch {
      case ex:Throwable =>
        Logger.error("Exception data: add/update tracking floor info:{}",ex.getMessage())
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Unknown exception: add/update temporary zones info")))
        }
    }
  }

  def addZone() = Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    def readGlanceZone():GlanceZone={
      try {
        val glanceZone = request.body.as[GlanceZone](GlanceZone.tolerantGlanceZoneReaders)
        var glanceZone_new = glanceZone.copy(glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, zoneId = {
          if (glanceZone.zoneId != "")
            glanceZone.zoneId
          else
            UUID.randomUUID().toString
        },
          zoneName = {
            if (glanceZone.zoneName == "")
              glanceZone.zone.name
            else
              glanceZone.zoneName
          },
          zoneDisplayName = {
            if (glanceZone.zoneDisplayName != "")
              glanceZone.zoneDisplayName
            else if (glanceZone.zoneName == "")
              glanceZone.zone.name
            else
              glanceZone.zoneName
          }
        )
        if (glanceZone_new.zoneName != "" && glanceZone_new.zone.name == "")
          glanceZone_new = glanceZone_new.copy(zone = glanceZone_new.zone.copy(name = glanceZone_new.zoneName))
        glanceZone_new
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to parse data, exception:{}",exp.getMessage)
          null
      }
    }
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      val glanceZone = readGlanceZone()
      if (glanceZone==null || ( glanceZone.floorId == "" ||
        (glanceZone.zoneName == "" && glanceZone.zoneId == "") ||
        glanceZone.zone.zoneCoordinate.length <= 0)) {
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid data: Glance Zone info!")))
        }
      }else {
        for {
          floor <- GlanceTrackFloor.readByFloorId(credential, glanceZone.floorId)
          bUpdate <- {
            if (floor.isDefined)
              GlanceZone.addOrUpdate(glanceZone)
            else
              Future {false}
          }
        } yield {
          if (!floor.isDefined) {
            BadRequest(Json.toJson(GlanceStatus.failureStatus("The floor does not exist, please check the floor Id")))
          }else if (bUpdate)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/Update the tracking floor successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update tracking floor failed!")))
        }
      }
    }
  }

  private def getResult(bRet: Boolean, toURL: String): Result = {
    if (bRet ==false)
      return NotFound(Json.toJson(GlanceStatus.failureStatus("Update Glance Zone failed")))
    if (toURL == "")
      return PartialContent(Json.toJson(GlanceStatus.failureStatus("Invalid redirect URL")))
    else
      return Redirect(toURL + "?timestamp=" + System.currentTimeMillis(), 301)
  }

  private  def parseZoneArea(zaJson: String): Zone = {
    try {
      val zone: Zone = Json.parse(zaJson).as[Zone]
      zone
    } catch {
      case exp: Exception =>
        Logger.error("Failed to parse facility coordination:{}",exp.getMessage)
        null
    }
  }

  def addZoneWithMapOriginalPosition() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    val zoneName = remoteExtractDataString(request.body.dataParts.get("zoneName"))
    val zoneDisplayName = remoteExtractDataString(request.body.dataParts.get("zoneDisplayName"),zoneName)
    val zoneArea = remoteExtractDataString(request.body.dataParts.get("zoneArea"))
    val zoneColor = remoteExtractDataString(request.body.dataParts.get("zoneColor"),GlanceZone.rgbColorToRRGGBB(GlanceZone.blankRGBColor()))
    val floorNameId = remoteExtractDataString(request.body.dataParts.get("floor"))
    val zoneZA: Zone = parseZoneArea(zoneArea)
    def readGlanceZoneOriginal():GlanceZone= {
      val glanceZone: GlanceZone = new GlanceZone(glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        floorId = floorNameId,
        zoneId = UUID.randomUUID().toString,
        zoneName = zoneName,
        zoneDisplayName = zoneDisplayName,
        zone = zoneZA,
        color = GlanceZone.rrggbbToRGBColor(zoneColor)
      )
      var glanceZone_new = glanceZone.copy(glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, zoneId = {
        if (glanceZone.zoneId != "")
          glanceZone.zoneId
        else
          UUID.randomUUID().toString
      },
        zoneName = {
          if (glanceZone.zoneName == "")
            glanceZone.zone.name
          else
            glanceZone.zoneName
        },
        zoneDisplayName = {
          if (glanceZone.zoneDisplayName != "")
            glanceZone.zoneDisplayName
          else if (glanceZone.zoneName == "")
            glanceZone.zone.name
          else
            glanceZone.zoneName
        }
      )
      if (glanceZone_new.zoneName != "" && glanceZone_new.zone.name == "")
        glanceZone_new = glanceZone_new.copy(zone = glanceZone_new.zone.copy(name = glanceZone_new.zoneName))
      return glanceZone_new
    }
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else if (redirectUrl == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))
      }
    }else if (zoneName == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No zone name")))
      }
    }else if (zoneArea == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No zone area info")))
      }
    }else if (floorNameId == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No floor info")))
      }
    }else if (zoneZA == null) {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Zone Area Info")))
      }
    }else{
      val glanceZone_new =readGlanceZoneOriginal()
      if (glanceZone_new.floorId == "" || (glanceZone_new.zoneName == "" && glanceZone_new.zoneId == "") || glanceZone_new.zone.zoneCoordinate.length <= 0) {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid data: for Glance Zone info!")))}
      }else {
        for {
          floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId, glanceZone_new.floorId)
          mapSizes <- GlanceMapSizeInfo.readAllConf(credential)
          bUpdate <- {
            if (floor != null) {
              GlanceZone.addOrUpdate(glanceZone_new.copy(floorId = floor.floorId, zone = {
                glanceZone_new.zone.copy(zoneCoordinate = {
                  glanceZone_new.zone.zoneCoordinate.map(p => {
                    val (_, posArr) = NotificationService.getPositionArr(p, floor, null, mapSizes)
                    p.copy(x = posArr(0).toDouble, y = posArr(1).toDouble)
                  })
                })
              }))
            } else {
              Future {
                false
              }
            }
          }
        } yield {
          if (floor == null) {
            BadRequest(Json.toJson(GlanceStatus.failureStatus("The floor does not exist, please check the floor Id")))
          } else
            getResult(bUpdate, redirectUrl)
        }
      }
    }
  }

  def addZoneByGlanceMapPixels() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    val zoneName = remoteExtractDataString(request.body.dataParts.get("zoneName"))
    val zoneDisplayName = remoteExtractDataString(request.body.dataParts.get("zoneDisplayName"),zoneName)
    val zoneArea = remoteExtractDataString(request.body.dataParts.get("zoneArea"))
    val zoneColor = remoteExtractDataString(request.body.dataParts.get("zoneColor"),GlanceZone.rgbColorToRRGGBB(GlanceZone.blankRGBColor()))
    val floorNameId = remoteExtractDataString(request.body.dataParts.get("floor"))
    val zoneZA: Zone = parseZoneArea(zoneArea)

    def build_glance_zone_inline():GlanceZone={
      val glanceZone: GlanceZone = new GlanceZone(glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        floorId = floorNameId,
        zoneId = UUID.randomUUID().toString,
        zoneName = zoneName,
        zoneDisplayName = zoneDisplayName,
        zone = zoneZA,
        color = GlanceZone.rrggbbToRGBColor(zoneColor)
      )
      var glanceZone_new = glanceZone.copy(glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, zoneId = {
        if (glanceZone.zoneId != "")
          glanceZone.zoneId
        else
          UUID.randomUUID().toString
      },
        zoneName = {
          if (glanceZone.zoneName == "")
            glanceZone.zone.name
          else
            glanceZone.zoneName
        },
        zoneDisplayName = {
          if (glanceZone.zoneDisplayName != "")
            glanceZone.zoneDisplayName
          else if (glanceZone.zoneName == "")
            glanceZone.zone.name
          else
            glanceZone.zoneName
        }
      )
      if (glanceZone_new.zoneName != "" && glanceZone_new.zone.name == "")
        glanceZone_new = glanceZone_new.copy(zone = glanceZone_new.zone.copy(name = glanceZone_new.zoneName))
      return glanceZone_new
    }

    if (redirectUrl == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))
      }
    }else if (zoneName == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No zone name")))
      }
    }else if (zoneArea == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No zone area info")))
      }
    }else if (floorNameId == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No floor info")))
      }
    }else if (zoneZA == null) {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Zone Area Info")))
      }
    }else{
      val glanceZone_new =build_glance_zone_inline()
      if (glanceZone_new.floorId == "" || (glanceZone_new.zoneName == "" && glanceZone_new.zoneId == "") || glanceZone_new.zone.zoneCoordinate.length <= 0) {
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect data: for Glance Zone info!")))
        }
      } else {
        for {
          floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId, glanceZone_new.floorId)
          bUpdate <- {
            if (floor != null) {
              GlanceZone.addOrUpdate(glanceZone_new.copy(floorId = floor.floorId))
            } else {
              Future {false}
            }
          }
        } yield {
           if (floor == null) {
             BadRequest(Json.toJson(GlanceStatus.failureStatus("The floor does not exist, please check the floor Id")))
           }else
             getResult(bUpdate, redirectUrl)
        }
      }
    }
  }

  def addZoneToFloor(floorId: String) = Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    def build_glance_zone_inline():GlanceZone= {
      try {
        val zone = request.body.as[GlanceZone](GlanceZone.tolerantGlanceZoneReaders)
        var zoneX = zone.copy(glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, zoneId = {
          if (zone.zoneId != "")
            zone.zoneId
          else
            UUID.randomUUID().toString
         },
          zoneName = {
            if (zone.zoneName == "")
              zone.zone.name
            else
              zone.zoneName
          },
          zoneDisplayName = {
            if (zone.zoneDisplayName != "")
              zone.zoneDisplayName
            else if (zone.zoneName == "")
              zone.zone.name
            else
              zone.zoneName
          }
        )
        if (zoneX.zoneName != "" && zoneX.zone.name == "")
          zoneX = zoneX.copy(zone = zoneX.zone.copy(name = zoneX.zoneName))
        if (floorId != "")
          zoneX = zoneX.copy(floorId = floorId)
        return zoneX
      }catch {
        case exp:Throwable=>
          Logger.error("Failed to parse zone info when add/update zone to floor, exception:{}",exp.getMessage)
          return null
      }
    }

    if(!isAdminLoggedIn)
    {
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else {
      val glanceZone =build_glance_zone_inline()
      if (glanceZone.floorId == "" || (glanceZone.zoneName == "" && glanceZone.zoneId == "") || glanceZone.zone.zoneCoordinate.length <= 0) {
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect data: for Glance Zone info!")))
        }
      }else {
        for {
          floor <- GlanceTrackFloor.readByFloorId(credential, glanceZone.floorId)
          bUpdate <- {
            if (floor.isDefined)
              GlanceZone.addOrUpdate(glanceZone)
            else
              Future {false}
          }
        } yield {
          if (!floor.isDefined)
            BadRequest(Json.toJson(GlanceStatus.failureStatus("The floor does not exist, please check the floor Id")))
          else if (bUpdate)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/Update zone info to tracking floor successfully")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update zone info to tracking floor failed!")))
        }
      }
    }
  }

  def deleteZoneByFloor(floorNameId: String) = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorNameId)
        bDelete <- {
          if (floor!=null)
            GlanceZone.deleteZoneByFloor(credential, floor.floorId)
          else
            Future {false}
        }
      } yield {
        if (floor==null)
          BadRequest(Json.toJson(GlanceStatus.failureStatus(s"Invalid floor Id, please check the floorId or Name does exist:$floorNameId")))
        else if (bDelete) {
          Ok(Json.toJson(GlanceStatus.successStatus(s"Delete zone by floor name(id) successfully:$floorNameId")))
        } else {
          NotFound(Json.toJson(GlanceStatus.failureStatus(s"Failed to delete zone by floor name(id):$floorNameId")))
        }
      }
    }
  }

  def deleteZoneByName(floorId: String, zoneName: String) = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for {
        floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorId)
        bDelete <- {
          if (floor!=null)
            GlanceZone.deleteZone(credential, floor.floorId, zoneName)
          else
            Future {false}
        }
      } yield {
        if (floor==null)
          BadRequest(Json.toJson(GlanceStatus.failureStatus(s"Invalid floor Id, please check the floorId or Name does exist:$floorId")))
        else if (bDelete) {
          Ok(Json.toJson(GlanceStatus.successStatus(s"Delete Glance zone by name successfully,floorId:$floorId zone Name:$zoneName")))
        } else {
          NotFound(Json.toJson(GlanceStatus.failureStatus(s"Failed to delete Glance zone by name,floorId:$floorId  zone Name:$zoneName")))
        }
      }
    }
  }

  def readGlanceZones() = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    for {
      zones <- GlanceZone.readAllConf(credential.glanceOrgId)
    } yield {
      Ok(ComUtils.getJsonArray(zones.map(p => Json.toJson(p).as[JsObject])))
    }
  }

  def readGlanceZonesByFloor(floorId: String) = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    for {
      floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorId)
      zones <- {
        if (floor!=null)
          GlanceZone.readAllConfByFloor(credential.glanceOrgId, floor.floorId)
        else
          Future {List()}
      }
    } yield {
      if(floor==null)
        NotFound(Json.toJson(GlanceStatus.failureStatus(s"Invalid floor Id or name:$floorId")))
      else
        Ok(ComUtils.getJsonArray(zones.map(p => Json.toJson(p).as[JsObject])))
    }
  }

  def readGlanceZonesByZoneId(floorId: String, zoneId: String) = Action.async(parse.anyContent) { implicit request =>
    val credential = remoteCredential
    for {
      floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorId)
      zone <- {
        if (floor!=null)
          GlanceZone.readConf(credential.glanceOrgId, floor.floorId, zoneId)
        else
          Future { None}
      }
    } yield {
      if (floor==null)
        NotFound(Json.toJson(GlanceStatus.failureStatus(s"Invalid floor Id or name:floorId")))
      else if (!zone.isDefined)
        NotFound(Json.toJson(GlanceStatus.failureStatus(s"Zone could not be found:$zoneId")))
      else
        Ok(Json.toJson(zone.get))
    }
  }

  def updateZoneLabelPosition(zoneName: String, floorId: String) = Action.async(parse.anyContent) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      val xParameter=remoteQueryDouble(request,"x",0.0)
      val yParameter=remoteQueryDouble(request,"y",0.0)
      val position=new MapCoordinate(xParameter,yParameter,0.0,"PIX")
      for {
        floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorId)
        mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
        bUpdate <-{
          if(xParameter.toInt==0 && yParameter.toInt==0)
          {
            GlanceZone.updateSystemZoneLabelPosition(credential,{
              if(floor!=null)
                floor.floorId
              else
                ""
            },zoneName,new MapCoordinate())

          }else{
            if(floor!=null)
            {
              val (_,posArr) =NotificationService.getPositionArr(position,floor,null,mapSizes)
              GlanceZone.updateSystemZoneLabelPosition(credential,floor.floorId,zoneName,position.copy(x=posArr(0).toDouble,y=posArr(1).toDouble,z=0.0,unit="PIX"))
            }
            else
              GlanceZone.updateSystemZoneLabelPosition(credential,"",zoneName,position)
          }
        }
      } yield {
        if(bUpdate)
          Ok(Json.toJson(GlanceStatus.successStatus("Update zone label position successfully!")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update zone label position!")))
      }
    }
  }

  def updateZoneLabelPositionPost(zoneName: String, floorId: String) = Action.async(parse.anyContent) { implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      var xParameter=remoteQueryDouble(request,"x",0.0)
      var yParameter=remoteQueryDouble(request,"y",0.0)
      val position={
        if(xParameter.toInt==0 && yParameter.toInt==0)
        {
          val body =request.body.asJson.getOrElse(Json.obj("x" ->JsNumber(0.0),"y"-> JsNumber(0.0)))
          xParameter = (body \ "x").asOpt[Double].getOrElse(0.0)
          yParameter = (body \ "y").asOpt[Double].getOrElse(0.0)
        }
        new MapCoordinate(xParameter,yParameter,0.0,"PIX")
      }
      for {
        floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential, floorId)
        mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
        bUpdate <-{
          if(xParameter.toInt==0 && yParameter.toInt==0)
          {
            GlanceZone.updateSystemZoneLabelPosition(credential,{
              if(floor!=null)
                floor.floorId
              else
                ""
            },zoneName,new MapCoordinate())

          }else{
            if(floor!=null)
            {
              val (_,posArr) =NotificationService.getPositionArr(position,floor,null,mapSizes)
              GlanceZone.updateSystemZoneLabelPosition(credential,floor.floorId,zoneName,position.copy(x=posArr(0).toDouble,y=posArr(1).toDouble,z=0.0,unit="PIX"))
            }
            else
              GlanceZone.updateSystemZoneLabelPosition(credential,"",zoneName,position)
          }

        }
      } yield {
        if(bUpdate)
          Ok(Json.toJson(GlanceStatus.successStatus("Update zone label position successfully!")))
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update zone label position!")))
      }
    }
  }
}
