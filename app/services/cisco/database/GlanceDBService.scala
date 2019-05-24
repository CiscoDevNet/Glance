package services.cisco.database

import play.Logger
import reactivemongo.api.{DefaultDB, FailoverStrategy, MongoConnection}
import services.common.ConfigurationService
import utils.ComUtils
import reactivemongo.api.MongoDriver
import scala.concurrent.ExecutionContext.Implicits.global
import reactivemongo.api.MongoConnectionOptions
import scala.util.Try

/**
 * Created by kennych on 12/30/15.
 */
object GlanceDBService {
  val defaultDBName="glance3d"

  var db:DefaultDB = null
  val driver = new MongoDriver
  var dbConnection:reactivemongo.api.MongoConnection=null
  def Init(): Unit ={
    //val uri = "mongodb://user123:passwd123@host1:27018,host2:27019,host3:27020/somedb"
    //val uri="mongodb://10.10.10.1:27017/glance3d"
    if(dbConnection!=null){
      db=dbConnection.db(defaultDBName,new FailoverStrategy(retries=70))
    }else{
      val uri =scala.util.Properties.envOrElse("GLANCE_DB",ConfigurationService.getString("mongodb.uri","mongodb://mongo:27017"))
      MongoConnection.parseURI(uri).map { parsedUri =>
        Logger.debug("Options for nbChannelsPerNode:"+parsedUri.options.nbChannelsPerNode)
        var perNodes:Int ={
          val perNodesVal =scala.util.Properties.envOrElse("GLANCE_PERNODES",ConfigurationService.getString("mongodb.perNodes",""+ComUtils.mongoDBPerNodes))
          try{
            perNodesVal.toInt
          }catch {
            case exp:Throwable =>
              Logger.error("Failed to parse mongodb perNodes parameter from environment:"+perNodesVal+" exception:"+exp.getMessage)
              ComUtils.mongoDBPerNodes
          }
        }
        if(perNodes<=0)
          perNodes=ComUtils.mongoDBPerNodes

        val conOpts = parsedUri.options.copy(nbChannelsPerNode = perNodes)
        driver.connection(parsedUri.copy(options = conOpts))
      }.map{ connect =>
        if(dbConnection==null)
          dbConnection=connect
        else
          connect.close()
        db =dbConnection.db(defaultDBName)
      }.recover{
        case _=>
          null
      }
    }
  }

  def GlanceDB(): DefaultDB={
    if(db==null){
      Init()
    }
    db
  }
}
