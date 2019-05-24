package utils

/**
 * Created by kennych on 12/19/16.
 */

import java.io.{File, FileInputStream}
import java.security.MessageDigest
import java.nio.file.{Files, Paths}

import play.Logger

object CheckSumGenerator extends  scala.AnyRef{
  implicit class CheckSumHelper(val sc: String) extends AnyVal {
    def fileCheckSum(t:String):String =checkSum(t,sc)
  }
  // t is the type of checksum, i.e. MD5, or SHA-512 or whatever
  // path is the path to the file you want to get the hash of
  def checkSum(t: String, path: String): String = {
    try{
      val fis: FileInputStream = new FileInputStream(new File(path));
      val checksum:String = {
        t match {
          case "MD2" =>
            org.apache.commons.codec.digest.DigestUtils.md2Hex(fis)
          case "MD5" =>
            org.apache.commons.codec.digest.DigestUtils.md5Hex(fis)
          case "SHA1" =>
            org.apache.commons.codec.digest.DigestUtils.sha1Hex(fis)
          case "SHA-256" =>
            org.apache.commons.codec.digest.DigestUtils.sha256Hex(fis)
          case "SHA-384" =>
            org.apache.commons.codec.digest.DigestUtils.sha384Hex(fis)
          case "SHA-512" =>
            org.apache.commons.codec.digest.DigestUtils.sha512Hex(fis)
          case _ =>
            org.apache.commons.codec.digest.DigestUtils.sha1Hex(fis)
        }
      }
      fis.close()
      checksum
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to generator checksum for file:"+path+" exception:"+exp.getMessage)
        ""
    }
  }


  def digest(t: String, strValue: String) = {
    try{
      val dig:String = {
        t match {
          case "MD2" =>
            org.apache.commons.codec.digest.DigestUtils.md2Hex(strValue)
          case "MD5" =>
            org.apache.commons.codec.digest.DigestUtils.md5Hex(strValue)
          case "SHA1" =>
            org.apache.commons.codec.digest.DigestUtils.sha1Hex(strValue)
          case "SHA-256" =>
            org.apache.commons.codec.digest.DigestUtils.sha256Hex(strValue)
          case "SHA-384" =>
            org.apache.commons.codec.digest.DigestUtils.sha384Hex(strValue)
          case "SHA-512" =>
            org.apache.commons.codec.digest.DigestUtils.sha512Hex(strValue)
          case _ =>
            org.apache.commons.codec.digest.DigestUtils.sha1Hex(strValue)
        }
      }
      dig
    }catch {
      case exp:Throwable =>
        Logger.error("Failed to generator checksum for file:"+strValue+" exception:"+exp.getMessage)
        ""
    }
  }

  implicit final class Digest(val valueStr: String) extends scala.AnyVal {
    def digest(t:String):String={
      CheckSumGenerator.digest(t,valueStr)
    }
  }

}

