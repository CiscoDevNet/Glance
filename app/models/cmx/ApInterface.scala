package models.cmx

/**
 * Created by haihxiao on 15/4/27.
 */
case class ApInterface(band: String,
                       slotNumber: Int,
                       channelAssignment: Int,
                       channelNumber: Int,
                       txPowerLevel: Int,
                       antennaPattern: String,
                       antennaAngle: Double,
                       antennaElevAngle: Double,
                       antennaGain: Double)


