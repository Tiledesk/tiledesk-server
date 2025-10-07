

'use strict';
let global = require('../config/global');
let email = require('../config/email');
let winston = require('../config/winston');




class OrgUtil {

    constructor() {
        this.ORGANIZATION_ENABLED = process.env.ORGANIZATION_ENABLED || global.organizationEnabled;
        if (this.ORGANIZATION_ENABLED===true || this.ORGANIZATION_ENABLED === "true") {
            this.ORGANIZATION_ENABLED = true;
        }else {
            this.ORGANIZATION_ENABLED = false;
        }

        winston.info("Organization enabled: "+ this.ORGANIZATION_ENABLED );

        this.ORGANIZATION_BASE_URL = process.env.ORGANIZATION_BASE_URL || global.organizationBaseUrl;
        winston.info("Organization base url: "+ this.ORGANIZATION_BASE_URL );

    }

    getOrg(req) {

        // if (this.ORGANIZATION_ENABLED===false) {
        //     return undefined;
        // }


        // let host = req.get('host');
        // winston.info("host: "+ host );

        let origin = req.get('origin');
        winston.debug("origin: "+ origin );

        // winston.info("email: " + email.baseUrl);
        winston.debug("this.ORGANIZATION_BASE_URL: " + this.ORGANIZATION_BASE_URL); 
        // global.organizationBaseUrl
        // if (host !=email.baseUrl ) {
        if (origin && origin.indexOf(this.ORGANIZATION_BASE_URL)>-1) {
        // if (origin!=this.ORGANIZATION_BASE_URL) {
            // winston.info("host found: "+ host );
            // return host;
            winston.info("origin found: "+ origin );
            return origin;
        }
        winston.debug("origin not found: "+ origin );
        
        // winston.info("host not found: "+ host );
        // if (host.indexOf("localhost1")>-1) {
        //     console.log("host found: "+ host );
        //     return "localhost";
        // }
        return undefined;
     
    }

   


      
  
}


let orgUtil = new OrgUtil();


module.exports = orgUtil;