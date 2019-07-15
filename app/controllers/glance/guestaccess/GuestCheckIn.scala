package controllers.glance.guestaccess


import java.io.FileInputStream
import java.io.{File, FileInputStream}
import java.util.UUID

import com.sksamuel.scrimage.Image
import com.sksamuel.scrimage.nio.JpegWriter
import controllers.glance.Avatar._
import controllers.security.Guard
import controllers.glance.Check._
import utils.ComUtils.MAX_CONTENT
import controllers.glance.GlanceUser._
import controllers.glance.GlanceWebSocketActor
import models.common.GlanceStatus
import models.glance.guestaccess.GlanceGuestCheckIn
import models.glance.{GlanceTrackFloor, GlanceNotificationSubscription, RegisteredUser, GlanceSystemConf}
import play.Logger
import play.api.Play
import play.api.libs.Files.TemporaryFile
import play.api.libs.iteratee.Enumerator
import play.api.libs.json._
import play.api.mvc.MultipartFormData.FilePart
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import reactivemongo.bson.BSONObjectID
import services.cisco.notification.NotificationService
import utils.{ComUtils, JsonResult}
import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import play.modules.reactivemongo.ReactiveMongoPlugin
import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader

/**
 * Created by kennych on 1/18/16.
 */
object GuestCheckIn extends Controller with Guard {

  private def isValidUrl(urlCheck: String): Boolean = {
    import java.net.URL
    import java.net.MalformedURLException
    try {
      val url = new URL(urlCheck)
      if (url.getProtocol.compareToIgnoreCase("http") == 0 || url.getProtocol.compareToIgnoreCase("https") == 0)
        true
      else
        false
    } catch {
      case e: MalformedURLException =>
        Logger.error("Incorrect parameter of Guest Checkin:{}",e.getMessage())
        false
      case ex:Throwable =>
        Logger.error("Incorrect parameter of Guest Checkin:Unknown exception:{}",ex.getMessage)
        false
    }
  }

  private def appendPathWithGuestAndMacAddress(redirectUrl:String,guestId:String,macAddress:String):String={
    return redirectUrl + "/" + guestId + "/" + macAddress
  }

  def guestCheckIn(guestId: String) = Action.async { implicit request =>
    val credential = remoteCredential
    val ipAddress = remoteXAddress
    val redirectTo = remoteQueryString(request, "redirect","")
    val appName = remoteQueryString(request, "appname","")
    if (!isValidUrl(redirectTo)) {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect URL parameters!")))
      }
    }else {
      for {
        sysConf <- GlanceSystemConf.readConf(credential)
        macAddress <- RegisteredUser.getMacAddress(sysConf,credential,ipAddress)
        bRet <- GlanceGuestCheckIn.addOrUpdate(credential,new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId, glanceUserId = credential.glanceUserId, appName = appName, guestId = guestId, ipAddress = ipAddress, macAddress = macAddress, notificationCallback = redirectTo))
      } yield {
        if (bRet) {
          //new Guest checked-in, update the listen notification info...
          GlanceWebSocketActor.listenNotificationForAllFloors(credential)
          Redirect(appendPathWithGuestAndMacAddress(redirectTo,guestId,macAddress), 302)
        }else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to check-in the device!")))
      }
    }
  }

  private def getResult(bRet: Boolean, toURL: String): Result= {
    if (bRet == false)
      return  NotFound(Json.toJson(GlanceStatus.failureStatus("Update failed")))
    if (toURL == "")
      return PartialContent(Json.toJson(GlanceStatus.failureStatus("Invalid redirect URL")))
    else
      return Redirect(toURL, 301)
  }


  private def getUploadTempFile(file:Option[FilePart[TemporaryFile]]): java.io.File ={
    file match{
      case Some(image) =>
        image.ref.file
      case _ =>
        null
    }
  }
  private def getResizedImage(imageFile:File):com.sksamuel.scrimage.Image={
    var resizeImage: Image = null
    val imageNew = Image.fromFile(imageFile)
    val rates = imageNew.height / 300.0
    if (rates > 1.0)
      resizeImage = imageNew.fit((imageNew.width / rates).toInt, (imageNew.height / rates).toInt)
    else
      resizeImage = imageNew
    resizeImage
  }

  def guestSelfCheckIn(expert_id: String) = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val ipAddress = remoteXAddress
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    if (redirectUrl.trim() == "") {
      Future {BadRequest(Json.toJson(GlanceStatus.failureStatus("No redirect URL")))}
    }else{
      val appName = "Glance.selfRegistration"
      val phoneNumber: String = remoteExtractDataString(request.body.dataParts.get("phoneNumber"))
      val email: String = remoteExtractDataString(request.body.dataParts.get("email"))
      var displayName: String = remoteExtractDataString(request.body.dataParts.get("displayName"))
      var guestId: String = remoteExtractDataString(request.body.dataParts.get("guestId"))
      if (guestId.trim() == "") {
        guestId = "guest_" + UUID.randomUUID().toString().hashCode.toString()
      }
      if (displayName.trim() == "") {
        displayName = "Glance " + guestId
      }
      val uploadFile:File =getUploadTempFile(request.body.file("image"))
      if(uploadFile!=null){
          val fileName = expert_id + ".jpg"
          val fileToSave = DefaultFileToSave(fileName, Some("image/jpg"))
          val resizeImage: Image = getResizedImage(uploadFile)
          val enumerator = Enumerator(resizeImage.bytes(JpegWriter()))

          for {
            file <- gridFS.save(enumerator, fileToSave)
            sysConf <- GlanceSystemConf.readConf(credential)
            macAddress <- RegisteredUser.getMacAddress(sysConf,credential, ipAddress)
            guestCheckIn <- Future{
              val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
                glanceUserId = credential.glanceUserId,
                appName = appName,
                guestId = guestId,
                ipAddress = ipAddress,
                macAddress = macAddress,
                phoneNumber = phoneNumber,
                email = email,
                checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
                checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
                checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
                avatar = file.id.asInstanceOf[BSONObjectID].stringify,
                notificationCallback = "")
              guestCheckIn
            }
            bRet <- {
              GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
            }
          } yield {
            //fixme handle client position snapshot when
            if(bRet)
            {
              //update allexpert
              GlanceWebSocketActor.addNewGuestToAllExpert(guestCheckIn)
              //GlanceWebSocketActor.updateAllRegister()
              NotificationService.syncAllDataToInstances()
              NotificationService.handleClientPositionSnapshot(credential,ipAddress,macAddress)
            }
            getResult(bRet, redirectUrl)
          }
        }else{
          for {
            sysConf <- GlanceSystemConf.readConf(credential)
            macAddress <- RegisteredUser.getMacAddress(sysConf,credential, ipAddress)
            bRet <- {
              if (macAddress == "")
                Future {false}
              else {
                val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
                  glanceUserId = credential.glanceUserId,
                  appName = appName,
                  guestId = guestId,
                  ipAddress = ipAddress,
                  macAddress = macAddress,
                  phoneNumber = phoneNumber,
                  email = email,
                  checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
                  checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
                  checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
                  notificationCallback = "")
                GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
              }
            }
          } yield {
            getResult(bRet, redirectUrl)
          }
        }
      }
  }

  def guestSelfCheckInWithoutPhoto() = Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    val ipAddress = remoteXAddress
    val redirectTo = remoteQueryString(request, "redirect","")
    val guestName = (request.body \ "name").asOpt[String].getOrElse("")

    if (!isValidUrl(redirectTo) || guestName == "") {
      Future {
        if(guestName=="")
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect guest Name!")))
        else
          BadRequest(Json.toJson(GlanceStatus.failureStatus("Incorrect URL parameters!")))
      }
    }else{
      val appName = "Glance.selfRegistration"
      val phoneNumber: String = ""
      val email: String = ""
      for {
        sysConf <- GlanceSystemConf.readConf(credential)
        macAddress <- RegisteredUser.getMacAddress(sysConf,credential, ipAddress)
        bRet <- {
          if (macAddress == "")
            Future{false}
          else {
            val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
              glanceUserId = credential.glanceUserId,
              appName = appName,
              guestId = "guest_" + macAddress.hashCode().toString(),
              guestName=guestName,
              ipAddress = ipAddress,
              macAddress = macAddress,
              phoneNumber = phoneNumber,
              email = email,
              checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
              checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
              checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
              notificationCallback = "")
            GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
          }
        }
      } yield {
        getResult(bRet, redirectTo)
      }
    }
  }
}
