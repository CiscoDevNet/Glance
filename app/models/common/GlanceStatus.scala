package models.common

//import play.api.Play.current
//import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._
import play.api.libs.functional.syntax._

/**
 * Created by kennych on 12/7/15.
 */
case class GlanceStatus(status:String="success",message:String="success",version:String="0.0.0.1")

object GlanceStatus {

  val successState ="success"
  val failureState ="failure"
  val version ="1.0.0.0"
  val CONST_PROPERTY_STATUS = "status"
  val CONST_PROPERTY_MESSAGE = "message"
  val CONST_PROPERTY_VERSION = "version"

  implicit val dataReaders : Reads[GlanceStatus] = (
      (__ \ CONST_PROPERTY_STATUS).read[String] and
      (__ \ CONST_PROPERTY_MESSAGE).read[String] and
      (__ \ CONST_PROPERTY_VERSION).read[String]
    )(GlanceStatus.apply _)

  implicit val dataWrites = new Writes[GlanceStatus] {
    def writes(z: GlanceStatus): JsValue = {
      Json.obj(
        CONST_PROPERTY_STATUS -> z.status,
        CONST_PROPERTY_MESSAGE -> z.message,
        CONST_PROPERTY_VERSION -> z.version
      )
    }
  }

  implicit val dataFormat = Format(dataReaders, dataWrites)

  def successStatus(message:String):GlanceStatus ={
    val status =new GlanceStatus(successState,message,version);
    status
  }

  def failureStatus(message:String):GlanceStatus ={
    val status =new GlanceStatus(failureState,message,version);
    status
  }
}