package models.cmx

import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.Logger
/**
 * Created by kennych on 12/25/15.
 */
case class GlanceImageInfo( imageName:String,
                      zoomLevel: Option[Long]=Some(0),
                      width: Option[Long]=Some(0),
                      height: Option[Long]=Some(0),
                      size: Option[Long]=Some(0),
                      maxResolution: Option[Long]=Some(0),
                      colorDepth: Option[Long]=Some(0),
                      imageFileId:String="")

object GlanceImageInfo{

  val tolerantImageReaders = new Reads[GlanceImageInfo] {
    def reads(js: JsValue) = {
      JsSuccess(GlanceImageInfo(
        (js \ "imageName").asOpt[String].getOrElse(""),
        (js \ "zoomLevel").asOpt[Long],
        (js \ "width").asOpt[Long],
        (js \ "height").asOpt[Long],
        (js \ "size").asOpt[Long],
        (js \ "maxResolution").asOpt[Long],
        (js \ "colorDepth").asOpt[Long],
        (js \ "imageFileId").asOpt[String].getOrElse("")
      ))
    }
  }

  val imageInfoReaders: Reads[GlanceImageInfo] = (
      (__ \ "imageName").read[String] and
      (__ \ "zoomLevel").readNullable[Long] and
      (__ \ "width").readNullable[Long] and
      (__ \ "height").readNullable[Long] and
      (__ \ "size").readNullable[Long] and
      (__ \ "maxResolution").readNullable[Long] and
      (__ \ "colorDepth").readNullable[Long] and
      (__ \ "imageFileId").read[String]
    )(GlanceImageInfo.apply _)

  implicit val imageInfoWrites = new Writes[GlanceImageInfo] {
    def writes(z: GlanceImageInfo): JsValue = {
      var obj=Json.obj(
        "imageName" -> z.imageName,
        "imageFileId" -> z.imageFileId
      )
      if(z.zoomLevel.isDefined)
        obj += ("zoomLevel" -> JsNumber(z.zoomLevel.get))
      if(z.width.isDefined)
        obj += ("width" -> JsNumber(z.width.get))
      if(z.height.isDefined)
        obj += ("height" -> JsNumber(z.height.get))
      if(z.size.isDefined)
        obj += ("size" -> JsNumber(z.size.get))
      if(z.maxResolution.isDefined)
        obj += ("maxResolution" -> JsNumber(z.maxResolution.get))
      if(z.colorDepth.isDefined)
        obj += ("colorDepth" -> JsNumber(z.colorDepth.get))
      obj
    }
  }

  implicit val imageFormat = Format(imageInfoReaders, imageInfoWrites)
}

