package models.common

import play.api.libs.json._

/**
 * Created by kennych on 16/9/10.
 */

case class TropoContacts(phones:List[String] = List(),sms:String,link:String)

object TropoContacts {

  val CONST_PROPERTY_PHONES = "phones"
  val CONST_PROPERTY_SMS = "sms"
  val CONST_PROPERTY_LINK = "link"
  val tolerantTropoReaders = new Reads[TropoContacts] {
    def reads(js: JsValue): JsResult[TropoContacts] = {
      JsSuccess(TropoContacts(
        (js \ CONST_PROPERTY_PHONES).asOpt[List[String]].getOrElse(List()),
        (js \ CONST_PROPERTY_SMS).asOpt[String].getOrElse(""),
        (js \ CONST_PROPERTY_LINK).asOpt[String].getOrElse("")
      ))
    }
  }
}
