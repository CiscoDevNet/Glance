package models.glance

import akka.actor.{Props, Actor}
import controllers.glance.GlanceWebSocketActor
import models._
import models.common.GlanceStatus
import models.glance.guestaccess.GlanceGuestCheckIn
import play.Logger
import play.api.libs.json.{JsArray, JsObject, Json}
import play.api.libs.ws.{WSAuthScheme, WSResponse, WS, WSRequestHolder}
import play.api.Play.current
import services.security.GlanceCredential
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.Future
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global


/**
 * Created by kennych on 11/24/15.
 */
case class GlanceNotificationSubscription (glanceId: String,
                                           id: String,
                                           filters: List[String] = List(),
                                           data: JsObject = Json.obj())
object GlanceNotificationSubscription {
  implicit val tolerantGlanceNotificationSubscriptionReaders = new Reads[GlanceNotificationSubscription] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceNotificationSubscription(
        (js \ "glanceId").as[String],
        (js \ ComUtils.CONST_PROPERTY_ID).as[String],
        (js \ "filters").asOpt[ List[String]].getOrElse(List()),
        (js \ "data").asOpt[JsObject].getOrElse(Json.obj())
      ))
    }
  }

  def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 2*60*1000) : WSRequestHolder = {
      Logger.debug("URI:"+s"$baseUri$api")
      val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
      holder.withHeaders("Content-Type" -> "application/json")
      if(json) holder.withHeaders("Accept" -> "application/json")
      else holder
  }

  def putSubscribeData(cmxConf:GlanceSystemConf,subscribeData:JsValue,needContentLength:Boolean=true):Future[Option[JsValue]] ={
    val holder: WSRequestHolder = createRequest(cmxConf,ComUtils.getBaseUri(cmxConf),cmxConf.glanceCmxSetting.cmxNotificationPath)
    if(needContentLength){
      Logger.info(""+subscribeData.toString().length())
      holder.withHeaders("Content-Length" -> (""+subscribeData.toString().length()))
    }
    val response = (response: WSResponse) => {
      response.status match {
        case 201 =>
          Logger.debug("PUT SubscribeData success:");
          Some(Json.toJson(GlanceStatus.successStatus("Update subscriber success!")))
        case 200 =>
          Logger.debug("PUT SubscribeData success");
          Some(Json.toJson(GlanceStatus.successStatus("Update subscriber success!")))
        case _ =>
          Logger.error("PUT SubscribeData failed,code:"+response.status.toString()+" with msg:"+subscribeData.toString)
          None
      }
    }
    holder.put(subscribeData).map(response).recover{
      case _ =>
        Logger.error("PUT SubscribeData failed, exception")
        None
    }
  }

  def getEventName(cmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,eventNameEx:String):String={
    val pathEx =cmxConf.assignedTenantId+glanceTrackFloor.floorId+eventNameEx
    pathEx
  }

  def deleteSubscribe(cmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,eventNameEx:String):Future[Boolean] ={
    val pathEx ="/"+getEventName(cmxConf,glanceTrackFloor,eventNameEx)
    val holder: WSRequestHolder = createRequest(cmxConf,ComUtils.getBaseUri(cmxConf),cmxConf.glanceCmxSetting.cmxNotificationPath+pathEx)
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.debug("Delete SubscribeData success:"+pathEx+" status:"+response.status);
          true
        case _ =>
          Logger.error("Delete SubscribeData failed:"+pathEx+" status:"+response.status)
          false
      }
    }
    holder.delete().map(response).recover{
      case _ =>
        if(ComUtils.hierarchyLevel(glanceTrackFloor.hierarchy)>=3) //only cmx hierarchy, when try to delete the subscriber info
          ComUtils.outputErrorMsg("DELETE SubscribeData failed, exception:"+pathEx)
        false
    }
  }

  def getCallbackPath(credential:GlanceCredential,conf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor):String={
    val tmpUri ="{}/{}/{}".format(conf.glanceCmxSetting.cmxNotificationPath,credential.glanceOrgId,glanceTrackFloor.floorId)
    tmpUri
  }
  def getSubscribeData(credential:GlanceCredential,eventNameEx:String,cmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,subscribeEventData:JsObject):JsValue ={
    var bHttps:Boolean =false
    if(cmxConf.glanceReceiverSetting.receiverHostPort==443)
      bHttps=true
    val transport =Json.obj("type" -> "TransportHttp",
                            "hostAddress" -> cmxConf.glanceReceiverSetting.receiverHostName,
                            "port" -> cmxConf.glanceReceiverSetting.receiverHostPort,
                            "https" -> bHttps,
                            "urlPath" -> getCallbackPath(credential,cmxConf,glanceTrackFloor))
    val notificationReceiver =Json.obj("transport" ->transport)
    val subscribedEvents:JsArray =ComUtils.getJsonArray(List(subscribeEventData))
    val subscribeData =Json.obj("name" -> getEventName(cmxConf,glanceTrackFloor,eventNameEx),
                                "notificationType" -> "EVENT_DRIVEN",
                                "dataFormat" ->"JSON",
                                "NotificationReceiverInfo" ->notificationReceiver,
                                "subscribedEvents" ->subscribedEvents
    )
    subscribeData
  }

  def getSubscribeEvent(eventName:String,Filters:List[String],additions:List[scala.Tuple2[String, JsValue]]):JsObject ={
    var subscribeEvent:JsObject =Json.obj("type" ->eventName,"entityFilters" ->ComUtils.getJsonArrayStr(Filters),"eventEntity" ->"WIRELESS_CLIENTS")
    additions.foreach{ addition =>
      subscribeEvent += addition
    }
    subscribeEvent
  }

  def subscribeMovementNotification(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,filters:List[String]): Future[Boolean] ={
    if(filters==null || filters.length <=0){
      deSubscribeMovementNotification(credential,glanceCmxConf,glanceTrackFloor)
    }else{
      val subscribeEventData =getSubscribeEvent(ComUtils.movementEventTrigger,filters,List(("moveDistanceInFt" -> JsNumber(1))))
      val subscribeData:JsValue = getSubscribeData(credential,ComUtils.movementTriggerEx,glanceCmxConf,glanceTrackFloor,subscribeEventData)
      putSubscribeData(glanceCmxConf, subscribeData).map{optJsData =>
        optJsData.isDefined
      }
    }
  }

  def deSubscribeMovementNotification(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.movementTriggerEx)
  }

  def subscribeContainmentNotification(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,filters:List[String]): Future[Boolean] ={
    if(filters==null || filters.length <=0){
      deSubscribeContainmentNotification(credential,glanceCmxConf,glanceTrackFloor)
    }else{
      val subscribeEventData =getSubscribeEvent(ComUtils.containmentEventTrigger,filters,List(("boundary" -> JsString("INSIDE")),("zoneTimeout" ->JsNumber(1))))
      val subscribeData:JsValue = getSubscribeData(credential,ComUtils.containmentTriggerEx,glanceCmxConf,glanceTrackFloor,subscribeEventData)
      putSubscribeData(glanceCmxConf, subscribeData).map{optJsData =>
        optJsData.isDefined
      }
    }
  }

  def deSubscribeContainmentNotification(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.containmentTriggerEx)
  }

  def subscribeContainmentNotificationOutside(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,filters:List[String]): Future[Boolean] ={
    if(filters==null || filters.length <=0){
      deSubscribeContainmentNotificationOutside(credential,glanceCmxConf,glanceTrackFloor)
    }else{
      val subscribeEventData =getSubscribeEvent(ComUtils.containmentEventTrigger,filters,List(("boundary" -> JsString("OUTSIDE")),("zoneTimeout" ->JsNumber(1))))
      val subscribeData:JsValue = getSubscribeData(credential,ComUtils.containmentOutsideTriggerEx,glanceCmxConf,glanceTrackFloor,subscribeEventData)
      putSubscribeData(glanceCmxConf, subscribeData).map{optJsData =>
        optJsData.isDefined
      }
    }
  }

  def deSubscribeContainmentNotificationOutside(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.containmentOutsideTriggerEx)
  }

  /*For MSE 10.X*/
  def getSubscribeDataV10(eventNameEx:String,eventName:String,cmxConf:GlanceSystemConf, glanceTrackFloor: GlanceTrackFloor,rule:JsObject,subscriber:JsObject):JsArray ={
    val subscribeData:JsObject =Json.obj(
     "name" -> getEventName(cmxConf,glanceTrackFloor,eventNameEx),
     "userId" ->cmxConf.glanceCmxSetting.cmxUserName,
     "rules" -> ComUtils.getJsonArray(List(rule)),
     "subscribers" -> ComUtils.getJsonArray(List(subscriber)),
     "enabled" -> true,
     "enableMacScrambling" -> false,
     "notificationType" -> eventName)
      ComUtils.getJsonArray(List(subscribeData))
  }

  def getRule(conditions:List[scala.Tuple2[String, JsValue]]):JsObject ={
    var listCondition =mutable.MutableList[JsObject]()
    conditions.foreach{ condition =>
        var conditionItem:JsObject =Json.obj()
        conditionItem += condition
        listCondition += conditionItem
    }
    val rule =Json.obj("conditions" -> ComUtils.getJsonArray(listCondition.toList))
    rule
  }

  def getSubscriber(credential:GlanceCredential,cmxConf:GlanceSystemConf, glanceTrackFloor: GlanceTrackFloor):JsObject ={
    val uri =cmxConf.glanceReceiverSetting.receiverProtocol +"://"+cmxConf.glanceReceiverSetting.receiverHostName+":"+cmxConf.glanceReceiverSetting.receiverHostPort+cmxConf.glanceReceiverSetting.receiverCallbackAPIPath+"/"+credential.glanceOrgId+"/"+glanceTrackFloor.floorId
    val receiver =Json.obj("uri" -> uri,"messageFormat" ->"JSON","qos" ->"AT_MOST_ONCE")
    val subscriber =Json.obj("receivers" -> ComUtils.getJsonArray(List(receiver)))
    subscriber
  }

  def subscribeUnAssNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    val rule:JsObject = getRule(List(("condition" -> JsString("association.deviceType == client")),("condition" ->JsString("association.association == false"))))
    val subscriber:JsObject =getSubscriber(credential,glanceCmxConf,glanceTrackFloor)
    val subscriberData =getSubscribeDataV10(ComUtils.unassociation_update_event_prefix,ComUtils.associationEventTrigger,glanceCmxConf,glanceTrackFloor,rule,subscriber)

    putSubscribeData(glanceCmxConf,subscriberData,true).map { optJsData =>
      optJsData.isDefined
    }
  }

  def deSubscribeUnAssNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.unassociation_update_event_prefix)
  }

  def subscribeAssNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    val rule:JsObject = getRule(List(("condition" -> JsString("association.deviceType == client")),("condition" ->JsString("association.association == true"))))
    val subscriber:JsObject =getSubscriber(credential,glanceCmxConf,glanceTrackFloor)
    val subscriberData =getSubscribeDataV10(ComUtils.association_update_event_prefix,ComUtils.associationEventTrigger,glanceCmxConf,glanceTrackFloor,rule,subscriber)

    putSubscribeData(glanceCmxConf,subscriberData,true).map { optJsData =>
      optJsData.isDefined
    }
  }

  def deSubscribeAssNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.association_update_event_prefix)
  }

  def subscribeLocationUpdateNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor, entity_Filters:List[String],iseSupportedUsers:Boolean=false): Future[Boolean] ={
    Logger.info("subscribeLocationUpdateNotificationV10, entry filter length:" +entity_Filters.length)
    if(entity_Filters.length==0 && !(glanceCmxConf.userDataImportSupported && glanceCmxConf.usingInMemoryImportedUserData || iseSupportedUsers)){
      deSubscribeLocationUpdateNotificationV10(credential,glanceCmxConf,glanceTrackFloor)
    }else
    {
      val macAddressList =entity_Filters.mkString(";")+";"
      val rule:JsObject = {
        if(glanceCmxConf.userDataImportSupported && glanceCmxConf.usingInMemoryImportedUserData || iseSupportedUsers)
        {
          getRule(List( ("condition" -> JsString("locationupdate.deviceType == client")),
            ("condition" ->JsString("locationupdate.hierarchy == "+glanceTrackFloor.hierarchy))
          ))
        }else{
          getRule(List( ("condition" -> JsString("locationupdate.deviceType == client")),
          ("condition" ->JsString("locationupdate.hierarchy == "+glanceTrackFloor.hierarchy)),
          ("condition" ->JsString("locationupdate.macAddressList == "+macAddressList))
          ))
        }

      }

      val subscriber:JsObject =getSubscriber(credential,glanceCmxConf,glanceTrackFloor)
      val subscriberData =getSubscribeDataV10(ComUtils.location_update_event_prefix,ComUtils.locationUpdateEventTrigger,glanceCmxConf,glanceTrackFloor,rule,subscriber)

      putSubscribeData(glanceCmxConf,subscriberData,false).map { optJsData =>
        optJsData.isDefined
      }
    }
  }

  def deSubscribeLocationUpdateNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.location_update_event_prefix)
  }

  def subscribeInOutNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor,entity_Filters:List[String], iseSupportedUsers:Boolean=false): Future[Boolean] ={
    Logger.debug("subscribeInOutNotificationV10, entry filter length:" +entity_Filters.length)
    if(entity_Filters.length==0 && !(glanceCmxConf.userDataImportSupported && glanceCmxConf.usingInMemoryImportedUserData || iseSupportedUsers)){
      deSubscribeInOutNotificationV10(credential,glanceCmxConf,glanceTrackFloor).map{ bRet =>
        bRet
      }
    }else{
      val macAddressList =entity_Filters.mkString(";")+";"
      Logger.debug("subscribeInOutNotificationV10 hierarchy:{}"+glanceTrackFloor.hierarchy)
      val rule:JsObject = {
        if(glanceCmxConf.userDataImportSupported && glanceCmxConf.usingInMemoryImportedUserData || iseSupportedUsers)
        {
          getRule(List(("condition" -> JsString("inout.deviceType == client")),
            ("condition" ->JsString("inout.hierarchy == "+glanceTrackFloor.hierarchy))
          ))
        }else{
          getRule(List(("condition" -> JsString("inout.deviceType == client")),
            ("condition" ->JsString("inout.hierarchy == "+glanceTrackFloor.hierarchy)),
            ("condition" ->JsString("inout.macAddressList == "+macAddressList))
          ))
        }
      }
      val subscriber:JsObject =getSubscriber(credential,glanceCmxConf,glanceTrackFloor)
      val subscriberData =getSubscribeDataV10(ComUtils.in_out_event_prefix,ComUtils.inOutEventTrigger,glanceCmxConf,glanceTrackFloor,rule,subscriber)

      putSubscribeData(glanceCmxConf,subscriberData).map { optJsData =>
        optJsData.isDefined
      }
    }
  }

  def deSubscribeInOutNotificationV10(credential:GlanceCredential,glanceCmxConf:GlanceSystemConf,glanceTrackFloor: GlanceTrackFloor): Future[Boolean] ={
    deleteSubscribe(glanceCmxConf, glanceTrackFloor,ComUtils.in_out_event_prefix)
  }

  val listenNotificationActor = ComUtils.system.actorOf(Props(new GlanceNotificationListenActor))

  def listenNotificationForFloor(floorId:String,floorInfo:GlanceTrackFloor,credential: GlanceCredential): Unit ={
    //if hierarchy level less than 3, then it is not a correct floor hierarchy
    if(ComUtils.isCmxServiceType(floorInfo.cmxServiceType) && ComUtils.isCorrectHierarchy(floorInfo.hierarchy)) //here to check if the floor is tracked by traditional CMX server floor
      listenNotificationActor ! (floorId,floorInfo, credential)
    else{
      //if is none traditional cmx floor, just to de-register all notification...
      for{
        sysConf <- GlanceSystemConf.readConf(credential)
        bDeSub <- GlanceNotificationSubscription.deSubscribeAssNotificationV10(credential,sysConf,floorInfo)
        bDeSubLocation <- GlanceNotificationSubscription.deSubscribeLocationUpdateNotificationV10(credential,sysConf,floorInfo)
        bDeSubInout <- GlanceNotificationSubscription.deSubscribeInOutNotificationV10(credential,sysConf,floorInfo)
      }yield {
        Logger.info("De-subscribe all pre-subscribed traditional CMX notification!")
      }
    }

  }

  class GlanceNotificationListenActor extends Actor {
    def listNotifications(sysConf:GlanceSystemConf,credential: GlanceCredential,trackFloor:GlanceTrackFloor): Future[Boolean] ={
      for{
        listMacAddress <- RegisteredUser.readTrackedMacAddress(credential)
        listGuestMacAddress <- GlanceGuestCheckIn.readTrackedMacAddress(credential)
        countOfISEUsers <- RegisteredUser.readISESupportedUsersCount(credential)
        bRetAss <- {
          val bISESupported:Boolean= {countOfISEUsers>0}
          if(bISESupported) {
            GlanceNotificationSubscription.subscribeAssNotificationV10(credential,sysConf,trackFloor)
          }else{
            GlanceNotificationSubscription.deSubscribeUnAssNotificationV10(credential,sysConf,trackFloor)
            GlanceNotificationSubscription.deSubscribeAssNotificationV10(credential,sysConf,trackFloor)
          }
        }
        bRetInOut <-  {
            val bISESupported:Boolean= {countOfISEUsers>0} /*&& false*/
            GlanceNotificationSubscription.subscribeInOutNotificationV10(credential,sysConf,trackFloor,(listMacAddress ::: listGuestMacAddress ::: GlanceWebSocketActor.getAllTempClientMacAddresses()).distinct,bISESupported)
        }
        bRetUpdate<- {
            val bISESupported:Boolean= {countOfISEUsers>0} /*&& false*/
            GlanceNotificationSubscription.subscribeLocationUpdateNotificationV10(credential,sysConf,trackFloor,(listMacAddress ::: listGuestMacAddress ::: GlanceWebSocketActor.getAllTempClientMacAddresses()).distinct,bISESupported)
        }
      } yield  /*bRetAss &&*/ bRetInOut && bRetUpdate
    }
    def receive = {
      case (floorId: String, floorInfo:GlanceTrackFloor,credential: GlanceCredential) =>
        for{
          sysConf <-GlanceSystemConf.readConf(credential)
          bListen <-listNotifications(sysConf,credential,floorInfo)
        } yield {
          Logger.info("Listen notification for floor:{}",floorInfo.floorId)
        }
      case _ =>
        Logger.warn("Unknown message received!")
    }
  }

}
