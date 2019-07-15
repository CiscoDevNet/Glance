package models.cmx.Notitification

import models.cmx.MapCoordinate

/**
 * Created by kennych on 12/31/15.
 */
case class InOutNotification(notificationType:String,
                             subscriptionName:String,
                             entity:String,
                             deviceId:String,
                             locationMapHierarchy:String,
                             locationCoordinate:MapCoordinate,
                             boundary:String,
                             floorId:String="",
                             username:String="",
                             timestamp:Long=System.currentTimeMillis())