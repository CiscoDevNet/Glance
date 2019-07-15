#!/usr/bin/env bash
echo "rabbitmq version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/rabbitmq-$1.tar $2:5000/glance/rabbitmq:$1
chmod 755 ../dockerimages/rabbitmq-$1.tar

