FROM node:16.13-bullseye as builder

COPY $PWD .

RUN apt update && apt install -y apt-utils
RUN npm ci
RUN npm run build:deb
