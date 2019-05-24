# GLANCE

## Package

Use `./activator assembly` to build your application with jar file output.

## Build instructions

### Environment requriements

We require these tools in your system to build the project.

* Java 7/8
* Scala IDE/TypeSafe activator installed 
    
    Reference: https://www.scala-lang.org/download/
    
* Docker/Docker-Compose installed

Build the project:

1)Go to folder:

    deployment/docker
    
2)Run:

    Source ./build.sh

3)Go to folder:

    deployment/docker

4)Run:(target version: 2.0.0.102, docker repository host: localhost)

  source ./glance_allbuild.sh 2.0.0.102 localhost

Test the Services:

Start:
  Docker-Compose up -d
  
Stop:
    Docker-Compose down -v
    
For Debug Mode to run the Glance Project:
1)Started RabbitMQ, Memcached, MongoDB via "run docker-compose up -d" with comment out gs1,gs2, nginx,nginxhttps docker services"
2) Run command line at root folder of project:  "./activator run"

Main UI Page of Glance:

http://your_host/#

Demo only page:

http://your_host/?DEMO#

Administrator console:

http://your_host/settings.html  

Debug Mode:

Main UI Page of Glance:

http://your_host:9000/#

Demo only page:

http://your_host:9000/?DEMO#

Administrator console:

http://your_host:9000/settings.html  

Default user account: admin/2016Admin4Lowe


UI:

https://github.com/CiscoDevNet/Glance/blob/master/glance_main.png

https://github.com/CiscoDevNet/Glance/blob/master/glance_admin.png


US Patent includes:

https://patents.justia.com/patent/10152548


