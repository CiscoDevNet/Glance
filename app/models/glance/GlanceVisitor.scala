package models.glance

import java.util.Date
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer, GlanceMemcached}
import controllers.glance.Visitor
import play.api.libs.iteratee.Enumerator
import services.cisco.database.GlanceDBService
import services.cisco.indoor.CMXVisitorScan
import utils.ComUtils
import akka.actor.Actor
import controllers.glance.GlanceWebSocketActor
import models._
import play.Logger
import play.api.Play.current
import play.api.libs.json._
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.common.SchedulingService
import services.security.GlanceCredential
import scala.collection.mutable
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._

/**
 * Created by kennych on 12/7/15.
 */

case class GlanceActiveVistors(_id: BSONObjectID = BSONObjectID.generate,
                                    glanceOrgId:String="",
                                    floorId:String="",
                                    visitingDay:String="",
                                    visitingHour:String="",
                                    visitingMinute:String="",
                                    activeVisitorsCount:Long=0,
                                    tags: List[String]= List(),
                                    updated: Long=System.currentTimeMillis())


case class GlanceVisitorsDay(_id: BSONObjectID = BSONObjectID.generate,
                             glanceOrgId:String="",
                             visitingDay:String="",
                             macAddressList:List[JsValue]=List())

case class GlanceVisitor( _id: BSONObjectID = BSONObjectID.generate,
                          glanceOrgId:String="",
                          floorId:String="",
                          visitingDay:String="",
                          visitingHour:String="",
                          visitingMinute:String="",
                          guestMacAddress:String="",
                          activeTime:Long=System.currentTimeMillis(),
                          position:GlancePosition=new GlancePosition(x=0,y=0),
                          mapHierarchy:String ="",
                          tags: List[String]= List(),
                          updated: Long=System.currentTimeMillis())

object GlanceVisitor{
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceVisitor")
  def collectionCount = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceVisitorCount")

  import play.api.libs.json._
  import play.api.libs.functional.syntax._
  import reactivemongo.bson._
  import scala.concurrent.ExecutionContext.Implicits.global

  val randomX = scala.util.Random

  val guestCountActor = SchedulingService.schedule(classOf[GlanceGuestCountActor], "GlanceGuestCountActor", (1+randomX.nextInt(10)) seconds, (30 +randomX.nextInt(5)) seconds, "!")
  def init(): Unit ={
    Logger.info("GlanceVisitor Init!")
    Logger.info("GlanceVisitor Init!"+guestCountActor.toString())
  }

  def trackFloorGuestCount(floorId:String,credential: GlanceCredential): Unit ={
      guestCountActor ! (floorId,credential)
  }

  def updateGuestCountByForce():Unit={
    guestCountActor ! "!"
  }

  val tolerantGlanceVisitorReaders = new Reads[GlanceVisitor] {
    def reads(js: JsValue) = {
      //Logger.info("tolerantGlanceVisitor ...."+js.toString())

      JsSuccess(GlanceVisitor(
        (js \ "_id").asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ "glanceOrgId").asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ "visitingDay").asOpt[String].getOrElse(""),
        (js \ "visitingHour").asOpt[String].getOrElse(""),
        (js \ "visitingMinute").asOpt[String].getOrElse(""),
        (js \ "guestMacAddress").asOpt[String].getOrElse(""),
        (js \ "activeTime").asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[GlancePosition].getOrElse(new GlancePosition(x=0,y=0)),
        (js \ "mapHierarchy").asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceWrites = new Writes[GlanceVisitor] {
    def writes(z: GlanceVisitor): JsValue = {
      Json.obj(
        "_id" -> z._id,
        "glanceOrgId" ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_FLOORID ->z.floorId,
        "visitingDay" ->z.visitingDay,
        "visitingHour" ->z.visitingHour,
        "visitingMinute" ->z.visitingMinute,
        "guestMacAddress" -> z.guestMacAddress,
        "activeTime" -> z.activeTime,
        ComUtils.CONST_PROPERTY_POSITION -> z.position,
        "mapHierarchy" -> z.mapHierarchy,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceVisitorFormat = Format(tolerantGlanceVisitorReaders, glanceWrites)

  val tolerantGlanceVisitorsDayReaders = new Reads[GlanceVisitorsDay] {
    def reads(js: JsValue) = {
      //Logger.info("tolerantGlanceVisitor ...."+js.toString())

      JsSuccess(GlanceVisitorsDay(
        (js \ "_id").asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ "glanceOrgId").asOpt[String].getOrElse(""),
        (js \ "visitingDay").asOpt[String].getOrElse(""),
        (js \ "macAddressList").asOpt[List[JsValue]].getOrElse(List())
      ))
    }
  }

  implicit val glanceVisitorsDayWrites = new Writes[GlanceVisitorsDay] {
    def writes(z: GlanceVisitorsDay): JsValue = {
      Json.obj(
        "_id" -> z._id,
        "glanceOrgId" ->z.glanceOrgId,
        "visitingDay" ->z.visitingDay,
        "macAddressList" -> z.macAddressList
        )
    }
  }
  implicit val glanceVisitorsDayFormat = Format(tolerantGlanceVisitorsDayReaders, glanceVisitorsDayWrites)

  //  def guestCount(credential:GlanceCredential,floorId:String,visitingDay:String): Future[Int] ={
//      Logger.info("GuestCount:"+visitingDay+ " floorId:"+floorId)
//      val query = BSONDocument("glanceOrgId" -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID ->floorId,"visitingDay" -> visitingDay)
//      GlanceDBService.GlanceDB().command(Count( GlanceVisitor.collection.name,Some(query)))
//  }

  import reactivemongo.bson.{BSONString, BSONDocument}
  import reactivemongo.core.commands.{CommandError, BSONCommandResultMaker, Command}

  /**
   * The Distinct command.
   *
   * Returns a document containing the distinct number of documents matching the query.
   * @param collectionName the name of the target collection
   * @param field for which field to return distinct values
   * @param query the document selector
   */
  case class Distinct(collectionName: String,
                      field: String,
                      query: Option[BSONDocument] = None) extends Command[List[String]] {
    override def makeDocuments =
      BSONDocument(
        "distinct" -> BSONString(collectionName),
        "key" -> field,
        "query" -> query)

    val ResultMaker = Distinct
  }

  /**
   * Deserializer for the Distinct command. Basically returns a List[String].
   */
  object Distinct extends BSONCommandResultMaker[List[String]] {
    def apply(document: BSONDocument) =
      CommandError.checkOk(document, Some("distinct")).toLeft(document.getAs[List[String]]("values").get)
  }

  def guestCount(credential:GlanceCredential,floorId:String,visitingDay:String): Future[Int] ={
    def getCachedGuestCount(floorId:String):Future[Int]={
      var tmpFloorId =floorId
      if(tmpFloorId=="")
        tmpFloorId="all"
        GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_CACHE_GUESTCOUNT+tmpFloorId).map{ optValue =>
        val value =optValue.getOrElse("0")
        try{
          value.toInt
        }catch {
          case ex:Throwable =>
            0
        }
      }
    }

    Logger.info("GuestCount:" + visitingDay + " floorId:" + floorId)
    var query = BSONDocument("glanceOrgId" -> credential.glanceOrgId, "visitingDay" -> visitingDay)
    var tmpFloorId ="all"
    if(floorId!="")
    {
      tmpFloorId=floorId
      query = BSONDocument("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId, "visitingDay" -> visitingDay)
    }

    for {
      cacheCount <-getCachedGuestCount(tmpFloorId)
      dbCount <- if(cacheCount>0) Future{cacheCount} else {
          collectionCount.find(Json.obj("glanceOrgId" -> credential.glanceOrgId,"visitingDay" -> visitingDay)).one[GlanceVisitorsDay].map { optVisitorsDay =>
            optVisitorsDay match {
              case Some(visitorsDay) =>
                visitorsDay.macAddressList.length
              case None =>
                0
            }
          }.recover{
            case _=>
              ComUtils.outputErrorMsg("Failed to read visitors by visiting day, exception!")
              0
          }

//        GlanceDBService.GlanceDB().command(Distinct(GlanceVisitor.collection.name, "guestMacAddress", Some(query))).map { f =>
//          Logger.info("GuestCount:" + visitingDay + " floorId:" + floorId)
//          Logger.info("guestCount Distinct OK:" + f.length)
//          GlanceMemcached.setGlobalMemcacheData(GlanceMemcached.CONST_CACHE_GUESTCOUNT + tmpFloorId, f.length.toString(), 45.seconds)
//          f.length
//        }.recover {
//          case _ =>
//            Logger.info("guestCount Distinct failed!")
//            0
//        }
      }
    }yield{
      dbCount
    }
  }

  def guestVisitingDays(credential: GlanceCredential,floorId:String):Future[List[String]]={
    Logger.info("guestVisitingDays:" + " floorId:" + floorId)
    var query = BSONDocument("glanceOrgId" -> credential.glanceOrgId)
    if(floorId!="")
      query=BSONDocument("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId)
    GlanceDBService.GlanceDB().command(Distinct(GlanceVisitor.collection.name, "visitingDay",Some(query))).map{ f=>
      Logger.info("guestVisitingDays return:"+f.toList.toString())
      f.toList
    }.recover{
      case _=>
        Logger.info("guestVisitingDays Distinct failed!")
        List[String]()
    }
  }

  def guestVisitingHours(credential: GlanceCredential,floorId:String,visitingDay:String):Future[List[String]]={
    Logger.info("guestVisitingHours:" + " floorId:" + floorId)

    var query = BSONDocument("glanceOrgId" -> credential.glanceOrgId,"visitingDay" ->visitingDay)
    if(floorId!="")
      query=BSONDocument("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId,"visitingDay" ->visitingDay)

    GlanceDBService.GlanceDB().command(Distinct(GlanceVisitor.collection.name, "visitingHour",Some(query))).map{ f=>
      Logger.info("guestVisitingHours return:"+f.toList.toString())
      f.toList
    }.recover{
      case _=>
        Logger.info("guestVisitingHours Distinct failed!")
        List[String]()
    }
  }

  def guestAllVisitingHours(credential: GlanceCredential,floorId:String,visitingDays:List[String]):Future[List[String]]={
    val p = Promise[List[String]]
    val f = p.future

    val producer = Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      var listHours: List[String]= List[String]()
      if (visitingDays.length == 0) {
        Logger.info("guestAllVisitingHours empty visiting days")
        p.success(listHours.toList)
      }
      else {
        for (cl <- 0 to (visitingDays.length - 1)) {
          guestVisitingHours(credential, floorId, visitingDays(cl)).map { hours =>
            val tmpCompleted =completed.incrementAndGet()
            listHours =(listHours ::: hours).distinct
            if (tmpCompleted == visitingDays.length)
              p.success(listHours)
          }.recover {
            case _ =>
              val tmpCompleted =completed.incrementAndGet()
              if (tmpCompleted == visitingDays.length)
                p.success(listHours)
          }
        }
      }
    }

    f.map{ listHours =>
      Logger.info("guestAllVisitingHours :" + listHours.size)
      listHours
    }.recover{
      case _=>
        List()
    }

  }


  def guestVisitingHoursCount(credential: GlanceCredential,floorId:String,visitingDay:String,hours:List[String]):Future[mutable.HashMap[String,Int]]= {

    val p = Promise[mutable.HashMap[String,Int]]
    val f = p.future

    val producer = Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      var countMap: mutable.HashMap[String, Int] = new mutable.HashMap[String, Int]()
      if (hours.length == 0) {
        p.success(countMap)
      }
      else {
        for (cl <- 0 to (hours.length - 1)) {
          guestVisitingHourCount(credential, floorId, visitingDay, hours(cl)).map { count =>
            val tmpCompleted =completed.incrementAndGet()
            countMap += (hours(cl) -> count)
            if (tmpCompleted == hours.length)
              p.success(countMap)
          }.recover {
            case _ =>
              countMap += (hours(cl) -> 0)
              val tmpCompleted =completed.incrementAndGet()
              if (tmpCompleted == hours.length)
                p.success(countMap)
          }
        }
      }
    }


    f.map{ countMap =>
      Logger.info("guestVisitingHoursCount :" + countMap.size)
      countMap
    }.recover{
      case _=>
        new mutable.HashMap[String,Int]()
    }
  }

  def guestVisitingHourCount(credential: GlanceCredential,floorId:String,visitingDay:String,visitingHour:String):Future[Int]={
    Logger.info("guestVisitingHourCount:" + visitingDay + " hour:"+ visitingHour+" floorId:" + floorId)

    var query = BSONDocument("glanceOrgId" -> credential.glanceOrgId, "visitingDay" -> visitingDay,"visitingHour" ->visitingHour)
    if(floorId!="")
      query=BSONDocument("glanceOrgId" -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId, "visitingDay" -> visitingDay,"visitingHour" ->visitingHour)

    GlanceDBService.GlanceDB().command(Distinct(GlanceVisitor.collection.name, "guestMacAddress",Some(query))).map{ f=>
      Logger.info("guestVisitingHourCount:" + visitingDay + " floorId:" + floorId)
      Logger.info("guestVisitingHourCount Distinct OK:"+f.length)
      f.length
    }.recover{
      case _=>
        Logger.info("guestVisitingHourCount Distinct failed!")
        0
    }
  }

  def guestAllDayHoursCount(credential: GlanceCredential,floorId:String,visitingDays:List[String],visitingHours:List[String]): Future[mutable.HashMap[String,mutable.HashMap[String,Int]]] ={

    val p = Promise[mutable.HashMap[String,mutable.HashMap[String,Int]]]
    val f = p.future

    val producer = Future {
      val countsHash: mutable.HashMap[String,mutable.HashMap[String,Int]] = new mutable.HashMap[String,mutable.HashMap[String,Int]]()
      if (visitingHours.length == 0 || visitingDays.length==0) {
        p.success(countsHash)
      }
      else {
        val completedDays= new java.util.concurrent.atomic.AtomicLong()
        for (clDays<- 0 to (visitingDays.length -1))
        {
          val completedHours = new java.util.concurrent.atomic.AtomicLong()
          val countMap:mutable.HashMap[String,Int] =new mutable.HashMap[String,Int]()
          for (cl <- 0 to (visitingHours.length - 1)) {
            guestVisitingHourCount(credential, floorId, visitingDays(clDays), visitingHours(cl)).map { count =>
              val tmpCompletedHours=completedHours.incrementAndGet()
              countMap(visitingHours(cl))=count
              if (tmpCompletedHours == visitingHours.length)
              {
                countsHash(visitingDays(clDays))=countMap
                val tmpCompletedDays=completedDays.incrementAndGet()
                if(tmpCompletedDays == visitingDays.length)
                  p.success(countsHash)
              }
            }.recover {
              case _ =>
                val tmpCompletedHours=completedHours.incrementAndGet()
                countMap(visitingHours(cl)) = 0
                if (tmpCompletedHours == visitingHours.length)
                {
                  countsHash(visitingDays(clDays))=countMap
                  val tmpCompletedDays=completedDays.incrementAndGet()
                  if(tmpCompletedDays == visitingDays.length)
                    p.success(countsHash)
                }
            }
          }
        }
      }
    }

    f.map{ countMap =>
      Logger.info("guestVisitingHoursCount :" + countMap.size)
      countMap
    }.recover{
      case _=>
        val countsHash: mutable.HashMap[String,mutable.HashMap[String,Int]] = new mutable.HashMap[String,mutable.HashMap[String,Int]]()
        for (clDays<- 0 to (visitingDays.length -1)) {
          val countMap: mutable.HashMap[String, Int] = new mutable.HashMap[String, Int]()
          for (cl <- 0 to (visitingHours.length - 1)) {
            countMap(visitingHours(cl)) = 0
          }
          countsHash(visitingDays(clDays))=countMap
        }
        countsHash
    }
  }

  def insert(t: GlanceVisitor) :Future[Boolean]= {
    collection.insert(t).map{
      case LastError(true, _, _, _, _, _, _) =>
        //Logger.info("Successfully insert glanceVisitor:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.guestMacAddress)
        true
      case _ =>
        Logger.info("Failed insert glanceVisitor:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.guestMacAddress)
        false
    }
  }
  def deleteByBefore():Future[Boolean]={
    Future{true}
  }

  def readUpdateMinutesList(minute:String):Future[List[String]]={
    val localList ={
      GlanceSyncCache.getGlanceCache[List[String]]("glance_visitors_"+minute).getOrElse(List())
    }

    GlanceMemcached.getGlanceCacheListString("glance_visitors_"+minute).map{ optList =>
      if(optList.isDefined)
        (optList.get ::: localList).distinct
      else
        localList
    }.recover{
      case _=>
        localList
    }
  }

  def setUpdateMinutesList(minute:String,macList:List[String],prevList:List[String]=List()):Future[Boolean]={
      def updateMinutesList(minute:String,mList:List[String]):Future[Boolean]={
        GlanceSyncCache.setGlanceCache[List[String]]("glance_visitors_"+minute,mList,120.seconds)
        GlanceMemcached.setGlanceCacheListString("glance_visitors_"+minute,mList,120.seconds).map { bRet =>
          bRet
        }.recover{
          case _=>
            false
        }
      }
      for{
        prevListX <- {
          if(prevList.length>0)
            Future{prevList}
          else
            readUpdateMinutesList(minute)
        }
        bUpdate <- updateMinutesList(minute,(prevListX:::macList).distinct)
      }yield{
        bUpdate
      }
  }


  def addToCount(visitorList:List[GlanceVisitor]):Future[Boolean]={
    if(visitorList.length<=0)
      Future{false}
    else{
      val query =Json.obj("glanceOrgId" ->visitorList(0).glanceOrgId,"visitingDay" ->visitorList(0).visitingDay)
      val update =Json.obj("$set" -> Json.obj("glanceOrgId" ->visitorList(0).glanceOrgId,"visitingDay" ->visitorList(0).visitingDay),"$addToSet" -> Json.obj("macAddressList" -> Json.obj("$each" -> visitorList.map(p =>p.guestMacAddress))))
      collectionCount.update(query,update,upsert=true,multi=true).map {
        case LastError(true, _, _, _, _, _, _) =>
          true
        case _ =>
          ComUtils.outputErrorMsg("Failed to updated glanceVisitorCount: glanceOrgId"+visitorList(0).glanceOrgId+" floorId:"+visitorList(0).floorId)
          false
      }

    }
  }

  def insertByBatch(visitorList:List[GlanceVisitor]):Future[Boolean]={
    def updateBatch(visitors:List[GlanceVisitor]):Future[Boolean]={
      if(visitors.length>0){
        val enumerator = Enumerator.enumerate(visitors)
        collection.bulkInsert(enumerator).map { nCount =>
          Logger.info("Insert Visitors by batch end at:" + (new Date()).toString + " count:" + nCount)
          if (nCount > 0)
            true
          else
            false
        }.recover{
          case _=>
            ComUtils.outputErrorMsg("Failed to update the visitor info by batch")
            false
        }
      }else
        Future{true}

    }
    if(visitorList.length >0){
      import play.api.libs.iteratee._
      Logger.info("Insert Visitors by batch begin at:"+(new Date()).toString+" total to insert:"+visitorList.length)
      for{
        prevList <- readUpdateMinutesList(visitorList(0).visitingMinute)
        filteredList <- Future{
          visitorList.filter(p => {
            if(prevList.indexOf(p.visitingMinute)>=0)
              false
            else
              true
          }
          )
        }
        bUpdate <-{
          updateBatch(filteredList)
        }
        bUpdateCount <-addToCount(filteredList)

        bUpdateList <-setUpdateMinutesList(visitorList(0).visitingMinute,visitorList.map(p =>p.guestMacAddress),prevList)
      }yield{
        bUpdate
      }
    }else{
      Future{true}
    }
  }

  def addOrUpdate(conf:GlanceVisitor):Future[Boolean] ={
    val query = BSONDocument("glanceOrgId" -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID ->conf.floorId,"visitingDay" -> conf.visitingDay,"visitingMinute"->conf.visitingMinute,"guestMacAddress" ->conf.guestMacAddress)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
    for{
      existCount <- Future{0}//fixme findExistCount(query)
      bRet <-addOrUpdate(existCount,conf)
    }yield {
//      if(bRet && existCount==0){
//        Logger.info("new Visitor MacAddress added:" + conf.guestMacAddress)
//      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,conf:GlanceVisitor):Future[Boolean] ={

    if(existCount >0)
    {
        //exist, no duplicated...
        Future{true}
    }else{

      for {
        bRet <- insert(conf)
        bUpdateCount <-addToCount(List(conf))
      }yield {
        bRet
      }
    }
  }

  def heatmapOfVisitors(category:String,credential: GlanceCredential):Future[List[GlanceVisitor]]={
    for{
      optVisitors <-  GlanceMemcached.getGlanceCacheList[GlanceVisitor](CMXVisitorScan.CACHE_NAME,GlanceVisitor.tolerantGlanceVisitorReaders,5)
      floors <-  GlanceTrackCampus.readDefaultCampusFloors(credential)
    }yield {
      val visitors:List[GlanceVisitor]={
        if(optVisitors.isDefined)
        {
          optVisitors.get
        }else
          List()
      }
      visitors
    }
  }

  //  def heatmapOfVisitors(category:String):Future[List[(Double,Double,Double,Double),]]={
  //
  //  }



  class GlanceGuestCountActor extends Actor {
    def sendGuestCount(floorId:String,guestCount:Int): Unit ={
      var guestCountObj =Json.obj()
      guestCountObj +=("total" -> JsNumber(guestCount))
      Logger.info("GlanceGuestCountActor total guest:"+guestCount)
      GlanceWebSocketActor.broadcastMessageToFloorId(floorId,"update",guestCountObj)
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_GUESTCOUNT, guestCountObj.toString(), ComUtils.getCredential())
    }
    def sendZoneCounting(floorId:String,ob:JsObject): Unit ={
      GlanceWebSocketActor.broadcastMessageToFloorId(floorId,"update",ob)
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_ZONECOUNT, ob.toString(), ComUtils.getCredential())
    }

    def sendAccessPointsConnectedDevices(floorId:String,ob:JsValue):Unit ={
      GlanceWebSocketActor.broadcastMessageToFloorId(floorId,"update",ob)
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_EVENT_ACCESSPOINTS_CONNECTED, ob.toString(), ComUtils.getCredential())
    }

    val todo = scala.collection.mutable.Map[String, GlanceCredential]()

    def receive = {
      case (floorId: String, credential: GlanceCredential) =>
        if(todo.getOrElse(floorId,null)==null)
          todo += (floorId -> credential)
        else
          todo(floorId)=credential
      case "!" =>   /*schedule service duration trigger*/
        todo.keys.foreach{ floorId =>
          for{
            sysConf <- GlanceSystemConf.readConf(todo(floorId))
            floorInfo <- GlanceTrackFloor.readByFloorId(todo(floorId),floorId)
            //if(floorInfo.isDefined)
            guestCount <- {
//              if (floorInfo.getOrElse(null) == null)
//                Future {
//                  ComUtils.DEFAULT_GUEST_COUNT
//                }
//              else
                GlanceVisitor.guestCount(todo(floorId), "", ComUtils.getDayString(sysConf.defaultTimeZone))
            }
            //fixme
            //replace with if all floorid is added
            // Visitor.getHeatmapOfVisitorsByZones("all",floorId,todo(floorId))
            jsonZoneCounting <- Visitor.getHeatmapOfVisitorsByZones("all","",todo(floorId))
            connectedDevices <- GlanceAssociationIPMacAddress.readAllCachedIPMappings(todo(floorId))
            accessPointsConnected <- GlanceAccessPoint.readAllCombineConnectedDevice(todo(floorId),connectedDevices)
          } yield {
            //Logger.info("Schedule Service Guest Count time:"+ComUtils.getDayString(floorInfo.get.floorConf.defaultTimeZone)+" defaultTimeZone:"+floorInfo.get.floorConf.defaultTimeZone)
            var tmpCount =guestCount
            if(tmpCount==0)
              tmpCount =ComUtils.DEFAULT_GUEST_COUNT+scala.util.Random.nextInt(40)
            sendGuestCount(floorId,tmpCount)
            sendZoneCounting(floorId,jsonZoneCounting)
            if(accessPointsConnected.length>0)
              sendAccessPointsConnectedDevices(floorId,Json.obj("aps" -> GlanceAccessPoint.getFloorsAccessPoints(accessPointsConnected)))
          }
        }
      //todo.clear()
      case floorId:String =>   //remove the floorId...
        todo -= floorId
    }
  }


  def getHistory(credential:GlanceCredential,thingNDeviceId:String, maxCount:Int=Int.MaxValue):Future[List[GlanceVisitor]]={
    def getHistoryData(cred: GlanceCredential,dIds:List[String]):Future[List[GlanceVisitor]]={
      val findByDeviceId = (org: String, deviceIds:List[String]) => collection.find(Json.obj("glanceOrgId" -> org,"guestMacAddress"-> Json.obj("$in"-> deviceIds))).sort(Json.obj("activeTime" -> 1)).cursor[GlanceVisitor].collect[List](maxCount);
      findByDeviceId(credential.glanceOrgId,dIds).map{ listObject =>
        listObject
      }.recover{
        case _ =>
          List()
      }
    }

    for{
      userThing <- RegisteredUser.readUserByUserId(credential,thingNDeviceId)
      userThingByMac <- RegisteredUser.readRegisteredUserByMac(credential,thingNDeviceId)
      historyData <- {
        if(userThing.isDefined)
          getHistoryData(credential,userThing.get.macAddress)
        else if(userThingByMac.isDefined)
          getHistoryData(credential,userThingByMac.get.macAddress)
        else
          Future{List[GlanceVisitor]()}
      }
    }yield {
      //format
      val groupOfDayHourMinutes =historyData.groupBy(p1 => p1.visitingDay).map(p2 => (p2._1,p2._2.groupBy(p3 => p3.visitingHour).map(p4 => (p4._1,p4._2.groupBy(p5 =>p5.visitingMinute).map(p5 => (p5._1,p5._2.sortBy(p6 => p6.activeTime)))))))

      historyData
    }
  }

}
//
//object GlanceVisitorCount{
//  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceVisitorCount")
//  import play.api.libs.json._
//  import play.api.libs.functional.syntax._
//  import reactivemongo.bson._
//  import scala.concurrent.ExecutionContext.Implicits.global
//
//  val tolerantGlanceActiveVisitorCountReaders = new Reads[GlanceActiveVistors] {
//    def reads(js: JsValue) = {
//      Logger.info("tolerantGlanceActiveVistorsReaders ...."+js.toString())
//      JsSuccess(GlanceActiveVistors(
//        (js \ "_id").asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
//        (js \ "glanceOrgId").asOpt[String].getOrElse(""),
//        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
//        (js \ "visitingDay").asOpt[String].getOrElse(""),
//        (js \ "visitingHour").asOpt[String].getOrElse(""),
//        (js \ "visitingMinute").asOpt[String].getOrElse(""),
//        (js \ "activeVisitorsCount").asOpt[Long].getOrElse(0),
//        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
//        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
//      ))
//    }
//  }
//
//  implicit val glanceActiveVisitorCountWrites = new Writes[GlanceActiveVistors] {
//    def writes(z: GlanceActiveVistors): JsValue = {
//      Json.obj(
//        "_id" -> z._id,
//        "glanceOrgId" ->z.glanceOrgId,
//        ComUtils.CONST_PROPERTY_FLOORID ->z.floorId,
//        "visitingDay" ->z.visitingDay,
//        "visitingHour" ->z.visitingHour,
//        "visitingMinute" ->z.visitingMinute,
//        "activeVisitorsCount" -> z.activeVisitorsCount,
//        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
//        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
//      )
//    }
//  }
//  implicit val glanceActiveVistorsFormat = Format(tolerantGlanceActiveVisitorCountReaders, glanceActiveVisitorCountWrites)
//
//  def guestCount(credential:GlanceCredential,floorId:String,visitingDay:String): Future[Int] ={
//    Logger.info("GuestCount:"+visitingDay+ " floorId:"+floorId)
//    val query = BSONDocument("glanceOrgId" -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID ->floorId,"visitingDay" -> visitingDay)
//    GlanceDBService.GlanceDB().command(Count( GlanceVisitor.collection.name,Some(query)))
//  }
//
//  def insert(t: GlanceVisitor) :Future[Boolean]= {
//    GlanceVisitor.collection.insert(t).map{
//      case LastError(true, _, _, _, _, _, _) =>
//        //Logger.info("Successfully insert glanceVisitor:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.guestMacAddress)
//        true
//      case _ =>
//        Logger.info("Failed insert glanceVisitor:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.guestMacAddress)
//        false
//    }
//  }
//
//  def addOrUpdate(conf:GlanceVisitor):Future[Boolean] ={
//    val query = BSONDocument("glanceOrgId" -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID ->conf.floorId,"visitingDay" -> conf.visitingDay,"guestMacAddress" ->conf.guestMacAddress)
//    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceVisitor.collection.name,Some(existQuery)))
//    for{
//      existCount <-findExistCount(query)
//      bRet <-addOrUpdate(existCount,conf)
//    }yield {
////      if(bRet && existCount==0){
////        Logger.info("new Visitor MacAddress added:" + conf.guestMacAddress)
////      }
//      bRet
//    }
//  }
//
//  def addOrUpdate(existCount:Int,conf:GlanceVisitor):Future[Boolean] ={
//
//    if(existCount >0)
//    {
//      //exist, no duplicated...
//      Future{true}
//    }else{
//      insert(conf).map{ bRet =>
//        bRet
//      }
//    }
//  }
//
//
//
//}

