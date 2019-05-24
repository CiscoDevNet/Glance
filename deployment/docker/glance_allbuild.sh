#!/usr/bin/env bash
echo "Glance Docker Image version of GlanceScala Server:"
echo $1
echo "Image Server:"$2

mkdir ././../dockerimages
chmod 755 ././../dockerimages

source ./glance_memcachedbuild.sh $1 $2
source ./glance_mongobuild.sh $1 $2
source ./glance_rabbitmqbuild.sh $1 $2
source ./glance_scalabuild.sh $1 $2
source ./glance_nginxbuild.sh $1 $2
source ./glance_nginx_https_build.sh $1 $2

#rm -rf ././../dockerimages/$1
#mkdir ././../dockerimages/$1

#cp -rf ./GlanceConfigureScripts/ ././../dockerimages/$1
#cp -rf ./glanceStartStopScripts/ ././../dockerimages/$1

#cp ././../dockerimages/glancescala-$1.tar ././../dockerimages/$1
#cp ././../dockerimages/mongo-$1.tar ././../dockerimages/$1
#cp ././../dockerimages/memcached-$1.tar ././../dockerimages/$1
#cp ././../dockerimages/rabbitmq-$1.tar ././../dockerimages/$1
#cp ././../dockerimages/nginx-$1.tar ././../dockerimages/$1
#cp ././../dockerimages/nginxhttps-$1.tar ././../dockerimages/$1

#zip -r V$1.zip ././../dockerimages/$1

#rm ././../dockerimages/V$1.zip
#mv V$1.zip ././../dockerimages/






