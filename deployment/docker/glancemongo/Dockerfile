#Using the prebuild base mongo docker image
#FROM 	localhost:5000/glance/mongo:2.0.0.10
FROM mongo:3.6
# Modify child mongo to use /data/db2 as dbpath (because /data/db wont persist the build)
RUN mkdir -p /data/db2 \
    && echo "dbpath = /data/db2" > /etc/mongodb.conf \
    && chown -R mongodb:mongodb /data/db2

#COPY . /data/db2
RUN mkdir -p /dataimport
ADD data/glance3d  /dataimport/glance3d

RUN mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db2 --smallfiles \
	&& mongorestore --db glance3d  /dataimport/glance3d \
	&& rm -rf /dataimport/glance3d \
	&& mongod --dbpath /data/db2 --shutdown \
   	&& chown -R mongodb /data/db2
	
	
# Make the new dir a VOLUME to persists it 
#VOLUME /data/db2

CMD ["mongod", "--config", "/etc/mongodb.conf", "--smallfiles"]

EXPOSE 	27017


