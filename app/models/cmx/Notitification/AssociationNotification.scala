package models.cmx.Notitification

/**
 * Created by kennych on 12/31/15.
 */
case class AssociationNotification(notificationType:String,
                       subscriptionName:String,
                       entity:String,
                       deviceId:String,
                       lastSeen:String,
                       association:Boolean=false,
                       ipAddressV4:String="",
                       ipAddressV6:String="",
                       username:String="",
                       timestamp:Long=System.currentTimeMillis())
