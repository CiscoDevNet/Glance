package services.security

import play.Logger
import utils.ComUtils

/**
 * Created by kennych on 11/7/16.
 */
object GlanceOnewayEncrypt {
  import com.github.t3hnar.bcrypt._

  def oneWayEncrypt(password:String):String={
     try{
       if(password=="")
         ""
       else
         password.bcrypt
     }catch{
       case exp:Throwable =>
         Logger.error("Failed to encrypt password,exception:{}",exp.getMessage)
         ""
     }
  }

  def verifyOnewayPass(pass:String,encryptedPass:String):Boolean ={
    try{
      if(pass == "" || encryptedPass == "")
      {
        Logger.warn("Password or encryptedPass should not be empty!")
        false
      } else
        pass.isBcrypted(encryptedPass)
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to verify password,exception:{}",exp.getMessage)
        false
    }
  }
}
