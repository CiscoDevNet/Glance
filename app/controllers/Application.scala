package controllers

import java.util.UUID

import com.github.sstone.amqp.Amqp.Ok
import com.google.common.io.BaseEncoding
import controllers.security.Guard
import akka.actor.Props
import com.rabbitmq.client.ConnectionFactory
import controllers.amqp.{GlanceSyncCache, GlanceSyncProducer, GlanceSyncConsumer}
import controllers.glance.GlanceWebSocketActor
import org.apache.commons.io.Charsets
import play.Logger
import play.api.libs.json.JsValue
import play.api._
import play.api.{Mode, Play}
import play.api.mvc._
import play.api.mvc.{Result, Action, Controller}
import Play.current
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json._
import play.api.mvc.WebSocket.FrameFormatter
import play.api.mvc._
import play.api.Play.current

import akka.actor.{Props, Actor, ActorSystem}
import com.github.sstone.amqp._
import com.github.sstone.amqp.Amqp._
import com.rabbitmq.client.ConnectionFactory
import services.security.{AESEncrypt, GlanceCredential, GlanceDBAuthService}
import scala.concurrent.Future
import scala.concurrent.duration._


object Application extends Controller with Guard {
    import controllers.Application._
//  implicit val inEventFormat = Json.format[String]
//  implicit val outEventFormat = Json.format[String]
//  implicit val inEventFrameFormatter = FrameFormatter.jsonFrame[String]
//  implicit val outEventFrameFormatter = FrameFormatter.jsonFrame[String]

  def options(path: String) = Action { request =>
    Ok("")
  }
  def admin() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/admin.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def avatarzips() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/avatarzips.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def facility() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facility.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def facilityImage() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilityimage.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def facilityLogo() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilitylogo.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def facilityBG() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilitybg.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def facilityZone() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilityzone.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }
  def facilityZoneGlanceMap() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilityzoneglancemap.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }
  def facilityZoneByMap() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/facilityzoneglancemap.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def restoreAll() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/restoreall.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def updateTitle() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatetitle.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def updateTenantId() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatetenantid.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def onoffAnimation() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/onoffanimation.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def onoffautoprofile() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/onoffautoprofile.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def onoffinmemory() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/onoffinmemory.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def deviceAlias()= Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/devicealias.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def addDeviceAlias()= Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/adddevicealias.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def zoneBroadcasting() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/zonebroadcasting.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def updateSecret() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatesecret.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }
  def updateTropo() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatetropo.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }
  def updateSpark() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatespark.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def updateValidator() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatevalidator.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def updateThreshold() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/updatethreshold.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def passReset() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/passreset.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def showToken() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/showtoken.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def settings() = Action.async { implicit request =>
    Future{
      if(isAdminToken(request)) {
        val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/settings.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
      } else {
        Redirect("/login.html?redirect="+java.net.URLEncoder.encode(request.path, "utf-8")).discardingCookies(DiscardingCookie("token"))
      }
    }
  }

  def login() = Action.async { implicit request =>
    Future{
      val contentStream = this.getClass.getResourceAsStream("/public/miscsettings/login.html")
      Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML).withCookies(Cookie("token",remoteToken))
    }
  }

  def home() = Action.async { implicit request =>
    def isCheckOrRegistration():Boolean={
      //request.domain
      if(request.path.indexOf("/")==0 && (request.uri.indexOf("/#check")>=0 ||
        request.uri.indexOf("/#regisrer")>=0||
        request.uri.indexOf("/?DEMO")>=0))
        true
      else
        false
    }
    Future{
      if(true || isCheckOrRegistration() || isLoggedIn(request)){
        val contentStream = this.getClass.getResourceAsStream("/public/index.html")
        Ok.chunked(Enumerator.fromStream(contentStream)).as(HTML)
      } else {
        Redirect("/login.html")
      }
    }
  }

  def glanceWS = WebSocket.acceptWithActor[String, JsValue] { request => out =>
      val credential = remoteCredential(request)
      val clientAddress =remoteXAddress(request)
      val bLoggedIn =isLoggedIn(request)
      if(!bLoggedIn)
        Logger.info("websocket is not logged in!")
      Logger.debug("WebSocket.acceptWithActor ClientAddress:{}",clientAddress)
      val socketId =UUID.randomUUID().toString()
      GlanceWebSocketActor.props(socketId,clientAddress,credential,out)
  }

  def redirectDocs = Action {
    Redirect(url = "/assets/lib/swagger-ui/index.html", queryString = Map("url" -> Seq("/swagger.json")))
  }
}



