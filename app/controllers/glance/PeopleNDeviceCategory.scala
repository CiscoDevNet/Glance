package controllers.glance

import controllers.security.Guard
import models.glance.GlancePeopleNDeviceCategory
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Result, Action, Controller}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

/**
 * Created by kennych on 9/23/16.
 */
object PeopleNDeviceCategory extends Controller with Guard{

  def PeopleCategory()= Action.async { implicit request =>
    val credential=remoteCredential
    Future{
      Ok(Json.toJson(GlancePeopleNDeviceCategory.getPeopleCategory(credential)))
    }
  }
  def DeviceCategory()= Action.async { implicit request =>
    val credential=remoteCredential
    Future{
      Ok(Json.toJson(GlancePeopleNDeviceCategory.getDeviceCategory(credential)))
    }
  }

}
