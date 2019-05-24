package models.tropo

/**
 * Cisco System
 * Authors: haihxiao
 * Date: 15/5/29
 **/
case class Tropo(stype: String, countryCode: String, tel: String, msg: String) {
  def numberToDial : String = {
    countryCode + tel
  }
}

