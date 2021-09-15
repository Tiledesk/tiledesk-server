
var winston = require('../config/winston');
// var validtoken = require('../middleware/valid-token');
// var roleChecker = require('../middleware/has-role');
// var passport = require('passport');
// require('../middleware/passport')(passport);


class PubModulesManager {

    constructor() {
        this.appRules = undefined;
        this.messageActions = undefined;
        this.emailNotification = undefined;
        
        this.eventsRoute = undefined;
        this.entityEraser = undefined;
        this.messageTransformer = undefined;

        this.scheduler = undefined;
    }

  

    use(app) {
        
    }
    useUnderProjects(app) {
        var that = this;
        winston.debug("PubModulesManager using controllers");     


        //  dario riesce con jwt custom di progettto a a scrivere events di progetto b
        if (this.eventsRoute) {
            app.use('/:projectid/events', this.eventsRoute);
            // app.use('/:projectid/events', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('guest')], this.eventsRoute);
            winston.info("ModulesManager eventsRoute controller loaded");       
        }
        
    }

   
    init() {
        winston.debug("PubModulesManager init");

        try {
            this.appRules = require('./rules/appRules');
            // this.appRules.start();
            winston.info("PubModulesManager initialized rules.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init rules module not found");
            }else {
                winston.info("PubModulesManager error initializing init rules module", err);
            }
        }

        try {
            this.messageActions = require('./messageActions');
            winston.debug("this.messageActions:"+ this.messageActions);
            // this.messageActions.messageActionsInterceptor.listen();
            winston.info("PubModulesManager initialized messageActions.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init messageActions module not found");
            }else {
                winston.info("PubModulesManager error initializing init messageActions module", err);
            }
        }

        try {
            this.messageTransformer = require('./messageTransformer');
            winston.debug("this.messageTransformer:"+ this.messageTransformer);
            // this.messageTransformer.messageTransformerInterceptor.listen();
            // this.messageTransformer.microLanguageTransformerInterceptor.listen();
            winston.info("PubModulesManager initialized messageTransformer.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init messageTransformer module not found");
            }else {
                winston.info("PubModulesManager error initializing init messageTransformer module", err);
            }
        }
        
        
        
         try {
            this.emailNotification = require('./emailNotification');
            winston.debug("this.emailNotification:"+ this.emailNotification);
            // this.emailNotification.requestNotification.listen();
            winston.info("PubModulesManager initialized requestNotification loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init emailNotification module not found");
            }else {
                winston.info("PubModulesManager error initializing init emailNotification module", err);
            }
        }
        

        try {           
            this.eventsRoute = require('./events/eventRoute');
            winston.debug("this.eventRoute:"+ this.eventsRoute);          
            winston.info("PubModulesManager initialized eventsRoute.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init eventsRoute module not found");
            }else {
                winston.info("PubModulesManager error initializing init eventsRoute module", err);
            }
        }

        
        try {
            this.entityEraser = require('./entityEraser');
            winston.debug("this.entityEraser:"+ this.entityEraser);
            // this.entityEraser.eraserInterceptor.listen();
            winston.info("PubModulesManager initialized entityEraser.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init entityEraser module not found");
            }else {
                winston.info("PubModulesManager error initializing init entityEraser module", err);
            }
        }



        try {
            this.scheduler = require('./scheduler');
            winston.debug("this.scheduler:"+ this.scheduler);    
            // this.scheduler.taskRunner.start();        
            winston.info("PubModulesManager initialized scheduler.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init scheduler module not found");
            }else {
                winston.info("PubModulesManager error initializing init scheduler module", err);
            }
        }


      
        
    }

    start() {
        if (this.appRules) {
            try {
                this.appRules.start();
                winston.info("PubModulesManager appRules started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting appRules module", err);            
            }
        }
        
        if (this.messageActions) {
            try {
                this.messageActions.messageActionsInterceptor.listen();
                winston.info("PubModulesManager messageActions started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting messageActions module", err);            
            }
        }
        

        if (this.messageTransformer) {
            try {
                this.messageTransformer.messageTransformerInterceptor.listen();
                this.messageTransformer.microLanguageTransformerInterceptor.listen();    
                winston.info("PubModulesManager messageTransformer started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting messageTransformer module", err);            
            }
            
        }
        
        if (this.emailNotification) {
            try {
                this.emailNotification.requestNotification.listen();
                winston.info("PubModulesManager emailNotification started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting requestNotification module", err);            
            }
        }
        
        if (this.scheduler) {
            try {
                this.scheduler.taskRunner.start();     
                winston.info("PubModulesManager scheduler started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting scheduler module", err);            
            }
        } 


    }


    
}

var pubModulesManager = new PubModulesManager();
module.exports = pubModulesManager;
