package models.glance

import java.io.{File, FileInputStream, FileOutputStream}
import java.nio.file.Paths
import com.sksamuel.scrimage.Image
import com.sksamuel.scrimage.nio.{PngWriter, JpegWriter}
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import controllers.glance.GlanceWebSocketActor
import models.glance.guestaccess.GlanceGuestCheckIn
import org.apache.commons.io.{FileUtils, FilenameUtils}
import play.Logger
import play.api.libs.iteratee.Enumerator
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.{Promise, Future}
import scala.reflect.io.Path
import play.api.libs.json._
import reactivemongo.api.gridfs._
import reactivemongo.api.gridfs.Implicits._
import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader
import scala.concurrent.ExecutionContext.Implicits.global


/**
 * Created by kennych on 12/11/15.
 */

object GlanceAvatar{
  private val gridFS = new GridFS(GlanceDBService.GlanceDB(), "glanceAvatars")

  def exportImageFiles(credential:GlanceCredential,destPath:String):Future[List[String]]={

    def exportUserAvatars(users:List[RegisteredUser]):Future[List[String]]=
    {
      val tmpUsers =users.filter(p =>p.avatar!=null && p.avatar!="").map(p => (p.id,p.avatar))
      exportAvatars(tmpUsers,destPath)
    }

    def exportGuestCheckInAvatars(users:List[GlanceGuestCheckIn]):Future[List[String]]=
    {
      val tmpUsers =users.filter(p =>p.avatar!=null && p.avatar!="").map(p => (p.guestId,p.avatar))
      exportAvatars(tmpUsers,destPath)
    }

    def exportImageResource(images:List[GlanceFacilityImage]):Future[List[String]]={
      val tmpImages =images.filter(p => p.imageFileId!=null && p.imageFileId!="").map(p=> (p.imageCategory+"_"+p.imageName+"_"+p.imageFileName,p.imageFileId))
      exportAvatars(tmpImages,destPath+"/facilityImage")
    }

    def exportAvatars(users:List[(String,String)],destPathName:String):Future[List[String]]={
      def getImageFilePath_inline(fileName:String,destPath:String):String={
        val extName = FilenameUtils.getExtension(fileName)
        if(extName.length<=0)
          destPath+"/"+fileName+".jpg"
        else
          destPath+"/"+fileName
      }
      def saveToFile_inline(file : reactivemongo.api.gridfs.ReadFile[_ <: reactivemongo.bson.BSONValue], outStream : java.io.OutputStream):Future[Boolean]={
        gridFS.readToOutputStream(file, outStream).map{ uRet =>
          true
        }.recover{
          case _=>
            false
        }
      }
      def findAndSaveUserFile_inline(fileId:String,
                                     fileName:String,
                                     p:Promise[List[String]],
                                     succeededFileNames:mutable.MutableList[String],
                                     completed:java.util.concurrent.atomic.AtomicLong):Unit ={
        gridFS.find(BSONDocument("_id" -> BSONObjectID(fileId))).headOption.map{ maybeFile =>
          if(maybeFile.isDefined) {
            val file = maybeFile.get
            val filePath = getImageFilePath_inline(fileName,destPathName)
            val outStream =new FileOutputStream(filePath)
            saveToFile_inline(file,outStream).map{ bRet =>
              outStream.close
              if(bRet) succeededFileNames+= filePath
            }
          } else{
            val count =completed.incrementAndGet()
            if(count>=users.length)
              p.success(succeededFileNames.toList)
          }
        }.recover {
          case _=>
            Logger.error(s"Failed to export user avatar:$fileName,imageId:$fileId")
            val count =completed.incrementAndGet()
            if(count>=users.length)
              p.success(succeededFileNames.toList)
        }
      }

      val completed= new java.util.concurrent.atomic.AtomicLong()
      val succeededFileNames:mutable.MutableList[String]=new mutable.MutableList[String]()
      val p = Promise[List[String]]
      val f = p.future
      Future{
        if(users.length<=0)
          p.success(List())
        else {
          for(user <- users)
            findAndSaveUserFile_inline(user._2,user._1,p,succeededFileNames,completed)
        }
      }
      f.map{ files =>
          files
      }.recover{
        case _=>
          List()
      }
    }

    RegisteredUser.cleanCache(credential)
    GlanceGuestCheckIn.cleanCache(credential)
    GlanceFacilityImage.cleanCache(credential)
    for{
      users <- RegisteredUser.readAllConf(credential)
      guests <- GlanceGuestCheckIn.readAllGuest(credential)
      images <- GlanceFacilityImage.readAll(credential)
      userAvatars <- exportUserAvatars(users)
      guestAvatars <- exportGuestCheckInAvatars(guests)
      facilityImages <- exportImageResource(images)
    }yield{
      guestAvatars ::: userAvatars ::: facilityImages
    }
  }

  def restoreAllFacilityImages(credential: GlanceCredential,facilityImages:List[GlanceFacilityImage],imageFolder:String):Future[Boolean]={
    def uploadFacilityImageFromFile(credential:GlanceCredential,
                                    tmpFileName:String,
                                    facilityImage: GlanceFacilityImage):Future[(Boolean,Boolean)]={
      import scala.concurrent.ExecutionContext.Implicits.global
      val extName =FilenameUtils.getExtension(tmpFileName)
      val contentType:String ={
        if(extName.compareToIgnoreCase("PNG")==0)
          "image/png"
        else
          "image/jpg"
      }
      val fileName = facilityImage.imageFileName
      val fileToSave = DefaultFileToSave(fileName, Some(contentType))
      var resizeImage: Image = null
      val imageFile =new File(tmpFileName)
      try{
        val InStream =new FileInputStream(imageFile)
        val imageNew = Image.fromStream(InStream)
        InStream.close()
        resizeImage = imageNew
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to load image file, please check the file is valid image file:{},exception:{}",tmpFileName,exp.getMessage)
          resizeImage=null
      }
      if(resizeImage!=null){
        val enumerator = Enumerator(resizeImage.bytes(PngWriter()))
        for {
          file <- gridFS.save(enumerator, fileToSave)
          bRet <- {
            val glanceImage=GlanceFacilityImage(
              BSONObjectID.generate,
              credential.glanceOrgId,
              credential.glanceUserId,
              facilityImage.imageCategory,
              facilityImage.imageName,
              facilityImage.imageDisplayName,
              facilityImage.imageFileName,
              file.id.asInstanceOf[BSONObjectID].stringify
            )
            GlanceFacilityImage.addOrUpdate(glanceImage)
          }
        } yield {
          resizeImage=null
          safeTmpFileDelete(imageFile)
          (bRet,true)
        }
      }else{
        Future{(false,false)}
      }
    }
    def restoreFacilityImageFromFile_inline(facilityImage:GlanceFacilityImage,
                                            allFiles:List[(String,String)],
                                            p:Promise[List[Boolean]],
                                            resultList:mutable.MutableList[Boolean],
                                            completed:java.util.concurrent.atomic.AtomicLong):Unit={
      var fileName =facilityImage.imageCategory+"_"+facilityImage.imageName+"_"+facilityImage.imageFileName
      if(FilenameUtils.getExtension(fileName)=="")
        fileName =fileName+ ".png"
      val matchFile =allFiles.filter(p => p._2.compareToIgnoreCase(fileName)==0)
      if(matchFile.length>0){
        uploadFacilityImageFromFile(credential,matchFile(0)._1,facilityImage).map{ bRet =>
          val count =completed.incrementAndGet()
          resultList += bRet._1
          if(count>=facilityImages.length)
            p.success(resultList.toList)
        }.recover{
          case _=>
            val count =completed.incrementAndGet()
            resultList+= false
            if(count>=facilityImages.length)
              p.success(resultList.toList)
        }
      }else{
        Logger.warn("No match facility image:"+fileName)
        val count =completed.incrementAndGet()
        resultList+=false
        if(count>=facilityImages.length)
          p.success(resultList.toList)
      }
    }

    val allFiles =recursiveListFiles(new File(imageFolder),false).map(p=> (p.getAbsolutePath -> p.getName)).toList
    val resultList:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    val p = Promise[List[Boolean]]
    val f = p.future
    val completed=new java.util.concurrent.atomic.AtomicLong()
    Future{
      if(facilityImages.length<=0)
        p.success(resultList.toList)
      else{
        for( facilityImage <- facilityImages){
          restoreFacilityImageFromFile_inline(facilityImage,allFiles,p,resultList,completed)
        }
      }
    }
    f.map{ results =>
      safeTmpFileDelete(new File(imageFolder))
      (results.length<=0 || (results.filter(p => p).length>0))
    }.recover{
      case _=>
        safeTmpFileDelete(new File(imageFolder))
        false
    }
  }

  private def safeTmpFileDelete(tmpFile:File): Unit ={
    try {
      if(tmpFile!=null && tmpFile.exists())
        FileUtils.deleteQuietly(tmpFile)
    }catch {
      case ex:Throwable =>
        Logger.error("Failed to delete tmp file:"+ex.getMessage)
    }
  }

  private def recursiveListFiles(f: File, bExtendAll:Boolean=true): Array[File] = {
    if(f.exists() && f.isDirectory()){
      if(bExtendAll){
        val these = f.listFiles.filter(p => p.getName.compareToIgnoreCase(".DS_Store")!=0 && p.getName().compareToIgnoreCase("__MACOSX")!=0).filter(p => p.isDirectory || (p.isFile && p.length() > 512))
        these ++ these.filter(p => {
        p.isDirectory && p.getName().compareToIgnoreCase("__MACOSX")!=0
        }).flatMap(recursiveListFiles(_,bExtendAll))
      }else {
        val these = f.listFiles.filter(p => p.getName.compareToIgnoreCase(".DS_Store")!=0 && p.getName().compareToIgnoreCase("__MACOSX")!=0).filter(p => (p.isFile && p.length() > 512))
        these
      }
    }else{
      Array[File]()
    }
  }

  private def getResizedImage(imageFile:File,tmpFile:File):Image={
    var resizeImage:Image = null
    try{
      val tmpImage: javaxt.io.Image = new javaxt.io.Image(imageFile)
      tmpImage.rotate();
      tmpImage.saveAs(tmpFile)
      val imageNew = Image.fromFile(tmpFile)
      val rates = imageNew.height / 300.0
      if (rates > 1.0)
        resizeImage = imageNew.fit((imageNew.width / rates).toInt, (imageNew.height / rates).toInt)
      else
        resizeImage = imageNew
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to load image file, please check the file is valid image file, exception:{}",exp.getMessage)
        resizeImage=null
    }
    resizeImage
  }

  def restoreAllFiles(credential: GlanceCredential,avatarFolder:String):Future[Boolean]={
    import java.io.File
	  def sendAvatarUpdate(expert_id:String): Unit ={
      var avatar = Json.obj()
      val expertList= List(expert_id)
      avatar +=("avatar" -> ComUtils.getJsonArrayStr(expertList))
      Logger.debug(s"sendAvatarUpdate avatar:$expert_id")
      GlanceWebSocketActor.broadcastMessage("update",avatar)
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_AVATARCHANGE, avatar.toString(), ComUtils.getCredential())
    }

    def uploadImageFromFile(credential:GlanceCredential,tmpFileName:String):Future[(Boolean,Boolean)]={
      val expert_id:String =FilenameUtils.getBaseName(tmpFileName)
      val fileName = expert_id + ".jpg"
      val fileToSave = DefaultFileToSave(fileName, Some("image/jpg"))
      val imageFile =new File(tmpFileName)
      val tmpFile: File = File.createTempFile(fileName, ".jpg")
      val resizedImage =getResizedImage(imageFile,tmpFile)
      if(resizedImage!=null){
        val enumerator = Enumerator(resizedImage.bytes(JpegWriter()))
        for {
          file <- gridFS.save(enumerator, fileToSave)
          findUser <- RegisteredUser.readUserByUserId(credential,expert_id)
          bRet <- {
            if(findUser.isDefined)
              RegisteredUser.updateProfileImageId(credential, expert_id, file.id.asInstanceOf[BSONObjectID].stringify)
            else
              Future{false}
          }
        } yield {
          safeTmpFileDelete(tmpFile)
          safeTmpFileDelete(imageFile)
          if(bRet)
            sendAvatarUpdate(expert_id)
          (bRet,true)
        }
      }else{
        Future{(false,false)}
      }
    }

    val p = Promise[(List[(String,Boolean)],List[Boolean])]
    val f = p.future
    val dirPath = avatarFolder
    val results:mutable.MutableList[(String,Boolean)]=new mutable.MutableList[(String,Boolean)]()
    val invalids:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    val completed=new java.util.concurrent.atomic.AtomicLong()
    val AllFolderFiles = recursiveListFiles(new File(dirPath),false)
    val AllMapSVG=AllFolderFiles.filter(f => {
      val ext = FilenameUtils.getExtension(f.getName)
      (ext != null && (ext.compareToIgnoreCase("SVG") == 0))
    }).map(f => FilenameUtils.getBaseName(f.getName))

    var AllFiles =AllFolderFiles.filter(f => {
        val ext =FilenameUtils.getExtension(f.getName)
        (ext!=null && (ext.compareToIgnoreCase("PNG")==0|| ext.compareToIgnoreCase("JPG")==0 || ext.compareToIgnoreCase("JPEG")==0))
      }).map(p => p.getAbsolutePath)

    //filter SVG(or map's png mask files)
    for (svgFileName <-AllMapSVG){
      AllFiles=AllFiles.filter(p => {
        val tmpName = FilenameUtils.getName(svgFileName)
        ((tmpName.compareToIgnoreCase(svgFileName+".svg")!=0 &&
          tmpName.compareToIgnoreCase(svgFileName+"-mask.png")!=0 &&
          tmpName.compareToIgnoreCase(svgFileName+"-mask-half.png")!=0 &&
          tmpName.compareToIgnoreCase(svgFileName+"-mask-quarter.png")!=0))
      })
    }
    Future{
      for (fileName <- AllFiles){
        uploadImageFromFile(credential,fileName).map{ bResults =>
          Logger.info(s"Update Avatar via file:$fileName")
          val nCount =completed.incrementAndGet()
          results += (fileName -> bResults._1)
          if(bResults._2==false)
            invalids+=bResults._2
          if(nCount>=AllFiles.length)
            p.success((results.toList,invalids.toList))
        }.recover{
          case _=>
            Logger.error(s"Failed to update Avatar via file:$fileName")
            val nCount=completed.incrementAndGet()
            results += (fileName -> false)
            if(nCount>=AllFiles.length){
              p.success((results.toList,invalids.toList))
            }
        }
      }
      if(AllFiles.length==0)
        p.success((results.toList,invalids.toList))
    }

    f.map{ results =>
        (results._1.filter(p => p._2).length>0)
    }.recover{
      case _=>
        Logger.error("Failed to restore all avatar files, exception!")
        false
    }
  }

}