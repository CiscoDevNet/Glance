package models.cmx

/**
 * Created by kennych on 10/19/16.
 */
case class Zone(name:String,
                zoneCoordinate:List[MapCoordinate],
                zoneType:String="ZONE",
                color:String="#000000")
