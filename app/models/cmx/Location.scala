package models.cmx

/**
 * Created by haihxiao on 15/4/28.
 */
case class Location(macAddress: String,
                    currentlyTracked: Boolean,
                    isGuestUser: Boolean,
                    confidenceFactor: Int,
                    userName: Option[String],
                    mapCoordinate: MapCoordinate,
                    ipAddresses: List[String],
                    statistics: Statistics,
                    mapInfo: MapInfo)


