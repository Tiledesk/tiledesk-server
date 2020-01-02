
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
        
      
    }

  

    use(app) {
        var that = this;
        winston.info("PubModulesManager using controllers");       

      
      

        
    }

   
    init() {
        winston.info("PubModulesManager init");

        try {
            this.appRules = require('./rules/appRules');
            this.appRules.start();
            winston.info("PubModulesManager init rules loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init rules module not found",err);
            }else {
                winston.info("PubModulesManager error initializing init rules module", err);
            }
        }

        try {
            this.messageActions = require('./messageActions');
            winston.debug("this.messageActions:"+ this.messageActions);
            this.messageActions.messageActionsInterceptor.listen();
            winston.info("PubModulesManager init messageActions loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init messageActions module not found",err);
            }else {
                winston.info("PubModulesManager error initializing init messageActions module", err);
            }
        }
        
        
         try {
            this.emailNotification = require('./emailNotification');
            winston.debug("this.emailNotification:"+ this.emailNotification);
            this.emailNotification.requestNotification.listen();
            winston.info("PubModulesManager init requestNotification loaded.");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("PubModulesManager init emailNotification module not found",err);
            }else {
                winston.info("PubModulesManager error initializing init emailNotification module", err);
            }
        }
        
        


      
        
    }


    
}

var pubModulesManager = new PubModulesManager();
module.exports = pubModulesManager;
