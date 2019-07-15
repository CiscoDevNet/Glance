package models.glance

import java.io._
import java.io.File
import java.nio.file.Paths
import java.text.{SimpleDateFormat}
import java.util.{Calendar}
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import models.glance.guestaccess.GlanceGuestCheckIn
import models.glance.mapzone.GlanceBuilding
import models.glance.mapzone.GlanceCampus
import models.glance.mapzone.GlanceFloor
import org.apache.commons.io.{FileUtils}
import play.Logger
import play.api.libs.json.{JsValue, Json, JsObject}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.{BSONDocument}
import reactivemongo.core.commands.{LastError}
import services.cisco.database.GlanceDBService
import services.cisco.zip.ZipUtils
import services.security.{GlanceDBAuthService, GlanceCredential}
import utils.ComUtils
import scala.collection.mutable
import scala.collection.mutable.{ListBuffer}
import scala.io.Source
import com.google.gson._
import play.modules.reactivemongo.json.BSONFormats._
import play.api.libs.iteratee._
import scala.concurrent.{Promise, Future}
import scala.reflect.ClassTag
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by Elvin on 12/1/16.
 * System backup features....
 *
 */
object GlanceSystemUtil {
  val CONST_MONGOBACKUP_PATH = "mongoBackup"
  val CONST_GLANCEAVATAR_PATH = "glanceAvatar"
  val CONST_GLANCEMAP_PATH ="glanceMap"
  val CONST_FACILITYIMAGE_PATH ="facilityImage"

  def backupAll(credential: GlanceCredential): Future[String] = {
    def writeToFile(folderName: String, fileName: String, jsonData: String): String = {
      try {
        val file = new File(folderName + "/" + fileName)
        val bw = new BufferedWriter(new FileWriter(file))
        bw.write(jsonData)
        bw.close()
        folderName + "/" + fileName
      } catch {
        case exp: Exception =>
          Logger.error("Failed to write file data:{},exception:{}",fileName, exp.getMessage)
          ""
      }
    }
    def getTempDir(): (String, String, String, String) = {
      try {
        var tmpDir = FileUtils.getTempDirectoryPath()
        val df = new SimpleDateFormat("yyyMMdd-HHmmss")
        val calendar = Calendar.getInstance()
        val foldName = df.format(calendar.getTime)
        tmpDir = "{}/{}/{}".format(tmpDir,CONST_MONGOBACKUP_PATH,foldName)
        val avatarFolder ="{}/{}".format(tmpDir,CONST_GLANCEAVATAR_PATH)
        val mapFolder = "{}/{}".format(tmpDir,CONST_GLANCEMAP_PATH)
        val facilityFolder = "{}/{}/{}".format(tmpDir,CONST_GLANCEAVATAR_PATH,CONST_FACILITYIMAGE_PATH)
        val dir = new File(tmpDir);
        if (!dir.exists()) {
          FileUtils.forceMkdir(dir)
        }
        val avatarDir = new File(avatarFolder)
        if (!avatarDir.exists())
          FileUtils.forceMkdir(avatarDir)
        val mapDir = new File(mapFolder)
        if (!mapDir.exists())
          FileUtils.forceMkdir(mapDir)

        val facilityImageDir = new File(facilityFolder)
        if (!facilityImageDir.exists())
          FileUtils.forceMkdir(facilityImageDir)
        Logger.debug("System backup folder is:" + tmpDir)
        (tmpDir, avatarFolder, mapFolder, facilityFolder)
      } catch {
        case exp: Exception =>
          Logger.error("Failed to create temp directory for backup:{}",exp.getMessage)
          ("", "", "", "")
      }
    }
    def getZipFile(tempFolder: String, fileList: List[String]): String = {
      var files = new ListBuffer[File]()
      for (fileName <- fileList) {
        files += new File(fileName)
      }
      val zipName = "{}-{}".format(tempFolder,"zip")
      //compress
      ZipUtils.compress(zipName, files.toList, tempFolder)
      //delete file folder
      FileUtils.deleteDirectory(new File(tempFolder))
      // new File(tempFolder + ".zip")
      new File(zipName)
      // empFolder + ".zip"
      zipName
    }

    val p = Promise[String]
    val f = p.future
    Future {
      val (tempFolder, avatarFolder, mapFolder, facilityFolder) = getTempDir()
      if (tempFolder == "") {
        p.success("")
      } else {
        for {
          glanceMapSizeInfo <- GlanceMapSizeInfo.collection.find(Json.obj()).cursor[GlanceMapSizeInfo].collect[List]()
          glanceGuestCheckIn <- GlanceGuestCheckIn.collection.find(Json.obj()).cursor[GlanceGuestCheckIn].collect[List]()
          glanceBuilding <- GlanceBuilding.collection.find(Json.obj()).cursor[GlanceBuilding].collect[List]()
          glanceCampus <- GlanceCampus.collection.find(Json.obj()).cursor[GlanceCampus].collect[List]()
          glanceFloor <- GlanceFloor.collection.find(Json.obj()).cursor[GlanceFloor].collect[List]()
          glanceAuthDB <- GlanceDBAuthService.collection.find(Json.obj()).cursor[GlanceCredential].collect[List]()
          glanceSystemConfigure <- GlanceSystemConf.collection.find(Json.obj()).cursor[GlanceSystemConf].collect[List]()
          registeredUsers <- RegisteredUser.collection.find(Json.obj()).cursor[RegisteredUser].collect[List]()
          glanceZone <- GlanceZone.collection.find(Json.obj()).cursor[GlanceZone].collect[List]()
          glanceInterestPoints <- GlanceInterestPoint.collection.find(Json.obj()).cursor[GlanceInterestPoint].collect[List]()
          glanceMapInfo <- GlanceMap.collection.find(Json.obj()).cursor[GlanceMap].collect[List]()
          glanceFacilityImage <- GlanceFacilityImage.collection.find(Json.obj()).cursor[GlanceFacilityImage].collect[List]()
          glanceFacilityResource <- GlanceFacilityResource.collection.find(Json.obj()).cursor[GlanceFacilityResource].collect[List]()
          glanceTrackCampus <- GlanceTrackCampus.collection.find(Json.obj()).cursor[GlanceTrackCampus].collect[List]()
          glanceTrackBuilding <- GlanceTrackBuilding.collection.find(Json.obj()).cursor[GlanceTrackBuilding].collect[List]()
          glanceTrackFloor <- GlanceTrackFloor.collection.find(Json.obj()).cursor[GlanceTrackFloor].collect[List]()
          glanceScreenToTrackFloor <- GlanceScreenToTrackFloor.collection.find(Json.obj()).cursor[GlanceScreenToTrackFloor].collect[List]()
          avatarFiles <- GlanceAvatar.exportImageFiles(credential, avatarFolder)
          mapFiles <- GlanceMap.exportAllMapFiles(credential, mapFolder)
        } yield {
          var fileList: mutable.MutableList[String] = new mutable.MutableList[String]()
          //glanceMapSizeInfo
          fileList += writeToFile(tempFolder, "glanceMapSizeInfo.json", Json.toJson(glanceMapSizeInfo).toString)
          //glanceUserActivity too huge for user's data, we are not export it...
          //fileList += writeToFile(tempFolder, "glanceUserActivity.json", Json.toJson(glanceUserActivity).toString)
          fileList += writeToFile(tempFolder, "glanceGuestCheckIn.json", Json.toJson(glanceGuestCheckIn).toString)
          fileList += writeToFile(tempFolder, "glanceBuilding.json", Json.toJson(glanceBuilding).toString)
          fileList += writeToFile(tempFolder, "glanceCampus.json", Json.toJson(glanceCampus).toString)
          fileList += writeToFile(tempFolder, "glanceFloor.json", Json.toJson(glanceFloor).toString)
          fileList += writeToFile(tempFolder, "glanceAuthDB.json", Json.toJson(glanceAuthDB).toString)
          fileList += writeToFile(tempFolder, "glanceSystemConfigure.json", Json.toJson(glanceSystemConfigure).toString)
          fileList += writeToFile(tempFolder, "registeredUsers.json", Json.toJson(registeredUsers).toString)
          fileList += writeToFile(tempFolder, "glanceZone.json", Json.toJson(glanceZone).toString)
          fileList += writeToFile(tempFolder, "glanceInterestPoints.json", Json.toJson(glanceInterestPoints).toString)
          fileList += writeToFile(tempFolder, "glanceMapInfo.json", Json.toJson(glanceMapInfo).toString)
          fileList += writeToFile(tempFolder, "glanceFacilityImages.json", Json.toJson(glanceFacilityImage).toString)
          fileList += writeToFile(tempFolder, "glanceFacilityResources.json", Json.toJson(glanceFacilityResource).toString)
          fileList += writeToFile(tempFolder, "glanceTrackCampus.json", Json.toJson(glanceTrackCampus).toString)
          fileList += writeToFile(tempFolder, "glanceTrackBuilding.json", Json.toJson(glanceTrackBuilding).toString)
          fileList += writeToFile(tempFolder, "glanceTrackFloor.json", Json.toJson(glanceTrackFloor).toString)
          fileList += writeToFile(tempFolder, "glanceScreenToTrackFloor.json", Json.toJson(glanceScreenToTrackFloor).toString)
          p.success(getZipFile(tempFolder, (fileList.toList ::: avatarFiles ::: mapFiles).filter(p => p != "")))
        }
      }
    }
    f.map { result =>
      result
    }.recover {
      case _ =>
        ""
    }
  }

  def syncCache(credential: GlanceCredential): Unit = {
    Logger.info("start to sync cache data")
    //glanceMapSizeInfo
    GlanceSyncCache.setGlanceCache[GlanceMapSizeInfo](GlanceMapSizeInfo.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_MAPINFO_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
    //glanceUserActivity
    //GlanceSyncCache.setGlanceCache[GlanceUserActivity](GlanceUserActivity.CACHE_NAME,null)
    //glanceGuestCheckIn
    GlanceSyncCache.setGlanceCache[GlanceGuestCheckIn](GlanceGuestCheckIn.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_REGISTERED_GUESTS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //GlanceBuilding
    GlanceSyncCache.setGlanceCache[GlanceBuilding](GlanceBuilding.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_BUILDING_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //GlanceCampus add
    GlanceSyncCache.setGlanceCache[GlanceCampus](GlanceCampus.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_CAMPUS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //GlanceFloor
    GlanceSyncCache.setGlanceCache[GlanceFloor](GlanceFloor.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_FLOOR_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceAuthDB
    GlanceSyncCache.setGlanceCache[GlanceCredential](GlanceDBAuthService.CACHE_NAME_GLANCE_DB_AUTH,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_AUTH_DB_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceSystemConfigure
    GlanceSyncCache.setGlanceCache[GlanceSystemConf](GlanceSystemConf.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_SYSCONF_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //registeredUsers
    GlanceSyncCache.setGlanceCache[RegisteredUser](RegisteredUser.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_REGISTERED_USERS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceZone
    GlanceSyncCache.setGlanceCache[GlanceZone](GlanceZone.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_ZONES_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceInterestPoints
    GlanceSyncCache.setGlanceCache[GlanceInterestPoint](GlanceInterestPoint.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_INTEREST_POINT_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceMapInfo
    GlanceSyncCache.setGlanceCache[GlanceMap](GlanceMap.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_GLANCE_MAP_INFO_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceFacilityImage
    GlanceSyncCache.setGlanceCache[GlanceFacilityImage](GlanceFacilityImage.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_FACILITY_IMG_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceFacilityResource
    GlanceSyncCache.setGlanceCache[GlanceFacilityResource](GlanceFacilityResource.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_IMAGERESOURCE_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceTrackCampus
    GlanceSyncCache.setGlanceCache[GlanceTrackCampus](GlanceTrackCampus.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_CAMPUSES_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceTrackBuilding
    GlanceSyncCache.setGlanceCache[GlanceTrackBuilding](GlanceTrackBuilding.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_BUILDINGS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceTrackFloor
    GlanceSyncCache.setGlanceCache[GlanceTrackFloor](GlanceTrackFloor.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_FLOORS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    //glanceScreenToTrackFloor
    GlanceSyncCache.setGlanceCache[GlanceScreenToTrackFloor](GlanceScreenToTrackFloor.CACHE_NAME,null)
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_SCREEN_TO_FLOOR_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)

    Logger.info("End to sync cache data")
  }

  def forceDirectoryRemove(path: String): Boolean = {
    try {
      FileUtils.deleteQuietly(new File(path));
      true
    }catch {
      case exp: Throwable =>
        Logger.error("Failed to clean folder {}, exception:{}",path,exp.getMessage)
        false
    }
  }

  def readAsFacilityImages(path: String): Future[List[GlanceFacilityImage]] = {
    try {
      val textSource = Source.fromFile(path)
      val source: String = textSource.getLines.mkString
      textSource.close()
      val images: List[GlanceFacilityImage] = Json.parse(source).as[List[JsValue]].map(p => p.as[GlanceFacilityImage])
      Future { images}
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to parse facilityImages,exception:{}",exp.getMessage)
        Future {List()}
    }
  }

  def writeToDB(path: String, tabelName: String, collection: JSONCollection): Future[Boolean] = {
    def forceDelete(fileName: String): Unit = {
      try {
        val file = new File(fileName)
        if (file.exists())
          FileUtils.forceDelete(file)
        Logger.info("succceeded to delete the restore file:" + fileName)
      } catch {
        case exp: Throwable =>
          ComUtils.outputErrorMsg("Failed to delete the restore file:" + fileName + " exception:" + exp.getMessage)
      }
    }

    Logger.info("try to restore table data:{}",tabelName)
    var list = new ListBuffer[BSONDocument]()
    try {
      val textSource = Source.fromFile(path)
      val source: String = textSource.getLines.mkString
      textSource.close()
      val parser: com.google.gson.JsonParser = new com.google.gson.JsonParser()
      val jsonElement: JsonElement = parser.parse(source)
      val array = jsonElement.getAsJsonArray()
      var a = 0
      for (a <- 1 to array.size()) {
        list += BSONDocumentFormat.reads(Json.parse(array.get(a - 1).getAsJsonObject.toString).as[JsObject]).get
      }
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to parse restore data of table: {} exception:{}",tabelName,exp.getMessage)
    }
    finally {
      forceDelete(path)
    }

    if (list.length > 0) {
      val enumerator = Enumerator.enumerate(list)
      collection.bulkInsert(enumerator).map { nInsert =>
        (nInsert > 0)
      }.recover {
        case _ =>
          Logger.error("Failed to restore table: {}",tabelName)
          false
      }
    } else {
      Future { true }
    }
  }

  def cleanMapSizeInfo(): Future[Boolean] = {
    GlanceMapSizeInfo.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceMapSizeInfo")
        true
      case _ =>
        Logger.error("Failed to delete: glanceMapSizeInfo")
        false
    }.recover {
      case _ =>
        Logger.error("Exception:Failed to delete: glanceMapSizeInfo")
        false
    }
  }

  def cleanUserActivity(): Future[Boolean] = {
    GlanceUserActivity.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceUserActivity")
        true
      case _ =>
        Logger.error("Failed to delete: glanceUserActivity")
        false
    }.recover {
      case _ =>
        Logger.error("Exception:Fail to delete: glanceUserActivity")
        false
    }
  }

  def cleanGuestCheckIn(): Future[Boolean] = {
    GlanceGuestCheckIn.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceGuestCheckIn")
        true
      case _ =>
        Logger.error("Failed to delete: glanceGuestCheckIn")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceGuestCheckIn")
        false
    }
  }

  def cleanBuilding(): Future[Boolean] = {
    GlanceBuilding.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: GlanceBuilding")
        true
      case _ =>
        Logger.error("Failed to delete: GlanceBuilding")
        false
    }.recover {
      case _ =>
        Logger.error("Exception,failed to delete: GlanceBuilding")
        false
    }
  }

  def cleanCampus(): Future[Boolean] = {
    GlanceCampus.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: GlanceCampus")
        true
      case _ =>
        Logger.error("Failed to delete: GlanceCampus")
        false
    }.recover {
      case _ =>
        Logger.error("Exception,failed to delete: GlanceCampus")
        false
    }
  }

  def cleanFloor(): Future[Boolean] = {
    GlanceFloor.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: GlanceFloor")
        true
      case _ =>
        Logger.error("Failed to delete: GlanceFloor")
        false
    }.recover {
      case _ =>
        Logger.error("Exception,failed to delete: GlanceFloor")
        false
    }
  }

  def cleanAuthDB(): Future[Boolean] = {
    GlanceDBAuthService.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceAuthDB")
        true
      case _ =>
        Logger.error("Failed to delete: glanceAuthDB")
        false
    }.recover {
      case _ =>
        Logger.error("Excpetion, failed to delete: glanceAuthDB")
        false
    }
  }

  def cleanSystemConfig(): Future[Boolean] = {
    GlanceSystemConf.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.info("Success to delete: glanceSystemConfigure")
        true
      case _ =>
        ComUtils.outputErrorMsg("Fail to delete: glanceSystemConfigure")
        false
    }.recover {
      case _ =>
        ComUtils.outputErrorMsg("Exception:Fail to delete: glanceSystemConfigure")
        false
    }
  }

  def cleanRegisteredUser(): Future[Boolean] = {
    RegisteredUser.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: registeredUsers")
        true
      case _ =>
        Logger.error("Failed to delete: registeredUsers")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: registeredUsers")
        false
    }
  }

  def cleanGlanceZone(): Future[Boolean] = {
    GlanceZone.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceZone")
        true
      case _ =>
        Logger.error("Failed to delete: glanceZone")
        false
    }.recover {
      case _ =>
        Logger.error("Exception: failed to delete: glanceZone")
        false
    }
  }

  def cleanInterestPoint(): Future[Boolean] = {
    GlanceInterestPoint.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceInterestPoints")
        true
      case _ =>
        Logger.error("Failed to delete: glanceInterestPoints")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceInterestPoints")
        false
    }
  }

  def cleanGlanceMapInfo(): Future[Boolean] = {
    GlanceMap.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceMapInfo")
        true
      case _ =>
        Logger.error("Failed to delete: glanceMapInfo")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceMapInfo")
        false
    }
  }

  def cleanFacilityImage(): Future[Boolean] = {
    GlanceFacilityImage.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceFacilityImage")
        true
      case _ =>
        Logger.error("Failed to delete: glanceFacilityImage")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceFacilityImage")
        false
    }
  }

  def cleanFacilityResource(): Future[Boolean] = {
    GlanceFacilityResource.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceFacilityResource")
        true
      case _ =>
        Logger.error("Failed to delete: glanceFacilityResource")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceFacilityResource")
        false
    }
  }

  def cleanTrackCampus(): Future[Boolean] = {
    GlanceTrackCampus.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceTrackCampus")
        true
      case _ =>
        Logger.error("Failed to delete: glanceTrackCampus")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceTrackCampus")
        false
    }
  }

  def cleanTrackBuilding(): Future[Boolean] = {
    GlanceTrackBuilding.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceTrackBuilding")
        true
      case _ =>
        Logger.error("Failed to delete: glanceTrackBuilding")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceTrackBuilding")
        false
    }
  }

  def cleanTrackFloor(): Future[Boolean] = {
    GlanceTrackFloor.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceTrackFloorFlag")
        true
      case _ =>
        Logger.error("Failed to delete: glanceTrackFloorFlag")
        false
    }.recover {
      case _ =>
        Logger.debug("Exception, failed to delete: glanceTrackFloorFlag")
        false
    }
  }

  def cleanTrackScreenInfo(): Future[Boolean] = {
    GlanceScreenToTrackFloor.collection.remove(Json.obj()).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: glanceScreenToTrackFloor")
        true
      case _ =>
        Logger.error("Failed to delete: glanceScreenToTrackFloor")
        false
    }.recover {
      case _ =>
        Logger.error("Exception, failed to delete: glanceScreenToTrackFloor")
        false
    }
  }

  def cleanAvatarFiles(): Future[Boolean] = {
    val avatarFiles = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceAvatars.files")
    val chunkFiles = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceAvatars.chunks")
    def cleanFiles(): Future[Boolean] = {
      avatarFiles.remove(Json.obj()).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete: Avatar files")
          true
        case _ =>
          Logger.error("Failed to delete: Avatar files")
          false
      }.recover {
        case _ =>
          Logger.error("Exception, failed to delete: Avatar files")
          false
      }
    }
    def cleanChunks(): Future[Boolean] = {
      chunkFiles.remove(Json.obj()).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete: Avatar chunkFiles")
          true
        case _ =>
          Logger.error("Failed to delete: Avatar chunkFiles")
          false
      }.recover {
        case _ =>
          Logger.error("Exception, failed to delete: Avatar chunkFiles")
          false
      }
    }
    for {
      bFiles <- cleanFiles()
      bChunks <- cleanChunks()
    } yield {
      bFiles && bChunks
    }
  }

  def cleanMapFiles(): Future[Boolean] = {
    val mapFiles = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceMaps.files")
    val chunkFiles = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceMaps.chunks")
    def cleanFiles(): Future[Boolean] = {
      mapFiles.remove(Json.obj()).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.info("Success to delete: Map files")
          true
        case _ =>
          ComUtils.outputErrorMsg("Fail to delete: Map files")
          false
      }.recover {
        case _ =>
          ComUtils.outputErrorMsg("Exception:Fail to delete: Map files")
          false
      }
    }
    def cleanChunks(): Future[Boolean] = {
      chunkFiles.remove(Json.obj()).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Succeeded to delete: Map chunkFiles")
          true
        case _ =>
          Logger.error("Failed to delete: Map chunkFiles")
          false
      }.recover {
        case _ =>
          Logger.error("Exception, failed to delete: Map chunkFiles")
          false
      }
    }
    for {
      bFiles <- cleanFiles()
      bChunks <- cleanChunks()
    } yield {
      bFiles && bChunks
    }
  }


  def restoreAll(credential: GlanceCredential, file: File): Future[Boolean] = {
    val in = new FileInputStream(file)
    val df = new SimpleDateFormat("yyyMMdd-HHmmss")
    val calendar = Calendar.getInstance()
    val foldName = df.format(calendar.getTime)
    val direPath = "/tmp/{}/".format(foldName)
    val mapPath = "{}{}/".format(direPath,CONST_GLANCEMAP_PATH)
    val avatarPath ="{}{}/".format(direPath,CONST_GLANCEAVATAR_PATH)
    val imagesPath = "{}{}/{}/".format(direPath,CONST_GLANCEAVATAR_PATH,CONST_FACILITYIMAGE_PATH)

    val direPathDirectory = new File(direPath);
    if (!direPathDirectory.exists()) {
      FileUtils.forceMkdir(direPathDirectory)
    }
    ZipUtils.decompress(in, Paths.get(direPath))
    FileUtils.forceDelete(file)

    val allfiles = direPathDirectory.listFiles()
    val jsonFiles = allfiles.filter(_.getName.endsWith(".json"))
    if (jsonFiles.length > 0) {
      for {
        //glanceMapSizeInfo
        glanceMapSizeInfoFlag <- cleanMapSizeInfo()
        bRestoreMapSizeInfo <- {
          if (glanceMapSizeInfoFlag)
            writeToDB(direPath + "glanceMapSizeInfo.json", "glanceMapSizeInfo", GlanceMapSizeInfo.collection)
          else
            Future {false}
        }
        //glanceUserActivity
        /* too huge data size...
        glanceUserActivityFlag <- cleanUserActivity()
        bRestorUserActivity<-{
          if (glanceUserActivityFlag)
            writeToDB(direPath + "glanceUserActivity.json", "glanceUserActivity", GlanceUserActivity.collection)
          else
            Future{false}
        }*/
        //glanceGuestCheckIn
        glanceGuestCheckInFlag <- cleanGuestCheckIn()
        bRestoreGuestCheckIn <- {
          if (glanceGuestCheckInFlag)
            writeToDB(direPath + "glanceGuestCheckIn.json", "glanceGuestCheckIn", GlanceGuestCheckIn.collection)
          else
            Future {false}
        }
        //GlanceBuilding
        glanceBuildingFlag <- cleanBuilding()
        bRestoreBuilding <- {
          if (glanceBuildingFlag)
            writeToDB(direPath + "glanceBuilding.json", "GlanceBuilding", GlanceBuilding.collection)
          else
            Future {false}
        }
        //GlanceCampus
        glanceCampusFlag <- cleanCampus()
        bRestoreCampus <- {
          if (glanceCampusFlag)
            writeToDB(direPath + "glanceCampus.json", "GlanceBuilding", GlanceCampus.collection)
          else
            Future { false }
        }
        //GlanceFloor
        glanceFloorFlag <- cleanFloor()
        bRestoreFloor <- {
          //GlanceFloor
          if (glanceFloorFlag)
            writeToDB(direPath + "glanceFloor.json", "GlanceFloor", GlanceFloor.collection)
          else
            Future {false}
        }
        //glanceAuthDB
        glanceAuthDBFlag <- cleanAuthDB()
        bRestoreAuthDB <- {
          if (glanceAuthDBFlag)
            writeToDB(direPath + "glanceAuthDB.json", "glanceAuthDB", GlanceDBAuthService.collection)
          else
            Future {false}
        }
        //glanceSystemConfigure
        glanceSystemConfigureFlag <- cleanSystemConfig()
        bRestoreSysConf <- {
          if (glanceSystemConfigureFlag)
            writeToDB(direPath + "glanceSystemConfigure.json", "glanceSystemConfigure", GlanceSystemConf.collection)
          else
            Future {false}
        }
        //registeredUsers
        registeredUsersFlag <- cleanRegisteredUser()
        bRestoreRegisteredUser <- {
          if (registeredUsersFlag)
            writeToDB(direPath + "registeredUsers.json", "registeredUsers", RegisteredUser.collection)
          else
            Future {false}
        }
        //glanceZone
        glanceZoneFlag <- cleanGlanceZone()
        bRestoreZone <- {
          if (glanceZoneFlag)
            writeToDB(direPath + "glanceZone.json", "glanceZone", GlanceZone.collection)
          else
            Future {false}
        }
        //glanceInterestPoints
        glanceInterestPointsFlag <- cleanInterestPoint()
        bRestoreInterestPoint <- {
          if (glanceInterestPointsFlag)
            writeToDB(direPath + "glanceInterestPoints.json", "glanceInterestPoints", GlanceInterestPoint.collection)
          else
            Future {false}
        }
        //glanceMapInfo
        glanceMapInfoFlag <- cleanGlanceMapInfo()
        bRestoreMapInfo <- {
          if (glanceMapInfoFlag)
            writeToDB(direPath + "glanceMapInfo.json", "glanceMapInfo", GlanceMap.collection)
          else
            Future {false}
        }
        //glanceFacilityImage
        glanceFacilityImageFlag <- cleanFacilityImage()
        facilityImages <- readAsFacilityImages(direPath + "glanceFacilityImages.json")
        bRestoreFacilityImage <- {
          if (glanceFacilityImageFlag)
            writeToDB(direPath + "glanceFacilityImages.json", "glanceFacilityImage", GlanceFacilityImage.collection)
          else Future {false}
        }
        //glanceFacilityResource
        glanceFacilityResourceFlag <- cleanFacilityResource()
        bRestoreFacilityResource <- {
          if (glanceFacilityResourceFlag)
            writeToDB(direPath + "glanceFacilityResources.json", "glanceFacilityResource", GlanceFacilityResource.collection)
          else Future {false}
        }
        //glanceTrackCampus
        glanceTrackCampusFlag <- cleanTrackCampus()
        bRestoreTrackCampus <- {
          if (glanceTrackCampusFlag)
            writeToDB(direPath + "glanceTrackCampus.json", "glanceTrackCampus", GlanceTrackCampus.collection)
          else
            Future { false}
        }
        //glanceTrackBuilding
        glanceTrackBuildingFlag <- cleanTrackBuilding()
        bRestoreTrackBuilding <- {
          if (glanceTrackBuildingFlag)
            writeToDB(direPath + "glanceTrackBuilding.json", "glanceTrackBuilding", GlanceTrackBuilding.collection)
          else Future {false}
        }
        //glanceTrackFloor
        glanceTrackFloorFlag <- cleanTrackFloor()
        bRestoreTrackFloor <- {
          //glanceTrackFloor
          if (glanceTrackFloorFlag)
            writeToDB(direPath + "glanceTrackFloor.json", "glanceTrackFloor", GlanceTrackFloor.collection)
          else
            Future {false}
        }
        //glanceScreenToTrackFloor
        glanceScreenToTrackFloorFlag <- cleanTrackScreenInfo()
        bRestoreScreenInfo <- {
          if (glanceScreenToTrackFloorFlag)
            writeToDB(direPath + "glanceScreenToTrackFloor.json", "glanceScreenToTrackFloor", GlanceScreenToTrackFloor.collection)
          else
            Future {false}
        }
        bMapCleanFlag <- cleanMapFiles()
        bMapRestore <- {
          if (bMapCleanFlag)
            GlanceMap.restoreMaps(credential, mapPath)
          else
            Future {false}
        }
        bAvatarCleanFlag <- cleanAvatarFiles()
        bFacilityImage <- {
          if (bAvatarCleanFlag)
            GlanceAvatar.restoreAllFacilityImages(credential, facilityImages, imagesPath)
          else
            Future {false}
        }
        bAvatarRestore <- {
          if (bAvatarCleanFlag)
            GlanceAvatar.restoreAllFiles(credential, avatarPath)
          else
            Future {false}
        }
      } yield {
        forceDirectoryRemove(direPath)
        syncCache(credential)
        true
      }
    } else {
      Logger.error("No unzipped file found!")
      Future {false}
    }
  }

}
