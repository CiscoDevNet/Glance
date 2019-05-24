#!/usr/bin/env bash
echo "glancescala version:"$1
echo "Image server:"$2

docker save -o ../dockerimages/glancescala-$1.tar $2:5000/glance/glancescala:$1
chmod 755 ../dockerimages/glancescala-$1.tar

