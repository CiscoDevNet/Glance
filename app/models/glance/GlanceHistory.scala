package models.glance

import models.cmx.{Campus, Floor}
import play.Logger
import play.api.libs.ws.{WSAuthScheme, WS, WSResponse, WSRequestHolder}
import services.cisco.indoor.CMXService
import services.security.GlanceCredential
import utils.ComUtils
import scala.collection.mutable
import scala.concurrent.{Future, Await}
import play.api.Play.current
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.libs.json._

/**
 * Created by kennych on 8/31/16.
 */

object GlanceHistory {

  def readAllMapInfo(credential:GlanceCredential):Future[List[Floor]]={
    def getAllFloors(campuses:List[Campus]):List[Floor] ={
      var floors:List[Floor]=List[Floor]()
      for(campus <- campuses)
      {
        val buildings = campus.buildings

        for(building <- buildings ){
          val tmpFloors = building.floors
          floors = floors ::: tmpFloors
        }
      }
      floors
    }
    for{
      conf <- GlanceSystemConf.readConf(credential)
      floors <-GlanceTrackFloor.readAll(credential)
      campuses <- {
        //if under meraki mode, just skip cmx floors retrieving:)
        val filteredFloors=floors.filter(p => ComUtils.isCmxServiceType(p.cmxServiceType) || ComUtils.isMerakiHierarchy(p.hierarchy))
        if(filteredFloors.length>0)
          CMXService.loadCampusInfo(credential,conf)
        else{
          Future{List()}
        }
      }
    } yield {
      if(campuses.length>0){
        val cmxFloors=getAllFloors(campuses)
        cmxFloors
      }else{
        List()
      }
    }
  }

  def readAllConfiguredFloors(credential: GlanceCredential):Future[mutable.HashMap[String,List[GlanceTrackFloor]]]={
    for{
      conf <- GlanceSystemConf.readConf(credential)
      trackFloors <- GlanceTrackFloor.readAll(credential)
      cmxFloors <- {
        val floors= trackFloors.filter(p => ComUtils.isCmxServiceType(p.cmxServiceType) && ComUtils.isCorrectHierarchy(p.hierarchy))
        if(floors.length>0)
          readAllMapInfo(credential)
        else
          Future{List()}
      }
    }yield {
      val trackMap =mutable.HashMap[String,List[GlanceTrackFloor]]()
      for(cmxFloor <- cmxFloors) {
        val list = trackFloors.filter(x => x.hierarchy.compareToIgnoreCase(cmxFloor.hierarchyName) == 0 || x.hierarchy.indexOf(cmxFloor.hierarchyName + ComUtils.HIERARCHY_SPLIT) == 0)
        trackMap(cmxFloor.aesUidString)=list
      }
      trackMap
    }
  }
}
