package models.cmx

/**
 * Created by kennych on 3/13/17.
 */
case class Connected( nextIndex:Long=0,
                      timeZoneOffset:Long,
                      queryRecordCount:Long,
                      timeZone:String,
                      records:List[ConnectedRecord],
                      returnRecordCount:Long=0)
case class ConnectedRecord( operationSystem:String="",
                            bytesSent:Long=0,
                            portal:String="",
                            state:String="",
                            lastAcceptTime:String="",
                            macAddress:String="",
                            portalType:String="",
                            agent:String="",
                            bandwidth:Long=0,
                            Name:String="",
                            firstLoginTime:String="",
                            Email:String="",
                            device:String="",
                            bytesReceived:Long=0,
                            locationSite:String="",
                            lastLogoutTIme:String="",
                            companyName:String="",
                            language:String="",
                            authType:String="",
                            lastLoginTime:String="",
                            Industry:String="",
                            updatedTimestamp:Long =System.currentTimeMillis())