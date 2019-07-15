package services.cisco.indoor

import utils.ComUtils
import akka.actor.Actor
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache, GlanceMemcached}
import models._
import models.cmx.MapCoordinate
import models.cmx.Implicits._
import models.glance._
import play.Logger
import play.api.Play.current
import play.api.libs.json._
import play.api.libs.ws.{WSResponse, WSAuthScheme, WS, WSRequestHolder}
import services.cisco.notification.NotificationService
import services.common.SchedulingService
import services.security.GlanceCredential
import scala.collection.mutable
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 1/5/16.
 */
object CMXVisitorScan {
   val CACHE_NAME_CMX = "glanceVisitorCMX"
  val CACHE_NAME = "glance.cache.visitors"
  val CACHE_NAME_EXT = "glance.cache.visitors.ext"
  var currentServerTime:Long=System.currentTimeMillis()

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_ALL_VISITORS_FROM_CMX, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def cleanScanVisitorsCacheData(credential: GlanceCredential):Unit ={
    GlanceMemcached.setGlanceCacheList[GlanceVisitor](CACHE_NAME,List(),GlanceVisitor.glanceWrites,20.minutes,5)
  }

  def createRequest(cmxConf:GlanceSystemConf,baseUri:String,api: String, json: Boolean = true, timeout: Int = 2*60*1000) : WSRequestHolder = {
    Logger.info("URI:"+s"$baseUri$api")
    //Logger.info("Username:"+cmxConf.glanceCmxSetting.cmxUserName)
    //Logger.info("Password:"+cmxConf.glanceCmxSetting.cmxPassword)
    val holder = WS.url(s"$baseUri$api").withAuth(cmxConf.glanceCmxSetting.cmxUserName, cmxConf.glanceCmxSetting.cmxPassword, WSAuthScheme.BASIC).withRequestTimeout(timeout)
    holder.withHeaders("Content-Type" -> "application/json")
    if(json) holder.withHeaders("Accept" -> "application/json")
    else holder
  }

  def loadVisitorDataCMX10(credential: GlanceCredential,cmxConf:GlanceSystemConf,page:Int,pageSize:Int,mapHierarchy:String=""):Future[Option[JsValue]] = {
    val clientPath: String = {
      if(mapHierarchy=="")
        cmxConf.glanceCmxSetting.cmxClientPath +"?page="+page+"&pageSize="+pageSize
      else
        cmxConf.glanceCmxSetting.cmxClientPath +"?mapHierarchyString="+ java.net.URLEncoder.encode(mapHierarchy, "utf-8")+ "&page="+page+"&pageSize="+pageSize
    }

    val holder: WSRequestHolder = createRequest(cmxConf, ComUtils.getBaseUri(cmxConf), clientPath,json=true,timeout = 1000*60*5)
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Some(response.json)
        case 204 =>
          Some(ComUtils.getJsonArray(List()))
        case _ =>
          Logger.error("loadVisitorDataCMX10 data failed:" + response.status +", error:"+response.statusText)
          None
      }
    }
    holder.get().map(response).recover {
      case _ =>
        Logger.error("Get URL failed,exception:"+clientPath)
        None
    }
  }

  val randomX =scala.util.Random
  val scanActor = SchedulingService.schedule(classOf[GlanceVisitorScanActor], "GlanceVisitorScanActor", (randomX.nextInt(10)) seconds, (60+randomX.nextInt(10)) seconds, "!")

  def init(): Unit ={
    Logger.info("CMXVisitorScan Init")
    scanActor ! "!"
  }

  def trackFloorVisitors(floorId:String,hierarchy:String,credential: GlanceCredential): Unit ={
    scanActor !(floorId, hierarchy,credential)
  }

  def removeTrackFloorVisitors(floorId:String): Unit ={
    scanActor ! floorId
  }

  def trackFloorsVisitors(credential: GlanceCredential,floors:List[GlanceTrackFloor]):Unit ={
    scanActor !(credential,floors)
  }

  def syncTrackFloorsVisitors(credential: GlanceCredential):Unit= {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_VISITOR_SCANNING, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def removeTrackFloorVisitors(credential: GlanceCredential): Unit ={
    scanActor ! credential
  }

  class GlanceVisitorScanActor extends Actor {
    val todo = scala.collection.mutable.Map[String, GlanceCredential]()
    val floorMap = scala.collection.mutable.Map[String, String]()
    val todoFloors =new scala.collection.mutable.HashMap[GlanceCredential, List[GlanceTrackFloor]]()

    def isSomeInstanceIsScanning():Future[Boolean]={
      for{
        optFlag <-GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_FLAG)
        optInstanceId <-GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_ALLDATA)
      }yield{
        if(optFlag.isDefined && optFlag.getOrElse("0").toInt==1)
          true
        else{
          val tmpInstanceId =optInstanceId.getOrElse(ComUtils.glanceInstantId)
          (tmpInstanceId.compareToIgnoreCase(ComUtils.glanceInstantId)!=0)
        }
      }
    }
    
    def setInstanceIsScanning(isScanning:Boolean):Future[Boolean]={
      if (isScanning==true) {
        Future {
          true
        }
      }else {
        for{
          bFlag <- GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_FLAG, "1", 150 seconds)
          bInstanceSet<-GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_ALLDATA, ComUtils.glanceInstantId, 150 seconds)
        }yield{
          true
        }
      }
    }

    def parseVisitorDataCMX10(visitorData:JsValue,floors:List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo],credential: GlanceCredential): Future[List[GlanceVisitor]] ={
      val p = Promise[List[GlanceVisitor]]
      val f = p.future
      Future{
        try{
          var tmpVisitors:List[GlanceVisitor]=List()
          val macAddress = (visitorData \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String]
          val mapHierarchyString=(visitorData \"mapInfo" \ "mapHierarchyString").as[String]
          val lastLocatedTime =(visitorData \"statistics" \ "lastLocatedTime").as[String]
          val locationCoordinate = (visitorData \ "mapCoordinate").asOpt[MapCoordinate].getOrElse(new MapCoordinate())
          for (floor <- floors) {
            if (floor.hierarchy == mapHierarchyString || mapHierarchyString.contains(floor.hierarchy + ComUtils.HIERARCHY_SPLIT)) {
              val vDay = ComUtils.getDayStringFromCMXDate(lastLocatedTime, floor.floorConf.defaultTimeZone)
              val vMinute = ComUtils.getMinuteStringFromCMXDate(lastLocatedTime, floor.floorConf.defaultTimeZone)
              val vHour = ComUtils.getHourStringFromCMXDate(lastLocatedTime, floor.floorConf.defaultTimeZone)
              val msTime = ComUtils.getTimeFromCMXDate(lastLocatedTime, floor.floorConf.defaultTimeZone)
              val (_, positionArray) = NotificationService.getPositionArr(locationCoordinate, floor,null,mapSizes)
              val findPosition = new GlancePosition(positionArray(0), positionArray(1))

              val visitor = new GlanceVisitor(glanceOrgId = credential.glanceOrgId,
                floorId = floor.floorId,
                visitingDay = vDay,
                visitingHour = vHour,
                visitingMinute = vMinute,
                activeTime = msTime,
                guestMacAddress = macAddress,
                position = findPosition,
                mapHierarchy =mapHierarchyString
                )
              tmpVisitors = tmpVisitors :+ visitor
            } else {
              Logger.debug("Visitor macAddress does not match floor:" + floor.hierarchy + " visitor location:" + mapHierarchyString + " macAddress:" + macAddress)
            }
          }
          GlanceVisitor.insertByBatch(tmpVisitors).map{ bRet =>
            p.success(tmpVisitors)
          }.recover{
            case _=>
              p.success(tmpVisitors)
          }
        }catch{
          case e:Throwable =>
            Logger.error("Failed to parse visitor data:{}",e.getMessage())
            p.success(List())
          }
      }
      f.map{ visitors =>
        visitors
      }.recover{
        case _ =>
          List()
      }
    }

    def cleanVisitorsCache():Future[Boolean]={
      Future{true}
    }

    def updateVisitorsCache(visitors: List[GlanceVisitor],nPageIndex:Long=0,bLastPage:Boolean=false,credential:GlanceCredential):Future[Boolean] ={

      for{
        optVisitors <- Future{
          val optList = GlanceSyncCache.getGlanceCache[List[GlanceVisitor]](/*ComUtils.glanceInstantId+"."+*/CACHE_NAME_EXT)
          if(optList.isDefined){
            val curentTime =System.currentTimeMillis()
            if(nPageIndex ==0) //only page 0 will try to combine the previous scan result...
              Some(optList.get.filter(p =>  (curentTime - p.updated) <= 1000*75))
            else
              optList
          }else
            optList
        }
        previousList:List[GlanceVisitor] <- Future{
          var previousListX: List[GlanceVisitor] = {
            if (optVisitors.isDefined)
              optVisitors.get
            else
              List()
          }
          previousListX = previousListX ::: visitors
          previousListX = ComUtils.distinctBy(previousListX)(_.guestMacAddress)
          previousListX
        }

        bLastPageUpdate <- Future{
          if(bLastPage){
            GlanceMemcached.setGlanceCacheList[GlanceVisitor](CACHE_NAME,previousList,GlanceVisitor.glanceWrites,20.minutes,5)
            GlanceSyncCache.setGlanceCache[List[GlanceVisitor]](CMXVisitorScan.CACHE_NAME_CMX,previousList)
            sendCacheSyncMessage(credential)
            GlanceVisitor.updateGuestCountByForce()
            true
          }else if(visitors.length>=0)
            GlanceSyncCache.setGlanceCache[List[GlanceVisitor]](/*ComUtils.glanceInstantId+"."+*/CACHE_NAME_EXT,previousList,10.minutes)
          else
            true
        }
      }yield {
        bLastPageUpdate
      }
    }

    def receive = {
      case (credential:GlanceCredential,floors:List[GlanceTrackFloor]) =>
        val keys =todoFloors.keys.toList
        val list =keys.filter( p => (p.glanceOrgId ==credential.glanceOrgId))
        val configuredCMXFloors=floors.filter(p => ComUtils.isCmxServiceType(p.cmxServiceType) && ComUtils.isCorrectHierarchy(p.hierarchy))
        if(list==null || list.length ==0) {
          if(configuredCMXFloors.length>0)
            todoFloors += (credential -> floors)
        }
        else
        {
          if(configuredCMXFloors.length>0)
            todoFloors(list(0))= floors
          else{
            list.foreach{ f =>
              todoFloors -= f
            }
          }
        }
        self ! "!"

      case (floorId: String,hierarchy:String, credential:GlanceCredential) =>
//        todo += (floorId -> credential)
//        floorMap(floorId)=hierarchy

      case "!" =>   /*schedule service duration trigger*/
        if(todoFloors.size>0){
          for{
            isScanning <-isSomeInstanceIsScanning()
            isSetScanning <-setInstanceIsScanning(isScanning)
          }yield {
            if(isScanning==false){
              val keys =todoFloors.keys.toList
              if(keys.length>0){
                val credential =keys(0)
                for{
                  sysConf <-GlanceSystemConf.readConf(credential)
                  floors  <-GlanceTrackFloor.readAll(credential)
                  mapSizes <- GlanceMapSizeInfo.readAllConf(credential)
                }yield{
                  if(floors.length>0) {
                    Logger.debug("try to scanning:"+ComUtils.glanceInstantId)
                    self !(credential, sysConf, floors,mapSizes,0, ComUtils.defaultPageSize)
                  } else {
                    Logger.debug("try to scanning, to clean the flags of instance:"+ComUtils.glanceInstantId)
                    GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_FLAG, "0", 150 seconds)
                  } //clean the flag...
                }
              }
            }else{
              Logger.debug("Some Instance is running!")
            }
          }
        }
        Logger.info("GlanceVisitorScanActor schedule service")
        //todo.clear()
      case floorId:String =>   //remove the floorId...
//        todo -= floorId
//        floorMap -= floorId
      case credential:GlanceCredential =>
        //fixme not clean the visitor scan ..
        // todoFloors -= credential

      case (credential:GlanceCredential,sysConf:GlanceSystemConf,floors:List[GlanceTrackFloor],mapSizes:List[GlanceMapSizeInfo],nextPage:Int,pageSize:Int) =>
        def callNextPage(bLastPage:Boolean):Unit={
            Logger.debug("Visitors scanning call next page:"+(nextPage+1).toString)
            if(!bLastPage) {
              Logger.info("callNextPage: to page:"+(nextPage+1))
              self ! (credential,sysConf,todoFloors(credential),mapSizes,(nextPage+1),ComUtils.defaultPageSize)
            }else{
              //clean flags..
              Logger.debug("Visitors scanning is the last page, and to clean the flags...")
              for{
                bFlag <- GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_FLAG, "0", 150 seconds)
              }yield{
                true
              }
            }
        }

        for(floor <- floors){
          if(floor.hierarchy!=""){
            loadVisitorDataCMX10(credential,sysConf,nextPage,pageSize,floor.hierarchy).map{ optVisitors =>
              optVisitors.map { visitors =>
                val p = Promise[List[GlanceVisitor]]
                val f = p.future
                val macList = visitors.as[List[JsValue]]
                var bLastPage: Boolean = false
                if (macList.length < ComUtils.defaultPageSize)
                  bLastPage = true
                Future {
                  val completed=new java.util.concurrent.atomic.AtomicLong()
                  var tmpVisitors: mutable.MutableList[GlanceVisitor] = mutable.MutableList[GlanceVisitor]()
                  for (macInfo <- macList) {
                    try{
                      parseVisitorDataCMX10(macInfo, floors, mapSizes,credential).map { visitors =>
                        for(xcl <-0 to visitors.length-1)
                          tmpVisitors += visitors(xcl)
                        val count =completed.incrementAndGet()
                        if(count >= macList.length)
                          p.success(tmpVisitors.toList)
                      }.recover {
                        case _ =>
                          val count =completed.incrementAndGet()
                          Logger.warn("loadVisitorDataCMX10, Completed Index, Exception:" + count +" page:"+nextPage+" total:"+macList.length)
                          if(count >=macList.length)
                            p.success(tmpVisitors.toList)
                      }
                    }catch{
                      case exp:Throwable =>
                        val count =completed.incrementAndGet()
                        Logger.warn("loadVisitorDataCMX10, Completed Index, Exception:" +exp.getMessage)
                        Logger.warn("loadVisitorDataCMX10, Completed Index, Exception:" + count +" page:"+nextPage+" total:"+macList.length)
                        if(count >= macList.length)
                          p.success(tmpVisitors.toList)
                    }
                  }
                  Logger.debug("CMX10 Visitors Count:" + macList.length + " page:" + nextPage + " pageSize:" + pageSize+" total:"+macList.length)
                  if(macList.length<=0)
                    p.success(tmpVisitors.toList)
                }
                f.map { visitorList =>
                  Logger.debug("call updateVisitorsCache page:" + nextPage + " is the lastPage reached:" + bLastPage.toString)
                  updateVisitorsCache(visitorList, nextPage, bLastPage, credential).map { bSuccess =>
                    //parse the next page visitor message...
                    callNextPage(bLastPage)
                  }.recover {
                    case _ =>
                      callNextPage(bLastPage)
                  }
                }.recover {
                  case _ =>
                    Logger.warn("Failed to wait glance Visitor parse...")
                    updateVisitorsCache(List(), nextPage, bLastPage, credential).map { bSuccess =>
                      //parse the next page visitor message...
                      callNextPage(bLastPage)
                    }.recover {
                      case _ =>
                        callNextPage(bLastPage)
                    }
                }
              }
              if(!optVisitors.isDefined) {
                  Logger.error("Failed to get visitors data!....")
                  updateVisitorsCache(List(),nextPage,true, credential).map { bSuccess =>
                    //parse the next page visitor message...
                    callNextPage(true)
                  }.recover {
                    case _ =>
                      callNextPage(true)
                  }
              }
            }.recover{
              case _ =>
                Logger.error("Failed to parseCMX10Data, and to clean the scanning flags...")
                updateVisitorsCache(List(),nextPage,true, credential).map { bSuccess =>
                  //parse the next page visitor message...
                  callNextPage(true)
                }.recover {
                  case _ =>
                    callNextPage(true)
                }
            }
          }
        }

    }
  }
}
