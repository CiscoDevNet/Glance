package models.glance

import java.io.{ByteArrayOutputStream, File, FileInputStream, FileOutputStream}
import java.net.URI
import java.text.SimpleDateFormat
import java.util.Calendar
import _root_.utils.ComUtils
import com.sksamuel.scrimage.Image
import controllers.amqp.GlanceSyncCache
import controllers.glance.console.Map._
import models.common.GlanceStatus
import org.apache.commons.io.{FileUtils, FilenameUtils}
import play.Logger
import play.api.Play.current
import play.api.libs.Files.TemporaryFile
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import play.api.mvc.MultipartFormData.FilePart
import play.api.mvc.Result
import play.modules.reactivemongo.ReactiveMongoPlugin
import play.modules.reactivemongo.json.collection.JSONCollection
import services.cisco.database.GlanceDBService
import services.cisco.svg.SVGMetaPost
import services.common.ConfigurationService
import services.security.GlanceCredential
import scala.collection.mutable
import scala.concurrent.{Promise, Future}
import scala.util.{Failure, Success}
import reactivemongo.bson._
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import reactivemongo.core.commands.{Count, LastError}
import play.modules.reactivemongo.json.BSONFormats._
import play.api.libs.json._
import play.api.libs.functional.syntax._
import reactivemongo.bson._
import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 12/18/15.
 */

case class GlanceMap(_id: BSONObjectID = BSONObjectID.generate,
                     glanceOrgId: String = "",
                     glanceUserId: String = "",
                     mapName: String,
                     mapId: String = "",
                     mapMaskId: String = "",
                     mapMaskHalfId: String = "",
                     mapMaskQuarterId: String = "",
                     tags: List[String] = List(),
                     updated: Long = System.currentTimeMillis())

object GlanceMap {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceMapInfo")
  val gridFS = new GridFS(GlanceDBService.GlanceDB(), "glanceMaps")

  val CACHE_NAME = "glanceMapInfo"
  implicit val tolerantReaders = new Reads[GlanceMap] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceMap(
          (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(ComUtils.getTenantUserId()),
          (js \ ComUtils.CONST_PROPERTY_MAPNAME).as[String],
          (js \ "mapId").asOpt[String].getOrElse(""),
          (js \ "mapMaskId").asOpt[String].getOrElse(""),
          (js \ "mapMaskHalfId").asOpt[String].getOrElse(""),
          (js \ "mapMaskQuarterId").asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val glanceWrites = new Writes[GlanceMap] {
    def writes(z: GlanceMap): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "mapId" -> z.mapId,
        "mapMaskId" -> z.mapMaskId,
        "mapMaskHalfId" -> z.mapMaskHalfId,
        "mapMaskQuarterId" -> z.mapMaskQuarterId,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }

  implicit val glanceMapFormat = Format(tolerantReaders, glanceWrites)

  def insert(glanceMap: GlanceMap): Future[Boolean] = {
    GlanceMap.collection.insert(glanceMap).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert:  glanceOrgId:" + glanceMap.glanceOrgId + " glanceUserId:" + glanceMap.glanceUserId + " mapName:" + glanceMap.mapName)
        true
      case _ =>
        Logger.error("Failed to insert: map name:" + glanceMap.mapName)
        false
    }
  }

  def addOrUpdate(glanceMap: GlanceMap): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> glanceMap.glanceOrgId, ComUtils.CONST_PROPERTY_MAPNAME -> glanceMap.mapName)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(GlanceMap.collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addOrUpdate(existCount, glanceMap)
    } yield bRet
  }

  def addOrUpdate(existCount: Int, glanceMap: GlanceMap): Future[Boolean] = {
    if (existCount > 0) {
      update(glanceMap)
    } else {
      insert(glanceMap)
    }
  }

  def update(glanceMap: GlanceMap): Future[Boolean] = {
    def copySetValues(z: GlanceMap): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_MAPNAME -> z.mapName,
        "mapId" -> z.mapId,
        "mapMaskId" -> z.mapMaskId,
        "mapMaskHalfId" -> z.mapMaskHalfId,
        "mapMaskQuarterId" -> z.mapMaskQuarterId,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    GlanceMap.collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> glanceMap.glanceOrgId, ComUtils.CONST_PROPERTY_MAPNAME -> glanceMap.mapName),
      Json.obj("$set" -> copySetValues(glanceMap))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId:{},mapName:{}",glanceMap.glanceOrgId, glanceMap.mapName)
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId:{},mapName:{}",glanceMap.glanceOrgId, glanceMap.mapName)
        false
    }
  }

  def readGlanceMap(credential: GlanceCredential, mapName: String): Future[Option[GlanceMap]] = {
    val findByName = (org: String, mName: String) => GlanceMap.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org, ComUtils.CONST_PROPERTY_MAPNAME -> mName)).one[GlanceMap];
    findByName(credential.glanceOrgId, mapName)
  }

  def readAllGlanceMaps(credential: GlanceCredential): Future[List[GlanceMap]] = {
    val findByName = (org: String) => GlanceMap.collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj(ComUtils.CONST_PROPERTY_MAPNAME -> 1)).cursor[GlanceMap].collect[List]();
    findByName(credential.glanceOrgId)
  }

  def cleanCache(credential: GlanceCredential): Unit = {
    GlanceSyncCache.setGlanceCache[List[GlanceMap]](CACHE_NAME,null)
  }

  def updateGlanceMapInfoCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      readAllGlanceMaps(credential).map{listMaps =>
        if (listMaps == null || listMaps.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceMap]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceMap]](CACHE_NAME,listMaps)
        true
      }
    }
    if (bCheckExists) {
      val optMaps = GlanceSyncCache.getGlanceCache[List[GlanceMap]](CACHE_NAME)
      if(optMaps.isDefined){
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

  def exportMaskToImage(mapName:String, credential: GlanceCredential):Future[Image]={

    def getImage(destPath:String):Image={
      try{
        val inStream = new FileInputStream(destPath)
        val image =Image.fromStream(inStream)
        inStream.close()
        forceDelete(destPath)
        image
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to get image from file:"+destPath+" exception:"+exp.getMessage)
          null
      }
    }
    def exportToImage(id: String,fileName:String): Future[Image] = {
      val p = Promise[Image]
      val f = p.future
      Future {
        gridFS.find(BSONDocument("_id" -> BSONObjectID(id))).headOption.map { maybeFile =>
          maybeFile.map { file =>
            var tmpDir = FileUtils.getTempDirectoryPath()
            tmpDir =tmpDir +"/mask"
            val dir = new File(tmpDir);
            if (!dir.exists())
              FileUtils.forceMkdir(dir)
            val destPath =tmpDir+"/"+fileName
            val outStream = new FileOutputStream(destPath)
            gridFS.readToOutputStream(file, outStream).map { _ =>
              outStream.close
              p.success(getImage(destPath))
            }.recover {
              case _ =>
                p.success(null)
            }
          } getOrElse {
            p.success(null)
          }
        }.recover {
          case _ =>
            p.success(null)
        }
      }
      f.map { maskImage =>
        maskImage
      }.recover {
        case _ =>
          null
      }
    }

    for{
      mapInfo <-readGlanceMap(credential,mapName)
      maskImage <- {
        if(!mapInfo.isDefined)
          Future{null}
        else
          exportToImage(mapInfo.get.mapMaskQuarterId,mapName+"-mask-quarter.png")
      }
    }yield{
      maskImage
    }
  }

  def exportAllMapFiles(credential: GlanceCredential, destPath: String): Future[List[String]] = {
    def exportToFile(id: String, fileName: String): Future[String] = {
      val p = Promise[String]
      val f = p.future
      Future {
        gridFS.find(BSONDocument("_id" -> BSONObjectID(id))).headOption.map { maybeFile =>
          maybeFile.map { file =>
            val destFile = destPath + "/" + fileName
            val outStream = new FileOutputStream(destFile)
            gridFS.readToOutputStream(file, outStream).map { _ =>
              outStream.close
              p.success(destFile)
            }.recover {
              case _ =>
                p.success("")
            }
          } getOrElse {
            p.success("")
          }
        }.recover {
          case _ =>
            p.success("")
        }
      }
      f.map { name =>
        name
      }.recover {
        case _ =>
          ""
      }
    }

    def exportMaps(infos: List[GlanceMap], dest: String): Future[List[String]] = {
      val tmpInfos = infos.filter(p => p.mapId != "" && p.mapMaskId != "" && p.mapMaskHalfId != "" && p.mapMaskQuarterId != "")
      val completed = new java.util.concurrent.atomic.AtomicLong()
      val fileNames: mutable.MutableList[String] = new mutable.MutableList[String]()
      val p = Promise[List[String]]
      val f = p.future
      Future {
        tmpInfos.foreach { info =>
          for {
            svg <- exportToFile(info.mapId, info.mapName + ".svg")
            mask <- exportToFile(info.mapMaskId, info.mapName + "-mask.png")
            maskHalf <- exportToFile(info.mapMaskHalfId, info.mapName + "-mask-half.png")
            maskQuarter <- exportToFile(info.mapMaskQuarterId, info.mapName + "-mask-quarter.png")
          } yield {
            if (svg != "" && mask != "" && maskHalf != "" && maskQuarter != "") {
              fileNames += svg
              fileNames += mask
              fileNames += maskHalf
              fileNames += maskQuarter
            }
            val count = completed.incrementAndGet()
            if (count >= tmpInfos.length)
              p.success(fileNames.toList)
          }
        }
        if (tmpInfos.length <= 0)
          p.success(fileNames.toList)
      }

      f.map { files =>
        files
      }.recover {
        case _ =>
          Logger.error("Failed to export map images files!")
          List()
      }
    }

    for {
      mapInfos <- readAllGlanceMaps(credential)
      mapFiles <- exportMaps(mapInfos, destPath)
    } yield {
      mapFiles
    }
  }

  def restoreMaps(credential: GlanceCredential,mapFolder:String):Future[Boolean]={
    def recursiveListFiles(f: File,bExtendAll:Boolean=true): Array[File] = {
      if(f.exists() && f.isDirectory()){
        if(bExtendAll==true){
          val these = f.listFiles.filter(p => p.getName.compareToIgnoreCase(".DS_Store")!=0 && p.getName().compareToIgnoreCase("__MACOSX")!=0).filter(p => p.isDirectory || (p.isFile && p.length() > 512))
          these ++ these.filter(p => {
            p.isDirectory && p.getName().compareToIgnoreCase("__MACOSX")!=0
          }).flatMap(recursiveListFiles(_,bExtendAll))
        }else{
          val these = f.listFiles.filter(p => p.getName.compareToIgnoreCase(".DS_Store")!=0 && p.getName().compareToIgnoreCase("__MACOSX")!=0).filter(p => (p.isFile && p.length() > 512))
          these
        }
      }else{
        Array[File]()
      }

    }
    val fileList =recursiveListFiles(new File(mapFolder),false).map(p => p.getAbsolutePath).toList
    restoreMapsEx(fileList,credential)
  }

  def forceDelete(fileName:String):Unit={
    try{
      val file =new File(fileName)
      if(file.exists())
        FileUtils.forceDelete(file)
      Logger.debug("succeeded to delete the restore file:{}",fileName)
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete the restore file:{} exception:{}",fileName,exp.getMessage)
    }
  }

  def restoreMapsEx(fileNames: List[String], credential: GlanceCredential): Future[Boolean] = {
    val svgFileNames = fileNames.filter(p => {
      val ext = FilenameUtils.getExtension(p)
      val name = FilenameUtils.getBaseName(p)
      if ((ext != null && ext.compareToIgnoreCase("svg") == 0) && (name != null && name.length > 0))
        true
      else
        false
    })


    def saveFile(sourceFileName: String, fileName: String): Future[(String, List[Double])] = {
      Logger.debug("Temp FileName:{}",fileName)
      var contentType = "image/svg+xml" //"application/octect-stream"
      if (!fileName.endsWith(".svg"))
        contentType = "image/png"
      val fileToSave = DefaultFileToSave(fileName, Some(contentType))
      var viewBox: (Double, Double, Double, Double) = (0, 0, 0, 0)
      try {
        if (fileName.endsWith(".svg")) {
          val uri:URI = (new File(sourceFileName)).toURI();
          val converter:SVGMetaPost = new SVGMetaPost( uri.toString());
          viewBox = (converter.getViewBox.getBaseVal().getX().toDouble, converter.getViewBox.getBaseVal().getY().toDouble, converter.getViewBox.getBaseVal.getWidth.toDouble, converter.getViewBox.getBaseVal.getHeight.toDouble)
        }
      } catch {
        case exp: Exception =>
          Logger.error("Failed to get svg file viewbox info, exception:{}",exp.getMessage)
      }
      val inStream = new FileInputStream(sourceFileName)
      gridFS.writeFromInputStream(fileToSave, inStream).map { fileOut =>
        inStream.close()
        (fileOut.id.asInstanceOf[BSONObjectID].stringify, List(viewBox._1, viewBox._2, viewBox._3, viewBox._4))
      }.recover {
        case _ =>
          inStream.close()
          Logger.error("Failed to write GridFS file info,exception.")
          ("", List(0.0, 0.0, 0.0, 0.0))
      }
    }

    def updateMapInfo(credential: GlanceCredential, mapNameIn: String, mapIdIn: String, maskIdIn: String, maskHalfIdIn: String, maskQuarterIdIn: String): Future[Boolean] = {
      if (mapIdIn == "" || maskIdIn == "" || maskHalfIdIn == "" || maskQuarterIdIn == "") {
        Future {
          false
        }
      } else {
        val mapInfo = new GlanceMap(_id = BSONObjectID.generate, glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, mapName = mapNameIn, mapId = mapIdIn,
          mapMaskId = maskIdIn, mapMaskHalfId = maskHalfIdIn, mapMaskQuarterId = maskQuarterIdIn)
        Logger.debug("update info:" + Json.toJson(mapInfo))
        GlanceMap.addOrUpdate(mapInfo).map { bRet =>
          bRet
        }.recover {
          case _ =>
            Logger.error("Failed to restore/update the map info for map:{}",mapNameIn)
            false
        }
      }
    }

    def saveMapInfo(mapName: String, fileNames: List[String]): Future[Boolean] = {
      val mapFile = fileNames.filter(p => p.endsWith(".svg"))(0)
      val maskFile = fileNames.filter(p => p.endsWith("-mask.png"))(0)
      val maskHalfFile = fileNames.filter(p => p.endsWith("-mask-half.png"))(0)
      val maskQuarterFile = fileNames.filter(p => p.endsWith("-mask-quarter.png"))(0)

      for {
        (mapId, viewBox) <- saveFile(mapFile, mapName + ".svg")
        (maskId, _) <- saveFile(maskFile, mapName + "-mask.png")
        (maskHalfId, _) <- saveFile(maskHalfFile, mapName + "-mask-half.png")
        (maskQuarterId, _) <- saveFile(maskQuarterFile, mapName + "-mask-quarter.png")
        bUpdateMapInfo <- updateMapInfo(credential, mapName, mapId, maskId, maskHalfId, maskQuarterId)
        bUpdated <- {
          if (bUpdateMapInfo) {
            val glanceMapInfo = new GlanceMapSizeInfo(credential.glanceOrgId, credential.glanceUserId, mapName, ComUtils.getDigitPrecision(viewBox(0), 4), ComUtils.getDigitPrecision(viewBox(1), 4), ComUtils.getDigitPrecision(viewBox(2), 4), ComUtils.getDigitPrecision(viewBox(3), 4), Json.obj())
            GlanceMapSizeInfo.addOrUpdate(glanceMapInfo)
          } else {
            Future {
              false
            }
          }
        }
        bUpdateBuildingSizeInfo <- GlanceTrackCampus.updateBuildingSizeForMapName(credential, mapName)
      } yield {
        forceDelete(mapFile)
        forceDelete(maskFile)
        forceDelete(maskHalfFile)
        forceDelete(maskQuarterFile)
        bUpdateMapInfo
      }
    }

    val mapNames = svgFileNames.map(p => FilenameUtils.getBaseName(p))
    val completed = new java.util.concurrent.atomic.AtomicLong()
    val bResults: mutable.MutableList[(String, Boolean)] = new mutable.MutableList[(String, Boolean)]()
    val p = Promise[List[(String, Boolean)]]
    val f = p.future
    Future {
      mapNames.foreach { mapName =>
        val mapFiles = fileNames.filter(p => {
          val fileName = FilenameUtils.getName(p)
          (fileName.compareToIgnoreCase(mapName + ".svg") == 0 ||
            fileName.compareToIgnoreCase(mapName + "-mask.png") == 0 ||
            fileName.compareToIgnoreCase(mapName + "-mask-half.png") == 0 ||
            fileName.compareToIgnoreCase(mapName + "-mask-quarter.png") == 0
          )
        }).distinct

        if (mapFiles.length != 4) {
          bResults += (mapName -> false)
          val count = completed.incrementAndGet()
          if (count >= mapNames.length)
            p.success(bResults.toList)
        } else {
          //fixme...
          saveMapInfo(mapName, mapFiles).map { bRet =>
            bResults += (mapName -> bRet)
            val count = completed.incrementAndGet()
            if (count >= mapNames.length)
              p.success(bResults.toList)
          }.recover {
            case _ =>
              bResults += (mapName -> false)
              val count = completed.incrementAndGet()
              if (count >= mapNames.length)
                p.success(bResults.toList)
          }
        }
      }
      if (mapNames.length <= 0)
        p.success(bResults.toList)
    }

    f.map { bResults =>
      (bResults.filter(p => p._2).length > 0)
    }.recover {
      case _ =>
        Logger.error("Failed to restore all map info!")
        false
    }
  }

}