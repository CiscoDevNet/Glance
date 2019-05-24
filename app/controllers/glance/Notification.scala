package controllers.glance

import models.common.GlanceStatus
import models.glance.{GlanceZone, GlanceTrackCampus, RegisteredUser, GlanceSystemConf}
import models.glance.guestaccess.GlanceGuestCheckIn
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import play.Logger
import services.cisco.notification.NotificationService
import services.cisco.spark.SparkService
import services.security.GlanceCredential
import utils.ComUtils
import scala.concurrent.{Future, Await}
import services.cisco.tropo.TropoService
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by whs on 15/9/10.
 */
object Notification extends Controller with Guard {
  def sendVoice(num: String, msg: String) = Action.async { implicit request =>
    TropoService.sendVoice(num, msg).map {
      case Some(status) =>
        Ok("{\"Success\":\"true\"}")
      case None =>
        BadRequest
    }
  }

  def sendSms(num: String, msg: String) = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      conf  <-GlanceSystemConf.readConf(credential)
      users <-RegisteredUser.readAllConf(credential)
      guests <-GlanceGuestCheckIn.readAllGuest(credential)
      optStatus <- {
        val matchUsers =users.filter(p => p.phoneNumber!=null && p.phoneNumber.compareToIgnoreCase(num)==0)
        val matchGuests =guests.filter(p=> p.phoneNumber!=null && p.phoneNumber.compareToIgnoreCase(num)==0)
        if(matchUsers.length>0 || matchGuests.length>0)
          TropoService.sendSmsViaConf(num, msg,conf)
        else
          Future{None}
      }
    } yield{
      if (optStatus.isDefined)
        Ok(Json.toJson(GlanceStatus.successStatus("Message has been sent to number:{}".format(num))))
      else
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Message has not been sent, please check the nunmber exists.")))
    }
  }

  def sendSparkMsg(to:String,msg:String)=Action.async { implicit request =>
    val credential =remoteCredential
    for{
      conf  <-GlanceSystemConf.readConf(credential)
      users <-RegisteredUser.readAllConf(credential)
      guests <-GlanceGuestCheckIn.readAllGuest(credential)
      optStatus <- {
        val matchUsers =users.filter(p => p.email!=null && p.email.compareToIgnoreCase(to)==0)
        val matchGuests =guests.filter(p=> p.email!=null && p.email.compareToIgnoreCase(to)==0)
        if(matchUsers.length>0 || matchGuests.length>0)
          SparkService.send(to, msg,conf)
        else
          Future{None}
      }
    } yield{
      if (optStatus.isDefined)
        Ok(Json.toJson(GlanceStatus.successStatus("Message has sent to receiver successfully!")))
      else
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to {}".format(to))))
    }
  }

  def readCurrentActiveUsers(credential:GlanceCredential):Future[List[RegisteredUser]]={
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
    }yield {
      GlanceWebSocketActor.getAllJoins(campusInfo)
    }
  }

  def searchAndSendSparkMsg(to:String,msg:String)=Action.async { implicit request =>
    val credential =remoteCredential
    for{
      conf  <-GlanceSystemConf.readConf(credential)
      actives <-readCurrentActiveUsers(credential)
      optStatus <- {
        val matchUsers =actives.filter(p => p.email!=null && p.name.compareToIgnoreCase(to)==0)
        if(matchUsers.length>0)
          SparkService.send(matchUsers(0).email, msg,conf)
        else
          Future{None}
      }
    } yield{
      if(optStatus.isDefined)
        Ok(Json.toJson(GlanceStatus.successStatus("Message has sent to receiver successfully!")))
      else
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to {}".format(to))))
    }
  }

  private def checkResults(results:List[Option[Int]]): Boolean = {
    for (ret <- results){
      if (ret.isDefined && ret.get == 200)
        return true
    }
    return false
  }

  def searchLikeAndSendSparkMsg(to:String,msg:String)=Action.async { implicit request =>
    val credential =remoteCredential

    for{
      conf  <-GlanceSystemConf.readConf(credential)
      actives <-readCurrentActiveUsers(credential)
      statusList <- {
        val matchUsers =actives.filter(p => p.email!=null && p.name.toLowerCase.contains(to.toLowerCase))
        val mailList = matchUsers.map(p=> p.email).filter(p => p!="").distinct
        if(mailList.length>0)
          SparkService.sendBatch(mailList,msg,conf)
        else
          Future{List(None)}
      }
    } yield{
      if(checkResults(statusList))
        Ok(Json.toJson(GlanceStatus.successStatus("Message has sent to receiver(s) successfully!")))
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver!")))
    }
  }

  def sendSparkMsgToZoneActiveUsers(zoneNameId:String,msg:String)=Action.async(parse.anyContent) { implicit request =>
    val credential=remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        sysConf <-GlanceSystemConf.readConf(credential)
        experts <-GlanceUser.readCurrentActiveUsers(credential)
        zone <-  GlanceZone.readConfByNameId(credential.glanceOrgId,zoneNameId)
        (code:Int,optStatus:Option[Int]) <- {
          if(zone.isDefined){
            val expertList =GlanceUser.expertsInZones(experts,List(zone.get)).toList.filter(p => p._2.length>0).map(p => p._1)
            val emailList = experts.filter(p => expertList.contains(p.id)).map(p => p.email).filter(p =>p!="").distinct
            if(emailList.length>0){
              SparkService.sendBatch(emailList,msg,sysConf).map{ status =>
                (200,status)
              }
            }else{
              Future{(200,Some(404))}
            }
          }else
            Future{(404,None)}
        }
      }yield{
        if(code == 200){
          if(optStatus.isDefined){
            if(optStatus.get == 200)
              Ok(Json.toJson(GlanceStatus.successStatus("Send message to the active user(s) in the zone successfully!")))
            else
              Ok(Json.toJson(GlanceStatus.successStatus("There has no active user in the zone!")))
          }else{
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to send SparkMsg!")))
          }
        }else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("Zone not found!")))
        }
      }
    }
  }

  def sendTropoMsgToZoneActiveUsers(zoneNameId:String,msg:String)=Action.async(parse.anyContent) { implicit request =>
    val credential=remoteCredential

    def tropoBatchSendToExpertsInZone_inline(optZone:Option[GlanceZone],experts:List[RegisteredUser],sysConf:GlanceSystemConf):Future[(Int,Option[Int])]={
      if(!optZone.isDefined)
        Future{(404,None)}
      else {
        val expertList =GlanceUser.expertsInZones(experts,List(optZone.get)).toList.filter(p => p._2.length>0).map(p => p._1)
        if(expertList.length<=0)
          Future{(200,Some(404))}
        else{
          val phoneNumberList =experts.filter(p => expertList.contains(p.id)).map(p => p.phoneNumber).filter(p => p!="").distinct
          if(phoneNumberList.length>0){
            TropoService.sendBatch(phoneNumberList,msg,sysConf).map{ status =>
              if (checkResults(status)){
                (200,Some(200))
              }else{
                (200,Some(404))
              }
           }
          }else
            Future{(200,Some(404))}
        }
      }
    }

    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      for{
        sysConf <-GlanceSystemConf.readConf(credential)
        experts <-GlanceUser.readCurrentActiveUsers(credential)
        optZone <-  GlanceZone.readConfByNameId(credential.glanceOrgId,zoneNameId)
        (code:Int,optStatus:Option[Int]) <- tropoBatchSendToExpertsInZone_inline(optZone,experts,sysConf)
      }yield{
        if(code == 200){
          if(optStatus.isDefined){
            if(optStatus.get == 200)
              Ok(Json.toJson(GlanceStatus.successStatus("Send message to the active user(s) in the zone successfully!")))
            else
              Ok(Json.toJson(GlanceStatus.successStatus("There has no active user in the zone!")))
          }else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to send SparkMsg!")))
        }else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("Zone not found!")))
        }
      }
    }
  }

  def sendMsgToUser(toUid:String,msg:String)=Action.async { implicit request =>
    val credential =remoteCredential
    def getMsgProvider_inline():String ={
      var provider = remoteQueryString(request, "provider","all")
      if (!(provider.compareToIgnoreCase("spark") == 0 || provider.compareToIgnoreCase("tropo") == 0 || provider.compareToIgnoreCase("all")==0))
        provider = "all"
      provider
    }

    def getMsgSendResult_inline(optSparkStatus:(Option[Int],Int),optTropoStatus:(Option[Int],Int)): Result = {
      if(optSparkStatus._2 ==200 && optTropoStatus._2==200)
        return Ok(Json.toJson(GlanceStatus.successStatus("Message has sent to receiver successfully!")))
      if(optTropoStatus._2==200){
        if(optSparkStatus._2==400)
          return PartialContent(Json.toJson(GlanceStatus.failureStatus("You have not configured spark message service settings, please correct your system settings!")))
        else if(optSparkStatus._2==404)
          return NotFound(Json.toJson(GlanceStatus.failureStatus("User could not found, please check your receiver user Id!")))
        else{
          return BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver!")))
        }
      }
      if(optSparkStatus._2==200)
      {
        if(optSparkStatus._2==400)
          return PartialContent(Json.toJson(GlanceStatus.failureStatus("You have not configured Tropo message service settings, please correct your system settings!")))
        else if(optSparkStatus._2==404)
          return NotFound(Json.toJson(GlanceStatus.failureStatus("User could not found, please check your receiver user Id!")))
        else{
          return BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver!")))
        }
      }
      if(optTropoStatus._2==404 || optSparkStatus._2==404)
        return NotFound(Json.toJson(GlanceStatus.failureStatus("User could not found, please check your receiver user Id!")))
      else if(optTropoStatus._2==400 || optSparkStatus._2==400)
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("You have not configured message service settings, please correct your system settings!")))
      else
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver!")))
    }

    def sendTropoMsgViaConf_inline(optUser:Option[RegisteredUser],msgProvider:String,conf:GlanceSystemConf):Future[(Option[Int],Int)]={
      if(!optUser.isDefined){
        Future{(None,404)} //not found people...
      }else{
        if(msgProvider.compareToIgnoreCase("tropo")==0 || msgProvider.compareToIgnoreCase("all")==0){
          if(conf.tropoSetting.tropoAuthToken!="" && optUser.get.phoneNumber!="")
            TropoService.sendSmsViaConf(optUser.get.phoneNumber,msg,conf).map{ opt =>
              (opt,200)
            }else{
            Future{(None,400)}
          }
        }else{
          Future{(None,200)}
        }
      }
    }
    def sendSparkMsgViaConf_inline(optUser:Option[RegisteredUser],msgProvider:String,conf:GlanceSystemConf):Future[(Option[Int],Int)]= {
      if(!optUser.isDefined){
        Future{(None,404)} //not found people...
      }else{
        if(msgProvider.compareToIgnoreCase("spark")==0 || msgProvider.compareToIgnoreCase("all")==0)
        {
          if(conf.sparkSetting.account!="" && conf.sparkSetting.token!="")
            SparkService.send(optUser.get.email, msg,conf).map{ opt =>
              (opt,200)
            }
          else {
            Future{(None, 400)}
          }
        }else{
          Future{(None,200)}
        }
      }
    }

    val msgProvider = getMsgProvider_inline()
    for{
      optUser <- RegisteredUser.readUserByUserId(credential,toUid)
      conf  <- GlanceSystemConf.readConf(credential)
      optTropoStatus <- sendTropoMsgViaConf_inline(optUser,msgProvider,conf)
      optSparkStatus <- sendSparkMsgViaConf_inline(optUser,msgProvider,conf)
    } yield {
      getMsgSendResult_inline(optSparkStatus,optTropoStatus)
    }
  }

  def sendSmsViaBody(num: String) = Action.async(parse.json){ implicit request =>
    val credential =remoteCredential
    try
    {
      val msg =(request.body \ "message").asOpt[String].getOrElse("")
      if(msg =="")
      {
        Future{BadRequest}
      }else{
        for{
          conf <-  GlanceSystemConf.readConf(credential)
          optStatus <- TropoService.sendSmsViaConf(num, msg,conf)
        } yield {
          if (optStatus.isDefined){
            Ok(Json.toJson(GlanceStatus.successStatus("Message has sent to receiver successfully!")))
          }else
            BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver.")))
        }
      }
    }catch{
      case ex:Throwable =>
        Logger.error("Failed to send SMS message,exception:{}",ex.getMessage)
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Failed to send message to receiver,exception.")))}
    }
  }

  //send broadcasting message to area with floorId, points  list or zoneId/Name
  def broadcastMessageToArea() = Action.async(parse.json) { implicit request =>
    Future{Ok(Json.toJson(GlanceStatus.successStatus("This feature has not been implemented yet.")))}
  }

  //sms registration APIs...
  def registerSms(num: String, name_id: String) = Action.async { implicit request =>
    //register the user name and phone number info
    val credential=remoteCredential
    val appName = "Glance.selfRegistration.SMS"
    val phoneNumber: String = num
    val email: String = name_id
    def getName(name_id:String,phoneNumber:String):(String,String)={
      val names=name_id.split("@")
      var name=name_id
      val hash_id =phoneNumber.hashCode().toString
      if(names.length>=2){
        name =names(0)
      }
      (name,hash_id)
    }
    val (name,hash_id)=getName(name_id,num)
    val guestId =name+hash_id

    def getCheckIn(conf:GlanceSystemConf):Future[GlanceGuestCheckIn] =Future{
      val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        appName = appName,
        guestId = guestId,
        guestName= name,
        ipAddress = "",
        macAddress = "", //temp create guest user, no mac address..
        phoneNumber = phoneNumber,
        email = email,
        checkInDay = ComUtils.getDayString(conf.defaultTimeZone),
        checkInHour = ComUtils.getHourString(conf.defaultTimeZone),
        checkInMinute = ComUtils.getMinuteString(conf.defaultTimeZone),
        notificationCallback = "")
      guestCheckIn
    }
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      guestCheckIn <- getCheckIn(sysConf)
      bAdd <-GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
      (bSend,msg) <-{
        var msg="Transient error[failed to complete registration], please re-send your email address to +12509995687"
        if(bAdd){
          if((sysConf.glanceReceiverSetting.receiverProtocol=="https" && sysConf.glanceReceiverSetting.receiverHostPort==443) || (sysConf.glanceReceiverSetting.receiverProtocol=="http" && sysConf.glanceReceiverSetting.receiverHostPort==80))
            msg =sysConf.glanceReceiverSetting.receiverProtocol+"://" + sysConf.glanceReceiverSetting.receiverHostName+ "/activation/"+guestId
          else
            msg =sysConf.glanceReceiverSetting.receiverProtocol+"://" + sysConf.glanceReceiverSetting.receiverHostName+":"+sysConf.glanceReceiverSetting.receiverHostPort + "/activation/"+guestId
        }
        TropoService.sendSmsViaConf(num, msg,sysConf).map{ optStatus =>
          if (optStatus.isDefined){
            (true,msg)
          }else{
            (false,msg)
          }
        }
      }
    } yield {
      if(bSend){
        Ok(Json.obj("Success" -> bSend,"phoneNumber" ->num,"msg" -> JsString(msg)))
      }else {
        NotFound(Json.obj("Success" -> bSend,"phoneNumber" ->num,"msg" -> JsString(msg)))
      }
    }
  }

  def activation(activation_id:String) = Action.async { implicit request =>
    //register the user name and phone number info
    val credential =remoteCredential
    val ipAddress =remoteXAddress
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      macAddress <- RegisteredUser.getMacAddress(sysConf, credential,ipAddress)
      bCheckIn <-{
        if(macAddress == "")
          Future{false}
        else
          GlanceGuestCheckIn.updateMacAddress(credential,activation_id,macAddress)
      }
    }yield {
      if(bCheckIn){
        GlanceWebSocketActor.listenNotificationForAllFloors(credential)
        if(macAddress!="") {
          NotificationService.handleClientPositionSnapshot(credential,ipAddress,macAddress)
          Avatar.sendAvatarUpdate(activation_id)
        }
      }
      Redirect("/#register",302)
      //should refresh again...
    }
  }

}
