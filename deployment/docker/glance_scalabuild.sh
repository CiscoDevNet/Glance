#!/usr/bin/env bash
echo "Glance Docker Image version of Glanace Server:"
echo $1
echo "Image Server:"$2

echo "remove previous version:"
docker rmi $2:5000/glance/glancescala:$1

echo "build Glance Jar Docker Deployment Package"

#source ./build.sh

sudo docker build --rm=true --no-cache -t $2:5000/glance/glancescala:$1 ./glancescala
sudo docker push $2:5000/glance/glancescala:$1

echo "export tar file to dockerimages folder"

source ./glance_dockerimagexport_glancescala.sh $1 $2

