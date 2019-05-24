package models.cmx

import play.api.libs.json.JsValue

/**
 * Created by haihxiao on 15/4/27.
 */
case class Campus(objectVersion: Int,
                  name: String,
                  image: Option[GlanceImageInfo],
                  dimension: Dimension,
                  buildings: List[Building],
                  /*CMX V10 support*/
                  aesUid: BigDecimal,
                  aesUidString:String,
                  members:List[JsValue])


