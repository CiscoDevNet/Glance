package models.cmx.Notitification

import models.cmx.MapCoordinate

/**
 * Created by kennych on 12/31/15.
 */
//only CMX 8 supported containment
case class ContainmentNotification(notificationType:String,
                                   subscriptionName:String,
                                   entity:String,
                                   deviceId:String,
                                   locationMapHierarchy:String,
                                   locationCoordinate:MapCoordinate,
                                   mseUdi:String="",
                                   floorRefId:BigDecimal,
                                   boundary:String,
                                   areaType:String,
                                   containerHierarchy:String,
                                   username:String="",
                                   timestamp:Long=System.currentTimeMillis())
