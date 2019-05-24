package models.glance

import reactivemongo.play.json._
import services.security.GlanceCredential
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import play.Logger

/**
 * Created by kennych on 11/1/16.
 */
object GlanceZoneColor {

  def readAllDefaultColors(credential:GlanceCredential):Future[List[String]]={
    val colors= List( "#e19a4a","#b5e14a", "#4ae17c","#e1784a",
      "#e14a5c","#4ae1aa","#4ad8e1","#e14adf",
      "#e1c34a","#e14a71","#5fe14a","#4a5fe1",
      "#8d4ae1","#4aaae1","#aa4ae1","#c34ae1",
      "#e14aad","#e18a4a","#4a83e1","#664ae1",
      "#e14a4a","#e1664a","#e1b14a","#e14a8a"
    )
    Future{colors}
  }
}
