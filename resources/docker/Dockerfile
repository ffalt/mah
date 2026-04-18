FROM nginx:alpine

ARG MAH_VERSION=1.18.3

RUN apk add --no-cache curl unzip && \
	MAH_VERSION_US=$(echo "${MAH_VERSION}" | tr '.' '_') && \
	curl -fSL -o /tmp/mah.zip "https://github.com/ffalt/mah/releases/download/v${MAH_VERSION}/webapp-mah-${MAH_VERSION_US}.zip" && \
	rm -rf /usr/share/nginx/html/* && \
	unzip -o /tmp/mah.zip -d /usr/share/nginx/html && \
	rm -f /tmp/mah.zip && \
	apk del curl unzip

EXPOSE 80

