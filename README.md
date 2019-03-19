[![npm version](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server.svg)](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server)

[![Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg?branch=master)](https://travis-ci.org/Tiledesk/tiledesk-server)

# Prerequisites

* Nodejs and npm installed 
* MongoDB installed and running on localhost

# Installation and running
Step to run locally:

* Clone this repo
* Install dependencies with 'npm install'
* Configure Firebase
   * Set Firebase databaseURL in config/firebase.js file
   * Set the following Firebase parameters: process.env.FIREBASE_PRIVATE_KEK, process.env.FIREBASE_CLIENT_EMAIL, process.env.FIREBASE_PROJECT_ID;
* Configure MongoDb account in config/database.js file
* Run the app with the command 'npm start' or with 'nodemon' if you want monitoring and auto reload.
Install nodemon with 'npm install -g nodemon'


# Deploy on Heroku

To see the log run : 

```
heroku logs  -n 2000 --tail -a chat21-api-nodejs
```


To use a custom domain with AWS Route 53 see https://devcenter.heroku.com/articles/route-53

# Docker compose

## Installation

```
sudo curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose up -d --force-recreate --build

```

### Docker commands:
```
docker ps
docker-compose up
```

# REST API

See the Tiledesk REST API [here](./docs/api.md)
