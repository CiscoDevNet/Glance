package controllers.glance

import java.io.{FileInputStream, InputStream, File, ByteArrayOutputStream}
import java.nio.file.Paths
import com.sksamuel.scrimage.Image
import com.sksamuel.scrimage.nio.{PngWriter, JpegWriter}
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import controllers.glance.GlanceUser._
import models.cmx.MapCoordinate
import models.common.GlanceStatus
import models.glance._
import models.glance.guestaccess.GlanceGuestCheckIn
import org.apache.commons.io.{FilenameUtils, FileUtils}
import play.api.libs.Files.TemporaryFile
import play.api.libs.iteratee.Enumerator
import play.Logger
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc.MultipartFormData.FilePart
import play.api.mvc.{Result, Action, Controller}
import play.api.Play.current
import play.api.libs.functional.syntax._
import play.modules.reactivemongo.MongoController
import reactivemongo.bson._
import reactivemongo.bson.DefaultBSONHandlers._
import services.cisco.database.GlanceDBService
import services.cisco.notification.NotificationService
import services.cisco.zip.ZipUtils
import _root_.utils.{ComUtils, JsonResult}
import services.security.GlanceCredential
import scala.collection.mutable
import scala.concurrent.{Promise, Future, Await}
import scala.concurrent.duration.Duration
import scala.reflect.io.Path
import scala.util.{Try, Success}
import models.cmx.Implicits._
import java.io.File


/**
 * Created by kennych on 11/5/15.
 */

object Avatar extends Controller with MongoController with Guard {
  import scala.concurrent.ExecutionContext.Implicits.global
  import scala.concurrent.ExecutionContext.Implicits.global._
  import reactivemongo.api.gridfs._
  import reactivemongo.api.gridfs.Implicits._
  import play.modules.reactivemongo.ReactiveMongoPlugin
  import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
  import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader

  val gridFS = new GridFS(GlanceDBService.GlanceDB(), "glanceAvatars")
  def safeTmpFileDelete(tmpFile:File): Unit ={
    try {
      if(tmpFile!=null)
        tmpFile.delete()
    }catch {
      case ex:Throwable =>
        Logger.error("Failed to delete tmp file:{},exception:{}",tmpFile.getName(),ex.getMessage)
    }
  }

  private def getResult(bRet: Boolean, toURL: String): Result = {
    if (bRet == false)
      return NotFound(Json.toJson(GlanceStatus.failureStatus("Update failed")))
    else if (toURL == "")
      return PartialContent(Json.toJson(GlanceStatus.failureStatus("Invalid redirect URL")))
    else
      return Redirect(toURL, 301)
  }

  private def getUploadTempFile(file:Option[FilePart[TemporaryFile]]): (File,String) ={
    file match{
      case Some(image) =>
        (image.ref.file,image.filename)
      case _ =>
        (null,"")
    }
  }
  private def getResizedImage(imageFile:File,fileName:String,fileExt:String=".jpg"):(Image,File)={
    var resizeImage: Image = null
    val tmpFile: File = File.createTempFile(fileName, fileExt)
    try {
      val tmpImage: javaxt.io.Image = new javaxt.io.Image(imageFile)
      tmpImage.rotate();
      tmpImage.saveAs(tmpFile)
      val imageNew = Image.fromFile(tmpFile)
      val rates = imageNew.height / 300.0
      if (rates > 1.0)
        resizeImage = imageNew.fit((imageNew.width / rates).toInt, (imageNew.height / rates).toInt)
      else
        resizeImage = imageNew
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to load the uploaded file as image:{}",exp.getMessage)
    }
    return (resizeImage,tmpFile)
  }


  def upload(expert_id_ext: String) = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val expert_id =ComUtils.getUserIdWithNoDeviceExtension(expert_id_ext)
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    val (imageFile:File,_) = getUploadTempFile(request.body.file("image"))
    if (redirectUrl.trim() == "") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))}
    }else if (imageFile ==null){
      Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("No Photo")))}
    }else {
      val fileName = expert_id + ".jpg"
      val fileToSave = DefaultFileToSave(fileName, Some("image/jpg"))
      val (resizeImage,tmpFile) = getResizedImage(imageFile,fileName)
      if (resizeImage == null) {
        Future{
          safeTmpFileDelete(tmpFile)
          getResult(false, redirectUrl)
        }
      } else {
        val enumerator = Enumerator(resizeImage.bytes(JpegWriter()))
        for {
          file <- gridFS.save(enumerator, fileToSave)
          findUser <- RegisteredUser.readUserByUserId(credential, expert_id)
          bRet <- {
            if (findUser.getOrElse(null) != null)//check if is register expert or guest user
              RegisteredUser.updateProfileImageId(credential, expert_id, file.id.asInstanceOf[BSONObjectID].stringify)
            else
              GlanceGuestCheckIn.updateProfileImageId(credential, expert_id, file.id.asInstanceOf[BSONObjectID].stringify)
          }
        } yield {
          safeTmpFileDelete(tmpFile)
          getResult(bRet, redirectUrl)
        }
      }
    }
  }

  def sendAvatarUpdate(expert_id:String): Unit ={
    var avatar =Json.obj()
    for {
      optExpert <- RegisteredUser.readUserByUserId(ComUtils.getCredential(),expert_id)
    }yield{
      if(optExpert.isDefined){
        val tmpList:mutable.MutableList[String]=new mutable.MutableList[String]()
        for(macAddressItem <- optExpert.get.macAddress)
          tmpList += ComUtils.getUserIdByDeviceId(optExpert.get.id,macAddressItem,optExpert.get.macAddress)
        tmpList += expert_id
        avatar += ("avatar" -> ComUtils.getJsonArrayStr(tmpList.toList))
        GlanceWebSocketActor.broadcastMessage("update",avatar)
        GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_AVATARCHANGE, avatar.toString(), ComUtils.getCredential())
      }else{
        val expertList = List(expert_id)
        avatar += ("avatar" -> ComUtils.getJsonArrayStr(expertList))
        GlanceWebSocketActor.broadcastMessage("update",avatar)
        GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_AVATARCHANGE, avatar.toString(), ComUtils.getCredential())
      }
    }
  }

  def uploadSmall(expert_id_ext: String) = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val expert_id =ComUtils.getUserIdWithNoDeviceExtension(expert_id_ext)
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    val (imageFile:File,_) = getUploadTempFile(request.body.file("image"))
    if (redirectUrl.trim() == "") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))}
    }else if (imageFile ==null){
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No image file")))}
    }else{
      val fileName = expert_id + ".jpg"
      val fileToSave = DefaultFileToSave(fileName, Some("image/jpg"))
      val (resizeImage,tmpFile) = getResizedImage(imageFile,fileName)
      if(resizeImage==null){
        Future{
          safeTmpFileDelete(tmpFile)
          getResult(false, redirectUrl)
        }
      }else{
        val enumerator = Enumerator(resizeImage.bytes(JpegWriter()))
        for {
          file <- gridFS.save(enumerator, fileToSave)
          findUser <- RegisteredUser.readUserByUserId(credential,expert_id)
          bRet <- {
            if(findUser.getOrElse(null)!=null)
              RegisteredUser.updateProfileImageId(credential, expert_id, file.id.asInstanceOf[BSONObjectID].stringify)
            else
              GlanceGuestCheckIn.updateProfileImageId(credential, expert_id, file.id.asInstanceOf[BSONObjectID].stringify)
          }
        } yield {
          safeTmpFileDelete(tmpFile)
          if(bRet)
            sendAvatarUpdate(expert_id_ext)
          getResult(bRet, redirectUrl)
        }
      }
    }
  }

  def getAvatar(fileName: String) = Action.async { implicit request =>
    var expert_id: String = fileName
    if (fileName.lastIndexOf('.') >= 0)
    {
      expert_id = fileName.substring(0, fileName.lastIndexOf('.'))
      expert_id = ComUtils.getUserIdWithNoDeviceExtension(expert_id)
    }
    Future {
      Redirect("/image/avatar/small/" + expert_id, 302)
    }
  }

  private def getDefaultAvatar(category:String=ComUtils.SMART_DEVICE_TYPE_PERSON): Result = {
    val contentDefault = {
      if(category==ComUtils.SMART_DEVICE_TYPE_THING)
        this.getClass.getResourceAsStream("/public/avatar/thing.png")
      else if (category==ComUtils.SMART_DEVICE_TYPE_ASSET)
        this.getClass.getResourceAsStream("/public/avatar/asset.png")
      else
        this.getClass.getResourceAsStream("/public/avatar/default.png")
    }
    if (contentDefault != null)
        return Ok.chunked(Enumerator.fromStream(contentDefault)).as("image/png")
    else
       return Redirect("/avatar/default.png",302)
  }

  private def getExpertAvatar(expertId: String = ""): Result = {
    if (expertId == null || expertId.trim().compareTo("") == 0)
      return getDefaultAvatar()
    var bJpg: Boolean = true
    var contentStream = this.getClass.getResourceAsStream(s"/public/avatar/$expertId.jpg")
    if (contentStream == null) {
      contentStream = this.getClass.getResourceAsStream(s"/public/avatar/$expertId.png")
      bJpg = false
    }
    if (contentStream == null)
      return getDefaultAvatar()

    return Ok.chunked(Enumerator.fromStream(contentStream)).as({
        if (bJpg)
          "image/jpeg"
        else
          "image/png"
    })
  }

  private def getSaveImageFileId(findUser: Option[RegisteredUser],findGuest:Option[GlanceGuestCheckIn]):(String,String)={
    findUser match {
      case Some(user: RegisteredUser) =>
        return (user.avatar,user.category)
      case None=>
      {
        findGuest match{
          case Some(guest) =>
            return (guest.avatar,ComUtils.SMART_DEVICE_TYPE_GUEST)
          case None =>
            return ("","")
        }
      }
    }
  }
  private def getSavedImage(findUser: Option[RegisteredUser],findGuest:Option[GlanceGuestCheckIn],expert_id:String): Future[Result] = {
    val (imageFileId, category) =getSaveImageFileId(findUser,findGuest)
    if (imageFileId!="")
    {
      val file = gridFS.find(BSONDocument("_id" -> BSONObjectID(imageFileId)))
      serve(gridFS, file, CONTENT_DISPOSITION_INLINE)
    }else if(category!=""){
      Future{getDefaultAvatar(category)}
    }else{
      Future{getExpertAvatar(expert_id)}
    }
  }

  def getSmall(expert_id_ext: String) = Action.async { implicit request =>
    val credential = remoteCredential
    val expert_id =ComUtils.getUserIdWithNoDeviceExtension(expert_id_ext)

    for {
      findUser  <- RegisteredUser.readUserByUserId(credential, expert_id)
      findGuest <- GlanceGuestCheckIn.getGuestCheckInByGuestId(credential,expert_id)
      resultVal <- getSavedImage(findUser,findGuest,expert_id)
    } yield resultVal

  }

  def getNormal(expert_id: String) = Action.async { implicit request =>
    val credential = remoteCredential
    Future {
      Redirect("/image/avatar/small/" + ComUtils.getUserIdWithNoDeviceExtension(expert_id), 302)
    } //redirect to small avatar image...
  }

  private def getImageFileExt(fileName:String):String= {
    val pos = fileName.lastIndexOf(".");
    var name=""
    if (pos > 0) {
      name= fileName.substring(pos).trim;
    }
    if(name=="")
      name =".jpg"
    if(name !=".png")
      name =".jpg" //if none png format, all default to jpg
    name
  }

  //API for upload download customized profile picture based on name ...
  def addFacilityImage()= Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url")).trim()
    var imageCategory = remoteExtractDataString(request.body.dataParts.get("imageCategory")).trim()
    if (imageCategory.trim=="") {
      imageCategory= ComUtils.FACILITY_DEFAULT_TYPE
    }
    val imageName = remoteExtractDataString(request.body.dataParts.get("imageName")).trim()
    var displayName = remoteExtractDataString(request.body.dataParts.get("displayName")).trim()
    if (displayName.trim=="") {
      displayName= imageCategory+" "+ imageName
    }
    Logger.info("Upload Category image, redirect URL:{}",redirectUrl)
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }
    else if (redirectUrl=="") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))
      }
    }else if (imageName.trim=="") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("No Image Name")))
      }
    }else{
      val (imageFile,imageFileName) = getUploadTempFile(request.body.file("image"))
      if(imageFile ==null) {
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("No image file is selected!")))
        }
      }else {
        val fileName = imageName
        val fileExt = getImageFileExt(imageFileName).toLowerCase
        val fileToSave = DefaultFileToSave(imageName+fileExt, {
          if(fileExt==".png")
            Some("image/png")
          else
            Some("image/jpg")
        })
        val (resizeImage,tmpFile)= getResizedImage(imageFile,fileExt)
        val enumerator = Enumerator(resizeImage.bytes({
          if(fileExt==".png")
            PngWriter()
          else
            JpegWriter()}
        ))

        for {
          file <- {
            gridFS.save(enumerator, fileToSave)
          }
          bRet <- {
            val glanceImage=GlanceFacilityImage(
              BSONObjectID.generate,
              credential.glanceOrgId,
              credential.glanceUserId,
              imageCategory,
              imageName,
              displayName,
              fileName+fileExt,
              file.id.asInstanceOf[BSONObjectID].stringify
            )
            Logger.info("fileid:{}",file.id.asInstanceOf[BSONObjectID].stringify)
            GlanceFacilityImage.addOrUpdate(glanceImage)
          }
        } yield {
          Logger.info(s"update facility image status:$bRet")
          safeTmpFileDelete(tmpFile)
          getResult(bRet, redirectUrl+"?timestamp="+System.currentTimeMillis())
        }
      }
    }
  }

  private def parseFacilityCoordinate(fcJson:String):List[MapCoordinate]={
    try{
      val jsValues =Json.parse(fcJson).asOpt[List[JsValue]].getOrElse(List())
      jsValues.map(p => p.as[MapCoordinate])
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to parse facility coordination:{}",exp.getMessage)
        List()
    }
  }
  //API for upload download customized profile picture based on name ...
  def addFacilityResource()= Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    var imageCategory= remoteExtractDataString(request.body.dataParts.get("imageCategory"))
    if (imageCategory.trim=="") {
      imageCategory= ComUtils.FACILITY_DEFAULT_TYPE
    }

    val imageName = remoteExtractDataString(request.body.dataParts.get("imageName"))
    val facilityName = remoteExtractDataString(request.body.dataParts.get("name"))
    var facilityDisplayName = remoteExtractDataString(request.body.dataParts.get("displayName"))
    if (facilityDisplayName=="") {
      facilityDisplayName= ""
    }

    var floorNameId = remoteExtractDataString(request.body.dataParts.get("floor"))
    if (floorNameId=="") {
      floorNameId= ""
    }

    var facilityCoordinateStr = remoteExtractDataString(request.body.dataParts.get("facilityCoordinate"))
    if (facilityCoordinateStr=="") {
      facilityCoordinateStr= "[]"
    }


    val facilityCoordinate =parseFacilityCoordinate(facilityCoordinateStr)
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else if (redirectUrl=="") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No Redirect Url")))}
    }else if (imageName.trim =="") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No image name Url")))}
    }else if (facilityName.trim=="") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No facility name!")))}
    }else{
      for {
        floor <- GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,floorNameId)
        mapSizes <- GlanceMapSizeInfo.readAllConf(credential)
        bRet <- {
          val glanceImageResource=GlanceFacilityResource(
          BSONObjectID.generate,
          credential.glanceOrgId,
          credential.glanceUserId,
          {
            if(floor!=null)
              floor.floorId
            else
              ""
          },
          facilityName,
          facilityDisplayName,
          imageCategory,
          imageName,
          {
            if(floor==null)
              facilityCoordinate
            else{
              facilityCoordinate.map( p => {
                val (_,posArr)=NotificationService.getPositionArr(p,floor,null,mapSizes)
                p.copy(x =posArr(0).toDouble,y =posArr(1).toDouble)
              })
            }
          })
          GlanceFacilityResource.addOrUpdate(glanceImageResource)
        }
      } yield {
        Logger.info(s"update facility status:$bRet")
        getResult(bRet, redirectUrl+"?timestamp="+System.currentTimeMillis())
      }
    }
  }

  def downloadFacilityImage(imageCategory: String,imageName:String)= Action.async { implicit request =>
    val credential =remoteCredential
    Logger.debug("downloadFacilityImage:{},imageName:{}",imageCategory,imageName)
    for{
      resourceInfo <- GlanceFacilityImage.readFacilityImage(credential,imageCategory,imageName)
      res <-{
        if(resourceInfo.isDefined && resourceInfo.get.imageFileId!=""){
          val file = gridFS.find(BSONDocument("_id" -> BSONObjectID(resourceInfo.get.imageFileId)))
          serve(gridFS, file, CONTENT_DISPOSITION_INLINE)
        }else{
          Future{NotFound(Json.toJson(GlanceStatus.failureStatus("The request resource does not exist, please check your request resource name!")))}
        }
      }
    }yield{
      res
    }
  }

  def downloadMiscImageRedirect(imageCate:String="logo",imageName:String="icon-glance.pg")=Action.async { implicit request =>
    Future{
      Redirect("/image/{}/{}".format(imageCate,imageName),302)
    }
  }

  private def getDefaultLogo(imageNameIn:String): Result = {
    val contentDefault = {
      this.getClass.getResourceAsStream("/public/glance/%s".format(imageNameIn))
    }
    if (contentDefault != null)
        return Ok.chunked(Enumerator.fromStream(contentDefault)).as("image/png")
    else
        return Redirect("/avatar/defautlogo.png",302) //fixme here, default misc image file???
  }

  def downloadMiscImage(imageCate:String="logo",imageNameIn:String="icon-glance.png")= Action.async { implicit request =>
    val imageCategory: String=imageCate;
    val imageName:String=imageCate
    //Logger.debug("downloadFacilityImage:{}, imageName: {}",imageCategory,imageName)
    val credential =remoteCredential
    for{
      resourceInfo <- GlanceFacilityImage.readFacilityImage(credential,imageCategory,imageName)
      res <-{
        if(resourceInfo.isDefined && resourceInfo.get.imageFileId!=""){
          val file = gridFS.find(BSONDocument("_id" -> BSONObjectID(resourceInfo.get.imageFileId)))
          serve(gridFS, file, CONTENT_DISPOSITION_INLINE)
        }else{
          Future{getDefaultLogo(imageNameIn)}
        }
      }
    }yield{
      res
    }
  }

  def downloadLogoImageRedirect()=Action.async { implicit request =>
    Future{
      Redirect("/image/logo/icon-glance.png",302)
    }
  }

  def downloadLogoImage()= Action.async { implicit request =>
    val imageCategory: String="logo";
    val imageName:String="logo"
    Logger.info("downloadFacilityImage:"+imageCategory+" imageName:"+imageName)
    val credential =remoteCredential
    for{
      resourceInfo <- GlanceFacilityImage.readFacilityImage(credential,imageCategory,imageName)
      res <-{
        if(resourceInfo.isDefined && resourceInfo.get.imageFileId!=""){
          val file = gridFS.find(BSONDocument("_id" -> BSONObjectID(resourceInfo.get.imageFileId)))
          serve(gridFS, file, CONTENT_DISPOSITION_INLINE)
        }else{
          Future{getDefaultLogo(imageName + ".png")}
        }
      }
    }yield{
      res
    }
  }

  def readAllFacilities() =Action.async { implicit request =>
    val credential = remoteCredential
    for{
      facilities <- GlanceFacilityResource.readAll(credential)
    }yield{
      Ok(ComUtils.getJsonArray(facilities.map(p => Json.toJson(p).as[JsObject])))
    }
  }

  def readFacilitiesByFloor(floorIdName:String) =Action.async { implicit request =>
    val credential = remoteCredential
    for{
      facilities <- GlanceFacilityResource.readAllByFloorId(credential,floorIdName)
    }yield{
      Ok(ComUtils.getJsonArray(facilities.map(p => Json.toJson(p).as[JsObject])))
    }
  }

  def deleteFacilityByFloor(floorIdName:String)=Action.async { implicit request =>
    val credential=remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        bDelete <-GlanceFacilityResource.deleteByFloor(credential,{
          if(floorIdName=="public")
            ""
          else
            floorIdName
        })
      }yield {
        if(bDelete)
          Ok(Json.toJson(GlanceStatus.successStatus("Delete floor's facilities successfully")))
        else
          NotFound(Json.toJson(GlanceStatus.successStatus("Failed to delete floor's facilities")))
      }
    }

  }

  def deleteAllFacility()=Action.async { implicit request =>
    val credential=remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        bDelete <-GlanceFacilityResource.deleteAll(credential)
      }yield {
        if(bDelete)
          Ok(Json.toJson(GlanceStatus.successStatus("Delete floor's facilities successfully")))
        else
          NotFound(Json.toJson(GlanceStatus.successStatus("Failed to delete floor's facilities")))
      }
    }
  }

  def companyName()= Action.async { implicit request =>
    val credential =remoteCredential
    for{
      conf <-GlanceSystemConf.readConf(credential)
    }yield {
      Ok(conf.companyName)
    }
  }

  //upload the avatar via batch zip
  def uploadImageFromFile(credential:GlanceCredential,tmpFileName:String):Future[(Boolean,Boolean)]={
    val expert_id:String =FilenameUtils.getBaseName(tmpFileName)
    val fileName = expert_id + ".jpg"
    val fileToSave = DefaultFileToSave(fileName, Some("image/jpg"))
    var resizeImage: Image = null
    val imageFile =new File(tmpFileName)
    val tmpImage: javaxt.io.Image = new javaxt.io.Image(imageFile)
    tmpImage.rotate();
    val tmpFile: File = File.createTempFile(fileName, ".jpg")
    tmpImage.saveAs(tmpFile)
    try{
      val imageNew = Image.fromFile(tmpFile)
      val rates = imageNew.height / 300.0
      if (rates > 1.0)
        resizeImage = imageNew.fit((imageNew.width / rates).toInt, (imageNew.height / rates).toInt)
      else
        resizeImage = imageNew
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to load image file, please check the file is valid image file:{}, error:{}",tmpFileName,exp.getMessage)
        resizeImage=null
    }
    if(resizeImage!=null){
      val enumerator = Enumerator(resizeImage.bytes(JpegWriter()))
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

  private def recursiveListFiles(f: File): Array[File] = {
    if(f.exists() && f.isDirectory()){
      val these = f.listFiles.filter(p => p.getName.compareToIgnoreCase(".DS_Store")!=0 && p.getName().compareToIgnoreCase("__MACOSX")!=0).filter(p => p.isDirectory || (p.isFile && p.length() > 512))
      these ++ these.filter(p => {
        //ingore hide folder of zip file from mac osx
        p.isDirectory && p.getName().compareToIgnoreCase("__MACOSX")!=0
      }).flatMap(recursiveListFiles)
    }else{
      Array[File]()
    }
  }

  private def isValidAvatarFileExt(ext:String):Boolean={
    if (ext!=null && (ext.compareToIgnoreCase("PNG") == 0 ||
                      ext.compareToIgnoreCase("JPG") == 0 ||
                      ext.compareToIgnoreCase("JPEG") == 0))
      true
    else
      false
  }

  def uploadAvatarByBatch() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    if(!isAdminLoggedIn)
    {
       Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus("You are not authorized for this action!")))}
    } else if (redirectUrl.trim() == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid redirect URL")))
      }
    }else{
      val (zipFile,zipFileName)=getUploadTempFile(request.body.file("image"))
      if (zipFile ==null){
        Future {
          BadRequest(Json.toJson(GlanceStatus.failureStatus("No Avatar zip file, is uploaded!")))
        }
      }else{
        val p = Promise[(List[Boolean], List[Boolean])]
        val f = p.future
        val dirPath = "/tmp/avatar/"
        Future {
          val results: mutable.MutableList[Boolean] = new mutable.MutableList[Boolean]()
          val invalids: mutable.MutableList[Boolean] = new mutable.MutableList[Boolean]()
          ZipUtils.decompress(new FileInputStream(zipFile), Paths.get(dirPath))
          val AllFiles = recursiveListFiles(new File(dirPath)).filter(f => {
            val ext = FilenameUtils.getExtension(f.getName)
            isValidAvatarFileExt(ext)
          }).map(p => p.getAbsolutePath)

          val completed = new java.util.concurrent.atomic.AtomicLong()
          AllFiles.foreach { fileName =>
            uploadImageFromFile(credential, fileName).map { bResults =>
              Logger.info(s"Update Avatar via file:$fileName")
              val nCount = completed.incrementAndGet()
              results += bResults._1
              if (bResults._2 == false)
                invalids += bResults._2
              if (nCount >= AllFiles.length)
                p.success((results.toList, invalids.toList))
            }.recover {
              case _ =>
                Logger.error(s"Failed tp update Avatar via file:$fileName")
                val nCount = completed.incrementAndGet()
                results += false
                if (nCount >= AllFiles.length) {
                  p.success((results.toList, invalids.toList))
                }
            }
          }
          if (AllFiles.length == 0)
            p.success((results.toList, invalids.toList))
        }
        f.map { results =>
          val path: Path = Path(dirPath)
          Try(path.deleteRecursively()).map { bRet =>
            Logger.debug(s"Clean unzip folder status:$bRet")
          }.recover {
            case _ =>
              Logger.error("Clean unzip folder Failed.")
          }
          RegisteredUser.cleanCache(credential)
          RegisteredUser.sendCacheSyncMessage(credential)

          val nSuccess: Int = results._1.filter(p => p == true).length
          val nFailed: Int = results._1.filter(p => p == false).length
          val nInvalid: Int = results._2.length
          if (nFailed == 0) {
            Logger.info(s"Avatar files have been uploaded success,succeeded:$nSuccess")
            Redirect(redirectUrl + s"?succeeded=$nSuccess", 301)
          } else if (nFailed > 0 && nSuccess == 0) {
            Logger.info(s"Avatar files have been uploaded failed,failed:$nFailed")
            if (nInvalid > 0)
              Redirect(redirectUrl + s"?failed=$nFailed&invalid=$nInvalid", 301)
            else
              Redirect(redirectUrl + s"?failed=$nFailed", 301)
          } else {
            if (nInvalid > 0)
              Redirect(redirectUrl + s"?succeeded=$nSuccess&failed=$nFailed&invalid=$nInvalid", 301)
            else
              Redirect(redirectUrl + s"?succeeded=$nSuccess&failed=$nFailed", 301)
          }
        }
      }
    }
  }


}