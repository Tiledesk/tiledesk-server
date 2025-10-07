
let dotenvPath = undefined;

if (process.env.DOTENV_PATH) {
  dotenvPath = process.env.DOTENV_PATH;
  console.log("load dotenv form DOTENV_PATH", dotenvPath);
}

if (process.env.LOAD_DOTENV_SUBFOLDER ) {
  console.log("load dotenv form LOAD_DOTENV_SUBFOLDER");
  dotenvPath = __dirname+'/confenv/.env';
}

require('dotenv').config({ path: dotenvPath});


let mongoose = require('mongoose');

let winston = require('./config/winston');
let JobsManager = require('./jobsManager');


let geoService = require('./services/geoService');
// let subscriptionNotifier = require('./services/subscriptionNotifier');
let subscriptionNotifierQueued = require('./services/subscriptionNotifierQueued');
let botSubscriptionNotifier = require('./services/BotSubscriptionNotifier');

const botEvent = require('./event/botEvent');
let channelManager = require('./channels/channelManager');

let updateLeadQueued = require('./services/updateLeadQueued');


require('./services/mongoose-cache-fn')(mongoose);


let config = require('./config/database');


//override JOB_WORKER_ENABLED to false when you start jobs.js
process.env.JOB_WORKER_ENABLED=false

let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;
let autoIndex = true;

if (!databaseUri) { //TODO??
  winston.warn('DATABASE_URI not specified, falling back to localhost.');
}

let connection = mongoose.connect(databaseUri, { "useNewUrlParser": true, "autoIndex": autoIndex }, function(err) {
  if (err) { 
    winston.error('Failed to connect to MongoDB on ' + databaseUri + " ", err);
    process.exit(1);
  }
winston.info("Mongoose connection done on host: "+mongoose.connection.host + " on port: " + mongoose.connection.port + " with name: "+ mongoose.connection.name)// , mongoose.connection.db);
});
// winston.info("mongoose.connection",mongoose.connection);
// module.exports = jobsManager;



async function main()
{

  ////************* LOAD QUEUE ************ //
  require('./pubmodules/cache').cachegoose(mongoose);            
      

  ////************* LOAD CONCIERGE BOT ************ //
  require('./pubmodules/rules/appRules').start();


  // require('./pubmodules/trigger/rulesTrigger').listen(); request.close trigger event is not triggered by anyone now?
   

  //************* LOAD QUEUE ************ //
  require('./pubmodules/queue');   
    // require('@tiledesk-ent/tiledesk-server-queue');     

   //************* LOAD CHAT21 ************ //
   channelManager.listen(); // chat21Handler is loaded with stadard events like request.create and NOT request.create.queue because it is used internally by the worker when the request is closed by ChatUnhandledRequestScheduler

    


    let jobsManager = new JobsManager(undefined, geoService, botEvent, subscriptionNotifierQueued, botSubscriptionNotifier, updateLeadQueued);

    jobsManager.listen();


    let emailNotification = require('./pubmodules/emailNotification');
    jobsManager.listenEmailNotification(emailNotification);

   
    let activityArchiver = require('./pubmodules/activities').activityArchiver;    
    jobsManager.listenActivityArchiver(activityArchiver);


    let routingQueueQueued = require('./pubmodules/routing-queue').listenerQueued;
    winston.debug("routingQueueQueued"); 
    jobsManager.listenRoutingQueue(routingQueueQueued);

    // let whatsappQueue = require('@tiledesk/tiledesk-whatsapp-jobworker');
    // winston.info("whatsappQueue");
    // jobsManager.listenWhatsappQueue(whatsappQueue);

    let scheduler = require('./pubmodules/scheduler');    
    jobsManager.listenScheduler(scheduler);

    let multiWorkerQueue = require('@tiledesk/tiledesk-multi-worker');
    jobsManager.listenMultiWorker(multiWorkerQueue);


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