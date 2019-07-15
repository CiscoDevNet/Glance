package models.cmx.Notitification

import models.cmx.MapCoordinate
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.Logger
import models.cmx.Implicits._
/**
 * Created by kennych on 12/31/15.
 */
case class LocationUpdateNotification(notificationType:String,
                          subscriptionName:String,
                          entity:String,
                          deviceId:String,
                          lastSeen:String,
                          locationMapHierarchy:String,
                          locationCoordinate:MapCoordinate,
                          floorId:String="",
                          username:String="",
                          timestamp:Long=System.currentTimeMillis())





