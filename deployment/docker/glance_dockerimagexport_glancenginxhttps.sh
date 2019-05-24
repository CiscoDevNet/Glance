#!/usr/bin/env bash
echo "nginxhttps version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/nginxhttps-$1.tar $2:5000/glance/nginxhttps:$1
chmod 755 ../dockerimages/nginxhttps-$1.tar

