#!/usr/bin/env bash
echo "Mongo version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/memcached-$1.tar $2:5000/glance/memcached:$1
chmod 755 ../dockerimages/memcached-$1.tar

