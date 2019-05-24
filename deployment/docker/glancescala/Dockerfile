FROM 	java
#FROM 	webdizz/centos-java8

RUN  	cd $home \
		&& mkdir glance
ADD   	glance.jar /root/glance/glance.jar

CMD 	java -jar -Dhttp.port=80 /root/glance/glance.jar

EXPOSE  80
