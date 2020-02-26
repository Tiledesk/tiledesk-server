[![npm version](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server.svg)](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server)

[![Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg)](https://travis-ci.org/Tiledesk/tiledesk-server)

[![Dev branch Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg?branch=dev)](https://travis-ci.org/Tiledesk/tiledesk-server/dev)

# Introduction

Tiledesk-server is the server engine of Tiledesk. Tiledesk is an Open Source Live Chat platform with integrated ChatBot written in NodeJs and Express. Build your own customer support with a multi-channel platform for Web, Android and iOS. More info here https://www.tiledesk.com.

You can find more info here: https://developer.tiledesk.com

# Prerequisites

* [Nodejs](https://www.npmjs.com/) and npm installed 
* [MongoDb](https://www.mongodb.com) installed

# Running Tiledesk Server

## Run locally with npm

Steps to run with npm:

```
npm install -g @tiledesk/tiledesk-server mongodb-runner
mongodb-runner start
curl https://raw.githubusercontent.com/Tiledesk/tiledesk-server/master/.env.sample --output .env
nano .env #configure .env file properly
tiledesk-server  
```

If you want to load .env file from another path: `DOTENV_PATH=/MY/ABSOLUTE/PATH/.env tiledesk-server`

Note: If installation with -g fails due to permission problems (npm ERR! code 'EACCES'), please refer to this [link](https://docs.npmjs.com/getting-started/fixing-npm-permissions).


## Using Docker


### Configure .env file 
```
curl https://raw.githubusercontent.com/Tiledesk/tiledesk-server/master/.env.sample --output .env
nano .env #configure .env file properly
```

### Running
If you want to run tiledesk and mongo with docker run :

```
docker run -p 3000:3000 --env DATABASE_URI="mongodb://mongo/tiledesk-server" --env-file .env --link tiledesk-mongo:mongo tiledesk/tiledesk-server
```

Otherwise if you want to run tiledesk only with docker run :

```
docker run -p 3000:3000 --env DATABASE_URI="mongodb://YOUR_MONGO_INSTALLATION_ENDPOINT/tiledesk-server" --env-file .env tiledesk/tiledesk-server
```

## Install from source code

* Clone this repo
* Install dependencies with `npm install`
* Configure the tiledesk .env file. You can see an example in the file .env.sample under the root folder. Rename it from .env.sample to .env and configure it properly. 
* Run the app with the command `npm start` or with `nodemon` if you want monitoring and auto reload. Install nodemon with `npm install -g nodemon`


## Deploy on Heroku

Deploy with button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Tiledesk/tiledesk-server)


# REST API

See the Tiledesk REST API [here](https://developer.tiledesk.com/apis/api)








