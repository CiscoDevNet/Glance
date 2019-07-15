package services.cisco.notification

import akka.actor.{Props, Actor}
import controllers.amqp.{GlanceMemcached, GlanceSyncProducer, GlanceSyncCache}
import controllers.glance.GlanceWebSocketActor
import models.cmx.{ConnectedRecord, MapCoordinate, Location, Campus}
import models.cmx.Implicits._
import models.cmx.Notitification.Implicits._
import models.cmx.Notitification._
import models.glance._
import models.glance.guestaccess.GlanceGuestCheckIn
import models.glance.mapzone.{GlanceFloor, GlanceCampus, GlanceBuilding}
import models.glance.RegisteredUser
import models.meraki.{Implicits, MerakiObservationData, MerakiNotification}
import models.meraki.Implicits._
import play.Logger
import play.api.libs.json._
import services.cisco.indoor.CMXVisitorScan
import services.common.{SchedulingService, ConfigurationService}
import play.api.Play.current
import services.security.{GlanceDBAuthService, GlanceCredential}
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.duration._

/**
 * Created by kennych on 12/30/15.
 */
object NotificationService {
  val prop = Props(new GlanceNotificationActor)
  val actor = ComUtils.system.actorOf(prop)

  val syncActor = SchedulingService.schedule(classOf[GlanceSyncNotificationActor], "GlanceSyncNotificationActor", 10 seconds, 60 seconds, "!")
  def syncAllDataToInstances(): Unit ={
    syncActor ! ("syncAllData")
  }
  def reversePositionArr(mapCoordinate: MapCoordinate, trackFloor: GlanceTrackFloor): (JsArray, List[Int]) = {
    def xCoordinateAdapterReverse(x: Double, trackFloor: GlanceTrackFloor): Int = {
      if (trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX <= 0.00001)
        x.toInt
      else
        roundUp(((x / trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX) - trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusX))
    }
    def yCoordinateAdapterReverse(y: Double, trackFloor: GlanceTrackFloor): Int = {
      if (trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY <= 0.00001)
        y.toInt
      else
        roundUp(((y / trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY) - trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusY))
    }

    def roundUp(d: Double) = math.ceil(d).toInt

    if (trackFloor == null) {
      (ComUtils.getJsonArrayInt(List(mapCoordinate.x.toInt, mapCoordinate.y.toInt)), List(mapCoordinate.x.toInt, mapCoordinate.y.toInt))
    } else {

      var x = xCoordinateAdapterReverse(mapCoordinate.x, trackFloor)
      var y = yCoordinateAdapterReverse(mapCoordinate.y, trackFloor)
      if (trackFloor.floorConf.glancePositionCalibrateSetting.swapXY) {

        if (trackFloor.depth > 0)
          x = xCoordinateAdapterReverse(trackFloor.depth.toDouble - mapCoordinate.y, trackFloor) //fixme special case for swap x, y offset
        else
          x = xCoordinateAdapterReverse(mapCoordinate.y, trackFloor)
        if (trackFloor.width > 0) //special case
          y = yCoordinateAdapterReverse(trackFloor.width.toDouble - mapCoordinate.x, trackFloor) //fixme special case for swap x, y offset
        else
          y = yCoordinateAdapterReverse(mapCoordinate.x, trackFloor)
      }
      (ComUtils.getJsonArrayInt(List(x, y)), List(x, y))
    }
  }


  def getPositionArr(mapCoordinate: MapCoordinate, trackFloor: GlanceTrackFloor,orgiSettingUser:RegisteredUser=null,mapsInfo:List[GlanceMapSizeInfo]=List()): (JsArray, List[Int]) = {
    def xCoordinateAdapter(x: Double, trackFloor: GlanceTrackFloor): Int = {
      ((x.toDouble + trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusX) * trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyX).toInt
    }
    def yCoordinateAdapter(y: Double, trackFloor: GlanceTrackFloor, matchFloorSizes:List[GlanceMapSizeInfo]): Int = {
      val yPos:Double = y
      val isMeraki:Boolean = (!ComUtils.isCmxServiceType(trackFloor.cmxServiceType) || ComUtils.isMerakiHierarchy(trackFloor.hierarchy))
      var adoptedPos=((yPos.toDouble + trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionPlusY) * trackFloor.floorConf.glancePositionCalibrateSetting.cmxPositionAmplifyY).toInt
      //if is meraki and there has match floor size info, do meraki position adoptation
      if(isMeraki && matchFloorSizes.length>0){
        adoptedPos = matchFloorSizes(0).height.toInt -adoptedPos
        if(adoptedPos<0)
          adoptedPos =0 //for meraki there should have no negative value...
      }
      adoptedPos
    }

    val matchFloorSizes= mapsInfo.filter( p => p.mapName==trackFloor.mapName && p.glanceOrgId==trackFloor.glanceOrgId)
    if(orgiSettingUser!=null && orgiSettingUser.fixedLocation){
      val x =orgiSettingUser.position.x.toInt
      val y =orgiSettingUser.position.y.toInt
      (ComUtils.getJsonArrayInt(List(x,y)), List(x, y))
    }else{
      var x = xCoordinateAdapter(mapCoordinate.x, trackFloor)
      var y = yCoordinateAdapter(mapCoordinate.y, trackFloor,matchFloorSizes)
      if(trackFloor.floorConf.glancePositionCalibrateSetting.swapXY)
      {
        if(trackFloor.depth>0.0)
          x =xCoordinateAdapter(trackFloor.depth-mapCoordinate.y, trackFloor)  //special case for swap X, Y offset
        else
          x =xCoordinateAdapter(mapCoordinate.y, trackFloor)
        if(trackFloor.width>0.0)//special case
          y =yCoordinateAdapter(trackFloor.width.toDouble - mapCoordinate.x, trackFloor,matchFloorSizes)   //special case for swap X, Y offset
        else
          y =yCoordinateAdapter(mapCoordinate.x, trackFloor,matchFloorSizes)
      }
      //if negative value, just set to zero
      if(x<0)x=0
      if(y<0)y=0
      if(matchFloorSizes.length>0){
        if(x>matchFloorSizes(0).width.toInt)
          x=matchFloorSizes(0).width.toInt
        if(y>matchFloorSizes(0).height.toInt)
          y=matchFloorSizes(0).height.toInt
      }

      (ComUtils.getJsonArrayInt(List(x, y)), List(x, y))
    }
  }

  def getRegisteredUser(credential: GlanceCredential, macAddress: String,userId:String): Future[List[RegisteredUser]] = {
    for {
      optUserISE <- { //support ISE Users
        if(userId!=null && userId!="") {
          RegisteredUser.readUserByUserId(credential,userId)
        }else
          Future{None}
      }
      optUser <- {
        if(macAddress=="")
          Future{None}
        else
          RegisteredUser.readRegisteredUserByMac(credential, macAddress)
      }
      optGuest <- GlanceGuestCheckIn.readRegisteredGuestByMac(credential, macAddress)
    } yield {
      var listUsers: mutable.MutableList[RegisteredUser] = new mutable.MutableList[RegisteredUser]()
      if (optUserISE.isDefined)
        listUsers +=RegisteredUser.userToDeviceUser(optUserISE.get,macAddress) //support ISE Users????
      if (optUser.isDefined)
        listUsers +=RegisteredUser.userToDeviceUser(optUser.get,macAddress)
      if (optGuest.isDefined)
        listUsers += optGuest.get
      val tmpMobile = GlanceWebSocketActor.getTempMobileClient(macAddress)
      if (tmpMobile!=null)
        listUsers += GlanceGuestCheckIn.convertToGuestUser(credential, tmpMobile)
      listUsers.toList
    }
  }

  def parseClientSnapshotNotifications(sysConf:GlanceSystemConf,credential: GlanceCredential, trackFloors: List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo],trackBuildings:List[GlanceTrackBuilding],notificationData: JsValue): Unit = {
    val notifications = notificationData.asOpt[List[JsValue]];
    notifications match {
      case Some(listNotification: List[JsValue]) => {
        //parse as CMX 10
        for( info <- listNotification){
          val deviceId = (info \ ComUtils.CONST_PROPERTY_MACADDRESS).asOpt[String].getOrElse("").toLowerCase
          val ise_userId = (info \ "username").asOpt[String].getOrElse("")
          val locationMapHierarchy = (info \ "mapInfo" \ "mapHierarchyString").asOpt[String].getOrElse("")
          val locationCoordinate = (info \ "mapCoordinate").asOpt[MapCoordinate].getOrElse(new MapCoordinate())
          getRegisteredUser(credential, deviceId,ise_userId).map { findUsers =>
            for (findUser <- findUsers) {
              Logger.debug("parseClientSnapshotNotifications Find registered user for:" + Json.toJson(findUser).toString())
              val matchFloors: List[GlanceTrackFloor] = {
                if(findUser.fixedLocation) {
                  trackFloors.filter(p =>p.floorId==findUser.position.floorId)
                }else
                  GlanceTrackFloor.findMatchFloors(trackFloors, locationMapHierarchy)
              }
              for (trackFloor <- matchFloors) {
                var join = Json.obj()
                var movement = Json.obj()
                var userObj: JsObject = Json.toJson(findUser).as[JsObject]
                userObj =ComUtils.removeObjectCommonProperties(userObj)
                val (position, positionArray) = getPositionArr(locationCoordinate, trackFloor, findUser,mapSizes)
                val tmpUser = findUser.copy(position = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId,GlanceTrackBuilding.findMatchBuildingIdByFloorId(trackBuildings,trackFloor.floorId)))
                if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
                  userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> position)
                else
                  userObj += (ComUtils.CONST_PROPERTY_POSITION -> position)
                userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(trackFloor.floorId))
                userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(trackBuildings,trackFloor.floorId)))
                userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY ->JsString(trackFloor.hierarchy))
                //animation ??
                if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
                  userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))
                join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))
                movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))
                //update the last position and update user Activities...
                try{
                  val lastLocatedTime =(info \"statistics" \ "lastLocatedTime").as[String]
                  val vDay =ComUtils.getDayStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
                  val vMinute=ComUtils.getMinuteStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
                  val vHour =ComUtils.getHourStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
                  val msTime=ComUtils.getTimeFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
                  val findPosition = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId)
                  val userActivity =new GlanceUserActivity(glanceOrgId =credential.glanceOrgId,
                      floorId =trackFloor.floorId,
                      userId =findUser.id,
                      macAddress=deviceId,
                      category=findUser.category,
                      visitingDay =vDay,
                      visitingHour=vHour,
                      visitingMinute=vMinute,
                      activeTime=msTime,
                      position=findPosition)
                    GlanceUserActivity.deferInsert(userActivity).map{ bRet =>
                      if(!bRet)Logger.error("Failed to add user activity!")
                    }
                }catch{
                  case ex:Throwable =>
                    Logger.error("Failed to update user Activity info,exception:{}",ex.getMessage())
                }

                if (GlanceWebSocketActor.addExpertToActive(tmpUser, trackFloor.floorId)) {
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(join))
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), credential)
                }else{
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(movement))
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), credential)
                }
                //withdraw the guest user id...
                if(findUser.category!=ComUtils.SMART_DEVICE_TYPE_GUEST)
                  GlanceWebSocketActor.removeGuestByMacAddress(deviceId)
              }
            }
          }
        }
      }
      case _ => {
        Logger.error("Failed to parse object: {}",notificationData.toString())
        //parse as CMX 8.0
      }
    }
  }

  //add user activities to db for analysis
  def addUserActivity(trackFloor: GlanceTrackFloor,mapSizes:List[GlanceMapSizeInfo],credential: GlanceCredential,eventData:LocationUpdateNotification,findUser:RegisteredUser):Future[Boolean]={
    try{
      val lastLocatedTime =eventData.lastSeen
      val (position, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,null,mapSizes)
      val vDay =ComUtils.getDayStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
      val vMinute=ComUtils.getMinuteStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
      val vHour =ComUtils.getHourStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
      val msTime=ComUtils.getTimeFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
      val findPosition = new GlancePosition(positionArray(0), positionArray(1))
      val userActivity =new GlanceUserActivity(glanceOrgId =credential.glanceOrgId,
        floorId =trackFloor.floorId,
        userId =findUser.id,
        macAddress=eventData.deviceId,
        category=findUser.category,
        visitingDay =vDay,
        visitingHour=vHour,
        visitingMinute=vMinute,
        activeTime=msTime,
        position=findPosition)
      GlanceUserActivity.deferInsert(userActivity).map{ bRet =>
        if(!bRet)Logger.error("Failed to add User Activity[defer]!")
        bRet
      }.recover{
        case _=>
          Logger.error("Failed to add User Activity[defer], unknown exception!")
          false
      }
    }catch{
      case ex:Throwable =>
        Logger.error("Failed to update user Activity info[defer]:{}",ex.getMessage())
        Future{false}
    }
  }

  def handleLocationUpdate(trackFloors:List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo],buildings:List[GlanceTrackBuilding],sysConf:GlanceSystemConf,credential: GlanceCredential, eventData: LocationUpdateNotification): Unit = {
    getRegisteredUser(credential, eventData.deviceId,eventData.username).map { findUsers =>
      for(findUser <-findUsers) {
        Logger.debug("Find registered user for:" + Json.toJson(findUser).toString())
        val matchFloors: List[GlanceTrackFloor] = {
          if(findUser.fixedLocation)
            trackFloors.filter(p => p.floorId ==findUser.position.floorId)
          else
            GlanceTrackFloor.findMatchFloors(trackFloors, eventData.locationMapHierarchy)
        }
        for (trackFloor <- matchFloors) {
          var join = Json.obj()
          var movement = Json.obj()
          var userObj: JsObject = Json.toJson(findUser).as[JsObject]
          userObj =ComUtils.removeObjectCommonProperties(userObj)
          val (position, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,findUser,mapSizes)
          val tmpUser = findUser.copy(position = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId,GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
          if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
            userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> position)
          else
            userObj += (ComUtils.CONST_PROPERTY_POSITION -> position)
          userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(trackFloor.floorId))
          userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
          userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY ->JsString(trackFloor.hierarchy))

          if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
            userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))

          join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))
          movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))
          //update userActivity
          addUserActivity(trackFloor,mapSizes,credential,eventData,findUser).map{ bRet =>
            if(!bRet)
              Logger.error("Failed to update user activity info")
          }
          //update the last position....
          if (GlanceWebSocketActor.addExpertToActive(tmpUser, trackFloor.floorId)) {
              GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(join))
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), credential)
          }else{
              GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(movement))
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), credential)
          }
        }
      }
    }
  }

  def parseNotifications(sysConf:GlanceSystemConf,credential: GlanceCredential,mapSizes:List[GlanceMapSizeInfo],trackFloors: List[GlanceTrackFloor], buildings:List[GlanceTrackBuilding],notificationData: JsValue): Unit = {
    def handleAssociation(credential: GlanceCredential, eventData: AssociationNotification): Unit = {
      val deviceId = eventData.deviceId.toLowerCase;
      val lastSeen = ComUtils.parseCMXDate(eventData.lastSeen);
      val ipAddressV4 = eventData.ipAddressV4;
      val ipAddressV6 = eventData.ipAddressV6;
      val ipMac = new GlanceAssociationIPMacAddress(
        glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        ipAddress = ipAddressV4,
        ipAddressV6 = ipAddressV6,
        macAddress = deviceId,
        username = eventData.username,
        lastSeen = lastSeen.getTime())

      GlanceAssociationIPMacAddress.insertWithClean(ipMac).map { bRet =>
        if (bRet)
          Logger.debug("Success to update ip mac address mapping!")
        else
          Logger.warn("Failed to update ip mac address mapping!")
      }
    }

    def addUserActivityMovememnt(trackFloor: GlanceTrackFloor,credential: GlanceCredential,eventData:MovementNotification,findUser:RegisteredUser):Future[Boolean]={
      try{
        val lastLocatedTime =eventData.lastSeen
        val (_, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,null,mapSizes)
        val vDay =ComUtils.getDayStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
        val vMinute=ComUtils.getMinuteStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
        val vHour =ComUtils.getHourStringFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
        val msTime=ComUtils.getTimeFromCMXDate(lastLocatedTime,trackFloor.floorConf.defaultTimeZone)
        val findPosition = new GlancePosition(positionArray(0), positionArray(1))
        val userActivity =new GlanceUserActivity(glanceOrgId =credential.glanceOrgId,
          floorId =trackFloor.floorId,
          userId =findUser.id,
          macAddress=eventData.deviceId,
          category=findUser.category,
          visitingDay =vDay,
          visitingHour=vHour,
          visitingMinute=vMinute,
          activeTime=msTime,
          position=findPosition)
        GlanceUserActivity.deferInsert(userActivity).map{ bRet =>
          if(!bRet)Logger.warn("Failed to add user activity!")
          bRet
        }.recover{
          case _=>
            Logger.error("Failed to add user activity,unknown exception!")
            false
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Failed to update user activity info,exception:{}",ex.getMessage())
          Future{false}
      }
    }
    def addUserActivityContainment(trackFloor: GlanceTrackFloor,credential: GlanceCredential,eventData:ContainmentNotification,findUser:RegisteredUser):Future[Boolean]={
      try{
        val (_, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,null,mapSizes)
        val vDay =ComUtils.getDayString(trackFloor.floorConf.defaultTimeZone)
        val vMinute=ComUtils.getMinuteString(trackFloor.floorConf.defaultTimeZone)
        val vHour =ComUtils.getHourString(trackFloor.floorConf.defaultTimeZone)
        val msTime=ComUtils.getTime(trackFloor.floorConf.defaultTimeZone)
        val findPosition = new GlancePosition(positionArray(0), positionArray(1))
        val userActivity =new GlanceUserActivity(glanceOrgId =credential.glanceOrgId,
          floorId =trackFloor.floorId,
          userId =findUser.id,
          macAddress=eventData.deviceId,
          category=findUser.category,
          visitingDay =vDay,
          visitingHour=vHour,
          visitingMinute=vMinute,
          activeTime=msTime,
          position=findPosition)
        GlanceUserActivity.deferInsert(userActivity).map{ bRet =>
          if(!bRet)Logger.warn("Failed to add user activity!")
          bRet
        }.recover{
          case _=>
            Logger.error("Failed to add user activity, unknown exception!")
            false
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Failed to update user activity info,exception:{}",ex.getMessage())
          Future{false}
      }
    }
    def addUserActivityInout(trackFloor: GlanceTrackFloor,credential: GlanceCredential,eventData:InOutNotification,findUser:RegisteredUser):Future[Boolean]={
      try{
        val (_, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,null,mapSizes)
        val vDay =ComUtils.getDayString(trackFloor.floorConf.defaultTimeZone)
        val vMinute=ComUtils.getMinuteString(trackFloor.floorConf.defaultTimeZone)
        val vHour =ComUtils.getHourString(trackFloor.floorConf.defaultTimeZone)
        val msTime=ComUtils.getTime(trackFloor.floorConf.defaultTimeZone)
        val findPosition = new GlancePosition(positionArray(0), positionArray(1))
        val userActivity =new GlanceUserActivity(glanceOrgId =credential.glanceOrgId,
          floorId =trackFloor.floorId,
          userId =findUser.id,
          macAddress=eventData.deviceId,
          category=findUser.category,
          visitingDay =vDay,
          visitingHour=vHour,
          visitingMinute=vMinute,
          activeTime=msTime,
          position=findPosition)
        GlanceUserActivity.deferInsert(userActivity).map{ bRet =>
          if(!bRet)Logger.warn("Failed to add user activity!")
          bRet
        }.recover{
          case _=>
            Logger.error("Failed to add user activity,unkown exception!")
            false
        }
      }catch{
        case ex:Throwable =>
          Logger.error("Failed to update user activity info,exception:{}",ex.getMessage())
          Future{false}
      }
    }

    def handleInout(sysConf:GlanceSystemConf,credential: GlanceCredential, eventData: InOutNotification): Unit = {
      getRegisteredUser(credential, eventData.deviceId,eventData.username).map { findUsers =>
        for(findUser <- findUsers) {
          Logger.debug("Find registered user for:" + Json.toJson(findUser).toString())
          val matchFloors: List[GlanceTrackFloor] = {
            if(findUser.fixedLocation)
              trackFloors.filter(p => p.floorId == findUser.position.floorId)
            else
              GlanceTrackFloor.findMatchFloors(trackFloors, eventData.locationMapHierarchy)
          }
          for(trackFloor <- matchFloors) {
            var join = Json.obj()
            var movement = Json.obj()
            var withDraw = Json.obj()
            var userObj: JsObject = Json.toJson(findUser).as[JsObject]
            userObj = ComUtils.removeObjectCommonProperties(userObj)
            val (position, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,findUser,mapSizes)
            if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
              userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> position)
            else
              userObj += (ComUtils.CONST_PROPERTY_POSITION -> position)
            userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(trackFloor.floorId))
            userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
            userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY ->JsString(trackFloor.hierarchy))

            if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
              userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))
            //update the last position....
            eventData.boundary match {
              case "INSIDE" =>
                join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))
                val tmpUser = findUser.copy(position = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId,GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
                //update userActivity
                addUserActivityInout(trackFloor,credential,eventData,findUser).map{ bRet =>
                  if(!bRet)
                    Logger.warn("Failed to update user activity info")
                }
                movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))
                if (GlanceWebSocketActor.addExpertToActive(tmpUser, trackFloor.floorId)) {
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(join))
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), credential)
                }else{
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(movement))
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), credential)
                }
               case "OUTSIDE" =>
                withDraw += (ComUtils.CONST_EVENT_PROPERTY_WITHDRAW -> ComUtils.getJsonArray(List(userObj)))
                if (GlanceWebSocketActor.removeExpertFromActive(findUser, trackFloor.floorId)) {
                  GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(withDraw))
                  GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTWITHDRAW, Json.toJson(withDraw).toString(), credential)
                }
            }
          }
        }
      }
    }

    def handleMovement(sysConf:GlanceSystemConf,credential: GlanceCredential, eventData: MovementNotification): Unit = {
      getRegisteredUser(credential, eventData.deviceId,eventData.username).map { findUsers =>
        for(findUser <- findUsers) {
          Logger.debug("Find registered user for:" + Json.toJson(findUser).toString())
          val matchFloors: List[GlanceTrackFloor] = {
            if(findUser.fixedLocation)
              trackFloors.filter(p => p.floorId==findUser.position.floorId)
            else
              GlanceTrackFloor.findMatchFloors(trackFloors, eventData.locationMapHierarchy)
          }
          for (trackFloor <- matchFloors){
            var join = Json.obj()
            var movement = Json.obj()
            var userObj: JsObject = Json.toJson(findUser).as[JsObject]
            userObj = ComUtils.removeObjectCommonProperties(userObj)
            val (position, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,findUser,mapSizes)
            if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
              userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> position)
            else
              userObj += (ComUtils.CONST_PROPERTY_POSITION -> position)
            userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(trackFloor.floorId))
            userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
            userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY ->JsString(trackFloor.hierarchy))

            if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
              userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))
            join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))

            addUserActivityMovememnt(trackFloor,credential,eventData,findUser).map{ bRet =>
              if(!bRet)
                Logger.warn("Failed to update user activity info")
            }
            //update the last position....
            movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))
            val tmpUser = findUser.copy(position = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId,GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
            if (GlanceWebSocketActor.addExpertToActive(tmpUser, trackFloor.floorId)) {
              GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(join))
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), credential)
            }else {
              GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(movement))
              GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), credential)
            }
          }
        }
      }
    }

    def handleContainment(sysConf:GlanceSystemConf,credential: GlanceCredential, eventData: ContainmentNotification): Unit = {
      getRegisteredUser(credential, eventData.deviceId,eventData.username).map { findUsers =>
        for(findUser <- findUsers){
          Logger.debug("Find registered user for:" + Json.toJson(findUser).toString())
          val matchFloors: List[GlanceTrackFloor] = {
            if(findUser.fixedLocation)
              trackFloors.filter(p => p.floorId==findUser.position.floorId)
            else
              GlanceTrackFloor.findMatchFloors(trackFloors, eventData.locationMapHierarchy)
          }
          for(trackFloor <- matchFloors) {
            var userObj: JsObject = Json.toJson(findUser).as[JsObject]
            userObj = ComUtils.removeObjectCommonProperties(userObj)
            val (position, positionArray) = getPositionArr(eventData.locationCoordinate, trackFloor,findUser,mapSizes)
            if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
              userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> position)
            else
              userObj += (ComUtils.CONST_PROPERTY_POSITION -> position)
            userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(trackFloor.floorId))
            userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
            userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY ->JsString(trackFloor.hierarchy))
            if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
              userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))

            var userObjById = userObj.copy()
            userObjById ++= Json.obj(ComUtils.CONST_PROPERTY_ID -> JsString(ComUtils.GUEST_ACCOUNT_PREFIX+eventData.deviceId.hashCode().toString))
            eventData.boundary match {
              case "INSIDE" =>
                var join = Json.obj()
                var movement = Json.obj()
                var joinById = Json.obj()
                var movementById = Json.obj()
                join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))
                movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))
                joinById += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObjById)))
                movementById += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObjById)))
                addUserActivityContainment(trackFloor,credential,eventData,findUser).map{ bRet =>
                  if(!bRet)
                    Logger.warn("Failed to update user activity info")
                }
                val tmpUser = findUser.copy(position = new GlancePosition(positionArray(0), positionArray(1),trackFloor.hierarchy,trackFloor.floorId,GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,trackFloor.floorId)))
                if (GlanceWebSocketActor.addExpertToActive(tmpUser, trackFloor.floorId)) {
                  GlanceWebSocketActor.broadcastMessageToFloorId(trackFloor.floorId, "update", Json.toJson(join))
                  GlanceWebSocketActor.broadcastMessageToFloorId(trackFloor.floorId, "update", Json.toJson(joinById))
                  GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), credential)
                  GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(joinById).toString(), credential)
                }else{
                  GlanceWebSocketActor.broadcastMessageToFloorId(trackFloor.floorId, "update", Json.toJson(movement))
                  GlanceWebSocketActor.broadcastMessageToFloorId(trackFloor.floorId, "update", Json.toJson(movementById))
                  GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), credential)
                  GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movementById).toString(), credential)
                }
                case "OUTSIDE" =>
                  var withDraw = Json.obj()
                  var withDrawById = Json.obj()
                  withDraw += (ComUtils.CONST_EVENT_PROPERTY_WITHDRAW -> ComUtils.getJsonArray(List(userObj)))
                  withDrawById += (ComUtils.CONST_EVENT_PROPERTY_WITHDRAW -> ComUtils.getJsonArray(List(userObjById)))
                  if (GlanceWebSocketActor.removeExpertFromActive(findUser, trackFloor.floorId)) {
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(withDraw))
                    GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(withDrawById))
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTWITHDRAW, Json.toJson(withDraw).toString(), credential)
                    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTWITHDRAW, Json.toJson(withDrawById).toString(), credential)
                  }
            }
          }
        }
      }
    }

    val notifications = (notificationData \ "notifications").asOpt[List[JsValue]];
    notifications match {
      case Some(listNotification: List[JsValue]) => {
        //parse  as CMX 10
        listNotification.foreach { info =>
          Logger.debug("Notification:" + info.toString())
          val header = info.as[NotificationHeader](tolerantNotificationHeaderReaders)

          header.notificationType match {
            case "association" => {
              val notificationUpdate = info.as[AssociationNotification](tolerantAssociationReaders)
              handleAssociation(credential, notificationUpdate)
            }
            case "locationupdate" => {
              val notificationUpdate = info.as[LocationUpdateNotification](tolerantLocationUpdateInfoReaders)
              Logger.debug("locationupdate message received, userId:"+notificationUpdate.username+", deviceId:"+notificationUpdate.deviceId)
              handleLocationUpdate(trackFloors,mapSizes,buildings,sysConf,credential, notificationUpdate)
              //parse location update...
            }
            case "inout" => {
              val notificationUpdate = info.as[InOutNotification](tolerantInOutReaders)
              Logger.debug("inout message received, userId:"+notificationUpdate.username+", deviceId:"+notificationUpdate.deviceId)
              handleInout(sysConf,credential, notificationUpdate)
              //parse inout
            }
            case "movement" => {
              val notificationUpdate = info.as[MovementNotification](tolerantMovementReaders)
              Logger.debug("movement message received, userId:"+notificationUpdate.username+", deviceId:"+notificationUpdate.deviceId)
              handleMovement(sysConf,credential, notificationUpdate)
              //parse movement???
            }
            case _ =>
              Logger.warn("Unknown notification type:" + header.notificationType)
          }
        }
      }
      case _ => {
        try {
          val notificationObj = notificationData.as[JsObject]
          if (notificationObj.keys.contains("MovementEvent")) {
            val notificationUpdate = (notificationObj \ "MovementEvent").as[MovementNotification](tolerantMovementReaders)
            handleMovement(sysConf,credential, notificationUpdate)
          } else if (notificationObj.keys.contains("ContainmentEvent")) {
            //parse as CMX 8
            val notificationUpdate = (notificationObj \ "ContainmentEvent").as[ContainmentNotification](tolerantContainmentReaders)
            handleContainment(sysConf,credential, notificationUpdate)
          }
        } catch {
          case exp:Throwable =>
            Logger.error("Failed to parse object:{},exception:{}", notificationData.toString(),exp.getMessage)
        }
        //parse as CMX 8.0
      }
    }
  }

  def preloadAllCaches(): Unit ={
    try {
      GlanceSystemConf.readConf(ComUtils.getCredential())
      RegisteredUser.updateRegisterUserCache(ComUtils.getCredential())
      GlanceTrackFloor.updateTrackFloorCache(ComUtils.getCredential())
      GlanceTrackBuilding.updateTrackBuildingCache(ComUtils.getCredential())
      GlanceTrackCampus.updateTrackCampusCache(ComUtils.getCredential())
      GlanceScreenToTrackFloor.updateScreenTrackFloorCache(ComUtils.getCredential())
      GlanceInterestPoint.updateInterestPointCache(ComUtils.getCredential())
      GlanceZone.updateAllSysZones(ComUtils.getCredential())
    } catch {
      case ex: Exception =>
        Logger.error("Failed to init all preload caches,exception:{}",ex.getMessage)
    }
  }

  def handleNotificationData(credential: GlanceCredential, notificationData: JsValue): Unit = {
    actor !(credential, notificationData)
  }

  def handleMerakiNotificationData(credential: GlanceCredential,notificationData:MerakiNotification):Unit={
    actor !(credential,notificationData)
  }

  def handleClientPositionSnapshot(credential: GlanceCredential, clientAddress: String, macAddress: String): Unit = {
    Logger.debug("Call handleClientPositionSnapshot")
    actor !(credential, clientAddress, macAddress.toLowerCase)
  }

  class GlanceNotificationActor extends Actor {
    def receive = {
      case (credential:GlanceCredential,merakiNotification:MerakiNotification) =>
        //handle meraki notification message here...
        for{
          sysConf <-GlanceSystemConf.readConf(credential)
          trackFloors <-GlanceTrackFloor.readAll(credential)
          trackBuildings <-GlanceTrackBuilding.readAll(credential)
          mapSizes <- GlanceMapSizeInfo.readAllConf(credential)
        }yield{
          if(merakiNotification.data.apFloors.length>0 && merakiNotification.data.observations.length>0){
            merakiNotification.data.observations.foreach{ elementData:MerakiObservationData =>
              GlanceAssociationIPMacAddress.updateIPMapping(credential,BuildMerakiDeviceIdMapping(merakiNotification,elementData))
              handleLocationUpdate(trackFloors,mapSizes,trackBuildings,sysConf,credential,MerakiObservationDataToNotificationData(elementData,merakiNotification))
            }
            GlanceVisitor.updateGuestCountByForce()
          }
          Logger.debug("Meraki message,secret:{}",merakiNotification.secret)
        }

      case (credential: GlanceCredential, notificationData: JsValue) =>
        for{
          sysConf <-GlanceSystemConf.readConf(credential)
          trackFloors <-GlanceTrackFloor.readAll(credential)
          trackBuildings <-GlanceTrackBuilding.readAll(credential)
          mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
        }yield{
          if (trackFloors.length > 0) {
            Logger.debug("Parse notification Data and dispatched to multi floors....")
            parseNotifications(sysConf,credential,mapSizes,trackFloors,trackBuildings, notificationData)
          } else {
            Logger.warn("Handle notification Data, no track floor")
          }
        }

      case (credential: GlanceCredential, clientAddress: String, macAddress: String) => //client info snapshot...
        for {
          sysConf <- GlanceSystemConf.readConf(credential)
          trackBuildings <-GlanceTrackBuilding.readAll(credential)
          mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
          optWireInfo <- RegisteredUser.getClientPosition(sysConf,credential, clientAddress)
        } yield {
          if (optWireInfo.isDefined) {
            GlanceTrackFloor.readAll(credential).map { trackFloors =>
              if (trackFloors.length > 0) {
                try{
                  parseClientSnapshotNotifications(sysConf,credential,trackFloors,mapSizes,trackBuildings,optWireInfo.get)
                }catch{
                  case exception:Throwable =>
                    Logger.error("Parse notification Data and dispatched to multi floors exception:"+exception.getMessage())
                }
              } else {
                Logger.warn("Handle Client Position Info --no floor found!")
              }
            }
          }
        }
      case _ =>
        Logger.warn("Received unknown message!")
    }
  }

  def handleSyncNotification(syncEventMsg: JsValue): Unit = {
    def getCredentialFromEventData(eventMsg: JsValue): GlanceCredential = {
      val credential: GlanceCredential = (eventMsg \ "credential").asOpt[GlanceCredential].getOrElse(null)
      credential
    }
    val credential = getCredentialFromEventData(syncEventMsg)
    if (credential == null) {
      Logger.error("Failed to get credential from sync event message:{}",syncEventMsg.toString())
    } else {
      GlanceWebSocketActor.init(credential)
      syncActor !(credential, syncEventMsg)
    }
  }

  class GlanceSyncNotificationActor extends Actor {

    def parseEventData(eventData: JsValue):JsValue ={
      try{
        val eValue =eventData.as[String].replaceAll("[\\\"]","\"")
        val eventDataJs =Json.parse(eValue)
        eventDataJs
      }catch {
        case ex:Throwable =>
          Logger.warn("Failed to unescape information, exception:{}",ex.getMessage)
          eventData
      }
    }

    def parseJsonData(eventData: String):JsValue ={
      try{
        val eValue =eventData.replaceAll("[\\\"]","\"")
        val eventDataJs =Json.parse(eValue)
        eventDataJs
      }catch {
        case ex:Throwable =>
          Logger.warn("Failed to unescape information,exception:{}",ex.getMessage)
          JsString(eventData)
      }
    }
    def parseUpdatedExperts(eventData: JsValue, keyName: String): List[RegisteredUser] = {
      val expertList = (eventData \ keyName).asOpt[List[JsValue]].getOrElse(List())
      val experts = expertList.map((x: JsValue) => x.asOpt[RegisteredUser].getOrElse(null))
      Logger.debug("parseUpdatedExperts, expert Size:"+experts.size)
      experts
    }

    def handleMovementMsg(eventData: JsValue): Unit = {
      val expertList = parseUpdatedExperts(eventData, ComUtils.CONST_EVENT_PROPERTY_MOVEMENT)
      for (expert <-  expertList) {
        if (expert != null) {
          //handle expert movement ...
          if (GlanceWebSocketActor.addExpertToActive(expert, expert.position.floorId)) {
//            updateLocationWithAnimationSync(expert,false,expert.position,ComUtils.DEFAULT_ANIMATION_INTERVAL)
            Logger.debug("Update sync data of movement of user successfully[add to join list...]:" + expert.id)
          }
        }
      }
    }

    def handleJoinMsg(eventData: JsValue): Unit = {
      val expertList = parseUpdatedExperts(eventData, ComUtils.CONST_EVENT_PROPERTY_JOIN)
      for (expert <- expertList) {
        if (expert != null) {
          //handle expert join ...
          if (GlanceWebSocketActor.addExpertToActive(expert, expert.position.floorId)) {
//            updateLocationWithAnimationSync(expert,true,expert.position,ComUtils.DEFAULT_ANIMATION_INTERVAL)
            Logger.debug("Update sync data of Join of user successfully:" + expert.id)
          }
        }
      }
    }

    def handleWithdrawMsg(eventData: JsValue): Unit = {
      val expertList = parseUpdatedExperts(eventData, ComUtils.CONST_EVENT_PROPERTY_WITHDRAW)
      for (expert <- expertList) {
        if (expert != null) {
          //handle expert withdraw...
          if (GlanceWebSocketActor.removeExpertFromActive(expert, expert.position.floorId)) {
            Logger.debug("Update sync data of withdrawing user successfully: {}",expert.id)
          }
        }
      }
    }

    def getAllSyncData(): String = {
      val msg = GlanceWebSocketActor.getSyncData()
      return msg
    }

    def syncAllData() : Unit={
      val allSyncData =getAllSyncData()
      if(allSyncData.length>0){
        GlanceMemcached.setMemcachedData(GlanceSyncCache.CONST_EVENT_BASE_DATA_SYNC,allSyncData).map{ keyName =>
          GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_BASE_DATA_SYNC, keyName, ComUtils.getCredential())
        }
      }
    }
    def receive = {

      case (credential: GlanceCredential, syncEventMsg: JsValue) => {
        val eventName = (syncEventMsg \ "eventName").as[String]
        //val eventId = (syncEventMsg \ "eventId").as[String]
        val eventFromInstance = (syncEventMsg \ "eventFromInstance").as[String]
        val eventData = (syncEventMsg \ "eventData")

        eventName match {
          case GlanceSyncCache.CONST_EVENT_SERVICESTART =>
            Logger.info("Glance Instance is started:" + eventFromInstance)
            syncAllData()
          case GlanceSyncCache.CONST_EVENT_NEWREGISTER=>
            try{
              val jsonData =parseEventData(eventData)
              val xUser =jsonData.asOpt[RegisteredUser].getOrElse(null)
              GlanceWebSocketActor.addNewUserToAllExpertMap(xUser)
            }catch{
              case ex:Throwable =>
                Logger.error("Failed to handle GlanceSyncCache.CONST_EVENT_NEWREGISTER message:{}",ex.getMessage())
            }
          case GlanceSyncCache.CONST_CACHE_TRACK_VISITOR_SCANNING =>
            for{
              listFloors <-GlanceTrackFloor.readAll(credential)
            }yield {
              if(listFloors !=null && listFloors.length>0)
                CMXVisitorScan.trackFloorsVisitors(credential,listFloors)
            }
          case GlanceSyncCache.CONST_EVENT_MAPSYNC =>
            Logger.info("Not implement yet!")
          case GlanceSyncCache.CONST_EVENT_USERIMPORTCONFIGSYNC =>
            RegisteredUser.InitUserDataImport(credential)
          case GlanceSyncCache.CONST_EVENT_CACHE_INMEMORY_SYNC =>
            //update local connected records from memcached... {
            GlanceMemcached.getGlanceCacheList[RegisteredUser](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS,RegisteredUser.tolerantRegisteredUserReaders,5).map { optList =>
              val localCache = {
                val optLocal =GlanceSyncCache.getGlanceCache[List[RegisteredUser]](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS)
                if(optLocal.isDefined)
                  optLocal.get
                else
                  List()
              }
              var listToSet:List[RegisteredUser] =List()
              if (optList.isDefined) {
                listToSet =optList.get ::: localCache
                listToSet =listToSet.filter(p => (p.updated+24*60*60*1000)>System.currentTimeMillis())
                listToSet =ComUtils.distinctBy(listToSet)(_.macAddress) //filter the expired records...
                GlanceSyncCache.setGlanceCache[List[RegisteredUser]](GlanceSyncCache.CONST_CACHE_INMEMORY_CONNECTEDRECORDS,listToSet)
              }else{
                Logger.warn("Failed to read cached Connected User data from memcached!")
              }
            }
          case GlanceSyncCache.CONST_EVENT_USING_INMEMORY_IMPORTDATA_SYNC =>
            //not implemented  yet..
          case GlanceSyncCache.CONST_EVENT_UI_HIGHLIGHT =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_UI_CONTROL =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_REGISTER =>
            GlanceWebSocketActor.updateAllRegister(false)
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_REGISTER, parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_EXPERTWITHDRAW =>
            //ComUtils.outputErrorMsg("WithDraw YYYYZZZZZ")
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
            handleWithdrawMsg(parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
            handleMovementMsg(parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_AVATARCHANGE =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_GUESTCOUNT =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_ZONECOUNT =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE,parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_ACCESSPOINTS_CONNECTED =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE,parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_EXPERTJOIN =>
            GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, parseEventData(eventData))
            handleJoinMsg(parseEventData(eventData))
          case GlanceSyncCache.CONST_EVENT_BASE_DATA_SYNC =>
            try{
              val keyName = eventData.asOpt[String].getOrElse("")
              if (keyName != "") {
                GlanceMemcached.getMemcachedData(keyName).map { optJsonStrData =>
                  optJsonStrData match {
                    case Some(jsonStr) =>
                      GlanceWebSocketActor.setSyncData(parseJsonData(jsonStr))
                    case None =>
                      Logger.warn("Failed to read the all sync data!")
                  }
                }
              }
            }catch{
              case ex:Throwable =>
                Logger.error("Failed to update all sync data:{}",ex.getMessage())
            }
          case GlanceSyncCache.CONST_CACHE_MERAKI_DEVICEINFO_ONE =>
            try{
              val jsonData =parseEventData(eventData)
              val ipMapping =jsonData.as[GlanceAssociationIPMacAddress]
              GlanceAssociationIPMacAddress.updateIPMappingCache(credential,ipMapping)
            }catch{
              case exp:Throwable =>
                Logger.error("Failed to parse  sync data of Meraki device info:{}",exp.getMessage)
            }

          case GlanceSyncCache.CONST_CACHE_MERAKI_DEVICEINFO =>
              //not implemented yet-handle all data cache of ip address info...

          case GlanceSyncCache.CONST_CACHE_GLANCE_TOKEN_SYNC =>
            try{
              val jsonData =parseEventData(eventData)
              val token:String=(jsonData \ "token").asOpt[String].getOrElse("")
              GlanceDBAuthService.updateSessionCache(token,credential,false)
            }catch{
              case exp:Throwable =>
                Logger.error("Failed to sync token info:{}",exp.getMessage)
            }
          case GlanceSyncCache.CONST_CACHE_TRACK_TENANT_SERVER_RELOAD =>
            GlanceTenantServer.cleanCache(credential)
            GlanceTenantServer.updateTenantServerCache(credential)
          case GlanceSyncCache.CONST_CACHE_SYSCONF_RELOAD =>
            GlanceSystemConf.cleanCache(credential)
            GlanceSystemConf.readConf(credential)
            GlanceWebSocketActor.listenNotificationForAllFloors(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_FACILITY_IMG_RELOAD =>
            GlanceFacilityImage.cleanCache(credential)
            GlanceFacilityImage.updateCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_IMAGERESOURCE_RELOAD =>
            GlanceFacilityResource.cleanCache(credential)
            GlanceFacilityResource.updateCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_ZONES_RELOAD =>
            GlanceZone.cleanCache(credential)
            GlanceZone.updateZonesCache(credential)
          case GlanceSyncCache.CONST_CACHE_REGISTERED_USERS_RELOAD =>
            RegisteredUser.cleanCache(credential)
            RegisteredUser.updateRegisterUserCache(credential)
          case GlanceSyncCache.CONST_CACHE_TRACK_FLOORS_RELOAD  =>
            GlanceTrackFloor.cleanCache(credential)
            GlanceTrackFloor.updateTrackFloorCache(credential)
            GlanceWebSocketActor.listenNotificationForAllFloors(credential)
          case GlanceSyncCache.CONST_CACHE_TRACK_BUILDINGS_RELOAD =>
            GlanceTrackBuilding.cleanCache(credential)
            GlanceTrackBuilding.updateTrackBuildingCache(credential)
          case GlanceSyncCache.CONST_CACHE_TRACK_CAMPUSES_RELOAD =>
            GlanceTrackCampus.cleanCache(credential)
            GlanceTrackCampus.updateTrackCampusCache(credential)
          case GlanceSyncCache.CONST_CACHE_SCREEN_TO_FLOOR_RELOAD =>
            GlanceScreenToTrackFloor.cleanCache(credential)
            GlanceScreenToTrackFloor.updateScreenTrackFloorCache(credential)
          case GlanceSyncCache.CONST_CACHE_INTEREST_POINT_RELOAD =>
            GlanceInterestPoint.cleanCache(credential)
            GlanceInterestPoint.updateInterestPointCache(credential)
          case GlanceSyncCache.CONST_CACHE_ACCESS_POINT_RELOAD =>
            GlanceAccessPoint.cleanCache(credential)
            GlanceAccessPoint.updateAccessPointCache(credential)
          case GlanceSyncCache.CONST_CACHE_DEVICE_ALIAS_RELOAD   =>
            GlanceDeviceAlias.cleanCache(credential)
            GlanceDeviceAlias.updateDeviceAliasCache(credential)
          case GlanceSyncCache.CONST_CACHE_REGISTERED_GUESTS_RELOAD =>
            GlanceGuestCheckIn.cleanCache(credential)
            GlanceGuestCheckIn.updateGlanceGuestCheckInCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_MAPINFO_RELOAD =>
            GlanceMapSizeInfo.cleanCache(credential)
            GlanceMapSizeInfo.updateMapInfoCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_BUILDING_RELOAD =>
            GlanceBuilding.cleanCache(credential)
            GlanceBuilding.updateGlanceBuildingCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_CAMPUS_RELOAD =>
            GlanceCampus.cleanCache(credential)
            GlanceCampus.updateGlanceCampusCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_FLOOR_RELOAD =>
            GlanceFloor.cleanCache(credential)
            GlanceFloor.updateGlanceFloorCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_AUTH_DB_RELOAD =>
            GlanceDBAuthService.cleanCache(credential)
            GlanceDBAuthService.updateGlanceAuthDBCache(credential)
          case GlanceSyncCache.CONST_CACHE_GLANCE_GLANCE_MAP_INFO_RELOAD =>
            GlanceMap.cleanCache(credential)
            GlanceMap.updateGlanceMapInfoCache(credential)
          case GlanceSyncCache.CONST_CACHE_ALL_VISITORS_FROM_CMX =>
            GlanceMemcached.getGlanceCacheList[GlanceVisitor](CMXVisitorScan.CACHE_NAME,GlanceVisitor.tolerantGlanceVisitorReaders,5).map{ optList =>
              if(optList.isDefined){
                GlanceSyncCache.setGlanceCache[List[GlanceVisitor]](CMXVisitorScan.CACHE_NAME_CMX,optList.get)
              }else{
                Logger.error("Failed to read synced visitor data from memcached and update local cache settings..")
              }
            }
          case GlanceSyncCache.CONST_CACHE_ALL_VISITORS_FROM_CMX_CLEAN =>
            CMXVisitorScan.cleanScanVisitorsCacheData(credential)
          case _ =>
            Logger.error("Unknown message received by notification actor!")
        }
      }
      case "!" =>
        //schedule to sync all data...
        syncAllData()
      case "syncAllData" =>
        syncAllData()
      case _ => {
        Logger.warn("Received unknown sync notification message by notication actor!")
      }
    }

  }

  //send cmd to UI via websocket to execute the actions.
  def sendHighLightCmd(experts:List[String],credential: GlanceCredential):Boolean={
    if(experts.length>0){
      val highlight=Json.obj("highlight" -> ComUtils.getJsonArrayValue(experts.map(p => JsString(p))))
      GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(highlight))
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_UI_HIGHLIGHT, Json.toJson(highlight).toString(), credential)
      true
    }else
      false
  }

  def sendShowHideCmd(cmds:List[String],credential:GlanceCredential):Boolean={
    val cmdList=List("show-heatmap","hide-heatmap","show-top-view","show-3d-view",
                "show-larger-icon","show-smaller-icon","show-zone","hide-zone",
                "show-person","hide-person","show-facility","hide-facility")
    val filteredCmds =cmds.map(p => p.toLowerCase).filter(p => cmdList.contains(p.toLowerCase.trim))
    if(filteredCmds.length>0)
    {
      val control=Json.obj("control" -> ComUtils.getJsonArrayValue(filteredCmds.map(p => JsString(p))))
      GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(control))
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_UI_CONTROL, Json.toJson(control).toString(), credential)
      true
    }else
      false

  }

}
