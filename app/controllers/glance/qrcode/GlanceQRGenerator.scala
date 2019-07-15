package controllers.glance.qrcode


import java.io.{FileInputStream, File}
//import javax.ws.rs.PathParam
//import com.wordnik.swagger.annotations._
//import javax.ws.rs.ApplicationPath

import com.sksamuel.scrimage.Image
import com.sksamuel.scrimage.nio.{PngWriter, ImageWriter, JpegWriter}
import controllers.glance.Avatar._
import utils.ComUtils.MAX_CONTENT
import controllers.glance.Conf._
import controllers.glance.guestaccess.GuestCheckIn._
//import io.swagger.annotations.ApiModelProperty
import models.common.GlanceStatus
import models.glance.{GlanceSystemConf, GlanceMap, RegisteredUser}
import play.Logger
import play.api.libs.Files.TemporaryFile
import play.api.libs.iteratee.Enumerator
;
import play.api.libs.json._
import controllers.security.Guard
//import play.api.mvc.MultipartFormData.FilePart
import play.api.mvc._
import play.api.Play.current
//import play.api.libs.concurrent.Akka
//import akka.util.Timeout
import play.modules.reactivemongo.{MongoController, ReactiveMongoPlugin}
import reactivemongo.api.gridfs.{ReadFile, DefaultFileToSave, GridFS}
//import reactivemongo.api.gridfs.Implicits.DefaultReadFileReader
import reactivemongo.bson.{BSONString, BSONDocument, BSONObjectID}
//import services.cisco.indoor.CMXService
//import services.security.GlanceCredential
import utils.ComUtils
import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.util.Success
import net.glxn.qrgen._

/**
 * Created by kennych on 1/12/16.
 */
//@Api(value="/api/v1", description = "Glance APIs",basePath = "/api/v1")
object GlanceQRGenerator extends Controller with Guard{

//  @ApiOperation(
//    nickname = "qrcode",
//    value = "Generate QR code for file",
//    notes = "Generate QR Code",
//    httpMethod = "POST",
//    consumes = "application/json",
//    produces = "application/json")
//  @ApiImplicitParams(Array(
//    new ApiImplicitParam(value = "Generate QRCode", name="data", required = true, dataType = "application/json", paramType = "body")))
//  @ApiResponses(Array(
//    new ApiResponse(code = 200, message = "Success"),
//    new ApiResponse(code = 400, message = "Bad Request"),
//    new ApiResponse(code = 500, message = "Internal error")))
  def qrGenerate() = Action.async(parse.json) { implicit request =>
    val urlStr =(request.body \ "url").as[String]
    Logger.debug("Url:{}",urlStr)
    val file:File = QRCode.from(urlStr).file();
    Logger.debug("QR Code:{}",file.getName())
    file.renameTo(new File("/tmp/"+file.getName()))
    Future{
      Ok(Json.obj("url" ->urlStr,"filename" ->file.getName))
    }
  }

//  @ApiOperation(
//    nickname = "qrcode",
//    value = "Generate QR code for file",
//    notes = "Generate QR Code",
//    httpMethod = "GET",
//    consumes = "application/json")
//    @ApiImplicitParams(Array(
//      new ApiImplicitParam(value = "Get QRCode", name="fileName", required = true, dataType = "string", paramType = "path")))
//    @ApiResponses(Array(
//      new ApiResponse(code = 200, message = "Success"),
//      new ApiResponse(code = 400, message = "Bad Request"),
//      new ApiResponse(code = 500, message = "Internal error")))
  def getQRCode(fileName:String) = Action.async{ implicit request =>
    val file =new File("/tmp/"+fileName)
    Future{Ok.sendFile(new File("/tmp/"+fileName),true).withHeaders(CONTENT_TYPE -> "image/png",CONTENT_LENGTH -> file.length.toString)}
  }

  private def isValidUrl(urlCheck:String):Boolean ={
    import java.net.URL
    import java.net.MalformedURLException
    try{
      val url =new URL(urlCheck)
      if(url.getProtocol.compareToIgnoreCase("http")==0 || url.getProtocol.compareToIgnoreCase("https")==0)
        true
      else
        false
    }catch {
      case e:MalformedURLException =>
        Logger.error("Incorrect parameter of Guest Checkin:{}",e.getMessage())
        false
      case ex:Throwable=>
        Logger.error("Incorrect parameter of Guest Check-In-Unknown exception:{}",ex.getMessage)
        false
    }
  }

//  @ApiOperation(
//    nickname = "navigateQRCode",
//    value = "Navigate QR code for file",
//    notes = "Navigate QR Code",
//    httpMethod = "GET",
//    consumes = "string",
//    produces="string")
//  @ApiImplicitParams(Array(
//    new ApiImplicitParam(value = "Navigate QR Code", name = "url", required = true,paramType = "query",dataType = "string"),
//    new ApiImplicitParam(value = "Navigate QR Code", name = "appname", required = true,paramType = "query",dataType = "string")))
//  @ApiResponses(Array(
//    new ApiResponse(code = 200, message = "Success"),
//    new ApiResponse(code = 400, message = "Bad Request"),
//    new ApiResponse(code = 500, message = "Internal error")))
  def navigationQRCode()=Action.async{ implicit request =>
    val urlStr =remoteQueryString(request,"url","")
    val appName =remoteQueryString(request,"appname","")
    Logger.debug("QRCode for URL:{},AppName:{}",urlStr,appName)
    if(!isValidUrl(urlStr)){
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid URL parameter!")))}
    }else{
      val file:File = QRCode.from(urlStr).file();
      Future{Ok.sendFile(file,true).withHeaders(CONTENT_TYPE -> "image/png",CONTENT_LENGTH -> file.length.toString)}
    }
  }
}
