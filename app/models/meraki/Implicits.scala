package models.meraki

import javaxt.utils.Date
import models.cmx.MapCoordinate
import models.cmx.Notitification.LocationUpdateNotification
import play.Logger
import play.api.libs.json._
import utils.ComUtils

/**
 * Created by kennych on 12/22/16.
 */
object Implicits {
  val DEFAULT_DOUBLE_ZERO:Double=0.00000000000000

  implicit val tolerantMerakiLocationReaders = new Reads[MerakiLocation] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(MerakiLocation(
          (js \ "lat").asOpt[Double].getOrElse(DEFAULT_DOUBLE_ZERO),
          (js \ "lng").asOpt[Double].getOrElse(DEFAULT_DOUBLE_ZERO),
          (js \ "unc").asOpt[Double].getOrElse(DEFAULT_DOUBLE_ZERO),
          {
            val x =(js \ "x").asOpt[List[Double]].getOrElse(List(DEFAULT_DOUBLE_ZERO))
            if(x.length>0)
              x
            else
              List(DEFAULT_DOUBLE_ZERO)
          },
          {
            val y =(js \ "y").asOpt[List[Double]].getOrElse(List(DEFAULT_DOUBLE_ZERO))
            if(y.length>0)
              y
            else
              List(DEFAULT_DOUBLE_ZERO)
          },
          (js \ "unit").asOpt[String].getOrElse("METER")
        ))
      }catch{
        case e: JsResultException =>
          Logger.error("MerakiLocation reader(parser) failed:{}",e.getMessage)
          JsError(e.errors)
      }
    }
  }

  implicit val MerakiLocationWrites = new Writes[MerakiLocation] {
    def writes(z: MerakiLocation): JsValue = {
      Json.obj(
        "lat" -> z.lat,
        "lng" -> z.lng,
        "unc" -> z.unc,
        "x" -> z.x,
        "y" -> z.y,
        "unit" -> z.unit
      )
    }
  }

  def isNull(strValue:String):Boolean={
    Option(strValue) match {
      case Some(sValue) =>
        false
      case _ =>
        true
    }
  }
  def isNull(lValue:Long):Boolean={
    Option(lValue) match {
      case Some(sValue) =>
        false
      case _ =>
        true
    }
  }

  def isNullWithDefault(lValue:Long,defaultVal:Long):Long ={
    if (isNull(lValue)){
      defaultVal
    }else
      lValue
  }

  def isNullWithDefault(strValue:String,defaultVal:String=""):String = {
    if (isNull(strValue))
      defaultVal
    else
      strValue
  }

  implicit val tolerantMerakiObservationDataReaders = new Reads[MerakiObservationData] {
    def reads(js: JsValue) = {
      try {
        val ipv4 = isNullWithDefault((js \ "ipv4").asOpt[String].getOrElse(""))
        val seenTime =isNullWithDefault((js \ "seenTime").asOpt[String].getOrElse(""))
        val ssid = isNullWithDefault((js \ "ssid").asOpt[String].getOrElse(""))
        val os = isNullWithDefault((js \ "os").asOpt[String].getOrElse(""))
        val clientMac = isNullWithDefault((js \ "clientMac").asOpt[String].getOrElse(""))
        val seenEpoch:Long = isNullWithDefault(Math.round((js \ "seenEpoch").asOpt[Long].getOrElse(System.currentTimeMillis()/1000)),Math.round(System.currentTimeMillis()/1000))
        val rssi= isNullWithDefault((js \ "rssi").asOpt[String].getOrElse(""))
        val ipv6 = isNullWithDefault((js \ "ipv6").asOpt[String].getOrElse(""))
        val manufacturer = isNullWithDefault((js \ "manufacturer").asOpt[String].getOrElse(""))

        JsSuccess(MerakiObservationData(
          ipv4,
          {
            val location =(js \ "location").asOpt[MerakiLocation].getOrElse(new MerakiLocation())
            if(location.unit.compareToIgnoreCase("METER")==0)  //convert to FEET values...
            {
              val x ={
                if(location.x.length>0)
                  location.x(0)* 3.28084
                else
                  0.0
              }
              val y ={
                if(location.y.length>0)
                  location.y(0)* 3.28084
                else
                  0.0
              }
              location.copy(unit="FEET", x =List(x), y =List(y))
            }else{
              location
            }
          },
          seenTime,
          ssid,
          os,
          clientMac,
          seenEpoch,
          rssi,
          ipv6,
          manufacturer
        ))
      }catch{
        case e: JsResultException =>
          Logger.error("tolerantMerakiObservationDataReaders- parsing failed:{}",e.getMessage)
          JsError(e.errors)
      }
    }
  }



  implicit val merakiObservationDataWrites = new Writes[MerakiObservationData] {
    def writes(z: MerakiObservationData): JsValue = {
      Json.obj(
        "ipv4" -> isNullWithDefault(z.ipv4),
        "location" -> z.location,
        "seenTime" -> isNullWithDefault(z.seenTime,(new Date()).toISOString),
        "ssid" -> isNullWithDefault(z.ssid),
        "os" -> isNullWithDefault(z.os),
        "clientMac" -> isNullWithDefault(z.clientMac),
        "seenEpoch" -> z.seenEpoch,
        "rssi" -> isNullWithDefault(z.rssi),
        "ipv6" -> isNullWithDefault(z.ipv6),
        "manufacturer" -> isNullWithDefault(z.manufacturer),
        "deviceType" ->z.deviceType
      )
    }
  }

  implicit val tolerantMerakiNotificationDataReaders = new Reads[MerakiNotificationData] {

    def reads(js: JsValue) = {
      try {
        JsSuccess(MerakiNotificationData(
          (js \ "apMac").asOpt[String].getOrElse(""),
          (js \ "apFloors").asOpt[List[String]].getOrElse(List()).filter(p => p!=""),
          (js \ "apTags").asOpt[List[String]].getOrElse(List()),
          (js \ "observations").asOpt[List[MerakiObservationData]].getOrElse(List()).filter(p => !isNull(p.clientMac) && p.clientMac!="")
        ))
      }catch{
        case e: JsResultException =>
          Logger.error("tolerantMerakiNotificationDataReaders failed:{}",e.getMessage)
          JsError(e.errors)
      }
    }
  }



  implicit val merakiNotificationDataWrites = new Writes[MerakiNotificationData] {
    def writes(z: MerakiNotificationData): JsValue = {
      Json.obj(
        "apMac" -> z.apMac,
        "apFloors" -> z.apFloors,
        "apTags" -> z.apTags,
        "observations" -> z.observations
      )
    }
  }

  /*
  version:String,
                              secret:String,
                              notificationType:String,
                              data:MerakiNotificationData
   */
  implicit val tolerantMerakiNotificationReaders = new Reads[MerakiNotification] {

    def reads(js: JsValue) = {
      try {
        val msgType=(js \ "type").asOpt[String].getOrElse("")
        JsSuccess(MerakiNotification(
          (js \ "version").asOpt[String].getOrElse(""),
          (js \ "secret").asOpt[String].getOrElse(""),
          msgType,
          {
            val data =(js \ "data").asOpt[MerakiNotificationData].getOrElse(new MerakiNotificationData(""))
            if(msgType=="BluetoothDevicesSeen")
              data.copy(observations=data.observations.map(f => f.copy(deviceType = "BLE"))) //convert all device seen element to BLE flags..
            else
              data
          }  //default with none data...
        ))
      }catch{
        case e: JsResultException =>
          ComUtils.outputErrorMsg("tolerantMerakiNotificationReaders failed:"+e.getMessage)
          JsError(e.errors)
      }
    }
  }

  implicit val merakiNotificationWrites = new Writes[MerakiNotification] {
    def writes(z: MerakiNotification): JsValue = {
      Json.obj(
        "version" -> z.version,
        "secret" -> z.secret,
        "type" -> z.notificationType,
        "data" -> z.data
      )
    }
  }

  implicit val tolerantMerakiDeviceIdReaders = new Reads[MerakiDeviceIdMapping] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(MerakiDeviceIdMapping((js \ "version").asOpt[String].getOrElse("2.0"),
        (js \ "apMac").asOpt[String].getOrElse(""),
        (js \ "apFloors").asOpt[List[String]].getOrElse(List()),
        (js \ "apTags").asOpt[List[String]].getOrElse(List()),
        (js \ "devicesSeenType").asOpt[String].getOrElse("DevicesSeen"),
        (js \ "observationData").as[MerakiObservationData],
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      }catch{
        case e: JsResultException =>
          Logger.error("tolerantMerakiDeviceIdReaders failed:{}",e.getMessage)
          JsError(e.errors)
      }
    }
  }

  implicit val merakiDeviceIdWrites = new Writes[MerakiDeviceIdMapping] {
    def writes(z: MerakiDeviceIdMapping): JsValue = {
      Json.obj(
        "version" -> z.version,
        "apMac" -> z.apMac,
        "apFloors" ->z.apFloors,
        "apTags" -> z.apTags,
        "devicesSeenType" -> z.devicesSeenType,
        "observationData" -> z.observationData,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }



  /*
  notificationType:String,
                          subscriptionName:String,
                          entity:String,
                          deviceId:String,
                          lastSeen:String,
                          locationMapHierarchy:String,
                          locationCoordinate:MapCoordinate,
                          floorId:String="",
                          timestamp:Long=System.currentTimeMillis()

   */

  def BuildMerakiDeviceIdMapping(notification:MerakiNotification,elementData:MerakiObservationData):MerakiDeviceIdMapping={


    new MerakiDeviceIdMapping(version=notification.version,
                              apMac = notification.data.apMac,
                              apFloors =notification.data.apFloors,
                              apTags =notification.data.apTags,
                              devicesSeenType =notification.notificationType,
                              observationData=elementData)
  }
  def MerakiObservationDataToNotificationData(merakiData:MerakiObservationData,merakiNotification: MerakiNotification):LocationUpdateNotification=
  {
      val locationData =LocationUpdateNotification(notificationType="locationupdate",
                                 subscriptionName="Meraki",
                                 entity="wireless",
                                 deviceId=merakiData.clientMac,
                                 lastSeen=merakiData.seenTime,
                                 locationMapHierarchy={
                                   //fixme hard code for testing...
                                   if(merakiNotification.data.apFloors.length>0)
                                     merakiNotification.data.apFloors(0)
                                   else
                                     ""
//                                   if(merakiNotification.data.apFloors.length>0 && merakiNotification.data.apFloors(0)!="MR1-1")
//                                    "System Campus>SHN15>DevNet15B"
//                                   else
//                                     "System Campus>SHN15>DevNet15A"
                                 },
                                 //locationMapHierarchy=merakiNotification.data.apFloors(0),
                                 locationCoordinate={
                                    if(merakiData.location.unit.compareToIgnoreCase("METER")==0)
                                    {
                                      val x =merakiData.location.x(0) * 3.28084
                                      val y =merakiData.location.y(0) * 3.28084
                                      MapCoordinate(x,y)
                                    }else{
                                      MapCoordinate(merakiData.location.x(0),merakiData.location.y(0))
                                    }

                                 },
                                 floorId="")
      Logger.info("Convert Location Data:"+locationData.toString())
      locationData
  }

}

