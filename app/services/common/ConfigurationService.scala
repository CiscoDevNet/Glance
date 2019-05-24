package services.common

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/5/11
 **/
object ConfigurationService {
  import play.api.Play.current

  val env = play.api.Play.mode.toString.toLowerCase + "."

  def getString(key: String, defValue: String = "") = {
    current.configuration.getString(env + key).getOrElse(current.configuration.getString(key).getOrElse(defValue))
  }

  def getInt(key: String, defValue: Int = 0) = {
    current.configuration.getInt(env + key).getOrElse(current.configuration.getInt(key).getOrElse(defValue))
  }

  def getLong(key: String, defValue: Long = 0L) = {
    current.configuration.getLong(env + key).getOrElse(current.configuration.getLong(key).getOrElse(defValue))
  }

  def getBoolean(key: String, defValue: Boolean = false) = {
    current.configuration.getBoolean(env + key).getOrElse(current.configuration.getBoolean(key).getOrElse(defValue))
  }
}
