package models.glance


import java.io.File
import javaxt.utils.URL
import akka.actor.{ActorRef, Props, Actor}
import controllers.amqp.{GlanceMemcached, GlanceSyncProducer, GlanceSyncCache}
import models.cmx.{ConnectedRecord, Connected, MapCoordinate}
import org.apache.commons.io.{FileUtils, FilenameUtils}
import play.api.libs.iteratee.Enumerator
import services.cisco.database.GlanceDBService
import services.cisco.notification.NotificationService
import scala.collection.mutable
import java.util.Date
import _root_.utils.ComUtils
import controllers.glance.{Avatar, GlanceWebSocketActor}
import models._
import play.Logger
import play.api.Play.current
import play.api.libs.ws._
import play.modules.reactivemongo.json.collection.JSONCollection
import services.common.{SchedulingService, ConfigurationService}
import services.security.GlanceCredential
import reactivemongo.bson._
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import reactivemongo.core.commands.{Count, LastError}
import play.api.libs.json._
import scala.concurrent.{Promise, Future}
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.functional.syntax._
import models.cmx.Implicits._
import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader
import scala.concurrent.duration._

/**
 * Created by kennych on 11/13/15.
 */
case class GlancePositionEx(x: Long,
                                y: Long,
                                mapHierarchy:String="",
                                referenceId:String="")
case class GlancePosition(
     x: Long,
     y: Long,
     mapHierarchy:String="",
     floorId:String="",
     buildingId:String="",
     campusId:String=""
     )
object GlancePosition{
  val tolerantPositionReaders = new Reads[GlancePosition] {
    def reads(js: JsValue) = {
      JsSuccess(GlancePosition(
        (js \ ComUtils.CONST_PROPERTY_X).asOpt[Long].getOrElse(0),
        (js \ ComUtils.CONST_PROPERTY_Y).asOpt[Long].getOrElse(0),
        (js \ ComUtils.CONST_PROPERTY_MAPHIERARCHY).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")
      ))
    }
  }

  val positionReaders : Reads[GlancePosition] = (
      (__ \ ComUtils.CONST_PROPERTY_X).read[Long] and
      (__ \ ComUtils.CONST_PROPERTY_Y).read[Long] and
      (__ \ ComUtils.CONST_PROPERTY_MAPHIERARCHY).read[String] and
      (__ \ ComUtils.CONST_PROPERTY_FLOORID).read[String] and
      (__ \ ComUtils.CONST_PROPERTY_BUILDINGID).read[String] and
      (__ \ ComUtils.CONST_PROPERTY_CAMPUSID).read[String]
    )(GlancePosition.apply _)

  implicit val positionWrites = new Writes[GlancePosition] {
    def writes(z: GlancePosition): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_X -> z.x,
        ComUtils.CONST_PROPERTY_Y -> z.y,
        ComUtils.CONST_PROPERTY_MAPHIERARCHY -> z.mapHierarchy,
        ComUtils.CONST_PROPERTY_FLOORID -> z.floorId,
        ComUtils.CONST_PROPERTY_BUILDINGID ->z.buildingId,
        ComUtils.CONST_PROPERTY_CAMPUSID ->z.campusId
      )
      return jsObj
    }
  }

  implicit val positionFormat = Format(tolerantPositionReaders, positionWrites)
}

object GlancePositionEx{

  val tolerantPositionExReaders = new Reads[GlancePositionEx] {
    def reads(js: JsValue) = {
      JsSuccess(GlancePositionEx(
        (js \ ComUtils.CONST_PROPERTY_X).asOpt[Long].getOrElse(0),
        (js \ ComUtils.CONST_PROPERTY_Y).asOpt[Long].getOrElse(0),
        (js \ ComUtils.CONST_PROPERTY_MAPHIERARCHY).asOpt[String].getOrElse(""),
        (js \ "referenceId").asOpt[String].getOrElse("")
      ))
    }
  }

  val positionExReaders : Reads[GlancePositionEx] = (
      (__ \ ComUtils.CONST_PROPERTY_X).read[Long] and
      (__ \ ComUtils.CONST_PROPERTY_Y).read[Long] and
      (__ \ ComUtils.CONST_PROPERTY_MAPHIERARCHY).read[String] and
      (__ \ "referenceId").read[String]
    )(GlancePositionEx.apply _)

  implicit val positionExWrites = new Writes[GlancePositionEx] {
    def writes(z: GlancePositionEx): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_X -> z.x,
        ComUtils.CONST_PROPERTY_Y -> z.y,
        ComUtils.CONST_PROPERTY_MAPHIERARCHY -> z.mapHierarchy,
        "referenceId" -> z.referenceId
      )
      return jsObj
    }
  }
  implicit val positionExFormat = Format(tolerantPositionExReaders, positionExWrites)
}

case class RegisteredUser(
     _id: BSONObjectID = BSONObjectID.generate,
     glanceOrgId:String,
     glanceUserId:String,
     id: String,
     name: String,
     email: String,
     phoneNumber: String="",
     topics:List[String]=List(),
     title: String="",
     bio:   String="",
     avatar: String="",
     avatarUrl:String="",
     macAddress: List[String]=List(),
     category:String=ComUtils.SMART_DEVICE_TYPE_EXPERT,
     position:  GlancePosition=new GlancePosition(0,0),
     fixedLocation:Boolean=false,
     tags: List[String] = List(),
     properties: JsObject = Json.obj(),
     status: Int=0,
     checkout: Int=0,
     checkoutTime: Option[Long]=None,
     lastNotified:String =ComUtils.formatCMXTime(System.currentTimeMillis(),5,"+0800"),
     dataFrom:String =ComUtils.DEFAULT_DATASOURCE,
     supportISE:Int =0,
     created: Long = System.currentTimeMillis(),
     updated: Long = System.currentTimeMillis())

object RegisteredUser {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("registeredUsers")
  val CACHE_NAME="registeredUser"

  implicit val tolerantRegisteredUserReaders = new Reads[RegisteredUser] {
    def reads(js: JsValue) = {
      try {
        def getPos():GlancePosition ={
          if((js \ ComUtils.CONST_PROPERTY_POSITION)!=null){
            //val posArr:List[Long] =(js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[List[Long]].getOrElse(List(0))
            val posArr:List[Long] ={
              try {
                (js \ ComUtils.CONST_PROPERTY_POSITION).as[Seq[Long]].toList
              }catch{
                case exp:Throwable =>
                  List(0)
              }
            }
            val floorId =(js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse("")
            val mapHierarchy=(js \ "mapHierarchy").asOpt[String].getOrElse("")
            val buildingId =(js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")
            val campusId =(js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")
            if(posArr==null || posArr.size <2)
            {
              val pos =(js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[GlancePosition].getOrElse(new GlancePosition(0,0,mapHierarchy,floorId,buildingId,campusId))
              new GlancePosition(pos.x,pos.y,{
                if(mapHierarchy!="")
                  mapHierarchy
                else
                  pos.mapHierarchy
              },{
                if(floorId!="")
                  floorId
                else
                  pos.floorId
              },
              {
                if(buildingId!="")
                  buildingId
                else
                  pos.buildingId
              },
              {
                if(campusId!="")
                  campusId
                else
                  pos.campusId
              }
              )
            }
            else
            {
              new GlancePosition(posArr(0),posArr(1),mapHierarchy,floorId)
            }
          }else{
            val floorId =(js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse("")
            val mapHierarchy=(js \ "mapHierarchy").asOpt[String].getOrElse("")
            val buildingId =(js \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")
            val campusId =(js \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")
            new GlancePosition(x=0,y=0,mapHierarchy,floorId,buildingId,campusId)
          }
        }

        JsSuccess(RegisteredUser(
          (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
          (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).asOpt[String].getOrElse(ComUtils.getTenantUserId()),
          (js \ ComUtils.CONST_PROPERTY_ID).asOpt[String].getOrElse((js \ "cecid").asOpt[String].getOrElse("")),
          (js \ ComUtils.CONST_PROPERTY_NAME).as[String],
          (js \ ComUtils.CONST_PROPERTY_EMAIL).as[String],
          (js \ ComUtils.CONST_PROPERTY_PHONENUMBER).asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_TOPICS).asOpt[List[String]].getOrElse((js \ "topics").asOpt[String].getOrElse("").split(",").toList),
          (js \ ComUtils.CONST_PROPERTY_TITLE).asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_BIO).asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_AVATAR).asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_AVATARURL).asOpt[String].getOrElse(""),
          {
           var macAddressList = (js \ ComUtils.CONST_PROPERTY_MACADDRESS).asOpt[List[String]].getOrElse({
              val macAddress =(js \ ComUtils.CONST_PROPERTY_MACADDRESS).asOpt[String].getOrElse("").toLowerCase
              if(macAddress =="")
                List()
              else
                List(macAddress)
            })
            macAddressList = ComUtils.userMacAddressSort(macAddressList)
            macAddressList
          },
          {
            var category =(js \ ComUtils.CONST_PROPERTY_TYPE).asOpt[String].getOrElse((js \ ComUtils.CONST_PROPERTY_CATEGORY).asOpt[String].getOrElse(ComUtils.SMART_DEVICE_TYPE_EXPERT))
            category=convertCategory(category)
            category
          },
          //(js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[GlancePosition].getOrElse(getPos),
          getPos(),
          (js \ "fixedLocation").asOpt[Boolean].getOrElse(false),
          (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ ComUtils.CONST_PROPERTY_PROPERTIES).asOpt[JsObject].getOrElse(Json.obj()),
          (js \ "status").asOpt[Int].getOrElse(0),
          (js \ "checkout").asOpt[Int].getOrElse(0),
          (js \ "checkoutTime").asOpt[Option[Long]].getOrElse(Some(0)),
          (js \ "lastNotified").asOpt[String].getOrElse(ComUtils.formatCMXTime(System.currentTimeMillis(), 5, "+0800")),
          (js \ "dataFrom").asOpt[String].getOrElse(ComUtils.DEFAULT_DATASOURCE),
          (js \ "supportISE").asOpt[Int].getOrElse(0),
          (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      } catch {
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  def convertCategory(category:String):String={
    var tmpCategory=category.trim().toLowerCase()
    if(tmpCategory=="" ||
      tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_PERSON)==0  ||
      tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_PEOPLE) ==0 ||
      tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_GUEST) ==0 ||
      tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_VISITOR) ==0)
      tmpCategory =ComUtils.SMART_DEVICE_TYPE_EXPERT
    else if(tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_ASSET)==0  ||
            tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_DEVICE) ==0 ||
            tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_MOBILE) ==0 ||
            tmpCategory.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_EQUIPMENT) ==0)
      tmpCategory =ComUtils.SMART_DEVICE_TYPE_THING
    tmpCategory
  }

  implicit val registeredUserWrites = new Writes[RegisteredUser] {
    def writes(z: RegisteredUser): JsValue = {

      var jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        ComUtils.CONST_PROPERTY_ID -> z.id,
        ComUtils.CONST_PROPERTY_NAME -> z.name,
        ComUtils.CONST_PROPERTY_EMAIL -> z.email,
        ComUtils.CONST_PROPERTY_PHONENUMBER -> z.phoneNumber,
        ComUtils.CONST_PROPERTY_TOPICS -> Json.toJson(z.topics),
        ComUtils.CONST_PROPERTY_TITLE -> z.title,
        ComUtils.CONST_PROPERTY_BIO -> z.bio,
        ComUtils.CONST_PROPERTY_AVATAR -> z.avatar,
        ComUtils.CONST_PROPERTY_AVATARURL ->z.avatarUrl,
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        ComUtils.CONST_PROPERTY_TYPE -> convertCategory(z.category),
        ComUtils.CONST_PROPERTY_CATEGORY  -> convertCategory(z.category),
        ComUtils.CONST_PROPERTY_POSITION ->z.position,
        "fixedLocation" ->z.fixedLocation,
        "status" -> z.status,
        "checkout" -> z.checkout,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_PROPERTIES -> z.properties,
        "lastNotified" -> z.lastNotified,
        "dataFrom" ->z.dataFrom,
        "supportISE" ->z.supportISE,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
      if(z.checkoutTime.isDefined) jsObj += ("checkoutTime", JsNumber(z.checkoutTime.get))
      jsObj
    }
  }

  val registeredUserFormat = Format(tolerantRegisteredUserReaders, registeredUserWrites)

  def InitUserDataImport(credential:GlanceCredential):Unit={
    try{
      GlanceSystemConf.readConf(credential).map{sysConf =>
        if(sysConf.userDataImportSupported){
          updateCMXConnectImportConfig(credential,sysConf)
        }else
        {
          updateCMXConnectImportConfig(null,null)
        }
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to update user import option,exception:{}",exp.getMessage)
    }

  }

  def sendCacheSyncMessage(credential: GlanceCredential): Unit ={
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_REGISTERED_USERS_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def insert(registeredUser: RegisteredUser) :Future[Boolean]= {
    collection.insert(registeredUser).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeed to insert:  glanceUserId:"+registeredUser.id+" user name:"+registeredUser.name+"with email:"+registeredUser.email)
        true
      case _ =>
        Logger.error("Failed to insert:  glanceUserId:"+registeredUser.id+" user name:"+registeredUser.name+"with email:"+registeredUser.email)
        false
    }
  }

  def convertMacAddressFromStrToList(credential:GlanceCredential,expertId:String,macAddress:List[String]):Future[Boolean]={
    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_ID ->expertId),
    {
      Json.obj("$set" ->  Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress))
    }).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+credential.glanceOrgId+" glanceUserId:"+ credential.glanceUserId+" userId:"+expertId +" macAddress:"+macAddress.mkString(";"))
        true
      case _ =>
        Logger.error("Failed to update macAddress.")
        false
    }
  }

  def removeMacAddressFromUnMatchedExpert(credential:GlanceCredential,expertId:String,macAddress:List[String]):Future[Boolean]={

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_ID-> Json.obj("$ne" ->expertId),ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" -> macAddress)),
    {
      Json.obj("$pull" ->  Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" -> macAddress)))
    }).map {
      case LastError(true, _, _, _, _, updated:Int, _) =>
        Logger.debug("Succeeded to update none un-matched expert with same mac address binding: glanceOrgId"+credential.glanceOrgId+" glanceUserId:"+ credential.glanceUserId+" userId:"+expertId +" macAddress:"+macAddress.mkString(";"))
        Logger.debug("Update none un-matched expert with same mac address binding: the records number for :"+expertId+" with updated:"+updated)
        if(updated >0)
          true
        else
          false
      case _ =>
        Logger.error("Failed to update none un-matched expert with same mac address binding: glanceOrgId"+credential.glanceOrgId+" glanceUserId:"+ credential.glanceUserId+" userId:"+expertId +" macAddress:"+macAddress.mkString(";"))
        false
    }
  }
  def updateMacAddress(credentialX:GlanceCredential,expertIdX:String,macAddressX:List[String],bAddX:Boolean):Future[Boolean]={
    def updateMacAddressIn(credential:GlanceCredential,expertId:String,macAddress:List[String],bAdd:Boolean):Future[Boolean]=
    {
      collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_ID -> expertId), {
        if (bAdd)
          Json.obj("$addToSet" -> Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$each" -> macAddress)))
        else {
          if (macAddress.length == 0)
            Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress))
          else
            Json.obj("$pull" -> Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" -> macAddress)))
        }
      }).map {
        case LastError(true, _, _, _, _, updated: Int, _) =>
          Logger.debug("Succeeded to update mac addresses for matched expert for registered users glanceOrgId" + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " userId:" + expertId + " macAddress:" + macAddress.mkString(";"))
          Logger.debug("The records for :" + expertId + " with updated:" + updated)
          if (updated > 0)
            true
          else
            false
        case _ =>
          Logger.error("Failed to update mac addresses for matched expert for registered users glanceOrgId" + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " userId:" + expertId + " macAddress:" + macAddress.mkString(";"))
          false
      }
    }
    for {
      bRemoveFromUnmatched <- {
        if(bAddX && macAddressX.length>0)
          removeMacAddressFromUnMatchedExpert(credentialX,expertIdX,macAddressX)
        else
          Future{true}
      }
      bUpdateMatched <- {
        updateMacAddressIn(credentialX,expertIdX,macAddressX,bAddX)
      }
    }yield {
      bUpdateMatched
    }
  }

  def isGuestUser(registeredUser:RegisteredUser):Boolean={
    (registeredUser.category == ComUtils.SMART_DEVICE_TYPE_GUEST)
  }

  def userToMultiDevices(user:RegisteredUser):List[RegisteredUser]={
    if(isGuestUser(user)){
      List(user) //not to convert guest user...
    }else{
      if(user.macAddress.length==0){
        val userId =ComUtils.getUserIdByDeviceId(user.id,"",user.macAddress)
        List(user.copy(id=userId))
      }else{
        val multiDevices =user.macAddress.map(mac =>{
          val userId =ComUtils.getUserIdByDeviceId(user.id,mac,user.macAddress)
          user.copy(id=userId)
        }
        )
        multiDevices
      }
    }
  }

  def userToDeviceUser(user:RegisteredUser,macAddress:String):RegisteredUser={
    if(isGuestUser(user)){
        user
    }else{
      val userId =ComUtils.getUserIdByDeviceId(user.id,macAddress,user.macAddress)
      user.copy(id=userId)
    }
  }

  def convertAllRecords(credential:GlanceCredential,allUsers:List[RegisteredUser]):Future[Boolean]={
    val filteredList =allUsers.filter(p => p.macAddress.length==1)
    val p = Promise[List[Boolean]]
    val f = p.future
    val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    val completed=new java.util.concurrent.atomic.AtomicLong()
    if(filteredList.length<=0)
      p.success(List())
    else{
      filteredList.foreach{ user =>
        convertMacAddressFromStrToList(credential,user.id,user.macAddress).map{ bRet =>
          results += bRet
          val nCount =completed.incrementAndGet()
          if(nCount>=filteredList.length)
            p.success(results.toList)
        }.recover{
          case _=>
            Logger.error("Failed to convert registeredUser data, update macAddress failed!")
            results += false
            val nCount =completed.incrementAndGet()
            if(nCount>=filteredList.length)
              p.success(results.toList)
        }
      }
    }

    f.map{ results =>
      if(results.filter(p => p==false).length>0){ //if has failed...
        false
      }else{
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null)
        sendCacheSyncMessage(ComUtils.getCredential())
        true
      }

    }.recover{
      case _=>
        Logger.error("Exception, failed to convert all registeredUser records!")
        false
    }
  }

  def versionDataConvert(credential:GlanceCredential):Future[Boolean]={
    for{
      sysConf <-GlanceSystemConf.readConf(credential)
      bNeedConvert <- Future{ComUtils.needConvertVersion(sysConf.currentSchemaVersion,ComUtils.DESTINATION_DATASCHEMAVERSION)}
      allUsers <-{
          if(bNeedConvert)
            readAllConf(credential)
          else
            Future{List()}
      }
      bConvert <-{
        if(bNeedConvert) {
          convertAllRecords(credential,allUsers)
        }else {
          Future{true}
        }
      }
      bUpdateConvertFlag <-{
        //update dataHasConverted Flag...
        if(bNeedConvert){
          if(bConvert)
            GlanceSystemConf.update(credential,"currentSchemaVersion",JsString(ComUtils.DESTINATION_DATASCHEMAVERSION))
          else
            Future{false}
        }
        else {
          Future{true}
        }
      }
    }yield{
      if(bUpdateConvertFlag){
        GlanceSystemConf.cleanCache(credential)
        GlanceSystemConf.sendCacheSyncMessage(credential)
      }
      bConvert && bUpdateConvertFlag
    }
  }

  def removeAllPrevBindViaConnectRecords(credential: GlanceCredential,users:List[RegisteredUser],records:List[ConnectedRecord]):Future[Boolean]={
    def releasePrevBinds(cred:GlanceCredential,users:List[RegisteredUser],macAddress:String):Future[Boolean]= {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      val p = Promise[List[Boolean]]
      val f = p.future
      val results: mutable.MutableList[Boolean] = new mutable.MutableList[Boolean]()
      Future {
        users.foreach{ user =>
          updateMacAddress(cred,user.id,List(macAddress),false).map{ bRet =>
            results += bRet
            val count = completed.incrementAndGet()
            if(count >=users.length)
              p.success(results.toList)
          }.recover{
            case _=>
              Logger.error("Failed to pull device for "+user.id+ " "+macAddress)
              results += false
              val count = completed.incrementAndGet()
              if(count >=users.length)
                p.success(results.toList)
          }
        }
        if(users.length<=0)
          p.success(List(true))
      }
      f.map{ rets =>
        (rets.filter(p => p).length>0)
      }.recover{
        case _=>
          Logger.error("Failed[exception] to release device id:"+macAddress)
          false
      }
    }
    val toReleasedList:mutable.MutableList[(String,List[RegisteredUser])]=new mutable.MutableList[(String, List[RegisteredUser])]()
    for(record <- records){
      val matchedUsers:List[RegisteredUser] =users.filter(p => ComUtils.valueInValues(p.macAddress,List(record.macAddress))).filter(p => p.id=={
        var (tid,emailCom)=ComUtils.parseEmailAddress(record.Email)
        val name ={
          if(record.Name!="")
            record.Name
          else
            tid
        }
        if(tid =="")
          tid =name
      })

      if(matchedUsers.length>0){
        toReleasedList += (record.macAddress -> matchedUsers)
      }
    }
    val completed=new java.util.concurrent.atomic.AtomicLong()
    val p = Promise[List[Boolean]]
    val f = p.future
    val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    Future {
      toReleasedList.foreach{ toReleasedItem =>
        releasePrevBinds(credential,toReleasedItem._2,toReleasedItem._1).map{ bRet =>
          results += bRet
          val count =completed.incrementAndGet()
          if(count>=toReleasedList.length)
            p.success(results.toList)
        }.recover{
          case _=>
            Logger.error("Failed to release prev binding deviceId:"+toReleasedItem._1)
            results += false
            val count =completed.incrementAndGet()
            if(count>=toReleasedList.length)
              p.success(results.toList)
        }
      }
      if(toReleasedList.length<=0)
        p.success(List(true))
    }

    f.map{ rets =>
      (rets.filter(p => p).length>0)
    }.recover{
      case _=>
        Logger.error("Exception, failed to release all previous binding devices!")
        false
    }
  }

  def removeDeviceIdFromPreviousOwner(credential: GlanceCredential,user:RegisteredUser):Future[Boolean]={
    def removeAllPrevBind(cred:GlanceCredential,checkUser:RegisteredUser,allMatchedUsers:List[RegisteredUser]):Future[Boolean]={
      val  filteredUsers =allMatchedUsers.filter(p => p.id!=checkUser.id)
      if(filteredUsers.length<=0)
        Future{true}
      else{
        val completed=new java.util.concurrent.atomic.AtomicLong()
        val p = Promise[List[Boolean]]
        val f = p.future
        val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
        Future {
          for (userX <- filteredUsers){
            updateMacAddress(cred,userX.id,userX.macAddress,false).map{ bRet =>
              results+=bRet
              val count =completed.incrementAndGet()
              if(count>=filteredUsers.length)
                p.success(results.toList)
            }.recover{
              case _=>
                Logger.error("Failed to update connected user info into database,connected User Info:"+Json.toJson(user))
                results+=false
                val count =completed.incrementAndGet()
                if(count>=filteredUsers.length)
                  p.success(results.toList)
            }
          }
          if(filteredUsers.length<=0)
            p.success(List(true)) //force to success.
        }

        f.map{results =>
          (results.filter(p => p==true).length>0)
        }.recover{
          case _=>
            Logger.error("Failed to remove previous bind device IDs by batch:unknown exception!")
            false
        }
      }
    }

    for{
      findUsers <- readAllRegisteredUsersByMac(credential,user.macAddress)
      bRemoveAllPrevBind <- removeAllPrevBind(credential,user,findUsers)
    }yield{
      bRemoveAllPrevBind
    }
  }

  def addOrUpdate(conf:RegisteredUser,bForce:Boolean=false):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_ID -> conf.id)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,conf,bForce)
    }yield {
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null)
        sendCacheSyncMessage(ComUtils.getCredential())
        GlanceWebSocketActor.listenNotificationForAllFloors(ComUtils.getCredential())
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,conf:RegisteredUser,bForce:Boolean):Future[Boolean] ={
    if(existCount >0)
    {
      update(conf,bForce)
    }else{
      insert(conf)
    }
  }

  def update(conf:RegisteredUser,bForce:Boolean=false):Future[Boolean] = {
    def copySetValues(z:RegisteredUser):JsValue ={
      var jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_NAME -> z.name,
        ComUtils.CONST_PROPERTY_EMAIL -> z.email,
        ComUtils.CONST_PROPERTY_PHONENUMBER -> z.phoneNumber,
        ComUtils.CONST_PROPERTY_TOPICS -> Json.toJson(z.topics),
        ComUtils.CONST_PROPERTY_TITLE -> z.title,
        ComUtils.CONST_PROPERTY_BIO -> z.bio,
        ComUtils.CONST_PROPERTY_TYPE  ->z.category,
        "supportISE" ->z.supportISE,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_PROPERTIES -> z.properties,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      if(bForce)
      {
        Logger.debug("force to update macAddress!")
        if(z.avatar!="")
          jsObj +=(ComUtils.CONST_PROPERTY_AVATAR -> JsString(z.avatar))
        if(z.avatarUrl!="")
          jsObj +=(ComUtils.CONST_PROPERTY_AVATARURL ->JsString(z.avatarUrl))
        jsObj += ("fixedLocation" -> JsBoolean(z.fixedLocation))
        jsObj += (ComUtils.CONST_PROPERTY_POSITION -> Json.toJson(z.position))
      }else{
        Logger.info("Force to update macAddress: false.")
      }
      Logger.debug("update the Registered User set data to:"+jsObj.toString())
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_ID -> conf.id),
      Json.obj("$set" -> copySetValues(conf),"$addToSet" -> Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$each"->conf.macAddress)))).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        true
      case _ =>
        Logger.error("Failed to update registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        false
    }.recover{
      case _ =>
        Logger.error("Recover to update registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        false
    }
  }

  def updateUserDeviceInfo(credential:GlanceCredential,expertId:String,
                           category:String,macAddress:String,
                           name:String,phoneNumber:String):Future[Boolean]={

    def getUpdateJson():JsObject={
      var jsObj = Json.obj()
      if(name.trim()!="")
        jsObj +=(ComUtils.CONST_PROPERTY_NAME -> JsString(name.trim()))

      if(category.trim()!="")
        jsObj +=(ComUtils.CONST_PROPERTY_CATEGORY -> JsString(category.trim()))

      if(phoneNumber.trim()!="")
        jsObj +=(ComUtils.CONST_PROPERTY_PHONENUMBER -> JsString(phoneNumber.trim()))

      if(macAddress.trim().toLowerCase()!="")
        jsObj +=(ComUtils.CONST_PROPERTY_MACADDRESS -> ComUtils.getJsonArrayStr(List(macAddress.trim().toLowerCase())))
      else
        jsObj +=(ComUtils.CONST_PROPERTY_MACADDRESS -> ComUtils.getJsonArrayStr(List()))
      jsObj
    }
    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->credential.glanceOrgId,ComUtils.CONST_PROPERTY_ID ->expertId),
      Json.obj("$set" -> getUpdateJson())).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+credential.glanceOrgId+" expertId:"+expertId+" name:"+name)
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(ComUtils.getCredential())
        true
      case _ =>
        Logger.error("Failed to update(updateUserDeviceInfo): glanceOrgId"+credential.glanceOrgId+" expertId:"+expertId+" name:"+name)
        false
    }
  }

  def updateAsJsonValue(conf:JsValue):Future[Boolean] = {

    def getValueOf(jValue:JsValue,name:String, dValue:String):String = {
      val vRet =(conf \ name).asOpt[String].getOrElse(dValue)
      vRet
    }

    def checkValueExist(jValue:JsValue,name:String): Boolean =
    {
      !( (jValue \\ name)== Nil)
    }

    def copyNeedValues(z:JsValue):JsValue ={
      var jsObj = Json.obj()
      val names:List[String] =List( ComUtils.CONST_PROPERTY_NAME,
                                    ComUtils.CONST_PROPERTY_EMAIL,
                                    ComUtils.CONST_PROPERTY_PHONENUMBER,
                                    ComUtils.CONST_PROPERTY_TOPICS,
                                    ComUtils.CONST_PROPERTY_TITLE,
                                    ComUtils.CONST_PROPERTY_BIO,
                                    ComUtils.CONST_PROPERTY_MACADDRESS,
                                    "status",
                                    ComUtils.CONST_PROPERTY_TAGS,
                                    ComUtils.CONST_PROPERTY_PROPERTIES)
      for (name <- names) {
          if(checkValueExist(z,name)){
            if(name==ComUtils.CONST_PROPERTY_TOPICS)
              jsObj +=(name,Json.toJson( (z \ "topics").asOpt[List[String]].getOrElse((z \ "topics").asOpt[String].getOrElse("").split(",").toList)))
            else
            {
              if(name ==ComUtils.CONST_PROPERTY_MACADDRESS){
                val macList =((z \name).asOpt[List[String]].getOrElse(List((z \name).asOpt[String].getOrElse("").toLowerCase)))
                jsObj += (name,ComUtils.getJsonArrayStr(macList))
              }
              else
                jsObj += (name,(z \name))
            }
          }

      }
      if(checkValueExist(z,ComUtils.CONST_PROPERTY_TYPE))
        jsObj += (ComUtils.CONST_PROPERTY_TYPE,(z \ ComUtils.CONST_PROPERTY_TYPE))
      else if(checkValueExist(z,ComUtils.CONST_PROPERTY_CATEGORY))
      {
        jsObj += (ComUtils.CONST_PROPERTY_TYPE,(z \ ComUtils.CONST_PROPERTY_CATEGORY))
        jsObj += (ComUtils.CONST_PROPERTY_CATEGORY,(z \ ComUtils.CONST_PROPERTY_CATEGORY))
      }
      if(checkValueExist(z, "fixedLocation"))
        jsObj  += ("fixedLocation" ->  (z \ "fixedLocation"))

      if(checkValueExist(z, ComUtils.CONST_PROPERTY_POSITION))
        jsObj  += (ComUtils.CONST_PROPERTY_POSITION ->  (z \ ComUtils.CONST_PROPERTY_POSITION))

      jsObj +=(ComUtils.CONST_PROPERTY_UPDATED, Json.toJson(System.currentTimeMillis()))
      jsObj
    }

    collection.update(Json.obj( ComUtils.CONST_PROPERTY_GLANCEORGID ->getValueOf(conf,ComUtils.CONST_PROPERTY_GLANCEORGID,ComUtils.getTenantOrgId()),
                                ComUtils.CONST_PROPERTY_GLANCEUSERID -> getValueOf(conf,ComUtils.CONST_PROPERTY_GLANCEUSERID,""),
                                ComUtils.CONST_PROPERTY_ID ->getValueOf(conf,ComUtils.CONST_PROPERTY_ID,"")),
      Json.obj("$set" -> copyNeedValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update: glanceOrgId"+getValueOf(conf,"glanceOrgId","")+" glanceUserId:"+getValueOf(conf,"glanceUserId","")+" userId:"+getValueOf(conf,ComUtils.CONST_PROPERTY_ID,"")+" name:"+getValueOf(conf,"name","")+ " with email:"+getValueOf(conf,"email",""))
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(ComUtils.getCredential())
        true
      case _ =>
        Logger.error("Failed to update: glanceOrgId"+getValueOf(conf,"glanceOrgId","")+" glanceUserId:"+getValueOf(conf,"glanceUserId","")+" userId:"+getValueOf(conf,ComUtils.CONST_PROPERTY_ID,"")+" name:"+getValueOf(conf,"name","")+ " with email:"+getValueOf(conf,"email",""))
        false
    }
  }

  def updateProfileImageId(credential: GlanceCredential,update_expertId:String, fileImageId:String):Future[Boolean] ={
    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_GLANCEUSERID -> credential.glanceUserId,ComUtils.CONST_PROPERTY_ID ->update_expertId),
      Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_AVATAR -> fileImageId))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update ProfileImageId: glanceOrgId"+credential.glanceOrgId+" glanceUserId:"+credential.glanceUserId+" userId:"+update_expertId+" avatar:"+fileImageId)
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update ProfileImageId: glanceOrgId"+credential.glanceOrgId+" glanceUserId:"+credential.glanceUserId+" userId:"+update_expertId+" avatar:"+fileImageId)
        false
    }
  }

  def updateInfoFromConnect(conf:RegisteredUser,srcId:String=""):Future[Boolean]={
    def copySetValues(z:RegisteredUser):JsValue ={
      var jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      if(srcId!="")
      {
        jsObj += (ComUtils.CONST_PROPERTY_ID -> JsString(conf.id))
        jsObj += (ComUtils.CONST_PROPERTY_EMAIL -> JsString(conf.email))
        if(conf.phoneNumber!="")
          jsObj += (ComUtils.CONST_PROPERTY_PHONENUMBER -> JsString(conf.phoneNumber))
        jsObj += ("dataFrom" -> JsString(ComUtils.CMX_CONNECT_DATASOURCE))
      }
      Logger.debug("update the Registered User set data to:"+jsObj.toString())
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID ->conf.glanceOrgId,ComUtils.CONST_PROPERTY_ID -> {
      if(srcId=="")
        conf.id
      else
        srcId
    }),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to update connected registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        true
      case _ =>
        Logger.error("Failed to update connected registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        false
    }.recover{
      case _ =>
        Logger.error("Failed to tecover to update connected registeredUser: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" userId:"+conf.id+" name:"+conf.name+ " with email:"+conf.email)
        false
    }
  }

  def updateUsersByBatch(credential: GlanceCredential,existUsers:List[RegisteredUser],users:List[RegisteredUser],idReassigns:mutable.HashMap[String,String]):Future[(Boolean,Long)]={
    val completed=new java.util.concurrent.atomic.AtomicLong()
    val updatedCount=new java.util.concurrent.atomic.AtomicLong()
    def updateConnectUser(user:RegisteredUser,existUsers:List[RegisteredUser],idReassignMap:mutable.HashMap[String,String]):Future[Boolean]={
      val findUsers =existUsers.filter(p => p.id.compareToIgnoreCase(user.id)==0)
      val findUsersMac= existUsers.filter(p => {
          if(user.macAddress.length<=0)
            false
          else{
            var bRet:Boolean =false
            for(cl <-0 to user.macAddress.length-1){
              if(p.macAddress.contains(user.macAddress(cl))) {
                bRet = true
              }
            }
            bRet
          }
        }
      )

      val findIdReassignIds =idReassignMap.toList.filter(p => p._2.compareToIgnoreCase(user.id)==0).map(p => p._1.toLowerCase)
      val findReassginUsers =existUsers.filter(p => findIdReassignIds.contains(p.id.toLowerCase))
      for{
        bUpdate<-{
          if(findUsersMac.length>0){
            Future{true}
          }else if(findUsers.length>0)
          {
            updatedCount.incrementAndGet()
            updateInfoFromConnect(user)
          }else if(findReassginUsers.length>0){
            updateInfoFromConnect(user,findReassginUsers(0).id)
          }
          else
            Future{
              Logger.error("This should not be happened,update Registered User by Batch!")
              true
            }
        }
      }yield{
        bUpdate
      }
    }

    val p = Promise[List[Boolean]]
    val f = p.future
    val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    Future {
      for(user <- users){
        updateConnectUser(user,existUsers,idReassigns).map{ bRet =>
          results+=bRet
          val count = completed.incrementAndGet()
          if(count>=users.length)
            p.success(results.toList)
        }.recover{
          case _=>
            Logger.error("Failed to update connected user info into database,connected User Info:"+Json.toJson(user))
            results+=false
            val count =completed.incrementAndGet()
            if(count>=users.length)
              p.success(results.toList)
        }
      }
      if(users.length<=0)
        p.success(List(true)) //force to success.
    }

    f.map{results =>
      if(results.filter(p => p==true).length>0)
        (true,updatedCount.get())
      else
        (false,updatedCount.get())
    }.recover{
      case _=>
        Logger.error("Exception, failed to update connected user by batch.")
        (false,updatedCount.get())
    }

  }
  def insertUsersByBatch(credential: GlanceCredential,users:List[RegisteredUser]):Future[(Boolean,Int)]={
    if(users.length>0){
      val enumerator = Enumerator.enumerate(users)
      collection.bulkInsert(enumerator).map { nCount =>
        Logger.debug("Succeeded to insert new added connected users" + (new Date()).toString + " count:" + nCount)
        if (nCount > 0)
          (true,nCount)
        else
          (false,0)
      }.recover{
        case _=>
          Logger.error("Exception, failed to insert the connected users by batch")
          (false,0)
      }
    }else{
      Future(true,0)
    }
  }
  def connectedRecordToUser(record:ConnectedRecord,cred:GlanceCredential):RegisteredUser ={
    var (tid,_)=ComUtils.parseEmailAddress(record.Email)
    val name ={
      if(record.Name!="")
        record.Name
      else
        tid
    }
    if(tid =="")
      tid =name

    val topics:List[String]=List(record.device,record.Industry,record.language,record.companyName)
    val tags:List[String] =List(record.device,record.Industry,record.language,record.companyName,
      record.portal,record.portalType,record.locationSite,record.authType)
    val user = new RegisteredUser(glanceOrgId = cred.glanceOrgId,glanceUserId = cred.glanceUserId,
      id=tid,name =name,email =record.Email,topics=topics,
      title=record.companyName,macAddress=List(record.macAddress),
      category=ComUtils.SMART_DEVICE_TYPE_PERSON,
      tags=tags,
      dataFrom=ComUtils.CMX_CONNECT_DATASOURCE)
    user
  }

  def updateViaConnectedRecords(credential: GlanceCredential,records:List[ConnectedRecord]):Future[Boolean]={

    val connectedUsers =records.map(p => connectedRecordToUser(p,credential)).filter(p => p.id!="")
    if(connectedUsers.length<=0){
      Future{true}
    }else{
      for{
        sysConf <-GlanceSystemConf.readConf(credential)
        users <-readAllConf(credential)
        bReleasePrevBind <-{
            removeAllPrevBindViaConnectRecords(credential,users,records)
        }
        (newUsers,updateUsers,idReassigns) <- Future{
          //clc17photo is special case for CCLC17
          val guestesToMatchList =users.filter(p => p.id.toLowerCase.endsWith("clc17photo"))
          val userIds:List[String]=users.map(p =>p.id.toLowerCase())
          val userMACs:List[String]=users.map(p => p.macAddress).flatten.filter(p => p!="").distinct
          val idReassignMap:mutable.HashMap[String,String]=new mutable.HashMap[String,String]()
          val updated  ={
            connectedUsers.filter(p => {
              val lowercasePid=p.id.toLowerCase
              val bRes ={
                if(userIds.filter(pZ=> pZ==lowercasePid).length>0)
                  true
                else{
                  val matched =users.filter(pX => pX.macAddress.length>0).filter(pZ=> ComUtils.valueInValues(pZ.macAddress,p.macAddress))
                  if(matched.length>0){
                    if(matched(0).id.compareTo(p.id)!=0)
                      idReassignMap(matched(0).id)=p.id
                    true
                  }else
                    false
                }
              }
              val lowercaseName=p.name.toLowerCase
              if(guestesToMatchList.length>0){
                if(!bRes){
                  val firstLastNames = lowercaseName.split(" ").toList.filter(pX=> pX.trim!="").map(pY => pY.trim)
                  if(firstLastNames.length<=0)
                  {
                    ComUtils.outputErrorMsg("The connected user name is empty string, no predefined user matched!")
                    false
                  }
                  else{
                    val nameLen =firstLastNames.length
                    var nameMatched =guestesToMatchList.filter(pZ=> {
                      pZ.name.toLowerCase.contains(firstLastNames(0)) && pZ.name.toLowerCase.contains(firstLastNames(nameLen-1))
                    })
                    if(nameMatched.length==1){
                      //assign new ID
                      if(nameMatched(0).id.compareToIgnoreCase(p.id)!=0)
                        idReassignMap(nameMatched(0).id) = p.id
                      true
                    }else if(nameMatched.length==0)
                    {
                      //try fit first name...
                      nameMatched =guestesToMatchList.filter(pZ=> {
                        pZ.name.toLowerCase.contains(firstLastNames(0))
                      })
                      if(nameMatched.length==1){
                        //only one first name matched
                        ComUtils.outputErrorMsg("Only one person matched first name of:"+p.name+" to database name:"+nameMatched(0).name)
                        idReassignMap(nameMatched(0).id) = p.id
                        true
                      }else{
                        //try to match last name...
                        nameMatched =guestesToMatchList.filter(pZ=> {
                          pZ.name.toLowerCase.contains(firstLastNames(nameLen-1))
                        })
                        if(nameMatched.length==1){
                          //only one last name matched
                          ComUtils.outputErrorMsg("Only one person matched first name of:"+p.name+" to database name:"+nameMatched(0).name)
                          idReassignMap(nameMatched(0).id) = p.id
                          true
                        }else{
                          //too many match or no one matched...
                          false
                        }
                      }
                    }else{
                      //too many user matched...
                      Logger.error("Sorry, too many people matched first name:"+firstLastNames(0)+" last name:"+firstLastNames(nameLen-1))
                      false
                    }
                  }
                }
              }
              bRes
            }).filter(p => p.id!="")
          }
          val newAdded ={
            val added =connectedUsers.filter(p => !userIds.contains(p.id.toLowerCase) && !ComUtils.valueInValues(userMACs,p.macAddress)).filter(p=> p.id!="")
            val updateIds =updated.map(p => p.id)
            added.filter(p => !updateIds.contains(p.id))
          }

          (newAdded,updated,idReassignMap)
        }
        (bUpdateNewAdded,nInsert) <- insertUsersByBatch(credential,newUsers)
        (bUpdates,nUpdated)<- updateUsersByBatch(credential,users,updateUsers,idReassigns)
      }yield {
        if(nInsert>0 || nUpdated>0){
          GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null)
          sendCacheSyncMessage(ComUtils.getCredential())
          GlanceWebSocketActor.updateAllRegister(true) //fixme
          GlanceWebSocketActor.listenNotificationForAllFloors(ComUtils.getCredential())
        }
        bUpdateNewAdded || bUpdates
      }
    }
  }

  def delete(credential: GlanceCredential, expert_id:String): Future[Boolean] = {
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_ID-> expert_id)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: "+credential.glanceOrgId +" id:"+expert_id)
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete user, orgId:{}, id:{}",credential.glanceOrgId,expert_id)
        false
    }.recover{
      case _ =>
        Logger.error("Exception, failed to delete user, orgId:{}, id:{}",credential.glanceOrgId,expert_id)
        false
    }
  }

  def deleteAll(credential: GlanceCredential):Future[Boolean]={
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: "+credential.glanceOrgId)
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean cache when data is updated...
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to delete all registered users: "+credential.glanceOrgId)
        false
    }.recover{
      case _ =>
        Logger.error("Exception, failed to delete all registered users: "+credential.glanceOrgId)
        false
    }
  }

  def readAllConf(credentialX: GlanceCredential):Future[List[RegisteredUser]] ={
    def readAllConfFromDB(credential: GlanceCredential,bReadGlanceImportOnly:Boolean=false):Future[List[RegisteredUser]]={
      val findByOrgUserId  = (org: String) => {
        if(bReadGlanceImportOnly==true)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"-> ComUtils.DEFAULT_DATASOURCE)).sort(Json.obj("name" -> 1)).cursor[RegisteredUser].collect[List]()
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org)).sort(Json.obj("name" -> 1)).cursor[RegisteredUser].collect[List]()
      };
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      if(optCacheUsers.isDefined) {
        Future {
          Logger.debug("RegisteredUser.readAllConf using cached data!")
          optCacheUsers.get
        }
      }else{
        findByOrgUserId(credential.glanceOrgId).map{ listObject =>
          GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,listObject)
          listObject
        }.recover{
          case _ =>
            Logger.error("Exception, registeredUser.readAllConf.")
            GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,List())
            List()
        }
      }
    }

    for{
      sysConf <-GlanceSystemConf.readConf(credentialX)
      glanceImportUsers <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readAllConfFromDB(credentialX, true)
        }else
          Future{List()}
      }
      users <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          val allList =ComUtils.distinctBy(glanceImportUsers ::: list.filter(p => p.id!="" && p.macAddress!=""))(_.macAddress)
          Future{allList}
        }else
          readAllConfFromDB(credentialX)
      }
    }yield{
      users
    }
  }

  def readConnectedRecordFromCache():List[RegisteredUser]={
    val optList =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS)
    val list = {
      if (optList.isDefined)
        optList.get
      else
        List()
    }
    list
  }

  def readISESupportedUsersCount(credential: GlanceCredential):Future[Int]={
    readAllConf(credential).map{users =>
      users.filter( p => p.supportISE!=0).length
    }
  }

  def readTrackedMacAddress(credentialX: GlanceCredential):Future[List[String]] ={
    def readFromRegisteredDB(cred: GlanceCredential,bReadGlanceImportedOnly:Boolean=false):Future[List[String]]={
      val filter = BSONDocument(
        ComUtils.CONST_PROPERTY_MACADDRESS -> 1,
        ComUtils.CONST_PROPERTY_DBID -> 0)
      val findByOrgUserId  = (org: String) => {
        if(bReadGlanceImportedOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"-> ComUtils.DEFAULT_DATASOURCE,ComUtils.CONST_PROPERTY_MACADDRESS->Json.obj("$ne" ->"")),filter).cursor[BSONDocument].collect[List]();
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_MACADDRESS->Json.obj("$ne" ->"")),filter).cursor[BSONDocument].collect[List]();
      }

      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      if(optCacheUsers.isDefined) {
        val users = optCacheUsers.get
        Future {
          val list = users.map((f: RegisteredUser) => f.macAddress).flatten
          list.filter(x => x != "")
        }
      }else{
        findByOrgUserId(cred.glanceOrgId).map{ listObject =>
          val list =listObject.map(_.getAs[List[String]](ComUtils.CONST_PROPERTY_MACADDRESS).get).flatten
          list.filter(x => x != "")
        }.recover{
          case _ =>
            List()
        }
      }
    }
    for{
      sysConf <-GlanceSystemConf.readConf(credentialX)
      glanceImportList <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readFromRegisteredDB(credentialX,true)
        }else {
          Future{List()}
        }
      }
      macList <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          Future{(list.map(p => p.macAddress).flatten ::: glanceImportList).distinct}
        }else{
          readFromRegisteredDB(credentialX)
        }
      }
    }yield{
      macList
    }
  }

  def readAllActive(credentialX: GlanceCredential):Future[List[RegisteredUser]] ={
    def readAllActiveFromDB(credential: GlanceCredential,bGlanceImportOnly:Boolean=false):Future[List[RegisteredUser]] = {
      val findByOrgUserId  = (org: String) => {
        if(bGlanceImportOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"-> ComUtils.DEFAULT_DATASOURCE/*,ComUtils.CONST_PROPERTY_MACADDRESS ->Json.obj("$ne" -> "")*/)).sort(Json.obj("name" -> 1)).cursor[RegisteredUser].collect[List]();
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org/*,ComUtils.CONST_PROPERTY_MACADDRESS ->Json.obj("$ne" -> "")*/)).sort(Json.obj("name" -> 1)).cursor[RegisteredUser].collect[List]();
      }
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      if(optCacheUsers.isDefined) {
        val users = optCacheUsers.get
        Future {
          users.filter(x => x.macAddress != "")
        }
      }else{
        findByOrgUserId(credential.glanceOrgId).map{ listObject =>
          GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,listObject)
          listObject.filter(x => x.macAddress!="")
        }.recover{
          case _ =>
            List()
        }
      }
    }
    for{
      sysConf<-GlanceSystemConf.readConf(credentialX)
      glanceImportUsers <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readAllActiveFromDB(credentialX,true)
        }else{
          Future{List()}
        }
      }
      users <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          val allList=list.filter(p => p.id!="" && p.macAddress!="")
          Future{ ComUtils.distinctBy(glanceImportUsers:::allList)(_.macAddress)}
        }else
          readAllActiveFromDB(credentialX)
      }
    }yield{
      users
    }

  }

  def readAllActiveByType(credentialX: GlanceCredential,typeStringX: String):Future[List[RegisteredUser]] ={
    def readAllActiveByTypeFromDB(credential: GlanceCredential,typeString: String,bGlanceImportedOnly:Boolean=false):Future[List[RegisteredUser]] = {
      val findByOrgUserId = (org: String) => {
        if(bGlanceImportedOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_TYPE -> typeString,"dataFrom" -> ComUtils.DEFAULT_DATASOURCE)).sort(Json.obj(ComUtils.CONST_PROPERTY_NAME -> 1)).cursor[RegisteredUser].collect[List]()
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_TYPE -> typeString)).sort(Json.obj(ComUtils.CONST_PROPERTY_NAME -> 1)).cursor[RegisteredUser].collect[List]()
      }
      val optCacheUsers = GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      optCacheUsers match {
        case Some(users) =>
          Future {
            users.filter(x => x.category == typeString)
          }
        case None =>
          findByOrgUserId(credential.glanceOrgId).map { listObject =>
            GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,listObject)
            listObject.filter(x => x.category == typeString)
          }.recover {
            case _ =>
              List()
          }
      }
    }
    for{
      sysConf <- GlanceSystemConf.readConf(credentialX)
      glanceImportUsers <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          readAllActiveByTypeFromDB(credentialX,typeStringX,true)
        }else{
          Future{List()}
        }
      }
      users <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          val allList =list.filter(p => p.category==typeStringX)
          Future{ComUtils.distinctBy(glanceImportUsers:::allList)(_.macAddress)}
        }else{
          readAllActiveByTypeFromDB(credentialX,typeStringX)
        }
      }
    }yield{
      users
    }
    //futureConf
  }

  def readUserByUserId(credentialX: GlanceCredential,userIdX:String):Future[Option[RegisteredUser]] ={

    def readUserByUserIdFromRegisterDB(credential: GlanceCredential,userId:String,bGlanceImportOnly:Boolean=false):Future[Option[RegisteredUser]]={
      val findByName  = (org: String,uid:String) => {
        if(bGlanceImportOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_ID -> uid,"dataFrom"-> ComUtils.DEFAULT_DATASOURCE)).one[RegisteredUser]
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_ID -> uid)).one[RegisteredUser]
      };
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      def readByName(org:String,uid:String):Future[Option[RegisteredUser]]={
        findByName(org,uid).map{ info =>
          info
        }.recover{
          case _=>
            Logger.error("Failed to read user by user id.")
            None
        }
      }
      if(optCacheUsers.isDefined) {
        val users = optCacheUsers.get
        val list = users.filter(x => x.id == userId)
        if (list.size > 0)
          Future {Some(list(0))}
        else
          readByName(credential.glanceOrgId, userId)
      }else{
        readByName(credential.glanceOrgId,userId)
      }
    }

    for{
      sysConf <- GlanceSystemConf.readConf(credentialX)
      optGlanceImportedUser <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readUserByUserIdFromRegisterDB(credentialX,userIdX,true)
        }else
          Future{None}
      }
      optUser <-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          if(optGlanceImportedUser.isDefined){
            Future{optGlanceImportedUser}
          }else{
            val list =readConnectedRecordFromCache()
            val listMatch =list.filter(p =>
              if(p.id.compareToIgnoreCase(userIdX)==0)
                true
              else
                false
            ).filter(p=> p.id!="")

            if(listMatch.length>0)
              Future{Some(listMatch(0))}
            else
              Future{None}
          }
        }
        else
          readUserByUserIdFromRegisterDB(credentialX,userIdX)
      }
    }yield{
      optUser
    }
  }

  def readUserByName(credentialX: GlanceCredential,userNameX:String):Future[List[RegisteredUser]] ={
    def readUserByNameFromDB(credential: GlanceCredential,userName:String,bGlanceImportOnly:Boolean=false):Future[List[RegisteredUser]]={
      val findByName  = (org: String,uName:String) => {
        if(bGlanceImportOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"-> ComUtils.DEFAULT_DATASOURCE,ComUtils.CONST_PROPERTY_NAME -> Json.obj("$regex" -> ("^"+uName+"$"),"$options" ->"i"))).cursor[RegisteredUser].collect[List]()
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_NAME -> Json.obj("$regex" -> ("^"+uName+"$"),"$options" ->"i"))).cursor[RegisteredUser].collect[List]()
      };
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      def readByName(org:String,uid:String):Future[List[RegisteredUser]]={
        findByName(org,uid).map{ info =>
          info
        }.recover{
          case _=>
            Logger.error("Failed to read users by name.")
            List()
        }
      }
      if (optCacheUsers.isDefined) {
        val users =optCacheUsers.get
        val list = users.filter(x => x.name.compareToIgnoreCase(userName) == 0)
        if (list.size > 0)
          Future {list}
        else
          readByName(credential.glanceOrgId, userName)
      }else{
        readByName(credential.glanceOrgId,userName)
      }
    }
    for{
      sysConf <-GlanceSystemConf.readConf(credentialX)
      glanceImportedUsers<-{
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readUserByNameFromDB(credentialX,userNameX,true)
        }else{
          Future{List()}
        }
      }
      users <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          val listMatch =list.filter(p => (p.name.compareToIgnoreCase(userNameX)==0)).filter(p=> p.id!="")
          if(listMatch.length>0)
            Future{ComUtils.distinctBy(glanceImportedUsers:::listMatch)(_.macAddress)}
          else
            Future{glanceImportedUsers}
        }
        else
          readUserByNameFromDB(credentialX,userNameX)
      }
    }yield{
      users
    }
  }

  def readUserByLike(credentialX: GlanceCredential,userNameX:String):Future[List[RegisteredUser]] ={

    def readUserByLikeFromDB(credential: GlanceCredential,userName:String,bGlanceImportOnly:Boolean=false):Future[List[RegisteredUser]]={
      val findByName  = (org: String,uName:String) => {
        if(bGlanceImportOnly)
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"->ComUtils.DEFAULT_DATASOURCE,ComUtils.CONST_PROPERTY_NAME -> Json.obj("$regex" -> uName,"$options" ->"i"))).cursor[RegisteredUser].collect[List]()
        else
          collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_NAME -> Json.obj("$regex" -> uName,"$options" ->"i"))).cursor[RegisteredUser].collect[List]()
      };
      val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      def readByName(org:String,uid:String):Future[List[RegisteredUser]]={
        findByName(org,uid).map{ info =>
          info
        }.recover{
          case _=>
            Logger.error("Exception, failed to read registered users by name.")
            List()
        }
      }
      if(optCacheUsers.isDefined) {
        val users = optCacheUsers.get
        val list = users.filter(x => x.name.toLowerCase.contains(userName.toLowerCase) == 0)
        if (list.size > 0)
          Future {list}
        else
          readByName(credential.glanceOrgId, userName)
      }else{
        readByName(credential.glanceOrgId,userName)
      }
    }

    for{
      sysConf<- GlanceSystemConf.readConf(credentialX)
      glanceImportedUsers <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
          readUserByLikeFromDB(credentialX,userNameX,true)
        }else{
          Future{List()}
        }
      }
      users <- {
        if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
          val list =readConnectedRecordFromCache()
          val listMatch =list.filter(p => (p.name.compareToIgnoreCase(userNameX)==0)).filter(p=> p.id!="")
          if(listMatch.length>0)
            Future{ ComUtils.distinctBy(glanceImportedUsers:::listMatch)(_.macAddress)}
          else
            Future{glanceImportedUsers}
        }else{
          readUserByLikeFromDB(credentialX,userNameX)
        }
      }
    }yield{
      users
    }
  }

  def readAllRegisteredUsersByMac(credentialX: GlanceCredential,macAddressList:List[String]):Future[List[RegisteredUser]] ={
    if(macAddressList.length<=0)
    {
      Future{List()}
    }else{
      def readRegisteredUserByMacFromDB(credential: GlanceCredential,macAddressList:List[String],bGlanceImportOnly:Boolean=false):Future[List[RegisteredUser]]={
        def readByMac(org:String,macs:List[String]):Future[List[RegisteredUser]]={
          val findByName  = (org: String,macs:List[String]) => {
            if(bGlanceImportOnly)
              collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"->ComUtils.DEFAULT_DATASOURCE,ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" ->macs))).cursor[RegisteredUser].collect[List]()
            else
              collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" ->macs))).cursor[RegisteredUser].collect[List]()
          };
          findByName(credential.glanceOrgId,macAddressList).map{ info =>
            info
          }.recover{
            case _ =>
              List()
          }
        }
        val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
        if(optCacheUsers.isDefined) {
          val users = optCacheUsers.get
          val list = users.filter(x => ComUtils.valueInValues(x.macAddress, macAddressList))
          if (list.size > 0)
            Future {list}
          else
            readByMac(credential.glanceOrgId, macAddressList)
        }else{
          readByMac(credential.glanceOrgId,macAddressList)
        }
      }
      for{
        sysConf <-GlanceSystemConf.readConf(credentialX)
        glanceImportUsers <-{
          if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
            readRegisteredUserByMacFromDB(credentialX,macAddressList,true)
          }else{
            Future{List()}
          }
        }
        optUser <-{
          if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
            if(glanceImportUsers.length>0){
              Future{glanceImportUsers}
            }else{
              val list =readConnectedRecordFromCache()
              val listMatch =list.filter(p =>(ComUtils.valueInValues(p.macAddress,macAddressList)==0)).filter(p=> p.id!="")
              if(listMatch.length>0)
                Future{listMatch}
              else
                Future{List()}
            }
          }else
            readRegisteredUserByMacFromDB(credentialX,macAddressList)
        }
      }yield {
        optUser
      }
    }
  }

  def readRegisteredUserByMac(credentialX: GlanceCredential,macAddressX:String):Future[Option[RegisteredUser]] ={
    if(macAddressX==null ||  macAddressX.compareToIgnoreCase("")==0)
    {
      Future{None}
    }else{
      def readRegisteredUserByMacFromDB(credential: GlanceCredential,macAddress:String,bGlanceImportOnly:Boolean=false):Future[Option[RegisteredUser]]={
        def readByMac(org:String,mac:String):Future[Option[RegisteredUser]]={
          val findByName  = (org: String,mac:String) => {
            if(bGlanceImportOnly)
              collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,"dataFrom"->ComUtils.DEFAULT_DATASOURCE,ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" ->List(mac)))).one[RegisteredUser]
            else
              collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_MACADDRESS -> Json.obj("$in" ->List(mac)))).one[RegisteredUser]
          };
          findByName(credential.glanceOrgId,macAddress).map{ info =>
            info
          }.recover{
            case _ =>
              None
          }
        }
        val optCacheUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
        if(optCacheUsers.isDefined) {
          val users = optCacheUsers.get
          val list = users.filter(x => ComUtils.valueInValues(x.macAddress, List(macAddress)) == 0)
          if (list.size > 0)
            Future {Some(list(0))}
          else
            readByMac(credential.glanceOrgId, macAddress)
        }else{
          readByMac(credential.glanceOrgId,macAddress)
        }
      }
      for{
        sysConf <-GlanceSystemConf.readConf(credentialX)
        optGlanceImportUser <-{
          if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData) {
            readRegisteredUserByMacFromDB(credentialX,macAddressX,true)
          }else{
            Future{None}
          }
        }
        optUser <-{
          if(sysConf.userDataImportSupported && sysConf.usingInMemoryImportedUserData){
            if(optGlanceImportUser.isDefined){
              Future{optGlanceImportUser}
            }else{
              val list =readConnectedRecordFromCache()
              val listMatch =list.filter(p =>(ComUtils.valueInValues(p.macAddress,List(macAddressX))==0)).filter(p=> p.id!="")
              if(listMatch.length>0)
                Future{Some(listMatch(0))}
              else
                Future{None}
            }
          }else
            readRegisteredUserByMacFromDB(credentialX,macAddressX)
        }
      }yield {
        optUser
      }
    }
  }

  def updateMacAddress(credential:GlanceCredential,expertId:String,macAddressTo:String) :Future[Boolean] ={

    updateMacAddress(credential,expertId,{
      if(macAddressTo=="")
        List()
      else
        List(macAddressTo)
    }, !(macAddressTo=="")).map{ bRet =>
      if(bRet){
        GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null) //clean the cache...
        sendCacheSyncMessage(credential)
        GlanceWebSocketActor.updateAllRegister(true)
      }
      bRet
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
      optUser <- {
        if(bRet)
          readUserByUserId(credential,expertId)
        else
          Future{None}
      }
    } yield {
      if(bRet) {
        if (optUser.isDefined){
          GlanceWebSocketActor.listenNotificationForAllFloors(credential)
          GlanceWebSocketActor.checkOutUser(optUser.get)
        }
      }
      bRet
    }

  }

  def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 2*60*1000) : WSRequestHolder = {
    Logger.debug("URI:"+s"$baseUri$api")
    val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
    if(json) holder.withHeaders("Accept" -> "application/json")
    else holder
  }

  def getClientPosition(cmxConf:GlanceSystemConf,ipAddress:String):Future[Option[JsValue]]={
    if(cmxConf.glanceCmxSetting.cmxHost=="")
    {
      Future{None}
    }else{
      getIPMacInfo(cmxConf,ipAddress).map{ optWirelessInfo =>
        optWirelessInfo
      }.recover{
        case _ =>
          None
      }
    }
  }

  def getClientPosition(cmxConf:GlanceSystemConf,credential:GlanceCredential,ipAddress:String):Future[Option[JsValue]]={
    for{
      optLocalCachedPosition <-GlanceAssociationIPMacAddress.readClientPosition(credential,ipAddress)
      optPosition <-{
        if(optLocalCachedPosition.isDefined)
          Future{optLocalCachedPosition}
        else
          getClientPosition(cmxConf,ipAddress)
      }
    }yield{
      optPosition
    }
  }
  
  def getMacAddress(cmxConf:GlanceSystemConf,ipAddress:String):Future[String]={

    def getMacInfo(cmxConf:GlanceSystemConf, optWirelessClientLocation:Option[JsValue]):String={
      if(optWirelessClientLocation.isDefined) {
        val wirelessClientInfo = optWirelessClientLocation.get
        if (ComUtils.isCMX8(cmxConf.glanceCmxSetting.cmxVersion)) {
          try {
            val wireClientLocation: JsObject = (wirelessClientInfo \ "WirelessClientLocation").as[JsObject]
            val macAddressIn: String = (wireClientLocation \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String]
            val ipAddressList: List[String] = (wireClientLocation \ ComUtils.CONST_PROPERTY_IPADDRESS).as[List[String]]
            macAddressIn.toLowerCase
          } catch {
            case e: JsResultException =>
              Logger.error("Exception when read wireClientLocation:{}", e.getMessage)
              ""
            case exp: Throwable =>
              Logger.error("Exception when read wireClientLocation:{}", exp.getMessage)
              ""
          }
        } else {
          val listValues = wirelessClientInfo.as[List[JsValue]]
          if (listValues.length > 0) {
            try {
              val clientInfo = listValues(0)
              val macAddressIn: String = (clientInfo \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String]
              //val ipAddressList: List[String] = (clientInfo \ ComUtils.CONST_PROPERTY_IPADDRESS).as[List[String]]
              macAddressIn.toLowerCase
            } catch {
              case e: JsResultException =>
                Logger.error("Exception when read wireClientLocation:{}", e.getMessage)
                ""
              case exp: Throwable =>
                Logger.error("Exception when read wireClientLocation:{}", exp.getMessage)
                ""
            }
          } else {
            ""
          }
        }
      } else{
        Logger.error("Failed to read wireClientLocation")
        ""
      }
    }

    if(cmxConf.glanceCmxSetting.cmxHost=="")
    {
      Future{""}
    }else{
      getIPMacInfo(cmxConf,ipAddress).map{ optWirelessInfo =>
        getMacInfo(cmxConf,optWirelessInfo)
      }.recover{
        case _ =>
          Logger.error("Exception, failed to read wireClientLocation")
          ""
      }
    }
  }
  def getMacAddress(cmxConf:GlanceSystemConf,credential:GlanceCredential,ipAddress:String):Future[String]={
    for{
      optAssIPMapping <- GlanceAssociationIPMacAddress.readMacAddressByIP(credential,ipAddress)
      macAddress <-{
        if(optAssIPMapping.isDefined)
          Future{optAssIPMapping.get.macAddress}
        else
          getMacAddress(cmxConf,ipAddress)
      }
    }yield{
      macAddress
    }
  }

  def getIPMacInfo(cmxConf:GlanceSystemConf,ipAddress:String):Future[Option[JsValue]] ={
    var urlParameters =""
    if(ComUtils.isCMX8(cmxConf.glanceCmxSetting.cmxVersion)){
      urlParameters ="/"+ipAddress
    }else{
      urlParameters ="?ipAddress="+ipAddress
    }
    val holder: WSRequestHolder = createRequest(cmxConf,ComUtils.getBaseUri(cmxConf),cmxConf.glanceCmxSetting.cmxClientPath+urlParameters)
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.debug("Get mac Address success:"+response.json.toString());
          Some(response.json)
        case _ =>
          Logger.error("Get mac Address failed")
          None
      }
    }
    holder.get().map(response).recover{
      case _ =>
        Logger.error("Get mac Address failed")
        None
    }
  }

  def checkIn(credential:GlanceCredential,expertId:String,ipAddress:String) :Future[Boolean] ={

    def getIPV4Address(addressList:List[String]):String = {
      for(address <-addressList){
        if(address.contains('.'))
          return address
      }
      return ""
    }

    def parseWireClientInfo(cmxConf:GlanceSystemConf, optWirelessClientLocation:Option[JsValue]):Future[Option[GlanceAssociationIPMacAddress]]=Future{
      optWirelessClientLocation match {
        case Some(wirelessClientInfo) =>
          if(ComUtils.isCMX8(cmxConf.glanceCmxSetting.cmxVersion)){
            try {
              val wireClientLocation:JsObject = (wirelessClientInfo \ "WirelessClientLocation").as[JsObject]
              val macAddressIn:String = (wireClientLocation \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String].toLowerCase
              val statisticsInfo =(wireClientLocation \ "Statistics").as[JsObject]
              val lastSeen =(statisticsInfo \ "lastLocatedTime").as[String]
              Logger.debug("parseWireClientInfo lastSeen:"+ComUtils.parseCMXDate(lastSeen).toString())

              Some(new GlanceAssociationIPMacAddress( glanceOrgId="",glanceUserId="",
                                                      ipAddress=ComUtils.getIPV4(wireClientLocation),
                                                      ipAddressV6 = ComUtils.getIPV6(wireClientLocation),
                                                      macAddress=macAddressIn,
                                                      lastSeen=ComUtils.parseCMXDate(lastSeen).getTime()))
            }catch {
              case e: JsResultException =>
                Logger.error("Exception when read wireClientLocation:{}",e.getMessage)
                None
              case exp:Throwable =>
                Logger.error("exception when read wireClientLocation:{}",exp.getMessage)
                None
            }
          }else {
            Logger.debug("CMX Version 10.... !")
            val listValues = wirelessClientInfo.as[List[JsValue]]
            if (listValues.length > 0) {
              try {
                val clientInfo = listValues(0)
                val macAddressIn: String = (clientInfo \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String].toLowerCase
                val statisticsInfo = (clientInfo \ "statistics").as[JsObject]
                val lastSeen = (statisticsInfo \ "lastLocatedTime").as[String]
                Logger.debug("parseWireClientInfo lastSeen:" + ComUtils.parseCMXDate(lastSeen).toString())

                Some(new GlanceAssociationIPMacAddress(glanceOrgId = "", glanceUserId = "",
                  ipAddress = ComUtils.getIPV4(clientInfo),
                  ipAddressV6 = ComUtils.getIPV6(clientInfo),
                  macAddress = macAddressIn,
                  lastSeen = ComUtils.parseCMXDate(lastSeen).getTime()))
              }catch {
                case e: JsResultException =>
                  Logger.error("Exception when read wireClientLocation:{}",e.getMessage)
                  None
                case exp:Throwable=>
                  Logger.error("Exception when read wireClientLocation:{}",exp.getMessage)
                  None
              }
            }else{
              None
            }
          }
        case _ =>
          None
      }
    }

    def updateCheckInInfo(credential: GlanceCredential,expertId:String,optGlanceIPMacAddress:Option[GlanceAssociationIPMacAddress]):Future[Boolean] ={

      if(optGlanceIPMacAddress.isDefined) {
        val glanceIPMacAddress =optGlanceIPMacAddress.get
          Logger.debug("Check-in IP Mac Address:" + Json.toJson(glanceIPMacAddress).toString())
          updateMacAddress(credential, expertId, glanceIPMacAddress.macAddress.toLowerCase).map { bRet =>
            bRet
          }.recover {
            case _ =>
              false
          }
      } else{
        Future{false}
      }
    }

    for{
      cmxConf <- GlanceSystemConf.readConf(credential)
      buildings <-GlanceTrackBuilding.readAll(credential)
      optAssIPMacAddress <- GlanceAssociationIPMacAddress.readMacAddressByIP(credential,ipAddress)
      optWirelessClientLocation <- {
        if(!optAssIPMacAddress.isDefined)
          getIPMacInfo(cmxConf,ipAddress)
        else
          Future{None}
      }
      optGlanceIPMacAddress <- {
        if(optAssIPMacAddress.isDefined)
          Future{optAssIPMacAddress}
        else
          parseWireClientInfo(cmxConf,optWirelessClientLocation)
      }
      bRet <- updateCheckInInfo(credential,expertId,optGlanceIPMacAddress)
      optFindUser <- {
        if(!bRet)
          Future{None}
        else
          readUserByUserId(credential,expertId)
      }
    } yield  {
      if(bRet){
        if(optFindUser.isDefined)
        {
          GlanceWebSocketActor.addExpertToActive(optFindUser.get,optFindUser.get.position.floorId)
          GlanceWebSocketActor.removeGuestByMacAddress(optGlanceIPMacAddress.get.macAddress)
        }
        GlanceWebSocketActor.listenNotificationForAllFloors(credential)
        NotificationService.handleClientPositionSnapshot(credential,ipAddress,optGlanceIPMacAddress.get.macAddress)
      }
      bRet
    }

  }

  val glanceUserImportActor = ComUtils.system.actorOf(Props(new GlanceUserImportActor))
  def ImportUser(user:RegisteredUser,photoUrl:String="",pos:GlancePosition,actor:ActorRef):Unit={
    Logger.debug("glanceUserImportActor call ImportUser:{}, photoUrl: {}, pos:{}",Json.toJson(user).toString(),photoUrl,Json.toJson(pos).toString())
    glanceUserImportActor ! (user,photoUrl,pos,actor)
  }

  //Add user(import) async
  class GlanceUserImportActor extends Actor {
    def receive = {
      case (user:RegisteredUser,photoUrl:String, pos:GlancePosition,glanceWebOpActor:ActorRef) =>
        for{
          floor <- {
            if(pos.floorId!="")
               GlanceTrackFloor.readFloorInfoByIdOrName(ComUtils.getCredential().glanceOrgId,pos.floorId)
            else
              Future{null}
          }
          sysConf <- GlanceSystemConf.readConf(ComUtils.getCredential())
          buildings <- GlanceTrackBuilding.readAll(ComUtils.getCredential())
          floors <- GlanceTrackCampus.readDefaultCampusFloors(ComUtils.getCredential())
          mapSizes <-GlanceMapSizeInfo.readAllConf(ComUtils.getCredential())
          fileIdFromUrl <- RegisteredUser.downloadPhotoPicture(user.id,photoUrl)
          fileId <-{
            if(fileIdFromUrl!="" || user.supportISE != 1)
              Future{fileIdFromUrl}
            else{
              val tmpPhotoUrl:String = String.format(sysConf.ldapSetting.photoUrl,user.id)
              RegisteredUser.downloadPhotoPicture(user.id,tmpPhotoUrl)
            }
          }
          //remove previous bind device id users..
          bRemovePrevBindDeviceUsers <- RegisteredUser.removeDeviceIdFromPreviousOwner(ComUtils.getCredential(),user)
          (bRet,addedUser) <- {
            val tmpPos:GlancePosition ={
              def getAdjustPos(pos:GlancePosition,floor:GlanceTrackFloor):GlancePosition={
                if(floor==null)
                  pos
                else{
                  val mapC =MapCoordinate(pos.x.toDouble,pos.y.toDouble)
                  val (_,posArr)=NotificationService.getPositionArr(mapC,floor,null,mapSizes)
                  pos.copy(x =posArr(0),y=posArr(1))
                }
              }
              if(floor!=null) {
                val bid =GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,floor.floorId)
                getAdjustPos(pos.copy(floorId = floor.floorId,mapHierarchy=floor.hierarchy,buildingId =bid),floor)
              }
              else{
                if(floors.length>0) {
                  val bid =GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,floors(0).floorId)
                  getAdjustPos(pos.copy(floorId = floors(0).floorId,mapHierarchy=floors(0).hierarchy,buildingId = bid),floors(0))
                }else
                  pos.copy(floorId ="")
              }
            }
            val fixedLocation:Boolean =(tmpPos.x>0 && tmpPos.y>0 && ComUtils.isDevice(user.category)) //only device and asset can be fixed location...
            var tmpAddUser:RegisteredUser =user
            if(fileId !="")
              tmpAddUser =user.copy(avatar = fileId,fixedLocation=fixedLocation,position = tmpPos)
            else
              tmpAddUser =user.copy(fixedLocation=fixedLocation,position = tmpPos)
            Logger.debug("Import user Actor call RegisteredUser.addOrUpdate:"+Json.toJson(tmpAddUser).toString())
            RegisteredUser.addOrUpdate(tmpAddUser,true).map{ bAdded =>
              Logger.debug("Succeeded to add/update user import data:"+Json.toJson(tmpAddUser).toString())
              (bAdded,tmpAddUser)
            }.recover{
              case _ =>
                Logger.error("Failed to add/update user import data:"+Json.toJson(tmpAddUser).toString())
                (false,tmpAddUser)
            }
          }
          bFixedLocationAssetNotify <-  Future{
            if(bRet){
              glanceWebOpActor ! addedUser
              true
            }else
              false
          }
        }yield{
          if(bRet)
            Logger.debug("Add Import user successfully:{}",user.id)
          else
            Logger.error("Add Import user failed:{}",user.id)
        }

      case _ =>
        Logger.error("Unknown User Import Message Received!")
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[RegisteredUser]](CACHE_NAME,null)
  }

  def updateRegisterUserCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={
    def readAndSet():Future[Boolean]={
      GlanceWebSocketActor.updateAllNActiveExpert(credential)
    }
    if(bCheckExists){
      val optUsers =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](CACHE_NAME)
      if(optUsers.isDefined) {
        Future {true}
      }else{
        readAndSet
      }
    }else{
      readAndSet
    }
  }

  def downloadPhotoPicture(expertId:String,photoUrl:String):Future[String]={

    def createRequest(fileUrl:String,timeout: Int = 2*60*1000) : WSRequestHolder = {
      Logger.debug("downloadPhotoPicture:"+fileUrl)
      val holder = WS.url(fileUrl).withRequestTimeout(timeout)
      holder
    }
    def isValidUrl(photoUrl:String):Boolean={
      try{
        val url =new URL(photoUrl)
        Logger.debug("photo url protocol:"+url.getProtocol)
        (url.getProtocol!=null && url.getProtocol.compareToIgnoreCase("http")==0 || url.getProtocol.compareToIgnoreCase("https")==0)
      }catch {
        case exp:Throwable =>
          Logger.error("Invalid photo Url:{},exception:{}",photoUrl,exp.getMessage)
          false
      }
    }
    if(isValidUrl(photoUrl)==false){
      Future{""}
    }else{
      val request =createRequest(photoUrl)
      for{
        response: (WSResponseHeaders, Enumerator[Array[Byte]]) <- request.getStream()
        file <-{
          if(response._1.status==200){
            val ct = response._1.headers.getOrElse("Content-Type", Seq("application/octect-stream"))
            val fileToSave = DefaultFileToSave(expertId+".jpg", Some(ct.head))
            Avatar.gridFS.save(response._2, fileToSave)
          }else{
            Future{null}
          }
        }
      }yield {
        if(file ==null)
          ""
        else
          file.id.asInstanceOf[BSONObjectID].stringify
      }
    }
  }

  val randomX = scala.util.Random
  val cmxConnectVisitorDBImportActor = SchedulingService.schedule(classOf[GlanceConnectImportActor], "GlanceConnectImportActor", (randomX.nextLong() % 1000) milliseconds, (30 +randomX.nextInt(5)) seconds, "!")

  def updateCMXConnectImportConfig(credential: GlanceCredential,sysConf:GlanceSystemConf):Unit={
    if(!(credential==null|| sysConf==null))
      cmxConnectVisitorDBImportActor !(credential, sysConf)
    else
      cmxConnectVisitorDBImportActor ! ComUtils.CONST_CMD_CLEAN
  }
  //used for Connect api data pulling for user database import...
  class GlanceConnectImportActor extends Actor {
    var serverConfig:(GlanceCredential,GlanceSystemConf) =(null,null)
    def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 3*60*1000) : WSRequestHolder = {
      Logger.debug("URI:"+s"$baseUri$api")
      val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
      holder.withHeaders("Content-Type" -> "application/json")
      if(json) holder.withHeaders("Accept" -> "application/json")
      else holder
    }


    def isSomeInstanceIsScaning():Future[(Boolean,String)]={
      for{
        optFlag <-GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_CONNECT_SCANNING_FLAG)
        optInstanceId <-GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_CONNECT_CANNING_ALLDATA)
      }yield{
        if(optFlag.isDefined && optFlag.getOrElse("0").toInt==1)
          (true,optInstanceId.getOrElse(ComUtils.glanceInstantId))
        else{
          val tmpInstanceId =optInstanceId.getOrElse(ComUtils.glanceInstantId)
          if(tmpInstanceId.compareToIgnoreCase(ComUtils.glanceInstantId)==0)
            (false,tmpInstanceId)
          else
            (true,tmpInstanceId)
        }
      }
    }
    def setInstanceIsScanning(isScanning:Boolean):Future[Boolean]={
      if (isScanning==true) {
        Future {
          true
        }
      }
      else {
        for{
          bFlag <- GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_CONNECT_SCANNING_FLAG, "1", 150 seconds)
          bInstanceSet<-GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_CONNECT_CANNING_ALLDATA, ComUtils.glanceInstantId, 150 seconds)
        }yield{
          true
        }
      }
    }
    def loadConnectedVisitors(startIndex:Long,fetchCount:Long, credential:GlanceCredential,sysConf:GlanceSystemConf):Future[Option[JsValue]]={
      val clientPath: String = sysConf.glanceCmxSetting.cmxConnectedPath +"?index="+startIndex+"&count="+fetchCount
      val holder: WSRequestHolder = createRequest(sysConf, ComUtils.getBaseUri(sysConf), clientPath)
      val response = (response: WSResponse) => {
        response.status match {
          case 200 =>
            Some(response.json)
          case _ =>
            Logger.warn("loadConnectedVisitors  data failed:" + response.status)
            None
        }
      }
      holder.get().map(response).recover {
        case _ =>
          Logger.error("Get URL failed for connected visitors,exception:"+clientPath)
          None
      }
    }

    def receive = {
      case (credential:GlanceCredential,sysConf:GlanceSystemConf) =>
        serverConfig =(credential,sysConf)
      case "!" =>
        if(!(serverConfig._1==null || serverConfig._2==null))
        {
          val credential =serverConfig._1
          val sysConf =serverConfig._2
          for{
            floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
            (isScanning,runningInstance) <-isSomeInstanceIsScaning()
            isSetScanning <-setInstanceIsScanning(isScanning)
          }yield {
            if(isScanning==false){
              if(floors.filter( p => ComUtils.hierarchyLevel(p.hierarchy)>=3).length>0)
              {
                //do pulling ...
                val startIndex:Long=0
                Logger.debug("Try to import the user data from Index 0!")
                val count:Long =ComUtils.DEFAULT_CMX_CONNECT_FETCH_COUNT
                self ! (startIndex,count,credential,sysConf)
              }else{
                Logger.warn("There is no floor has validated hierachy info!")
              }
            }else{
              //other guy is running it, just skip it...
              Logger.warn("Another instance is running pulling user DB:"+runningInstance+" yourself:"+ComUtils.glanceInstantId)
            }
          }
        }else{
          Logger.warn("No credential and system configuration settings for user data import!")
        }
      case (startIndex:Long,fetchCount:Long, credential:GlanceCredential,sysConf:GlanceSystemConf) =>

        def callNextPage(bLastPage:Boolean):Unit={
          //Logger.info("Connected visitors scanning call next page,StartIndex:"+(startIndex+fetchCount).toString)
          if(!bLastPage) {
            self ! (startIndex+fetchCount,fetchCount,credential,sysConf)
          }else{
            //clean flags..
            GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_CONNECT_SCANNING_FLAG, "0", 150 seconds).map{bFlag =>
              true
            }
          }
        }
        Logger.debug("Trying to import user data from index:"+startIndex+" fetchCount:"+fetchCount)
        loadConnectedVisitors(startIndex,fetchCount,credential,sysConf).map{ optJsonData =>
          if(!optJsonData.isDefined){
            Logger.error("Something wrong with get the connected visitors data!")
            callNextPage(bLastPage =true)
          }else{
           //save or update user profile here..
           try{
             val connected =optJsonData.get.as[Connected]
             if(sysConf.usingInMemoryImportedUserData){
               //cached in memory option to support airport...
               val optCurrentCached:Option[List[RegisteredUser]]=GlanceSyncCache.getGlanceCache[List[RegisteredUser]](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS)
               var list = connected.records.map(p => RegisteredUser.connectedRecordToUser(p,credential)) ::: {
                 if(optCurrentCached.isDefined)
                   optCurrentCached.get
                 else
                   List()
               }
               list =list.filter(p => (p.updated+24*60*60*1000)>System.currentTimeMillis())
               list =ComUtils.distinctBy(list)(_.macAddress)  //fixme do some filter to filter old data for example 1 days...
               Logger.debug("Current conneceted records:"+list.length)
               GlanceSyncCache.setGlanceCache[List[RegisteredUser]](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS,list)
               //update the macAddress listening...
               GlanceWebSocketActor.listenNotificationForAllFloors(credential)
               //cache to memcached system..
               GlanceMemcached.setGlanceCacheList[RegisteredUser](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS,list,registeredUserWrites,7 days,5).map{ bRet =>
                 //send data sync message, to sync connected records
                 GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_CACHE_INMEMORY_SYNC, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
                 callNextPage(bLastPage = (connected.queryRecordCount>connected.returnRecordCount))
               }.recover{
                 case _=>
                   Logger.error("Failed to set Global cache for connected user data!")
                   callNextPage(bLastPage = (connected.queryRecordCount>connected.returnRecordCount))
               }

             }else{
               //save data to
               RegisteredUser.updateViaConnectedRecords(credential,connected.records).map{ bRet =>
                 callNextPage(bLastPage = (connected.queryRecordCount>connected.returnRecordCount))
               }.recover{
                 case _=>
                   Logger.error("Failed update Connected Records to Glance User Database!")
                   callNextPage(bLastPage = (connected.queryRecordCount>connected.returnRecordCount))
               }
             }
           }catch {
             case exp:Throwable =>
               Logger.error("Failed to parse Connected Visitors data:"+exp.getMessage)
               callNextPage(bLastPage = true)
           }
          }
        }
      case ComUtils.CONST_CMD_CLEAN =>
        serverConfig=(null,null)
      case _ =>
        Logger.error("Unknown connected Visitors parse message received!")
    }
  }
}





