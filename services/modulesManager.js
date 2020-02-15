
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
        winston.info("ModulesManager using controllers");       

        if (this.stripe) {
            app.use('/modules/payments/stripe', this.stripe);
            winston.info("ModulesManager stripe controller loaded");       
        }

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

        if (this.jwthistoryRoute) {
            // ??????
            app.use('/jwt/history', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], this.jwthistoryRoute);
             winston.info("ModulesManager jwthistory controller loaded");       
        }

        // if (this.facebookRoute) {
        //     app.use('/modules/facebook', this.facebookRoute);
        //     winston.info("ModulesManager facebook controller loaded");       
        // }
      
      

        
    }

   
    init() {
        winston.info("ModulesManager init");


        try {
            this.trigger = require('@tiledesk-ent/tiledesk-server-triggers').start;
            winston.debug("this.trigger:"+ this.trigger);
            this.triggerRoute = require('@tiledesk-ent/tiledesk-server-triggers').triggerRoute;
            winston.debug("this.triggerRoute:"+ this.triggerRoute);
            // this.trigger = require('../modules/trigger/start');
            // this.triggerRoute = require('../modules/trigger/triggerRoute');
            winston.info("ModulesManager init trigger loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init trigger module not found");
            }else {
                winston.error("ModulesManager error initializing init trigger module", err);
            }
        }


        try {
            // this.stripe = require('../modules/payments/stripe/index');
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
                winston.info("ModulesManager init resthookRoute module not found",err);
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

/*
        try {
            this.elasticIndexer = require('@tiledesk-ent/tiledesk-server-elasticsearch').elasticIndexer;
            this.elasticIndexer.listen();
            winston.debug("this.elasticIndexer:"+ this.elasticIndexer);        
            winston.info("ModulesManager init elasticIndexer loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init elasticIndexer module not found");
            }else {
                winston.info("ModulesManager error initializing init elasticIndexer module", err);
            }
        }
*/


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
                winston.info("ModulesManager init jwthistory module not found",err);
            }else {
                winston.error("ModulesManager error initializing init jwthistory module", err);
            }
        }

        try {
            this.dialogflowListener = require('@tiledesk-ent/tiledesk-server-dialogflow').listener;
            this.dialogflowListener.listen();
            winston.debug("this.dialogflowListener:"+ this.dialogflowListener);           

            winston.info("ModulesManager init dialogflow loaded");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init dialogflow module not found",err);
            }else {
                winston.error("ModulesManager error initializing init dialogflow module", err);
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
