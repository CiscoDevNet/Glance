package models.cmx

/**
 * Created by kennych on 16/4/27.
 */
case class Building(objectVersion: Int,
                    name: String,
                    dimension: Dimension,
                    floors: List[Floor],
                    /*CMX V10 support*/
                    image:Option[GlanceImageInfo],
                    aesUid:BigDecimal,
                    aesUidString:String,
                    hierarchyName:String)


