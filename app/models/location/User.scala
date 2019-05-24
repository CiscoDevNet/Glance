package models.location

import models._
import play.api.libs.json.{Json, JsObject}
import play.api.Play.current
import play.modules.reactivemongo.json.collection.JSONCollection
import reactivemongo.bson.BSONObjectID
import services.cisco.database.GlanceDBService
import utils.ComUtils
import play.api.libs.functional.syntax._
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by haihxiao on 15/4/25.
 */
case class User (
     _id: BSONObjectID = BSONObjectID.generate,
     name: String,
     email: Option[String],
     macAddress: String,
     created: Long = System.currentTimeMillis(),
     updated: Long = System.currentTimeMillis(),
     tags: List[String] = List(),
     properties: JsObject = Json.obj())

object User {
  def collection = GlanceDBService.GlanceDB().collection[JSONCollection]("users")

  val tolerantUserReaders = new Reads[User] {
    def reads(js: JsValue) = {
      JsSuccess(User(
        (js \ ComUtils.CONST_PROPERTY_DBID).asOpt[BSONObjectID].getOrElse(BSONObjectID.generate),
        (js \ ComUtils.CONST_PROPERTY_NAME).asOpt[String].getOrElse(BSONObjectID.generate.stringify),
        (js \ ComUtils.CONST_PROPERTY_EMAIL).asOpt[String],
        (js \ ComUtils.CONST_PROPERTY_MACADDRESS).as[String],
        (js \ ComUtils.CONST_PROPERTY_CREATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_UPDATED).asOpt[Long].getOrElse(System.currentTimeMillis()),
        (js \ ComUtils.CONST_PROPERTY_TAGS).asOpt[List[String]].getOrElse(List()),
        (js \ ComUtils.CONST_PROPERTY_PROPERTIES).asOpt[JsObject].getOrElse(Json.obj())
      ))
    }
  }

  val userReaders : Reads[User] = (
    (__ \ ComUtils.CONST_PROPERTY_DBID).read[BSONObjectID] and
    (__ \ ComUtils.CONST_PROPERTY_NAME).read[String] and
    (__ \ ComUtils.CONST_PROPERTY_EMAIL).readNullable[String] and
    (__ \ ComUtils.CONST_PROPERTY_MACADDRESS).read[String] and
    (__ \ ComUtils.CONST_PROPERTY_CREATED).read[Long] and
    (__ \ ComUtils.CONST_PROPERTY_UPDATED).read[Long] and
    (__ \ ComUtils.CONST_PROPERTY_TAGS).read[List[String]] and
    (__ \ ComUtils.CONST_PROPERTY_PROPERTIES).read[JsObject]
  )(User.apply _)

  implicit val userWrites = new Writes[User] {
    def writes(z: User): JsValue = {
      Json.obj(
        ComUtils.CONST_PROPERTY_DBID -> z._id,
        ComUtils.CONST_PROPERTY_NAME -> z.name,
        ComUtils.CONST_PROPERTY_EMAIL -> z.email,
        ComUtils.CONST_PROPERTY_MACADDRESS -> z.macAddress,
        ComUtils.CONST_PROPERTY_CREATED -> z.created,
        ComUtils.CONST_PROPERTY_UPDATED -> z.updated,
        ComUtils.CONST_PROPERTY_TAGS -> z.tags,
        ComUtils.CONST_PROPERTY_PROPERTIES -> z.properties
      )
    }
  }

  implicit val userFormat = Format(userReaders, userWrites)

  def insert(t: User) = {
    User.collection.insert(t)
  }
}
