#!/usr/bin/env bash
echo "nginx version"
echo $1
echo "Image Server:"
echo $2

echo "remove previous version"

docker rmi $2:5000/glance/nginx:$1
sudo docker build --rm=true --no-cache -t $2:5000/glance/nginx:$1 ./glancenginx

sudo docker push $2:5000/glance/nginx:$1


echo "export tar file to dockerimages folder"

source ./glance_dockerimagexport_glancenginx.sh $1 $2
