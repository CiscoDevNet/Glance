#!/usr/bin/env bash
echo "build Glance Jar Deployment Package"

cd ../..
rm -rf ./deployment/docker/glancescala/glance.jar

./activator assembly
cp ./target/scala-2.11/Glance-assembly-1.0-SNAPSHOT.jar ./deployment/docker/glancescala/glance.jar
cd ./deployment/docker/


