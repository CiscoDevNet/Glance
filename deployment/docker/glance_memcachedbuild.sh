#!/usr/bin/env bash
echo "Glance Docker Image version of Memcached Server:"
echo $1
echo "Image Server:"$2

echo "remove the previous version"

docker rmi $2:5000/glance/memcached:$1
echo "build Glance Memcached Docker Deployment Package"

#source ./build.sh

sudo docker build --rm=true --no-cache -t $2:5000/glance/memcached:$1 ./glancememcached
sudo docker push $2:5000/glance/memcached:$1


echo  "export tar file to dockerimages folder"

source ./glance_dockerimagexport_glancememcached.sh $1 $2
