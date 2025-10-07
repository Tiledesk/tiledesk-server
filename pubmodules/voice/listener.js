const voice = require("@tiledesk/tiledesk-vxml-connector");
let winston = require('../../config/winston');
let configGlobal = require('../../config/global');
const mongoose = require("mongoose");

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('Voice apiUrl: ' + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {
        winston.info("Voice Listener listen");
        if (config.databaseUri) {
            winston.debug("Voice config databaseUri: " + config.databaseUri);
        }

        let pooling_delay = process.env.BASE_POOLING_DELAY || 250;
        winston.debug("Pooling_delay: "+ pooling_delay);

        let max_polling_time = process.env.MAX_POOLING_TIME || 30000;
        winston.debug("Pooling_delay: "+ pooling_delay);

        let port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        let host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        let password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: "+ password);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME
        }

        let log = process.env.VOICE_LOG || false
        winston.debug("Voice log: "+ log);

        voice.startApp({
            MONGODB_URI: config.databaseUri,          
            dbconnection: dbConnection,
            BASE_URL: apiUrl + "/modules/voice",                     
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            BRAND_NAME: brand_name,
            BASE_POOLING_DELAY: pooling_delay,
            MAX_POLLING_TIME: max_polling_time,
            log: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk Voice Connector proxy server succesfully started.");
            } else {
                winston.info("unable to start Tiledesk Voice Connector. " + err);
            }
        })

    }
}

let listener = new Listener();

module.exports = listener;