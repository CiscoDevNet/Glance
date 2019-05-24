package models.glance

import utils.ComUtils
import play.Logger
import play.api.Play.current
import services.security.GlanceCredential
import play.api.libs.json._

/**
 * Created by kennych on 9/23/16.
 */

object GlancePeopleNDeviceCategory {
  def getPeopleCategory(credential:GlanceCredential):List[String]={
    List(ComUtils.SMART_DEVICE_TYPE_EXPERT,ComUtils.SMART_DEVICE_TYPE_GUEST,ComUtils.SMART_DEVICE_TYPE_PERSON,ComUtils.SMART_DEVICE_TYPE_VISITOR)
  }
  def getDeviceCategory(credential: GlanceCredential):List[String] ={
    List(ComUtils.SMART_DEVICE_TYPE_ASSET,ComUtils.SMART_DEVICE_TYPE_MOBILE,ComUtils.SMART_DEVICE_TYPE_SCREEN,ComUtils.SMART_DEVICE_TYPE_THING)
  }

}
