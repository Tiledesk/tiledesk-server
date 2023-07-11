
var winston = require('../config/winston');
var validtoken = require('../middleware/valid-token');
var roleChecker = require('../middleware/has-role');
var passport = require('passport');
require('../middleware/passport')(passport);

const MaskData = require("maskdata");

const maskOptions = {
  // Character to mask the data. default value is '*'
  maskWith : "*",
  // If the starting 'n' digits needs to be unmasked
  // Default value is 4
  unmaskedStartDigits : 40, //Should be positive Integer
  //If the ending 'n' digits needs to be unmasked
  // Default value is 1
  unmaskedEndDigits : 40 // Should be positive Integer
  };


var licenseKey = process.env.LICENSE_KEY;

if (licenseKey) {
    var maskedLicenseKey = MaskData.maskPhone(licenseKey, maskOptions);
    winston.info("LicenseKey: " + maskedLicenseKey);    
    // winston.info("LicenseKey: " + licenseKey);    
}

class ModulesManager {

    constructor() {       
        this.stripe = undefined;
        this.graphql = undefined;
        this.elasticIndexer = undefined;      
        this.facebookRoute = undefined;
        this.jwthistoryArchiver = undefined;
        this.jwthistoryRoute = undefined;
        this.requestHistoryArchiver = undefined;
        this.requestHistoryRoute = undefined;    
        this.visitorCounterRoute = undefined;
        this.visitorCounterMiddleware = undefined;
        this.widgetsRoute = undefined;
        this.enterprise = undefined;
    }

    injectBefore(app) {
        winston.verbose("ModulesManager injectBefore");
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
        winston.verbose("ModulesManager inject");
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
            
             
    
     
        if (this.requestHistoryRoute) {
            app.use('/:projectid/requests/:request_id/history', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes(null, ['subscription'])] , this.requestHistoryRoute);
            winston.info("ModulesManager requestHistory controller loaded"); 
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
            this.enterprise = require('@tiledesk-ent/tiledesk-server-enterprise');
            winston.debug("this.enterprise:"+ this.enterprise);            
            winston.info("ModulesManager enterprise initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init enterprise module not found");
            }else {
                winston.error("ModulesManager error initializing init enterprise module", err);
            }
        }





        try {
            this.stripe = require('../pubmodules/s').stripeRoute;
            // this.stripe = require('@tiledesk-ent/tiledesk-server-payments').stripeRoute;
            winston.info("ModulesManager stripe initialized");
        } catch(err) {
        //    if (err.code == 'MODULE_NOT_FOUND') {
        //        winston.info("ModulesManager init stripe module not found");
        //    }else {
                winston.error("ModulesManager error initializing init stripe module", err);
        //    }   
        } 



        try {
            this.jwthistoryArchiver = require('@tiledesk-ent/tiledesk-server-jwthistory').jwthistoryArchiver;
            // this.jwthistoryArchiver.listen();
            winston.debug("this.jwthistoryArchiver:"+ this.jwthistoryArchiver);   
            
            this.jwthistoryRoute = require('@tiledesk-ent/tiledesk-server-jwthistory').jwthistoryRoute;
            winston.debug("this.jwthistoryRoute:"+ this.jwthistoryRoute);

            winston.info("ModulesManager jwthistory initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init jwthistory module not found");
            }else {
                winston.error("ModulesManager error initializing init jwthistory module", err);
            }
        }




        try {
            this.requestHistoryArchiver = require('@tiledesk-ent/tiledesk-server-request-history').listener;
            // this.requestHistoryArchiver.listen();
            winston.debug("this.requestHistoryArchiver:"+ this.requestHistoryArchiver);   
            
            this.requestHistoryRoute = require('@tiledesk-ent/tiledesk-server-request-history').route;
            winston.debug("this.requestHistoryRoute:"+ this.requestHistoryRoute);

            winston.info("ModulesManager requestHistory initialized");
        } catch(err) {
            if (err.code == 'MODULE_NOT_FOUND') {
                winston.info("ModulesManager init requestHistory module not found");
            }else {
                winston.error("ModulesManager error initializing init requestHistory module", err);
            }
        }


        


        // try {
        //     this.dialogflowListener = require('@tiledesk-ent/tiledesk-server-dialogflow').listener;
        //     // this.dialogflowListener.listen();
        //     winston.debug("this.dialogflowListener:"+ this.dialogflowListener);           

        //     winston.info("ModulesManager dialogflow initialized");
        // } catch(err) {
        //     if (err.code == 'MODULE_NOT_FOUND') {
        //         winston.info("ModulesManager init dialogflow module not found");
        //     }else {
        //         winston.error("ModulesManager error initializing init dialogflow module", err);
        //     }
        // }        


        
        try {
            this.visitorCounterRoute = require('@tiledesk-ent/tiledesk-server-visitorcounter').add(config.express);
            winston.debug("this.visitorCounterRoute:"+ this.visitorCounterRoute);        
            this.visitorCounterMiddleware = require('@tiledesk-ent/tiledesk-server-visitorcounter').visitorCounterMiddleware;
            winston.debug("this.visitorCounterMiddleware:"+ this.visitorCounterMiddleware);        
            this.widgetsRoute = config.routes.widgetsRoute;
            winston.debug(" this.widgetsRoute:"+  this.widgetsRoute);        

            winston.info("ModulesManager visitorCounter initialized");
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


    start() {

        
        if (this.jwthistoryArchiver) {
            try {
                this.jwthistoryArchiver.listen();
                winston.info("ModulesManager jwthistoryArchiver started");
            } catch(err) {        
                winston.info("ModulesManager error starting jwthistoryArchiver module", err);            
            }
        }

        if (this.requestHistoryArchiver) {
            try {
                this.requestHistoryArchiver.listen();
                winston.info("ModulesManager requestHistoryArchiver started");
            } catch(err) {        
                winston.info("ModulesManager error starting requestHistoryArchiver module", err);            
            }
        }

        // if (this.dialogflowListener) {
        //     try {
        //         this.dialogflowListener.listen();
        //         winston.info("ModulesManager dialogflowListener started");
        //     } catch(err) {        
        //         winston.info("ModulesManager error starting dialogflowListener module", err);            
        //     }
        // }


        


         
    }


    
}

var modulesManager = new ModulesManager();
module.exports = modulesManager;
