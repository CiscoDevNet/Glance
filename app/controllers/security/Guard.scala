package controllers.security

//import java.util.UUID
//import controllers.Application._
import controllers.amqp.GlanceSyncCache
import play.api.libs.json.Json
import play.api.mvc.RequestHeader
import services.common.ConfigurationService
import services.security._
import utils.ComUtils
import play.Logger
import play.api.Play.current

trait Guard {
  import scala.concurrent.duration._
  val timeout= ConfigurationService.getInt("session.timeout", 600).seconds

  def isLoggedIn(implicit request: RequestHeader): Boolean = {
    val token:String =remoteToken(request)
    Logger.debug("Current Token:"+token)
    val (isAuthed,_)=GlanceDBAuthService.validateToken(token,remoteXAddress)
    return isAuthed
  }

  def isAdminLoggedIn(implicit request: RequestHeader): Boolean = {
    isAdminToken(request)
  }

  def remoteToken(implicit request:RequestHeader):String ={
    var token:String =remoteQueryString(request,"token","")
    if(token == ""){
      token = request.cookies.get("token").map{cookie =>
        Logger.info("token cookie:"+cookie.value)
        cookie.value
      }.getOrElse("")
    }
    token
  }

  def isAdminToken(implicit request:RequestHeader):Boolean ={
    val token:String = remoteToken(request)
    Logger.debug("Current Token:"+token)
    val (isAuthed,credential)= GlanceDBAuthService.validateToken(token,remoteXAddress)
    if(isAuthed && credential!=null && credential.scope.compareToIgnoreCase(GlanceCredential.ScopeAdmin)==0)
      true
    else
      false
  }

  def getUserInfo(implicit request: RequestHeader) : Option[GlanceCredential] = {
    val credential =remoteCredential(request)
    return Some(credential)
  }

  def remoteAddress(implicit request: RequestHeader): String = {
    request.getQueryString("session") match {
      case Some(u) =>
        u
      case None =>
        request.session.get("session").map { user =>
          user
        }.getOrElse {
          request.headers.get(play.api.http.HeaderNames.X_FORWARDED_FOR).getOrElse(request.remoteAddress).replaceAll("[\\.:]", "_")
        }
    }
  }

  def remoteXAddress(implicit request: RequestHeader): String = {
    val xForwardFor:String =request.headers.get(play.api.http.HeaderNames.X_FORWARDED_FOR).getOrElse(request.remoteAddress)
    val list:Array[String]=xForwardFor.split(",")
    if(list!=null && list.length>0)
      list(0)
    else
      xForwardFor
  }

  def remoteAddressAllchains(implicit request: RequestHeader): String = {
  val xForwardFor:String =request.headers.get(play.api.http.HeaderNames.X_FORWARDED_FOR).getOrElse(request.remoteAddress)
      xForwardFor
  }
  def remoteCredential(implicit request: RequestHeader):GlanceCredential ={
    //you need to do actually credential auth token parse, here just use default org, user from environment pass.
    val token = remoteToken(request)
    val (isAuthed,credential)= GlanceDBAuthService.validateToken(token,remoteXAddress)
    if (isAuthed && credential!=null)
      return credential
    else
      return ComUtils.getCredential(orgId=ComUtils.getTenantOrgId(),userId=ComUtils.getTenantUserId())
  }

  def remoteQueryStringEx(request:RequestHeader,queryKey:String):String={
    val queryValue =request.getQueryString(queryKey)
    queryValue match {
      case Some(value) =>
        return value
      case _ =>
        ""
    }
  }

  def remoteQueryString(implicit request: RequestHeader, parameterName:String,defaultValue:String):String={
    try {
      var retValue =remoteQueryStringEx(request,parameterName)
      if(retValue=="")
        retValue =defaultValue
      retValue
    } catch {
      case exp:Throwable =>
        Logger.error("Failed to query paramter info for: {}, exception:{}",parameterName,exp.getMessage)
        defaultValue
    }
  }

  def remoteQueryInt(implicit request: RequestHeader, parameterName:String,defaultValue:Int):Int= {
    try {
      val retValue =remoteQueryString(request,parameterName,defaultValue.toString)
      retValue.toInt
    } catch {
      case exp:Throwable =>
        Logger.error("Failed to query parameter info for:{},exception:{}",parameterName,exp.getMessage)
        defaultValue
    }
  }

  def remoteQueryDouble(implicit request: RequestHeader, parameterName:String,defaultValue:Double):Double= {
    try {
      val retValue =remoteQueryString(request,parameterName,defaultValue.toString)
      retValue.toDouble
    } catch {
      case exp:Throwable =>
        Logger.error("Failed to query paramter info for: {}, exception:{}",parameterName,exp.getMessage)
        defaultValue
    }
  }

  def remoteExtractDataString(url: Option[Seq[String]],defaultValue:String=""): String = {
    url match {
      case Some(seqString: Seq[String]) =>
        var value =seqString.head.trim
        if (defaultValue!="" && value==""){
          value =defaultValue
        }
        value
      case _ =>
        defaultValue
    }
  }
}
