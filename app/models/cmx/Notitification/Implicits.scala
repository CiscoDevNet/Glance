package models.cmx.Notitification

import java.util.Date
import models.cmx.MapCoordinate
import play.Logger
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.json.Json.JsValueWrapper
import models.cmx.Implicits._
import utils.ComUtils

/**
 * Created by kennych on 12/31/15.
 */
object Implicits{

  val tolerantLocationUpdateInfoReaders = new Reads[LocationUpdateNotification] {
    def reads(js: JsValue) = {
      JsSuccess(LocationUpdateNotification(
        (js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "lastSeen").asOpt[String].getOrElse(""),
        (js \ "locationMapHierarchy").asOpt[String].getOrElse(""),
        (js \ "locationCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders).getOrElse(new MapCoordinate()),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        ComUtils.purifyISEUserId((js \ "username").asOpt[String].getOrElse("")),
        (js \ "timestamp").asOpt[Long].getOrElse(0)
      ))
    }
  }

  val locationUpdateReaders: Reads[LocationUpdateNotification] = (
    (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "lastSeen").read[String] and
      (__ \ "locationMapHierarchy").read[String] and
      (__ \ "locationCoordinate").read[MapCoordinate] and
      (__ \ "floorId").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "username").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "timestamp").read[Long]
    )(LocationUpdateNotification.apply _)

  implicit val locationUpdateWrites = new Writes[LocationUpdateNotification] {
    def writes(z: LocationUpdateNotification): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "lastSeen" -> z.lastSeen,
        "locationMapHierarchy" -> z.locationMapHierarchy,
        "locationCoordinate" -> Json.toJson(z.locationCoordinate),
        "floorId" -> z.floorId,
        "username" ->z.username,
        "timestamp" -> z.timestamp
      )
    }
  }

  implicit val locationUpdateFormat = Format(locationUpdateReaders, locationUpdateWrites)


  val tolerantNotificationHeaderReaders = new Reads[NotificationHeader] {
    def reads(js: JsValue) = {
      JsSuccess(NotificationHeader(
        (js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "lastSeen").asOpt[String].getOrElse("")
      ))
    }
  }

  val notificationHeaderReaders: Reads[NotificationHeader] = (
      (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "lastSeen").read[String]
    )(NotificationHeader.apply _)

  implicit val notificationHeaderWrites = new Writes[NotificationHeader] {
    def writes(z: NotificationHeader): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "lastSeen" -> z.lastSeen
      )
    }
  }

  implicit val notificationHeaderFormat = Format(notificationHeaderReaders, notificationHeaderWrites)

  val tolerantAssociationReaders = new Reads[AssociationNotification] {
    def reads(js: JsValue) = {
      JsSuccess(AssociationNotification(
        (js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "lastSeen").asOpt[String].getOrElse(""),
        (js \ "association").asOpt[Boolean].getOrElse(false),
        ComUtils.getIPV4(js),
        ComUtils.getIPV6(js),
        ComUtils.purifyISEUserId((js \ "username").asOpt[String].getOrElse("")),
        (js \ "timestamp").asOpt[Long].getOrElse(0)
      ))
    }
  }

  val associationReaders: Reads[AssociationNotification] = (
      (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "lastSeen").read[String] and
      (__ \ "association").read[Boolean] and
      (__ \ "ipAddressV4").read[String] and
      (__ \ "ipAddressV6").read[String] and
      (__ \ "username").readNullable[String].map(v => ComUtils.purifyISEUserId(ComUtils.readNullStringDefault(v,""))) and
      (__ \ "timestamp").read[Long]
    )(AssociationNotification.apply _)

  implicit val associationWrites = new Writes[AssociationNotification] {
    def writes(z: AssociationNotification): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "lastSeen" -> z.lastSeen,
        "association" -> z.association,
        "ipAddressV4" -> z.ipAddressV4,
        "ipAddressV6" -> z.ipAddressV6,
        "username" ->ComUtils.purifyISEUserId(z.username),
        "timestamp" -> z.timestamp
      )
    }
  }

  implicit val associationReadersFormat = Format(associationReaders, associationWrites)

  val tolerantInOutReaders = new Reads[InOutNotification] {
    def reads(js: JsValue) = {
      JsSuccess(InOutNotification(
        (js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "locationMapHierarchy").asOpt[String].getOrElse(""),
        (js \ "locationCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders).getOrElse(new MapCoordinate()),
        (js \ "boundary").asOpt[String].getOrElse("OUTSIDE"),
        (js \ "floorId").asOpt[String].getOrElse(""),
        ComUtils.purifyISEUserId((js \ "username").asOpt[String].getOrElse("")),
        (js \ "timestamp").asOpt[Long].getOrElse(0)
      ))
    }
  }

  val inOutReaders: Reads[InOutNotification] = (
    (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "locationMapHierarchy").read[String] and
      (__ \ "locationCoordinate").read[MapCoordinate] and
      (__ \ "boundary").read[String] and
      (__ \ "floorId").read[String] and
      (__ \ "username").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "timestamp").read[Long]
    )(InOutNotification.apply _)

  implicit val inOutWrites = new Writes[InOutNotification] {
    def writes(z: InOutNotification): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "locationMapHierarchy" -> z.locationMapHierarchy,
        "locationCoordinate" -> Json.toJson(z.locationCoordinate),
        "boundary" -> z.boundary,
        "floorId" -> z.floorId,
        "username" -> z.username,
        "timestamp" -> z.timestamp
      )
    }
  }
  implicit val inOutReadersFormat = Format(inOutReaders, inOutWrites)

  val tolerantMovementReaders = new Reads[MovementNotification] {
    def reads(js: JsValue) = {
      var eventName ="movement"
      var timestamp:Long =System.currentTimeMillis()
      val eventObj =js.as[JsObject]
      if(eventObj.keys.contains("notificationType"))
      {
        eventName =(js \ "notificationType").as[String]
        timestamp =(js \ "timestamp").asOpt[Long].getOrElse(System.currentTimeMillis())
      }else{
        timestamp= new Date((js \ "timestamp").asOpt[String].getOrElse((new Date()).toString())).getTime()
      }

      JsSuccess(MovementNotification(
        eventName,//(js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "lastSeen").asOpt[String].getOrElse(""),
        (js \ "locationMapHierarchy").asOpt[String].getOrElse(""),
        (js \ "locationCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders).getOrElse(new MapCoordinate()),
        (js \ "floorId").asOpt[String].getOrElse(""),
        ComUtils.purifyISEUserId((js \ "username").asOpt[String].getOrElse("")), //fixme
        timestamp
      ))
    }
  }

  val movementReaders: Reads[MovementNotification] = (
    (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "lastSeen").read[String] and
      (__ \ "locationMapHierarchy").read[String] and
      (__ \ "locationCoordinate").read[MapCoordinate] and
      (__ \ "floorId").read[String] and
      (__ \ "username").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and //fixme
      (__ \ "timestamp").read[Long]
    )(MovementNotification.apply _)

  implicit val movementWrites = new Writes[MovementNotification] {
    def writes(z: MovementNotification): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "lastSeen" -> z.lastSeen,
        "locationMapHierarchy" -> z.locationMapHierarchy,
        "locationCoordinate" -> Json.toJson(z.locationCoordinate),
        "floorId" -> z.floorId,
        "username" -> z.username,
        "timestamp" -> z.timestamp
      )
    }
  }

  implicit val movementReadersFormat = Format(movementReaders, movementWrites)

  val tolerantContainmentReaders = new Reads[ContainmentNotification] {
    def reads(js: JsValue) = {
      val timestamp= new Date((js \ "timestamp").asOpt[String].getOrElse((new Date()).toString())).getTime()
      JsSuccess(ContainmentNotification(
        "containment",//(js \ "notificationType").as[String],
        (js \ "subscriptionName").asOpt[String].getOrElse(""),
        (js \ "entity").asOpt[String].getOrElse(""),
        (js \ "deviceId").asOpt[String].getOrElse(""),
        (js \ "locationMapHierarchy").asOpt[String].getOrElse(""),
        (js \ "locationCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders).getOrElse(new MapCoordinate()),
        (js \ "mseUdi").asOpt[String].getOrElse(""),
        (js \ "floorRefId").asOpt[BigDecimal].getOrElse(0),
        (js \ "boundary").asOpt[String].getOrElse("OUTSIDE"),
        (js \ "areaType").asOpt[String].getOrElse(""),
        (js \ "containerHierarchy").asOpt[String].getOrElse(""),
        (js \ "username").asOpt[String].getOrElse(""),//fixme
        timestamp
      ))
    }
  }

  val containmentReaders: Reads[ContainmentNotification] = (
    (__ \ "notificationType").read[String] and
      (__ \ "subscriptionName").read[String] and
      (__ \ "entity").read[String] and
      (__ \ "deviceId").read[String] and
      (__ \ "locationMapHierarchy").read[String] and
      (__ \ "locationCoordinate").read[MapCoordinate] and
      (__ \ "mseUdi").read[String] and
      (__ \ "floorRefId").read[BigDecimal] and
      (__ \ "boundary").read[String] and
      (__ \ "areaType").read[String] and
      (__ \ "containerHierarchy").read[String] and
      (__ \ "username").readNullable[String].map(v => ComUtils.readNullStringDefault(v,"")) and
      (__ \ "timestamp").read[Long]
    )(ContainmentNotification.apply _)

  implicit val containmentWrites = new Writes[ContainmentNotification] {
    def writes(z: ContainmentNotification): JsValue = {
      Json.obj(
        "notificationType" -> z.notificationType,
        "subscriptionName" -> z.subscriptionName,
        "entity" -> z.entity,
        "deviceId" -> z.deviceId,
        "locationMapHierarchy" -> z.locationMapHierarchy,
        "locationCoordinate" -> Json.toJson(z.locationCoordinate),
        "mseUdi" -> z.mseUdi,
        "floorRefId" -> JsNumber(z.floorRefId),
        "boundary" -> z.boundary,
        "areaType" -> z.areaType,
        "containerHierarchy" -> z.containerHierarchy,
        "username" -> z.username,
        "timestamp" -> z.timestamp
      )
    }
  }
  implicit val containmentReadersFormat = Format(containmentReaders, containmentWrites)
}
