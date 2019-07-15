package services.cisco.spark

import akka.actor.Actor
import models.glance.GlanceSystemConf
import play.Logger
import play.api.libs.json.{Json, JsArray, JsObject}
import play.api.libs.ws.{WSResponse, WS, WSRequestHolder}
import services.common.{SchedulingService, ConfigurationService}
import play.api.Play.current
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._

/**
 * Created by kennych on 12/21/16.
 */

object SparkService{
  val uri: String = ConfigurationService.getString("spark.uri", "https://api.tropo.com/1.0/sessions")
  val token = ConfigurationService.getString("spark.token")
  val account =ConfigurationService.getString("spark.account")
  val actor =  SchedulingService.schedule(classOf[SparkActor], "SparkActor", 1 minutes, 20 seconds, "!")

  def send(from:String,to:String,msg:String,conf:GlanceSystemConf) : Unit = {
    if(from=="")
      actor ! (account,to, msg,conf)
    else
      actor ! (from,to, msg,conf)
  }

  def createRequest(apiUri:String,apiToken:String,timeout: Int =2*60*1000): WSRequestHolder = {
    val holder = WS.url(apiUri).withRequestTimeout(timeout)
    holder.withHeaders("Accept" -> "application/json")
    holder.withHeaders("Content-Type" -> "application/json")
    holder.withHeaders("Authorization" -> ("Bearer  "+apiToken))
  }

  def send(to:String,msg:String,conf:GlanceSystemConf):Future[Option[Int]]={
    var apiToken:String =token
    if(conf !=null && conf.sparkSetting.token!="")
      apiToken = conf.sparkSetting.token
    val apiUri:String=uri
    val holder: WSRequestHolder = createRequest(apiUri,apiToken)
    val data = Json.obj(
      "toPersonEmail" -> to,
      "text" -> msg
    )
    val response = (response: WSResponse) => {
      response.status match {
        case 200 =>
          Logger.debug(s"Sent Spark message to $to with $msg")
          Some(200)
        case _ =>
          Logger.warn(s"Failed to send Spark to $to with $msg")
          None
      }
    }
    holder.post(data).map(response)
  }

  def sendBatch(toList:List[String],msg:String,conf:GlanceSystemConf):Future[List[Option[Int]]]={
    val results:mutable.MutableList[Option[Int]]=new mutable.MutableList[Option[Int]]()
    val p = Promise[List[Option[Int]]]
    val f = p.future
    Future {
      val completed = new java.util.concurrent.atomic.AtomicLong()
      for(sendTo <- toList){
        send(sendTo,msg,conf).map{ res =>
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

  case class userSparkMsg(from:String, to:String,msg:String,conf:GlanceSystemConf)

  class SparkActor extends Actor {
    val todo = scala.collection.mutable.MutableList[userSparkMsg]()

    def receive = {
      case (from:String,to:String,msg:String,conf:GlanceSystemConf) =>
        todo += userSparkMsg(from,to,msg,conf)

      case "!" =>
        todo.foreach { sparkMsg =>
            SparkService.send(sparkMsg.to,sparkMsg.msg,sparkMsg.conf)
        }
        todo.clear()
    }
  }
}
