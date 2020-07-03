
var winston = require('../config/winston');
var validtoken = require('../middleware/valid-token');
var roleChecker = require('../middleware/has-role');
var passport = require('passport');
require('../middleware/passport')(passport);


class ModulesManager {

    constructor() {
        this.trigger = undefined;
        this.triggerRoute = undefined;
        this.stripe = undefined;
        this.graphql = undefined;
        this.analyticsRoute = undefined;
        this.resthookRoute = undefined;
        this.elasticIndexer = undefined;
        this.activityArchiver = undefined;
        this.activityRoute = undefined;
        this.facebookRoute = undefined;
        this.jwthistoryArchiver = undefined;
        this.jwthistoryRoute = undefined;
        this.dialogflowListener = undefined;
        this.requestHistoryArchiver = undefined;
        this.requestHistoryRoute = undefined;
        this.routingQueue = undefined;
        this.queue = undefined;
        this.cache = undefined;
        this.cannedResponseRoute = undefined;
        this.tagRoute = undefined;
        this.groupsRoute = undefined;
        this.visitorCounterRoute = undefined;
        this.visitorCounterMiddleware = undefined;
        this.widgetsRoute = undefined;
    }

    injectBefore(app) {
        winston.info("ModulesManager injectBefore");
        var res;
        try {
            // this.graphql = require('../../../modules/graphql/apollo-express');   
            this.graphql = require('@tiledesk-ent/tiledesk-server-graphql').apolloExpress;
           
             res = this.graphql.injectBefore(app);     
            winston.info("ModulesManager injectBefore graphql loaded",res);
          
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager injectBefore graphql module not found", err);
            }else {
                winston.error("ModulesManager error initializing graphql module", err);
            }
            
        }
        return res;
    }

    injectAfter(httpServer,app,port) {
        winston.info("ModulesManager inject");
        try {          
            return this.graphql.injectAfter(httpServer,app,port);    
            winston.info("ModulesManager injectAfter graphql loaded");
        } catch(err) {
            winston.info("ModulesManager injectAfter graphql module not found", err);
        }
    }

    use(app) {
        var that = this;
        // winston.info("ModulesManager using controllers");  

        if (this.stripe) {
            app.use('/modules/payments/stripe', this.stripe);
            winston.info("ModulesManager stripe controller loaded");       
        }


        if (this.jwthistoryRoute) {
            app.use('/jwt/history', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], this.jwthistoryRoute);
            winston.info("ModulesManager jwthistory controller loaded");       
        }

        
    }
    useUnderProjects(app) {
        var that = this;
        winston.debug("ModulesManager using controllers");       

      
        if (this.triggerRoute) {
            app.use('/:projectid/modules/triggers', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.triggerRoute);
            winston.info("ModulesManager trigger controller loaded");       
        }
      
        if (this.analyticsRoute) {
           app.use('/:projectid/analytics', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], this.analyticsRoute);
            winston.info("ModulesManager analytics controller loaded");       
        }
      
        if (this.resthookRoute) {
           app.use('/:projectid/subscriptions', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.resthookRoute);
           winston.info("ModulesManager subscriptions controller loaded");       
        }

        if (this.activityRoute) {
            app.use('/:projectid/activities', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.activityRoute);
             winston.info("ModulesManager activities controller loaded");       
        }

     
        if (this.requestHistoryRoute) {
            app.use('/:projectid/requests/:request_id/history', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes(null, ['subscription'])] , this.requestHistoryRoute);
            winston.info("ModulesManager requestHistory controller loaded"); 
        }


        if (this.cannedResponseRoute) {            
            app.use('/:projectid/canned', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], this.cannedResponseRoute);
            winston.info("ModulesManager canned controller loaded");       
        }

        if (this.tagRoute) {     
            app.use('/:projectid/tags', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], this.tagRoute);
            winston.info("ModulesManager tag controller loaded");       
        }

        if (this.groupsRoute) {     
            app.use('/:projectid/groups', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.groupsRoute);
            winston.info("ModulesManager group controller loaded");       
        }



        if (this.visitorCounterRoute) {     
            app.use('/:projectid/visitorcounter', this.visitorCounterRoute);
            winston.info("ModulesManager visitorcounter controller loaded");       
        }
        // app.use( '/:projectid/widgets', require('@tiledesk-ent/tiledesk-server-visitorcounter').visitorCounterMiddleware);

        if (this.widgetsRoute) {
            this.widgetsRoute.use(this.visitorCounterMiddleware);
            winston.info("ModulesManager visitorCounterMiddleware  loaded");       
            // console.log("8888",this.visitorCounterMiddleware, this.widgetsRoute.stack)
        }
      

        
    }

   
    init(config) {
        winston.debug("ModulesManager init");


        try {
            this.trigger = require('@tiledesk-ent/tiledesk-server-triggers').start;
            winston.debug("this.trigger:"+ this.trigger);
            this.triggerRoute = require('@tiledesk-ent/tiledesk-server-triggers').triggerRoute;
            winston.debug("this.triggerRoute:"+ this.triggerRoute);       
            winston.info("ModulesManager init trigger loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init trigger module not found");
            }else {
                winston.error("ModulesManager error initializing init trigger module", err);
            }
        }


        try {
            this.stripe = require('@tiledesk-ent/tiledesk-server-payments').stripeRoute;
            winston.info("ModulesManager init stripe loaded");
        } catch(err) {
           if (err.code == 'MODULE_NOT_FOUND') {
               winston.info("ModulesManager init stripe module not found");
           }else {
                winston.error("ModulesManager error initializing init stripe module", err);
           }
        } 
      
        try {
            this.resthookRoute = require('@tiledesk-ent/tiledesk-server-resthook').resthookRoute;
            winston.debug("this.resthookRoute:"+ this.resthookRoute);        
             this.subscriptionNotifier = require('@tiledesk-ent/tiledesk-server-resthook').subscriptionNotifier;
            this.subscriptionNotifier.start();
            winston.info("ModulesManager init resthook loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init resthookRoute module not found", err);
            }else {
                winston.error("ModulesManager error initializing init resthook module", err);
            }
        }

      
       try {
            this.analyticsRoute = require('@tiledesk-ent/tiledesk-server-analytics').analyticsRoute;
            winston.debug("this.analyticsRoute:"+ this.analyticsRoute);        
            winston.info("ModulesManager init analyticsRoute loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init analytics module not found");
            }else {
                winston.error("ModulesManager error initializing init analytics module", err);
            }
        }


        try {
            this.activityArchiver = require('@tiledesk-ent/tiledesk-server-activities').activityArchiver;
            this.activityArchiver.listen();
            winston.debug("this.activityArchiver:"+ this.activityArchiver);   
            
            this.activityRoute = require('@tiledesk-ent/tiledesk-server-activities').activityRoute;
            winston.debug("this.activityRoute:"+ this.activityRoute);

            winston.info("ModulesManager init activities loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init activities module not found");
            }else {
                winston.error("ModulesManager error initializing init activities module", err);
            }
        }



        try {
            this.jwthistoryArchiver = require('@tiledesk-ent/tiledesk-server-jwthistory').jwthistoryArchiver;
            this.jwthistoryArchiver.listen();
            winston.debug("this.jwthistoryArchiver:"+ this.jwthistoryArchiver);   
            
            this.jwthistoryRoute = require('@tiledesk-ent/tiledesk-server-jwthistory').jwthistoryRoute;
            winston.debug("this.jwthistoryRoute:"+ this.jwthistoryRoute);

            winston.info("ModulesManager init jwthistory loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init jwthistory module not found");
            }else {
                winston.error("ModulesManager error initializing init jwthistory module", err);
            }
        }




        try {
            this.requestHistoryArchiver = require('@tiledesk-ent/tiledesk-server-request-history').listener;
            this.requestHistoryArchiver.listen();
            winston.debug("this.requestHistoryArchiver:"+ this.requestHistoryArchiver);   
            
            this.requestHistoryRoute = require('@tiledesk-ent/tiledesk-server-request-history').route;
            winston.debug("this.requestHistoryRoute:"+ this.requestHistoryRoute);

            winston.info("ModulesManager init requestHistory loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init requestHistory module not found");
            }else {
                winston.error("ModulesManager error initializing init requestHistory module", err);
            }
        }


        


        try {
            this.dialogflowListener = require('@tiledesk-ent/tiledesk-server-dialogflow').listener;
            this.dialogflowListener.listen();
            winston.debug("this.dialogflowListener:"+ this.dialogflowListener);           

            winston.info("ModulesManager init dialogflow loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init dialogflow module not found");
            }else {
                winston.error("ModulesManager error initializing init dialogflow module", err);
            }
        }


        try {
            this.routingQueue = require('@tiledesk-ent/tiledesk-server-routing-queue').listener;
            this.routingQueue.listen();
            winston.debug("this.routingQueue:"+ this.routingQueue);           

            winston.info("ModulesManager init routing queue loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init routing queue module not found");
            }else {
                winston.error("ModulesManager error initializing init routing queue module", err);
            }
        }



        try {
            this.queue = require('@tiledesk-ent/tiledesk-server-queue');            
            winston.debug("this.queue:"+ this.queue);           

            winston.info("ModulesManager init queue loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init queue module not found");
            }else {
                winston.error("ModulesManager error initializing init queue module", err);
            }
        }


        try {            
            this.cache = require('@tiledesk-ent/tiledesk-server-cache').cachegoose(config.mongoose);            
            winston.debug("this.cache:"+ this.cache);           
            winston.info("ModulesManager init cache loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init cache module not found");
            }else {
                winston.error("ModulesManager error initializing init cache module", err);
            }
        }

        try {
            this.cannedResponseRoute = require('@tiledesk-ent/tiledesk-server-canned').cannedResponseRoute;
            winston.debug("this.cannedResponseRoute:"+ this.cannedResponseRoute);        
            winston.info("ModulesManager init cannedResponseRoute loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init canned module not found");
            }else {
                winston.error("ModulesManager error initializing init canned module", err);
            }
        }

        try {
            this.tagRoute = require('@tiledesk-ent/tiledesk-server-tags').tagRoute;
            winston.debug("this.tagRoute:"+ this.tagRoute);        
            winston.info("ModulesManager init tagRoute loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init tag module not found");
            }else {
                winston.error("ModulesManager error initializing init tag module", err);
            }
        }

        try {
            this.groupsRoute = require('@tiledesk-ent/tiledesk-server-groups').groupsRoute;
            winston.debug("this.groupsRoute:"+ this.groupsRoute);        
            winston.info("ModulesManager init groupsRoute loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init group module not found");
            }else {
                winston.error("ModulesManager error initializing init group module", err);
            }
        }


          
        if (config && config.routes && config.routes.departmentsRoute) {
            try {                          
                require('@tiledesk-ent/tiledesk-server-departments').ext(config.routes.departmentsRoute, config.passport);
                winston.info("ModulesManager init departmentsRoute loaded");
            } catch(err) {
                if (err.code == 'MODULE_NOT_FOUND') {
                    winston.info("ModulesManager init departments module not found");
                }else {
                    winston.error("ModulesManager error initializing init departments module", err);
                }
            }
        }
            
        if (config && config.routes && config.routes.projectsRoute) {
            try {                          
                require('@tiledesk-ent/tiledesk-server-mt').ext(config.routes.projectsRoute, config.passport);
                winston.info("ModulesManager init mt loaded");
            } catch(err) {
                if (err.code == 'MODULE_NOT_FOUND') {
                    winston.info("ModulesManager init mt module not found");
                }else {
                    winston.error("ModulesManager error initializing init mt module", err);
                }
            }
        }
            
        try {
            this.visitorCounterRoute = require('@tiledesk-ent/tiledesk-server-visitorcounter').add(config.express);
            winston.debug("this.visitorCounterRoute:"+ this.visitorCounterRoute);        
            this.visitorCounterMiddleware = require('@tiledesk-ent/tiledesk-server-visitorcounter').visitorCounterMiddleware;
            winston.debug("this.visitorCounterMiddleware:"+ this.visitorCounterMiddleware);        
            this.widgetsRoute = config.routes.widgetsRoute;
            winston.debug(" this.widgetsRoute:"+  this.widgetsRoute);        

            winston.info("ModulesManager init visitorCounter loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init visitorCounter module not found");
            }else {
                winston.error("ModulesManager error initializing init visitorCounter module", err);
            }
        }




        
/*
        try {
           
            this.facebookRoute = require('@tiledesk-ent/tiledesk-server-facebook-app').fbWebHook;
            winston.debug("this.facebookRoute:"+ this.facebookRoute);

            winston.info("ModulesManager init facebook loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init facebook module not found");
            }else {
                winston.info("ModulesManager error initializing init facebook module", err);
            }
        }
*/

        // try {
        //     this.graphql = require('../modules/graphql/apollo');        
        //     winston.info("ModulesManager init graphql loaded");
        // } catch(err) {
        //     winston.info("ModulesManager init graphql module not found", err);
        // }


        
    }


    
}

var modulesManager = new ModulesManager();
module.exports = modulesManager;
