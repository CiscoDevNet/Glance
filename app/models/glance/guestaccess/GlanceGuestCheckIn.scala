package models.glance.guestaccess

import java.util.UUID
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import controllers.glance.GlanceWebSocketActor
import models.glance.{RegisteredUser, GlanceSystemConf}
import play.Logger
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import play.modules.reactivemongo.json.collection.JSONCollection
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import scala.concurrent.Future
import reactivemongo.core.commands.{Count, LastError}
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current

/**
 * Created by kennych on 1/18/16.
 */
case class GlanceGuestCheckIn(_id: BSONObjectID = BSONObjectID.generate,
                        glanceOrgId:String=ComUtils.getTenantOrgId(),
                        glanceUserId:String=ComUtils.getTenantUserId(),
                        appName : String="",
                        guestId : String,
                        guestName:String ="",
                        macAddress:String,
                        ipAddress:String,
                        checkInDay:String="",
                        checkInHour:String="",
                        checkInMinute:String ="",
                        avatar: String="",
                        email: String="",
                        phoneNumber: String="",
                        notificationCallback:String="",
                        tags: List[String]= List(),
                        updated: Long=System.currentTimeMillis())

object GlanceGuestCheckIn{
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceGuestCheckIn")

  val CACHE_NAME="glanceGuestCheckIn"
  val CONST_PROPERTY_IID = "_id"
  val CONST_PROPERTY_GLANCEORGID = "glanceOrgId"
  val CONST_PROPERTY_GLANCEUSERID = "glanceUserId"
  val CONST_PROPERTY_APPNAME = "appName"
  val CONST_PROPERTY_GUESTID = "guestId"
  val CONST_PROPERTY_GUESTNAME = "guestName"
  val CONST_PROPERTY_MACADDRESS = "macAddress"
  val CONST_PROPERTY_IPADDRESS = "ipAddress"
  val CONST_PROPERTY_CHECKINDAY = "checkInDay"
  val CONST_PROPERTY_CHECKINHOUR = "checkInHour"
  val CONST_PROPERTY_CHECKINMINUTE = "checkInMinute"
  val CONST_PROPERTY_AVATAR = "avatar"
  val CONST_PROPERTY_EMAIL = "email"
  val CONST_PROPERTY_PHONENUMBER = "phoneNumber"
  val CONST_PROPERTY_NOTIFICATIONCALLBACK = "notificationCallback"
  val CONST_PROPERTY_TAGS = "tags"
  val CONST_PROPERTY_UPDATED = "updated"
  val CONST_GLANCE_NAME = "glance"

  def sendCacheSyncMessage(credential: GlanceCredential): Unit ={
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_REGISTERED_GUESTS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  implicit val tolerantGuestCheckInReaders = new Reads[GlanceGuestCheckIn] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceGuestCheckIn(
          (js \ CONST_PROPERTY_IID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(ComUtils.getTenantUserId()),
          (js \ CONST_PROPERTY_APPNAME).asOpt[String].getOrElse(CONST_GLANCE_NAME),
          (js \ CONST_PROPERTY_GUESTID).asOpt[String].getOrElse(UUID.randomUUID().toString),
          (js \ CONST_PROPERTY_GUESTNAME).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_MACADDRESS).as[String],
          (js \ CONST_PROPERTY_IPADDRESS).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_CHECKINDAY).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_CHECKINHOUR).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_CHECKINMINUTE).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_AVATAR).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_EMAIL).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_PHONENUMBER).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_NOTIFICATIONCALLBACK).asOpt[String].getOrElse(""),
          (js \ CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val glanceGuestCheckInWrites = new Writes[GlanceGuestCheckIn] {
    def writes(z: GlanceGuestCheckIn): JsValue = {
      Json.obj(
        CONST_PROPERTY_IID -> z._id,
        CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        CONST_PROPERTY_APPNAME -> z.appName,
        CONST_PROPERTY_GUESTID -> z.guestId,
        CONST_PROPERTY_GUESTNAME -> z.guestName,
        CONST_PROPERTY_MACADDRESS -> z.macAddress,
        CONST_PROPERTY_IPADDRESS -> z.ipAddress,
        CONST_PROPERTY_CHECKINDAY ->z.checkInDay,
        CONST_PROPERTY_CHECKINHOUR ->z.checkInHour,
        CONST_PROPERTY_CHECKINMINUTE ->z.checkInMinute,
        CONST_PROPERTY_AVATAR  -> z.avatar,
        CONST_PROPERTY_EMAIL -> z.email,
        CONST_PROPERTY_PHONENUMBER ->z.phoneNumber,
        CONST_PROPERTY_NOTIFICATIONCALLBACK -> z.notificationCallback,
        CONST_PROPERTY_TAGS -> z.tags,
        CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceGuestCheckInFormat = Format(tolerantGuestCheckInReaders, glanceGuestCheckInWrites)

  def getGuestCheckInByGuestId(credential: GlanceCredential,GuestId:String):Future[Option[GlanceGuestCheckIn]]={
    val findById = (org: String,gid:String) => {
      try{
        GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org,
          CONST_PROPERTY_GUESTID -> GuestId)).one[GlanceGuestCheckIn]
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read guest by Id:{}, exception:{}",GuestId,exp.getMessage)
          Future{None}
      }
    };
    findById(credential.glanceOrgId,GuestId)
  }

  def updateProfileImageId(credential: GlanceCredential,update_expertId:String, fileImageId:String):Future[Boolean] ={
    try{
      GlanceGuestCheckIn.collection.update(Json.obj(CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,CONST_PROPERTY_GUESTID ->update_expertId),
        Json.obj("$set" -> Json.obj(CONST_PROPERTY_AVATAR -> fileImageId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated GuestCheckin: glanceOrgId:"+credential.glanceOrgId+" glanceUserId:"+credential.glanceUserId+" guestId:"+update_expertId+" avatar:"+fileImageId)
          GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null) //clean cache when data is updated...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update ProfileImageId of guest check-in, exception:{}",exp.getMessage)
        Future{false}
    }
  }


  def insert(t: GlanceGuestCheckIn) :Future[Boolean]= {
    try{
      GlanceGuestCheckIn.collection.insert(t).map{
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully to insert:  glanceUserId:"+t.guestId+ " with Data:"+Json.toJson(t).toString())
          true
        case _ =>
          Logger.error("Failed to insert, glanceUserId:{} with Data:{}",t.guestId,Json.toJson(t).toString())
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to insert guest check-in, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def addOrUpdateByPhoneNumber(credential:GlanceCredential,guestCheckIn:GlanceGuestCheckIn):Future[Boolean] ={
    val query = BSONDocument(CONST_PROPERTY_GLANCEORGID -> guestCheckIn.glanceOrgId,CONST_PROPERTY_PHONENUMBER -> guestCheckIn.phoneNumber)
    val findExistCount = (existQuery:BSONDocument) => {
      try{
        GlanceDBService.GlanceDB().command(Count( GlanceGuestCheckIn.collection.name,Some(existQuery)))
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to query guest check-in count by phone number:{}, exception:{}",guestCheckIn.phoneNumber,exp.getMessage)
          Future{0}
      }
    }
    for{
      existCount <-findExistCount(query)
      bRet <- addOrUpdateByPhoneNumber(credential,existCount,guestCheckIn)
      bNotify <-SendNotify(bRet,guestCheckIn)
    }yield {
      GlanceWebSocketActor.addNewGuestToAllExpert(guestCheckIn)
      GlanceWebSocketActor.listenNotificationForAllFloors(credential)
      if(bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean the cache...
      bRet/*&& bNotify*/
    }
  }

  def addOrUpdate(credential:GlanceCredential,guestCheckIn:GlanceGuestCheckIn):Future[Boolean] ={
    val query = BSONDocument(CONST_PROPERTY_GLANCEORGID -> guestCheckIn.glanceOrgId,CONST_PROPERTY_GUESTID -> guestCheckIn.guestId)
      val findExistCount = (existQuery:BSONDocument) => {
        try{
          GlanceDBService.GlanceDB().command(Count( GlanceGuestCheckIn.collection.name,Some(existQuery)))
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to query exist count, exception:{}",exp.getMessage)
            Future{0}
        }
      }
      for{
        existCount <-findExistCount(query)
        bRet <- addOrUpdate(credential,existCount,guestCheckIn)
        bNotify <- SendNotify(bRet,guestCheckIn)
      }yield {
        GlanceWebSocketActor.addNewGuestToAllExpert(guestCheckIn)
        if(bRet) {
          GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null)
          sendCacheSyncMessage(credential)
        } //clean the cache...
        GlanceWebSocketActor.listenNotificationForAllFloors(credential)
        bRet/*&& bNotify*/
      }
  }

  def addOrUpdateByPhoneNumber(credential:GlanceCredential,existCount:Int,conf:GlanceGuestCheckIn):Future[Boolean] ={
    if(existCount >0) {
      updateByPhoneNumber(conf)
    }else{
      insert(conf)
    }
  }

  def addOrUpdate(credential:GlanceCredential,existCount:Int,conf:GlanceGuestCheckIn):Future[Boolean] ={
    if(existCount >0) {
      update(conf)
    }else{
      insert(conf)
    }
  }

  def updateByPhoneNumber(conf:GlanceGuestCheckIn):Future[Boolean] = {
    def copySetValues(z:GlanceGuestCheckIn):JsValue ={
      val jsObj = Json.obj(
        CONST_PROPERTY_APPNAME -> z.appName,
        CONST_PROPERTY_GUESTID -> z.guestId,
        CONST_PROPERTY_GUESTNAME -> z.guestName,
        CONST_PROPERTY_MACADDRESS -> z.macAddress,
        CONST_PROPERTY_IPADDRESS -> z.ipAddress,
        CONST_PROPERTY_CHECKINDAY ->z.checkInDay,
        CONST_PROPERTY_CHECKINHOUR ->z.checkInHour,
        CONST_PROPERTY_CHECKINMINUTE ->z.checkInMinute,
        CONST_PROPERTY_EMAIL -> z.email,
        CONST_PROPERTY_PHONENUMBER ->z.phoneNumber,
        CONST_PROPERTY_NOTIFICATIONCALLBACK -> z.notificationCallback,
        CONST_PROPERTY_TAGS -> z.tags,
        CONST_PROPERTY_UPDATED -> z.updated
      )
      jsObj
    }

    try{
      GlanceGuestCheckIn.collection.update(Json.obj(CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,CONST_PROPERTY_PHONENUMBER ->conf.phoneNumber),
        Json.obj("$set" -> copySetValues(conf))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated,glanceOrgId:{} withData:{}",conf.glanceOrgId,Json.toJson(conf).toString)
          true
        case _ =>
          Logger.error("Failed to update,glanceOrgId:{} withData:{}",conf.glanceOrgId,Json.toJson(conf).toString)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update guest check-in, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  def update(guestCheckIn:GlanceGuestCheckIn):Future[Boolean] = {
    def copySetValues(z:GlanceGuestCheckIn):JsValue ={
      val jsObj = Json.obj(
        CONST_PROPERTY_APPNAME -> z.appName,
        CONST_PROPERTY_GUESTID -> z.guestId,
        CONST_PROPERTY_GUESTNAME -> z.guestName,
        CONST_PROPERTY_MACADDRESS -> z.macAddress,
        CONST_PROPERTY_IPADDRESS -> z.ipAddress,
        CONST_PROPERTY_CHECKINDAY ->z.checkInDay,
        CONST_PROPERTY_CHECKINHOUR ->z.checkInHour,
        CONST_PROPERTY_CHECKINMINUTE ->z.checkInMinute,
        CONST_PROPERTY_EMAIL -> z.email,
        CONST_PROPERTY_PHONENUMBER ->z.phoneNumber,
        CONST_PROPERTY_NOTIFICATIONCALLBACK -> z.notificationCallback,
        CONST_PROPERTY_TAGS -> z.tags,
        CONST_PROPERTY_UPDATED -> z.updated
      )
      jsObj
    }

    try{
      GlanceGuestCheckIn.collection.update(Json.obj(CONST_PROPERTY_GLANCEORGID ->guestCheckIn.glanceOrgId,CONST_PROPERTY_GUESTID ->guestCheckIn.guestId),
        Json.obj("$set" -> copySetValues(guestCheckIn))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Successfully updated,glanceOrgId:{} withData:{}",guestCheckIn.glanceOrgId,Json.toJson(guestCheckIn).toString)
          true
        case _ =>
          Logger.error("Failed to update, glanceOrgId:{} withData:{}",guestCheckIn.glanceOrgId,Json.toJson(guestCheckIn).toString)
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update guest check-in, exception:{}",exp.getMessage)
        Future{false}
    }
  }

  //post notification to url:
  def SendNotify(bCheckInFailed:Boolean,glanceGuestCheckIn: GlanceGuestCheckIn): Future[Boolean] = {
    def createRequest(timeout: Int = 2*60*1000) : WSRequestHolder = {
      //callback/:guestId/:macAddress
      val urlStr ="{}/{}/{}".format(glanceGuestCheckIn.notificationCallback,glanceGuestCheckIn.guestId,glanceGuestCheckIn.macAddress)
      Logger.debug("URI:{}",urlStr)
      val holder = WS.url(urlStr).withRequestTimeout(timeout)
      holder.withHeaders("Content-Type" -> "application/json")
      holder.withHeaders("Accept" -> "application/json")
      holder
    }

    if(!bCheckInFailed || glanceGuestCheckIn.notificationCallback==""){
      Logger.error("Glance guest user check-in failed!")
      Future{false}
    }else{
      val holder: WSRequestHolder = createRequest()
      val response = (response: WSResponse) => {
        response.status match {
          case 200 =>
            Logger.debug("Successfully to send back information about about GlanceGuestInfo:{}",Json.toJson(glanceGuestCheckIn).toString())
            true
          case _ =>
            Logger.error("Failed to send back information about about GlanceGuestInfo:{}",Json.toJson(glanceGuestCheckIn).toString())
            false
        }
      }
      holder.post(Json.toJson(glanceGuestCheckIn)).map(response)
    }
  }

  def readTrackedMacAddress(credential: GlanceCredential):Future[List[String]] ={
    def loadTrackedMacAddress():Future[List[String]]={
      val filter = BSONDocument(
        CONST_PROPERTY_MACADDRESS -> 1,
        CONST_PROPERTY_IID -> 0)
      val findGuestMacAddressByOrgId= (org: String) => {
        try{
          GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org,CONST_PROPERTY_MACADDRESS->Json.obj("$ne" ->"")),filter).cursor[BSONDocument].collect[List]()
        }catch {
          case exp:Throwable =>
            Logger.error("Failed to query count of guest check-in by macAddress, exception:{}",exp.getMessage)
            Future{List()}
        }
      };

      findGuestMacAddressByOrgId(credential.glanceOrgId).map{ listObject =>
        val list =listObject.map(_.getAs[String](CONST_PROPERTY_MACADDRESS).get)
        val guestList =list.filter(x => x != "").distinct
        Logger.debug("findGuestMacAddressByOrgId length:"+guestList.length +" data:"+guestList.mkString(","))
        guestList
      }.recover{
        case _ =>
          List()
      }
    }
    val optGuestList:Option[List[GlanceGuestCheckIn]]=GlanceSyncCache.getGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME) //clean the cache...
    optGuestList match {
      case Some(glanceGuestList:List[GlanceGuestCheckIn]) =>
        val list =glanceGuestList.map((glanceGuest:GlanceGuestCheckIn) =>glanceGuest.macAddress)
        val guestList =list.filter(x=> x != "").distinct
        if(guestList.size>0)
          Future{guestList}
        else
          loadTrackedMacAddress()
      case None  =>
        loadTrackedMacAddress()
    }
  }

  def convertToGuestUser(credential:GlanceCredential,glanceGuestCheckIn: GlanceGuestCheckIn):RegisteredUser={
    def getName(glanceGuestCheckIn: GlanceGuestCheckIn):String={
      if(glanceGuestCheckIn.guestName!="")
        glanceGuestCheckIn.guestName
      else
        glanceGuestCheckIn.ipAddress
    }
    return new RegisteredUser(glanceOrgId = credential.glanceOrgId,
      glanceUserId = credential.glanceUserId,
      id=glanceGuestCheckIn.guestId,
      name=getName(glanceGuestCheckIn),
      email=getName(glanceGuestCheckIn)+"@"+glanceGuestCheckIn.appName,
      category = ComUtils.SMART_DEVICE_TYPE_GUEST,
      title = ComUtils.SMART_DEVICE_TYPE_GUEST,
      macAddress =List(glanceGuestCheckIn.macAddress))
  }

  def readAllGuestAsUser(credential: GlanceCredential):Future[List[RegisteredUser]]={
    val findGuestMacAddressByOrgId = (org: String) => {
      try{
        GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org)).cursor[GlanceGuestCheckIn].collect[List]()
      }catch {
        case exp:Throwable =>
          Logger.error("Failed to read guest mac address by orgId exception:{}",exp.getMessage)
          Future{List()}
      }

    };
    findGuestMacAddressByOrgId(credential.glanceOrgId).map { listObject =>
      GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,listObject) //cache the value...
      val guestList = listObject.filter(x => x.macAddress != "")
      guestList.map((guest: GlanceGuestCheckIn) => convertToGuestUser(credential, guest))
    }.recover {
      case _ =>
        GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null)
        List()
    }
  }

  def readAllGuest(credential: GlanceCredential):Future[List[GlanceGuestCheckIn]]={
    val findGuestMacAddressByOrgId = (org: String) => {
      try{
        GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org)).cursor[GlanceGuestCheckIn].collect[List]()
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to read guest by orgId,exception:{}",exp.getMessage)
          Future{List()}
      }
    };
    findGuestMacAddressByOrgId(credential.glanceOrgId)
  }

  def readRegisteredGuestByMac(credential: GlanceCredential,macAddress:String):Future[Option[RegisteredUser]] ={
    def readRegisteredGuestByMacFromDB_inline():Future[Option[RegisteredUser]] ={
      def findByMacAddress(): Future[Option[RegisteredUser]] =
      {
        val findByName  = (org: String,mac:String) => {
          try{
            GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org,CONST_PROPERTY_MACADDRESS -> mac)).one[GlanceGuestCheckIn]
          }catch {
            case exp:Throwable =>
              Logger.error("Failed to read guest by macAddress:{},exception:{}",mac,exp.getMessage)
              Future{None}
          }
        };
        findByName(credential.glanceOrgId,macAddress).map{ info =>
          info match{
            case Some(guest) =>
              Some(convertToGuestUser(credential,guest))
            case _=>
              None
          }
        }.recover{
          case _ =>
            None
        }
      }
      val optGuestList =GlanceSyncCache.getGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME)
      optGuestList match{
        case Some(guestList) =>
          val list =guestList.filter(x=> x.macAddress== macAddress)
          if(list.size>0)
            Future{Some(convertToGuestUser(credential,list(0)))}
          else
            findByMacAddress()
        case None =>
          findByMacAddress()
      }
    }

    if(macAddress==null ||  macAddress==""){
      Logger.warn("readRegisteredGuestByMac empty macAddress")
      Future{None}
    }else{

      for{
        sysConf <-GlanceSystemConf.readConf(credential)
        optUser <- {
          if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData)
            Future{None}
          else
            readRegisteredGuestByMacFromDB_inline()
        }
      }yield {
        optUser
      }
    }
  }

  def updateMacAddress(credential:GlanceCredential,expertId:String,macAddressTo:String) :Future[Boolean] ={
    def copyMacAddressUpdates(macAddress:String):JsValue ={
      var jsObj = Json.obj()
      jsObj +=(ComUtils.CONST_PROPERTY_MACADDRESS, Json.toJson(macAddress))
      jsObj
    }

    try{
      GlanceGuestCheckIn.collection.update(Json.obj(CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,CONST_PROPERTY_GLANCEUSERID ->credential.glanceUserId,"guestId" ->expertId),
        Json.obj("$set" -> copyMacAddressUpdates(macAddressTo))).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully updated- glanceOrgId:{},glanceUserId:{},userId:{},macAddress:{}",credential.glanceOrgId,credential.glanceUserId,expertId,macAddressTo)
          GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null) //clean the cache...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update guest's -{},  macAddress:{},exception:{}",expertId,macAddressTo,exp.getMessage)
        Future{false}
    }

  }

  def readByUserId(credential: GlanceCredential,userId:String):Future[Option[GlanceGuestCheckIn]] ={
    def readByUserIdFromDB_inline():Future[Option[GlanceGuestCheckIn]] = {
      Logger.debug("readConf: credential:"+credential.glanceOrgId+" orgUser:"+credential.glanceUserId+ " userId:"+userId)
      val findByName  = (org: String,uid:String) => {
        try{
          GlanceGuestCheckIn.collection.find(Json.obj(CONST_PROPERTY_GLANCEORGID -> org,CONST_PROPERTY_GUESTID -> uid)).one[GlanceGuestCheckIn]
        }catch{
          case exp:Throwable =>
            Logger.error("Failed to read guest's by guest Id:{},exception:{}",userId,exp.getMessage)
            Future{None}
        }
      };
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME)
      def readByName(org:String,uid:String):Future[Option[GlanceGuestCheckIn]]={
        findByName(org,uid)
      }
      optCacheUsers match {
        case Some(users:List[GlanceGuestCheckIn]) =>
          val list =users.filter(x => x.guestId==userId)
          if(list.size>0)
            Future{Some(list(0))}
          else
            readByName(credential.glanceOrgId,userId)
        case None =>
          readByName(credential.glanceOrgId,userId)
      }
    }

    for{
      sysConf<- GlanceSystemConf.readConf(credential)
      optCheckIn <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData)
          Future{None}
        else
          readByUserIdFromDB_inline()
      }
    }yield{
      optCheckIn
    }
  }

  def checkoutByForce(credential: GlanceCredential,expertId:String) :Future[Boolean] ={
    updateMacAddress(credential,expertId,"").map{ bRet =>
      if(bRet)
        GlanceWebSocketActor.listenNotificationForAllFloors(credential)
      bRet
    }

    for{
      bRet <- updateMacAddress(credential,expertId,"")
      if(bRet)
      optGuest <- readByUserId(credential,expertId)
    } yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null) //clean the cache, if updated success...
        sendCacheSyncMessage(credential)  //reload athe cache
        GlanceWebSocketActor.listenNotificationForAllFloors(credential)
        optGuest match{
          case Some(guest) =>
            GlanceWebSocketActor.checkOutUser(GlanceGuestCheckIn.convertToGuestUser(credential,guest))
          case _=>
            Logger.error("Failed to find the check out user--this should not happen!")
        }
      }
      bRet
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null)
  }

  def updateGlanceGuestCheckInCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      GlanceWebSocketActor.updateAllNActiveExpert(credential)
    }
    if(bCheckExists){
      val optGuests =GlanceSyncCache.getGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME)
      optGuests match {
        case Some(optGuests) =>
          Future{true}
        case None =>
          readAndSet
      }
    }else{
      readAndSet
    }
  }

  def deleteAll(credential: GlanceCredential):Future[Boolean]={
    try{
      GlanceGuestCheckIn.collection.remove(Json.obj(CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId)).map {
        case LastError(true, _, _, _, _, _, _) =>
          Logger.debug("Successfully deleted:{}",credential.glanceOrgId)
          GlanceSyncCache.setGlanceCache[List[GlanceGuestCheckIn]](CACHE_NAME,null) //clean the cache...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          false
      }.recover{
        case _ =>
          false
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to delete all guest, exception:{}",exp.getMessage)
        Future{false}
    }
  }
}