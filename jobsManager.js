
var winston = require('./config/winston');

class JobsManager {
    constructor(jobWorkerEnabled, geoService, botEvent, subscriptionNotifierQueued, botSubscriptionNotifier) {
        this.geoService = geoService;
        this.botEvent = botEvent;
        // this.subscriptionNotifier = subscriptionNotifier;
        this.subscriptionNotifierQueued = subscriptionNotifierQueued;
        this.botSubscriptionNotifier = botSubscriptionNotifier;

        this.emailNotificatio = undefined;
        this.activityArchiver = undefined;
     
        this.jobWorkerEnabled = jobWorkerEnabled;
        // this.jobWorkerEnabled = false;
        // if (process.env.JOB_WORKER_ENABLED=="true" || process.env.JOB_WORKER_ENABLED == true) {
        //     this.jobWorkerEnabled = true;
        // }
        // winston.info("JobsManager jobWorkerEnabled: "+ this.jobWorkerEnabled);  
    }


    listen() {      
        winston.info("JobsManager listener started");  
        if ( this.jobWorkerEnabled == true) {
           return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listeners");  
        }
        this.geoService.listen();
        this.botEvent.listen();

        // this.subscriptionNotifier.start();
        this.subscriptionNotifierQueued.start();

        this.botSubscriptionNotifier.start();
    }

    listenEmailNotification(emailNotification) {      
        winston.info("JobsManager listenEmailNotification started");  
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Email Notification");  
        }
        this.emailNotification = emailNotification;
        this.emailNotification.requestNotification.listen();
    }

   

    listenActivityArchiver(activityArchiver) {
        winston.info("JobsManager listenActivityArchiver started"); 
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Activity Archiver");  
        } 
        this.activityArchiver = activityArchiver;
        this.activityArchiver.listen();
    }
}


module.exports = JobsManager;