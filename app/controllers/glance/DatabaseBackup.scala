package controllers.glance

import java.io.File
import controllers.glance.Avatar._
import services.security.GlanceCredential
import org.apache.commons.io.FileUtils
import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc._
import utils.ComUtils
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * Created by Elvin on 12/1/16.
 * System backup Controller....
 */
object DatabaseBackup extends Controller with Guard {
  def exportNecessaryMongoInfo() = Action.async { implicit request =>
    val credential = remoteCredential
    def backupAll(credential:GlanceCredential):Future[Result] ={
      GlanceSystemUtil.backupAll(credential).map{ result =>
        if(result.length>0)
          Ok.sendFile(content = new File(result),fileName = _ => new File(result).getName, onClose = () => { FileUtils.forceDelete(new File(result))})
        else
          NotFound(Json.toJson(GlanceStatus.failureStatus("Backup mongo data failed")))
      }.recover{
        case _ =>
          NotFound(Json.toJson(GlanceStatus.failureStatus("Backup mongo data failed")))
      }
    }
    for{
      retRes <-  backupAll(credential)
    } yield  retRes
  }


  def restoreNecessaryMongoInfo() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = remoteExtractDataString(request.body.dataParts.get("url"))
    if (redirectUrl == "") {
      Future {
        BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid redirect Url")))
      }
    }else{
      request.body.file("data") match {
        case Some(datafile) => {
          try {
            GlanceSystemUtil.restoreAll(credential, datafile.ref.file).map{ result =>
              if (result) {
                Redirect(redirectUrl+"?success=true",301)
              } else {
                Redirect(redirectUrl+"?success=false",301)
              }
            }
          } catch {
            case exp: Exception =>
              Logger.error("Failed to restore mongo database:{}",exp.getMessage)
              Future{Redirect(redirectUrl+"?success=false&error=true",301)}
          }
        }
        case _ =>
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("No restore zip file!")))}
      }
    }
  }
}
