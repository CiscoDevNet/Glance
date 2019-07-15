#!/usr/bin/env bash
echo "RabbitMQ docker Version:"
echo $1
echo "Image Server:"$2

echo "remove previous version"

docker rmi $2:5000/glance/rabbitmq:$1

sudo docker build --rm=true --no-cache -t $2:5000/glance/rabbitmq:$1 ./glancerabbitmq
sudo docker push $2:5000/glance/rabbitmq:$1


echo "expport tar file to dockerimages folder"

source ./glance_dockerimagexport_glancerabbitmq.sh $1 $2
