package services.security
import java.security.MessageDigest
import java.util
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import org.apache.commons.codec.binary.Base64
import play.Logger
import services.common.ConfigurationService
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.StringUtils;

/**
 * Created by kennych on 9/14/16.
 */
object AESEncrypt {
  val randomKey = ConfigurationService.getString("aes.key")

  def encrypt(value: String): String = {
    try{
      if(value!=""){
        val cipher: Cipher = Cipher.getInstance("AES/ECB/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, keyToSpec(randomKey))
        Base64.encodeBase64String(cipher.doFinal(value.getBytes("UTF-8")))
      }else{
        ""
      }
    }catch{
      case exp:Throwable =>
        Logger.error("Failed to encrypt data,exception:{}",exp.getMessage)
        ""
    }
  }

  def decrypt(encryptedValue: String,failDefault:String=""): String = {
    try{
      if(encryptedValue!=""){
        val cipher: Cipher = Cipher.getInstance("AES/ECB/PKCS5PADDING")
        cipher.init(Cipher.DECRYPT_MODE, keyToSpec(randomKey))
        new String(cipher.doFinal(Base64.decodeBase64(encryptedValue)))
      }else{
        ""
      }
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to decrypt the Data,exception:{}",exp.getMessage)
        failDefault
    }
  }

  def keyToSpec(key: String): SecretKeySpec = {
    var keyBytes: Array[Byte] = (SALT + key).getBytes("UTF-8")
    val sha: MessageDigest = MessageDigest.getInstance("SHA-1")
    keyBytes = sha.digest(keyBytes)
    keyBytes = util.Arrays.copyOf(keyBytes, 16)
    new SecretKeySpec(keyBytes, "AES")
  }

  private val SALT: String =
    "VRErT1bCwA8mfh4XZuECkQDh4vKenv7g8Qx3QsuIuy6kHqUDhcGO"

  def base64_decode(s:String):String= {
    StringUtils.newStringUtf8(Base64.decodeBase64(s));
  }
  def base64_encode(s:String):String= {
    return Base64.encodeBase64String(StringUtils.getBytesUtf8(s));
  }

}
