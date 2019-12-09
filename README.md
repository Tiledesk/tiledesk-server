[![npm version](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server.svg)](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server)

[![Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg?branch=master)](https://travis-ci.org/Tiledesk/tiledesk-server)

# Introduction

Tiledesk-server is the server engine of Tiledesk. Tiledesk is an Open Source Live Chat platform with integrated ChatBot written in NodeJs and Express. Build your own customer support with a multi-channel platform for Web, Android and iOS. More info here https://www.tiledesk.com.

# Prerequisites

* Nodejs and npm installed 

# Installation

Steps to run locally:
```
npm install -g @tiledesk/tiledesk-server mongodb-runner
mongodb-runner start
FIREBASE_CONFIG_FILE=<FIREBASE_CONFIG_PATH.json> DATABASE_URI=mongodb://localhost/test tiledesk-server  
```

Note: If installation with -g fails due to permission problems (npm ERR! code 'EACCES'), please refer to this [link](https://docs.npmjs.com/getting-started/fixing-npm-permissions).


# Running Tiledesk Server elsewhere

## Install from source code

* Clone this repo
* Install dependencies with 'npm install'
* Configure Firebase
   * Set Firebase "databaseURL" in config/firebase.js file
   * Set the chat21 "url" in config/chat21.js file
   * Download a firebase private key from Firebase Console and copy it under the root folder of the project
   * (Optionally)Set the following Firebase parameters: process.env.FIREBASE_PRIVATE_KEK, process.env.FIREBASE_CLIENT_EMAIL, process.env.FIREBASE_PROJECT_ID;
* Configure MongoDb account in config/database.js file
* Run the app with the command 'npm start' or with 'nodemon' if you want monitoring and auto reload.
Install nodemon with 'npm install -g nodemon'


## Deploy on Heroku

Deploy with button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Tiledesk/tiledesk-server)


To see the log run : 

```
heroku logs  -n 2000 --tail -a tiledesk-server
```


To use a custom domain with AWS Route 53 see https://devcenter.heroku.com/articles/route-53


# REST API

See the Tiledesk REST API [here](https://docs.tiledesk.com/apis/api)

