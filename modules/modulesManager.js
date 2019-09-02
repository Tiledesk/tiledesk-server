
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
      
    }

    injectBefore(app) {
        winston.info("ModulesManager injectBefore");
        var res;
        try {
            // this.graphql = require('../../../modules/graphql/apollo-express');   
            this.graphql = require('@tiledesk/tiledesk-graphql').apolloExpress;
           
             res = this.graphql.injectBefore(app);     
            winston.info("ModulesManager injectBefore graphql loaded",res);
          
        } catch(err) {
            winston.info("ModulesManager injectBefore graphql module not found", err);
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
            winston.info("ModulesManager trigger controller loaded");       
        }
      
      if (this.subscriptionRoute) {
           app.use('/:projectid/subscriptions', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.subscriptionRoute);
           winston.info("ModulesManager subscriptions controller loaded");       
        }
      

        
    }

   
    init() {
        winston.info("ModulesManager init");


        try {
            this.trigger = require('@tiledesk/tiledesk-triggers').start;
            winston.debug("this.trigger:"+ this.trigger);
            this.triggerRoute = require('@tiledesk/tiledesk-triggers').triggerRoute;
            winston.debug("this.triggerRoute:"+ this.triggerRoute);
            // this.trigger = require('../modules/trigger/start');
            // this.triggerRoute = require('../modules/trigger/triggerRoute');
            winston.info("ModulesManager init trigger loaded");
        } catch(err) {
            winston.info("ModulesManager init trigger module not found", err);
        }


        try {
            // this.stripe = require('../modules/payments/stripe/index');
            this.stripe = require('@tiledesk/tiledesk-payments/stripe');
            winston.info("ModulesManager init stripe loaded");
        } catch(err) {
            winston.info("ModulesManager init stripe module not found", err);
        }
      
        try {
            this.subscriptionRoute = require('@tiledesk/tiledesk-resthook').subscriptionRoute;
            winston.debug("this.subscriptionRoute:"+ this.subscriptionRoute);        
            winston.info("ModulesManager init subscriptionRoute loaded");
        } catch(err) {
            winston.info("ModulesManager init subscriptionRoute module not found", err);
        }

      
       try {
            this.analyticsRoute = require('@tiledesk/tiledesk-analytics').analyticsRoute;
            winston.debug("this.analyticsRoute:"+ this.analyticsRoute);        
            winston.info("ModulesManager init analyticsRoute loaded");
        } catch(err) {
            winston.info("ModulesManager init analyticsRoute module not found", err);
        }

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
