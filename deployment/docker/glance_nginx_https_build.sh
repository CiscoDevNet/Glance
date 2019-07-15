#!/usr/bin/env bash
echo "nginxhttps version"
echo $1
echo "Image Server:"
echo $2

echo "remove previous version"

docker rmi $2:5000/glance/nginxhttps:$1
sudo docker build --rm=true --no-cache -t $2:5000/glance/nginxhttps:$1 ./glancenginxhttps

sudo docker push $2:5000/glance/nginxhttps:$1


echo "export tar file to dockerimages folder"

source ./glance_dockerimagexport_glancenginxhttps.sh $1 $2
