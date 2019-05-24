package services.cisco.instanceSync
import shade.memcached._
import scala.concurrent.ExecutionContext.Implicits.global
/**
 * Created by kennych on 4/28/16.
 */
object MemCached {
  val defaultMemCached="memcached"

  def getMemCachedServer(): String ={
    val server=scala.util.Properties.envOrElse("MEM_CACHD_SERVER",defaultMemCached)+":11211"
    server
  }
  val memcached = Memcached(Configuration(getMemCachedServer()))

  def getMemCached(): Memcached ={
    memcached
  }
}
