package utils

import java.awt.geom.Point2D
import java.io.File
import java.util.{UUID, Date, Calendar}

import models.cmx.MapCoordinate
import org.joda.time.format.{DateTimeFormat, DateTimeFormatter}
import play.api.mvc.Session
import models.cmx.Implicits._
import akka.actor.ActorSystem
import models.glance._
import org.joda.time.{DateTime, DateTimeZone}
import play.Logger
import play.api.libs.json._
import services.common.ConfigurationService
import services.security.GlanceCredential

import scala.collection.mutable
;

/**
 * Created by kennych on 12/11/15.
 */

case class GlanceLoc(lat: Double, long: Double)

object ComUtils {
  val glanceInstantId =UUID.randomUUID().toString()
  val MAX_CONTENT = 50*1024*1024  //50 Mega bytes
  val CONST_GLANCE_APPNAME = "Glance"
  val DEFAULT_DATASOURCE:String = "Glance"
  val CMX_CONNECT_DATASOURCE:String = "CmxConnect"
  val HIERARCHY_SPLIT = ">"
  val UNAUTHORIZED_MSG = "You are not authorized for this action!"
  val MAX_IMAGE_BUFFER_SIZE = 1024*1024*100
  val MAX_SMALL_IMAGE_BUFFER_SIZE = 1024*1024*10
  val MAX_MACADDRESS_QUERY_TIMES = 5
  val DEFAULT_ORGID = ComUtils.getTenantOrgId()
  val CONST_GLOBAL = "global"
  val DEFAULT_GUEST_COUNT = 456
  val DEFAULT_ZONECOUNT_THRESHOLD = 0
  val DEFAULT_ANIMATION_INTERVAL = 55
  val DEFAULT_CMX_CONNECT_FETCH_COUNT = 1000
  val defaultAnimationSupport:Boolean = false
  val DEFAULT_USERDARAIMORTSUPPORT:Boolean = false
  val DEFAULT_INMEMORYIMPORTUSERDATA:Boolean = false
  val DEFAULT_DATASCHEMAVERSION:String = "2.0.0"
  val DESTINATION_DATASCHEMAVERSION:String = "2.0.1"
  val DEFAULT_SHOWCOUNTOFDEVICES:String = "all"
  val DEFAULT_SCALE_RATE = 0.305
  // Smart Device's user type
  val GUEST_ACCOUNT_PREFIX = "guest"
  val SMART_DEVICE_TYPE_PERSON = "person"
  val SMART_DEVICE_TYPE_PEOPLE = "people"
  val SMART_DEVICE_TYPE_GUEST  = "guest"
  val SMART_DEVICE_TYPE_VISITOR = "visitor"
  val SMART_DEVICE_TYPE_EXPERT = "expert"
  val SMART_DEVICE_TYPE_EQUIPMENT = "equipment"

  val SMART_DEVICE_TYPE_SCREEN = "screen"
  val SMART_DEVICE_TYPE_ASSET  = "asset"
  val SMART_DEVICE_TYPE_THING  = "thing"
  val SMART_DEVICE_TYPE_MOBILE  = "mobile"
  val SMART_DEVICE_TYPE_DEVICE  = "device"
  //
  val FACILITY_DEFAULT_TYPE = "facility"
  val FACILITY_DEFAULT_SUBTYPE = "facility"
  val FACILITY_LOGO_TYPE = "logo"
  val FACILITY_LOGO_SUBTYPE = "logo"


  //const for CMXServiceType
  val SERVICE_TYPE_CMX:String = "CMX"
  val SERVICE_TYPE_MERAKI:String = "Meraki"

  //socket msg
  val WS_EVENT_CLIENT_NOTIFICATION:String = "client_notification"
  val WS_EVENT_IPAD:String = "ipad"

  val WS_EVENT_INTERNAL_REFRESH_STAFF:String = "refreshStaff"
  val WS_EVENT_INTERNAL_CLIENT_INFO:String = "WSClientInfo"
  //end of socket msg
  val movementTriggerEx:String = "-movement-event-trigger"
  val containmentTriggerEx:String = "-containment-event-trigger"
  val containmentOutsideTriggerEx:String = "-containment-event-trigger-outside"

  var in_out_event_prefix:String = "-in-out-event-trigger";
  var location_update_event_prefix:String = "-location-update-event-trigger";
  var association_update_event_prefix:String = "-association-update-event-trigger";
  var unassociation_update_event_prefix:String = "-unassociation-update-event-trigger";

  val movementEventTrigger:String = "MovementEventTrigger"
  val containmentEventTrigger:String = "ContainmentEventTrigger"

  val associationEventTrigger:String = "Association"
  val locationUpdateEventTrigger:String = "LocationUpdate"
  val inOutEventTrigger:String = "InOut"
  val defaultPageSize = 500
  val defaultMeetingHoursCheckInterval = 30  //seconds
  val mongoDBPerNodes = 5
  val CONST_ACTOR_SYSTEM_NAME = "glanceSystem"

  //web socket event name
  val CONST_WS_EVENT_UPDATE:String = "update"
  val CONST_WS_EVENT_REGISTER:String = "register"
  val CONST_WS_EVENT_WHOAMI:String = "whoami"

  val CONST_PARAMETER_GRIDWIDTH:String = "gridWidth"
  val CONST_PARAMETER_GRIDHEIGHT:String = "gridHeight"
  val CONST_PARAMETER_ROWCOUNT:String = "rowCount"
  val CONST_PARAMETER_COLUMNCOUNT:String = "columnCount"
  val CONST_PARAMETER_DEBUG:String = "debug"

  //event data properties
  val CONST_EVENT_PROPERTY_REGISTER:String = "register"
  val CONST_EVENT_PROPERTY_WHOAMI:String = "whoami"
  val CONST_EVENT_PROPERTY_WITHDRAW:String = "withdraw"
  val CONST_EVENT_PROPERTY_JOIN:String = "join"
  val CONST_EVENT_PROPERTY_MOVEMENT:String = "movement"
  val CONST_CMD_CLEAN:String = "clean"

  val CONST_PROPERTY_ID:String = "id"
  val CONST_PROPERTY_NAME:String = "name"
  val CONST_PROPERTY_EMAIL:String = "email"
  val CONST_PROPERTY_PHONENUMBER:String = "phoneNumber"
  val CONST_PROPERTY_LABELPOSITION:String = "labelPosition"
  val CONST_PROPERTY_X:String = "x"
  val CONST_PROPERTY_Y:String = "y"
  val CONST_PROPERTY_TEMPORARY:String = "temporary"
  val CONST_PROPERTY_ZONES:String = "zones"
  val CONST_PROPERTY_USERS:String = "users"
  val CONST_PROPERTY_FACILITIES:String = "facilities"
  val CONST_PROPERTY_DBID:String = "_id"
  val CONST_PROPERTY_GLANCEORGID:String = "glanceOrgId"
  val CONST_PROPERTY_GLANCEUSERID:String = "glanceUserId"
  val CONST_PROPERTY_IMAGEFILEID:String = "imageFileId"
  val CONST_PROPERTY_JOIN:String = "join"
  val CONST_PROPERTY_TITLE:String = "title"
  val CONST_PROPERTY_TOPICS:String = "topics"
  val CONST_PROPERTY_BIO:String = "bio"
  val CONST_PROPERTY_AVATAR:String = "avatar"
  val CONST_PROPERTY_AVATARURL:String = "avatarUrl"
  val CONST_PROPERTY_UICONFIG:String = "uiConfig"
  val CONST_PROPERTY_DATA:String = "data"
  val CONST_PROPERTY_MEETINGHOURS:String = "meetingHours"
  val CONST_PROPERTY_GUESTCOUNT:String = "guestCount"
  val CONST_PROPERTY_ZONECOUNT:String = "zoneCount"
  val CONST_PROPERTY_ZONEENABLED:String = "zoneEnabled"
  val CONST_PROPERTY_SYSTEMZONE:String = "systemZone"
  val CONST_PROPERTY_COLOR:String  = "color"
  val CONST_PROPERTY_ZONE:String = "zone"
  val CONST_PROPERTY_ZONENAME:String = "zoneName"
  val CONST_PROPERTY_ZONEID:String = "zoneId"
  val CONST_PROPERTY_ZONEDISPLAYNAME:String = "zoneDisplayName"
  val CONST_PROPERTY_SHOWLABEL:String = "showLabel"
  val CONST_PROPERTY_TOTAL:String = "total"
  val CONST_PROPERTY_LOGOURL:String = "logoUrl"
  val CONST_PROPERTY_APS:String = "aps"
  val CONST_PROPERTY_ZONECOUNTING:String = "zoneCounting"
  val CONST_PROPERTY_CAMPUS:String = "campus"
  val CONST_PROPERTY_IPAD:String = "ipad"
  val CONST_PROPERTY_BUILDINGID:String = "buildingId"
  val CONST_PROPERTY_BUILDINGNAME:String = "buildingName"
  val CONST_PROPERTY_BUILDINGS:String = "buildings"
  val CONST_PROPERTY_FLOORID:String = "floorId"
  val CONST_PROPERTY_FLOORREF:String = "floorRef"
  val CONST_PROPERTY_FLOORINFO:String = "floorInfo"
  val CONST_PROPERTY_FLOORCONF:String = "floorConf"
  val CONST_PROPERTY_FLOORLEVEL:String = "floorLevel"
  val CONST_PROPERTY_FLOORS:String = "floors"
  val CONST_PROPERTY_FLOORNAME:String = "floorName"
  val CONST_PROPERTY_POSITION:String = "position"
  val CONST_PROPERTY_SHOWALLDEVICESONSCREEN:String = "showAllDevicesOnScreen"
  val CONST_PROPERTY_CATEGORY:String = "category"
  val CONST_PROPERTY_TYPE:String = "type"
  val CONST_PROPERTY_SKILLS:String = "skills"
  val CONST_PROPERTY_MAPHIERARCHY:String = "mapHierarchy"
  val CONST_PROPERTY_HIERARCHY:String = "hierarchy"
  val CONST_PROPERTY_CAMPUSID:String = "campusId"  //fixme???
  val CONST_PROPERTY_CAMPUSNAME:String = "campusName"
  val CONST_PROPERTY_CAMPUSINFO:String = "campusInfo"
  val CONST_PROPERTY_CAMPUSCONF:String = "campusConf"
  val CONST_PROPERTY_CAMPUSREF:String = "campusRef"
  val CONST_PROPERTY_CAMPUSES:String = "campuses"
  val CONST_PROPERTY_MAPNAME:String = "mapName"
  val CONST_PROPERTY_SWAPXY:String = "swapXY"
  val CONST_PROPERTY_CMXSCALERATE:String = "cmxScaleRate"
  val CONST_PROPERTY_CMXPOSITIONAMPLIFYX:String = "cmxPositionAmplifyX"
  val CONST_PROPERTY_CMXPOSITIONAMPLIFYY:String = "cmxPositionAmplifyY"
  val CONST_PROPERTY_CMXPOSITIONPLUSX:String = "cmxPositionPlusX"
  val CONST_PROPERTY_CMXPOSITIONPLUSY:String = "cmxPositionPlusY"
  val CONST_PROPERTY_CMXPOSITIONTRACKWIDTH:String = "cmxPositionTrackWidth"
  val CONST_PROPERTY_CMXPOSITIONTRACKHEIGHT:String =  "cmxPositionTrackHeight"
  val CONST_PROPERTY_ENABLE:String = "enable"
  val CONST_PROPERTY_MACADDRESS:String = "macAddress"
  val CONST_PROPERTY_SCALE:String  = "scale"
  val CONST_PROPERTY_COUNT:String = "count"
  val CONST_PROPERTY_MACANDPOSITION:String = "macAndPosition"
  val CONST_PROPERTY_IPADDRESS:String = "ipAddress"
  val CONST_PROPERTY_TAGS:String = "tags"
  val CONST_PROPERTY_PROPERTIES:String = "properties"
  val CONST_PROPERTY_CREATED:String = "created"
  val CONST_PROPERTY_UPDATED:String = "updated"
  val CONST_PROPERTY_VISITINGDAY:String = "visitingDay"
  val CONST_PROPERTY_VISITINGHOUR:String = "visitingHour"
  val CONST_PROPERTY_VISITINGMINUTE:String = "visitingMinute"
  val CONST_PROPERTY_USERID:String = "userId"
  val CONST_PROPERTY_ACTIVETIME:String = "activeTime"

  val CONST_PROPERTY_VISITINGDAYS:String = "visitingDays"
  val CONST_PROPERTY_VISITINHOURS:String = "visitingHours"
  val CONST_PROPERTY_VISITINGDAYHOURCOUNTS:String = "visitingDayHourCounts"

  val GLANCE_CAMPUSES_CACHE:String = "Glance.Campuses.Cache"
  val GUEST_ANALYZE_ALL_CACHE:String = "guestanalyze.all"
  val CONST_GLANCE_ALL:String = "all"
  val CONST_PROPERTY_VALUE:String = "value"

  val system = ActorSystem(CONST_ACTOR_SYSTEM_NAME)

  def getTenantOrgId():String = {
    return scala.util.Properties.envOrElse("GLANCE_ORGID", "cisco")
  }

  def getTenantUserId():String = {
    return scala.util.Properties.envOrElse("GLANCE_USERID", "glance")
  }

  def filterLastWeekDays(allDays:List[String]):List[String]={
    val date =new DateTime()
    val tz:DateTimeZone =DateTimeZone.getDefault()
    val tmpDate =date.withZone(tz)
    val days:mutable.MutableList[String] =new mutable.MutableList[String]();
    days += tmpDate.toString("d MMMM, yyyy")
    for(cl <- 1 to 6)
    {
       val tmpDateX =date.minusDays(cl)
       days += tmpDateX.toString("d MMMM, yyyy")
    }
    allDays.filter( dayStr => (days.indexOf(dayStr)!= -1))
  }

  def getDayString(timeZone:String=""):String ={
    val date =new DateTime()
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone);
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy")
  }

  def getDayStringFromUTCTimeStamp(utcTime:Long,timeZone:String=""):String ={
    val date =new DateTime(utcTime)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy")
  }

  def getDayStringFromCMXDate(dateString:String,timeZone:String=""):String ={
    var date =new DateTime()
    if(dateString!="")
      date =new DateTime(dateString)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy")
  }

  def getMinuteString(timeZone:String=""):String ={
    val date =new DateTime()
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy HH:mm:00")
  }

  def getMinuteStringFromUTCTimeStamp(utcTime:Long,timeZone:String=""):String ={
    val date =new DateTime(utcTime)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy HH:mm:00")
  }

  def getMinuteStringFromCMXDate(dateString:String,timeZone:String=""):String ={
    var date =new DateTime()
    if(dateString!="")
      date =new DateTime(dateString)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("d MMMM, yyyy HH:mm:00")
  }

  def getHourString(timeZone:String=""):String ={
    val date =new DateTime()
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("HH:00 - HH:59 a")
  }

  def getHourStringFromUTCTimeStamp(utcTime:Long,timeZone:String=""):String ={
    val date =new DateTime(utcTime)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("HH:00 - HH:59 a")
  }

  def getHourStringFromCMXDate(dateString:String,timeZone:String=""):String ={
    var date =new DateTime()
    if(dateString!="")
      date =new DateTime(dateString)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.toString("HH:00 - HH:59 a")
  }

  def getTime(timeZone:String=""):Long ={
    val date =new DateTime()
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.getMillis()
  }

  def getTimeFromUTCTimeStamp(utcTime:Long,timeZone:String=""):Long ={
    val date =new DateTime(utcTime)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.getMillis()
  }

  def getTimeFromCMXDate(dateString:String,timeZone:String=""):Long ={
    var date =new DateTime()
    if(dateString!="")
      date =new DateTime(dateString)
    var  tz:DateTimeZone =DateTimeZone.getDefault()
    if(timeZone!="")
      tz =DateTimeZone.forID(timeZone)
    val tmpDate =date.withZone(tz)
    tmpDate.getMillis()
  }


  def isCMX8(version:String):Boolean ={
      if(version.startsWith("8.") || version =="8")
          true
      else
          false
  }

  def getCredential(orgId:String=ComUtils.getTenantOrgId(),userId:String=ComUtils.getTenantUserId(),pass:String="",token:String=""):GlanceCredential ={
    return new GlanceCredential(glanceOrgId = orgId,glanceUserId = userId,glancePassword = pass,session=token)
  }

  def getBaseUri(glanceSystemConf: GlanceSystemConf):String={
      var baseUri:String =glanceSystemConf.glanceCmxSetting.cmxProtocol+"://"+glanceSystemConf.glanceCmxSetting.cmxHost
      if(glanceSystemConf.glanceCmxSetting.cmxPort!=0)
        baseUri =baseUri +":"+glanceSystemConf.glanceCmxSetting.cmxPort
      baseUri
  }

  def parseCMXDate(str_date:String): Date ={
    try{
        new DateTime(str_date).toDate()
    }catch {
      case e:Throwable =>
        new DateTime().toDate()
    }
  }

  def formatCMXTime(currentServerTime:Long,minutesBefore:Long=0,timeZone:String):String ={
      val date =new DateTime(currentServerTime)
      val tz:DateTimeZone = DateTimeZone.forID(timeZone );
      var tmpDate =date.withZone(tz)

      if(minutesBefore==0)
      {
          tmpDate =tmpDate.minusMillis(tmpDate.millisOfDay().get())
      }else{
        tmpDate =tmpDate.minusMinutes(minutesBefore.toInt)
      }
      tmpDate.toString("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  }


  def getIPV4(js:JsValue):String={
    val ipList = (js \ ComUtils.CONST_PROPERTY_IPADDRESS).asOpt[List[String]].getOrElse(List())
    ipList.foreach{ address =>
      Logger.info("address:"+address)
      if(address.contains('.') && address.split("\\.").length==4)
        return address
    }
    return ""
  }

  def getIPV6(js:JsValue):String={
    val ipList = (js \ ComUtils.CONST_PROPERTY_IPADDRESS).asOpt[List[String]].getOrElse(List())
    ipList.foreach{ address =>
      if(address.contains(':') && address.split(":").length==8)
        return address
    }
    return ""
  }

  def getListOfFloorMapActiveExperts(floorActives: mutable.HashMap[String,mutable.HashMap[String,RegisteredUser]]): JsArray ={
    var jsArray:JsArray=JsArray()
    floorActives.foreach{ (e: (String, mutable.HashMap[String,RegisteredUser])) =>
      jsArray = jsArray ++ getJsonArrayExpertWithFloorId(e._2.values.toList.filter(p =>(p.position.x>=0 && p.position.y>0) || (p.position.x>0 && p.position.y>=0)).filter(p => !p.fixedLocation),e._1)
    }
    jsArray
  }

  def getJsonArrayExpertWithFloorId(list: List[RegisteredUser],floorId:String): JsArray = {
    var listValues:mutable.MutableList[JsObject] =mutable.MutableList[JsObject]()
    list.foreach{ user =>
      var tmpObj =Json.toJson(user).as[JsObject]
      tmpObj = ComUtils.removeObjectCommonProperties(tmpObj)
      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_SKILLS))
        tmpObj += (ComUtils.CONST_PROPERTY_SKILLS -> Json.toJson(user.topics))

      if(tmpObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(user.position.x.toInt,user.position.y.toInt)))
      else
        tmpObj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))
      tmpObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(floorId))

      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID) || (tmpObj \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
        tmpObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(user.position.buildingId))
      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_CAMPUSID) || (tmpObj \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")=="")
        tmpObj += (ComUtils.CONST_PROPERTY_CAMPUSID -> JsString(user.position.campusId))
      listValues += tmpObj
    }
    listValues.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }


  def getJsonArrayExpertWithZones(list: List[RegisteredUser],zoneMap:mutable.HashMap[String,List[GlanceZone]]=mutable.HashMap[String,List[GlanceZone]]()): JsArray = {
    var listValues:mutable.MutableList[JsObject] =mutable.MutableList[JsObject]()
    list.foreach{ user =>
      var tmpObj =Json.toJson(user).as[JsObject]
      tmpObj = ComUtils.removeObjectCommonProperties(tmpObj)
      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_SKILLS))
        tmpObj += (ComUtils.CONST_PROPERTY_SKILLS -> Json.toJson(user.topics))
      if(tmpObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(user.position.x.toInt,user.position.y.toInt)))
      else
        tmpObj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))

      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_FLOORID))
        tmpObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(user.position.floorId))
      else if( (tmpObj \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse("")=="")
      {
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> JsString(user.position.floorId))
      }

      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID))
        tmpObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(user.position.buildingId))
      else if((tmpObj \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(user.position.buildingId))

      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_CAMPUSID))
        tmpObj += (ComUtils.CONST_PROPERTY_CAMPUSID -> JsString(user.position.campusId))
      else if((tmpObj \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")=="")
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_CAMPUSID -> JsString(user.position.campusId))

      val zones =zoneMap.get(user.id).getOrElse(List())
      tmpObj ++=Json.obj(ComUtils.CONST_PROPERTY_ZONES -> getJsonArrayValue(zones.map(z => Json.toJson(z))))

      listValues += tmpObj
    }
    listValues.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArrayExpert(list: List[RegisteredUser],bWithPositionInfo:Boolean =true): JsArray = {

    var listValues:mutable.MutableList[JsObject] =mutable.MutableList[JsObject]()
    list.foreach{ user =>
        var tmpObj =Json.toJson(user).as[JsObject]
        tmpObj = ComUtils.removeObjectCommonProperties(tmpObj)
        if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_SKILLS))
          tmpObj += (ComUtils.CONST_PROPERTY_SKILLS -> Json.toJson(user.topics))

        if(bWithPositionInfo){
          if(tmpObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
            tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(user.position.x.toInt,user.position.y.toInt)))
          else
            tmpObj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))

          if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_FLOORID))
            tmpObj += (ComUtils.CONST_PROPERTY_FLOORID -> JsString(user.position.floorId))
          else if( (tmpObj \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse("")=="")
          {
            tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_FLOORID -> JsString(user.position.floorId))
          }
        }else{ //for register value, position info should be removed...
          if(tmpObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
            tmpObj -= ComUtils.CONST_PROPERTY_POSITION
        }

        if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_BUILDINGID))
          tmpObj += (ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(user.position.buildingId))
        else if((tmpObj \ ComUtils.CONST_PROPERTY_BUILDINGID).asOpt[String].getOrElse("")=="")
          tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_BUILDINGID -> JsString(user.position.buildingId))

        if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_CAMPUSID))
          tmpObj += (ComUtils.CONST_PROPERTY_CAMPUSID -> JsString(user.position.campusId))
        else if((tmpObj \ ComUtils.CONST_PROPERTY_CAMPUSID).asOpt[String].getOrElse("")=="")
          tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_CAMPUSID -> JsString(user.position.campusId))

        listValues += tmpObj
    }
    listValues.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArrayArea(list: List[GlanceInterestPoint]): JsArray = {

    var listValues:mutable.MutableList[JsObject] =mutable.MutableList[JsObject]()
    list.foreach{ interestPoint =>
      var tmpObj =Json.toJson(interestPoint).as[JsObject]
      tmpObj = ComUtils.removeObjectCommonProperties(tmpObj)
      if(!tmpObj.keys.contains(ComUtils.CONST_PROPERTY_SKILLS))
        tmpObj += (ComUtils.CONST_PROPERTY_SKILLS -> Json.toJson(List(interestPoint.description)))
      if(tmpObj.keys.contains(ComUtils.CONST_PROPERTY_POSITION)){
        tmpObj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(interestPoint.position.x.toInt,interestPoint.position.y.toInt)))
      }
      else
        tmpObj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))
      tmpObj += (ComUtils.CONST_PROPERTY_CATEGORY -> JsString("mark"))
      listValues += tmpObj
    }
    listValues.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArrayInt(list: List[Int]): JsArray = {
    list.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArray(list: List[JsObject]): JsArray = {
    list.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArrayValue(list: List[JsValue]): JsArray = {
    list.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def getJsonArrayStr(list: List[String]): JsArray = {
    list.foldLeft(JsArray())((acc, x) => acc ++ Json.arr(x))
  }

  def objectHasProperty(obj:Object,propertyName:String):Boolean={
      ComUtilsEx.objectHasProperty(obj,propertyName)
  }

  def isVertical(layout:String):Boolean ={
    if(layout.compareToIgnoreCase("vertical")==0)
      true
    else
      false
  }
  def getDigitPrecision(x: Double, n: Int) = {
    def p10(n: Int, pow: Long = 10): Long = if (n==0) pow else p10(n-1,pow*10)
    if (n < 0) {
      val m = p10(-n).toDouble
      math.round(x/m) * m
    }
    else {
      val m = p10(n).toDouble
      math.round(x*m) / m
    }
  }

  def isPointInPolygon(poly: List[GlanceLoc], x: GlanceLoc): Boolean = {
    (poly.last :: poly).sliding(2).foldLeft(false) { case (c, List(i, j)) =>
      val cond = {
        (
          (i.lat <= x.lat && x.lat < j.lat) ||
            (j.lat <= x.lat && x.lat < i.lat)
          ) &&
          (x.long < (j.long - i.long) * (x.lat - i.lat) / (j.lat - i.lat) + i.long)
      }
      if (cond) !c else c
    }
  }

  def isPolygonInPolygon(ploy:List[GlanceLoc],ployToDetect:List[GlanceLoc]):Boolean={
      var bContained =false
      for(cl <- 0 to ployToDetect.length-1){
        bContained = bContained && isPointInPolygon(ploy,ployToDetect(cl))
      }
      bContained
  }

  def isPeople(cate:String):Boolean={
    cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_EXPERT)==0 || cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_PERSON)==0 ||cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_PEOPLE)==0
  }
  def isDevice(cate:String):Boolean={
    cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_ASSET)==0 || cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_MOBILE)==0 || cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_THING)==0
  }
  def isAll(cate:String):Boolean={
    if (cate ==null){
      false
    }else{
      if(cate.compareToIgnoreCase(CONST_GLANCE_ALL)==0)
        true
      else
        false
    }
  }

  def isUntracked(cate:String):Boolean={
    if(isAll(cate) || isPeople(cate) || isDevice(cate) || isTmp(cate))
      false
    else
      true
  }

  //check the floor is configured as CMX floor
  def isCmxServiceType(serviceType:String):Boolean={
    if(serviceType.compareToIgnoreCase(ComUtils.SERVICE_TYPE_CMX)==0)
      true
    else
      false
  }

  def hierarchyLevel(hierarchy:String,defaultSplit:String=ComUtils.HIERARCHY_SPLIT):Int={
    val arr =hierarchy.split(defaultSplit)
    if(arr!=null)
      arr.toList.filter(p => p!=null && p.trim!="").length
    else
      0
  }
  //check is meraki hierarchy, for meraki there is no hierarchy level seperated by >
  def isMerakiHierarchy(hierarchy:String):Boolean={
    if(hierarchyLevel(hierarchy) <3 ){
      true
    }else
      false
  }

  def isCorrectHierarchy(hierarchy:String):Boolean={
    if(hierarchyLevel(hierarchy) <3){
      false
    }else
      true
  }

  def isTmp(cate:String):Boolean= {
    cate.compareToIgnoreCase(ComUtils.SMART_DEVICE_TYPE_GUEST)==0
  }


  //collection distinct by property
  def distinctBy[L, E](list: List[L])(f: L => E): List[L] =
    list.foldLeft((Vector.empty[L], Set.empty[E])) {
      case ((acc, set), item) =>
        val key = f(item)
        if (set.contains(key)) (acc, set)
        else (acc :+ item, set + key)
    }._1.toList


  def parseEmailAddress(email:String):(String,String)={
    val tmpIndex =email.lastIndexOf("@")
    if(tmpIndex>0)
      (email.substring(0,tmpIndex).trim,
        if(tmpIndex+1>=email.length)
          ""
        else
        {
          email.substring(tmpIndex+1).trim
        })
    else if(tmpIndex==0)
      ("","")
    else
      (email,"")
  }

  def outputErrorMsg(msg:String):Unit={
    val date =new DateTime()
    System.out.println(date.toString+" "+{
      if(msg==null)
        "null"
      else
        msg
    })
  }

  def valueInValues(values:List[String],valuesToCheck:List[String]):Boolean={
    val valuesToCheckX =valuesToCheck.filter(p =>p!="").map(p => p.toLowerCase)
    val valuesX =values.filter(p => p!="").map(p => p.toLowerCase)
    if(valuesToCheckX.length<=0 || values.length<=0)
      return false

    for(cl <-0 to valuesToCheckX.length-1){
       if(valuesX.contains(valuesToCheckX(cl)))
         return true
    }
    return false
  }

  def compareVersion(currentVersion:String,destinationVersion:String):Int={
    val cVer =currentVersion.split('.').toList.map(p =>p.toInt)
    val dVer =destinationVersion.split('.').toList.map(p => p.toInt)

    val nMin =Math.min(cVer.length,dVer.length)

    for(cl<-0 to nMin-1)
    {
      if(cVer(cl)>dVer(cl))
        return 1
      else if(cVer(cl)<dVer(cl))
        return -1
    }
    if(cVer.length>dVer.length)
      return 1
    else if(cVer.length<dVer.length)
      return -1
    else
      return 0
  }

  def needConvertVersion(currentVersion:String,destinationVersion:String):Boolean={
    if(compareVersion(currentVersion,destinationVersion) <0)
      true
    else
      false
  }

  def userIdHasExtendedAlreay(id:String):Boolean={
      if(id.lastIndexOf("@Device") >=0)
        true
      else
        false
  }
  def getUserIdWithNoDeviceExtension(id:String):String={
    val nIndex =id.lastIndexOf("@Device")
    if(nIndex>0) {
      id.substring(0,nIndex)
    }else{
      id
    }
  }

  def userMacAddressSort(deviceList:List[String]): List[String] ={
    deviceList.sortWith((left, right) => {
      if (left.compareToIgnoreCase(right) >0)
        true
      else
        false
    })
  }

  def getUserIdByDeviceId(id:String,deviceId:String,deviceIdList:List[String]): String =
  {
    val deviceExt = "@Device"
    val defaultDeviceIndex = 0

    if(userIdHasExtendedAlreay(id))
      return id

    if (deviceIdList.length <= 0)
      return id + deviceExt + defaultDeviceIndex

    val deviceList = deviceIdList.sortWith((left, right) => {
      if (left.compareToIgnoreCase(right) >= 0)
        true
      else
        false
    }).map(p => p.toLowerCase)

    val nIndex = deviceList.indexOf(deviceId.toLowerCase)
    if (nIndex >= 0) {
      id + deviceExt + nIndex
    } else {
      id + deviceExt + defaultDeviceIndex
    }
  }

  def readNullStringDefault(tmpValue:Option[String],defaultVal:String =""):String={
   tmpValue match {
      case Some(strValue) =>
        if(strValue.compareToIgnoreCase("NOT.APPLICABLE")==0 || strValue.compareToIgnoreCase("NOT APPLICABLE")==0)
        {
          Logger.warn("The value is NOT.APPLICABLE or NOT APPLICABLE, just convert to blank value.")
          defaultVal
        }
        else
          strValue
      case None =>
        defaultVal
    }
  }

  def readNullIntDefault(tmpValue:Option[Int],defaultVal:Int = 0):Int={
    tmpValue match {
      case Some(strValue) =>
        strValue
      case None =>
        defaultVal
    }
  }

  def readNullLongDefault(tmpValue:Option[Long],defaultVal:Long =0):Long={
    tmpValue match {
      case Some(strValue) =>
        strValue
      case None =>
        defaultVal
    }
  }

  def readNullDoubleDefault(tmpValue:Option[Double],defaultVal:Double =0):Double={
    tmpValue match {
      case Some(strValue) =>
        strValue
      case None =>
        defaultVal
    }
  }

  def purifyISEUserId(username:String):String={
    val tmpUsername =username.toLowerCase()
    if(tmpUsername=="")
      return tmpUsername

    val atIndex= tmpUsername.indexOf("@")
    if(atIndex>=0)
      return tmpUsername.substring(0,atIndex)

    val preIndex= tmpUsername.lastIndexOf("\\")
    if(preIndex>=0)
      return tmpUsername.substring(preIndex+1)

    val preIndexX= tmpUsername.lastIndexOf("/")
    if(preIndexX>=0)
      return tmpUsername.substring(preIndexX+1)

    //Logger.debug("After purified UserId:"+ tmpUsername)
    return tmpUsername
 }

  def removeObjectCommonProperties(jsObj:JsObject, filterProperties:List[String]=List(CONST_PROPERTY_DBID,CONST_PROPERTY_GLANCEORGID,CONST_PROPERTY_GLANCEUSERID)):JsObject={
    return JsObject(jsObj.fields.filterNot{f =>  filterProperties.contains(f._1)})
  }
}
