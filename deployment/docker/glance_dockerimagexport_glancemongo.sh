#!/usr/bin/env bash
echo "Mongo version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/mongo-$1.tar $2:5000/glance/mongo:$1
chmod 755 ../dockerimages/mongo-$1.tar

