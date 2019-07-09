
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
    }

    use(app) {
        var that = this;
        winston.info("ModulesManager using controllers");       

        if (this.stripe) {
            app.use('/modules/payments/stripe', this.stripe);
        }

        if (this.triggerRoute) {
            app.use('/:projectid/modules/triggers', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], this.triggerRoute);
        }
        
    }

   
    init() {
        winston.info("ModulesManager init");


        try {
            this.trigger = require('../modules/trigger/start');
            this.triggerRoute = require('../modules/trigger/triggerRoute');
            // this.stripe = require('@tiledesk/tiledesk-payments-stripe');
            winston.info("ModulesManager init trigger loaded");
        } catch(err) {
            winston.info("ModulesManager init trigger module not found", err);
        }


        try {
            this.stripe = require('../modules/payments/stripe/index');
            // this.stripe = require('@tiledesk/tiledesk-payments-stripe');
            winston.info("ModulesManager init stripe loaded");
        } catch(err) {
            winston.info("ModulesManager init stripe module not found", err);
        }


        try {
            this.graphql = require('../modules/graphql/apollo');        
            winston.info("ModulesManager init graphql loaded");
        } catch(err) {
            winston.info("ModulesManager init graphql module not found", err);
        }


        
    }


    
}

var modulesManager = new ModulesManager();
module.exports = modulesManager;
