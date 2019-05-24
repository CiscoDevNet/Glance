package services.common

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/5/23
 **/
import akka.actor.{ActorRef, Actor, Props}
import play.api.libs.concurrent.Akka
import play.api.Play.current

sealed class Subscriber(f: (String, Any) => Unit) extends Actor {
  override def receive = { case (topic: String, payload: Any) => f(topic, payload) }
}

object EventStream {
  val system = Akka.system
  private var subscriptions : Map[String, ActorRef] = Map()

  def subscribe(f: (String, Any) => Option[Unit], name: String) : Unit = {
    val props = Props(classOf[Subscriber], f)
    val subscriber = system.actorOf(props, name = name)
    system.eventStream.subscribe(subscriber, classOf[(String, Any)])
    subscriptions += (name -> subscriber)
  }

  def unsubscribe(name: String) : Unit = {
    subscriptions.get(name).foreach(system.eventStream.unsubscribe)
  }

  def publish(topic: String, payload: Any) {
    system.eventStream.publish(topic, payload)
  }
}
