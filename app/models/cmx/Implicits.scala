package models.cmx

import play.Logger
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.json.Json.JsValueWrapper
import reactivemongo.play.json._
import models.cmx.GlanceImageInfo._
import utils.ComUtils
import play.api.libs.json._
import reactivemongo.bson._

/**
 * Created by kennych on 16/4/27.
 */
object Implicits {

  implicit val tolerantConnectRecordReaders = new Reads[ConnectedRecord] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(ConnectedRecord(
          (js \ "operationSystem").asOpt[String].getOrElse(""),
          (js \ "bytesSent").asOpt[Long].getOrElse(0),
          (js \ "portal").asOpt[String].getOrElse(""),
          (js \ "state").asOpt[String].getOrElse(""),
          (js \ "lastAcceptTime").asOpt[String].getOrElse(""),
          (js \ "macAddress").asOpt[String].getOrElse(""),
          (js \ "type").asOpt[String].getOrElse(""),
          (js \ "agent").asOpt[String].getOrElse(""),
          (js \ "bandwidth").asOpt[Long].getOrElse(0),
          (js \ "Name").asOpt[String].getOrElse(""),
          (js \ "firstLoginTime").asOpt[String].getOrElse(""),
          (js \ "Email").asOpt[String].getOrElse(""),
          (js \ "device").asOpt[String].getOrElse(""),
          (js \ "bytesReceived").asOpt[Long].getOrElse(0),
          (js \ "location/Site").asOpt[String].getOrElse(""),
          (js \ "lastLogoutTIme").asOpt[String].getOrElse(""),
          (js \ "Company Name").asOpt[String].getOrElse(""),
          (js \ "language").asOpt[String].getOrElse(""),
          (js \ "authType").asOpt[String].getOrElse(""),
          (js \ "lastLoginTime").asOpt[String].getOrElse(""),
          (js \ "Industry").asOpt[String].getOrElse(""),
          (js \ "updateTimestamp").asOpt[Long].getOrElse(System.currentTimeMillis())
        ))
      }catch{
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }


  implicit val connectRecordWrites = new Writes[ConnectedRecord] {
    def writes(z: ConnectedRecord): JsValue = {
      Json.obj(
        "operationSystem" -> z.operationSystem,
        "bytesSent" -> z.bytesSent,
        "portal" -> z.portal,
        "state" -> z.state,
        "lastAcceptTime" -> z.lastAcceptTime,
        "macAddress" -> z.macAddress,
        "type" -> z.portalType,
        "agent" -> z.agent,
        "bandwidth" -> z.bandwidth,
        "Name" -> z.Name,
        "firstLoginTime" -> z.firstLoginTime,
        "Email" -> z.Email,
        "device" -> z.device,
        "bytesReceived" -> z.bytesReceived,
        "location/Site" -> z.locationSite,
        "lastLogoutTIme" -> z.lastLogoutTIme,
        "Company Name" -> z.companyName,
        "language" -> z.language,
        "authType" -> z.authType,
        "lastLoginTime" -> z.lastLoginTime,
        "Industry" -> z.Industry,
        "updateTimestamp" ->z.updatedTimestamp
      )
    }
  }

   implicit val tolerantConnectReaders = new Reads[Connected] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(Connected(
          (js \ "nextIndex").asOpt[Long].getOrElse(0),
          (js \ "timeZoneOffset").asOpt[Long].getOrElse(0),
          (js \ "queryRecordCount").asOpt[Long].getOrElse(0),
          (js \ "timeZone").asOpt[String].getOrElse(""),
          (js \ "records").asOpt[List[ConnectedRecord]].getOrElse(List()),
          (js \ "returnRecordCount").asOpt[Long].getOrElse(0)
        ))
      }catch{
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val connectWrites = new Writes[Connected] {
    def writes(z: Connected): JsValue = {
      Json.obj(
        "nextIndex" ->z.nextIndex,
        "timeZoneOffset" -> z.timeZoneOffset,
        "queryRecordCount" -> z.queryRecordCount,
        "timeZone" -> z.timeZone,
        "records" -> z.records,
        "returnRecordCount" -> z.returnRecordCount
      )
    }
  }

  implicit val tolerantDimensionReaders = new Reads[Dimension] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(Dimension(
          (js \ "length").asOpt[Double].getOrElse(0),
          (js \ "width").asOpt[Double].getOrElse(0),
          (js \ "height").asOpt[Double].getOrElse(0),
          (js \ "offsetX").asOpt[Double].getOrElse(0),
          (js \ "offsetY").asOpt[Double].getOrElse(0),
          (js \ "unit").asOpt[String].getOrElse("FEET")
        ))
      }catch{
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val dimensionWrites = new Writes[Dimension] {
    def writes(z: Dimension): JsValue = {
      Json.obj(
        "length" -> z.length,
        "width" -> z.width,
        "height" -> z.height,
        "offsetX" -> z.offsetX,
        "offsetY" -> z.offsetY,
        "unit" -> z.unit
      )
    }
  }
  implicit val tolerantMapCoordinateReaders = new Reads[MapCoordinate] {
    def reads(js: JsValue) = {
     try{
       JsSuccess(MapCoordinate(
         (js \ "x").as[Double],
         (js \ "y").as[Double],
         (js \ "z").asOpt[Double].getOrElse(0),
         (js \ "unit").asOpt[String].getOrElse("FEET")
       ))
     } catch {
       case e: JsResultException =>
          JsError(e.errors)
      }

    }
  }

  implicit val mapCoordinateWrites = new Writes[MapCoordinate] {
    def writes(z: MapCoordinate): JsValue = {
      Json.obj(
        "x" -> z.x,
        "y" -> z.y,
        "z" -> z.z,
        "unit" -> z.unit
      )
    }
  }

  implicit val tolerantZoneReaders = new Reads[Zone] {
    def reads(js: JsValue) = {
      try {
        JsSuccess(Zone(
          (js \ "name").asOpt[String].getOrElse(""),
          (js \ "zoneCoordinate").asOpt[List[MapCoordinate]].getOrElse(List()),
          (js \ "zoneType").asOpt[String].getOrElse(""),
          (js \ "color").asOpt[String].getOrElse("#000000")
        ))
      }catch{
        case e: JsResultException =>
          JsError(e.errors)
      }
    }
  }

  implicit val zoneWrites = new Writes[Zone] {
    def writes(z: Zone): JsValue = {
      Json.obj(
        "name" -> z.name,
        "zoneCoordinate" -> z.zoneCoordinate,
        "zoneType" -> z.zoneType,
        "color" ->z.color
      )
    }
  }

  implicit val tolerantAPInterfaceReaders = new Reads[ApInterface] {
    def reads(js: JsValue) = {
      JsSuccess(ApInterface(
        (js \ "band").asOpt[String].getOrElse(""),
        (js \ "slotNumber").asOpt[Int].getOrElse(0),
        (js \ "channelAssignment").asOpt[Int].getOrElse(0),
        (js \ "channelNumber").asOpt[Int].getOrElse(0),
        (js \ "txPowerLevel").asOpt[Int].getOrElse(0),
        (js \ "antennaPattern").asOpt[String].getOrElse(""),
        (js \ "antennaAngle").asOpt[Double].getOrElse(0.0),
        (js \ "antennaElevAngle").asOpt[Double].getOrElse(0.0),
        (js \ "antennaGain").asOpt[Double].getOrElse(0.0)
      ))
    }
  }


  implicit val apInterfaceWrites = new Writes[ApInterface] {
    def writes(z: ApInterface): JsValue = {
      Json.obj(
        "band" -> z.band,
        "slotNumber" -> z.slotNumber,
        "channelAssignment" -> z.channelAssignment,
        "channelNumber" -> z.channelNumber,
        "txPowerLevel" -> z.txPowerLevel,
        "antennaPattern" -> z.antennaPattern,
        "antennaAngle" -> z.antennaAngle,
        "antennaElevAngle" -> z.antennaElevAngle,
        "antennaGain" -> z.antennaGain
      )
    }
  }

  implicit val tolerantAccessPointReaders = new Reads[AccessPoint] {
    def reads(js: JsValue) = {
      JsSuccess(AccessPoint(
        (js \ "name").asOpt[String].getOrElse(""),
        (js \ "radioMacAddress").asOpt[String].getOrElse(""),
        (js \ "ethMacAddress").asOpt[String].getOrElse(""),
        (js \ "ipAddress").asOpt[String].getOrElse(""),
        (js \ "numOfSlots").asOpt[Int].getOrElse(0),
        (js \ "apMode").asOpt[String].getOrElse(""),
        getMapCoordinate(js),
        (js \ "ApInterface").asOpt[List[ApInterface]].getOrElse((js \ "apInterfaces").asOpt[List[ApInterface]].getOrElse(List()))
      ))
    }
  }

  implicit val accessPointWrites = new Writes[AccessPoint] {
    def writes(z: AccessPoint): JsValue = {
      Json.obj(
        "name" -> z.name,
        "radioMacAddress" -> z.radioMacAddress,
        "ethMacAddress" -> z.ethMacAddress,
        "ipAddress" -> z.ipAddress,
        "numOfSlots" -> z.numOfSlots,
        "apMode" -> z.apMode,
        "MapCoordinate" -> z.mapCoordinate,
        "ApInterface" -> z.apInterfaces
      )
    }
  }

  def getImage(js:JsValue):Option[GlanceImageInfo] ={
    //for different version CMX has differnet names(in different cases)
    val imageX:Option[GlanceImageInfo] = (js \ "image").asOpt[GlanceImageInfo](tolerantImageReaders)
    imageX match {
      case Some(img:GlanceImageInfo) =>
        if(img.imageName ==""){
          val imageX2:Option[GlanceImageInfo] = (js \ "Image").asOpt[GlanceImageInfo](tolerantImageReaders)
          imageX2 match{
            case Some(img_2:GlanceImageInfo) =>
              return imageX2
            case _ =>
              return Some(new GlanceImageInfo(imageName = ""))
          }
        }
        return imageX
      case _ =>
      {
        val imageX2:Option[GlanceImageInfo] = (js \ "Image").asOpt[GlanceImageInfo](tolerantImageReaders)
        imageX2 match{
          case Some(img:GlanceImageInfo) =>
            return imageX2
          case _ =>
            return Some(new GlanceImageInfo(imageName = ""))
        }
      }
    }
  }

  def getDimension(js:JsValue):Dimension ={
    val dimensionX:Option[Dimension] = (js \ "Dimension").asOpt[Dimension](tolerantDimensionReaders)
    dimensionX match {
      case Some(img:Dimension) =>
        if(img.width <= 0.0001 && img.height <=0.0001 && img.width<=0.0001) {
          val dimensionX2:Option[Dimension] = (js \ "dimension").asOpt[Dimension](tolerantDimensionReaders)
          dimensionX2 match{
            case Some(img_2:Dimension) =>
              return img_2
            case _ =>
              return new Dimension()
          }
        }else
          return img
      case _ =>
      {
        val dimensionX2:Option[Dimension] = (js \ "Dimension").asOpt[Dimension](tolerantDimensionReaders)
        dimensionX2 match{
          case Some(imgX:Dimension) =>
            return imgX
          case _ =>
            return new Dimension()
        }
      }
    }
  }

  def getMapCoordinate(js:JsValue):MapCoordinate ={
    val mapCoordinateX:Option[MapCoordinate] = (js \ "MapCoordinate").asOpt[MapCoordinate](tolerantMapCoordinateReaders)
    mapCoordinateX match {
      case Some(img:MapCoordinate) =>
        if(img.x <= 0.0001 && img.y <=0.0001 && img.z <=0.0001) {
          val mapCoordinateX2:Option[MapCoordinate] = (js \ "mapCoordinates").asOpt[MapCoordinate](tolerantMapCoordinateReaders)
          mapCoordinateX2 match{
            case Some(img_2:MapCoordinate) =>
              return img_2
            case _ =>
              return new MapCoordinate()
          }
        }else
          return img
      case _ =>
      {
        val mapCoordinateX2:Option[MapCoordinate] = (js \ "mapCoordinates").asOpt[MapCoordinate](tolerantMapCoordinateReaders)
        mapCoordinateX2 match {
          case Some(img_2:MapCoordinate) =>
            return img_2
          case _ =>
            return new MapCoordinate()
        }
      }
    }
  }


  implicit val tolerantFloorReaders = new Reads[Floor] {
    def reads(js: JsValue) = {
      JsSuccess(Floor(
        (js \ "objectVersion").as[Int],
        (js \ "name").as[String],
        (js \ "isOutdoor").as[Boolean],
        (js \ "floorNumber").as[Int],
        (js \ "floorRefId").asOpt[String].getOrElse(""),
        getDimension(js),
        getImage(js),
        (js \ "zones").asOpt[List[Zone]].getOrElse(List()).filter(p => p.zoneType=="ZONE"), //fixme here, to filter only zone
        (js \ "accessPoints").asOpt[List[AccessPoint]].getOrElse((js \ "AccessPoint").asOpt[List[AccessPoint]].getOrElse(List())),
        (js \ "aesUid").asOpt[BigDecimal].getOrElse(0),
        (js \ "aesUidString").asOpt[String].getOrElse(""),
        (js \ "hierarchyName").asOpt[String].getOrElse("")
      ))
    }
  }

  implicit val floorWrites = new Writes[Floor] {
    def writes(z: Floor): JsValue = {
      var obj =Json.obj(
        "objectVersion" -> z.objectVersion,
        "name" -> z.name,
        "isOutdoor" -> z.isOutdoor,
        "floorNumber" -> z.floorNumber,
        "floorRefId" -> z.floorRefId,
        "Dimension" -> z.dimension,
        "zones" -> z.zones,
        "AccessPoint" -> z.accessPoints,
        "aesUid" -> z.aesUid,
        "aesUidString" -> z.aesUidString,
        "hierarchyName" ->z.hierarchyName
      )
      if(z.image.isDefined)
      {
        obj += ("Image" -> Json.toJson(z.image.get))
      }
      obj
    }
  }

  implicit val tolerantBuildingReaders = new Reads[Building] {
    def reads(js: JsValue) = {
      JsSuccess(Building(
        (js \ "objectVersion").as[Int],
        (js \ "name").as[String],
        getDimension(js),
        (js \ "Floor").asOpt[List[Floor]].getOrElse((js \ "floorList").asOpt[List[Floor]].getOrElse(List())),
        getImage(js),
        (js \ "aesUid").asOpt[BigDecimal].getOrElse(0),
        (js \ "aesUidString").asOpt[String].getOrElse(""),
        (js \ "hierarchyName").asOpt[String].getOrElse("")
      ))
    }
  }

  implicit val buildingWrites = new Writes[Building] {
    def writes(z: Building): JsValue = {
      var obj =Json.obj(
        "objectVersion" -> z.objectVersion,
        "name" -> z.name,
        "Dimension" -> z.dimension,
        "Floor" -> z.floors,
        "aesUid" -> z.aesUid,
        "aesUidString" -> z.aesUidString,
        "hierarchyName" -> z.hierarchyName
      )
      if(z.image.isDefined){
        obj += ("Image" -> Json.toJson(z.image.get))
      }
      obj
    }
  }

  implicit val tolerantCampusReaders = new Reads[Campus] {
    def reads(js: JsValue) = {
      JsSuccess(Campus(
        (js \ "objectVersion").as[Int],
        (js \ "name").as[String],
        getImage(js),
        getDimension(js),
        (js \ "Building").asOpt[List[Building]].getOrElse((js \ "buildingList").asOpt[List[Building]].getOrElse(List())),
        (js \ "aesUid").asOpt[BigDecimal].getOrElse(0),
        (js \ "aesUidString").asOpt[String].getOrElse(""),
        (js \ "members").asOpt[List[JsValue]].getOrElse(List())
      ))
    }
  }

  implicit val campusWrites = new Writes[Campus] {
    def writes(z: Campus): JsValue = {
      var obj= Json.obj(
        "objectVersion" -> z.objectVersion,
        "name" -> z.name,
        "Dimension" -> z.dimension,
        "Building" -> z.buildings,
        "aesUid" -> z.aesUid,
        "aesUidString" -> z.aesUidString,
        "members" -> z.members
      )
      if(z.image.isDefined){
        obj += ("Image" -> Json.toJson(z.image.get))
      }
      obj
    }
  }

  val statisticsReaders: Reads[Statistics] = (
    (__ \ "currentServerTime").read[String] and
      (__ \ "firstLocatedTime").read[String] and
      (__ \ "lastLocatedTime").read[String]
    )(Statistics.apply _)

  implicit val statisticsWrites = new Writes[Statistics] {
    def writes(z: Statistics): JsValue = {
      Json.obj(
        "currentServerTime" -> z.currentServerTime,
        "firstLocatedTime" -> z.firstLocatedTime,
        "lastLocatedTime" -> z.lastLocatedTime
      )
    }
  }

  implicit val statisticsFormat = Format(statisticsReaders, statisticsWrites)

  val mapInfoReaders: Reads[MapInfo] = (
    (__ \ "mapHierarchyString").read[String] and
      (__ \ "floorRefId").read[Long] and
      (__ \ "Dimension").read[Dimension](tolerantDimensionReaders) and
      (__ \ "Image" \ "imageName").read[String]
    )(MapInfo.apply _)

  implicit val mapInfoWrites = new Writes[MapInfo] {
    def writes(z: MapInfo): JsValue = {
      Json.obj(
        "mapHierarchyString" -> z.mapHierarchyString,
        "floorRefId" -> z.floorRefId.toString,
        "Dimension" -> z.dimension,
        "imageName" -> z.imageName
      )
    }
  }

  implicit val mapInfoFormat = Format(mapInfoReaders, mapInfoWrites)

  val locationReaders: Reads[Location] = (
    (__ \ ComUtils.CONST_PROPERTY_MACADDRESS).read[String] and
      (__ \ "currentlyTracked").read[Boolean] and
      (__ \ "isGuestUser").read[Boolean] and
      (__ \ "confidenceFactor").read[Int] and
      (__ \ "userName").readNullable[String] and
      (__ \ "MapCoordinate").read[MapCoordinate](tolerantMapCoordinateReaders) and
      (__ \ "ipAddress").read[List[String]] and
      (__ \ "Statistics").read[Statistics] and
      (__ \ "MapInfo").read[MapInfo]
    )(Location.apply _)

  implicit val locationWrites = new Writes[Location] {
    def writes(z: Location): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        "currentlyTracked" -> z.currentlyTracked,
        "isGuestUser" -> z.isGuestUser,
        "confidenceFactor" -> z.confidenceFactor,
        "userName" -> z.userName,
        "coordinate" -> z.mapCoordinate,
        "ipAddress" -> z.ipAddresses,
        "statistics" -> z.statistics,
        "mapInfo" -> z.mapInfo
      )
    }
  }

  implicit val locationFormat = Format(locationReaders, locationWrites)


  implicit val objectIdRead: Reads[BSONObjectID] = __.read[String].map {
    oid => BSONObjectID(oid)
  }

  implicit val objectIdWrite: Writes[BSONObjectID] = new Writes[BSONObjectID] {
    def writes(oid: BSONObjectID): JsValue = JsString(oid.stringify)
  }

  implicit val objectIdFormats = Format(objectIdRead, objectIdWrite)
}
