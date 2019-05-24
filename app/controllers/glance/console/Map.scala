package controllers.glance.console

import java.io.{FileInputStream, File}
import java.net.URI
//import com.sksamuel.scrimage.Image
//import com.sksamuel.scrimage.nio.{PngWriter, ImageWriter, JpegWriter}
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
//import utils.ComUtils.MAX_CONTENT
import models.cmx.Campus
import models.common.GlanceStatus
import models.glance._
import org.apache.commons.io.FilenameUtils
import play.Logger
import play.api.libs.Files.TemporaryFile
import play.api.libs.iteratee.Enumerator
;
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc.MultipartFormData.FilePart
import play.api.mvc.{AnyContent, Result, Action, Controller}
import play.modules.reactivemongo.{MongoController, ReactiveMongoPlugin}
import reactivemongo.api.gridfs._
import reactivemongo.api.gridfs.Implicits._
import reactivemongo.bson.{BSONString, BSONDocument, BSONObjectID}
import services.cisco.database.GlanceDBService
import services.cisco.indoor.CMXService
import services.cisco.svg.SVGMetaPost
import services.security.GlanceCredential
import utils.ComUtils
import scala.concurrent.Future
//import play.api.libs.functional.syntax._
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 11/5/15.
 */

object Map extends Controller with MongoController with Guard{
  val gridFS = new GridFS(GlanceDBService.GlanceDB(), "glanceMaps")
  val GLANCE_CAMPUSE_CACHE = "Glance.Campuses.Cache"

  private def extractDataPartValueStr(url: Option[Seq[String]]): String = {
    url match {
      case Some(seqString: Seq[String]) =>
        seqString.head
      case _ =>
        ""
    }
  }
  private def isValidFileExt(file:Option[FilePart[TemporaryFile]],fileExe:String): Boolean ={
    file match{
      case Some(image) =>
        val pat = """(.*)[.]([^.]*)""".r

        image.filename match {
          case pat(fn,fileExe) =>
            true
          case _ =>
            false
        }
      case _ =>
        false
    }
  }

  private def saveFile(file:Option[FilePart[TemporaryFile]],fileName:String): Future[(String,List[Double])] =
  {
    file match{
      case Some(image) =>
        Logger.debug("Temp FileName:{}",fileName)
        val contentType = image.contentType.getOrElse("application/octect-stream")
        val fileToSave = DefaultFileToSave(fileName, Some(contentType))
        var viewBox:(Double,Double,Double,Double) =(0,0,0,0)
        try{
          if(fileName.endsWith(".svg")){
            val uri:URI = image.ref.file.toURI();
            val converter:SVGMetaPost = new SVGMetaPost( uri.toString());
            viewBox =(converter.getViewBox.getBaseVal().getX().toDouble,converter.getViewBox.getBaseVal().getY().toDouble,converter.getViewBox.getBaseVal.getWidth.toDouble,converter.getViewBox.getBaseVal.getHeight.toDouble)
          }
        }catch{
          case ex:Throwable =>
            Logger.error("Failed to get svg file's viewbox info,exception:{}",ex.getMessage)
        }
        gridFS.writeFromInputStream(fileToSave, new FileInputStream(image.ref.file)).map { fileOut =>
          (fileOut.id.asInstanceOf[BSONObjectID].stringify,List(viewBox._1,viewBox._2,viewBox._3,viewBox._4))
        }.recover{
          case _ =>
            Logger.error("Failed to write GridFS file info")
            ("",List(0.0,0.0,0.0,0.0))
        }

      case _ =>
        Future{("",List(0.0,0.0,0.0,0.0))}
    }
  }

  private def updateMapInfo(credential:GlanceCredential,
                            mapNameIn:String,
                            mapIdIn:String,
                            maskIdIn:String,
                            maskHalfIdIn:String,
                            maskQuarterIdIn:String,
                            redirectUrl:String):Future[Result] ={

    if(mapIdIn =="" || maskIdIn =="" || maskHalfIdIn =="" || maskQuarterIdIn =="")
    {
      Future{NotAcceptable(Json.toJson(GlanceStatus.failureStatus("Failed to update map info")))}
    }else{
      val mapInfo =new GlanceMap( _id=BSONObjectID.generate,
                                  glanceOrgId=credential.glanceOrgId,
                                  glanceUserId=credential.glanceUserId,
                                  mapName=mapNameIn,
                                  mapId=mapIdIn,
                                  mapMaskId = maskIdIn,
                                  mapMaskHalfId = maskHalfIdIn,
                                  mapMaskQuarterId=maskQuarterIdIn)
      Logger.debug("update info:{}",Json.toJson(mapInfo))
      GlanceMap.addOrUpdate(mapInfo).map{ bRet =>
        if(bRet){
          Redirect(redirectUrl, 301)
        }else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to update map info")))
      }
    }
  }

  private def saveMapInfo(credential:GlanceCredential,
                          mapName:String,
                          redirectUrl:String,
                          mapFile:Option[FilePart[TemporaryFile]],
                          maskFile:Option[FilePart[TemporaryFile]],
                          maskHalfFile:Option[FilePart[TemporaryFile]],
                          maskQuarterFile:Option[FilePart[TemporaryFile]]):Future[Result] =
  {
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      (mapId,viewBox) <- saveFile(mapFile,mapName+".svg")
      (maskId,_) <- saveFile(maskFile,mapName+"_mask.png")
      (maskHalfId,_) <- saveFile(maskHalfFile,mapName+"_mask_half.png")
      (maskQuarterId,_) <- saveFile(maskQuarterFile,mapName+"_mask_quarter.png")
      retRes  <- updateMapInfo(credential,mapName,mapId,maskId,maskHalfId,maskQuarterId,redirectUrl)
      bUpdated  <- {
        if(retRes.header.status==301 || retRes.header.status==200)
        {
          val glanceMapInfo =new GlanceMapSizeInfo(credential.glanceOrgId,credential.glanceUserId,mapName,ComUtils.getDigitPrecision(viewBox(0),4),ComUtils.getDigitPrecision(viewBox(1),4),ComUtils.getDigitPrecision(viewBox(2),4),ComUtils.getDigitPrecision(viewBox(3),4),Json.obj())
          GlanceMapSizeInfo.addOrUpdate(glanceMapInfo)
        }else{
          Future{false}
        }
      }
      bUpdateBuidlingSizeInfo <- GlanceTrackCampus.updateBuildingSizeForMapName(credential,mapName)
    } yield {
      retRes
    }
  }

  def register() = Action.async(parse.multipartFormData) { implicit request =>
    val credential =remoteCredential
    val redirectUrl = extractDataPartValueStr(request.body.dataParts.get("url"))
    val mapName = extractDataPartValueStr(request.body.dataParts.get("name"))

    if (redirectUrl.trim() == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No redirect Url")))
      }
    }else if (mapName.trim() == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No map name")))
      }
    }else{
      val bMapFile:Boolean = isValidFileExt(request.body.file("map"),"svg")
      val bMaskFile:Boolean = isValidFileExt(request.body.file("mask"),"png")
      val bMaskHalfFile:Boolean = isValidFileExt(request.body.file("maskhalf"),"png")
      val bMaskQuarterFile:Boolean = isValidFileExt(request.body.file("maskquarter"),"png")
      if(!bMapFile || !bMaskFile || !bMaskHalfFile || !bMaskQuarterFile) {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("No Photo")))}
      }
      else{
        for{
          retRes <- saveMapInfo(credential,
                                mapName,
                                redirectUrl,
                                request.body.file("map"),
                                request.body.file("mask"),
                                request.body.file("maskhalf"),
                                request.body.file("maskquarter"))
        } yield {
          retRes
        }
      }
    }
  }

  private def getMapItem(mapInfo:GlanceMap,maskItem:String):String ={
    maskItem match {
      case "map" =>
        mapInfo.mapId
      case "mask" =>
        mapInfo.mapMaskId
      case "mask-half" =>
        mapInfo.mapMaskHalfId
      case "mask-quarter" =>
        mapInfo.mapMaskQuarterId
      case _ =>
        ""
    }
  }

  private def getSavedImage(fileName:String,savedMapInfo:Option[GlanceMap],maskItem:String):Future[Result] = {
    savedMapInfo match {
      case Some(mapInfo: GlanceMap) =>
        Logger.debug("Mapinfo:{}",Json.toJson(mapInfo))
        val itemId: String = getMapItem(mapInfo, maskItem)
        Logger.info("Mapinfo Item ID:{}", itemId)
        if (itemId == "") {
          Future {
            NotFound(Json.toJson(GlanceStatus.failureStatus("Map Info not found!")))
          }
        } else {
          val file = gridFS.find(BSONDocument("_id" -> BSONObjectID(itemId)))
          serve(gridFS, file, CONTENT_DISPOSITION_INLINE)
        }
      case _ =>
        Logger.info("Mapinfo: not found,trying to load local resources!")
        val contentStream = this.getClass.getResourceAsStream("/public/map/" + fileName)
        Future {
          if (contentStream == null)
            NotFound(Json.toJson(GlanceStatus.failureStatus("Map Info not found!")))
          else {
            Logger.info("Mapinfo: load local resource for " + fileName)
            if (maskItem == "map")
              Ok.chunked(Enumerator.fromStream(contentStream)).as("image/svg+xml")
            else
              Ok.chunked(Enumerator.fromStream(contentStream)).as("image/png")
          }
        }
    }
  }

  def getFile(filename:String) = Action.async { implicit request =>
    val PatternSvg = "(.*)(.svg)".r
    val PatternMask = "(.*)(-mask.png)".r
    val PatternMaskHalf = "(.*)(-mask-half.png)".r
    val PatternMaskQuarter = "(.*)(-mask-quarter.png)".r
    val PatternPNG = "(.*)(.png)".r
    val PatternSVG = "(.*)(.svg)".r
    Logger.info("getFile filename:{}",filename)
    val credential =remoteCredential
    filename match {
      case PatternSvg(mapName,ext) =>
        for{
          mapInfo <-    GlanceMap.readGlanceMap(credential,mapName)
          resultVal <-  getSavedImage(filename,mapInfo,"map")
        } yield resultVal
      case PatternMask(mapName,ext) =>
        for{
          mapInfo <-   GlanceMap.readGlanceMap(credential,mapName)
          resultVal <-  getSavedImage(filename,mapInfo,"mask")
        } yield resultVal
      case PatternMaskHalf(mapName,ext) =>
        for{
          mapInfo <-   GlanceMap.readGlanceMap(credential,mapName)
          resultVal <-  getSavedImage(filename,mapInfo,"mask-half")
        } yield resultVal
      case PatternMaskQuarter(mapName,ext) =>
        for{
          mapInfo <-   GlanceMap.readGlanceMap(credential,mapName)
          resultVal <-  getSavedImage(filename,mapInfo,"mask-quarter")
        } yield resultVal
      case PatternPNG(mapName,ext) =>
        val contentStream = this.getClass.getResourceAsStream("/public/map/"+filename)
        Future{
          if(contentStream!=null){
            Ok.chunked(Enumerator.fromStream(contentStream)).as("image/png")
          }else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Map info not found!")))
        }
    }
  }

  def readMapSize(mapName:String)=Action.async { implicit request =>
    val credential=remoteCredential
    for{
      mapInfo <- GlanceMapSizeInfo.readMapSizeInfoByName(credential,mapName)
    }yield {
      Ok(Json.obj(ComUtils.CONST_PROPERTY_MAPNAME -> mapName,"x"->mapInfo.x,"y"->mapInfo.y,"height"-> ComUtils.getDigitPrecision(mapInfo.height,1),"width"->ComUtils.getDigitPrecision(mapInfo.width,1)))
    }
  }
}
