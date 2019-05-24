package utils

import play.api.http.HeaderNames._
import play.api.http.{Status, Writeable}
import play.api.libs.iteratee.Enumerator
import play.api.libs.json._
import play.api.mvc.{HttpConnection, ResponseHeader, Result}

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/5/11
 **/
class JsonResult(status: Int) extends Result(header = ResponseHeader(status), body = Enumerator.empty, connection = HttpConnection.KeepAlive) {
  def apply(content: JsValue)(implicit writeable: Writeable[JsValue]): Result = {
    Result(
      ResponseHeader(status, writeable.contentType.map(ct => Map(CONTENT_TYPE -> ct)).getOrElse(Map.empty)),
      Enumerator(writeable.transform(transform(content)))
    )
  }

  private def transform(jsValue : JsValue) : JsValue = {
    jsValue match {
      case JsArray(arr) =>
        JsArray(arr.map(transform))
      case obj : JsObject =>
        obj \ "_id" match {
          case id: JsString =>
            Json.obj(ComUtils.CONST_PROPERTY_ID -> id) ++ (obj - "_id")
          case x =>
            obj
        }
      case o =>
        o
    }
  }
}

object JsonResult {
  val OK = new JsonResult(Status.OK)
  val CREATED = new JsonResult(Status.CREATED)

  def apply(content: JsValue)(implicit writeable: Writeable[JsValue]): Result = {
    OK(content)(writeable)
  }

  def Ok(content: JsValue)(implicit writeable: Writeable[JsValue]): Result = {
    OK(content)(writeable)
  }

  def Created(content: JsValue)(implicit writeable: Writeable[JsValue]): Result = {
    CREATED(content)(writeable)
  }
}
