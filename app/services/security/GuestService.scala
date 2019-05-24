/*
 * Copyright (c) 2017.
 *
 */
package services.security

import controllers.amqp.{GlanceSyncProducer, GlanceSyncCache}
import play.Logger
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.core.commands.{Count, LastError}
import services.cisco.database.GlanceDBService
import utils.{CheckSumGenerator, ComUtils}
import scala.concurrent.duration._
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.Future
import reactivemongo.bson._
import scala.concurrent.ExecutionContext.Implicits.global


/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/9/14
 **/

case class GlanceCredential(glanceOrgId:String = ComUtils.getTenantOrgId(),
                            glanceUserId:String=ComUtils.getTenantUserId(),
                            glancePassword:String="",
                            glanceToken:String="",
                            session:String="",
                            scope:String="",
                            timestamp:Long=System.currentTimeMillis(),
                            authorisedRemoteAddress:String="",
                            authorisedTenantId:String="",
                            updated:Long=System.currentTimeMillis())

object GlanceCredential{
  val ScopeDefault="user"
  val ScopeUser ="user"
  val ScopeAdmin="admin"
  val tolerantCredentialReaders = new Reads[GlanceCredential] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceCredential(
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).asOpt[String].getOrElse(ComUtils.getTenantOrgId()),
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).as[String],
        (js \ "glancePassword").asOpt[String].getOrElse(""),
        (js \ "glanceToken").asOpt[String].getOrElse(""),
        (js \ "session").asOpt[String].getOrElse(""),
        (js \ "scope").asOpt[String].getOrElse("user"),
        (js \ "timestamp").asOpt[Long].getOrElse(System.currentTimeMillis()+1000*60*1000),
        (js \ "authorisedRemoteAddress").asOpt[String].getOrElse(""),
        (js \ "authorisedTenantId").asOpt[String].getOrElse(""),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis())
      ))
    }
  }

  implicit val credentialWrites = new Writes[GlanceCredential] {
    def writes(z: GlanceCredential): JsValue = {
      val jsObj = Json.obj(
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID -> z.glanceUserId,
        "glancePassword" -> z.glancePassword,
        "glanceToken" ->z.glanceToken,
        "session" -> z.session,
        "scope" -> z.scope,
        "timestamp" ->z.timestamp,
        "authorisedRemoteAddress" ->z.authorisedRemoteAddress,
        "authorisedTenantId" ->z.authorisedTenantId,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated
      )
      return jsObj
    }
  }

  implicit val credentialFormat = Format(tolerantCredentialReaders, credentialWrites)

}

object GlanceDBAuthService{
  val provider ="glanceDB"
  val sessionExpiredHours = 1
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("glanceAuthDB")

  val CACHE_NAME_GLANCE_DB_AUTH = "glanceAuthDB"
  val CACHE_NAME ="glanceMapInfo"

  def sendCacheSyncMessageToken(token:String,credential: GlanceCredential): Unit ={
      GlanceSyncProducer.sendSyncMessage(GlanceSyncCache.CONST_CACHE_GLANCE_TOKEN_SYNC, Json.obj("token" -> token).toString(), credential)
  }

  def getToken(credential:GlanceCredential,tenantId:String,remoteAddress:String):String={
    def updateNewToken(cred:GlanceCredential):String={
      val token =Json.toJson(cred).toString()
      CheckSumGenerator.digest("SHA-256",token)
    }
    def isExpired(cred:GlanceCredential):Boolean={
      if((cred.timestamp+ sessionExpiredHours*60*1000*1000)<System.currentTimeMillis())
        true
      else
        false
    }
    val credentialNew = credential.copy(authorisedRemoteAddress=remoteAddress,authorisedTenantId = tenantId,timestamp = System.currentTimeMillis())
    val cached=GlanceSyncCache.getGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH)
    var token:String =""
    if(cached.isDefined){
      val matched = cached.get.filter(p => p.glanceOrgId == credential.glanceOrgId && p.glanceUserId==credential.glanceUserId && p.glanceToken!="")
      if(matched.length>0 && !isExpired(matched(0)))
        token=matched(0).glanceToken
      else
        token =updateNewToken(credentialNew)
    }else
      token = updateNewToken(credentialNew)
    updateSessionCache(token,credentialNew)
    token
  }

  def login(username:String,password:String):Future[Option[GlanceCredential]] ={
    def parseUserName(uName:String):(String,String)={
      val parts = uName split "@"
      if(parts.length==2)
        (parts(0),parts(1))
      else
        (uName,ComUtils.DEFAULT_ORGID)
    }
    val (userId,orgId)=parseUserName(username)
    authUser(orgId,userId,password)
  }

  def insert(credential: GlanceCredential) :Future[Boolean]= {
    collection.insert(credential).map{
      case LastError(true, _, _, _, _, _, _) =>
        Logger.debug("Successfully insert user credential:  glanceOrgId:"+credential.glanceOrgId+" glanceUserId:"+credential.glanceUserId +" scope:"+credential.scope)
        true
      case _ =>
        Logger.error("Failed insert credential, username:"+credential.glanceUserId)
        false
    }
  }
  def addOrUpdate(conf:GlanceCredential):Future[Boolean] ={
    val query = BSONDocument(ComUtils.CONST_PROPERTY_GLANCEORGID -> conf.glanceOrgId,ComUtils.CONST_PROPERTY_GLANCEUSERID ->conf.glanceUserId)
    val findExistCount = (existQuery:BSONDocument) => GlanceDBService.GlanceDB().command(Count( collection.name,Some(existQuery)))
    for{
      existCount <-findExistCount(query)
      bRet <-addOrUpdate(existCount,conf)
    }yield bRet
  }

  def addOrUpdate(existCount:Int,conf:GlanceCredential):Future[Boolean] ={
    if(existCount >0) {
      update(conf)
    }else{
      insert(conf)
    }
  }

  def update(conf:GlanceCredential):Future[Boolean] = {
    def copySetValues(z:GlanceCredential):JsValue ={
      val jsObj = Json.obj(
        "scope"   -> z.scope,
        "glancePassword"   -> z.glancePassword,
        ComUtils.CONST_PROPERTY_UPDATED -> System.currentTimeMillis()
      )
      jsObj
    }

    collection.update(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID->conf.glanceOrgId,ComUtils.CONST_PROPERTY_GLANCEUSERID -> conf.glanceUserId),
      Json.obj("$set" -> copySetValues(conf))).map {
      case LastError(true, _, _, _, _, 1, _) =>
        Logger.debug("Successfully updated user credential: glanceOrgId"+conf.glanceOrgId+" glanceUserId:"+conf.glanceUserId+" scope:"+conf.scope)
        true
      case _ =>
        false
    }
  }

  def readConf(orgId:String,userId:String):Future[Option[GlanceCredential]] ={
    val findByName  = (org: String,user:String) => collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_GLANCEUSERID -> user)).one[GlanceCredential];
    findByName(orgId,userId).map{ info =>
      info match{
        case Some(user) =>
          Some(user.copy(glancePassword = ""))
        case None =>
          None
      }
    }.recover{
      case _=>
        Logger.error("Failed to read user id info, unknown exception.")
        None
    }
  }

  def readAllConf(orgId:String,userId:String):Future[List[GlanceCredential]] ={
    val findAll  = (org: String,user:String) => collection.find(Json.obj(ComUtils.CONST_PROPERTY_GLANCEORGID -> org,ComUtils.CONST_PROPERTY_GLANCEUSERID -> user)).cursor[GlanceCredential].collect[List]();
    findAll(orgId,userId).map{ infolist =>
      infolist
    }
  }

  def cleanCache(credential: GlanceCredential): Unit ={
    GlanceSyncCache.setGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH,null)
  }

  def updateGlanceAuthDBCache(credential: GlanceCredential, bCheckExists: Boolean = true): Future[Boolean] = {
    def readAndSet(): Future[Boolean] = {
      for {
        listGlanceCredentials <- readAllConf(credential.glanceOrgId,credential.glanceUserId)
      } yield {
        if (listGlanceCredentials == null || listGlanceCredentials.size <= 0)
          GlanceSyncCache.setGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH,null)
        else
          GlanceSyncCache.setGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH,listGlanceCredentials)
        true
      }
    }
    if (bCheckExists) {
      val optGlanceCredentials = GlanceSyncCache.getGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH)
      if(optGlanceCredentials.isDefined)
      {
        Future {true}
      }else{
        readAndSet
      }
    } else {
      readAndSet
    }
  }

  def authUser(orgId:String,userId:String,password:String):Future[Option[GlanceCredential]] ={
    val encPass =AESEncrypt.encrypt(password)
    val findByName  = (org: String,user:String,pass:String) => collection.find(Json.obj("glanceOrgId" -> org,"glanceUserId" -> user,"glancePassword" ->encPass)).one[GlanceCredential];
    findByName(orgId,userId,encPass).map{ info =>
      info match{
        case Some(user) =>
          Some(user.copy(glancePassword = ""))
        case None =>
          None
      }
    }.recover{
      case _=>
        Logger.error("Failed to read user id info, unknown exception.")
        None
    }
  }

  def cleanSessionCache(token:String):Boolean ={
    if(token=="")
       return false
    else
      GlanceSyncCache.setGlanceCache[GlanceCredential](token,null)
  }

  def updateSessionCache(token:String,glanceCredential: GlanceCredential,bSendSyncMsg: Boolean=true):Boolean={
    if(token=="")
      return false

    val credentialNew = glanceCredential.copy(glanceToken = token,timestamp =System.currentTimeMillis())
    val optSessionList:Option[List[GlanceCredential]]=GlanceSyncCache.getGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH)
    if(optSessionList.isDefined){
      val list =optSessionList.get.filter(p => !(p.glanceOrgId==glanceCredential.glanceOrgId && p.glanceUserId==glanceCredential.glanceUserId))
      val listNew =list ::: List(credentialNew)
      GlanceSyncCache.setGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH,listNew,((60+10)*60).seconds)
    }else{
      val list = List(credentialNew)
      GlanceSyncCache.setGlanceCache[List[GlanceCredential]](CACHE_NAME_GLANCE_DB_AUTH,list,((60+10)*60).seconds)
    }
    //send Token Info sync message
    val bRet =GlanceSyncCache.setGlanceCache[GlanceCredential](token,credentialNew,(60*60).seconds)
    if(bSendSyncMsg)
      sendCacheSyncMessageToken(token,credentialNew)
    bRet

  }

  def getCachedSessionInfo(token:String):Option[GlanceCredential]={
    if(token=="")
      None
    else
      GlanceSyncCache.getGlanceCache[GlanceCredential](token)
  }

  def validateToken(token:String,remoteAddress:String):(Boolean,GlanceCredential)={
    if(token=="")
      return  (false,null)

    val optSession =getCachedSessionInfo(token)
    if(!optSession.isDefined)
      return (false,null)

    updateSessionCache(token,optSession.get)
    if(optSession.get.authorisedRemoteAddress.compareToIgnoreCase(remoteAddress)==0)
      return (true,optSession.get)

    Logger.warn("The token is unauthorized for current machine:"+remoteAddress)
    cleanSessionCache(token)
    return (false,null)
  }
}
