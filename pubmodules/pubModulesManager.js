
var winston = require('../config/winston');
var validtoken = require('../middleware/valid-token');
var roleChecker = require('../middleware/has-role');
var passport = require('passport');
require('../middleware/passport')(passport);

class PubModulesManager {

    constructor() {
        this.appRules = undefined;
        this.messageActions = undefined;
        this.emailNotification = undefined;
        
        this.eventsRoute = undefined;
        this.entityEraser = undefined;
        this.messageTransformer = undefined;

        this.scheduler = undefined;

        this.rasa = undefined;
        this.rasaRoute = undefined;

        this.apps = undefined;
        this.appsRoute = undefined;

        this.whatsapp = undefined;
        this.whatsappRoute = undefined;

        this.kaleyra = undefined;
        this.kaleyraRoute = undefined;

        this.activityArchiver = undefined;
        this.activityRoute = undefined;

        this.analyticsRoute = undefined;

        this.cannedResponseRoute = undefined;

        this.trigger = undefined;
        this.triggerRoute = undefined;

        this.tilebot = undefined;
        this.tilebotRoute = undefined;

        this.queue = undefined;

        this.jobsManager = undefined;

        this.routingQueue = undefined;

        this.cache = undefined;

        this.dialogFlow = undefined;
    }

  

    use(app) {
        
        if (this.rasaRoute) {
            app.use('/modules/rasa', this.rasaRoute);
            winston.info("ModulesManager rasaRoute controller loaded");       
        }
        if (this.appsRoute) {
            app.use('/modules/apps', this.appsRoute);
            winston.info("ModulesManager appsRoute controller loaded");       
        }
        if (this.whatsappRoute) {
            app.use('/modules/whatsapp', this.whatsappRoute);
            winston.info("ModulesManager whatsappRoute controller loaded");
        }
        if (this.kaleyraRoute) {
            app.use('/modules/kaleyra', this.kaleyraRoute);
            winston.info("ModulesManager kaleyraRoute controller loaded");
        }
        if (this.tilebotRoute) {
            app.use('/modules/tilebot', this.tilebotRoute);
            winston.info("ModulesManager tilebot controller loaded");       
        }

        if (this.dialogFlow) {
            app.use("/modules/dialogFlow", this.dialogFlow.dialogflowRoute);
            winston.info("ModulesManager dialogFlow controller loaded");       
        }

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
        

        if (this.activityRoute) {
            app.use('/:projectid/activities', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.activityRoute);
             winston.info("ModulesManager activities controller loaded");       
        }

        if (this.analyticsRoute) {
            app.use('/:projectid/analytics', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], this.analyticsRoute);
             winston.info("ModulesManager analytics controller loaded");       
         }

         if (this.cannedResponseRoute) {            
            app.use('/:projectid/canned', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], this.cannedResponseRoute);
            winston.info("ModulesManager canned controller loaded");       
        }

        if (this.triggerRoute) {
            app.use('/:projectid/modules/triggers', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.triggerRoute);
            winston.info("ModulesManager trigger controller loaded");       
        }

    }

   
    init(config) {
        winston.debug("PubModulesManager init");

        this.jobsManager = config.jobsManager;

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


        try {
            this.rasa = require('./rasa');
            winston.debug("this.rasa:"+ this.rasa);    
            this.rasa.listener.listen(config);      

            this.rasaRoute = this.rasa.rasaRoute;

            winston.info("PubModulesManager initialized rasa.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init rasa module not found");
            }else {
                winston.info("PubModulesManager error initializing init rasa module", err);
            }
        }

        try {
            this.apps = require('./apps');
            winston.debug("this.apps: " + this.apps);
            this.apps.listener.listen(config);

            this.appsRoute = this.apps.appsRoute;

            winston.info("PubModulesManager initialized apps.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init apps module not found");
            }else {
                winston.info("PubModulesManager error initializing init apps module", err);
            }
        }

        try {
            this.whatsapp = require('./whatsapp');
            winston.debug("this.whatsapp: " + this.whatsapp);
            this.whatsapp.listener.listen(config);

            this.whatsappRoute = this.whatsapp.whatsappRoute;

            winston.info("PubModulesManager initialized apps.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init apps module not found");
            }else {
                winston.info("PubModulesManager error initializing init apps module", err);
            }
        }
        
        try {
            this.kaleyra = require('./kaleyra');
            winston.debug("this.kaleyra: " + this.kaleyra);
            this.kaleyra.listener.listen(config);

            this.kaleyraRoute = this.kaleyra.kaleyraRoute;

            winston.info("PubModulesManager initialized apps.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init apps module not found");
            }else {
                winston.info("PubModulesManager error initializing init apps module", err);
            }
        }

        try {
            this.activityArchiver = require('./activities').activityArchiver;
            // this.activityArchiver.listen();
            winston.debug("this.activityArchiver:"+ this.activityArchiver);   
            
            this.activityRoute = require('./activities').activityRoute;
            winston.debug("this.activityRoute:"+ this.activityRoute);

            winston.info("ModulesManager activities initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init activities module not found");
            }else {
                winston.error("ModulesManager error initializing init activities module", err);
            }
        }


        try {
            this.analyticsRoute = require('./analytics').analyticsRoute;
            winston.debug("this.analyticsRoute:"+ this.analyticsRoute);        
            winston.info("ModulesManager analyticsRoute initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init analytics module not found");
            }else {
                winston.error("ModulesManager error initializing init analytics module", err);
            }
        }



        try {
            this.cannedResponseRoute = require('./canned').cannedResponseRoute;
            winston.debug("this.cannedResponseRoute:"+ this.cannedResponseRoute);        
            winston.info("ModulesManager cannedResponseRoute initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init canned module not found");
            }else {
                winston.error("ModulesManager error initializing init canned module", err);
            }
        }

      
        try {
            this.trigger = require('./trigger').start;
            winston.debug("this.trigger:"+ this.trigger);
            this.triggerRoute = require('./trigger').triggerRoute;
            winston.debug("this.triggerRoute:"+ this.triggerRoute);       
            winston.info("ModulesManager trigger initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init trigger module not found");
            }else {
                winston.error("ModulesManager error initializing init trigger module", err);
            }
        }
        



        try {
            this.tilebot = require('./tilebot');
            winston.debug("this.tilebot:"+ this.tilebot);    
            this.tilebot.listener.listen(config);      
            this.tilebotRoute = this.tilebot.tilebotRoute;

            winston.info("PubModulesManager initialized tilebot.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init tilebot module not found");
            }else {
                winston.info("PubModulesManager error initializing init tilebot module", err);
            }
        }




        try {
            this.queue = require('./queue');
            winston.debug("this.queue:"+ this.queue);                

            winston.info("PubModulesManager initialized queue.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') { 
                winston.info("PubModulesManager init queue module not found");
            }else {
                winston.info("PubModulesManager error initializing init queue module", err);
            }
        }




        try {
            this.routingQueue = require('./routing-queue').listener;
            // this.routingQueue.listen();
            winston.debug("this.routingQueue:"+ this.routingQueue);           

            winston.info("PubModulesManager routing queue initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init routing queue module not found");
            }else {
                winston.error("PubModulesManager error initializing init routing queue module", err);
            }
        }


        try {            
            this.cache = require('./cache').cachegoose(config.mongoose);            
            winston.debug("this.cache:"+ this.cache);           
            winston.info("PubModulesManager cache initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init cache module not found");
            }else {
                winston.error("PubModulesManager error initializing init cache module", err);
            } 
        }

        

        try {
            this.dialogFlow = require('./dialogflow');
            winston.debug("this.dialogFlow:"+ this.dialogFlow);           
            this.dialogFlow.listener.listen(config);
            winston.info("PubModulesManager dialogFlow  initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init dialogFlow module not found");
            }else {
                winston.error("PubModulesManager error initializing init dialogFlow module", err);
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
                this.messageTransformer.messageHandlebarsTransformerInterceptor.listen();
                winston.info("PubModulesManager messageTransformer started.");   
            } catch(err) {        
                winston.info("PubModulesManager error starting messageTransformer module", err);            
            }
            
        }
        
        // job_here
        if (this.emailNotification) {
            try {
                // this.emailNotification.requestNotification.listen();
                this.jobsManager.listenEmailNotification(this.emailNotification);
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

        // job_here
        if (this.activityArchiver) {
            try {
                // this.activityArchiver.listen();
                this.jobsManager.listenActivityArchiver(this.activityArchiver);
                winston.info("PubModulesManager activityArchiver started");
            } catch(err) {        
                winston.info("PubModulesManager error starting activityArchiver module", err);            
            }
        }


        if (this.routingQueue) {
            try {
                this.routingQueue.listen();
                winston.info("PubModulesManager routingQueue started");
            } catch(err) {        
                winston.info("PubModulesManager error starting routingQueue module", err);            
            }
        }

        // if (this.dialogFlow) {
        //     try {
        //         this.dialogFlow.listen();
        //         winston.info("PubModulesManager dialogFlow started");
        //     } catch(err) {        
        //         winston.info("PubModulesManager error starting dialogFlow module", err);            
        //     }
        // }


    }


     
}

var pubModulesManager = new PubModulesManager();
module.exports = pubModulesManager;
