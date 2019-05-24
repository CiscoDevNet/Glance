package models.glance

import play.Logger
import play.api.libs.json.{Json, JsObject}
import reactivemongo.bson.BSONObjectID
import utils.ComUtils
import play.api.libs.json._

/**
 * Created by kennych on 11/13/15.
 */
case class GlanceSyncMessage (id: String=java.util.UUID.randomUUID().toString(),
                              glanceOrgId:String,
                              glanceUserId:String,
                              messageId: String,
                              event: String,
                              data: JsObject = Json.obj())


object GlanceSyncMessage{
  implicit val tolerantGlanceReaders = new Reads[GlanceSyncMessage] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceSyncMessage(
        (js \ ComUtils.CONST_PROPERTY_ID).as[String],
        (js \ ComUtils.CONST_PROPERTY_GLANCEORGID).as[String],
        (js \ ComUtils.CONST_PROPERTY_GLANCEUSERID).as[String],
        (js \ "messageId").asOpt[String].getOrElse(""),
        (js \ "event").as[String],
        (js \ "data").asOpt[JsObject].getOrElse(Json.obj())
      ))
    }
  }
  implicit val glanceWrites = new Writes[GlanceSyncMessage] {
    def writes(z: GlanceSyncMessage): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_ID ->z.id,
        ComUtils.CONST_PROPERTY_GLANCEORGID -> z.glanceOrgId,
        ComUtils.CONST_PROPERTY_GLANCEUSERID ->z.glanceUserId,
        "messageId" -> z.messageId,
        "event" -> z.event,
        "data" -> z.data
      )
    }
  }

  implicit val glanceFormat = Format(tolerantGlanceReaders, glanceWrites)

}



