package models.glance

import reactivemongo.play.json._
import utils.ComUtils
import akka.actor.Actor
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import controllers.glance.GlanceWebSocketActor
import models._
import models.cmx.MapCoordinate
import models.meraki.{MerakiDeviceIdMapping, MerakiObservationData}
import play.Logger
import play.api.libs.json.{Json, JsObject}
import reactivemongo.bson.BSONObjectID
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import services.cisco.notification.NotificationService
import services.common.{ConfigurationService, SchedulingService}
import services.security.GlanceCredential
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.collection.mutable
import scala.collection.mutable.HashMap
import scala.collection.mutable.MutableList
import scala.concurrent.Future
import models.meraki.Implicits._
import models.cmx.Implicits._
import scala.concurrent.duration._


/**
 * Created by kennych on 11/24/15.
 */
case class GlanceAssociationIPMacAddress( _id: BSONObjectID = BSONObjectID.generate,
                                          glanceOrgId:String,
                                          glanceUserId:String,
                                          ipAddress : String,
                                          ipAddressV6:String,
                                          macAddress: String,
                                          fromMeraki:Boolean =true,
                                          merakiData:MerakiDeviceIdMapping=null,
                                          deviceType:String="IP",
                                          username:String = "",
                                          tags: List[String]=List(),
                                          lastSeen:Long=System.currentTimeMillis(),
                                          updated: Long=System.currentTimeMillis())

object GlanceAssociationIPMacAddress {
  val IPMappingExpiredMinutes=ConfigurationService.getLong("timeexpired.ipmapping",3)
  def collection =GlanceDBService.GlanceDB().collection[JSONCollection]("glanceIPMacAddress")
  
  val CACHE_NAME ="glanceIPMacAddress"

  implicit val glanceAssociationIPMacAddressReaders = new Reads[GlanceAssociationIPMacAddress] {

    def reads(js: JsValue) = {
      try {
        JsSuccess(GlanceAssociationIPMacAddress(
          (js \ "_id").asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
          (js \ "glanceOrgId").asOpt[String].getOrElse(""),
          (js \ "glanceUserId").asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_IPADDRESS).asOpt[String].getOrElse(""),
          (js \ "ipAddressV6").asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_MACADDRESS).asOpt[String].getOrElse(""),
          (js \ "fromMeraki").asOpt[Boolean].getOrElse(true),
          (js \ "merakiData").asOpt[MerakiDeviceIdMapping].getOrElse(null),
          (js \ "deviceType").asOpt[String].getOrElse("IP"),
          (js \ "username").asOpt[String].getOrElse(""),
          (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
          (js \ "lastSeen").asOpt[Long].getOrElse(System.currentTimeMillis()),
          (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      }catch{
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val glanceAssociationIPMacAddressWrites = new Writes[GlanceAssociationIPMacAddress] {
    def writes(z: GlanceAssociationIPMacAddress): JsValue = {
      if(z.merakiData!=null)
      {
        Json.obj(
          "_id" -> z._id,
          "glanceOrgId" -> {
            if(z.glanceOrgId==null)
              ""
            else
              z.glanceOrgId
          },
          "glanceUserId" -> {
            if(z.glanceUserId==null)
              ""
            else
              z.glanceUserId
          },
          ComUtils.CONST_PROPERTY_IPADDRESS -> {
            if(z.ipAddress==null)
              ""
            else
              z.ipAddress
          },
          "ipAddressV6" -> {
            if(z.ipAddressV6==null)
              ""
            else
              z.ipAddressV6
          },
          ComUtils.CONST_PROPERTY_MACADDRESS -> {
            if(z.macAddress==null)
              ""
            else
              z.macAddress
          },
          "fromMeraki" -> z.fromMeraki,
          "merakiData" -> Json.toJson(z.merakiData),
          "deviceType" -> z.deviceType,
          "username"  ->z.username,
          ComUtils.CONST_PROPERTY_TAGS -> z.tags,
          "lastSeen" -> z.lastSeen,
          ComUtils.CONST_PROPERTY_UPDATED -> z.updated
        )
      }else{
        Json.obj(
          "_id" -> z._id,
          "glanceOrgId" ->z.glanceOrgId,
          "glanceUserId" ->z.glanceUserId,
          ComUtils.CONST_PROPERTY_IPADDRESS -> z.ipAddress,
          "ipAddressV6" -> z.ipAddressV6,
          ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
          "fromMeraki" -> z.fromMeraki,
          "deviceType" -> z.deviceType,
          "username" ->z.username,
          ComUtils.CONST_PROPERTY_TAGS -> z.tags,
          "lastSeen" -> z.lastSeen,
          ComUtils.CONST_PROPERTY_UPDATED -> z.updated
        )
      }
    }
  }
  val glanceIPMappingActor = SchedulingService.schedule(classOf[GlanceIPMappingActor], "GlanceIPMappingActor", 1 seconds, 10 seconds, "!")

  def init(): Unit ={
    Logger.info("GlanceMeetingHours Init!")
  }
  
  var g_IPMacMapping:HashMap[String,(GlanceCredential,GlanceAssociationIPMacAddress,Long)]=new HashMap[String,(GlanceCredential,GlanceAssociationIPMacAddress,Long)]()

  def updateIPMappingCache(credential:GlanceCredential,ipMapping:GlanceAssociationIPMacAddress):Unit={
    if(ipMapping.macAddress!=null && ipMapping.macAddress!="")
      g_IPMacMapping(ipMapping.macAddress) = (credential,ipMapping,System.currentTimeMillis()+IPMappingExpiredMinutes*60*1000)
  }

  implicit val glanceAssociationIPMacAddressFormat = Format(glanceAssociationIPMacAddressReaders, glanceAssociationIPMacAddressWrites)

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_MERAKI_DEVICEINFO, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def sendIPMappingCacheMessage(credential:GlanceCredential,ipMapping:GlanceAssociationIPMacAddress):Unit={
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_MERAKI_DEVICEINFO_ONE, Json.toJson(ipMapping).toString(),credential)
  }

  def meraki2IPMap(credential:GlanceCredential,merakiDeviceMapping:MerakiDeviceIdMapping):GlanceAssociationIPMacAddress={
    new GlanceAssociationIPMacAddress(glanceOrgId = credential.glanceOrgId,
                                      glanceUserId = credential.glanceUserId,
                                      ipAddress = {
                                        if(merakiDeviceMapping!=null && merakiDeviceMapping.observationData.ipv4!=null)
                                          merakiDeviceMapping.observationData.ipv4
                                        else
                                          ""
                                      },
                                      ipAddressV6 = {
                                        if(merakiDeviceMapping!=null && merakiDeviceMapping.observationData.ipv6!=null)
                                          merakiDeviceMapping.observationData.ipv6
                                        else
                                          ""
                                      },
                                      macAddress={
                                        if(merakiDeviceMapping!=null && merakiDeviceMapping.observationData.clientMac!=null)
                                          merakiDeviceMapping.observationData.clientMac
                                        else
                                          ""
                                      },
                                      fromMeraki=true,
                                      merakiData=merakiDeviceMapping.copy(),
                                      deviceType={
                                        if(merakiDeviceMapping!=null && merakiDeviceMapping.observationData.deviceType!=null)
                                          merakiDeviceMapping.observationData.deviceType
                                        else
                                          "IP"
                                      },
                                      lastSeen= {
                                        if(merakiDeviceMapping!=null)
                                          merakiDeviceMapping.observationData.seenEpoch*1000
                                        else
                                          System.currentTimeMillis()
                                      }
    )
  }

  def updateIPMapping(credential: GlanceCredential,merakiData:MerakiDeviceIdMapping):Unit={
    val ipMap=meraki2IPMap(credential,merakiData)
    if(ipMap!=null && ipMap.macAddress!="")
      updateIPMapping(ipMap.macAddress,credential,ipMap)
  }

  def updateIPMapping(deviceId:String,credential: GlanceCredential,ipMappingData:GlanceAssociationIPMacAddress):Unit={
    glanceIPMappingActor !(deviceId,credential,ipMappingData)
  }

  def insertWithClean(associationIPMacAddress: GlanceAssociationIPMacAddress):Future[Boolean] ={
      val credential=ComUtils.getCredential(orgId = associationIPMacAddress.glanceOrgId,userId = associationIPMacAddress.glanceUserId)
      for {
        optUser <- {
          if(associationIPMacAddress.username=="")
            Future{None}
          else
            RegisteredUser.readUserByUserId(credential,associationIPMacAddress.username)
        }
        bUpdateUserMac <- {
          if(associationIPMacAddress.username!="" && optUser.isDefined){
            if(associationIPMacAddress.macAddress =="")
            {
              Logger.info("Check out, associated user name :"+associationIPMacAddress.username+" and mac Address:"+associationIPMacAddress.macAddress)
              RegisteredUser.checkoutByForce(credential, associationIPMacAddress.username)
            }else{
              Logger.info("Check in, associated user name :"+associationIPMacAddress.username+" and mac Address:"+associationIPMacAddress.macAddress)
              RegisteredUser.updateMacAddress(credential,associationIPMacAddress.username,associationIPMacAddress.macAddress)
            }
          }else {
            if(!optUser.isDefined)
              Logger.info("Could not find the associated user name :"+associationIPMacAddress.username+", and mac Address:"+associationIPMacAddress.macAddress)
            Future{false} //no need to update mac user macAddress
          }
        }
      }yield {
        if(bUpdateUserMac)
          GlanceWebSocketActor.listenNotificationForAllFloors(credential)
        bUpdateUserMac
      }
  }

  def insert(associationIPMacAddress: GlanceAssociationIPMacAddress) :Future[Boolean]= {
    collection.insert(associationIPMacAddress).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully insert:  MAC Address :"+associationIPMacAddress.macAddress+" ipAddress:"+associationIPMacAddress.ipAddress+" with ipAddressV6:"+associationIPMacAddress.ipAddressV6)
        true
      case _ =>
        Logger.error("Failed to insert:  MAC Address :"+associationIPMacAddress.macAddress+" ipAddress:"+associationIPMacAddress.ipAddress+" with ipAddressV6:"+associationIPMacAddress.ipAddressV6)
        false
    }
  }

  def getByIPMacAddress(ipMacAddress: String, isIPAddress: Boolean): Future[Option[GlanceAssociationIPMacAddress]] = {
      val findByAddress  = (addressName:String,address: String) => GlanceAssociationIPMacAddress.collection.find(Json.obj(addressName -> address)).one[GlanceAssociationIPMacAddress]
      if(isIPAddress)
      {
        if(ipMacAddress.contains('.') && ipMacAddress.split("\\.").length==4)
          return findByAddress(ComUtils.CONST_PROPERTY_IPADDRESS,ipMacAddress)
        else
          return findByAddress("ipAddressV6",ipMacAddress)
      }else{
        return findByAddress(ComUtils.CONST_PROPERTY_MACADDRESS,ipMacAddress)
      }
  }

  def update(ipAddress: String,ipAddressV6:String, macAddress: String,lastSeen: Long) : Future[Boolean] ={
      GlanceAssociationIPMacAddress.collection.update(Json.obj(ComUtils.CONST_PROPERTY_IPADDRESS -> ipAddress),
        Json.obj("$set" -> Json.obj(ComUtils.CONST_PROPERTY_IPADDRESS -> ipAddress,ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress,"lastSeen" -> lastSeen,ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug(s"Successfully updated: $ipAddress")
          true
        case _ =>
          Logger.error(s"Failed to update: $ipAddress")
          false
      }
  }

  def delete(ipAddress :String, macAddress : String): Future[Boolean] = {
      GlanceAssociationIPMacAddress.collection.remove(Json.obj(ComUtils.CONST_PROPERTY_IPADDRESS ->ipAddress, ComUtils.CONST_PROPERTY_MACADDRESS -> macAddress)).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug(s"Successfully deleted: $ipAddress or $macAddress")
          true
        case _ =>
          Logger.error(s"Failed to delete: $ipAddress or $macAddress")
          false
      }
  }

  def deleteWithMatch(associationIPMacAddress:GlanceAssociationIPMacAddress):Future[Boolean] = {
    var listQuery:MutableList[JsObject] = MutableList[JsObject](Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> associationIPMacAddress.macAddress))
    if(associationIPMacAddress.ipAddress!=null && associationIPMacAddress.ipAddress!="")
      listQuery += Json.obj(ComUtils.CONST_PROPERTY_IPADDRESS -> associationIPMacAddress.ipAddress)
    if(associationIPMacAddress.ipAddressV6!=null && associationIPMacAddress.ipAddressV6!="")
      listQuery += Json.obj("ipAddressV6" -> associationIPMacAddress.ipAddressV6)

    val query = Json.obj("glanceOrgId" -> associationIPMacAddress.glanceOrgId,"$or" -> listQuery)
    GlanceAssociationIPMacAddress.collection.remove(query).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully deleted:" + associationIPMacAddress.macAddress + " ip:" + associationIPMacAddress.ipAddress + " ipV6:" + associationIPMacAddress.ipAddressV6)
        true
      case _ =>
        Logger.error("deleteWithMatch Failed to delete:" + associationIPMacAddress.macAddress + " ip:" + associationIPMacAddress.ipAddress + " ipV6:" + associationIPMacAddress.ipAddressV6)
        false
    }
  }

  def addOrUpdate(credential: GlanceCredential, associationIPMacAddress: GlanceAssociationIPMacAddress): Future[Boolean] = {
    for {
      bRet <-  insertWithClean(associationIPMacAddress)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceAssociationIPMacAddress]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean to reload
      bRet
    }
  }

  def update(credential: GlanceCredential, associationIPMacAddress: GlanceAssociationIPMacAddress): Future[Boolean] = {
    def copySetValues(z: GlanceAssociationIPMacAddress): JsValue = {
      var jsObj = Json.toJson(z).as[JsObject]
      jsObj = ComUtils.removeObjectCommonProperties(jsObj,List(ComUtils.CONST_PROPERTY_DBID))
      jsObj
    }

    GlanceTrackCampus.collection.update(Json.obj("glanceOrgId" -> associationIPMacAddress.glanceOrgId, ComUtils.CONST_PROPERTY_MACADDRESS -> associationIPMacAddress.macAddress),
      Json.obj("$set" -> copySetValues(associationIPMacAddress))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.info("Successfully to update Glance IP Mapping data: glanceOrgId" + associationIPMacAddress.glanceOrgId + " withData:" + Json.toJson(associationIPMacAddress).toString())
        GlanceSyncCache.setGlanceCache[List[GlanceAssociationIPMacAddress]](CACHE_NAME,null) //clean to reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update Glance IP Mapping data: glanceOrgId:{} withData:{}",associationIPMacAddress.glanceOrgId, Json.toJson(associationIPMacAddress).toString())
        false
    }
  }

  def readAllCachedIPMappings(credential:GlanceCredential):Future[List[GlanceAssociationIPMacAddress]]={
    Future{
      filterExpired()
      g_IPMacMapping.values.toList.filter(p => p._1.glanceOrgId==credential.glanceOrgId).map(p => p._2)
    }
  }

  def filterExpired():Unit={
    try{
      var removeKeys:MutableList[String] =new mutable.MutableList[String]()
      val currentTime =System.currentTimeMillis()
      g_IPMacMapping.foreach{ item =>
        if(currentTime > item._2._3) //expired...
        {
          removeKeys += item._1
        }
      }
      removeKeys.foreach{ key =>
        g_IPMacMapping -= key
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to clean expired ip mapping,exception:{}",exp.getMessage)
    }
  }

  def readMacAddressByIP(credential: GlanceCredential,ipAddress:String):Future[Option[GlanceAssociationIPMacAddress]]={
    filterExpired()
    if(ipAddress=="" || g_IPMacMapping.size<=0) //if g_IPMacMapping empty means... no ip address mapping fixme, please...
      Future{None}
    else{
      val matchedIPMappings =g_IPMacMapping.toList.filter(p => p._2._1.glanceOrgId==credential.glanceOrgId && p._2._2.ipAddress!=null && p._2._2.ipAddress.compareToIgnoreCase(ipAddress)==0).map(p => p._2._2)
      if(matchedIPMappings.length>0)
        Future{Some(matchedIPMappings(0))}
      else{
          val expiredTime:Long =System.currentTimeMillis() - IPMappingExpiredMinutes*60*1000
          val findByName  = (org: String,ipAddr:String) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_IPADDRESS -> ipAddr,ComUtils.CONST_PROPERTY_UPDATED -> Json.obj("$gt" -> expiredTime))).one[GlanceAssociationIPMacAddress];
          findByName(credential.glanceOrgId,ipAddress).map{ ipMac =>
            if(ipMac.isDefined)
              updateIPMappingCache(credential,ipMac.get)
            ipMac
          }
      }
    }
  }

  def readMacLoc(credential: GlanceCredential,macAddress: String):Future[Option[GlanceAssociationIPMacAddress]]= {
    filterExpired()
    if(g_IPMacMapping.size<=0){
      Future{None}
    }else{
      val filteredMap =g_IPMacMapping.toList.filter(p => p._2._1.glanceOrgId==credential.glanceOrgId && p._1.compareToIgnoreCase(macAddress)==0)
      if(filteredMap.length>0)
        Future{Some(filteredMap(0)._2._2)}
      else
        Future{None}
    }

  }

  def readIPByMacAddress(credential: GlanceCredential,macAddress:String):Future[String]={
    filterExpired()
    if(g_IPMacMapping.size<=0){
      Future{""}
    }else{
      val filteredMap =g_IPMacMapping.toList.filter(p => p._2._1.glanceOrgId==credential.glanceOrgId && p._1.compareToIgnoreCase(macAddress)==0)
      if(filteredMap.length>0)
      {
        Logger.debug("match cache IP count:"+filteredMap.length)
        Future{filteredMap(0)._2._2.ipAddress}
      }else{
        //try to read from db...
        val expiredTime:Long =System.currentTimeMillis() - IPMappingExpiredMinutes*60*1000
        val findByName  = (org: String,mac:String) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_MACADDRESS -> mac,ComUtils.CONST_PROPERTY_UPDATED -> Json.obj("$gt" -> expiredTime))).one[GlanceAssociationIPMacAddress];
        findByName(credential.glanceOrgId,macAddress).map{ ipMac =>
          if(ipMac.isDefined)
          {
            updateIPMappingCache(credential,ipMac.get)
            Logger.debug("match IP from db:{}",ipMac.get.ipAddress)
            ipMac.get.ipAddress
          }
          else
            ""
        }
      }
    }
  }
  def convertIPMappingToVisitor(credential:GlanceCredential,floors:List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo],ipMacItem: GlanceAssociationIPMacAddress):GlanceVisitor={
    if(!(ipMacItem.merakiData !=null && ipMacItem.merakiData.apFloors.length>0 && ipMacItem.merakiData .observationData!=null))
      return null
    val matchFloor=floors.filter( p => p.hierarchy.compareToIgnoreCase({
      if(ipMacItem.merakiData!=null && ipMacItem.merakiData.apFloors.length>0)
        ipMacItem.merakiData.apFloors(0)
      else
        ""
    })==0)
    if(matchFloor.length<=0)
      return null

    val lastLocatedTime = ipMacItem.lastSeen
    val vDay = ComUtils.getDayStringFromUTCTimeStamp(lastLocatedTime, matchFloor(0).floorConf.defaultTimeZone)
    val vMinute = ComUtils.getMinuteStringFromUTCTimeStamp(lastLocatedTime, matchFloor(0).floorConf.defaultTimeZone)
    val vHour = ComUtils.getHourStringFromUTCTimeStamp(lastLocatedTime, matchFloor(0).floorConf.defaultTimeZone)
    val msTime = ComUtils.getTimeFromUTCTimeStamp(lastLocatedTime, matchFloor(0).floorConf.defaultTimeZone)
    val location ={
      if(ipMacItem.merakiData.observationData.location.unit.compareToIgnoreCase("METER")==0)
        MapCoordinate(ipMacItem.merakiData.observationData.location.x(0)*3.28084,ipMacItem.merakiData.observationData.location.y(0)*3.28084)
      else
        MapCoordinate(ipMacItem.merakiData.observationData.location.x(0),ipMacItem.merakiData.observationData.location.y(0))
    }
    val (_, positionArray) =NotificationService.getPositionArr(location, matchFloor(0),null,mapSizes)
    val findPosition = new GlancePosition(positionArray(0), positionArray(1))

    return GlanceVisitor(glanceOrgId = credential.glanceOrgId,
                  floorId =matchFloor(0).floorId,visitingDay = vDay,
                  visitingHour = vHour,
                  visitingMinute = vMinute,
                  activeTime = msTime,
                  guestMacAddress = ipMacItem.macAddress,
                  position = findPosition)
  }

  def readAsVisitors(credential:GlanceCredential,floors:List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo]):Future[List[GlanceVisitor]]=Future{
    filterExpired()
    val filteredMap =g_IPMacMapping.values.toList.filter(p => p._1.glanceOrgId==credential.glanceOrgId).map(p => p._2)
    val retList = filteredMap.map( p => convertIPMappingToVisitor(credential,floors,mapSizes,p)).filter(p => p!=null)
    retList
  }

  def readMatchedAssIPMapping(credential:GlanceCredential,ipAddress:String):Future[Option[GlanceAssociationIPMacAddress]]={
    filterExpired()
    if(g_IPMacMapping.size<=0)
    {
      Future{None} //if IP mapping empty, just return none...
    }else{
      val filteredMap =g_IPMacMapping.toList.filter(p => p._2._1.glanceOrgId==credential.glanceOrgId && p._2._2.ipAddress.compareToIgnoreCase(ipAddress)==0).map(p => p._2._2)
      if(filteredMap.length>0)
      {
        Logger.debug("match cache IP count:"+filteredMap.length)
        Future{Some(filteredMap(0))}
      }else{
        //try to read from db...
        val expiredTime:Long =System.currentTimeMillis() - IPMappingExpiredMinutes*60*1000
        val findByName  = (org: String,ipAddr:String) => collection.find(Json.obj("glanceOrgId" -> org,ComUtils.CONST_PROPERTY_IPADDRESS -> ipAddr,ComUtils.CONST_PROPERTY_UPDATED -> Json.obj("$gt" -> expiredTime))).one[GlanceAssociationIPMacAddress];
        findByName(credential.glanceOrgId,ipAddress).map{ ipMac =>
          if(ipMac.isDefined)
            updateIPMappingCache(credential,ipMac.get)
          ipMac
        }
      }
    }
  }
  def readClientPosition(credential:GlanceCredential,ipAddress:String):Future[Option[JsValue]]={
    def getHierachy_inline(optAssIPMapping:Option[GlanceAssociationIPMacAddress]):String={
      if(optAssIPMapping.get.merakiData!=null && optAssIPMapping.get.merakiData.apFloors.length>0)
        optAssIPMapping.get.merakiData.apFloors(0)
      else
        ""
    }
    def getLocation_inline(optAssIPMapping:Option[GlanceAssociationIPMacAddress]):MapCoordinate={
      if(optAssIPMapping.get.merakiData!=null && optAssIPMapping.get.merakiData.observationData!=null && optAssIPMapping.get.merakiData.observationData.location!=null)
      {
        if(optAssIPMapping.get.merakiData.observationData.location.unit.compareToIgnoreCase("METER")==0)
          MapCoordinate(x=optAssIPMapping.get.merakiData.observationData.location.x(0)*3.28084,y=optAssIPMapping.get.merakiData.observationData.location.y(0)*3.28084)
        else
          MapCoordinate()
      }else{
        MapCoordinate()
      }
    }

    readMatchedAssIPMapping(credential,ipAddress).map{ optAssIPMapping=>
      if(!optAssIPMapping.isDefined)
        None
      else {
        val hierarchy = getHierachy_inline(optAssIPMapping)
        val location = getLocation_inline(optAssIPMapping)
        val obj =Json.obj(ComUtils.CONST_PROPERTY_MACADDRESS -> optAssIPMapping.get.macAddress,
                          "mapInfo" ->Json.obj("mapHierarchyString" -> hierarchy),
                          "mapCoordinate" ->Json.obj("mapCoordinate" -> Json.toJson(location))
                         )
        Some(obj)
      }
    }
  }

  //make IP Mac Address insert update async
  class GlanceIPMappingActor extends Actor {
    val todo = scala.collection.mutable.Map[String, (GlanceCredential,GlanceAssociationIPMacAddress)]()
    def receive = {
      case (deviceId: String,credential:GlanceCredential,ipMappingAddress:GlanceAssociationIPMacAddress) =>
        todo(deviceId)=(credential,ipMappingAddress)
        GlanceAssociationIPMacAddress.updateIPMappingCache(credential,ipMappingAddress)
        GlanceAssociationIPMacAddress.sendIPMappingCacheMessage(credential,ipMappingAddress)

      case "!" =>   /*schedule service duration trigger*/
        val completed = new java.util.concurrent.atomic.AtomicLong()
        val count =todo.values.size
        val tmpVisitors:mutable.MutableList[GlanceVisitor]=new mutable.MutableList[GlanceVisitor]()
        for (deviceMap <-todo.values){
          val credential =deviceMap._1
          val ipmapping =deviceMap._2
          val result:Future[Long] ={
            for{
              floors <- GlanceTrackFloor.readAll(credential)
              mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
              mappingVisitor <- Future{convertIPMappingToVisitor(credential,floors,mapSizes,ipmapping)}
            }yield{
              if(mappingVisitor!=null)
                tmpVisitors += mappingVisitor
              val completedCount =completed.incrementAndGet()
              completedCount
            }
          }
          result.map{ cc =>
            if(cc== count){
              GlanceVisitor.insertByBatch(tmpVisitors.toList)
              tmpVisitors.clear()
            }
            Logger.debug("Completed Count:"+cc)
          }.recover{
            case _=>
              val completedCount =completed.incrementAndGet()
              if(completedCount==count){
                GlanceVisitor.insertByBatch(tmpVisitors.toList)
                tmpVisitors.clear()
              }
              Logger.info("Include current exception, completed Count:"+completedCount)
          }
        }
        todo.clear()
      case deviceId:String =>   //remove the floorId...
        todo -= deviceId
    }
  }
}
