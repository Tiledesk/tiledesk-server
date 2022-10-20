
var dotenvPath = undefined;

if (process.env.DOTENV_PATH) {
  dotenvPath = process.env.DOTENV_PATH;
  console.log("load dotenv form DOTENV_PATH", dotenvPath);
}

if (process.env.LOAD_DOTENV_SUBFOLDER ) {
  console.log("load dotenv form LOAD_DOTENV_SUBFOLDER");
  dotenvPath = __dirname+'/confenv/.env';
}

require('dotenv').config({ path: dotenvPath});


var mongoose = require('mongoose');

let winston = require('./config/winston');
let JobsManager = require('./jobsManager');


let geoService = require('./services/geoService');
var config = require('./config/database');


//override JOB_WORKER_ENABLED to false when you start jobs.js
process.env.JOB_WORKER_ENABLED=false

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;
var autoIndex = true;

if (!databaseUri) { //TODO??
  winston.warn('DATABASE_URI not specified, falling back to localhost.');
}

var connection = mongoose.connect(databaseUri, { "useNewUrlParser": true, "autoIndex": autoIndex }, function(err) {
  if (err) { 
    winston.error('Failed to connect to MongoDB on ' + databaseUri + " ", err);
    process.exit(1);
  }
});

// winston.info("mongoose.connection",mongoose.connection);
// module.exports = jobsManager;



async function main()
{

    require('./pubmodules/queue');     
    // require('@tiledesk-ent/tiledesk-server-queue');     

    let jobsManager = new JobsManager(undefined, geoService);

    jobsManager.listen();


    let emailNotification = require('./pubmodules/emailNotification');
    jobsManager.listenEmailNotification(emailNotification);

   
    let activityArchiver = require('./pubmodules/activities').activityArchiver;    
    jobsManager.listenActivityArchiver(activityArchiver);

    winston.info("Jobs started"); 

    await new Promise(function () {});
    console.log('This text will never be printed');
}

function panic(error)
{
    console.error(error);
    process.exit(1);
}

// https://stackoverflow.com/a/46916601/1478566
main().catch(panic).finally(clearInterval.bind(null, setInterval(a=>a, 1E9)));