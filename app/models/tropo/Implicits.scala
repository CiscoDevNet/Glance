package models.tropo

import play.api.libs.json._
import play.api.libs.functional.syntax._
import utils.ComUtils

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/4/30
 **/
object Implicits {
  val tolerantTropoReaders = new Reads[Tropo] {
    def reads(js: JsValue) = {
      JsSuccess(Tropo(
        (js \ "type").asOpt[String].getOrElse(""),
        (js \ "countrycode").asOpt[String].getOrElse("+1"),
        (js \ "tel").asOpt[String].getOrElse(""),
        (js \ "msg").asOpt[String].getOrElse("")
      ))
    }
  }

  implicit val tropoWrites = new Writes[Tropo] {
    def writes(z: Tropo): JsValue = {
      Json.obj(
        "type" -> z.stype,
        "countrycode" -> z.countryCode,
        "tel" -> z.tel,
        "msg" -> z.msg
      )
    }
  }

  implicit val tropoFormat = Format(tolerantTropoReaders, tropoWrites)
}
