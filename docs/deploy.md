
# Docker compose

## Installation

```
sudo curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose up -d --force-recreate --build

```

# Docker Compose:

sudo docker-compose up --force-recreate --build


sudo docker-compose up  --env-file ./.env.list --force-recreate --build

# Docker:

## Build the Docker Image

```
docker build -t tiledesk/tiledesk-server .

```

## Run Docker Container

```
docker run -p 3000:3000 tiledesk/tiledesk-server
```

## Usefull commands
```
docker images
docker ps
docker-compose up
```

# Remove Container
```
docker container ls -a
docker container rm id 
```


```
docker run --name my-mongo -d mongo
sudo docker run --env-file ./.env.list --link my-mongo:mongo tiledesk-server
```


Example .env.list file

FIREBASE_APIKEY=123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-a0r162123@chat21-pre23-01.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMXYX
FIREBASE_PROJECT_ID=tiledesk321-pre-01
DATABASE_URI=mongodb://mongo/test


# Tag an image referenced by Name and Tag
To tag a local image with name “httpd” and tag “test” into the “fedora” repository with “version1.0.test”:

docker tag tiledesk-server:test tiledesk/tiledesk-server:version1.0.5.test

## Publish docker image

docker login with username (not email) and password 
docker push tiledesk/tiledesk-server:latest

https://buddy.works/guides/how-dockerize-node-application


== non usate ==

docker run --name my-tiledesk-server --link my-mongo:mongo -d tiledesk-server -e FIREBASE_CONFIG_FILE=<FIREBASE_CONFIG_PATH.json> -e DATABASE_URI=mongodb://localhost/test


sudo docker run --name my-tiledesk-server --link my-mongo:mongo -d tiledesk-server -e FIREBASE_CONFIG_FILE=/Users/andrealeo/dev/chat21/tiledesk-server/.firebasekey.json -e DATABASE_URI=mongodb://localhost/test


sudo docker run --env FIREBASE_CONFIG_FILE="/Users/andrealeo/dev/chat21/tiledesk-server/.firebasekey.json" tiledesk-server



sudo docker run --env-file FIREBASE_CONFIG_FILE="/home/andrea/dev/tiledesk-server/.firebasekey.json" tiledesk-server


sudo docker run --env DATABASE_URI="mongodb://10.108.109.1/test" --env-file ./.env.list --link my-mongo:mongo tiledesk-server
