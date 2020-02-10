# GLANCE

Glance is an indoor, location-based, application service. It includes 3D maps, indoor path navigation, finding and tracking of people, facilities, and assets, and real-time analysis heat-maps of people and devices. Glance leverages Cisco Meraki/CMX wireless indoor positioning system sdk. Docker services packaging/deployment scripts and administrative console are also included.

![Glance](./Glance.png)

Live Demo Link: http://ec2-52-10-142-148.us-west-2.compute.amazonaws.com/#


## Package

Use `./activator assembly` or `sbt assembly` to build your application with jar file output.

## Build instructions

### Environment requirements

The following tools are required to build the project.

* Java 7/8
* Scala IDE/TypeSafe activator installed 
    
  * Reference: https://www.scala-lang.org/download/  and https://www.scala-sbt.org/1.x/docs/Getting-Started.html
    
* Docker/Docker-Compose installed

### Build the project

1. Go to folder: [deployment/docker](./deployment/docker)
    
2. Run: `source ./build.sh`

3. Go to folder: [deployment/docker](./deployment/docker)

4. Run: `source ./glance_allbuild.sh 2.0.0.102 localhost`
   
   * Target version: 2.0.0.102, docker repository host: localhost

## Test the Services

Start: `Docker-Compose up -d`
  
Stop: `Docker-Compose down -v`
    
### For Debug Mode to run the Glance Project

1. Started RabbitMQ, Memcached, MongoDB via `run docker-compose up -d`  with comment out gs1,gs2, nginx, nginxhttps docker services
2. Run command line at root folder of project:  `./activator run` or `sbt run` 

### Accessing Pages

* Main UI Page of Glance: `http://your_host/#`
* Demo only page: `http://your_host/?DEMO#`
* Administrator console: `http://your_host/settings.html`  

### Accessing Pages in Debug Mode

* Main UI Page of Glance (in debug mode): `http://your_host:9000/#`
* Demo only page (in debug mode): `http://your_host:9000/?DEMO#`
* Administrator console: `http://your_host:9000/settings.html` 

### Default user account: admin/2016Admin4Lowe

## UI

* https://github.com/CiscoDevNet/Glance/blob/master/glance_main.png
* https://github.com/CiscoDevNet/Glance/blob/master/glance_admin.png



