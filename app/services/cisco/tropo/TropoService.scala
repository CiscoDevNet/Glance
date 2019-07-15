package services.cisco.tropo

import akka.actor.{ActorSystem, Props, Actor, ActorRef}
import models.glance.GlanceSystemConf
import scala.collection.mutable
import models.tropo.{Tropo}
import models.tropo.Implicits._
import play.Logger
import play.api.libs.json.{JsArray, JsObject, Json}
import play.api.libs.ws.{WSResponse, WS, WSRequestHolder}
import services.common.{SchedulingService, ConfigurationService}
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._


/**
 * Created by whs on 15/9/10.
 */
object TropoService /*extends CloudConnector*/ {
  val uri: String = ConfigurationService.getString("tropo.uri", "https://api.tropo.com/1.0/sessions")
  val voiceToken = ConfigurationService.getString("tropo.voiceToken")
  val smsToken = ConfigurationService.getString("tropo.smsToken")

  def send(stype: String, numberToDial: String, msg: String): Future[Option[Int]] = {
    stype match {
      case "voice" | "V" | "v" =>
        sendVoice(numberToDial, msg)
      case "text" | "T" | "t" =>
        sendSms(numberToDial, msg)
      case _ =>
        Logger.warn(s"Unknown type $stype: $numberToDial with $msg")
        Future.successful(Some(200))
    }
  }

  def sendVoice(numberToDial: String, msg: String): Future[Option[Int]] = {
    val token =voiceToken
    val holder: WSRequestHolder = createRequest()
    val data = Json.obj(
      "token" -> token,
      "numberToDial" -> numberToDial,
      "msg" -> msg
    )
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.debug(s"Sent voice to number $numberToDial with $msg")
          Some(200)
        case _ =>
          Logger.warn(s"Failed to send voice to number $numberToDial with $msg")
          None
      }
    }
    holder.post(data).map(response)
  }

  def sendSms(numberToDial: String, msg: String): Future[Option[Int]] = {
    val token =smsToken
    val holder: WSRequestHolder = createRequest()
    val data = Json.obj(
      "token" -> token,
      "numberToDial" -> numberToDial,
      "msg" -> msg
    )
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.info(s"Sent sms to number $numberToDial with $msg")
          Some(200)
        case _ =>
          if(response.body!=null)
            Logger.debug("Tropo response info:"+response.body)
          Logger.warn(s"Failed to send sms to number $numberToDial with $msg")
          None
      }
    }
    holder.post(data).map(response)
  }

  def sendSmsViaConf(numberToDial: String, msg: String,conf:GlanceSystemConf): Future[Option[Int]] = {
    var token =smsToken
    if(conf !=null && conf.tropoSetting.tropoAuthToken!="")
      token =conf.tropoSetting.tropoAuthToken

    val holder: WSRequestHolder = createRequest()
    val data = Json.obj(
      "token" -> token,
      "numberToDial" -> numberToDial,
      "msg" -> msg
    )
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.info(s"Sent sms to number $numberToDial with $msg")
          Some(200)
        case _ =>
          if(response.body!=null)
            Logger.debug("Tropo return status:"+response.body)
          Logger.warn(s"Failed to send sms to number $numberToDial with $msg")
          None
      }
    }
    holder.post(data).map(response)
  }

  def createRequest(timeout: Int = 2*60*1000): WSRequestHolder = {
    val holder = WS.url(uri).withRequestTimeout(timeout)
    holder.withHeaders("Accept" -> "application/json")
    holder.withHeaders("Content-Type" -> "application/json")
  }

  def sendBatch(toList:List[String],msg:String,conf:GlanceSystemConf):Future[List[Option[Int]]]={
    val results:mutable.MutableList[Option[Int]]=new mutable.MutableList[Option[Int]]()
    val p = Promise[List[Option[Int]]]
    val f = p.future

    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      for(sendTo <- toList){
        sendSmsViaConf(sendTo,msg,conf).map{ res =>
          results +=res
          val count =completed.incrementAndGet()
          if(count>=toList.length)
            p.success(results.toList)
        }.recover{
          case _=>
            results+=None
            val count =completed.incrementAndGet()
            if(count>=toList.length)
              p.success(results.toList)
        }
      }
      if(toList.length<=0)
        p.success(results.toList)
    }

    f.map{ results =>
      results
    }.recover{
      case _=>
        List()
    }
  }
}
