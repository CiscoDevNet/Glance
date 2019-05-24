package models.cmx.Notitification

import models.cmx.MapCoordinate

/**
 * Created by kennych on 12/31/15.
 */
//cmx 8 & Cmx 10 support movement...
case class MovementNotification (notificationType:String,
                                 subscriptionName:String,
                                 entity:String,
                                 deviceId:String,
                                 lastSeen:String,
                                 locationMapHierarchy:String,
                                 locationCoordinate:MapCoordinate,
                                 floorId:String="",
                                 username:String="",
                                 timestamp:Long=System.currentTimeMillis())
