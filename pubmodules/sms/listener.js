const sms = require("@tiledesk/tiledesk-sms-connector");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');
const mongoose = require("mongoose");

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('SMS apiUrl: ' + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {
        winston.info("SMS Listener listen");
        if (config.databaseUri) {
            winston.debug("SMS config databaseUri: " + config.databaseUri);
        }

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        var password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: "+ password);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME
        }

        let log = process.env.SMS_LOG || false
        winston.debug("SMS log: " + log);


        sms.startApp({
            MONGODB_URI: config.databaseUri,          
            dbconnection: dbConnection,
            API_URL: apiUrl,
            BASE_URL: apiUrl + "/modules/sms",
            BRAND_NAME: brand_name,
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            log: log
        })
        
    }
}

var listener = new Listener();

module.exports = listener;

