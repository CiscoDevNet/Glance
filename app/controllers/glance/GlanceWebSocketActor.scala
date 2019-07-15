package controllers.glance

import java.util.{Date, UUID}

import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer}
import models.cmx.MapCoordinate
import models.cmx.Implicits._
import models.glance._
import models.glance.guestaccess.GlanceGuestCheckIn
import play.api.libs.json._
import akka.actor._
import play.Logger
import services.cisco.indoor.CMXVisitorScan
import services.cisco.notification.NotificationService
import services.common.SchedulingService
import services.security.GlanceCredential
import utils.ComUtils
import scala.collection.mutable
import scala.collection.mutable.HashMap
import scala.concurrent.Future
import scala.util.Random
import scala.util.control.NonFatal
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

object GlanceWebSocketActor {
  val defaultExpertMinutes =3
  val defaultMeetingHours = 120.0
  var visitingDay =""
  var socketMap:HashMap[String, ActorRef]=new HashMap()
  var iPadMap:HashMap[String,ActorRef] =new HashMap()
  var socketFloorIdMap:HashMap[String,mutable.MutableList[String]] =new HashMap[String,mutable.MutableList[String]]()  //floorId  -> socket ID mapping.
  var allExpertMap:HashMap[String,RegisteredUser] =new HashMap()
  var allActiveExpertMap:HashMap[String,RegisteredUser] =new HashMap()
  val allActiveExpertMapByFloor:HashMap[String,HashMap[String,RegisteredUser]] =new HashMap()
  var lastUpdatedOfExpert:HashMap[String,Long] =new HashMap()
  var visitingDayByFloor:HashMap[String,String]=new HashMap()
  val meetingHoursMap:HashMap[String,Double] =new HashMap()
  var tempMobileClientMap:mutable.HashMap[String,GlanceGuestCheckIn] =new mutable.HashMap[String,GlanceGuestCheckIn]()
  var tempMobileSocketIdMacAddressMap:mutable.HashMap[String,String] =new mutable.HashMap[String,String]()
  val expireCheckActor = SchedulingService.schedule(classOf[GlanceExpireCheckClientInfoDefferQueryActor], "GlanceExpireCheckActor", 30 seconds, 20 seconds, "!")

  def props(id:String,clientAddress:String,credential:GlanceCredential,out: ActorRef): Props = {
    Logger.info("WS server accept new connection!")
    val prop = Props(new GlanceWebSocketActor(id,credential,out))
    socketMap(id)=ComUtils.system.actorOf(prop,id)
    //Logger.info("Enter trap to send global info to client!")
    socketMap.get(id).map{ receiveActor =>
      receiveActor ! (ComUtils.WS_EVENT_INTERNAL_REFRESH_STAFF,id,credential,clientAddress)
      expireCheckActor ! (id,clientAddress,credential) //send client info check
    }
    //Logger.info("GlanceWebSocketActor create,org:{}, clientAddress:{}".format(credential.glanceOrgId,clientAddress))
    GlanceScreenToTrackFloor.readByClientAddress(credential,clientAddress).map{ optScreenInfo =>
      optScreenInfo match{
        case Some(screenInfo) =>
          addSocketIdToFloorMap(id,screenInfo.floorId)
          GlanceMeetingHours.trackFloorMeetingHours(screenInfo.floorId,credential)
          GlanceVisitor.trackFloorGuestCount(screenInfo.floorId,credential)
        case None =>
          {
            //if not screen floor found, just using the default floor Id
            for{
              sysConf <- GlanceSystemConf.readConf(credential)
              campus  <- {
                if(sysConf.defaultTrackingCampus == "")
                  Future{None}
                else
                  GlanceTrackCampus.readByCampusId(credential,sysConf.defaultTrackingCampus)
              }
              building <- {
                if(campus.isDefined && campus.get.campusConf.buildings.length>0){
                  GlanceTrackBuilding.readByBuildingId(credential,campus.get.campusConf.buildings(0))
                }else{
                  Future{None}
                }
              }
              floors <- {
                if(building.isDefined && building.get.buildingConf.floors.length>0)
                {
                  GlanceTrackFloor.readAllOfBuilding(credential,building.get)
                }else{
                  Future{List()}
                }
              }
            }yield {
              if(floors.length>=0){
                Logger.debug("trackFloorGuestCount of floor:{}",floors(0).floorId)
                GlanceVisitor.trackFloorGuestCount(floors(0).floorId,credential)
              }
            }
          }
          Logger.info("No screen Id matches client Address:{},just use the default.",clientAddress)
      }
    }
    listenNotificationForAllFloors(credential)
    return prop
  }

  var bInitialized=false
  def init(credential: GlanceCredential):Boolean=
  {
    if(bInitialized)
      return bInitialized
    try{
      for{
        bUpdateSysZones <- GlanceZone.updateAllSysZones(credential)
        bRet <- GlanceWebSocketActor.updateAllNActiveExpert(credential)
        sysConf <- GlanceSystemConf.readConf(credential)
        campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
        interestPoints <-GlanceInterestPoint.readAll(credential)
        facilities <- GlanceFacilityResource.readAll(credential)
        zoneCounting <- Visitor.getHeatmapOfVisitorsByZones("all","",credential)
        cachedConnectedDevices <-GlanceAssociationIPMacAddress.readAllCachedIPMappings(credential)
        accessPoints <- GlanceAccessPoint.readAllCombineConnectedDevice(credential,cachedConnectedDevices)
        msg <-Future{GlanceWebSocketActor.getRefreshInfo(credential,sysConf,"169.254.0.1",campusInfo,interestPoints,List(),facilities,zoneCounting)}
        trackFloors <- GlanceTrackFloor.readAll(credential)
      } yield {
        if(bUpdateSysZones)
          Logger.info("Initialize WebSocket object, updated system zones:"+bUpdateSysZones)
        if(trackFloors.length>0)
          CMXVisitorScan.trackFloorsVisitors(credential,trackFloors)
        Logger.info("WebSocket object Initialized")
      }
    } catch {
      case ex:Throwable =>
        Logger.error("Failed to initialize WebSocket Object, exception:{}",ex.getMessage())
    }
    bInitialized=true
    bInitialized
  }

  def listenNotificationForAllFloors(credential: GlanceCredential): Unit ={
    GlanceTrackFloor.readAll(credential).map{ listFloors  =>
      //add floor visitor scanning schedule service
      if(listFloors.length > 0)
      {
        CMXVisitorScan.trackFloorsVisitors(credential,listFloors)
        CMXVisitorScan.syncTrackFloorsVisitors(credential)
      }
      listFloors.foreach{ floor =>
        GlanceNotificationSubscription.listenNotificationForFloor(floor.floorId,floor,credential)
      }
    }
  }

  def removeSockIdFromFloorMap(socketId:String):Boolean={
    socketFloorIdMap.values.foreach { list =>
      val nIndex = list.indexOf(socketId)
      if (nIndex >= 0) {
        list.drop(nIndex)
      }
    }
    true
  }

  def addSocketIdToFloorMap(socketId:String,floorId:String): Boolean ={
    val optList = socketFloorIdMap.get(floorId)
    optList match{
      case Some(list) =>
        if(list.contains(socketId))
          true
        else
          list += socketId
          true
      case _ =>
        val list =new mutable.MutableList[String]
        list += socketId
        socketFloorIdMap(floorId) =list
        true
    }
  }

  def removeSocket(id:String):Unit ={
    socketMap -= id
    removeSockIdFromFloorMap(id)
  }
  def removeIPadSocket(iPadId:String): Unit ={
    iPadMap  -= iPadId
    removeSockIdFromFloorMap(iPadId)
  }

  def mapIPadSocket(socketId:String,iPadId:String): Unit ={
      iPadMap(iPadId) =socketMap(socketId)
  }

  /* Broadcast to All connected web socket connections*/
  def broadcastMessage(event:String, message:JsValue): Boolean ={
    Logger.debug("Broadcast websocket message, event: {}, message: {}", event,message.toString())
    socketMap.foreach{ f =>
      val dataMsg =GlanceWebSocketActor.getMsg(event,message)
      f._2 ! dataMsg
    }
    true
  }

  //send update message connected web socket connections by floorId....
  def broadcastMessageToFloorId(floorId:String,event:String, message:JsValue): Boolean ={
    //try to send message the web socket connections by floorid, but here no implementation yet, just call broadcast message
    Logger.debug("Broadcast websocket message to floor:{}, event: {}, message: {}",floorId,event,message.toString())
    broadcastMessage(event,message)
  }

  /* Broadcast to except some ID*/
  def broadcastMessage(filterId:String,event:String, message:JsValue): Boolean ={
      socketMap.foreach{ f =>
        if(f._1 !=filterId){
          val dataMsg =GlanceWebSocketActor.getMsg(event,message)
          f._2 ! dataMsg
        }
      }
      true
  }

  def sendMessageToIPad(terminalId:String,message:JsValue): Unit ={
      iPadMap.get(terminalId).map{ receiveActor =>
        receiveActor ! message
      }
  }

  def registerUserHashId(registeredUser: RegisteredUser):String={
    //registeredUser.glanceOrgId+"$"+registeredUser.glanceUserId+"$"+registeredUser.id
    registeredUser.id
  }

  def removeGuestByMacAddress(macAddress:String):Unit={
    val optTempMobile = tempMobileClientMap.get(macAddress)
    if(optTempMobile.isDefined){
      if(macAddress != ""){
        allExpertMap.foreach{ kv =>
          if(kv._2.macAddress == macAddress)
          {
            allExpertMap -= kv._1
            GlanceWebSocketActor.withDraw(List(kv._2))
          }
        }
        tempMobileSocketIdMacAddressMap.foreach{ kv =>
          if(kv._2 == macAddress)
            tempMobileSocketIdMacAddressMap -= kv._1
        }
        tempMobileClientMap -= macAddress
      }
    }
  }

  private def addToMap(activeMap:HashMap[String,RegisteredUser],user:RegisteredUser): Boolean =
  {
    val tmpId =registerUserHashId(user)
    val bRet:Boolean = !(activeMap.get(tmpId).isDefined)
    activeMap(tmpId)=user
    bRet
  }

  private def removeFromFloorActive_NotCurrent(userCheck:RegisteredUser,floorIdCurrentActive:String): Boolean =
  {
    if (allActiveExpertMapByFloor==null || floorIdCurrentActive == "")
      return false

    allActiveExpertMapByFloor.foreach{ floorExperts:(String,HashMap[String,RegisteredUser]) =>
      if(floorExperts._1.compareToIgnoreCase(floorIdCurrentActive)!=0){
        //remove user from active user of floor when previous active floor id was in different floor
        val hashId =registerUserHashId(userCheck)
        if (floorExperts._2.get(hashId).isDefined){
          floorExperts._2 -= hashId
        }
      }
    }
    true
  }

  def addExpertToActive(registeredUser: RegisteredUser,floorId:String=""):Boolean={
    lastUpdatedOfExpert(registerUserHashId(registeredUser))=new Date().getTime()
    def removeFromActive_inline(user:RegisteredUser,floorIdCurrentActive:String=""): Boolean ={
      try{
        if(floorIdCurrentActive!=""){
          //remove from active and other floors...
          val hashId =registerUserHashId(user)
          if(allActiveExpertMap!=null && allActiveExpertMap.get(hashId).isDefined){
            allActiveExpertMap -= hashId
          }
        }
        removeFromFloorActive_NotCurrent(user,floorIdCurrentActive)
      }catch{
        case ex:Throwable =>
          Logger.error("Error: removeFromActive, exception:{}",ex.getMessage())
          false
      }
    }

    var bRet =false
    if(floorId ==""){
      removeFromActive_inline(registeredUser,floorId)
      addToMap(allActiveExpertMap,registeredUser)
    }else{
      val optFloorMap =allActiveExpertMapByFloor.get(floorId)
      optFloorMap match{
        case Some(floorMap) =>
          bRet =addToMap(floorMap,registeredUser)
          //remove from previous active floor...
          removeFromActive_inline(registeredUser,floorId)
          bRet
        case _ =>
          val floorMap:HashMap[String,RegisteredUser]=new HashMap()
          bRet= addToMap(floorMap,registeredUser)
          allActiveExpertMapByFloor(floorId) =floorMap
          //remove from previous active floor...
          removeFromActive_inline(registeredUser,floorId)
          bRet
      }
    }
  }

  def getAllActiveExperts():List[RegisteredUser]={
    var allActives:List[RegisteredUser] =List()
    val keys =allActiveExpertMapByFloor.keys.toList
    for(cl<-0 to keys.length-1){
      val optList =allActiveExpertMapByFloor.get(keys(cl))
      if(optList.isDefined)
        allActives = allActives ::: optList.get.values.toList
    }
    allActives = allActives ::: allActiveExpertMap.values.toList
    allActives
  }

  def removeExpertFromActive(registeredUser: RegisteredUser,floorId:String=""):Boolean={
    val tmpHashId =registerUserHashId(registeredUser)
    def removeFromMap_inline(activeMap:HashMap[String,RegisteredUser],user:RegisteredUser,hashId:String):Boolean = {
      var bRet:Boolean = false
      if (activeMap.get(hashId).isDefined) {
        activeMap -= hashId
        lastUpdatedOfExpert -=hashId
        bRet = true
      }
      bRet
    }
    if(floorId !=""){
      val optMap =allActiveExpertMapByFloor.get(floorId)
      var bRet:Boolean = false
      if (optMap.isDefined){
        bRet =removeFromMap_inline(optMap.get,registeredUser,tmpHashId)
      }
      bRet
    }else{
      var bRet:Boolean =false
      bRet =removeFromMap_inline(allActiveExpertMap,registeredUser,tmpHashId)
      if(!bRet) {
        allActiveExpertMapByFloor.values.foreach{ floorMap =>
          if(removeFromMap_inline(floorMap,registeredUser,tmpHashId))
            return true
        }
      }
      bRet
    }
  }

  private def msgMeetingHours(credential:GlanceCredential,floorId:String,visitingDay:String): Unit =
  {
    val meetingMinutes =meetingHoursMap.getOrElse(floorId,defaultMeetingHours)
    val meetingHours:GlanceMeetingHours =new GlanceMeetingHours(glanceOrgId=credential.glanceOrgId,floorId=floorId,visitingDay=visitingDay,meetingMinutes=meetingMinutes)
    var meetingHourObj =Json.toJson(meetingHours).as[JsObject]
    meetingHourObj = ComUtils.removeObjectCommonProperties(meetingHourObj)
    val hours =(meetingHours.meetingMinutes/60.0).toInt
    meetingHourObj += (ComUtils.CONST_PROPERTY_MEETINGHOURS -> JsNumber(hours))
    GlanceWebSocketActor.broadcastMessageToFloorId(floorId,ComUtils.CONST_WS_EVENT_UPDATE,meetingHourObj)
  }

  def updateMeetingHours(credential:GlanceCredential,floorId:String,visitingDay:String,assignedDefault:Double=0.0): Unit ={

    def checkVisitingDayAndSend_inline(floorId:String): Unit ={
      if(visitingDay=="")
        msgMeetingHours(credential,floorId,ComUtils.getDayString())
      else
        msgMeetingHours(credential,floorId,visitingDay)
    }

    if(assignedDefault > 0.000001) //compare to check that value is not zero.
    {
      meetingHoursMap(floorId) =assignedDefault
      checkVisitingDayAndSend_inline(floorId)
      return
    }

    val optFloorExperts = allActiveExpertMapByFloor.get(floorId)
    if (!optFloorExperts.isDefined){
      checkVisitingDayAndSend_inline(floorId)
      return
    }
    val floorExperts =optFloorExperts.get
    val optMeetingMinutes = meetingHoursMap.get(floorId)
    if (!optMeetingMinutes.isDefined) {
      checkVisitingDayAndSend_inline(floorId)
      return
    }
    meetingHoursMap(floorId) = optMeetingMinutes.get + floorExperts.values.toList.length*0.5
    checkVisitingDayAndSend_inline(floorId)
    if(visitingDay!=""){
      GlanceMeetingHours.setMeetingHours(credential,floorId,visitingDay,meetingHoursMap(floorId)).map{bRet =>
        if(!bRet)
          Logger.warn(s"Failed to update meeting Minutes for floorId:$floorId  visitingDay:$visitingDay")
      }
    }
  }

  def checkExpertExpired(registeredUser: RegisteredUser):Boolean={
    //if fixed location, never expired.
    if(registeredUser.fixedLocation){
      return false
    }
    val tmpId =registerUserHashId(registeredUser)
    val optUpdateTime =lastUpdatedOfExpert.get(tmpId)
    if (!optUpdateTime.isDefined){
      lastUpdatedOfExpert(tmpId)=new Date().getTime()
      return false
    }
    val currentTime =new Date().getTime()
    if((optUpdateTime.get >currentTime) || (currentTime -optUpdateTime.get)/1000 > defaultExpertMinutes*60)
      true
    else
      false
  }

  private def findMatchedFloorIdOfUser(withDrawUser:RegisteredUser):String={
    if(withDrawUser.position.floorId!="")
      return withDrawUser.position.floorId
    var findExpert =allExpertMap.getOrElse(withDrawUser.id,null)
    if(findExpert!=null && findExpert.position.floorId!="")
      return findExpert.position.floorId
    findExpert =allActiveExpertMap.getOrElse(withDrawUser.id,null)
    if(findExpert!=null && findExpert.position.floorId!="")
      return findExpert.position.floorId
    allActiveExpertMapByFloor.foreach{ floorExperts:(String,HashMap[String,RegisteredUser]) =>
      findExpert =floorExperts._2.getOrElse(withDrawUser.id,null)
      if(findExpert!=null)
        return floorExperts._1
    }
    return ""
  }

  def withDraw(list:List[RegisteredUser],floorId:String=""): Unit ={
    for{
      buildings <-GlanceTrackBuilding.readAll(ComUtils.getCredential()) //fixme
    }yield {
      var withDraw =Json.obj()
      var listObj:mutable.MutableList[JsObject] =new mutable.MutableList[JsObject]()
      //only none fixedLocation assets could be removed(withdraw)....
      list.filter(p => !p.fixedLocation).foreach{ user =>
        var userObj:JsObject =Json.toJson(user).as[JsObject]
        userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(user.position.x.toInt,user.position.y.toInt)))
        userObj = ComUtils.removeObjectCommonProperties(userObj)
        var appendFloorId =floorId
        if(appendFloorId ==""){
          appendFloorId = findMatchedFloorIdOfUser(user)
        }
        if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_FLOORID)){
          userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(appendFloorId))
        }
        if(!userObj.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID) || (userObj \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
          userObj += (ComUtils.CONST_PROPERTY_BUILDINGID ->JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,appendFloorId)))
        listObj += userObj
      }
      withDraw += (ComUtils.CONST_EVENT_PROPERTY_WITHDRAW -> ComUtils.getJsonArray(listObj.toList))
      GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE,Json.toJson(withDraw))
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTWITHDRAW,Json.toJson(withDraw).toString(),new GlanceCredential(glanceOrgId = ComUtils.getTenantOrgId(),glanceUserId = ComUtils.getTenantUserId()))
    }
  }

  def addFixedLocAssets(users:List[RegisteredUser]):Boolean={
    //fixedLocation assets....
    for{
      buildings <-GlanceTrackBuilding.readAll(ComUtils.getCredential()) //read building info for user info build-up
    }yield {
      for (findUser <- users) {
        var join = Json.obj()
        var movement = Json.obj()
        var userObj: JsObject = Json.toJson(findUser).as[JsObject]
        userObj = ComUtils.removeObjectCommonProperties(userObj)
        if (userObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
          userObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(findUser.position.x.toInt, findUser.position.y.toInt)))
        else
          userObj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(findUser.position.x.toInt, findUser.position.y.toInt)))
        userObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(findUser.position.floorId))
        userObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,findUser.position.floorId)))
        userObj += (ComUtils.CONST_PROPERTY_MAPHIERARCHY -> JsString(findUser.position.mapHierarchy))

        if (!userObj.keys.contains(ComUtils.CONST_PROPERTY_ID))
          userObj += (ComUtils.CONST_PROPERTY_ID -> JsString(findUser.id))
        join += (ComUtils.CONST_EVENT_PROPERTY_JOIN -> ComUtils.getJsonArray(List(userObj)))

        movement += (ComUtils.CONST_EVENT_PROPERTY_MOVEMENT -> ComUtils.getJsonArray(List(userObj)))

        if (GlanceWebSocketActor.addExpertToActive(findUser, findUser.position.floorId)) { // if is a new user, send join message
          GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(join))
          GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTJOIN, Json.toJson(join).toString(), ComUtils.getCredential())
        } else {//if is an existing user, send movement message.
          GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_UPDATE, Json.toJson(movement))
          GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_EXPERTMOVEMENT, Json.toJson(movement).toString(), ComUtils.getCredential())
        }
      }
    }
    true
  }

  def checkOutUser(user:RegisteredUser): Unit ={
    withDraw(List(user))
    removeExpertFromActive(user)
  }

  def expireCheck(): Unit ={
    allActiveExpertMap.values.foreach{ user =>
      var list:mutable.MutableList[RegisteredUser] =new mutable.MutableList()
      if(checkExpertExpired(user)) {
        list += user
        removeExpertFromActive(user)
      }
      if(list.length>0){
        withDraw(list.toList)
      }
    }
    allActiveExpertMapByFloor.foreach { (e: (String, HashMap[String, RegisteredUser])) =>
      var list:mutable.MutableList[RegisteredUser] =new mutable.MutableList()
      e._2.values.foreach { user =>
        if (checkExpertExpired(user)) {
          list += user
          removeExpertFromActive(user,e._1)
        }
      }
      if(list.length>0){
        //withdraw all expired users
        withDraw(list.toList,e._1)
      }
    }
  }

  //class to make async for user/device adding
  class GlanceWebOpMapActor extends Actor{
    def receive = {
      case (addedUser:RegisteredUser) =>
        var bFound:Boolean =false
        val finds = allActiveExpertMap.values.toList.filter( p => p.id == addedUser.id)
        if(finds.length>0){
          bFound=true
        }else{
          val actives =allActiveExpertMapByFloor.values.toList
          var cl:Int =0
          while(cl <= actives.length-1 && !bFound){
            val activeList =actives(cl).values.toList.filter( p => p.id ==addedUser.id)
            if(activeList.length>0){
              bFound=true
            }
            cl +=1
          }
        }
        if(!addedUser.fixedLocation || !ComUtils.isDevice(addedUser.category)){
          //if current is fixed location and in active, do nothing
          if (bFound){withDraw(List(addedUser))}
        }else{
          //send message to all client to notify fixed device is added or update position...
          addFixedLocAssets(List(addedUser))
        }
      case _ =>
        Logger.error("Unknown message received in GlanceWebOpMapActor!")
    }
  }

  def getTempMobileClient(macAddress:String):GlanceGuestCheckIn={
    val optGuest =tempMobileClientMap.get(macAddress)
    if (optGuest.isDefined)
      return optGuest.get
    else
      return null
  }
  def removeTempMobileClient(macAddress:String):Boolean ={
      tempMobileClientMap -= macAddress
      true
  }

  def getAllTempClientMacAddresses():List[String] ={
    val list = tempMobileSocketIdMacAddressMap.values.toList
    list
  }

  def updateAllRegister(bBroadcast:Boolean=true):Unit= {
    val credential =ComUtils.getCredential()
    GlanceWebSocketActor.updateAllNActiveExpert(credential).map{ bRet =>
      if(bBroadcast){
        val allRegisters = ComUtils.getJsonArrayExpert(allExpertMap.values.toList,false)
        var registerObj = Json.obj()
        registerObj += (ComUtils.CONST_EVENT_PROPERTY_REGISTER -> allRegisters)
        GlanceWebSocketActor.broadcastMessage(ComUtils.CONST_WS_EVENT_REGISTER,registerObj)
        GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_REGISTER, Json.toJson(registerObj).toString(), credential)
      }
    }
  }

  def getAllTempMobiles(credential: GlanceCredential):List[RegisteredUser] ={
      val tmpList =tempMobileClientMap.values.toList
      val list =tmpList.map((guest:GlanceGuestCheckIn) =>GlanceGuestCheckIn.convertToGuestUser(credential,guest))
      list
  }

  def removeTempMobileViaSocket(socketId:String,credential: GlanceCredential=null):Boolean={
    val optMacAddress =tempMobileSocketIdMacAddressMap.get(socketId)
    if (optMacAddress.isDefined){
      tempMobileClientMap -= optMacAddress.get
      tempMobileSocketIdMacAddressMap -= socketId
      allExpertMap -= optMacAddress.get
    }else{
      Logger.info("No temporay mobile(guest) client is find of socket Id:{}",socketId)
    }
    true
  }

  def getTempMobileGuest(macAddress:String):Option[GlanceGuestCheckIn]={
      val optGuest =tempMobileClientMap.get(macAddress)
      optGuest
  }

  def addNewUserToAllExpertMap(registeredUser: RegisteredUser): Unit ={
    val exist= allExpertMap.getOrElse(registeredUser.id,null)
    if(exist==null)
      allExpertMap(registeredUser.id) =registeredUser
    else
      allExpertMap(registeredUser.id) =registeredUser.copy(position = mergePos(registeredUser.position,exist.position,registeredUser.fixedLocation))
  }

  def addNewGuestToAllExpert(glanceGuestCheckIn: GlanceGuestCheckIn):Unit={
    val credential =ComUtils.getCredential(orgId = glanceGuestCheckIn.glanceOrgId,userId = glanceGuestCheckIn.glanceUserId)
    val newUser = GlanceGuestCheckIn.convertToGuestUser(credential,glanceGuestCheckIn)
    val exist= allExpertMap.getOrElse(newUser.id,null)
    if(exist==null)
      allExpertMap(newUser.id) = newUser
    else
      allExpertMap(newUser.id) = newUser.copy(position = mergePos(newUser.position,exist.position,newUser.fixedLocation))
    //broadcast new added user
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_NEWREGISTER,Json.toJson(newUser).toString(),credential)
  }

  def addTempMobileSocketMacMap(socketId:String,clientAddress:String,macAddress:String,credential: GlanceCredential): Unit ={
    val tmpGuestId = ComUtils.GUEST_ACCOUNT_PREFIX+macAddress.hashCode().toString()
    val glanceGuestCheckIn=new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
      glanceUserId = credential.glanceUserId,
      appName = ComUtils.CONST_GLANCE_APPNAME,
      guestId =tmpGuestId ,
      guestName = tmpGuestId,
      macAddress=macAddress,
      ipAddress = clientAddress)
    tempMobileClientMap(macAddress) =glanceGuestCheckIn
    var tmpUser =GlanceGuestCheckIn.convertToGuestUser(credential,glanceGuestCheckIn)
    val existUser= allExpertMap.getOrElse(tmpUser.id,null)
    if(existUser != null)
      tmpUser = tmpUser.copy(position = mergePos(tmpUser.position,existUser.position,tmpUser.fixedLocation))
    allExpertMap(tmpUser.id) = tmpUser
    tempMobileSocketIdMacAddressMap(socketId) =macAddress
  }

  def mergePos(existPos:GlancePosition,updatePos:GlancePosition,fixedLocation:Boolean=false):GlancePosition={
    if(fixedLocation)
      existPos
    else{
      val x ={
        if(existPos.x>0)
          existPos.x
        else
          updatePos.x
      }
      val y ={
        if(existPos.y>0)
          existPos.y
        else
          updatePos.y
      }
      val fid ={
        if(existPos.floorId!="")
          existPos.floorId
        else
          updatePos.floorId
      }
      val bid ={
        if(existPos.buildingId!="")
          existPos.buildingId
        else
          updatePos.buildingId
      }
      val cid ={
        if(existPos.campusId!="")
          existPos.campusId
        else
          updatePos.campusId
      }

      val mapH ={
        if(existPos.mapHierarchy!="")
          existPos.mapHierarchy
        else
          updatePos.mapHierarchy
      }
      new GlancePosition(x,y,mapH,fid,bid,cid)
    }
  }

  def updateAllNActiveExpert(credential:GlanceCredential): Future[Boolean] ={
      def updateAllAndActive_inline(allExpert:List[RegisteredUser],allActive:List[RegisteredUser]):Boolean ={
        val tmpAllExpertMap:HashMap[String,RegisteredUser]=new HashMap()
        for (userX <- allActive){
          val deviceUsers = RegisteredUser.userToMultiDevices(userX)
          for( user <- deviceUsers){
            val existExpert =allExpertMap.getOrElse(user.id,null)
            if(existExpert!=null) {
              val tmpUser = user.copy(position = mergePos(user.position,existExpert.position,user.fixedLocation))
              tmpAllExpertMap(tmpUser.id)=tmpUser
            }else
              tmpAllExpertMap(user.id)=user
          }
        }
        allExpertMap.clear()
        allExpertMap = tmpAllExpertMap
        true
      }
      for{
        allExpert <- RegisteredUser.readAllConf(credential)
        allGuest <- GlanceGuestCheckIn.readAllGuestAsUser(credential)
        allActive <- RegisteredUser.readAllActive(credential)
      }yield  {
        val tmpMobileUsers =GlanceWebSocketActor.getAllTempMobiles(credential)
        updateAllAndActive_inline(allExpert:::allGuest:::tmpMobileUsers,allActive)
      }
  }

  //need to add last update and last sync value check....
  def getSyncData():String={
      try{
        var AllSyncData:JsObject=Json.obj()
        AllSyncData +=("allExpertMap",Json.toJson(allExpertMap.toMap))
        AllSyncData +=("tempMobileClientMap",Json.toJson(tempMobileClientMap.toMap))
        AllSyncData +=("tempMobileSocketIdMacAddressMap",Json.toJson(tempMobileSocketIdMacAddressMap.toMap))
        AllSyncData +=("meetingHoursMap",Json.toJson(meetingHoursMap.toMap))
        AllSyncData +=("visitingDay",JsString(visitingDay))
        AllSyncData +=("visitingDayByFloor",Json.toJson(visitingDayByFloor.toMap))
        AllSyncData +=("lastUpdatedOfExpert",Json.toJson(lastUpdatedOfExpert.toMap))
        AllSyncData +=("allActiveExpertMapByFloor",Json.toJson(allActiveExpertMapByFloor.map(kv =>(kv._1,kv._2.toMap)).toMap))
        AllSyncData +=("allActiveExpertMap",Json.toJson(allActiveExpertMap.toMap))
        AllSyncData +=("socketFloorIdMap",Json.toJson(socketFloorIdMap.map(kv =>(kv._1,kv._2.toList)).toMap))
        Logger.debug("All SyncData length:"+AllSyncData.toString().length())
        AllSyncData.toString()
      } catch {
        case ex:Throwable =>
          Logger.error("Failed to get all Sync Data,exception:{}",ex.getMessage())
          ""
      }
  }

  def setSyncData(AllSyncData:JsValue):Boolean={
    try{
      //handle allExpertMap
      Logger.debug("**************start to set sync data**********************")
      val allExpertMapTmp =mutable.HashMap((AllSyncData \ "allExpertMap").as[Map[String, RegisteredUser]].toSeq:_*)
      if(allExpertMapTmp!=null && allExpertMapTmp.size>0){
        for (f <- allExpertMapTmp) {
          val exist =allExpertMap.getOrElse(f._1,null)
          if(exist==null)
            allExpertMap(f._1)= f._2
          else
            allExpertMap(f._1)= f._2.copy(position=mergePos(f._2.position,exist.position,f._2.fixedLocation))
        }
      }
      //handle tempMobileClientMap
      val tempMobileClientMapTmp =mutable.HashMap((AllSyncData \ "tempMobileClientMap").as[Map[String,GlanceGuestCheckIn]].toSeq:_*)
      if(tempMobileClientMapTmp!=null && tempMobileClientMapTmp.size>0){
        for (f <- tempMobileClientMapTmp){
          tempMobileClientMap(f._1) = f._2
        }
        tempMobileClientMapTmp.clear()
      }
      //handle tempMobileClientMap
      val tempMobileSocketIdMacAddressMapTmp =mutable.HashMap((AllSyncData \ "tempMobileSocketIdMacAddressMap").as[Map[String,String]].toSeq:_*)
      if(tempMobileSocketIdMacAddressMapTmp!=null && tempMobileSocketIdMacAddressMapTmp.size>0){
        for( f <- tempMobileSocketIdMacAddressMapTmp){
          tempMobileSocketIdMacAddressMap(f._1)= f._2
        }
        tempMobileSocketIdMacAddressMapTmp.clear()
      }
      //handle tempMobileClientMap
      val meetingHoursMapTmp =mutable.HashMap((AllSyncData \ "meetingHoursMap").as[Map[String,Double]].toSeq:_*)
      if(meetingHoursMapTmp!=null && meetingHoursMapTmp.size>0){
        for (f <- meetingHoursMapTmp){
          meetingHoursMap(f._1)= f._2
        }
        meetingHoursMapTmp.clear()
      }
      //handle visiting day
      val visitingDayTmp=(AllSyncData \ "visitingDay").asOpt[String].getOrElse("")
      if(visitingDayTmp!="")
        visitingDay=visitingDayTmp
      //handle visitingDayByFloor
      val visitingDayByFloorTmp =mutable.HashMap((AllSyncData \ "visitingDayByFloor").as[Map[String,String]].toSeq:_*)
      if(visitingDayByFloorTmp!=null && visitingDayByFloorTmp.size>0){
        for (f <- visitingDayByFloorTmp){
          visitingDayByFloor(f._1)= f._2
        }
        visitingDayByFloorTmp.clear()
      }
      //handle lastUpdatedOfExpert
      val lastUpdatedOfExpertTmp = mutable.HashMap((AllSyncData \ "lastUpdatedOfExpert").as[Map[String,Long]].toSeq:_*)
      if(lastUpdatedOfExpertTmp!=null && lastUpdatedOfExpertTmp.size>0){
        for(f <- lastUpdatedOfExpertTmp) {
          lastUpdatedOfExpert.get(f._1) match {
            case Some(expiredTime) =>
              if(expiredTime < f._2)
                lastUpdatedOfExpert(f._1)= f._2
            case None  =>
              lastUpdatedOfExpert(f._1)= f._2
          }
        }
        lastUpdatedOfExpertTmp.clear()
      }
      //handle allActiveExpertMapByFloor
      val allActiveExpertMapByFloorTmp =(AllSyncData \ "allActiveExpertMapByFloor").as[Map[String,Map[String,RegisteredUser]]]
      val allActiveExpertMapByFloorTmp2 =mutable.HashMap(allActiveExpertMapByFloorTmp.map(kv => (kv._1,mutable.HashMap(kv._2.toSeq:_*))).toSeq:_*)
      if(allActiveExpertMapByFloorTmp2!=null && allActiveExpertMapByFloorTmp.size>0){
        for (f <- allActiveExpertMapByFloorTmp2){
          val mapTmp =allActiveExpertMapByFloor.getOrElse(f._1,null)
          if(mapTmp ==null)
            allActiveExpertMapByFloor(f._1) = f._2
          else {
            f._2.foreach( fx => mapTmp(fx._1) =fx._2)
            allActiveExpertMapByFloor(f._1)=mapTmp
            f._2.clear()
          }
        }
        allActiveExpertMapByFloorTmp2.clear()
      }

      //handle allActiveExpertMap
      val allActiveExpertMapTmp =mutable.HashMap((AllSyncData \ "allActiveExpertMap").as[Map[String,RegisteredUser]].toSeq:_*)
      if(allActiveExpertMapTmp!=null && allActiveExpertMapTmp.size>0){
        for ( f <- allActiveExpertMapTmp){
          allActiveExpertMap(f._1)= f._2
        }
        allActiveExpertMapTmp.clear()
      }

      //handle allActiveExpertMapByFloor
      val socketFloorIdMapHash =mutable.HashMap[String, JsValue]() ++ (AllSyncData \ "socketFloorIdMap").as[Map[String, JsValue]]
      def convertFloorSocketList(floorId:String,floorSocketList:JsValue):(String,mutable.MutableList[String])={
         (floorId,mutable.MutableList[String]())
      }
      val socketFloorIdMapTmp:mutable.HashMap[String, mutable.MutableList[String]]=socketFloorIdMapHash.map(kv => convertFloorSocketList(kv._1,kv._2))(collection.breakOut)
      for( f<- socketFloorIdMapTmp){
        val list =socketFloorIdMap.getOrElse(f._1,null)
        if(list!=null && list.size>0){
          socketFloorIdMap(f._1)=(list ++ f._2).distinct
        }else{
          socketFloorIdMap(f._1)=f._2
        }
      }
      Logger.debug("**************end of set sync data**********************")
      true
    }catch{
      case ex:Throwable =>
        Logger.error("Failed to handle all data Sync,exception:{}",ex.getMessage)
        false
    }
  }

  def getAllJoins(campusInfo:(GlanceTrackCampus,List[GlanceTrackBuilding], mutable.HashMap[GlanceTrackBuilding,List[GlanceTrackFloor]])):List[RegisteredUser]={
    val fixedAssets =allExpertMap.values.toList.filter(p => p.fixedLocation)
    var allActives:List[RegisteredUser] = fixedAssets :::  {
      var registeredUsers:List[RegisteredUser]= List()
      for( floorMap <- allActiveExpertMapByFloor) {
        val floorUserList = floorMap._2.values.toList.filter(p => ((p.position!=null) && !(p.position.x<0 && p.position.y<0)))
        val filteredBuildings = campusInfo._3.toList.filter(p => {
          p._2.filter(pf => pf.floorId==floorMap._1).length>0   //found floorId matched buildings.
        })

        val buildIdAlternate:String ={//get matched buildingId
          if(filteredBuildings.length>0)
            filteredBuildings(0)._1.buildingId
          else
            ""
        }
        //append all users of floor to list.
        registeredUsers =registeredUsers ::: floorUserList.map( p=> p.copy(position = {
          if(p.position!=null)
            p.position.copy(floorId = floorMap._1,
              buildingId=buildIdAlternate,
              x ={
                if(p.position.x<0)
                  0
                else
                  p.position.x
              },
              y ={
                if(p.position.y<0)
                  0
                else
                  p.position.y
              })
          else
            new GlancePosition(x=0,y=0,floorId = floorMap._1,buildingId=buildIdAlternate)
        }))
      }
      registeredUsers
    }
    allActives = ComUtils.distinctBy(allActives)(_.macAddress)
    allActives
  }

  def getRefreshInfo(credential:GlanceCredential,
                     sysConf:GlanceSystemConf,
                     clientAddress:String,
                     campusInfo:(GlanceTrackCampus,List[GlanceTrackBuilding], mutable.HashMap[GlanceTrackBuilding,List[GlanceTrackFloor]]),
                     interestPoints:List[GlanceInterestPoint]=List(),
                     glanceZones:List[GlanceZone]=List(),
                     facilities:List[GlanceFacilityResource]=List(),
                     zoneCounting:JsObject,
                     accessPoints:List[GlanceAccessPoint]=List()):JsValue={

    def trackFloor2JsObject_inline(floor:GlanceTrackFloor,glanceZones:List[GlanceZone],facilities:List[GlanceFacilityResource]):JsObject={
      var retObj:JsObject =ComUtils.removeObjectCommonProperties(Json.toJson(floor).as[JsObject])
      val matchZones = glanceZones.filter(p => p.floorId ==floor.floorId && p.zoneEnabled==true)
      val matchFacilities = facilities.filter(p => p.floorId ==floor.floorId)
      var zones:List[JsObject] = List()
      if(matchZones.length > 0 ) {
        for(zone <- matchZones){
          zones ::= {
            var objZone:JsObject =Json.toJson(zone.zone.copy(name =zone.zoneDisplayName, color =GlanceZone.rgbColorToRRGGBB(zone.color))).as[JsObject]
            if(zone.labelPosition.x.toInt!=0 && zone.labelPosition.y.toInt!=0)
              objZone += (ComUtils.CONST_PROPERTY_LABELPOSITION -> Json.toJson(zone.labelPosition))
            objZone += (ComUtils.CONST_PROPERTY_ID -> JsString(zone.zoneId))
            objZone += (ComUtils.CONST_PROPERTY_TEMPORARY -> JsBoolean(zone.temporary))
            objZone = ComUtils.removeObjectCommonProperties(objZone)
            objZone
          }
        }
      }
      retObj += (ComUtils.CONST_PROPERTY_ZONES -> ComUtils.getJsonArray(zones))
      retObj += (ComUtils.CONST_PROPERTY_FACILITIES -> ComUtils.getJsonArray(matchFacilities.map(x => {
        val tmpObj = ComUtils.removeObjectCommonProperties(Json.toJson(x).as[JsObject])
        tmpObj
      })))
      retObj
    }
    def getCampusSettings(glanceZones:List[GlanceZone], facilities:List[GlanceFacilityResource]):JsObject={
      if(campusInfo._1 ==null)
        return Json.obj()
      var listObj:mutable.MutableList[JsObject] =new mutable.MutableList[JsObject]
      var valObj = ComUtils.removeObjectCommonProperties(Json.toJson(campusInfo._1).as[JsObject])
      val buildingFloorMap =campusInfo._3
      val keysOfBuiding =buildingFloorMap.keys.toList
      for(keyBuilding <- keysOfBuiding) {
        val tmpList:List[GlanceTrackFloor] = buildingFloorMap(keyBuilding)
        var building = ComUtils.removeObjectCommonProperties(Json.toJson(keyBuilding).as[JsObject])
        building += (ComUtils.CONST_PROPERTY_FLOORS -> ComUtils.getJsonArray(tmpList.map((x:GlanceTrackFloor) => trackFloor2JsObject_inline(x,glanceZones,facilities))))
        if(building.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
          building -= ComUtils.CONST_PROPERTY_POSITION
        building += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(keyBuilding.position.x.toInt,keyBuilding.position.y.toInt)))
        listObj += building
      }
      valObj += (ComUtils.CONST_PROPERTY_BUILDINGS -> ComUtils.getJsonArray(listObj.toList))
      valObj

    }

    def getCampusInfo():JsObject={
      var staff =Json.obj()
      val allActives=getAllJoins(campusInfo)
      staff += (ComUtils.CONST_PROPERTY_JOIN-> (ComUtils.getJsonArrayExpert(allActives) ++ ComUtils.getJsonArrayArea(interestPoints) ))
      var uiConfig =Json.obj()
      uiConfig += (ComUtils.CONST_PROPERTY_TITLE ->JsString(sysConf.companyName))
      uiConfig += (ComUtils.CONST_PROPERTY_LOGOURL ->JsString("/api/v1/logo/logo.png"))
      staff += (ComUtils.CONST_PROPERTY_UICONFIG -> uiConfig)
      val register =ComUtils.getJsonArrayExpert(allExpertMap.values.toList)
      staff += (ComUtils.CONST_EVENT_PROPERTY_REGISTER ->register)
      val ipad =ComUtils.getJsonArray(List())
      staff += (ComUtils.CONST_PROPERTY_IPAD -> ipad)
      staff += (ComUtils.CONST_PROPERTY_CAMPUS -> getCampusSettings(glanceZones,facilities))
      staff += (ComUtils.CONST_PROPERTY_ZONECOUNTING -> zoneCounting)
      staff += (ComUtils.CONST_PROPERTY_TOTAL -> JsNumber(ComUtils.DEFAULT_GUEST_COUNT))
      staff += (ComUtils.CONST_PROPERTY_APS -> GlanceAccessPoint.getFloorsAccessPoints(accessPoints))
      Logger.debug("staff info:{}",staff.toString())
      staff
    }
    return getCampusInfo()
  }

  def getMsg(event:String, message:JsValue):JsValue ={
    // val dataMsg =Json.obj(
    //      "event" -> event,
    //      "instanceId" -> ComUtils.glanceInstantId,
    //      "data" -> message
    //    )
    //dataMsg
    //for navigation client...
    Logger.debug("Get message of event:{},message:{}",event,message.toString())
    message
  }


  def sendMsg(socketId:String,message:JsValue):Unit={
    socketMap.get(socketId).map{ receiveActor =>
      Logger.info("Socket SendMsg to socketId:{},message:{}",socketId,message.toString())
      receiveActor ! message
    }
  }

  class GlanceExpireCheckClientInfoDefferQueryActor extends Actor {
    val todo = scala.collection.mutable.Map[String, GlanceCredential]()
    val todoClientInfo = scala.collection.mutable.Map[String, (String,GlanceCredential)]()
    val todoClientInfoCompleted = scala.collection.mutable.MutableList[String]()
    val todoTryCount = scala.collection.mutable.Map[String, Int]()

    def receive = {
      case (socketId:String,clientAddress:String,credential:GlanceCredential) =>
        for{
          sysConf <- GlanceSystemConf.readConf(credential)
          buildings <- GlanceTrackBuilding.readAll(credential)
          optScreenInfo <- GlanceScreenToTrackFloor.readByClientAddress(credential,clientAddress)
          macAddress <- {
            if (optScreenInfo.isDefined)
              Future {""}
            else
              RegisteredUser.getMacAddress(sysConf, credential, clientAddress)
          }
          optRegisteredUser <- RegisteredUser.readRegisteredUserByMac(credential,macAddress)
          optGlanceGuest <- GlanceGuestCheckIn.readRegisteredGuestByMac(credential,macAddress)
          bAddGuest  <- {
            if(macAddress != "" && (!optRegisteredUser.isDefined) && (!optGlanceGuest.isDefined)){
              val guestCheckIn = createTempGuestUser(macAddress,clientAddress,sysConf,credential)
              GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
            }else{
              Future{true}
            }
          }
          position <- queryClientPositionOfCMX(macAddress,clientAddress,credential)
        } yield {
          def getClientInfo(macAddress:String):JsValue={
            var msg =Json.obj()
            msg += (ComUtils.CONST_PROPERTY_MACADDRESS -> JsString(macAddress))
            msg += (ComUtils.CONST_PROPERTY_SCALE ->JsNumber(ComUtils.DEFAULT_SCALE_RATE))
            if (optScreenInfo.isDefined) {
              //GlanceWebSocketActor.addToScreenSocketMap(socketId,clientAddress, macAddress)
              msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_SCREEN))
              msg += (ComUtils.CONST_PROPERTY_ID -> JsString(optScreenInfo.get.screenId))
              msg += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(optScreenInfo.get.floorId))
              if(!msg.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID) || (msg \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
                msg += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,optScreenInfo.get.floorId)))
              msg += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(optScreenInfo.get.screenPosition.x.toInt, optScreenInfo.get.screenPosition.y.toInt)))
              msg += (ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN -> JsBoolean(optScreenInfo.get.showAllDevicesOnScreen))
            } else {
              if (macAddress != "" && (!optRegisteredUser.isDefined) && (!optGlanceGuest.isDefined)) {
                GlanceWebSocketActor.addTempMobileSocketMacMap(socketId, clientAddress, macAddress, credential)
              }
              msg += (ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN -> JsBoolean(false)) //fixme ----
              if(optRegisteredUser.isDefined) {
                msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_EXPERT))
                msg += (ComUtils.CONST_PROPERTY_ID -> JsString(optRegisteredUser.get.id))
              }else if(optGlanceGuest.isDefined) {
                msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_GUEST))
                msg += (ComUtils.CONST_PROPERTY_ID -> JsString(optGlanceGuest.get.id))
              }else {
                msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_VISITOR))
                msg += (ComUtils.CONST_PROPERTY_ID -> JsString(ComUtils.GUEST_ACCOUNT_PREFIX+macAddress.hashCode().toString))
              }
              if (position != null) {
                msg += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(position.x.toInt, position.y.toInt)))
                msg += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(position.floorId))
                if(!msg.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID) || (msg \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
                  msg += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,position.floorId)))
              }
            }
            Logger.debug("Send WS Client Info:{}",msg.toString())
            var clientInfo =Json.obj(ComUtils.CONST_EVENT_PROPERTY_WHOAMI -> msg)
            if(macAddress!=""){
              val register =ComUtils.getJsonArrayExpert(allExpertMap.values.toList,false)
              clientInfo += (ComUtils.CONST_EVENT_PROPERTY_REGISTER ->register)
            }
            clientInfo
          }
          if(macAddress!="" || (optScreenInfo.isDefined)){
            GlanceWebSocketActor.sendMsg(socketId,GlanceWebSocketActor.getMsg(ComUtils.CONST_WS_EVENT_WHOAMI,getClientInfo(macAddress)))
            //if is temp mobile device...
            if(macAddress!="" /*&& (!optGlanceGuest.isDefined)*/)
            {
              if(!optRegisteredUser.isDefined && !optGlanceGuest.isDefined)
                GlanceWebSocketActor.addTempMobileSocketMacMap(socketId,clientAddress,macAddress,credential)
              //GlanceWebSocketActor.updateAllRegister()
              NotificationService.handleClientPositionSnapshot(credential,clientAddress,macAddress)
              listenNotificationForAllFloors(credential)
            }
          }else{
            // if can not get the mac address of client just let shedule service to do this
            todoClientInfo +=(socketId -> (clientAddress,credential))
            todoTryCount   +=(socketId -> 0)
          }
        }

      case (floorId: String, credential: GlanceCredential) =>
        todo += (floorId -> credential)
        Logger.info("GlanceExpireCheckClientInfoDefferQueryActor schedule service add tracking floors:{}",floorId)
      case "!" =>   /*schedule service duration trigger*/
        Logger.info("GlanceExpireCheckClientInfoDefferQueryActor schedule service:"+todo.size)
        GlanceWebSocketActor.expireCheck()
        todo.keys.foreach{ floorId =>
          //send visitors for each FloorId, not implement yet.
        }
        //clean the completed
        for (cl <- 0 to todoClientInfoCompleted.length - 1) {
          todoClientInfo -= todoClientInfoCompleted(cl)
        }
        todoClientInfoCompleted.clear()
        //check client info...
        todoClientInfo.foreach{ clientInfo:(String,(String,GlanceCredential)) =>
          for{
            sysConf <- GlanceSystemConf.readConf(clientInfo._2._2)
            buildings <- GlanceTrackBuilding.readAll(clientInfo._2._2)
            macAddress <- RegisteredUser.getMacAddress(sysConf,clientInfo._2._2,clientInfo._2._1)
            optRegisteredUser <- RegisteredUser.readRegisteredUserByMac(clientInfo._2._2,macAddress)
            optGlanceGuest <- GlanceGuestCheckIn.readRegisteredGuestByMac(clientInfo._2._2,macAddress)
            bAddGuest  <-{
              if(macAddress!="" && optRegisteredUser.isEmpty && optGlanceGuest.isEmpty)
              {
                val appName = "Glance.selfRegistration"
                val phoneNumber: String = ""
                val email: String = ""
                val guestId =ComUtils.GUEST_ACCOUNT_PREFIX + macAddress.hashCode().toString()
                val credential =clientInfo._2._2
                val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
                  glanceUserId = credential.glanceUserId,
                  appName = appName,
                  guestId = guestId,
                  guestName= guestId,
                  ipAddress = clientInfo._2._1,
                  macAddress = "", //temp create guest user, no mac address..
                  phoneNumber = phoneNumber,
                  email = email,
                  checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
                  checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
                  checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
                  notificationCallback = "")
                GlanceGuestCheckIn.addOrUpdate(credential,guestCheckIn)
              }else{
                Future{true}
              }
            }
            position <- queryClientPositionOfCMX(macAddress,clientInfo._2._1,clientInfo._2._2)
          } yield {
            if(macAddress!=""){
              if (optRegisteredUser.isEmpty && optGlanceGuest.isEmpty)
                GlanceWebSocketActor.addTempMobileSocketMacMap(clientInfo._1, clientInfo._2._1, macAddress, clientInfo._2._2)
              GlanceWebSocketActor.sendMsg(clientInfo._1,GlanceWebSocketActor.getMsg(ComUtils.CONST_EVENT_PROPERTY_WHOAMI,getClientInfoMsg(macAddress,optRegisteredUser,optGlanceGuest,position,buildings)))
              listenNotificationForAllFloors(clientInfo._2._2)
              NotificationService.handleClientPositionSnapshot(clientInfo._2._2,clientInfo._2._1,macAddress)
              todoClientInfoCompleted += clientInfo._1
            }else{
              todoTryCount.get(clientInfo._1).map{ count =>
                if(count >ComUtils.MAX_MACADDRESS_QUERY_TIMES){
                  todoClientInfoCompleted += clientInfo._1
                }else{
                  todoTryCount(clientInfo._1) = (count+1)
                }
              }
            }
          }
        }
      //todo.clear()
      case floorId:String =>   //remove the floorId...
        todo -= floorId
    }

    //class helper functions
    def getClientInfoMsg(macAddress:String,
                         optRegisteredUser:Option[RegisteredUser],
                         optGlanceGuest:Option[RegisteredUser],
                         position:GlancePosition,
                         buildings:List[GlanceTrackBuilding]):JsValue={
      var msg =Json.obj()
      msg += (ComUtils.CONST_PROPERTY_MACADDRESS -> JsString(macAddress))
      msg += (ComUtils.CONST_PROPERTY_SCALE ->JsNumber(ComUtils.DEFAULT_SCALE_RATE))

      if(optRegisteredUser.isDefined)
      {
        msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_EXPERT))
        msg += (ComUtils.CONST_PROPERTY_ID -> JsString(optRegisteredUser.get.id))
      }
      else if(optGlanceGuest.isDefined)
      {
        msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_GUEST))
        msg += (ComUtils.CONST_PROPERTY_ID -> JsString(optGlanceGuest.get.id))
      }
      else
      {
        msg += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString(ComUtils.SMART_DEVICE_TYPE_VISITOR))
        msg += (ComUtils.CONST_PROPERTY_ID -> JsString(ComUtils.GUEST_ACCOUNT_PREFIX+macAddress.hashCode().toString))
      }
      msg += (ComUtils.CONST_PROPERTY_SHOWALLDEVICESONSCREEN -> JsBoolean(false)) //by default show person ----
      if(position!=null){
        msg += (ComUtils.CONST_PROPERTY_POSITION ->ComUtils.getJsonArrayInt(List(position.x.toInt,position.y.toInt)))
        msg += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(position.floorId))
        if(!msg.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID) || (msg \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
          msg += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(GlanceTrackBuilding.findMatchBuildingIdByFloorId(buildings,position.floorId)))
      }
      //Logger.info("Send WS Client Info:{}",msg.toString())
      var clientInfo =Json.obj(ComUtils.CONST_EVENT_PROPERTY_WHOAMI -> msg)
      if(macAddress!=""){
        val register =ComUtils.getJsonArrayExpert(allExpertMap.values.toList,false)
        clientInfo += (ComUtils.CONST_EVENT_PROPERTY_REGISTER ->register)
      }
      clientInfo
    }

    def createTempGuestUser(macAddress:String,
                            clientAddress:String,
                            sysConf:GlanceSystemConf,
                            credential:GlanceCredential):GlanceGuestCheckIn={
      val guestId =ComUtils.GUEST_ACCOUNT_PREFIX + macAddress.hashCode().toString()
      val guestCheckIn = new GlanceGuestCheckIn(glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        appName = "Glance.selfRegistration",
        guestId = guestId,
        guestName= guestId,
        ipAddress = clientAddress,
        macAddress = "", //temp create guest user, no mac address..
        phoneNumber = "",
        email = "",
        checkInDay = ComUtils.getDayString(sysConf.defaultTimeZone),
        checkInHour = ComUtils.getHourString(sysConf.defaultTimeZone),
        checkInMinute = ComUtils.getMinuteString(sysConf.defaultTimeZone),
        notificationCallback = "")
      guestCheckIn
    }

    def queryClientPositionOfCMX(macAddress:String,clientAddress:String,credential: GlanceCredential):Future[GlancePosition]={
      if(macAddress =="" || clientAddress==""){
        Future{null}
      }else{
        for{
          sysConf <- GlanceSystemConf.readConf(credential)
          allFloors <-GlanceTrackFloor.readAll(credential)
          mapSizes<- GlanceMapSizeInfo.readAllConf(credential)
          optWireInfo<-RegisteredUser.getClientPosition(sysConf,credential,clientAddress)
        } yield {
          if(!(optWireInfo.isDefined && allFloors.length>0)) {
            Logger.warn("No position info found!")
            null
          }else{
            val positions = optWireInfo.get.asOpt[List[JsValue]].getOrElse(List());
            if(positions.length <= 0) {
              Logger.warn("No position length ==0!")
              null
            }else{
              val info = positions(0)
              val locationMapHierarchy = (info \ "mapInfo" \ "mapHierarchyString").asOpt[String].getOrElse("")
              val locationCoordinate = (info \ "mapCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders).getOrElse(new MapCoordinate())
              val matchFloors: List[GlanceTrackFloor] = GlanceTrackFloor.findMatchFloors(allFloors, locationMapHierarchy)
              if(matchFloors.length>0) {
                val (_, positionArray) =NotificationService.getPositionArr(locationCoordinate,matchFloors(0),null,mapSizes)
                new GlancePosition(positionArray(0).toLong, positionArray(1).toLong, locationMapHierarchy, matchFloors(0).floorId)
              }else{
                Logger.warn("No position floor is matched:{}",locationMapHierarchy)
                null
              }
            }
          }
        }
      }
    }
  }
}

//web socket handler class.
class GlanceWebSocketActor(id:String,credential:GlanceCredential,out: ActorRef) extends Actor {
  import scala.concurrent.ExecutionContext.Implicits.global
  val socketId =id
  val outActor =out
  val socketCredential=credential
  var iPadId:String =""
  override def postStop() = {
      Logger.info("Web socket connection disconnected, id:{}",id)
      GlanceWebSocketActor.removeSocket(id)
      CMXVisitorScan.removeTrackFloorVisitors(socketCredential)
      if(iPadId!="")
        GlanceWebSocketActor.removeIPadSocket(iPadId)
      GlanceWebSocketActor.removeTempMobileViaSocket(socketId,socketCredential)
  }

  def handleClientNotification(msgObj:JsObject): Unit =
  {
      val eventName= (msgObj \ "event").asOpt[String].getOrElse("unknown")
      Logger.debug("Received Client Message:{}",msgObj.toString())
      if(eventName!=ComUtils.WS_EVENT_CLIENT_NOTIFICATION)
          return
      val eventData:JsObject = (msgObj \ ComUtils.CONST_PROPERTY_DATA).asOpt[JsObject].getOrElse(Json.obj())
      if(eventData.keys.contains(ComUtils.CONST_PROPERTY_ID)){
        //for ipad clients, will send client Id to identify devices
        iPadId =(eventData \ ComUtils.CONST_PROPERTY_ID).asOpt[String].getOrElse("")
          if(iPadId!=""){
            GlanceWebSocketActor.mapIPadSocket(socketId,iPadId)
          }
      }
      //data including the floor ID:
      if(eventData.keys.contains(ComUtils.CONST_PROPERTY_FLOORID))
      {
          val floorId =(eventData \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse("default")
          //GlanceMeetingHours.trackFloorMeetingHours(floorId,socketCredential)
      }
  }

  def handleIPadNotification(msgObj:JsObject): Unit ={
    //message hanlde to ping device navigation path to iPad devices, just relay the message to iPad devices.
    try
    {
      val eventName= (msgObj \ "event").asOpt[String].getOrElse("unknown")
      if(eventName!=ComUtils.WS_EVENT_IPAD)
        return
      val eventObj:JsObject = (msgObj  \ ComUtils.CONST_PROPERTY_DATA).asOpt[JsObject].getOrElse(Json.obj())
      if(!eventObj.keys.contains("locate"))
        return
      val locate:JsObject =(eventObj \ "locate").asOpt[JsObject].getOrElse(Json.obj())
      val terminalId = (locate \ "terminal").asOpt[String].getOrElse("")
      if(terminalId=="")
        return
      GlanceWebSocketActor.sendMessageToIPad(terminalId,msgObj)
    }catch{
      case e:Throwable =>
        Logger.error("Unknown IPad Notification Message:{},exception:{}",Json.toJson(msgObj).toString(),e.getMessage)
    }
  }

  def handleReceivedMsg(msgData:JsValue): Unit ={
    def handleFormattedMsg(msgObj:JsObject): Unit ={
      if(msgObj.keys.contains("event")){
        val event =(msgObj \ "event").asOpt[String].getOrElse("unknown")
        event match{
          case ComUtils.WS_EVENT_CLIENT_NOTIFICATION =>
            handleClientNotification(msgObj)
          case ComUtils.WS_EVENT_IPAD                =>
            handleIPadNotification(msgObj)
          case _                                     =>
            Logger.info("Unknown event type:{}, event Data:{}",event,Json.toJson(msgData).toString())
        }
      }else{
        Logger.info("Received message is unknown message:{}",msgData.toString())
      }
    }

    try {
      val msgObj = msgData.as[JsObject]
      handleFormattedMsg(msgObj)
    }catch {
      case e:Throwable =>
        Logger.error("Received message is not a valid Json Object,exception:{}",e.getMessage())
    }
  }

  def receive = {
    //message from web socket....
    case msg: String =>
      {
        Logger.debug("Web socket received message:{}",msg)
        def parseMsg(msgStr:String):JsValue ={
          try {
            Json.parse(msgStr)
          } catch {
              case NonFatal(e) => Json.obj("event" -> msgStr)
          }
        }
        handleReceivedMsg(parseMsg(msg))
      }
    //message from local to server.
    case msg:JsValue =>
        sendMsg(msg)

    case (msgType:String,socketId:String,credential:GlanceCredential,clientAddress:String) =>
      Logger.info("Message for websocket staff refresh ....!")
      msgType match{
        case ComUtils.WS_EVENT_INTERNAL_REFRESH_STAFF =>
          for{
            bUpdateSysZone <- {
              GlanceZone.updateAllSysZones(credential)
            }
            bRet <- {
              GlanceWebSocketActor.updateAllNActiveExpert(credential)
            }
            sysConf <- {
              GlanceSystemConf.readConf(credential)
            }
            campusInfo <- {
              GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
            }
            interestPoints <- {
              GlanceInterestPoint.readAll(credential)
            }
            glanceZones <- {
              GlanceZone.readAllConf(credential.glanceOrgId)
            }
            facilities <- {
              GlanceFacilityResource.readAll(credential)
            }
            zoneCounting <- {
              Visitor.getHeatmapOfVisitorsByZones("all","",credential)
            }
            cachedConnectedDevices <- {
              GlanceAssociationIPMacAddress.readAllCachedIPMappings(credential)
            }
            accessPoints <- {
              GlanceAccessPoint.readAllCombineConnectedDevice(credential,cachedConnectedDevices)
            }
            msg <-Future{
              GlanceWebSocketActor.getRefreshInfo(credential,sysConf,clientAddress,campusInfo,interestPoints,glanceZones,facilities,zoneCounting)}
          } yield  {
            val staffMsg = GlanceWebSocketActor.getMsg("staff",msg)
            sendMsg(staffMsg)
            //out ! staffMsg
            Logger.debug("Sent out the staff msg to client:{}",staffMsg.toString())
          }
        case _ =>
          Logger.error("Unknown web socket async internal message type:{},socketId:{},clientAddress:{}",msgType,socketId,clientAddress)
      }
    case _ =>
      Logger.error("WebSocket got unknown data received!")
  }

  def sendMsg(msg:JsValue) ={
    out ! (msg)
  }

}


