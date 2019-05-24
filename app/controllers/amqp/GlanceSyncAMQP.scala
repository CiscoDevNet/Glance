package controllers.amqp

import java.util.UUID

import akka.actor.ActorSystem
import com.rabbitmq.client.ConnectionFactory
import com.github.sstone.amqp.Amqp.Publish
import java.util.concurrent.TimeUnit

//import com.sun.tools.classfile.Type.ClassType

import models.glance.{GlanceVisitor, GlanceSystemConf}
import org.apache.poi.ss.formula.functions.T
import play.Logger
import play.api.Configuration
import play.api.libs.json._
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import services.cisco.notification.NotificationService
import services.common.ConfigurationService

import akka.actor._
import com.github.sstone.amqp.Amqp._
import com.github.sstone.amqp.ConnectionOwner.Create
import com.github.sstone.amqp.{Amqp, ChannelOwner, Consumer, ConnectionOwner}
import com.rabbitmq.client.ConnectionFactory
import java.util.concurrent.TimeUnit
import play.Logger
import services.common.ConfigurationService
import services.security.GlanceCredential
import utils.ComUtils

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._
import play.api.cache.Cache

import scala.reflect.ClassTag
import play.api.Play.current
import shade.memcached._

//  import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 11/12/15.
 */

object GlanceSyncCache {

  import play.api.Play.current

  val CONST_EVENT_SERVICESTART = "glance.service.start"
  val CONST_EVENT_REGISTER = "glance.expert.register"
  val CONST_EVENT_NEWREGISTER = "glance.expert.new.register"
  val CONST_EVENT_EXPERTWITHDRAW = "glance.expert.withdraw"
  val CONST_EVENT_EXPERTJOIN = "glance.expert.join"
  val CONST_EVENT_EXPERTMOVEMENT = "glance.expert.movement"
  val CONST_EVENT_GUESTCOUNT = "glance.expert.guestcount"
  val CONST_EVENT_AVATARCHANGE = "glance.expert.avatarchange"
  val CONST_EVENT_BASE_DATA_CHANGE = "glance.data.changed"
  val CONST_EVENT_BASE_DATA_SYNC = "glance.data.sync"
  val CONST_CACHE_BASE_NAME = "glance.cache"
  val CONST_EVENT_ZONECOUNT = "glance.data.zone.count"
  val CONST_EVENT_ACCESSPOINTS_CONNECTED = "glance.data.accesspoints.connected"
  val CONST_EVENT_UI_CONTROL = "ui.control"
  val CONST_EVENT_UI_HIGHLIGHT = "ui.highlight"
  val CONST_EVENT_MAPSYNC = "glance.cache.map.sync"
  val CONST_EVENT_USERIMPORTCONFIGSYNC = "glance.cache.user.import.config.sync"
  val CONST_EVENT_USING_INMEMORY_IMPORTDATA_SYNC = "glance.cache.in.memory.user.import.config.sync"
  val CONST_EVENT_CACHE_INMEMORY_SYNC = "glance.cache.memcached.connected.records.sync"
  val CONST_CACHE_TRACK_TENANT_SERVER_RELOAD = "glance.cache.tenant.server.reload"
  val CONST_CACHE_INMEMORY_CONNECTEDRECORDS = "glance.cache.local.connected.records"
  val CONST_CACHE_SYSCONF_RELOAD = "glance.cache.conf.reload"
  val CONST_CACHE_REGISTERED_USERS_RELOAD = "glance.cache.registeredusers.reload"
  val CONST_CACHE_GLANCE_ZONES_RELOAD = "glance.cache.glancezone.reload"
  val CONST_CACHE_GLANCE_MAPINFO_RELOAD = "glance.cache.glancemapinfo.reload"
  val CONST_CACHE_GLANCE_TOKEN_SYNC = "glance.cache.glanceToken.sync"
  val CONST_CACHE_GLANCE_IMAGERESOURCE_RELOAD = "glance.cache.glanceimageresource.reload"
  val CONST_CACHE_GLANCE_FACILITY_IMG_RELOAD = "glance.cache.glancefacilityimg.reload"
  val CONST_CACHE_REGISTERED_GUESTS_RELOAD = "glance.cache.registeredguests.reload"
  val CONST_CACHE_TRACK_FLOORS_RELOAD = "glance.cache.trackfloors.reload"
  val CONST_CACHE_MERAKI_DEVICEINFO = "glance.cache.merakideviceinfo.reload"
  val CONST_CACHE_MERAKI_DEVICEINFO_ONE = "glance.cache.merakideviceinfo.cache"
  val CONST_CACHE_TRACK_VISITOR_SCANNING = "glance.cache.trackvisitors.scanning"
  val CONST_CACHE_TRACK_BUILDINGS_RELOAD = "glance.cache.trackbuildings.reload"
  val CONST_CACHE_TRACK_CAMPUSES_RELOAD = "glance.cache.trackcampuses.reload"
  val CONST_CACHE_SCREEN_TO_FLOOR_RELOAD = "glance.cache.screentofloor.reload"
  val CONST_CACHE_INTEREST_POINT_RELOAD = "glance.cache.interestpoint.reload"
  val CONST_CACHE_ACCESS_POINT_RELOAD = "glance.cache.accesspoint.reload"

  //fixme please...
  val CONST_CACHE_DEVICE_ALIAS_RELOAD = "glance.cache.devicealias.reload"


  val CONST_CACHE_GLANCE_BUILDING_RELOAD = "glance.cache.GlanceBuilding.reload"
  val CONST_CACHE_GLANCE_CAMPUS_RELOAD = "glance.cache.GlanceCampus.reload"
  val CONST_CACHE_GLANCE_FLOOR_RELOAD = "glance.cache.GlanceFloor.reload"
  val CONST_CACHE_GLANCE_AUTH_DB_RELOAD = "glance.cache.glanceAuthDB.reload"
  val CONST_CACHE_GLANCE_GLANCE_MAP_INFO_RELOAD = "glance.cache.glanceMapInfoReal.reload"
  val CONST_CACHE_ALL_VISITORS_FROM_CMX = "glance.cache.GlanceVisitors"
  val CONST_CACHE_ALL_VISITORS_FROM_CMX_CLEAN = "glance.cache.GlanceVisitors.clean"
  val CONST_CACHE_SYNCUP_KEY = "SyncUp"

  val CONST_ALL_SCREEN_TRACK_FLOOR = "allScreenTrackFloor"
  val CONST_ALL_SCREEN_TRACK_FLOOR_MAP = "idToClientAddressMap"

  def getCacheName(dataName: String): String = {
    return CONST_CACHE_BASE_NAME + "." + ComUtils.glanceInstantId + "." + dataName
  }

  def setGlanceCache[T: ClassTag](dataName: String, data: T, expireDuration: Duration = 30.days): Boolean = {
    val name = CONST_CACHE_BASE_NAME + "." + ComUtils.glanceInstantId + "." + dataName
    try {
      if (data == null)
        Cache.remove(name)
      else
        Cache.set(name, data, expireDuration)
      true
    } catch {
      case ex: Throwable =>
        ComUtils.outputErrorMsg("Failed to update Cache for Name:" + name + " ex:" + ex.getMessage())
        false
    }
  }

  def getGlanceCacheWithMsg[T: ClassTag](dataName: String): (Option[T], String) = {
    val name = CONST_CACHE_BASE_NAME + "." + ComUtils.glanceInstantId + "." + dataName
    try {
      val optValue = Cache.getAs[T](name)
      (optValue, "Success")
    } catch {
      case ex: Throwable =>
        ComUtils.outputErrorMsg("Failed to read cache for Name:" + name + " with exception:" + ex.getMessage())
        (None, "error:" + ex.getMessage())
    }
  }

  def getGlanceCache[T: ClassTag](dataName: String): Option[T] = {
    val name = CONST_CACHE_BASE_NAME + "." + ComUtils.glanceInstantId + "." + dataName
    try {
      val optValue = Cache.getAs[T](name)
      optValue
    } catch {
      case ex: Throwable =>
        ComUtils.outputErrorMsg("Failed to read cache for Name:" + name + " with exception:" + ex.getMessage())
        None
    }
  }

  def getMessageQueueUri(): String = {
    val mqURI = scala.util.Properties.envOrElse("GLANCE_MQURI", ConfigurationService.getString("amqp.uri"))
    Logger.info("Glance message queue's server URI:" + mqURI)
    mqURI
  }

  def getMessageQueueEnabled(): Boolean = {
    val enabled = scala.util.Properties.envOrElse("GLANCE_MQENABLED", "")
    if (enabled.compareToIgnoreCase("false") == 0)
      return false
    if (enabled.compareToIgnoreCase("true") == 0)
      return true
    else
      return ConfigurationService.getBoolean("amqp.enabled", true)
  }

  def getMemcachedServer(): String = {
    val server = scala.util.Properties.envOrElse("MEMCACHED_SERVER", ConfigurationService.getString("memcached.server"))
    ComUtils.outputErrorMsg("Memcached Server:" + server)
    Logger.info("Glance memcached server:" + server)
    server
  }
}

object GlanceSyncConsumer {

  implicit val glanceInstanceId = ComUtils.glanceInstantId
  //implicit val system =ActorSystem(ComUtils.CONST_ACTOR_SYSTEM_NAME)
  var initialized = false;
  val connFactory = new ConnectionFactory()
  connFactory.setUri(GlanceSyncCache.getMessageQueueUri())
  connFactory.setRequestedHeartbeat(5)
  val conn = ComUtils.system.actorOf(ConnectionOwner.props(connFactory, 1 second))

  // create an actor that will receive AMQP deliveries
  val listener = ComUtils.system.actorOf(Props(new Actor {
    def isLoopMsg(eventFromInstance: String): Boolean = {
      if (eventFromInstance.compareToIgnoreCase(ComUtils.glanceInstantId) == 0)
        return true
      else
        return false
    }

    def validateMsg(eventName: String, eventId: String, eventFromInstance: String): Boolean = {
      if (eventName == null || eventName.trim().length == 0)
        return false
      if (eventId == null || eventId.trim.length == 0)
        return false
      if (eventFromInstance == null || eventFromInstance.trim.length == 0)
        return false
      return true
    }

    def handleEventMsg(body: Array[Byte]): Unit = {

      try {
        val msgBody = Json.parse(new String(body))
        val eventName = (msgBody \ "eventName").as[String]
        val eventId = (msgBody \ "eventId").as[String]
        val eventFromInstnace = (msgBody \ "eventFromInstance").as[String]
        if (!validateMsg(eventName, eventId, eventFromInstnace)) {
          ComUtils.outputErrorMsg("Unrecognized sync message is received:" + new String(body))
          return
        }
        if (isLoopMsg(eventFromInstnace)) {
          Logger.info("Loop sync message received:" + new String(body))
          return
        }
        //send sync message to actor handler
        NotificationService.handleSyncNotification(msgBody)
      } catch {
        case ex: Throwable =>
          ComUtils.outputErrorMsg("Failed to parse the sync message:" + body.toString() + " Exception:" + ex.getMessage())
      }
    }

    def receive = {
      case Delivery(consumerTag, envelope, properties, body) => {
        //Handle the receive sync message here....
        //Logger.info("Got a sync message: " + new String(body))
        try {
          handleEventMsg(body)
        } catch {
          case ex: Throwable =>
            ComUtils.outputErrorMsg("Failed to handle sync message:" + ex.getMessage())
        }
        sender ! Ack(envelope.getDeliveryTag)
      }
    }
  }))

  // create a consumer that will route incoming AMQP messages to our listener
  // it starts with an empty list of queues to consume from
  val consumer = ConnectionOwner.createChildActor(conn, Consumer.props(listener, channelParams = None, autoack = false))

  def createExchange(): Future[Option[Int]] = {
    def parseAMQPUrl(): (String, String, String) = {
      val u = new java.net.URI(GlanceSyncCache.getMessageQueueUri())
      val user = u.getUserInfo().split(":")
      if (user == null)
        return (u.getHost, "", "")
      else if (user.length == 1)
        return (u.getHost(), user(0), "")
      else
        return (u.getHost(), user(0), user(1))
    }
    def createRequest(json: Boolean = true, timeout: Int = 60 * 1000): WSRequestHolder = {
      val hostuserpass = parseAMQPUrl()
      Logger.info("MQ Host:" + hostuserpass._1 + " user:" + hostuserpass._2 + " pass:" + hostuserpass._3)
      val urlStr = "http://" + hostuserpass._1 + ":15672/api/exchanges/%2f/glance.exchange.data"
      Logger.info("mq:url:" + urlStr)
      val holder = WS.url(urlStr).withAuth(hostuserpass._2, hostuserpass._3, WSAuthScheme.BASIC).withRequestTimeout(timeout)
      holder.withHeaders("Content-Type" -> "application/json")
      if (json) holder.withHeaders("Accept" -> "application/json")
      else holder
    }

    val holder: WSRequestHolder = createRequest()
    val data = Json.obj(
      "type" -> "fanout",
      "durable" -> JsBoolean(true)
    )
    val response = (response: WSResponse) => {
      response.status match {
        case 200 | 204 =>
          Logger.info(s"Create exchange:glance.exchange.data successfully")
          Some(200)
        case _ =>
          ComUtils.outputErrorMsg(s"Create exchange:glance.exchange.data failed")
          None
      }
    }
    holder.put(data).map(response)
  }

  // create an AMQP connection
  def makeConnection() = {
    Logger.info(s"Glance Sync consumer entry!!")
    if (initialized == false) {
      // wait till everyone is actually connected to the broker
      Amqp.waitForConnection(ComUtils.system, consumer).await()

      // create a queue, bind it to a routing key and consume from it
      // here we don't wrap our requests inside a Record message, so they won't replayed when if the connection to
      // the broker is lost: queue and binding will be gone

      // create a queue
      val queueName = "glance.queue." + glanceInstanceId;
      val queueParams = QueueParameters(queueName, passive = false, durable = false, exclusive = false, autodelete = true)

      consumer ! DeclareQueue(queueParams)
      // bind it
      consumer ! QueueBind(queue = queueName, exchange = "glance.exchange.data", routing_key = "*")
      // tell our consumer to consume from it
      consumer ! AddQueue(QueueParameters(name = queueName, passive = false))
      // run the Producer sample now and see what happens
      initialized = true
      Logger.info(s"Glance Sync consumer!!")
    }

  }

}

object GlanceSyncProducer {
  val CONST_EVENT_NAME = "eventName"
  val CONST_EVENT_ID = "eventId"
  val CONST_EVENT_FROM_INSTANCE = "eventFromInstance"
  val CONST_MQ_EXCHANGE_DATA = "glance.exchange.data"

  //implicit val system = ActorSystem(ComUtils.CONST_ACTOR_SYSTEM_NAME)
  // create an AMQP connection
  val connFactory = new ConnectionFactory()
  connFactory.setUri(GlanceSyncCache.getMessageQueueUri())
  connFactory.setRequestedHeartbeat(5)
  val conn = ComUtils.system.actorOf(ConnectionOwner.props(connFactory, 1 second))
  val producer = ConnectionOwner.createChildActor(conn, ChannelOwner.props())
  var initialized = false

  // wait till everyone is actually connected to the broker
  def makeConnection(): Unit = {
    //println("Glance Sync Producer entry!!")
    if (initialized == false) {
      waitForConnection(ComUtils.system, conn, producer).await(5, TimeUnit.SECONDS)
      //send a service start message...
      //println("Glance Sync Producer!")
      producer ! Publish(CONST_MQ_EXCHANGE_DATA, "*", getEventMessage(GlanceSyncCache.CONST_EVENT_SERVICESTART, "{\"service\":\"start\"}").getBytes, properties = None, mandatory = true, immediate = false)
      NotificationService.preloadAllCaches()
      initialized = true
    }
  }

  def sendSyncMessage(eventName: String, eventData: String, credential: GlanceCredential): Unit = {
    if (GlanceSyncCache.getMessageQueueEnabled()) {
      producer ! Publish(CONST_MQ_EXCHANGE_DATA, "*", getEventMessage(eventName, eventData, credential).getBytes, properties = None, mandatory = true, immediate = false)
    }
  }

  def getEventMessage(eventName: String, eventData: String, credential: GlanceCredential = new GlanceCredential(glanceOrgId = ComUtils.getTenantOrgId(), glanceUserId = ComUtils.getTenantUserId())): String = {
    val msgBody = Json.obj(CONST_EVENT_NAME -> eventName, CONST_EVENT_ID -> UUID.randomUUID().toString, CONST_EVENT_FROM_INSTANCE -> ComUtils.glanceInstantId, "eventData" -> eventData, "credential" -> Json.toJson(credential))
    return msgBody.toString()
  }
}

object GlanceMemcached {

  import shade.memcached.Configuration

  val CONST_MEMCACHED_CACHE_BASE_NAME = "glance.memcached.cache"
  val CONST_MEMCACHED_CONNECT_SCANNING_FLAG = "glance.visitorScan.all.connect.isScanning"
  val CONST_MEMCACHED_CONNECT_CANNING_ALLDATA = "glance.visitorScan.all.connect"
  val CONST_MEMCACHED_VISITORSCANNING_FLAG = "glance.visitorScan.all.isScanning"
  val CONST_MEMCACHED_VISITORSCANNING_ISWRITING = "glance.visitorScan.all.isWriting"
  val CONST_MEMCACHED_VISITORSCANNING_ALLDATA = "glance.visitorScan.all"
  val CONST_MEMCACHED_VISITORSCANNING_DATALOCK = "glance.visitorScan.WriteLock"
  val CONST_CACHE_GUESTCOUNT = "glance.guestCount."
  val CONST_CACHE_USER_ACTIVITY_COUNT = "glance.userActivityCount."

  val memcached = Memcached(Configuration(GlanceSyncCache.getMemcachedServer()))
  def getMainName(prefix_name:String,mainName:String):String={
    prefix_name+"."+mainName
  }

  def getSlaveName(prefix_name:String,mainName:String):String={
    prefix_name+"."+mainName+".slave"
  }

  def init(): Unit = {
    Logger.info("GlanceMemcached initialized")
  }

  def setMemcachedData(keyName: String, dataValue: String, duration: Duration = 1.minute): Future[String] = {
    val name =getMainName(ComUtils.glanceInstantId,keyName)
    val nameSlave = getSlaveName(ComUtils.glanceInstantId,keyName)

    for {
      uMaster <- memcached.set(name, dataValue, duration)
      uSlave <- memcached.set(nameSlave, dataValue, duration)
    } yield {
      name
    }

  }

  def memcachedWriteLock(lockName: String): Future[Long] = {
    val name =getMainName(ComUtils.CONST_GLOBAL,lockName)
    memcached.increment(name, 1, Some(1), 2 minutes)
  }

  def waitForLock(lockName: String): Future[Long] = {
    var bStop = false
    val p = Promise[Long]
    val f = p.future

    Future {
      while (bStop) {
        memcachedWriteLock(lockName).map { nLock =>
          if (nLock == 1) {
            bStop = true
            p.success(nLock)
          } else {
            memcachedWriteUnlock(lockName)
            Thread.sleep(5)
          }
        }
      }
    }

    f.map { nLock =>
      nLock
    }
  }

  def memcachedWriteUnlock(lockName: String): Future[Long] = {
    val name = getMainName(ComUtils.CONST_GLOBAL,lockName)
    memcached.decrement(name, 1, Some(0), 2 minutes)
  }

  def setGlobalMemcachedData(keyName: String, dataValue: String, duration: Duration = 1.minute): Future[String] = {
    val name = getMainName(ComUtils.CONST_GLOBAL,keyName)
    val nameSlave =getSlaveName(ComUtils.CONST_GLOBAL,keyName)
    for {
      uMaster <- memcached.set(name, dataValue, duration)
      uSlave <- memcached.set(nameSlave, dataValue, duration)
    } yield {
      name
    }
  }

  def getMemcachedData(keyName: String): Future[Option[String]] = {
    val name = keyName
    val nameSlave = keyName + ".slave"
    for {
      result <- memcached.get[String](name)
      resultSlave <- memcached.get[String](nameSlave)
    } yield {
      if (result.isDefined && result.get != "")
        result
      else
        resultSlave
    }
  }

  def getGlobalMemcachedData(keyName: String): Future[Option[String]] = {
    val name = getMainName(ComUtils.CONST_GLOBAL,keyName)
    val nameSlave = getSlaveName(ComUtils.CONST_GLOBAL,keyName)

    for {
      result <- memcached.get[String](name)
      resultSlave <- memcached.get[String](nameSlave)
    } yield {
      if (result.isDefined && result.get != "")
        result
      else
        resultSlave
    }
  }


  def setGlanceCacheListEx[T: ClassTag](dataName: String, data: List[T], writes: Writes[T], expireDuration: Duration = 30.days): Future[Boolean] = {
    val name = getMainName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    val nameSlave = getSlaveName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    for {
      nLock <- memcachedWriteLock(CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
      bStatus <- {
        if (data == null || data.length <= 0) {
          memcached.delete(name)
          memcached.delete(nameSlave)
        }
        else {
          val strVal = try {
            Json.toJson(data.map(x => Json.toJson(x)(writes))).toString()
          } catch {
            case exp: Throwable =>
              ComUtils.outputErrorMsg("Failed to write memcached data for:" + name + " exception:" + exp.getMessage)
              "[]"
          }
          for {
            bMaster <- memcached.set(name, strVal, expireDuration)
            bSlave <- memcached.set(nameSlave, strVal, expireDuration)
          } yield {
            true
          }
        }
      }
      nUnlock <- memcachedWriteUnlock(CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
    } yield {
      bStatus
    }
  }

  def setGlanceCacheList[T: ClassTag](dataName: String, data: List[T], writes: Writes[T], expireDuration: Duration = 30.days, tryTimes: Int = 2): Future[Boolean] = {

    val p = Promise[Boolean]
    val f = p.future
    Future {
      try {
        for (cl <- 0 to tryTimes - 1) {
          setGlanceCacheListEx[T](dataName,data,writes,expireDuration).map { bStatus =>
            if (bStatus) {
              p.success(bStatus)
            }
            else if (cl >= tryTimes - 1) {
              p.success(bStatus)
            } else {
              Thread.sleep(50) //just wait 50 ms to make more writable???
            }
          }.recover {
            case _ =>
              if (cl >= tryTimes - 1) {
                p.success(false)
              }
          }
        }
      } catch {
        case exp: Throwable =>
          ComUtils.outputErrorMsg("Failed to set GlanceCacheEx List:" + exp.getMessage)
          p.success(false)
      }
    }
    f.map { bStatus =>
      bStatus
    }.recover {
      case _ =>
        false
    }
  }

  def readResult(masterResult:Option[String], slaveResult:Option[String]):String= {
    var result = "[]"
    if (masterResult isDefined) {
      result = masterResult.get
    }
    if ((result == "" || result == "[]") && slaveResult.isDefined) {
      result = slaveResult.get
      if (result == "")
        result = "[]"
    }
    result
  }

  def getGlanceCacheListEx[T: ClassTag](dataName: String, reads: Reads[T]): Future[Option[List[T]]] = {
    val name =getMainName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    val nameSlave = getSlaveName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    for {
      result <- memcached.get[String](name)
      resultSlave <- memcached.get[String](nameSlave)
    } yield {
      if (result.isDefined || resultSlave.isDefined) {
        val strResult = readResult(result,resultSlave)
        try {
          val values = Json.parse(strResult).as[List[JsValue]].map(x => x.as[T](reads))
          Some(values)
        } catch {
          case exp: Throwable =>
            ComUtils.outputErrorMsg("Failed to parse MemCached data for:" + name + " exception:" + exp.getMessage)
            None
        }
      } else {
        None
      }
    }
  }

  def getGlanceCacheList[T: ClassTag](dataName: String, reads: Reads[T], tryTimes: Int = 1): Future[Option[List[T]]] = {
    val p = Promise[Option[List[T]]]
    val f = p.future
    Future {
      try {
        for (cl <- 0 to tryTimes - 1) {
          getGlanceCacheListEx[T](dataName,reads).map { optList =>
            optList match {
              case Some(dataList) =>
                p.success(optList)
              case None =>
                if (cl >= tryTimes - 1) {
                  p.success(optList)
                }
            }
          }.recover {
            case _ =>
              if (cl >= tryTimes - 1) {
                p.success(None)
              }
          }
        }
      } catch {
        case exp: Throwable =>
          ComUtils.outputErrorMsg("Failed to read cached data:" + exp.getMessage)
          p.success(None)
      }
    }

    f.map { optList =>
      optList
    }.recover {
      case _ =>
        None
    }
  }

  def setGlanceCacheListStringEx(dataName: String, data: List[String], expireDuration: Duration = 30.days): Future[Boolean] = {
    val name = getMainName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    val nameSlave = getSlaveName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    for {
      nLock <- memcachedWriteLock(CONST_MEMCACHED_VISITORSCANNING_DATALOCK + dataName)
      bStatus <- {
        if (data == null || data.length <= 0) {
          memcached.delete(name)
          memcached.delete(nameSlave)
        }
        else {
          val strVal = try {
            Json.toJson(data.map(x => Json.toJson(x))).toString()
          } catch {
            case exp: Throwable =>
              ComUtils.outputErrorMsg("Failed to write memcached data for:" + name + " exception:" + exp.getMessage)
              "[]"
          }
          //Logger.info(" Write to memcached data:"+strVal)
          for {
            uMaster <- memcached.set(name, strVal, expireDuration)
            uSlave <- memcached.set(nameSlave, strVal, expireDuration)
          } yield {
            true
          }
        }
      }
      nUnlock <- memcachedWriteUnlock(CONST_MEMCACHED_VISITORSCANNING_DATALOCK + dataName)
    } yield {
      bStatus
    }
  }

  def setGlanceCacheListString(dataName: String, data: List[String], expireDuration: Duration = 30.days, tryTimes: Int = 2): Future[Boolean] = {
    val p = Promise[Boolean]
    val f = p.future
    Future {
      try {
        for (cl <- 0 to tryTimes - 1) {
          setGlanceCacheListStringEx(dataName, data, expireDuration).map { bStatus =>
            if (bStatus) {
              p.success(bStatus)
            }
            else if (cl >= tryTimes - 1) {
              p.success(bStatus)
            }
          }.recover {
            case _ =>
              if (cl >= tryTimes - 1) {
                p.success(false)
              }
          }
        }
      } catch {
        case exp: Throwable =>
          ComUtils.outputErrorMsg("Failed to set GlanceCacheEx List:" + exp.getMessage)
          p.success(false)
      }
    }
    f.map { bStatus =>
      bStatus
    }.recover {
      case _ =>
        false
    }
  }

  def getGlanceCacheListStringEx(dataName: String): Future[Option[List[String]]] = {
    val name = getMainName(CONST_MEMCACHED_CACHE_BASE_NAME,dataName)
    val nameSlave =getSlaveName(CONST_MEMCACHED_CACHE_BASE_NAME ,dataName)
    for {
      result <- memcached.get[String](name)
      resultSlave <- memcached.get[String](nameSlave)
    } yield {
      if (result.isDefined || resultSlave.isDefined) {
        val strResult = readResult(result,resultSlave)
        try {
          val values = Json.parse(strResult).as[List[JsValue]].map(x => x.as[String])
          Some(values)
        } catch {
          case exp: Throwable =>
            ComUtils.outputErrorMsg("Failed to parse MemCached data for:" + name + " exception:" + exp.getMessage)
            None
        }
      } else {
        None
      }
    }
  }

  def getGlanceCacheListString(dataName: String, tryTimes: Int = 1): Future[Option[List[String]]] = {
    val p = Promise[Option[List[String]]]
    val f = p.future
    Future {
      try {
        for (cl <- 0 to tryTimes - 1) {
          getGlanceCacheListStringEx(dataName).map { optList =>
            optList match {
              case Some(dataList) =>
                p.success(optList)
              case None =>
                if (cl >= tryTimes - 1) {
                  p.success(optList)
                }
            }
          }.recover {
            case _ =>
              if (cl >= tryTimes - 1) {
                p.success(None)
              }
          }
        }
      } catch {
        case exp: Throwable =>
          ComUtils.outputErrorMsg("Failed to read cached data:" + exp.getMessage)
          p.success(None)
      }
    }

    f.map { optList =>
      optList
    }.recover {
      case _ =>
        None
    }
  }

}