package controllers.glance

import models.glance.GlanceMeetingHours
import controllers.security.Guard
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Action, Controller}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by kennych on 11/5/15.
 */
object MeetingHours  extends Controller with Guard{
  def count() = Action.async { implicit request =>
    val credential =remoteCredential
    val vGlanceFloorId = "default"
    val vDay =ComUtils.getDayString()
    def getResult(optMeetingHours:Option[GlanceMeetingHours],defaultVal:GlanceMeetingHours): Result = {
      JsonResult(Json.toJson(optMeetingHours.getOrElse(defaultVal)))
    }
    val defaultVal =GlanceMeetingHours.getDefaultMeetingHours(credential,vGlanceFloorId,vDay)
    GlanceMeetingHours.getMeetingHours(credential,vGlanceFloorId,vDay).map{ optMeetingHours =>
      getResult(optMeetingHours,defaultVal)
    }
  }
  
}
