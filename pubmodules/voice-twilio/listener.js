const voice_twilio = require('@tiledesk/tiledesk-voice-twilio-connector');
let winston = require('../../config/winston');
let configGlobal = require('../../config/global');
const mongoose = require('mongoose');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info("TwilioVoice apiUrl: " + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {

        winston.info("TwilioVoice Listener listen");
        if (config.databaseUri) {
            winston.debug("TwilioVoice config databaseUri: " +  config.databaseUri);
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

        let log = process.env.VOICE_TWILIO_LOG || false
        winston.debug("Voice log: "+ log);
        
        voice_twilio.startApp({
            MONGODB_URI: config.databaseUri,          
            dbconnection: dbConnection,
            API_URL: apiUrl,
            BASE_URL: apiUrl + "/modules/voice-twilio",                     
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            BRAND_NAME: brand_name,
            log: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk Twilio Voice Connector proxy server succesfully started.");
            } else {
                winston.info("unable to start Tiledesk Twilio Voice Connector. " + err);
            }    
        })
    }
}

let listener = new Listener();

module.exports = listener;