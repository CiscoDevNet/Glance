#!/usr/bin/env bash
echo "Glance Docker Image version of Glanace Server:"
echo $1
echo "Image Server:"$2

echo "remvoe previous version"

docker rmi $2:5000/glance/mongo:$1
echo "build Glance Mongo Docker Deployment Package"

#source ./build.sh

sudo docker build --rm=true --no-cache -t $2:5000/glance/mongo:$1 ./glancemongo
sudo docker push $2:5000/glance/mongo:$1


echo "export tar file to dockerimages folder"

source ./glance_dockerimagexport_glancemongo.sh $1 $2
