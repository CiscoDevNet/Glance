package models.cmx

/**
 * Created by haihxiao on 15/4/27.
 */
case class Floor(objectVersion: Int,
                 name: String,
                 isOutdoor: Boolean,
                 floorNumber: Int,
                 floorRefId: String,
                 dimension: Dimension,
                 image: Option[GlanceImageInfo],
                 zones:List[Zone]=List(),
                 accessPoints: List[AccessPoint],
                 /*CMX 10 Support*/
                 aesUid:BigDecimal=0,
                 aesUidString:String="",
                 hierarchyName:String="")

