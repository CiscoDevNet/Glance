FROM 	nginx:1.15.0
RUN  	rm -v /etc/nginx/nginx.conf
ADD 	nginx.conf 	/etc/nginx/
RUN 	mkdir /etc/nginx/tls
ADD     glance.pem 	/etc/nginx/tls/glance.cert.pem
ADD		glance.key  /etc/nginx/tls/glance.key.pem
ADD		glance.pass /etc/nginx/tls/glance.pass

VOLUME  /etc/nginx/tls

EXPOSE 	443 80

CMD service nginx start \
	&& service nginx restart

#CMD 	echo "$GS1 gs1" >> /etc/hosts \
#	&& echo "$GS2 gs2" >> /etc/hosts \
#	&& service nginx start \
#	&& service nginx restart


