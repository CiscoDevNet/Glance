package models.glance

import java.util.Date
import controllers.amqp.GlanceMemcached
import services.cisco.database.GlanceDBService
import _root_.utils.ComUtils
import akka.actor.Actor
import models._
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.common.SchedulingService
import services.security.GlanceCredential
import play.api.libs.json._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.collection.mutable
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._
import reactivemongo.bson.{BSONString, BSONDocument}
import reactivemongo.core.commands.{CommandError, BSONCommandResultMaker, Command}
import play.api.libs.iteratee._

/**
 * Created by kennych on 7/3/16.
 */
case class GlanceUserActivity( _id: BSONObjectID = BSONObjectID.generate,
                               glanceOrgId:String="",
                               floorId:String="",
                               userId:String="",
                               macAddress:String="",
                               category: String=ComUtils.SMART_DEVICE_TYPE_GUEST,
                               visitingDay:String="",
                               visitingHour:String="",
                               visitingMinute:String="",
                               activeTime:Long=System.currentTimeMillis(),
                               position:GlancePosition=new GlancePosition(x=0,y=0),
                               tags: List[String]= List(),
                               updated: Long=System.currentTimeMillis())

object GlanceUserActivity{
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceUserActivity")
  val randomX = scala.util.Random
  val userActivityActor = SchedulingService.schedule(classOf[GlanceActivityActor], "GlanceActivityActor", (1+randomX.nextInt(10)) seconds, (30 +randomX.nextInt(5)) seconds, "!")

  val tolerantGlanceUserActivityReaders = new Reads[GlanceUserActivity] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceUserActivity(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_FLOORID).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_USERID).as[String],
        (js \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String],
        (js \ ComUtils.CONST_PROPERTY_CATEGORY).asOpt[String].getOrElse(ComUtils.SMART_DEVICE_TYPE_GUEST),
        (js \ ComUtils.CONST_PROPERTY_VISITINGDAY).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_VISITINGHOUR).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_VISITINGMINUTE).asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_ACTIVETIME).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_POSITION).asOpt[GlancePosition].getOrElse(new GlancePosition(x=0,y=0)),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceUserActivityWrites = new Writes[GlanceUserActivity] {
    def writes(z: GlanceUserActivity): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID ->z.glanceOrgId,
        ComUtils.CONST_PROPERTY_FLOORID ->z.floorId,
        ComUtils.CONST_PROPERTY_USERID ->z.userId,
        ComUtils.CONST_PROPERTY_MACADDRESS ->z.macAddress,
        ComUtils.CONST_PROPERTY_CATEGORY ->z.category,
        ComUtils.CONST_PROPERTY_VISITINGDAY ->z.visitingDay,
        ComUtils.CONST_PROPERTY_VISITINGHOUR ->z.visitingHour,
        ComUtils.CONST_PROPERTY_VISITINGMINUTE ->z.visitingMinute,
        ComUtils.CONST_PROPERTY_ACTIVETIME -> z.activeTime,
        ComUtils.CONST_PROPERTY_POSITION -> z.position,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceUserActivityFormat = Format(tolerantGlanceUserActivityReaders, glanceUserActivityWrites)

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

  def glanceUserActivityCountByCategory(credential:GlanceCredential,floorId:String,visitingDay:String,category:String): Future[Int] ={
    def getCachedUserActivityCount(floorId:String):Future[Int]={
      var tmpFloorId = floorId
      if(tmpFloorId == "")
        tmpFloorId = ComUtils.CONST_GLANCE_ALL
      var tmpCategory = category
      if(tmpCategory == "")
        tmpCategory = ComUtils.CONST_GLANCE_ALL
      GlanceMemcached.getGlobalMemcachedData(GlanceMemcached.CONST_CACHE_USER_ACTIVITY_COUNT+tmpCategory+"."+tmpFloorId).map{ optValue =>
        val value =optValue.getOrElse("0")
        try{
          value.toInt
        }catch {
          case ex:Throwable =>
            Logger.error("getCachedUserActivityCount exception:{}",ex.getMessage)
            0
        }
      }
    }
    Logger.debug("glanceUserCountByCategory:" + visitingDay + " floorId:" + floorId+" category:"+category)
    var query = BSONDocument( ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,  ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay, ComUtils.CONST_PROPERTY_CATEGORY -> category)
    var tmpFloorId = ComUtils.CONST_GLANCE_ALL
    val tmpCategory = ComUtils.CONST_GLANCE_ALL
    if(floorId != "")
    {
      tmpFloorId=floorId
      if(category != "")
        query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId, ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_CATEGORY ->category)
      else
        query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId,  ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay)
    }else{
      if(category!="")
        query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,  ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_CATEGORY ->category)
      else
        query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,  ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay)
    }

    for {
      cacheCount <-getCachedUserActivityCount(tmpFloorId)
      dbCount <- if(cacheCount>0) Future{cacheCount} else {
        GlanceDBService.GlanceDB().command(Distinct(GlanceUserActivity.collection.name, ComUtils.CONST_PROPERTY_MACADDRESS, Some(query))).map { f =>
          Logger.debug("glanceUserCountByCategory:" + visitingDay + " floorId:" + floorId+" category:"+category)
          //Logger.debug("glanceUserCountByCategory Distinct OK:" + f.length)
          GlanceMemcached.setGlobalMemcachedData(GlanceMemcached.CONST_CACHE_USER_ACTIVITY_COUNT+tmpCategory+"."+ tmpFloorId, f.length.toString(), 45.seconds)
          f.length
        }.recover {
          case _ =>
            Logger.info("glanceUserCountByCategory Distinct failed, exception!")
            0
        }
      }
    }yield{
      dbCount
    }
  }

  def glanceUserVisitingDays(credential: GlanceCredential,floorId:String,category:String):Future[List[String]]={
    Logger.debug("glanceUserVisitingDays:" + " floorId:" + floorId)
    var query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId)
    if(floorId!=""){
      if(category=="")
        query=BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId)
      else
        query=BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId,ComUtils.CONST_PROPERTY_CATEGORY -> category)
    }else{
      if(category!="")
        query=BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_CATEGORY -> category)
    }
    GlanceDBService.GlanceDB().command(Distinct(GlanceUserActivity.collection.name, "visitingDay",Some(query))).map{ f=>
      //Logger.debug("glanceUserVisitingDays return:"+f.toList.toString())
      f.toList
    }.recover{
      case _=>
        Logger.info("glanceUserVisitingDays Distinct failed!")
        List[String]()
    }
  }

  def glanceUserVisitingHours(credential: GlanceCredential,floorId:String,visitingDay:String,category:String):Future[List[String]]={
    //Logger.debug("guestVisitingHours, floorId:{}",floorId)
    var query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_VISITINGDAY ->visitingDay)
    if(floorId!="")
    {
      if(category=="")
        query =BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId,ComUtils.CONST_PROPERTY_VISITINGDAY ->visitingDay)
      else
        query =BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId,ComUtils.CONST_PROPERTY_VISITINGDAY ->visitingDay,ComUtils.CONST_PROPERTY_CATEGORY ->category)
    }
    else{
      if(category!="")
        query =BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId,ComUtils.CONST_PROPERTY_VISITINGDAY ->visitingDay,ComUtils.CONST_PROPERTY_CATEGORY-> category)
    }

    GlanceDBService.GlanceDB().command(Distinct(GlanceUserActivity.collection.name, ComUtils.CONST_PROPERTY_VISITINGHOUR,Some(query))).map{ f=>
      Logger.debug("glanceUserVisitingHours return:"+f.toList.toString())
      f.toList
    }.recover{
      case _=>
        Logger.error("glanceUserVisitingHours Distinct failed!")
        List[String]()
    }
  }

  def glanceUserAllVisitingHours(credential: GlanceCredential,floorId:String,visitingDays:List[String],category:String):Future[List[String]]={
    val p = Promise[List[String]]
    val f = p.future
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      var listHours: List[String]= List[String]()
      if (visitingDays.length == 0) {
        p.success(listHours.toList)
      }
      else {
        for (visitingDay <- visitingDays) {
          glanceUserVisitingHours(credential, floorId, visitingDay,category).map { hours =>
            val count =completed.incrementAndGet()
            listHours =(listHours ::: hours).distinct
            if (count == visitingDays.length)
              p.success(listHours)
          }.recover{
            case _ =>
              val count =completed.incrementAndGet()
              if (count == visitingDays.length)
                p.success(listHours)
          }
        }
      }
    }

    f.map{ listHours =>
      Logger.debug("glanceUserAllVisitingHours :" + listHours.size)
      listHours
    }.recover{
      case _=>
        List()
    }
  }

  def glanceUserVisitingHoursCount(credential: GlanceCredential,floorId:String,visitingDay:String,hours:List[String],category:String):Future[mutable.HashMap[String,Int]]= {
    val p = Promise[mutable.HashMap[String,Int]]
    val f = p.future
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      var countMap: mutable.HashMap[String, Int] = new mutable.HashMap[String, Int]()
      if (hours.length == 0) {
        p.success(countMap)
      }
      else {
        for (hour <- hours) {
          glanceUserVisitingHourCount(credential, floorId, visitingDay, hour,category).map { count =>
            val completedCount =completed.incrementAndGet()
            countMap += (hour -> count)
            if (completedCount == hours.length)
              p.success(countMap)
          }.recover {
            case _ =>
              countMap += (hour -> 0)
              val completedCount =completed.incrementAndGet()
              if (completedCount == hours.length)
                p.success(countMap)
          }
        }
      }
    }


    f.map{ countMap =>
      Logger.debug("glanceUserVisitingHoursCount :" + countMap.size)
      countMap
    }.recover{
      case _=>
        new mutable.HashMap[String,Int]()
    }
  }

  def glanceUserVisitingHourCount(credential: GlanceCredential,floorId:String,visitingDay:String,visitingHour:String,category:String):Future[Int]={
    //Logger.debug("glanceUserVisitingHourCount:" + visitingDay + " hour:"+ visitingHour+" floorId:" + floorId)
    var query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_VISITINGHOUR ->visitingHour)
    if(floorId!=""){
      if(category=="")
        query=BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId, ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_VISITINGHOUR ->visitingHour)
      else
        query=BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_FLOORID -> floorId, ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_VISITINGHOUR ->visitingHour,ComUtils.CONST_PROPERTY_CATEGORY -> category)
    }else{
      if(category!="")
        query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, ComUtils.CONST_PROPERTY_VISITINGDAY -> visitingDay,ComUtils.CONST_PROPERTY_VISITINGHOUR ->visitingHour,ComUtils.CONST_PROPERTY_CATEGORY -> category)
    }

    GlanceDBService.GlanceDB().command(Distinct(GlanceUserActivity.collection.name, ComUtils.CONST_PROPERTY_MACADDRESS,Some(query))).map{ f=>
      //Logger.debug("glanceUserVisitingHourCount:" + visitingDay + " floorId:" + floorId)
      //Logger.debug("glanceUserVisitingHourCount Distinct OK:"+f.length)
      f.length
    }.recover{
      case _=>
        Logger.error("glanceUserVisitingHourCount Distinct failed!")
        0
    }
  }

  def guestAllDayHoursCount(credential: GlanceCredential,floorId:String,visitingDays:List[String],visitingHours:List[String],category:String): Future[mutable.HashMap[String,mutable.HashMap[String,Int]]] ={
    val p = Promise[mutable.HashMap[String,mutable.HashMap[String,Int]]]
    val f = p.future
    Future {
      val countsHash: mutable.HashMap[String,mutable.HashMap[String,Int]] = new mutable.HashMap[String,mutable.HashMap[String,Int]]()
      if (visitingHours.length == 0 || visitingDays.length==0) {
        p.success(countsHash)
      }
      else {
        val completedDays=new java.util.concurrent.atomic.AtomicLong()
        for (visitingDay <- visitingDays)
        {
          val completedHours = new java.util.concurrent.atomic.AtomicLong()
          val countMap:mutable.HashMap[String,Int] =new mutable.HashMap[String,Int]()
          for (visitingHour <- visitingHours){
            glanceUserVisitingHourCount(credential, floorId, visitingDay, visitingHour,category).map { count =>
              val tmpCompletedHours =completedHours.incrementAndGet()
              countMap(visitingHour)=count
              if (tmpCompletedHours >= visitingHours.length)
              {
                countsHash(visitingDay)=countMap
                val tmpCompletedDays =completedDays.incrementAndGet()
                if(tmpCompletedDays == visitingDays.length)
                  p.success(countsHash)
              }
            }.recover {
              case _ =>
                val tmpCompletedHours =completedHours.incrementAndGet()
                countMap(visitingHour) = 0
                if (tmpCompletedHours >= visitingHours.length) {
                  countsHash(visitingDay)=countMap
                  val tmpCompletedDays =completedDays.incrementAndGet()
                  if(tmpCompletedDays == visitingDays.length)
                    p.success(countsHash)
                }
            }
          }
        }
      }
    }

    f.map{ countMap =>
      //Logger.debug("glanceUserVisitingHoursCount :" + countMap.size)
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

  def insert(t: GlanceUserActivity) :Future[Boolean]= {
    GlanceUserActivity.collection.insert(t).map{
      case LastError(true, _, _, _, _, _, _) =>
        //Logger.info("Successfully insert glanceVisitor:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.guestMacAddress)
        true
      case _ =>
        Logger.info("Failed insert GlanceUserActivity:"+t.floorId+" visiting day:"+t.visitingDay+ " macAddress:"+t.macAddress)
        false
    }
  }

  def addOrUpdate(conf:GlanceUserActivity):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_FLOORID ->conf.floorId,ComUtils.CONST_PROPERTY_VISITINGDAY -> conf.visitingDay,ComUtils.CONST_PROPERTY_VISITINGMINUTE ->conf.visitingMinute,ComUtils.CONST_PROPERTY_MACADDRESS ->conf.macAddress)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( GlanceUserActivity.collection.name,Some(existQuery)))
    for{
      //existCount <- findExistCount(query)
      existCount <- Future{0}
      bRet <- addOrUpdate(existCount,conf)
    }yield {
      if(bRet && existCount==0){
        Logger.debug("new User Activity MacAddress added:" + conf.macAddress)
      }
      bRet
    }
  }

  def addOrUpdate(existCount:Int,conf:GlanceUserActivity):Future[Boolean] ={

    if(existCount >0) {
      //exist, no duplicated...
      Future{true}
    }else{
      insert(conf).map{ bRet =>
        bRet
      }
    }
  }

  def deferInsert(userActivity: GlanceUserActivity):Future[Boolean]={
    userActivityActor ! userActivity
    Future{true}
  }

  def insertByBatch(userActivities:List[GlanceUserActivity]):Future[Boolean]={

    if(userActivities.length >0){
      Logger.debug("Insert user activity by batch begin at:"+(new Date()).toString+" total to insert:"+userActivities.length)
      val enumerator = Enumerator.enumerate(userActivities)
      collection.bulkInsert(enumerator).map{ nCount =>
        Logger.debug("Insert user activity by batch end at:"+(new Date()).toString+" count:"+nCount)
        (nCount>0)
      }
    }else{
      Future{true}
    }
  }

  //move all single user activity to actor batch...
  class GlanceActivityActor extends Actor {
    val todo = scala.collection.mutable.Map[Long, GlanceUserActivity]()

    def receive = {
      case (userActivity:GlanceUserActivity) =>
        todo(System.currentTimeMillis())=userActivity
      case "!" =>   /*schedule service duration trigger*/
        val userActivities =todo.values.toList
        GlanceUserActivity.insertByBatch(userActivities).map{ bRet =>
          Logger.debug("Update user activities by batch status:"+bRet)
        }
        todo.clear()
    }
  }

}
