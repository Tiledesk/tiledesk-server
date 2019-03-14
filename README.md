[![NPM Version][npm-image]][npm-url]
  
[![Build Status](https://travis-ci.org/Tiledesk/tiledesk-server.svg?branch=master)](https://travis-ci.org/Tiledesk/tiledesk-server)

# Prerequisites

* Nodejs and npm installed 
* MongoDB installed and running on localhost

# Installation and running
Step to run locally:

* Clone this repo
* Install dependencies with 'npm install'

* Run the app with the command 'npm start' or with 'nodemon' if you want monitoring and auto reload.

        Install nodemon with 'npm install -g nodemon'

# Commit to GitHub with tags:
Run the command : 'git push origin --tags'

# Deploy on Heroku

To see the log run : 'heroku logs  -n 2000 --tail -a chat21-api-nodejs'


To use a custom domain with AWS Route 53 see https://devcenter.heroku.com/articles/route-53

# Docker compose

## Installation
* sudo curl -L https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

* sudo chmod +x /usr/local/bin/docker-compose

* docker-compose up -d --force-recreate --build

### Docker commands:
* docker ps
* docker-compose up

# REST API

See the Tiledesk REST API [here](./docs/api.md)
