
var winston = require('./config/winston');

class JobsManager {
    constructor(jobWorkerEnabled, geoService) {
        this.geoService = geoService;
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