package models.cmx

/**
 * Created by haihxiao on 15/4/27.
 */
case class AccessPoint(name: String,
                       radioMacAddress: String,
                       ethMacAddress: String,
                       ipAddress: String,
                       numOfSlots: Int,
                       apMode: String,
                       mapCoordinate: MapCoordinate,
                       apInterfaces: List[ApInterface])



