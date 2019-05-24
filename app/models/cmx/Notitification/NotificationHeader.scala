package models.cmx.Notitification

/**
 * Created by kennych on 12/31/15.
 */
case class NotificationHeader(notificationType:String,
                              subscriptionName:String,
                              entity:String,
                              deviceId:String,
                              lastSeen:String)