package controllers.glance.console

import java.io.{FileInputStream, File}
import com.sksamuel.scrimage.Image
import com.sksamuel.scrimage.nio.JpegWriter
//import com.wordnik.swagger.annotations._
import controllers.amqp.GlanceSyncCache
import play.api.libs.Files.TemporaryFile
import services.security.GlanceCredential

//import controllers.glance.GlanceWebSocketActor
import controllers.glance.GlanceWebSocketActor.GlanceWebOpMapActor
import models.cmx.MapCoordinate
import models.common.GlanceStatus
import models.glance._
import org.apache.commons.io.FileUtils
import play.Logger
//import play.api.libs.iteratee.Enumerator
import play.api.libs.json._
import controllers.security.Guard
import play.api.mvc._
import akka.actor.{Props, Actor, actorRef2Scala}
//import akka.pattern.ask
//import play.api.Play.current
import play.api.libs.concurrent.Akka
//import akka.util.Timeout
import play.mvc.Http.MultipartFormData
import reactivemongo.api.gridfs.DefaultFileToSave
import reactivemongo.bson.BSONObjectID
import services.cisco.notification.NotificationService
import services.cisco.poi.GlanceXLSXParser
//import services.cisco.zip.ZipUtils
//import services.security.GlanceCredential
import utils.ComUtils
import scala.Some
import scala.concurrent.{Promise, Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
//import scala.reflect.io.Path
//import scala.util.{Try, Success}
import scala.collection.mutable.HashMap
import scala.collection.JavaConverters._

/**
 * Created by kennych on 11/4/15.
 */

//@Api(value="/api/v1", description = "Glance APIs",basePath = "/api/v1",consumes = "application/json",
//  produces = "application/json")
object Backup extends Controller with Guard {

  val CONST_COL_FIRST_NAME = "First Name"
  val CONST_COL_LAST_NAME = "Last Name"
  val CONST_COL_PHONE = "Phone"
  val CONST_COL_EMAIL = "Email"
  val CONST_COL_TITILE = "Title"
  val CONST_COL_TOPICS = "Topics"
  val CONST_COL_BIO = "Bio"
  val CONST_COL_CATEGORY = "Category"
  val CONST_COL_MAC_ADDRRESS = "MAC Address"
  val CONST_COL_ISE_INTEGRATED = "ISE Integrated"
  val CONST_COL_PHOTO = "Photo"
  val CONST_COL_POSITION = "position"
  val CONST_COL_DEVICEID = "DeviceId"
  val CONST_COL_EMPLOYEE_NAME = "Employee Name"

  //apache poi

  val userRecordHeaders: List[String] = List(CONST_COL_FIRST_NAME,
    CONST_COL_LAST_NAME,
    CONST_COL_PHONE,
    CONST_COL_EMAIL,
    CONST_COL_TITILE,
    CONST_COL_TOPICS,
    CONST_COL_BIO,
    CONST_COL_CATEGORY,
    CONST_COL_MAC_ADDRRESS,
    CONST_COL_ISE_INTEGRATED,
    CONST_COL_PHOTO,
    CONST_COL_POSITION)

  private def appendTotalAndUpdatedToResult(urlToAppend: String, total: Long = 0, updated: Long = 0, nStatusCode: Int = 200): String = {
    import io.lemonlabs.uri.Url
    val uri = Url.parse(urlToAppend)
    val outUrl = uri.replaceParams("result", "" + nStatusCode + "," + total + "," + updated)
    return outUrl.toString
  }

  private def getBoolOption(testValue: Option[Seq[String]]): Boolean = {
    try {
      val testStr = testValue match {
        case Some(seqString: Seq[String]) =>
          seqString.head
        case _ =>
          "false"
      }
      import scala.util.Try
      Try(testStr.toBoolean).getOrElse(false)
    } catch {
      case ex: Throwable =>
        Logger.error("Reading value option, exception:{}", ex.getMessage)
        false
    }
  }

  private def buildHeaderInfo(listHeaders: List[String], tmpHeaders: List[String]): HashMap[String, Int] = {
    val headerMap: HashMap[String, Int] = new HashMap()
    for (nSearch <- 0 to (tmpHeaders.length - 1)) {
      headerMap(tmpHeaders(nSearch)) = -1
    }
    for (nColumn <- 0 to (listHeaders.length - 1)) {
      val value = listHeaders(nColumn)
      Logger.debug("Header Value:" + value)
      for (nSearch <- 0 to (tmpHeaders.length - 1)) {
        if (value.toUpperCase.contains(tmpHeaders(nSearch).toUpperCase)) {
          Logger.debug("Header Value:" + value + " IndexOf:" + tmpHeaders(nSearch) + " index:" + nSearch)
          headerMap(tmpHeaders(nSearch)) = nColumn
        }
      }
    }
    headerMap
  }

  private def getUserDataFile(userDataFile: scala.Option[play.api.mvc.MultipartFormData.FilePart[TemporaryFile]]): File = {
    userDataFile match {
      case Some(datafile) =>
        datafile.ref.file
      case _ =>
        null
    }
  }

  private def getIndexValue(optIndex: Option[Int]): Int = {
    optIndex match {
      case Some(nIndex) =>
        nIndex
      case _ =>
        -1
    }
  }

  private def getValueOfItem(valueName: String, listValues: List[String], headerMap: HashMap[String, Int]): String = {
    val nIndex = getIndexValue(headerMap.get(valueName))
    if (nIndex == -1)
      return ""
    if (nIndex >= listValues.length)
      return ""

    try {
      val ret = listValues(nIndex).asInstanceOf[String]
      if (ret == null)
        ""
      else
        ret.trim
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to get value of:" + valueName + " exception:" + exp.getMessage)
        ""
    }
  }

  private def parseIntString(intStr: String): Int = {
    try {
      Logger.info("ISE Integrated option:{}", intStr)
      return intStr.toDouble.toInt
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to parse ISE Integrated Flag value:{}, Exception:{}", intStr, exp.getMessage)
        return 0
    }
  }

  private def parsePosition(strPosition: String): GlancePosition = {
    def trimquota(strVal: String): String = {
      var retVal = strVal
      if (strVal.endsWith("\""))
        retVal = retVal.dropRight(1)
      if (strVal.startsWith("\""))
        retVal = retVal.drop(1)
      retVal
    }
    try {
      //position info like: 20,30,floor1,building1,campus1
      val listPos = strPosition.split(",").toList
      val x: Long = {
        if (listPos.length > 0)
          listPos(0).toLong
        else
          0
      }
      val y: Long = {
        if (listPos.length > 1)
          listPos(1).toLong
        else
          0
      }

      val floorId: String = {
        if (listPos.length > 2)
          trimquota(listPos(2))
        else
          ""
      }
      val buildingId: String = {
        if (listPos.length > 3)
          trimquota(listPos(3))
        else
          ""
      }

      val campusId: String = {
        if (listPos.length > 4)
          trimquota(listPos(4))
        else
          ""
      }
      new GlancePosition(x, y, floorId, buildingId, campusId)
    } catch {
      case exp: Throwable =>
        new GlancePosition(0, 0)
    }
  }

  private def checkUserRecordsRequiredColumns(headerMap: HashMap[String, Int]): Boolean = {
    var bOK: Boolean = true
    val mandatory_columns = List(CONST_COL_FIRST_NAME, CONST_COL_LAST_NAME, CONST_COL_EMAIL)
    for (col_name <- mandatory_columns) //only first name, lastname, and email are required...
    {
      val headerIndex = headerMap.get(col_name)
      if (getIndexValue(headerIndex) == -1) {
        bOK = false
      }
    }
    bOK
  }

  private def parseUserRecordRow(listValues: List[String], headerMap: HashMap[String, Int], credential: GlanceCredential): (RegisteredUser, String, GlancePosition) = {
    val (tId, _) = ComUtils.parseEmailAddress(getValueOfItem(CONST_COL_EMAIL, listValues, headerMap))
    val tName = (getValueOfItem(CONST_COL_FIRST_NAME, listValues, headerMap) + " " + getValueOfItem(CONST_COL_LAST_NAME, listValues, headerMap)).trim()
    val tEmail = getValueOfItem(CONST_COL_EMAIL, listValues, headerMap)
    val tPhoneNumber = getValueOfItem(CONST_COL_PHONE, listValues, headerMap)
    val tTitle = getValueOfItem(CONST_COL_TITILE, listValues, headerMap)
    val tTopics = getValueOfItem(CONST_COL_TOPICS, listValues, headerMap).split(",").toList
    val tBio = getValueOfItem(CONST_COL_BIO, listValues, headerMap)
    var tCategory = getValueOfItem(CONST_COL_CATEGORY, listValues, headerMap)
    if (tCategory == "") tCategory = ComUtils.SMART_DEVICE_TYPE_EXPERT
    val tMacAddress = getValueOfItem(CONST_COL_MAC_ADDRRESS, listValues, headerMap).toLowerCase
    val tPhotoUrl = getValueOfItem(CONST_COL_PHONE, listValues, headerMap)
    val tPosition = getValueOfItem(ComUtils.CONST_PROPERTY_POSITION, listValues, headerMap)
    val tISEIntegrated = getValueOfItem(CONST_COL_ISE_INTEGRATED, listValues, headerMap)

    if (tId == "" || tName == "" /* || tPhoneNumber==""*/ || tEmail == "") {
      throw new Exception("Incorrect import row data!")
    } else {
      val user = RegisteredUser(glanceOrgId = credential.glanceOrgId,
        glanceUserId = credential.glanceUserId,
        id = tId,
        name = tName,
        phoneNumber = tPhoneNumber,
        email = tEmail,
        title = tTitle,
        topics = tTopics,
        bio = tBio,
        category = tCategory,
        macAddress = {
          val mac_address_list = tMacAddress.split(";").filter(p => p != "").toList
          mac_address_list
        },
        supportISE = parseIntString(tISEIntegrated),
        avatarUrl = tPhotoUrl)
      Logger.info("Register User:" + Json.toJson(user).toString())
      (user, tPhotoUrl, parsePosition(tPosition))
    }
  }


//  @ApiOperation(
//    nickname = "backup",
//    value = "System backup and restore",
//    notes = "System backup and restore",
//    httpMethod = "POST",
//    consumes = "application/json",
//    produces = "application/json")
//  @ApiImplicitParams(Array(
//    new ApiImplicitParam(value = "System backup and restore", name = "data", required = true, dataType = "application/json", paramType = "body")))
//  @ApiResponses(Array(
//    new ApiResponse(code = 200, message = "Success"),
//    new ApiResponse(code = 400, message = "Bad Request"),
//    new ApiResponse(code = 500, message = "Internal error")))
  def restore() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = getStringValueOfMultiformData(request.body.dataParts.get("url"))
    //Only admin can trigger this action
    def handle_records_upload(): Result = {
      if (!isAdminLoggedIn(request)) {
        return Redirect(appendTotalAndUpdatedToResult(redirectUrl, 0, 0, 401), 302)
      } else if (redirectUrl.trim() == "") {
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("No redirect url")))
      }
      val bTestData = getBoolOption(request.body.dataParts.get("test"))
      Logger.debug("RedirectUrl" + redirectUrl)
      val data_file: File = getUserDataFile(request.body.file("data"))
      if (data_file == null) {
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("No data file")))
      }
      val list = GlanceXLSXParser.readXLSXFile(data_file).asScala.toList
      if (list.length <= 1) {
        return Redirect(appendTotalAndUpdatedToResult(redirectUrl, 0, 0, 400), 302)
      }
      var headerMap: HashMap[String, Int] = new HashMap()
      val listHeaders = list(0).asScala.toList
      //check the headers...
      headerMap = buildHeaderInfo(listHeaders, userRecordHeaders)
      if (!checkUserRecordsRequiredColumns(headerMap)) {
        //redirect with error code 400(bad request) to show error message.
        return Redirect(appendTotalAndUpdatedToResult(redirectUrl, 0, 0, 400), 302)
      }
      val glanceWebOpActor = ComUtils.system.actorOf(Props(new GlanceWebOpMapActor))
      var userList = scala.collection.mutable.MutableList[RegisteredUser]()
      var nRecord: Long = 0
      //skip header row
      for (nRow: Int <- 1 to (list.length - 1)) {
        try {
          val (user, photoUrl, pos) = parseUserRecordRow(list(nRow).asScala.toList, headerMap, credential)
          if (bTestData)
            userList += user
          else
            RegisteredUser.ImportUser(user, photoUrl, pos, glanceWebOpActor)
          nRecord = nRecord + 1
        } catch {
          case e: Throwable =>
            Logger.error("Failed to add import row data:{}", e.getMessage())
        }
      }
      if (bTestData) {
        return Ok(Json.toJson(ComUtils.getJsonArrayExpert(userList.toList)))
      }
      else {
        return Redirect(appendTotalAndUpdatedToResult(redirectUrl, list.length - 1, nRecord, 200), 302)
      }
    }

    Future {
      val result = handle_records_upload()
      result
    }
  }

  private def getPositionStr(userRecord: RegisteredUser, trackFloors: List[GlanceTrackFloor]): String = {
    if (userRecord.fixedLocation) {
      val matchFloors = trackFloors.filter(pf => pf.floorId.compareTo(userRecord.position.floorId) == 0 && pf.floorId != "")
      if (matchFloors.length > 0) {
        val (_, posArr) = NotificationService.reversePositionArr(new MapCoordinate(userRecord.position.x, userRecord.position.y), matchFloors(0))
        posArr(0) + "," + posArr(1) + "," + matchFloors(0).floorName
      }
      else {
        val (_, posArr) = NotificationService.reversePositionArr(new MapCoordinate(userRecord.position.x, userRecord.position.y), null)
        posArr(0) + "," + posArr(1) + ", "
      }
    } else
      ""
  }

  private def getFirstAndLastName(name: String): (String, String) = {
    val arr = name.split(" ")
    val (firstName: String, lastName: String) = {
      if (arr.length > 1) {
        val lName: String = arr(arr.length - 1)
        val fName: String = {
          var xName = ""
          for (cly <- 0 to arr.length - 2) {
            xName = xName + arr(cly)
            if (cly < arr.length - 2)
              xName = xName + " "
          }
          xName
        }
        (fName, lName)
      } else {
        (name, "")
      }
    }
    (firstName, lastName)
  }

  def backup() = Action.async { implicit request =>
    val credential = remoteCredential
    for {
      allUsers <- RegisteredUser.readAllConf(credential)
      trackFloors <- GlanceTrackFloor.readAll(credential)
    } yield {
      val tempFileName = "GlanceBackup_" + ComUtils.getDayString() + "_" + System.currentTimeMillis() + ".xlsx"
      val fullPath = FileUtils.getTempDirectoryPath + "/" + tempFileName
      val columns: List[String] = List(CONST_COL_FIRST_NAME, CONST_COL_LAST_NAME, CONST_COL_EMPLOYEE_NAME, CONST_COL_EMAIL, CONST_COL_TOPICS, CONST_COL_PHONE, CONST_COL_TITILE, CONST_COL_BIO, CONST_COL_CATEGORY, CONST_COL_MAC_ADDRRESS, CONST_COL_POSITION, CONST_COL_PHOTO)
      val values: List[List[String]] = allUsers.map(p => {
        val (firstName: String, lastName: String) = getFirstAndLastName(p.name)
        val position_str: String = getPositionStr(p, trackFloors)
        List(firstName, lastName, p.name, p.email, p.topics.mkString(","), p.phoneNumber, p.title, p.bio, p.category, p.macAddress.mkString(";"), position_str, p.avatarUrl)
      }
      )
      import scala.collection.JavaConverters._
      try {
        GlanceXLSXParser.WriteUserData(fullPath, columns.asJava, values.map(p => p.asJava).asJava)
        val contentFile = new File(fullPath)
        Ok.sendFile(content = contentFile,
          fileName = _ => tempFileName, onClose = () => {
            try {
              FileUtils.forceDelete(contentFile)
            } catch {
              case exp: Throwable =>
                Logger.error("Failed to delete the temp file:{}", fullPath)
            }
          })
      } catch {
        case exp: Throwable =>
          Logger.error("Failed to write temp file:{},error:{}", fullPath, exp.getMessage())
          NotFound(Json.toJson(GlanceStatus.failureStatus("Failed to export all registered user data!")))
      }
    }
  }

  private def getStringValueOfMultiformData(url: Option[Seq[String]]): String = {
    url match {
      case Some(seqString: Seq[String]) =>
        seqString.head
      case _ =>
        ""
    }
  }

  private def getIndexOfHeader(headers: List[String], findName: String): Int = {
    if (headers.length <= 0)
      return -1
    val tmpName = findName.toLowerCase()
    for (cl <- 0 to headers.length - 1) {
      if (headers(cl).toLowerCase.contains(tmpName))
        return cl
    }
    return -1
  }

  private def getValueOfIndex(nIndex: Int, listValues: List[String]): String = {
    if (nIndex >= listValues.length)
      return ""
    try {
      val ret = listValues(nIndex).asInstanceOf[String]
      if (ret == null)
        ""
      else
        ret.trim
    } catch {
      case exp: Throwable =>
        Logger.error("Failed to get value of: ${nIndex}, exception:{}", exp.getMessage())
        ""
    }
  }

  def uploadDeviceAliasFile() = Action.async(parse.multipartFormData) { implicit request =>
    val credential = remoteCredential
    val redirectUrl = getStringValueOfMultiformData(request.body.dataParts.get("url"))
    //add the function to make return break when it needs
    def handle_device_alias_upload():Result = {
      if (!isAdminLoggedIn) {
        return Unauthorized(Json.toJson(GlanceStatus.failureStatus("You are not authorized for this action!")))
      }
      if (redirectUrl.trim() == "") {
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("No redirect URL")))
      }
      Logger.debug("RedirectUrl:{}", redirectUrl)
      val data_file: File = getUserDataFile(request.body.file("image"))
      if (data_file == null) {
        return Redirect(redirectUrl + "?nofile=true" + 0, 301)
      }
      val list =GlanceXLSXParser.readXLSXFile(data_file).asScala.toList
      if (list.length <= 1) {
        return Redirect(redirectUrl + "?success=0", 301)
      }
      //var headerMap:HashMap[String,Int] =new HashMap()
      val listHeaders = list(0).asScala.toList
      val aliasIdIndex = getIndexOfHeader(listHeaders, CONST_COL_DEVICEID)
      val aliasMacAddressIndex = getIndexOfHeader(listHeaders, CONST_COL_MAC_ADDRRESS)
      if (aliasIdIndex == -1 || aliasMacAddressIndex == -1 || aliasMacAddressIndex == aliasIdIndex) {
        return BadRequest(Json.toJson(GlanceStatus.failureStatus("Invalid excel data format,column with no: DeviceId, Mac Address")))
      }

      val p = Promise[Long]
      val f = p.future
      val completed = new java.util.concurrent.atomic.AtomicLong()
      val Succeeded = new java.util.concurrent.atomic.AtomicLong()
      for (nRow <- 1 to list.length - 1) {
        try {
          val rowColumns = list(nRow).asScala.toList
          val tmpAlias = getValueOfIndex(aliasIdIndex, rowColumns)
          val tmpMacAddress = getValueOfIndex(aliasMacAddressIndex, rowColumns)
          if (tmpAlias != "" && tmpMacAddress != "") {
            GlanceDeviceAlias.addOrUpdate(credential, new GlanceDeviceAlias(glanceOrgId = credential.glanceOrgId, id = tmpAlias, macAddress = tmpMacAddress), false).map { bRet =>
              if (bRet)
                Succeeded.incrementAndGet()
              val nCount = completed.incrementAndGet()
              if (nCount >= list.length - 1)
                p.success(Succeeded.get())
            }
          } else {
            val nCount = completed.incrementAndGet()
            if (nCount >= list.length - 1)
              p.success(Succeeded.get())
          }
        } catch {
          case ex: Throwable =>
            Logger.error("Failed to parse,exception:{}", ex.getMessage)
            val nCount = completed.incrementAndGet()
            if (nCount >= list.length - 1)
              p.success(Succeeded.get())
        }
      }
      val nRet = Await.result(f, Duration.Inf)
      if (nRet > 0) {
        GlanceSyncCache.setGlanceCache[List[GlanceDeviceAlias]](GlanceDeviceAlias.CACHE_NAME,null)
        GlanceDeviceAlias.sendCacheSyncMessage(credential)
      }
      return Redirect(redirectUrl + "?success=" + nRet, 301)
    }

    Future {
      handle_device_alias_upload()
    }
  }

}
