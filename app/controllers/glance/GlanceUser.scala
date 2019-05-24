package controllers.glance

import controllers.amqp.GlanceSyncCache
import utils.ComUtils.MAX_CONTENT
import services.cisco.notification.NotificationService
import scala.collection.mutable
import scala.collection.mutable.HashMap
import models.glance.{GlanceZone, GlanceSystemConf, GlanceTrackCampus, RegisteredUser}
import controllers.security.Guard
import models.common.GlanceStatus
import org.apache.commons.lang3.mutable.Mutable
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Results, Result, Action, Controller}
import services.security.GlanceCredential
import utils.{ComUtils, JsonResult}
import scala.concurrent.Future
import scala.util.{Try,Success,Failure}

/**
 * Created by kennych on 11/5/15.
 */

object GlanceUser extends Controller with Guard{
  import scala.concurrent.ExecutionContext.Implicits.global

  private def getResult(bRet:Boolean):Result={
    if(bRet == true)
      JsonResult(Json.toJson(GlanceStatus.successStatus("Update successfully")))
    else
      NotFound(Json.toJson(GlanceStatus.failureStatus("Update failed")))
  }

  def add() = Action.async(parse.json){ implicit request =>
    val credential =remoteCredential
    def readGlanceUser_inline():RegisteredUser={
      try{
        val glanceUser = request.body.as[RegisteredUser](RegisteredUser.tolerantRegisteredUserReaders)
        return glanceUser.copy(glanceOrgId=credential.glanceOrgId,glanceUserId = credential.glanceUserId)
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to parse registerUser data for adding,exception:{}",exp.getMessage)
          null
      }
    }

    if(false && !isAdminLoggedIn){ //fixme tempory remove for Glance Meet the Expert...
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      val glanceUser =readGlanceUser_inline()
      if(glanceUser==null){
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid user data!")))}
      }else{
        RegisteredUser.addOrUpdate(glanceUser,true).map{ bRet =>
          getResult(bRet)
        }
      }
    }
  }

  def updateUserDeviceInfo(expert_id: String) = Action.async(parse.json(MAX_CONTENT)) { implicit request =>
    val credential =remoteCredential

    if(false && !isAdminLoggedIn){ //fixme, temporay to remove BLE device authorization
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      val category = (request.body \ "category").asOpt[String].getOrElse("").trim()
      val macAddress=  (request.body \ ComUtils.CONST_PROPERTY_MACADDRESS).asOpt[String].getOrElse("").trim()
      val name =(request.body \ "name").asOpt[String].getOrElse("").trim()
      val phoneNumber=(request.body \ "phoneNumber").asOpt[String].getOrElse("").trim()
      for{
        optFindExpertByMac <- {
          if(macAddress!="")
            RegisteredUser.readRegisteredUserByMac(credential,macAddress)
          else
            Future{None}
        }
        bAlreadyAssignedOther <- {
          if (optFindExpertByMac.isDefined) {
            if (optFindExpertByMac.get.id.compareToIgnoreCase(expert_id) != 0)
              Future{true}
            else
              Future{false}
          }else
            Future{false}
        }

        optFindExpert <- {
          if(bAlreadyAssignedOther)
            Future{None}
          else
            RegisteredUser.readUserByUserId(credential,expert_id)
        }
        bRet <- {
          if(bAlreadyAssignedOther)
            Future{false}
          else if(optFindExpert.isDefined)
            RegisteredUser.updateUserDeviceInfo(credential,expert_id,category,macAddress,name,phoneNumber)
          else
            Future{false}
        }
      } yield  {
        if(bAlreadyAssignedOther)
        {
          val (name,id)={
            if(optFindExpertByMac.isDefined)
              (optFindExpertByMac.get.name,optFindExpertByMac.get.id)
            else
              ("","")
          }
          Conflict(Json.obj("assignedName" -> name,"assignedId" ->id))
        }
        //Conflict(Json.toJson(GlanceStatus.failureStatus("Device ID has already been assgined to other device!")))
        else if( !optFindExpert.isDefined)
          NotFound(Json.toJson(GlanceStatus.failureStatus("User ID could not be found!")))
        else if(bRet){
          //NotificationService.syncAllDataToInstances
          GlanceWebSocketActor.updateAllRegister()
          Ok(Json.toJson(GlanceStatus.successStatus("User info has been updated!")))
        }
        else
          NotAcceptable(Json.toJson(GlanceStatus.failureStatus("Failed to update user info!!")))
      }
    }
  }

  def update(expert_id: String) = Action.async(parse.json(MAX_CONTENT)) { implicit request =>
    val credential =remoteCredential
    def getBodyAsJson(body:JsValue) :JsValue ={
        var jsObj =body.as[JsObject]
        jsObj = jsObj ++ Json.obj("glanceOrgId" -> credential.glanceOrgId)
        jsObj = jsObj ++ Json.obj("glanceUserId" -> credential.glanceUserId)
        jsObj = jsObj ++ Json.obj(ComUtils.CONST_PROPERTY_ID -> expert_id)
        jsObj
    }
    def readGlanceUser_inline():RegisteredUser={
      try{
        val glanceUser = request.body.as[RegisteredUser](RegisteredUser.tolerantRegisteredUserReaders)
        return glanceUser.copy(glanceOrgId=credential.glanceOrgId,glanceUserId = credential.glanceUserId)
      }catch{
        case exp:Throwable =>
          Logger.error("Failed to parse registerUser data for adding,exception:{}",exp.getMessage)
          null
      }
    }

    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      val user  =readGlanceUser_inline()
      if (user==null || user.id == null|| user.id == "" || user.id.compareToIgnoreCase(expert_id)!=0) {
        Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid user data!")))}
      }else{
        RegisteredUser.updateAsJsonValue(getBodyAsJson(request.body)).map{ bRet =>
          getResult(bRet)
        }
      }
    }
  }

  def getAll(expert_center_id: String) = Action.async(parse.empty){ implicit request =>
    val credential =remoteCredential

    def toJsValue(user:RegisteredUser):JsValue={
      var obj =Json.toJson(user).as[JsObject]
      obj =ComUtils.removeObjectCommonProperties(obj)
      obj += (ComUtils.CONST_PROPERTY_SKILLS -> Json.toJson(user.topics))
      if(obj.keys.contains(ComUtils.CONST_PROPERTY_POSITION))
        obj ++= Json.obj(ComUtils.CONST_PROPERTY_POSITION-> ComUtils.getJsonArrayInt(List(user.position.x.toInt,user.position.y.toInt)))
      else
        obj += (ComUtils.CONST_PROPERTY_POSITION -> ComUtils.getJsonArrayInt(List(0,0)))
      obj
    }
    def getResult_inline(listUser:List[RegisteredUser]):Result ={
      if(listUser !=null && listUser.length >0)
        JsonResult(Json.obj("experts" -> Json.toJson(listUser.map((user:RegisteredUser) =>toJsValue(user)))))
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus("Update  failed")))
    }
    RegisteredUser.readAllConf(credential).map{ listUser =>
      getResult_inline(listUser)
    }
  }

  def delete(expert_id: String) = Action.async(parse.empty) { implicit request =>
    val credential =remoteCredential
    def getResult_inline(bRet:Boolean):Result={
      if(bRet ==true)
        JsonResult(Json.toJson(GlanceStatus.successStatus("Delete success")))
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus("Delete failed")))
    }
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      RegisteredUser.delete(credential,expert_id).map{ bRet =>
        getResult_inline(bRet)
      }
    }
  }

  def updateMacAddress(expertId:String,macAddress:String) =Action.async(parse.empty){implicit request =>
    val credential =remoteCredential
    def getResult_inline(bRet:Boolean):Result={
      if(bRet ==true)
        JsonResult(Json.toJson(GlanceStatus.successStatus(s"Update expert's device Id successfully for $expertId with: $macAddress")))
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus(s"Update expert's device Id failed for $expertId with:$macAddress")))
    }
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      RegisteredUser.updateMacAddress(credential,expertId,macAddress.toLowerCase).map{ bRet =>
        getResult_inline(bRet)
      }
    }
  }

  def removeMacAddress(expertId:String) =Action.async(parse.empty){implicit request =>
    val credential =remoteCredential
    def getResult_inline(bRet:Boolean):Result={
      if(bRet ==true)
        JsonResult(Json.toJson(GlanceStatus.successStatus(s"Remove expert's device Id successfully for $expertId")))
      else
        NotFound(Json.toJson(GlanceStatus.failureStatus(s"Remove expert's device Id failed for $expertId")))
    }
    if(!isAdminLoggedIn){
      Future{Unauthorized(Json.toJson(GlanceStatus.failureStatus(ComUtils.UNAUTHORIZED_MSG)))}
    }else{
      RegisteredUser.updateMacAddress(credential,expertId,"").map{ bRet =>
        getResult_inline(bRet)
      }
    }
  }

  def readExpertById(expertId: String)= Action.async{implicit request =>
    val credential =remoteCredential
    RegisteredUser.readUserByUserId(credential,expertId).map{expert =>
      if(expert.isDefined){
        Ok({
          var obj = Json.toJson(expert.get).as[JsObject]
          obj = ComUtils.removeObjectCommonProperties(obj)
          obj
        })
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("Not found!")))
      }
    }
  }

  def readExpertByName(expertName:String)=Action.async {implicit request =>
    val credential =remoteCredential
    RegisteredUser.readUserByName(credential,expertName).map{ experts =>
      if(experts.length>0){
        Ok(Json.obj("total"-> experts.length,"users"->ComUtils.getJsonArrayExpert(experts)))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("Not found!")))
      }
    }
  }

  def readCurrentActiveUsers(credential:GlanceCredential):Future[List[RegisteredUser]]={
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
    }yield {
      GlanceWebSocketActor.getAllJoins(campusInfo)
    }
  }

  def readExpertByLike(expertName:String)=Action.async {implicit request =>
    val credential =remoteCredential
    RegisteredUser.readUserByLike(credential,expertName).map {experts=>
      if(experts.length>0){
        Ok(Json.obj("total"-> experts.length,"users"->ComUtils.getJsonArrayExpert(experts)))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("Not found!")))
      }
    }
  }

  def readActiveExpertByLike(expertName:String)=Action.async {implicit request =>
    val credential =remoteCredential
    for{
      experts <-readCurrentActiveUsers(credential)
      zones <-GlanceZone.readAllConf(credential)
    }yield {
      val matchedUsers =experts.filter( p => (p.name.toLowerCase.contains(expertName.toLowerCase) && expertName!=""))
      if(matchedUsers.length>0){
        NotificationService.sendHighLightCmd(matchedUsers.map(p => p.id),credential)
        Ok(Json.obj("total"-> matchedUsers.length,"users"->ComUtils.getJsonArrayExpertWithZones(matchedUsers,expertsInZones(matchedUsers,zones))))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("Not found!")))
      }
    }
  }

  def readActiveExpertByName(expertName:String)=Action.async {implicit request =>
    val credential =remoteCredential
    for{
      experts <-readCurrentActiveUsers(credential)
      zones <-GlanceZone.readAllConf(credential)
    }yield {
      val matchedUsers =experts.filter( p => (p.name.compareToIgnoreCase(expertName)==0 && expertName!=""))
      if(matchedUsers.length>0){
        NotificationService.sendHighLightCmd(matchedUsers.map(p => p.id),credential)
        Ok(Json.obj("total"-> matchedUsers.length,"users"->ComUtils.getJsonArrayExpertWithZones(matchedUsers,expertsInZones(experts,zones))))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("Not found!")))
      }
    }
  }

  def expertsInZones(experts:List[RegisteredUser],zones:List[GlanceZone]):mutable.HashMap[String,List[GlanceZone]]={
    val zoneMap:mutable.HashMap[String,List[GlanceZone]]=new mutable.HashMap[String,List[GlanceZone]]()

    experts.foreach{ expert =>
      val inZones:mutable.MutableList[GlanceZone]=new mutable.MutableList[GlanceZone]()
      zones.foreach{ zone =>
        if(Visitor.expertInPolygonAreaOrPointOrLineFoZone(zone,expert))
          inZones+= zone
      }
      zoneMap(expert.id)=inZones.toList
    }
    zoneMap
  }

  def readActiveExpertById(expertId:String)=Action.async {implicit request =>
    val credential =remoteCredential
    for{
      experts <-readCurrentActiveUsers(credential)
      zones <-GlanceZone.readAllConf(credential)
    }yield {
      if(ComUtils.isAll(expertId)==true)
        Ok(Json.obj("total"-> experts.length,"users"->ComUtils.getJsonArrayExpertWithZones(experts,expertsInZones(experts,zones))))
      else{
        val matchedUsers =experts.filter( p => (p.id==expertId && expertId!=""))
        if(matchedUsers.length>0){
          NotificationService.sendHighLightCmd(matchedUsers.map(p => p.id),credential)
          Ok(Json.obj("total"-> matchedUsers.length,"users"->ComUtils.getJsonArrayExpertWithZones(matchedUsers,expertsInZones(experts,zones))))
        }else{
          NotFound(Json.toJson(GlanceStatus.failureStatus("No user has!")))
        }
      }
    }
  }

  def readAllActiveUsers()=Action.async {implicit request =>
    val credential =remoteCredential
    for{
      experts <-readCurrentActiveUsers(credential)
      zones <-GlanceZone.readAllConf(credential)
    }yield {
      if(experts.length>0){
        Ok(Json.obj("total"-> experts.length,"users"->ComUtils.getJsonArrayExpertWithZones(experts,expertsInZones(experts,zones))))
      }else{
        NotFound(Json.toJson(GlanceStatus.failureStatus("No active user has been found!")))
      }
    }
  }
}