/*
 * Copyright (c) 2015.
 *
 */

package services.security

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/9/8
 **/
trait AuthService {
  val provider : String
  def login(username: String, password: String) : String
}
