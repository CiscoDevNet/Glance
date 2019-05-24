name := """Glance"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.7"


libraryDependencies ++= Seq(
  ws,
  cache,
  "org.reactivemongo" %% "reactivemongo-play-json" % "0.11.14",
  "com.google.code.gson" % "gson" % "2.3.1",
  "org.apache.logging.log4j" % "log4j-core" % "2.5",
  "org.apache.logging.log4j" % "log4j-to-slf4j" % "2.5",
  "org.reactivemongo" %% "play2-reactivemongo" % "0.10.5.0.akka23"  ,
  "com.typesafe.akka" %% "akka-actor" % "2.3.9",
  "com.typesafe.akka" %% "akka-slf4j" % "2.3.9",
  "com.typesafe.slick" %% "slick" % "2.1.0",
  "com.typesafe.play" %% "play-slick" % "0.8.1" ,
  "com.rabbitmq" % "amqp-client" % "3.2.1" ,
  "com.sksamuel.scrimage" %% "scrimage-core" % "2.1.0" ,
  "joda-time" % "joda-time" % "2.9.1",
  "net.glxn" % "qrgen" % "1.4",
  "org.apache.poi" % "poi-ooxml" % "3.13",
  "org.scala-lang.modules" % "scala-async_2.11" % "0.9.5",
  "com.bionicspirit" %% "shade" % "1.7.4",
  "xml-apis" % "xml-apis" % "2.0.2",
  "xml-apis" % "xml-apis-ext" % "1.3.04",
  "org.apache.xmlgraphics" % "batik-bridge" % "1.7",
  "org.apache.xmlgraphics" % "batik-transcoder" % "1.7",
  "org.apache.xmlgraphics" % "batik-awt-util" % "1.7",
  "org.apache.xmlgraphics" % "batik-anim" % "1.7",
  "org.apache.xmlgraphics" % "batik-css" % "1.7",
  "org.apache.xmlgraphics" % "batik-dom" % "1.7",
  "org.apache.xmlgraphics" % "batik-ext" % "1.7",
  "org.apache.xmlgraphics" % "batik-gvt" % "1.7",
  "org.apache.xmlgraphics" % "batik-parser" % "1.7",
  "org.apache.xmlgraphics" % "batik-script" % "1.7",
  "org.apache.xmlgraphics" % "batik-svg-dom" % "1.7",
  "org.apache.xmlgraphics" % "batik-svggen" % "1.7",
  "org.apache.xmlgraphics" % "batik-util" % "1.7",
  "org.apache.xmlgraphics" % "batik-xml" % "1.7",
  "com.github.t3hnar" %% "scala-bcrypt" % "3.0",
  "io.lemonlabs" %% "scala-uri" % "1.4.1"
)

// Exclude commons-logging because it conflicts with the jcl-over-slf4j
libraryDependencies ~= { _ map {
  case m if m.organization == "com.typesafe.play" =>
    m.exclude("commons-logging", "commons-logging")
    m.exclude("org.slf4j", "jcl-over-slf4j")
  case m => m
}}

mainClass in assembly := Some("play.core.server.NettyServer")

fullClasspath in assembly += Attributed.blank(PlayKeys.playPackageAssets.value)

assemblyMergeStrategy in assembly := {
  case PathList(ps @ _*) if ps.last endsWith "logback.xml" => MergeStrategy.last
  case PathList("javax", "xml", xs @ _*) => MergeStrategy.first
  case "play/core/server/ServerWithStop.class" => MergeStrategy.first
  case "log4j-provider.properties" => MergeStrategy.first
  case "META-INF/log4j-provider.properties" => MergeStrategy.first
  case other => (assemblyMergeStrategy in assembly).value(other)
}

unmanagedResourceDirectories in Compile += { baseDirectory.value / "public" }

excludeFilter in unmanagedResources in Compile := ".DS_Store"

test in assembly := {}

fork in run := true

