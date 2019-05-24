package object models {
  import play.api.libs.json._
  import reactivemongo.bson._

  implicit val objectIdRead: Reads[BSONObjectID] = __.read[String].map {
    oid => BSONObjectID(oid)
  }

  implicit val objectIdWrite: Writes[BSONObjectID] = new Writes[BSONObjectID] {
    def writes(oid: BSONObjectID): JsValue = JsString(oid.stringify)
  }

  implicit val objectIdFormats = Format(objectIdRead, objectIdWrite)
}
