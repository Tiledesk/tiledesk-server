
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
        this.whatsappWorker = undefined;
     
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
        
        // this.botEvent.listen(); // disabled

        // this.subscriptionNotifier.start();
        this.subscriptionNotifierQueued.start();

        // this.botSubscriptionNotifier.start(); // disabled
    }

    listenEmailNotification(emailNotification) {      
        winston.info("JobsManager listenEmailNotification started");  
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Email Notification");  
        }
        this.emailNotification = emailNotification;
        this.emailNotification.requestNotification.listen();
    }

    listenRoutingQueue(routingQueue) {
        winston.info("JobsManager routingQueue started");  
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for routingQueue");  
        }
        this.routingQueue = routingQueue;
        this.routingQueue.listen();
    }

    listenScheduler(scheduler) {
        winston.info("JobsManager scheduler started");  
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for scheduler");  
        }
        this.scheduler = scheduler;
        this.scheduler.taskRunner.start();    
    }

    listenActivityArchiver(activityArchiver) {
        winston.info("JobsManager listenActivityArchiver started"); 
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Activity Archiver");  
        } 
        this.activityArchiver = activityArchiver;
        this.activityArchiver.listen();
    }

    listenWhatsappQueue(whatsappQueue) {
        console.log("JobsManager listenWhatsappQueue started");
        console.log("whatsappQueue is: ", whatsappQueue)
        if ( this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Whatsapp Queue");  
        }
        // this.whatsappWorker = whatsappQueue;
        // this.whatsappQueue.listen(); // oppure codice
    }

    listenTrainingQueue(trainingQueue) {
        console.log("JobsManager listenTrainingQueue started");
        console.log("trainingQueue is: ", trainingQueue)
        if (this.jobWorkerEnabled == true) {
            return winston.info("JobsManager jobWorkerEnabled is enabled. Skipping listener for Training Queue");  
        }
    }
}


module.exports = JobsManager;