package controllers.glance

import java.io.{FileWriter, BufferedWriter, File}
import controllers.amqp.{GlanceSyncCache, GlanceMemcached}
import models.cmx.MapCoordinate
import models.common.GlanceStatus
import models.glance._
import controllers.security.Guard
import play.Logger
import play.api.libs.json._
import play.api.mvc.{Action, Controller}
import services.cisco.indoor.CMXVisitorScan
import services.security.GlanceCredential
import utils.{ComUtils, JsonResult}
import scala.collection.mutable
import scala.collection.mutable.ListBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{Promise, Future}
import scala.concurrent.duration._
import java.awt.Polygon


/**
 * Created by kennych on 11/5/15.
 */

case class GlanceLoc(lat: Double, long: Double)

object Visitor extends Controller with Guard {
  val CONST_DIVISIONNUMBER=20
  val hourList = List( "00:00 - 00:59 AM",
                      "01:00 - 01:59 AM",
                      "02:00 - 02:59 AM",
                      "03:00 - 03:59 AM",
                      "04:00 - 04:59 AM",
                      "05:00 - 05:59 AM",
                      "06:00 - 06:59 AM",
                      "07:00 - 07:59 AM",
                      "08:00 - 08:59 AM",
                      "09:00 - 09:59 AM",
                      "10:00 - 10:59 AM",
                      "11:00 - 11:59 AM",
                      "12:00 - 12:59 PM",
                      "13:00 - 13:59 PM",
                      "14:00 - 14:59 PM",
                      "15:00 - 15:59 PM",
                      "16:00 - 16:59 PM",
                      "17:00 - 17:59 PM",
                      "18:00 - 18:59 PM",
                      "19:00 - 19:59 PM",
                      "20:00 - 20:59 PM",
                      "21:00 - 21:59 PM",
                      "22:00 - 22:59 PM",
                      "23:00 - 23:59 PM")

  def count() = Action.async { implicit request =>
    val credential =remoteCredential
    def getVisitorCount(guestCount:Int): JsObject =
    {
        var obj =Json.obj();
        obj +=("guestCount", Json.toJson(guestCount))
        obj
    }
    GlanceVisitor.guestCount(credential,"","").map{ guestCount =>
      Ok(Json.toJson(getVisitorCount(guestCount)))
    }
  }

  def getVisitorsFromCache():List[GlanceVisitor]= {
    val optCacheVisitors = GlanceSyncCache.getGlanceCache[List[GlanceVisitor]](CMXVisitorScan.CACHE_NAME_CMX)
    val list:List[GlanceVisitor]= List()
    if (optCacheVisitors.isEmpty) {
      Logger.info("Failed to read visitor list from local cache, none.")
      return list
    }
    return optCacheVisitors.get
  }

  def getAllActiveDevices(credential:GlanceCredential):Future[List[GlanceVisitor]]={
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
      mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
      campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
      experts <- Future{GlanceWebSocketActor.getAllJoins(campusInfo)}
      cacheVisitors <-  Future{getVisitorsFromCache}
      nLock <-   GlanceMemcached.memcachedWriteLock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
      visitors <-{
        if(nLock>1)
          Future{List()}
        else
          GlanceVisitor.heatmapOfVisitors("all",credential)
      }
      allIPMappingVisitors <- GlanceAssociationIPMacAddress.readAsVisitors(credential,floors,mapSizes) //all cached list from meraki...
      unLock <-   GlanceMemcached.memcachedWriteUnlock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
    }yield {
      val trackedGlanceList = experts.map(p => convertRegisterUserToVisitor(p, sysConf)).flatten
      val allVisitors = ComUtils.distinctBy(trackedGlanceList ::: cacheVisitors ::: visitors ::: allIPMappingVisitors)(_.guestMacAddress)
      allVisitors
    }
  }

  def activeDevicesCount() = Action.async { implicit request =>
    val credential =remoteCredential
    getAllActiveDevices(credential).map{ allVisitors =>
      Ok(Json.obj(ComUtils.CONST_PROPERTY_GUESTCOUNT -> allVisitors.length))
    }
  }

  def activeDevicesCountByZones() = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
      mapSize <- GlanceMapSizeInfo.readByFloors(credential, floors)
      zones <- GlanceZone.readAllConfByFloors(credential.glanceOrgId, "", floors.toList)
      allVisitors <- getAllActiveDevices(credential)
    }yield {
      var heatMapObj=Json.obj()
      var heatMapRet=Json.obj()
      var returnObj=Json.obj()
      for (floor <- zones.keySet) {
        val matchInfos = mapSize.filter(p => p.mapName == floor.mapName)
        if (matchInfos.length > 0) {
          val zonesInFloor = zones(floor)
          for (zone <- zonesInFloor) {
            var floorsObject: (String, String, List[GlanceVisitor], String) = ("", "", List(), "")
            floorsObject = (zone.zoneId, zone.zoneDisplayName, visitorsInPolygonAreaOrPointOrLine(floor, covertMapcoordinateToList(zone.zone.zoneCoordinate), allVisitors), zone.zoneName)
            val bShowLabel:Boolean= (floorsObject._3.length >= sysConf.zoneCountThreshold)
            heatMapObj +=(floorsObject._1, Json.obj(ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> floorsObject._2,ComUtils.CONST_PROPERTY_ZONECOUNT -> floorsObject._3.length,ComUtils.CONST_PROPERTY_ID -> zone.zoneId,ComUtils.CONST_PROPERTY_TEMPORARY -> JsBoolean(zone.temporary),ComUtils.CONST_PROPERTY_SHOWLABEL ->JsBoolean(bShowLabel)))
          }
          heatMapRet += (floor.floorId, heatMapObj)
        } else {
          heatMapRet +=(floor.floorId, Json.obj()) //empty object..
        }
      }
      returnObj +=(ComUtils.CONST_PROPERTY_ZONES, heatMapRet)
      Ok(returnObj)
    }
  }

  def activeUsersByZone(zoneId:String) = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      sysConf <-GlanceSystemConf.readConf(credential)
      floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
      optZone <-GlanceZone.readConfByNameId(credential.glanceOrgId,zoneId)
      mapSizes <- GlanceMapSizeInfo.readByFloors(credential, floors)
      campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
      experts <- Future{GlanceWebSocketActor.getAllJoins(campusInfo)}
    }yield{
      var heatMapObj=Json.obj()
      if(optZone.isDefined) {
        val zone =optZone.get
        val matchedFloors =floors.filter(p=> p.floorId==zone.floorId)
        val floor = {
          if(matchedFloors.length>0)
            matchedFloors(0)
          else
            null
        }
        val zoneUsers: (List[RegisteredUser]) = {
          if(floor!=null) visitorsInPolygonAreaOrPointOrLineForRegisteredUsers(floor, covertMapcoordinateToList(zone.zone.zoneCoordinate), experts)
          else List()
        }
        val bShowLabel:Boolean = (zoneUsers.length >= sysConf.zoneCountThreshold)
        heatMapObj +=(zone.zoneId, Json.obj(ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> zone.zoneDisplayName, ComUtils.CONST_PROPERTY_ZONECOUNT -> zoneUsers.length,ComUtils.CONST_PROPERTY_ID -> zone.zoneId,ComUtils.CONST_PROPERTY_TEMPORARY ->JsBoolean(zone.temporary),ComUtils.CONST_PROPERTY_SHOWLABEL ->JsBoolean(bShowLabel),ComUtils.CONST_PROPERTY_USERS ->ComUtils.getJsonArrayExpert(zoneUsers)))
        Ok(Json.obj(ComUtils.CONST_PROPERTY_ZONES -> Json.obj(zone.floorId->heatMapObj)))
      }else
        NotFound(Json.toJson(GlanceStatus.failureStatus("No zone has been found!")))
    }
  }

  def activeUsersCountByZones() = Action.async { implicit request =>
    val credential =remoteCredential
    for{
      sysConf <- GlanceSystemConf.readConf(credential)
      floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
      mapSize <- GlanceMapSizeInfo.readByFloors(credential, floors)
      zones <- GlanceZone.readAllConfByFloors(credential.glanceOrgId, "", floors.toList)
      campusInfo <-GlanceTrackCampus.readCampusWithBuildingsWithFloors(credential,sysConf.defaultTrackingCampus)
      experts <- Future{GlanceWebSocketActor.getAllJoins(campusInfo)}
    }yield {
      var heatMapObj=Json.obj()
      var heatMapRet=Json.obj()
      var returnObj=Json.obj()
      for (floor <- zones.keySet) {
        val matchInfos = mapSize.filter(p => p.mapName == floor.mapName)
        if (matchInfos.length > 0) {
          val zonesInFloor = zones(floor)
          for (zone <- zonesInFloor) {
            var floorsObject: (String, String, List[RegisteredUser], String) = ("", "", List(), "")
            floorsObject = (zone.zoneId, zone.zoneDisplayName, visitorsInPolygonAreaOrPointOrLineForRegisteredUsers(floor, covertMapcoordinateToList(zone.zone.zoneCoordinate), experts), zone.zoneName)
            val bShowLabel:Boolean={
              if(floorsObject._3.length >= sysConf.zoneCountThreshold)
                true
              else
                false
            }
            heatMapObj +=(floorsObject._1, Json.obj("zoneDisplayName" -> floorsObject._2, "zoneCount" -> floorsObject._3.length,ComUtils.CONST_PROPERTY_ID -> zone.zoneId,"temporary"->JsBoolean(zone.temporary),"showLabel" ->JsBoolean(bShowLabel),"users"->ComUtils.getJsonArrayExpert(floorsObject._3)))
          }
          heatMapRet += (floor.floorId, heatMapObj)
        } else {
          heatMapRet +=(floor.floorId, Json.obj()) //empty object..
        }
      }
      returnObj +=("zones", heatMapRet)
      Ok(returnObj)
    }
  }

  def getVisitorsByHours(floorIdName:String="") =Action.async { implicit request =>
    val credential =remoteCredential
    def getCachedAnalyze():Future[Option[JsValue]]={
      GlanceMemcached.getGlobalMemcachedData(ComUtils.GUEST_ANALYZE_ALL_CACHE).map{ optValue =>
        val jsValue =optValue.getOrElse("")
        if(jsValue=="")
          None
        else{
          try {
            Some(Json.parse(jsValue))
          } catch {
            case ex: Throwable =>
              None
          }
        }
      }.recover{
        case _=>
          None
      }
    }
    def getDBdAnalyze():Future[JsValue] = {
      for {
        floorInfo <- {if(floorIdName=="")Future{null} else GlanceTrackFloor.readFloorInfoByIdOrName(credential.glanceOrgId,floorIdName)}
        visitingDays <-   {if(floorInfo==null) GlanceVisitor.guestVisitingDays(credential,"") else GlanceVisitor.guestVisitingDays(credential,floorInfo.floorId)}
        visitingHours <-{if(floorInfo==null) GlanceVisitor.guestAllVisitingHours(credential,"",visitingDays) else GlanceVisitor.guestAllVisitingHours(credential,floorInfo.floorId,visitingDays)}
        allDayHourCounts <- {if(floorInfo==null)GlanceVisitor.guestAllDayHoursCount(credential,"",ComUtils.filterLastWeekDays(visitingDays),visitingHours) else GlanceVisitor.guestAllDayHoursCount(credential,floorInfo.floorId,ComUtils.filterLastWeekDays(visitingDays),visitingHours)}
      } yield{
        val visitingHoursList =visitingHours.sortWith((x1,x2) => hourList.indexOf(x1)<=hourList.indexOf(x2))
        def getAllDataList(AllCountsMap: mutable.HashMap[String,mutable.HashMap[String,Int]],days:List[String],hours:List[String]):List[List[Int]] ={
          import scala.collection.mutable
          val AllCounts: mutable.MutableList[List[Int]]=new mutable.MutableList[List[Int]]()
          for(day <- days)
          {
            val counts =new mutable.MutableList[Int]()
            for(hour <- hours){
              Logger.info("Day:"+day +" hour:"+ hour + " Count:"+AllCountsMap(day)(hour))
              counts += AllCountsMap(day)(hour)
            }
            AllCounts += counts.toList
          }
          AllCounts.toList
        }

        val visitingDayHourCounts =Json.obj(ComUtils.CONST_PROPERTY_VISITINGDAYS -> ComUtils.getJsonArrayStr(visitingDays),
          ComUtils.CONST_PROPERTY_VISITINHOURS -> ComUtils.getJsonArrayStr(visitingHoursList),
          ComUtils.CONST_PROPERTY_VISITINGDAYHOURCOUNTS -> ComUtils.getJsonArrayValue(getAllDataList(allDayHourCounts,visitingDays,visitingHours).map( f => ComUtils.getJsonArrayInt(f))))
        GlanceMemcached.setGlobalMemcachedData(ComUtils.GUEST_ANALYZE_ALL_CACHE,visitingDayHourCounts.toString(),1.minute)
        visitingDayHourCounts
      }
    }
    for{
      visitingDayHourCountsCache <-getCachedAnalyze()
      visitingDayHourCounts <- {
        if (visitingDayHourCountsCache.isEmpty) {
          Logger.info("Read Analyze data from live data!")
          getDBdAnalyze()
        }
        else
          Future {
            Logger.info("Use cached analyze data.")
            visitingDayHourCountsCache.get
          }
      }
    }yield{
      Ok(visitingDayHourCounts)
    }
  }

  def readIPMappingAsVisitors()= Action.async{ implicit request =>
    val credential =remoteCredential
    for{
      floors <- GlanceTrackFloor.readAll(credential)
      mapSizes <-GlanceMapSizeInfo.readAllConf(credential)
      visitors <-GlanceAssociationIPMacAddress.readAsVisitors(credential, floors,mapSizes)
    }yield {
      Ok(ComUtils.getJsonArray(visitors.map(p => ComUtils.removeObjectCommonProperties(Json.toJson(p).as[JsObject]))))
    }
  }

  def convertRegisterUserToVisitor(user:RegisteredUser,sysConf:GlanceSystemConf):List[GlanceVisitor] ={
    val results:mutable.MutableList[GlanceVisitor]=new mutable.MutableList[GlanceVisitor]()
    for(macAddress <- user.macAddress){ //user.macAddress is a list of Mac Address
      new GlanceVisitor(glanceOrgId = user.glanceOrgId,floorId = user.position.floorId,visitingDay = ComUtils.getDayStringFromCMXDate("",sysConf.defaultTimeZone),
        visitingHour = ComUtils.getHourStringFromCMXDate("",sysConf.defaultTimeZone),visitingMinute = ComUtils.getMinuteStringFromCMXDate("",sysConf.defaultTimeZone),
        guestMacAddress = macAddress,activeTime = System.currentTimeMillis()
      )
    }
    results.toList
  }

  private def appendTrackedPeopleAndThing(credential:GlanceCredential,
                                          cate:String,
                                          visitors:List[GlanceVisitor],
                                          sysConf:GlanceSystemConf,
                                          lock:Long,
                                          cacheVisitors:List[GlanceVisitor]):List[GlanceVisitor]={
    var retVisitors:List[GlanceVisitor]=List()
    if(lock>1){
      retVisitors = cacheVisitors ::: visitors
    }else{
      retVisitors = visitors
    }
    retVisitors = ComUtils.distinctBy(retVisitors)(_.guestMacAddress)

    val tempMobiles =GlanceWebSocketActor.getAllTempMobiles(credential)
    val allActives = GlanceWebSocketActor.getAllActiveExperts()

    if(ComUtils.isAll(cate)){
      val trackedAddress =allActives.map(p => p.macAddress) ::: tempMobiles.map(p=> p.macAddress)
      val unTrackedGlanceList = retVisitors.filter(p => !(trackedAddress.indexOf(p.guestMacAddress)>=0))
      val trackedGlanceList = allActives.map(p => convertRegisterUserToVisitor(p,sysConf)).flatten ::: tempMobiles.map(p => convertRegisterUserToVisitor(p,sysConf)).flatten
      retVisitors = unTrackedGlanceList ::: trackedGlanceList

    }else if(ComUtils.isTmp(cate))
    {
      //append tracked people only
      def filteredPeople(users:List[RegisteredUser]):List[RegisteredUser]={
        users.filter(p => (ComUtils.isTmp(p.category)))
      }
      retVisitors = filteredPeople(tempMobiles).map(tmp => convertRegisterUserToVisitor(tmp,sysConf)).flatten
    }else if(ComUtils.isPeople(cate))
    {
      //append tracked people only
      def filteredPeople(users:List[RegisteredUser]):List[RegisteredUser]={
        users.filter(p => (ComUtils.isPeople(p.category)))
      }
      retVisitors = filteredPeople(allActives).map(tmp => convertRegisterUserToVisitor(tmp,sysConf)).flatten
    }else if(ComUtils.isDevice(cate)){
      //append thing object
      def filteredThing(users:List[RegisteredUser]):List[RegisteredUser]={
        users.filter(p => (ComUtils.isDevice(p.category)))
      }
      retVisitors = filteredThing(allActives).map(tmp => convertRegisterUserToVisitor(tmp,sysConf)).flatten
    }else if(ComUtils.isUntracked(cate))
    {
      val trackedMacs =allActives.map(p => p.macAddress) ::: tempMobiles.map(p=> p.macAddress)
      retVisitors.filter( p => !(trackedMacs.indexOf(p.guestMacAddress)>=0))
    }
    val combinedAll =ComUtils.distinctBy(retVisitors)(_.guestMacAddress)
    Logger.debug("All Combined Visitors:"+ComUtils.getJsonArray(combinedAll.map(p => Json.toJson(p).as[JsObject])))
    combinedAll
  }

  def getHeatmapOfVisitors(category:String="all",polygonArea:List[List[Double]]=List()) = Action.async { implicit request =>
    val credential=remoteCredential
    val gridWidth:Double=remoteQueryDouble(request,ComUtils.CONST_PARAMETER_GRIDWIDTH,0.0)
    val gridHeight:Double=remoteQueryDouble(request,ComUtils.CONST_PARAMETER_GRIDHEIGHT,0.0)
    val rowCount:Int=remoteQueryInt(request,ComUtils.CONST_PARAMETER_ROWCOUNT,0)
    val columnCount:Int=remoteQueryInt(request,ComUtils.CONST_PARAMETER_COLUMNCOUNT,0)
    val debugMode:Int=remoteQueryInt(request,ComUtils.CONST_PARAMETER_DEBUG,0)
    val buildingId = remoteQueryString(request,ComUtils.CONST_PROPERTY_BUILDINGID,"")
    val floorId = remoteQueryString(request,ComUtils.CONST_PROPERTY_FLOORID,"")

    def createPositionJSONObject(position:JsValue,count:Int,macAndPosition:String,debug:Int):JsObject={
      if(1 == debug)
        Json.obj(ComUtils.CONST_PROPERTY_POSITION->position,ComUtils.CONST_PROPERTY_COUNT ->count,ComUtils.CONST_PROPERTY_MACANDPOSITION -> macAndPosition)
      else
        Json.obj(ComUtils.CONST_PROPERTY_POSITION->position,ComUtils.CONST_PROPERTY_COUNT ->count)
    }
    def getHeatmapArray(floor:GlanceTrackFloor,mapSizeInfo:GlanceMapSizeInfo, visitors:List[GlanceVisitor],gridWidth:Double=0.0,gridHeight:Double=0.0,rowCount:Int=0,columnCount:Int=0):(Double,Double,List[List[JsValue]],Int) =
    {
      val filteredVisitors =visitors.filter(p => p.floorId ==floor.floorId)
      var xDivisionNumber:Int =0;
      var yDivisionNumber:Int =0;
      var xStep:Double =0.0
      var yStep:Double =0.0

      if(rowCount >0 && columnCount>0){ //base on row and column to count
        xDivisionNumber = columnCount
        yDivisionNumber = rowCount
        xStep=math.ceil(mapSizeInfo.width/columnCount).toInt
        yStep=math.ceil(mapSizeInfo.height/rowCount).toInt
      }else if(gridWidth >0 && gridHeight>0){//base on girdWidth and girdHeight to count
        xDivisionNumber = math.ceil(mapSizeInfo.width/gridWidth).toInt
        yDivisionNumber = math.ceil(mapSizeInfo.height/gridHeight).toInt
        xStep=gridWidth
        yStep=gridHeight
      }else {//default
        xDivisionNumber = CONST_DIVISIONNUMBER
        yDivisionNumber = CONST_DIVISIONNUMBER
        xStep = mapSizeInfo.width / xDivisionNumber
        yStep = mapSizeInfo.height / yDivisionNumber
      }

      var nTotalCount:Int=0;
      var resultDensity:mutable.MutableList[List[JsValue]]=mutable.MutableList[List[JsValue]]()
      for(xl <- 0 to xDivisionNumber-1)
      {
        val xData:mutable.MutableList[Int] =mutable.MutableList[Int]()
        var resultDensityData:mutable.MutableList[JsValue]=mutable.MutableList[JsValue]()

        for(yl <-0 to yDivisionNumber-1)
        {
          val countVisitor:List[GlanceVisitor] =filteredVisitors.filter(p => {
            (p.position.x>=xl*xStep && p.position.x < (xl+1)*xStep) && (p.position.y>=yl*yStep && p.position.y<(yl+1)*yStep)
          }
          )
          if(countVisitor.length>0){
            var xyPositionList:mutable.MutableList[Double] =mutable.MutableList[Double]()
            var xPosition = (xl*xStep + (xl+1)*xStep)/2
            var yPosition = (yl*yStep + (yl+1)*yStep)/2
            xyPositionList += xPosition
            xyPositionList += yPosition
            xData += countVisitor.length
            val macAndPosition =countVisitor.map(p => (p.guestMacAddress,p.position.x,p.position.y))
            resultDensityData += Json.toJson(createPositionJSONObject(Json.toJson(xyPositionList.toList),countVisitor.length,macAndPosition.toString(),debugMode))
            nTotalCount += countVisitor.length
          }

        }
        resultDensity += resultDensityData.toList
      }
      (xStep,yStep,resultDensity.toList, nTotalCount)
    }

    if(!((rowCount>0 && columnCount>0) || (gridWidth>0 && gridWidth>0))) {
      Future{BadRequest(Json.toJson(GlanceStatus.failureStatus("Found unreasonable grid information parameters in request!")))}
    }else{
      for{
        sysConf <- GlanceSystemConf.readConf(credential)
        floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
        mapSizeInfoList <- GlanceMapSizeInfo.readByFloors(credential,floors)
        nLock <- GlanceMemcached.memcachedWriteLock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
        cacheVisitors <- Future{getVisitorsFromCache}
        allIPMappingVisitors <- GlanceAssociationIPMacAddress.readAsVisitors(credential,floors,mapSizeInfoList) //all cached list from meraki...
        visitors <- {
          if(nLock>1 || ComUtils.isPeople(category) || ComUtils.isDevice(category) || ComUtils.isTmp(category))
            Future{List()}
          else
            GlanceVisitor.heatmapOfVisitors(category,credential)
        }
        allVisitors <- Future{
          ComUtils.distinctBy(appendTrackedPeopleAndThing(credential,category,ComUtils.distinctBy(allIPMappingVisitors:::visitors)(_.guestMacAddress),sysConf,nLock,ComUtils.distinctBy(allIPMappingVisitors:::cacheVisitors)(_.guestMacAddress)))(_.guestMacAddress)
        }
        nUnlock <- GlanceMemcached.memcachedWriteUnlock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
      }yield {
        var heatmapObj =Json.obj()
        for(floor <- floors ){
          var floorHeatmap:(Double,Double,List[List[JsValue]],Int) =(0.0,0.0,List(),0)
          val matchInfos = mapSizeInfoList.filter(p => p.mapName==floor.mapName)
          if(matchInfos.length>0){
            floorHeatmap= getHeatmapArray(floor,matchInfos(0),allVisitors,gridWidth,gridHeight,rowCount,columnCount)
          }else{
            NotFound(Json.toJson(GlanceStatus.failureStatus(floor.floorId.toString + " does not exist!")))
          }
          heatmapObj += (ComUtils.CONST_PROPERTY_DATA,Json.obj(ComUtils.CONST_PROPERTY_BUILDINGID -> buildingId,ComUtils.CONST_PROPERTY_FLOORID -> floorId,"all visitors count"->allVisitors.length,"floor total visitors count:" ->JsNumber(floorHeatmap._4),"density"->Json.toJson(floorHeatmap._3)))
        }
        Ok(heatmapObj)
      }
    }
  }

  private def visitorsInPolygonAreaOrPointOrLine(floor:GlanceTrackFloor,polygonArea:List[List[Double]],visitors:List[GlanceVisitor]):List[GlanceVisitor]= {
    if(polygonArea.size<=2){
      //point
      var retList= List[GlanceVisitor]()
      if(polygonArea.length==1){
        val x = polygonArea(0)(0)
        val y = polygonArea(0)(1)
        retList = visitors.filter(p => p.floorId==floor.floorId).filter( p => { (p.position.x == x) &&
          (p.position.y == y)
        })
        retList
      }else if(polygonArea.size==2){
        //line
        val xLine=polygonArea.map(f => {
          if(f.length>=1)f(0)
          else
            Int.MaxValue.toDouble
        })
        val yLine=polygonArea.map(f => {
          if(f.length>=2)f(1)
          else
            Int.MaxValue.toDouble
        })
        if(xLine.filter(p => p.toInt !=Int.MaxValue).length==0 || yLine.filter(p => p.toInt !=Int.MaxValue).length==0)
          List()
        else{
          retList =
            visitors.filter(p => p.floorId==floor.floorId).filter( p => { (p.position.x>=xLine.min && p.position.x<=xLine.max) &&
              (p.position.y>=yLine.min && p.position.y<=yLine.max)
            })
          retList
        }
      }else{
        List()
      }

    }else{//polygon
      val xList=polygonArea.map(f => {
        if(f.length>=1)f(0)
        else
          Int.MaxValue.toDouble
      })
      val yList=polygonArea.map(f => {
        if(f.length>=2)f(1)
        else
          Int.MaxValue.toDouble
      })

      if(xList.filter(p => p.toInt !=Int.MaxValue).length==0 || yList.filter(p => p.toInt !=Int.MaxValue).length==0)
        List()
      else{
        val filteredVisitors =visitors.filter(p => p.floorId==floor.floorId).filter( p => { (p.position.x>=xList.min && p.position.x<=xList.max) &&
          (p.position.y>=yList.min && p.position.y<=yList.max)
        })
        val polygon = new Polygon();
        polygonArea.map(p => {
          if(p.length>=2)
            polygon.addPoint(p(0).toInt,p(1).toInt)
          else if(p.length==1)
            polygon.addPoint(p(0).toInt,Int.MaxValue.toInt)
          else
            polygon.addPoint(Int.MaxValue,Int.MaxValue)
        })
        filteredVisitors.filter(p => polygon.contains(p.position.x.toInt,p.position.y.toInt))
      }
    }
  }

  private def visitorsInPolygonAreaOrPointOrLineForRegisteredUsers(floor:GlanceTrackFloor,polygonArea:List[List[Double]],visitors:List[RegisteredUser]):List[RegisteredUser]= {
    if(polygonArea.size<=2){
      var retList= List[RegisteredUser]()
      if(polygonArea.length==1){
        val x = polygonArea(0)(0)
        val y = polygonArea(0)(1)
        return visitors.filter(p => p.position.floorId==floor.floorId).filter( p => { (p.position.x == x) &&
          (p.position.y == y)
        })
      }
      //line
      val xLine=polygonArea.map(f => {
        if(f.length>=1)
          f(0)
        else
          Int.MaxValue.toDouble
      })
      val yLine=polygonArea.map(f => {
        if(f.length>=2)
          f(1)
        else
          Int.MaxValue.toDouble
      })
      if(xLine.filter(p => p.toInt !=Int.MaxValue).length==0 || yLine.filter(p => p.toInt !=Int.MaxValue).length==0)
        return List()

      return visitors.filter(p => p.position.floorId==floor.floorId).filter( p => { (p.position.x>=xLine.min && p.position.x<=xLine.max) &&
        (p.position.y>=yLine.min && p.position.y<=yLine.max)
      })

    }
    //polygon
    val xList=polygonArea.map(f => {
      if(f.length>=1)f(0)
      else
        Int.MaxValue.toDouble
    })
    val yList=polygonArea.map(f => {
      if(f.length>=2)f(1)
      else
        Int.MaxValue.toDouble
    })

    if(xList.filter(p => p.toInt !=Int.MaxValue).length==0 || yList.filter(p => p.toInt !=Int.MaxValue).length==0)
      return List()
    val filteredVisitors =visitors.filter(p => p.position.floorId==floor.floorId).filter( p => { (p.position.x>=xList.min && p.position.x<=xList.max) &&
      (p.position.y>=yList.min && p.position.y<=yList.max)
    })
    val polygon = new Polygon();
    polygonArea.map(p => {
      if(p.length>=2)
        polygon.addPoint(p(0).toInt,p(1).toInt)
      else if(p.length==1)
        polygon.addPoint(p(0).toInt,Int.MaxValue.toInt)
      else
        polygon.addPoint(Int.MaxValue,Int.MaxValue)
    })
    return filteredVisitors.filter(p => polygon.contains(p.position.x.toInt,p.position.y.toInt))
  }

  def expertInPolygonAreaOrPointOrLineFoZone(zone:GlanceZone,user:RegisteredUser):Boolean= {
    val polygonArea:List[List[Double]]=covertMapcoordinateToList(zone.zone.zoneCoordinate)
    if(zone.floorId!= user.position.floorId)
      return false

    if(polygonArea.size<=2){
      var ret= false
      if(polygonArea.length==1) {
          return false
      }
      //line
      val xLine=polygonArea.map(f => {
        if(f.length>=1)
          f(0)
        else
          Int.MaxValue.toDouble
      })
      val yLine=polygonArea.map(f => {
        if(f.length>=2)
          f(1)
        else
          Int.MaxValue.toDouble
      })
      if(xLine.filter(p => p.toInt !=Int.MaxValue).length==0 || yLine.filter(p => p.toInt !=Int.MaxValue).length==0)
        return false

      return { (user.position.x>=xLine.min && user.position.x<=xLine.max) &&
          (user.position.y>=yLine.min && user.position.y<=yLine.max)
      }
    }
    //polygon
    val xList=polygonArea.map(f => {
      if(f.length>=1)
        f(0)
      else
        Int.MaxValue.toDouble
    })
    val yList=polygonArea.map(f => {
      if(f.length>=2)
        f(1)
      else
        Int.MaxValue.toDouble
    })

    if(xList.filter(p => p.toInt !=Int.MaxValue).length==0 || yList.filter(p => p.toInt !=Int.MaxValue).length==0)
      return false

    val bCheck = (user.position.x>=xList.min && user.position.x<=xList.max) &&
      (user.position.y>=yList.min && user.position.y<=yList.max)

    val polygon = new Polygon();
    polygonArea.map(p => {
      if(p.length>=2)
        polygon.addPoint(p(0).toInt,p(1).toInt)
      else if(p.length==1)
        polygon.addPoint(p(0).toInt,Int.MaxValue.toInt)
      else
        polygon.addPoint(Int.MaxValue,Int.MaxValue)
    })

    return bCheck && polygon.contains(user.position.x.toInt,user.position.y.toInt)
  }

  private def covertMapcoordinateToList(zoneCoordinate:List[MapCoordinate]):List[List[Double]]={
      zoneCoordinate.map(p=> List(p.x,p.y))
  }

  private def matchedZoneName(hierachy:String, zoneName:String):Boolean = {
    val hierachys = hierachy.split(ComUtils.HIERARCHY_SPLIT)
    if (hierachys.length >= 4) {
      return (hierachys(3)== zoneName)
    } else
      false
  }

  def getHeatmapOfVisitorsByZones(category:String="all",floorId:String="",credential:GlanceCredential):Future[JsObject]={
    def convertRegisterUserToVisitor(user:RegisteredUser,sysConf:GlanceSystemConf):List[GlanceVisitor] ={
      val results:mutable.MutableList[GlanceVisitor]=new mutable.MutableList[GlanceVisitor]()
      for(cl <- 0 to user.macAddress.length-1){
        results+= new GlanceVisitor(glanceOrgId = user.glanceOrgId,floorId = user.position.floorId,visitingDay = ComUtils.getDayStringFromCMXDate("",sysConf.defaultTimeZone),
          visitingHour =ComUtils.getHourStringFromCMXDate("",sysConf.defaultTimeZone),visitingMinute = ComUtils.getMinuteStringFromCMXDate("",sysConf.defaultTimeZone),
          guestMacAddress = user.macAddress(cl),activeTime = System.currentTimeMillis(),position = user.position
        )
      }
      results.toList
    }

    val p = Promise[JsObject]
    val f = p.future
    Future {
      for {
        sysConf <- GlanceSystemConf.readConf(credential)
        floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
        mapSize <- GlanceMapSizeInfo.readByFloors(credential, floors)
        zones <- GlanceZone.readAllConfByFloors(credential.glanceOrgId, floorId, floors.toList)
        nLock <- GlanceMemcached.memcachedWriteLock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
        cacheVisitors <- Future{getVisitorsFromCache}
        allIPMappingVisitors <- GlanceAssociationIPMacAddress.readAsVisitors(credential, floors, mapSize) //fixme...all cached list from meraki...
        visitors <- {
          if (nLock > 1 || ComUtils.isPeople(category) || ComUtils.isDevice(category) || ComUtils.isTmp(category))
            Future {List()}
          else
            GlanceVisitor.heatmapOfVisitors(category, credential)
        }
        allVisitors <- Future{appendTrackedPeopleAndThing(credential,category,allIPMappingVisitors ::: visitors,sysConf,nLock,allIPMappingVisitors ::: cacheVisitors)}
        nUnlock <- GlanceMemcached.memcachedWriteUnlock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
      } yield {
        var heatMapret = Json.obj()
        var returnObj = Json.obj()
        for (floor <- zones.keySet) {
          var heatMapObj = Json.obj()
          if(mapSize.filter(p => p.mapName == floor.mapName).length > 0) {
            val zonesInFloor = zones(floor)
            for (zone <- zonesInFloor) {
              val inAreaList = {
                if (zone.systemZone) {
                  val list = allVisitors.filter(p => p.floorId == floor.floorId).filter(p => matchedZoneName(p.mapHierarchy,zone.zoneName))
                  ComUtils.distinctBy(list)(_.guestMacAddress)
                } else
                  ComUtils.distinctBy(visitorsInPolygonAreaOrPointOrLine(floor, covertMapcoordinateToList(zone.zone.zoneCoordinate), allVisitors))(_.guestMacAddress)
              }
              val bShowLabel: Boolean = (inAreaList.length >= sysConf.zoneCountThreshold)
              heatMapObj +=(zone.zoneId, Json.obj(ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> zone.zoneDisplayName,ComUtils.CONST_PROPERTY_ZONECOUNT -> inAreaList.length, ComUtils.CONST_PROPERTY_ID -> zone.zoneId, ComUtils.CONST_PROPERTY_TEMPORARY -> JsBoolean(zone.temporary), ComUtils.CONST_PROPERTY_SHOWLABEL -> JsBoolean(bShowLabel)))
            }
            heatMapret +=(floor.floorId, heatMapObj)
          } else {
            heatMapret +=(floor.floorId, heatMapObj)
          }
        }
        returnObj +=(ComUtils.CONST_PROPERTY_ZONES, heatMapret)
        p.success(returnObj)
      }
    }

    f.map { result =>
      result
    }.recover {
      case _ =>
        Json.obj()
    }
  }

  def getHeatmapOfVisitorsByZonesAPI(category:String="all",polygonArea:List[List[Double]]=List()) = Action.async { implicit request =>
    val credential=remoteCredential
    val floorId:String=remoteQueryString(request,ComUtils.CONST_PROPERTY_FLOORID,"")
    for{
      sysConf <-GlanceSystemConf.readConf(credential)
      floors <- GlanceTrackCampus.readDefaultCampusFloors(credential)
      mapSize <- GlanceMapSizeInfo.readByFloors(credential,floors)
      zones <- GlanceZone.readAllConfByFloors(credential.glanceOrgId, floorId,floors.toList)

      nLock <- GlanceMemcached.memcachedWriteLock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
      cacheVisitors <-  Future{getVisitorsFromCache}
      allIPMappingVisitors <- GlanceAssociationIPMacAddress.readAsVisitors(credential,floors,mapSize) //fixme...all cached list from meraki...
      visitors        <- {
        if(/*nLock>1 ||*/ ComUtils.isPeople(category) || ComUtils.isDevice(category) || ComUtils.isTmp(category))
          Future{List()}
        else
          GlanceVisitor.heatmapOfVisitors(category,credential)
      }
      allVisitors <- Future{appendTrackedPeopleAndThing(credential,category,allIPMappingVisitors:::visitors,sysConf,nLock,allIPMappingVisitors:::cacheVisitors)}
      nUnlock <- GlanceMemcached.memcachedWriteUnlock(GlanceMemcached.CONST_MEMCACHED_VISITORSCANNING_DATALOCK)
    }yield {
      val retList:mutable.MutableList[List[List[Int]]]=mutable.MutableList()
      var heatMapret =Json.obj()
      var returnObj=Json.obj()
      for(floor <- zones.keySet){
        var heatMapObj =Json.obj()
        val matchInfos =mapSize.filter(p => p.mapName==floor.mapName)
        if(matchInfos.length>0){
          val zonesInFloor = zones(floor)
          for(zone <- zonesInFloor){
            val inAreaList = {
              if(zone.systemZone) {
                val list = allVisitors.filter(p => p.floorId == floor.floorId).filter(p => matchedZoneName(p.mapHierarchy,zone.zoneName))
                ComUtils.distinctBy(list)(_.guestMacAddress)
              }else
                ComUtils.distinctBy(visitorsInPolygonAreaOrPointOrLine(floor,covertMapcoordinateToList(zone.zone.zoneCoordinate),allVisitors))(_.guestMacAddress)
            }
            val bShowLabel =(inAreaList.length>sysConf.zoneCountThreshold)
            heatMapObj += (zone.zoneId,Json.obj(ComUtils.CONST_PROPERTY_ZONEDISPLAYNAME -> zone.zoneDisplayName,ComUtils.CONST_PROPERTY_ZONECOUNT -> inAreaList.length,ComUtils.CONST_PROPERTY_ID -> zone.zoneId,ComUtils.CONST_PROPERTY_TEMPORARY->JsBoolean(zone.temporary),ComUtils.CONST_PROPERTY_SHOWLABEL -> JsBoolean(bShowLabel)))
          }
          heatMapret += (floor.floorId,heatMapObj)
        }else{
          heatMapret += (floor.floorId,heatMapObj)
        }
      }
      returnObj += (ComUtils.CONST_PROPERTY_ZONES,heatMapret)
      Ok(returnObj)
    }
  }
}
