package controllers.glance

import utils.ComUtils.MAX_CONTENT
import controllers.glance.guestaccess.GuestCheckIn._
import models.common.GlanceStatus
import models.glance.GlanceSystemConf
import play.Logger
;
import play.api.libs.json._
import controllers.security.Guard
import play.api.libs.ws.{WSResponse, WS, WSRequestHolder}
import play.api.mvc.{Result, Action, Controller}
import akka.actor.{ Actor, Props, actorRef2Scala }
import akka.pattern.ask
import play.api.Play.current
import play.api.libs.concurrent.Akka
import akka.util.Timeout
//import services.common.DataService
import utils.ComUtils
import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.reflect.io.File
import scala.util.Success
import services.cisco.tropo.TropoService

import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 11/5/15.
 */
object Recognition extends Controller with Guard{

  def recognize() = Action.async(parse.json) { implicit request =>
    val credential = remoteCredential
    val polygons:List[List[List[Double]]] = (request.body \ "polygons").as[List[List[List[Double]]]]
    //this API try to recognition the text of the dots(lines) for hand writing.
//    def getRecognitionText(text:String): JsValue ={
//      val result =Json.obj("text" ->text,"text_purify"->text)
//      result
//    }

    Future{NotFound(Json.toJson(GlanceStatus.failureStatus("Handwriting recognition API has not been implemented yet.")))}

//    Future{
//      val result:String = ComUtils.recognizeHandWriting(polygons)
//      if(result!=null && result!="")
//        Ok(getRecognitionText(result))
//      else
//        NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to do handwriting recognition!")))
//    }

//    def createRequest(glanceConf:GlanceSystemConf, timeout: Int = 10000) : WSRequestHolder = {
//      Logger.info("URI:"+glanceConf.recognitionUrl)
//      val holder = WS.url(glanceConf.recognitionUrl).withRequestTimeout(timeout)
//      holder.withHeaders("Content-Type" -> "application/json")
//      holder.withHeaders("Accept" -> "application/json")
//      holder
//    }
//
//    for{
//      sysConf <-GlanceSystemConf.readConf(credential)
//      response <- createRequest(sysConf).post(request.body)
//    } yield  {
//      response.status match {
//        case 200 =>
//          Ok(response.json)
//        case _ =>
//          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to recognize the input:"+response.status)))
//      }
//    }
  }

}