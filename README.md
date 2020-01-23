[![npm version](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server.svg)](https://badge.fury.io/js/%40tiledesk%2Ftiledesk-server)

[![Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg?branch=dev)](https://travis-ci.org/Tiledesk/tiledesk-server)

# Introduction

Tiledesk-server is the server engine of Tiledesk. Tiledesk is an Open Source Live Chat platform with integrated ChatBot written in NodeJs and Express. Build your own customer support with a multi-channel platform for Web, Android and iOS. More info here https://www.tiledesk.com.

# Prerequisites

* Nodejs and npm installed 

# Installation

Steps to run with npm:
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
* Configure the tiledesk .env file. You can see an example in the file .env.sample under the root folder. Rename it from .env.sample to .env and configure it properly. 
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

See the Tiledesk REST API [here](https://developer.tiledesk.com/apis/api)
