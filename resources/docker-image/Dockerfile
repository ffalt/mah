FROM nginx:alpine

RUN apk upgrade --no-cache
RUN rm -rf /usr/share/nginx/html/*
COPY ./dist /usr/share/nginx/html

EXPOSE 80
