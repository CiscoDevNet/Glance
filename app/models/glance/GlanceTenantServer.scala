package models.glance

import java.util.UUID
import play.api.libs.json.{Json, JsObject}
import utils.ComUtils
import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import models._
import play.Logger
import play.api.Play.current
import reactivemongo.core.commands.{LastError, Count}
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import reactivemongo.bson.BSONDocument
import play.modules.reactivemongo.json.BSONFormats._
import services.cisco.database.GlanceDBService
import services.security.GlanceCredential
import play.api.libs.json._
import play.api.libs.functional.syntax._
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.collection.mutable
import scala.concurrent.{Future, Promise}


/**
 * Created by kennych on 3/31/17.
 */
case class  GlanceTenantServerConf(nameSpace: String = ComUtils.getTenantOrgId(),
                                   campuses: List[String] = List())

case class GlanceTenantServer(_id: BSONObjectID = BSONObjectID.generate,
                              glanceOrgId: String = "",
                              serverId: String = UUID.randomUUID().toString(),
                              serverName: String = "",
                              serverInfo: JsObject = Json.obj(), //info...
                              serverConf: GlanceTenantServerConf=new GlanceTenantServerConf(),
                              systemConf: GlanceSystemConf = new GlanceSystemConf(),
                              enable: Boolean = true,
                              tags: List[String] = List(),
                              updated: Long = System.currentTimeMillis())

object GlanceTenantServer {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceTenantServer")
  val CACHE_NAME = "glanceTenantServer"

  val glanceTenantServerConfReaders: Reads[GlanceTenantServerConf] = (
      (__ \ "nameSpace").read[String] and
      (__ \ ComUtils.CONST_PROPERTY_CAMPUSES).read[List[String]]
    )(GlanceTenantServerConf.apply _)

  implicit val glanceTenantServerConfWrites = new Writes[GlanceTenantServerConf] {
    def writes(z: GlanceTenantServerConf): JsValue = {
      Json.obj(
        "nameSpace" -> z.nameSpace,
        ComUtils.CONST_PROPERTY_CAMPUSES -> z.campuses
      )
    }
  }

  implicit val glanceTenantServerConfFormat = Format(glanceTenantServerConfReaders, glanceTenantServerConfWrites)

  val tolerantGlanceTenantServerReaders = new Reads[GlanceTenantServer] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceTenantServer(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).as[String],
        (js \ "serverId").asOpt[String].getOrElse(UUID.randomUUID().toString()),
        (js \ "serverName").asOpt[String].getOrElse(""),
        (js \ "serverInfo").asOpt[JsObject].getOrElse(Json.obj()),
        (js \ "serverConf").asOpt[GlanceTenantServerConf].getOrElse(new GlanceTenantServerConf()),
        (js \ "systemConf").asOpt[GlanceSystemConf].getOrElse(new GlanceSystemConf()),
        (js \ ComUtils.CONST_PROPERTY_ENABLE).asOpt[Boolean].getOrElse(true),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val glanceTenantServerWrites = new Writes[GlanceTenantServer] {
    def writes(z: GlanceTenantServer): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        "serverId" -> z.serverId,
        "serverName" -> z.serverName,
        "serverInfo" -> z.serverInfo,
        "serverConf" -> Json.toJson(z.serverConf),
        "systemConf" -> Json.toJson(z.systemConf),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
    }
  }
  implicit val glanceTenantServerFormat = Format(tolerantGlanceTenantServerReaders, glanceTenantServerWrites)

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
  }

  def updateTenantServerCache(credential: GlanceCredential,bCheckExists:Boolean=true):Future[Boolean]={

    def readAndSet():Future[Boolean]={
      readAll(credential).map{servers =>
        if(servers==null || servers.size<=0)
          GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,servers)
        true
      }
    }
    if(bCheckExists){
      val optTenants =GlanceSyncCache.getGlanceCache[List[GlanceTenantServer]](CACHE_NAME)
      if(optTenants.isDefined)
        Future{true}
      else
        readAndSet
    }else{
      readAndSet
    }
  }

  def sendCacheSyncMessage(credential: GlanceCredential): Unit = {
    GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_TRACK_TENANT_SERVER_RELOAD, Json.obj(GlanceSyncCache.CONST_CACHE_SYNCUP_KEY -> "All").toString(), credential)
  }

  def readAll(credential: GlanceCredential): Future[List[GlanceTenantServer]] = {
    val optServers = GlanceSyncCache.getGlanceCache[List[GlanceTenantServer]](CACHE_NAME)
    if(optServers.isDefined){
      Future {optServers.get}
    }else{
      val findByOrgId = (org: String) => collection.find(Json.obj("glanceOrgId" -> org)).sort(Json.obj("serverName" -> 1)).cursor[GlanceTenantServer].collect[List]();
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,listObject)
        listObject
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
          List()
      }
    }
  }

  def readAllOfIds(credential: GlanceCredential,serverIds:List[String]): Future[List[GlanceTenantServer]] = {
    def findByOrg_inline():Future[List[GlanceTenantServer]]={
      val findByOrgId = (org: String) => collection.find(Json.obj("glanceOrgId" -> org,"serverId" ->Json.obj("$in" ->serverIds))).sort(Json.obj("serverName" -> 1)).cursor[GlanceTenantServer].collect[List]();
      findByOrgId(credential.glanceOrgId).map { listObject =>
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,listObject)
        listObject.filter(p => serverIds.contains(p))
      }.recover {
        case _ =>
          GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
          List()
      }
    }
    val optServers = GlanceSyncCache.getGlanceCache[List[GlanceTenantServer]](CACHE_NAME)
    if(optServers.isDefined) {
      val servers =optServers.get
      val matchedList =servers.filter(p => serverIds.contains(p))
      if(matchedList.length>0)
      {
        Future {servers}
      }else{
        findByOrg_inline()
      }
    }else {
      findByOrg_inline()
    }
  }

  def readAllWithDetail(credential: GlanceCredential,serverIds:List[String]): Future[mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]] = {
    def readAllTenantServersDetail(servers:List[GlanceTenantServer]):Future[mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]]={
      val p = Promise[mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]]
      val f = p.future
      val serverDetailList: mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]] = new mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]()
      Future {
        val completed = new java.util.concurrent.atomic.AtomicLong()
        for( server <- servers){
          //read all campus info..
          GlanceTrackCampus.readAllWithDetailOfList(credential, server.serverConf.campuses).map { campusesInfo =>
            serverDetailList(server) = campusesInfo
            val count = completed.incrementAndGet()
            if (count >= servers.length)
              p.success(serverDetailList)
          }.recover {
            case _ =>
              Logger.error("Failed to read all info of server:{}",server.serverId)
              val count = completed.incrementAndGet()
              if (count >= servers.length)
                p.success(serverDetailList)
          }
        }
        if (servers.length <= 0)
          p.success(serverDetailList)
      }

      f.map { campusesInfo =>
        campusesInfo
      }.recover {
        case _ =>
          new mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]()
      }
    }
    for {
      servers <- {
        if(serverIds.length<=0)
          readAll(credential)
        else
          readAllOfIds(credential,serverIds)
      }
      allInfo <- readAllTenantServersDetail(servers)
    } yield {
      allInfo
    }
  }

  def readAllWithDetail(credential: GlanceCredential): Future[mutable.HashMap[GlanceTenantServer, List[(GlanceTrackCampus, mutable.HashMap[GlanceTrackBuilding, List[GlanceTrackFloor]])]]] = {
    readAllWithDetail(credential,List())
  }

  //DB API
  def insert(credential: GlanceCredential, tenantServer: GlanceTenantServer): Future[Boolean] = {
    val updateSrv = tenantServer.copy(glanceOrgId = credential.glanceOrgId)
    collection.insert(updateSrv).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to insert tracking tenant server:  glanceOrg:" + tenantServer.glanceOrgId + " with serverData:" + Json.toJson(updateSrv).toString())
        true
      case _ =>
        Logger.error("Failed to insert tracking tenant server:  glanceOrg:" + tenantServer.glanceOrgId + " with serverData:" + Json.toJson(updateSrv).toString())
        false
    }
  }

  def addOrUpdate(credential: GlanceCredential, conf: GlanceTenantServer): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> conf.serverId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addOrUpdate(existCount, credential, conf)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean and reload
      bRet
    }
  }

  def addOrUpdate(existCount: Int, credential: GlanceCredential, tenantServer: GlanceTenantServer): Future[Boolean] = {

    if (existCount > 0) {
      update(credential, tenantServer)
    } else {
      insert(credential, tenantServer)
    }
  }

  def update(credential: GlanceCredential, tenantServer: GlanceTenantServer): Future[Boolean] = {
    def copySetValues(z: GlanceTenantServer): JsValue = {
      val jsObj = Json.obj(
        "serverName" -> z.serverName,
        "serverInfo" -> z.serverInfo,
        "serverConf" -> Json.toJson(z.serverConf),
        "systemConf" -> Json.toJson(z.systemConf),
        ComUtils.CONST_PROPERTY_ENABLE -> z.enable,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> tenantServer.glanceOrgId, "serverId" -> tenantServer.serverId),
      Json.obj("$set" -> copySetValues(tenantServer))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Succeeded to update GlanceTenant Server: glanceOrgId:" + tenantServer.glanceOrgId + " withData:" + Json.toJson(tenantServer).toString())
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null) //clean to reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.error("Failed to update GlanceTenantServer: glanceOrgId:" + tenantServer.glanceOrgId + " withData:" + Json.toJson(tenantServer).toString())
        false
    }
  }

  def delete(credential: GlanceCredential, serverId: String): Future[Boolean] = {
    collection.remove(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> serverId)).map {
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Succeeded to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " serverId:" + serverId)
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null) //clean to reload
        sendCacheSyncMessage(credential)
        true
      case _ =>
        Logger.debug("Failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " serverId:" + serverId)
        false
    }.recover {
      case _ =>
        Logger.debug("Exception, failed to delete: " + credential.glanceOrgId + " glanceUserId:" + credential.glanceUserId + " serverId:" + serverId)
        false
    }
  }

  def deleteAllCampuses(credential: GlanceCredential,server:GlanceTenantServer):Future[Boolean]={
    val p = Promise[List[Boolean]]
    val f = p.future
    val results:mutable.MutableList[Boolean]=new mutable.MutableList[Boolean]()
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      val campuses =server.serverConf.campuses
      for(campusId <- campuses){
        val campusDelete ={
          for{
            bDeleteBuildings <-GlanceTrackCampus.deleteAllBuildings(credential,campusId)
            bDeleteCampus <- GlanceTrackCampus.delete(credential,campusId)
          }yield{
            bDeleteCampus || bDeleteBuildings
          }
        }
        campusDelete.map{bRet =>
          results += bRet
          val count =completed.incrementAndGet()
          if(count>=campuses.length)
            p.success(results.toList)
        }.recover{
          case _=>
            results+=false
            val count =completed.incrementAndGet()
            if(count>=campuses.length)
              p.success(results.toList)
        }
      }
      if(campuses.length<=0)
        p.success(List())
    }

    f.map{  bResults =>
      val nFailed =bResults.filter( p=> p!=true).length
      if(nFailed==0 || bResults.length==0)
        true
      else
        false
    }.recover{
      case _=>
        false
    }
  }

  def deleteAllCampuses(credential: GlanceCredential,serverId:String):Future[Boolean]={

    for{
      servers <-{
        if(serverId=="")
          Future{List()}
        else
          readAllOfIds(credential,List(serverId))
      }
      bDeleteCampus <-{
        if(servers.length<=0)
          Future{true}
        else
          deleteAllCampuses(credential,servers(0))
      }
    }yield {
      bDeleteCampus
    }
  }
  def addCampusId(credential: GlanceCredential,serverId:String, campusId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> serverId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- addCampusId(existCount, credential,serverId, campusId)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      }
      bRet
    }
  }

  def addCampusId(existCount: Int, credential: GlanceCredential,serverId:String, campusId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future {false}
    } else {
      collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> serverId),
        Json.obj("$addToSet" -> Json.obj("serverConf.campuses" -> campusId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to add campus to tenant server: OrgId:" + credential.glanceOrgId + " serverId:" + serverId + " with campusId:" + campusId)
          GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null) //clean cache and re-load...
          sendCacheSyncMessage(credential)
          true
        case _ =>
          Logger.error("Failed to add campus to tenant server: OrgId:" + credential.glanceOrgId + " serverId:" + serverId + " with campusId:" + campusId)
          false
      }
    }
  }

  def removeCampusId(credential: GlanceCredential,serverId:String, campusId: String): Future[Boolean] = {
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> serverId)
    val findExistCount = (existQuery: BSONDocument) => GlanceDBService.GlanceDB().command(Count(collection.name, Some(existQuery)))
    for {
      existCount <- findExistCount(query)
      bRet <- removeCampusId(existCount, credential,serverId, campusId)
    } yield {
      if (bRet) {
        GlanceSyncCache.setGlanceCache[List[GlanceTenantServer]](CACHE_NAME,null)
        sendCacheSyncMessage(credential)
      } //clean the cache info....
      bRet
    }
  }

  def removeCampusId(existCount: Int, credential: GlanceCredential,serverId:String,campusId: String): Future[Boolean] = {
    if (existCount <= 0) {
      Future {false}
    } else {
      collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> credential.glanceOrgId, "serverId" -> serverId),
        Json.obj("$pull" -> Json.obj("serverConf.campuses" -> campusId))).map {
        case LastError(true, _, _, _, _, 1, _) =>
          Logger.debug("Succeeded to remove campus id from tenant server: OrgId:" + credential.glanceOrgId + " serverId:" + serverId + " with campusId:" + campusId)
          true
        case _ =>
          Logger.error("Failed to remove campus id from tenant server: OrgId:" + credential.glanceOrgId + " serverId:" + serverId + " with campusId:" + campusId)
          false
      }
    }
  }

//  def addCampusUnderServer(credential: GlanceCredential,campus:GlanceTrackCampus,serverId:String):Future[Boolean]={
//      Future{true}
//  }

}

