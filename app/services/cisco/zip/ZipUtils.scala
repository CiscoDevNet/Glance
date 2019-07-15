package services.cisco.zip

import java.io._
import java.util.zip.{ZipInputStream, ZipEntry, ZipOutputStream}
import java.nio.file.{Paths, Path}
import play.Logger
import org.apache.commons.io.FilenameUtils

/**
 * Created by kennych on 11/17/16.
 */

object ZipUtils {
  val Buffer = 2 * 1024

  def compress(zipFilepath: String, files: List[File],baseFolder:String="") {
    def getDestFile(fileName:String,baseDir:String=""):String={
      if(baseFolder=="")
        FilenameUtils.getName(fileName)
      else
      {
        val pathAbsolute = Paths.get(fileName).toAbsolutePath;
        val pathBase = Paths.get(baseFolder).toAbsolutePath;
        val pathRelative = pathBase.relativize(pathAbsolute);
        if(pathRelative==fileName)
          fileName
        else
          "/"+pathRelative.toString
      }
    }

    val data = new Array[Byte](Buffer)
    def readByte(bufferedReader: BufferedReader): Stream[Int] = {
      bufferedReader.read() #:: readByte(bufferedReader);
    }
    val zip = new ZipOutputStream(new FileOutputStream(zipFilepath));
    try {
      for (file <- files) {
        zip.putNextEntry(new ZipEntry(getDestFile(file.getAbsolutePath,baseFolder)))
        val in = new BufferedInputStream(new FileInputStream(file.getCanonicalPath), Buffer)
        var b = in.read(data, 0, Buffer)

        try {
          while (b != -1) {
            zip.write(data, 0, b)
            b = in.read(data, 0, Buffer)
          }
        }
        finally {
          in.close();
        }

        zip.closeEntry();
      }
    }
    finally {
      zip.close();
    }
  }

  def decompress(zipFile: InputStream, destination: Path): Unit = {
    val zis = new ZipInputStream(zipFile)
    try{
      Stream.continually(zis.getNextEntry).takeWhile(_ != null).foreach { file =>
        if (!file.isDirectory) {
          val outPath = Paths.get(destination.toString, file.getName)
          val outPathParent = outPath.getParent
          if (!outPathParent.toFile.exists()) {
            outPathParent.toFile.mkdirs()
          }
          val outFile = outPath.toFile
          val out = new FileOutputStream(outFile)
          try{
            val buffer = new Array[Byte](4096)
            Stream.continually(zis.read(buffer)).takeWhile(_ != -1).foreach(out.write(buffer, 0, _))

          }catch {
            case exp:Throwable =>
              Logger.error("Failed unzip file,exception:{}",exp.getMessage)
          }
          finally {
            out.close()
          }
        }
      }
    }
    finally {
      zis.close()
      zipFile.close()
    }
  }

}
