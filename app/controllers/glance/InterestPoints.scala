package controllers.glance

import java.util.UUID

import controllers.security.Guard
import models.common.GlanceStatus
import models.glance._
import play.Logger
import play.api.libs.json._
import play.api.mvc.{RequestHeader, Result, Action, Controller}
import utils.{ComUtils, JsonResult}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
/**
 * Created by kennych on 6/28/16.
 */
object InterestPoints  extends Controller with Guard {

  def InterestPointTemplate() = Action.async { implicit request =>
    val credential =remoteCredential
    val t= new GlanceInterestPoint(glanceOrgId = credential.glanceOrgId,
      id="internet_point_1_of_floor1",
      floorId="Floor Sample1",
      name="Interest Point Glance",
      description="Glance interest point",
      position = new GlancePosition(x=20,y=20)
    )
    Future{JsonResult(Json.toJson(t))}
  }

  def add()=Action.async(parse.json) {implicit request =>
    val credential =remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        val interestPoint=request.body.as[GlanceInterestPoint](GlanceInterestPoint.glanceInterestPointReaders)
        GlanceInterestPoint.addOrUpdate(credential,interestPoint).map{ bRet =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Add/update interest point successfully.")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to add/update interest point.")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to add/update interest point, exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("exception: add/update interest point.")))}
      }
    }
  }

  def getAll() = Action.async { implicit request =>
    val credential =remoteCredential
    GlanceInterestPoint.readAll(credential).map{ conf =>
      if(conf.length==0)
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched interest points found.")))
      else
        JsonResult(Json.toJson(conf))
    }.recover{
      case _=>
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched interest points,exception.")))
    }
  }

  def readByFloorId(floorIdName:String) = Action.async { implicit request =>
    val credential =remoteCredential

    for{
       floorInfo <-GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,floorIdName)
       interestPoints <- {if(floorInfo==null)Future{List()} else GlanceInterestPoint.readAllByFloorIdName(credential,floorInfo.floorId)}
    }yield{
      if(interestPoints==null || interestPoints.length==0)
        NotFound(Json.toJson(GlanceStatus.failureStatus("No matched interest points found!")))
      else
        JsonResult(Json.toJson(interestPoints))
    }
  }
  def deleteInterestPointById(interestPointId:String)= Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        GlanceInterestPoint.delete(credential,interestPointId).map{ bRet:Boolean =>
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Delete the interest point successfully.")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Delete the interest point failed.")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to delete interest point,exception:{}",e.getMessage)
          Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Exception: delete interest point!")))}
      }
    }
  }

  def deleteInterestPointByFloor(floorNameId:String)= Action.async { implicit request =>
    val credential = remoteCredential
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      try{
        for{
          optFloorInfo <- GlanceTrackFloor.readByFloorId(credential,floorNameId)
          bRet <- {
            if(optFloorInfo.isEmpty)
              {Future{false}}
            else
              GlanceInterestPoint.deleteByFloorId(credential,optFloorInfo.get.floorId)
          }
        }yield {
          if(bRet)
            JsonResult(Json.toJson(GlanceStatus.successStatus("Delete the interest points successfully.")))
          else
            NotFound(Json.toJson(GlanceStatus.failureStatus("Delete the interest points failed.")))
        }
      }catch{
        case e:Throwable =>
          Logger.error("Failed to delete interest points,exception:{}",e.getMessage)
          Future{InternalServerError(Json.toJson(GlanceStatus.failureStatus("Exception: Failed to delete interest points.")))}
      }
    }
  }

}
