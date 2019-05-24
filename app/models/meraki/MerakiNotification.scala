package models.meraki
/**
 * Created by kennych on 12/22/16.
 */

case class MerakiLocation(lat:Double=0.0,
                          lng:Double=0.0,
                          unc:Double=0.0,
                          x:List[Double]=List(0.0),
                          y:List[Double]=List(0.0),
                          unit:String="METER")

case class MerakiObservationData(ipv4:String=null,
                                 location:MerakiLocation,
                                 seenTime:String,
                                 ssid:String="",
                                 os:String="",
                                 clientMac:String,
                                 seenEpoch:Long,
                                 rssi:String,
                                 ipv6:String="",
                                 manufacturer:String="",
                                 deviceType:String="IP")

/*
deviceType can be IP or BLE
*/

case class MerakiNotificationData(apMac:String,
                                  apFloors:List[String]=List(),
                                  apTags:List[String]=List(),
                                  observations:List[MerakiObservationData]=List())
case class MerakiNotification(version:String,
                              secret:String,
                              notificationType:String,
                              data:MerakiNotificationData)

//devicesSeen, BluetoothDevicesSeen, default to devicesSeen as IP devices.
case class MerakiDeviceIdMapping( version:String,
                                  apMac:String,
                                  apFloors:List[String]=List(),
                                  apTags:List[String]=List(),
                                  devicesSeenType:String="DevicesSeen",
                                  observationData: MerakiObservationData,
                                  tags: List[String] = List(),
                                  updated:Long = System.currentTimeMillis())
