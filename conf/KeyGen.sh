#!/usr/bin/env bash
export PW=123456
keytool -genkeypair -v \
  -alias glanceca \
  -dname "CN=Glance, OU=DevNet Apps, O=Cisco Devnet, L=San Jose, ST=San Jose, C=US" \
  -keystore glanceca.jks \
  -keypass:env PW \
  -storepass:env PW \
  -keyalg RSA \
  -keysize 4096 \
  -ext KeyUsage:critical="keyCertSign" \
  -ext BasicConstraints:critical="ca:true" \
  -validity 9999