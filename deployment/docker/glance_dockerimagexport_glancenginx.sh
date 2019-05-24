#!/usr/bin/env bash
echo "nginx version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/nginx-$1.tar $2:5000/glance/nginx:$1
chmod 755 ../dockerimages/nginx-$1.tar

