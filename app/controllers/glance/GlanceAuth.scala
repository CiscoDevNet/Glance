package controllers.glance

import com.google.common.io.BaseEncoding
import controllers.Application._
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import org.apache.commons.io.Charsets
import play.Logger
import play.api.libs.json._
import play.api.mvc._
import services.security.{AESEncrypt, GlanceCredential, GlanceDBAuthService}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

/**
 * Created by kennych on 9/14/16.
 */

object GlanceAuth extends Controller with Guard{
  val defaultAdminPage ="/admin.html"
  val defaultLoginPage ="/login.html"
  def showMyToken()=Action.async{ implicit request =>
    if(isLoggedIn){
      Future{Ok(Json.obj("token"->remoteToken))}
    }else{
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }
  }

  def auth(provider:String)=Action.async(parse.tolerantFormUrlEncoded) { implicit request =>
    var redirectUrl ={
      val url =remoteQueryString(request,"redirect","")
      if(url=="")
        remoteExtractDataString(request.body.get("url"))
      else
        url
    }
    if(redirectUrl=="")
      redirectUrl=defaultAdminPage
    val userName = remoteExtractDataString(request.body.get("username"))
    val password = remoteExtractDataString(request.body.get("password"))
    if(userName == "" || password == "")
      Future{Redirect(s"$defaultLoginPage?redirect=$redirectUrl")}
    else{
      for{
        sysConf <- GlanceSystemConf.readConf(ComUtils.getCredential())
        optUser <- GlanceDBAuthService.authUser(ComUtils.getTenantOrgId(),userName,password)
      }yield{
        if(optUser.isDefined){
          val token =GlanceDBAuthService.getToken(optUser.get,sysConf.assignedTenantId,remoteXAddress)
          Redirect(redirectUrl).withCookies(Cookie("token", token))
        }else{
          Logger.error(s"Authenticate failed for user:$userName")
          Redirect(s"$defaultLoginPage?redirect=$redirectUrl").discardingCookies(DiscardingCookie("token"))
        }
      }
    }
  }

  def loggedUser()=Action.async { implicit request =>
    if(isLoggedIn(request)){
        getUserInfo(request) match {
          case Some(user) =>
            Future{Ok(Json.toJson(user)).discardingCookies(DiscardingCookie("token"))}
          case None =>
            Future{NotFound(Json.toJson(GlanceStatus.failureStatus("No user has logged in!"))).discardingCookies(DiscardingCookie("token"))}
        }
    }else{
      Future{NotFound(Json.toJson(GlanceStatus.failureStatus("No user has logged in!"))).discardingCookies(DiscardingCookie("token"))}
    }
  }

  def logoutAndRedirect = Action.async { implicit request =>
    val redirectUrl:String ={
      var url =remoteQueryString(request,"redirect","")
      if(url=="")
        url = defaultLoginPage
      url
    }
    Future{
      if(redirectUrl.startsWith(defaultLoginPage))
        Redirect(redirectUrl).discardingCookies(DiscardingCookie("token"))
      else
        Redirect(s"$defaultLoginPage?redirect=" +java.net.URLEncoder.encode(redirectUrl, "utf-8")).discardingCookies(DiscardingCookie("token"))
    }
  }

  def logout()=Action.async { implicit request =>
    if(isLoggedIn(request)){
      val optUser = getUserInfo(request)
      optUser match{
        case Some(user) =>
          GlanceDBAuthService.cleanSessionCache(remoteToken)
          Future{Ok(Json.toJson(user.copy(session = "",scope=""))).discardingCookies(DiscardingCookie("token")) }
        case None =>
          Future{Ok(Json.obj()).discardingCookies(DiscardingCookie("token"))}
      }
    }else{
      Future{Ok(Json.obj()).discardingCookies(DiscardingCookie("token"))}
    }
  }

  def changePass()=Action.async(parse.anyContent) { implicit request =>
    val uid =remoteQueryString(request,"uid","")
    val password=remoteQueryString(request,"password","")
    val newPassword=remoteQueryString(request,"newpass","")
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(uid=="" || password=="" || newPassword==""){
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid account data!")))}
      }else{
        for{
          optUser <- GlanceDBAuthService.authUser(ComUtils.getTenantOrgId(),uid,password)
          bUpdate <- {
            if(optUser.isDefined){
              val encPass =AESEncrypt.encrypt(newPassword)
              val newCredential=optUser.get.copy(glancePassword =encPass)
              GlanceDBAuthService.addOrUpdate(newCredential)
            }else{
              Future{false}
            }
          }
        }yield {
          if(bUpdate)
            Ok(Json.toJson(GlanceStatus.successStatus(s"The password of $uid has changed successfully!")))
          else
            NotFound(Json.toJson(GlanceStatus.successStatus(s"Failed to change the password of $uid ,please try again!")))
        }
      }
    }
  }

  def resetToDefault()=Action.async(parse.anyContent) { implicit request =>
    val origPass =remoteQueryString(request,"password","")
    val encPassTo ={
      if(origPass!="")
        AESEncrypt.encrypt(origPass)
      else
        ""
    }
    val encPass ="wjz95oTLreqonT1O4/ar2w=="
    val newCredential=GlanceCredential(ComUtils.getTenantOrgId(),GlanceCredential.ScopeAdmin,encPass,"",GlanceCredential.ScopeAdmin)
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      if(origPass=="" || encPassTo !=encPass){
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid original glance system password, please correct it and try again!")))}
      }else{
        for{
          bUpdate <-  GlanceDBAuthService.addOrUpdate(newCredential)
        }yield {
          if(bUpdate)
            Ok(Json.toJson(GlanceStatus.successStatus("The password of admin has been reset successfully!")))
          else
            NotFound(Json.toJson(GlanceStatus.successStatus("Failed to reset the password of admin, please try again!")))
        }
      }
    }
  }

  def add()=Action.async(parse.json) { implicit request =>
    if(!isAdminToken(request))
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus("You are not authorized for this action!")))}
    else{
      try{
        val glanceUser=request.body.as[GlanceCredential](GlanceCredential.tolerantCredentialReaders)
        val pass =AESEncrypt.encrypt(glanceUser.glancePassword)
        val glanceUserEnc =glanceUser.copy(glanceOrgId=ComUtils.DEFAULT_ORGID ,glancePassword = pass)
        GlanceDBAuthService.addOrUpdate(glanceUserEnc).map{ bRet =>
          if(bRet)
            Ok(Json.toJson(GlanceStatus.successStatus("Add/Update glance user successfully,org:"+glanceUser.glanceOrgId+", userId:"+glanceUser.glanceUserId)))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Add/Update glance user failed,org:"+glanceUser.glanceOrgId+", userId:"+glanceUser.glanceUserId)))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Incorrect data: add/update user account!"+e.getMessage())
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid data: add/update glance user account!")))}
      }
    }
  }

  def getAuthToken()=Action.async(parse.json) { implicit request =>
    val credential =remoteCredential
    val userName =(request.body \ "glanceUserId").asOpt[String].getOrElse((request.body \ "userId").asOpt[String].getOrElse(""))
    val password =(request.body \ "glancePassword").asOpt[String].getOrElse((request.body \ "password").asOpt[String].getOrElse(""))
    val orgId =(request.body \ "glanceOrgId").asOpt[String].getOrElse((request.body \ "orgId").asOpt[String].getOrElse(ComUtils.getTenantOrgId()))
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      optUser <- GlanceDBAuthService.authUser(orgId,userName,password)
    }yield{
      if(optUser.isDefined){
        val token =GlanceDBAuthService.getToken(optUser.get,sysConf.assignedTenantId,remoteXAddress)
        Ok(Json.obj("token"->token))
      }else {
        Forbidden(Json.toJson(GlanceStatus.failureStatus("Failed to verify your account!")))
      }
    }
  }

}
