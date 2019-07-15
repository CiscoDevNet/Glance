package services.common

import akka.actor.{Cancellable, Actor, Props, ActorRef}
import play.api.libs.concurrent.Akka
import play.api.Play.current

import scala.concurrent.duration.FiniteDuration
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._

/**
 * Cisco Systems
 * Authors: haihxiao
 * Date: 15-5-22
 **/
object SchedulingService {
  var scheduler = Akka.system.actorOf(Props(classOf[Scheduler]))
  val defaultInitialDelay = 30 seconds

  def schedule[T <: akka.actor.Actor](actorClass : Class[T], interval : FiniteDuration) : ActorRef = {
    schedule(actorClass, actorClass.getName, defaultInitialDelay, interval)
  }

  def schedule[T <: akka.actor.Actor](actorClass : Class[T], initialDelay : FiniteDuration, interval : FiniteDuration) : ActorRef = {
    schedule(actorClass, actorClass.getClass.getName, initialDelay, interval)
  }

  def schedule[T <: akka.actor.Actor](actorClass : Class[T], name: String, initialDelay : FiniteDuration, interval : FiniteDuration, message : scala.Any = "") : ActorRef = {
    val actor = Akka.system.actorOf(Props(actorClass))
    val msg = (name, initialDelay, interval, actor, message)
    scheduler ! msg
    actor
  }

  def cancel[T <: akka.actor.Actor](actorClass : Class[T]) : Unit = {
    scheduler ! actorClass.getClass.getName
  }

  def cancel(name: String) : Unit = {
    scheduler ! name
  }
}

class Scheduler extends Actor {
  var jobMap = Map[String, Cancellable]()
  import Akka.system

  def receive = {
    case (name: String, initialDelay: FiniteDuration, interval : FiniteDuration, actor : ActorRef, message : scala.Any) =>
      jobMap.get(name).foreach(_.cancel())
      jobMap += (name -> system.scheduler.schedule(initialDelay, interval, actor, message))

    case name: String =>
      val cancellable = jobMap.get(name)
      cancellable.foreach(_.cancel())
  }
}
