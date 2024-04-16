const whatsapp = require("@tiledesk/tiledesk-whatsapp-connector");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');
const mongoose = require("mongoose");

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('Whatsapp apiUrl: ' + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {
        winston.info("WhatsApp Listener listen");
        if (config.databaseUri) {
            winston.debug("whatsapp config databaseUri: " + config.databaseUri);
        }

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        var password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: "+ password);

        let graph_url = process.env.META_GRAPH_URL || config.graphUrl || "https://graph.facebook.com/v14.0/"
        winston.debug("Whatsapp graph_url: "+ password);

        let baseFileUrl = process.env.BASE_FILE_URL || apiUrl || "http://localhost:3000"

        let job_topic = process.env.JOB_TOPIC_EXCHANGE;
        winston.debug("Whatsapp job topic " + job_topic);

        let amqp_manager_url = process.env.AMQP_MANAGER_URL;
        winston.debug("amqp_manager_url " + amqp_manager_url);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME
        }

        let log = process.env.WHATSAPP_LOG || false
        winston.debug("Whatsapp log: "+ log);

        whatsapp.startApp({
            MONGODB_URL: config.databaseUri,          
            dbconnection: dbConnection,
            API_URL: apiUrl,
            BASE_FILE_URL: baseFileUrl,
            GRAPH_URL: graph_url,
            BASE_URL: apiUrl + "/modules/whatsapp",                     
            APPS_API_URL: apiUrl + "/modules/apps",
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            AMQP_MANAGER_URL: amqp_manager_url,
            JOB_TOPIC_EXCHANGE: job_topic,
            BRAND_NAME: brand_name,
            log: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk Messenger Connector proxy server succesfully started.");
            } else {
                winston.info("unable to start Tiledesk Whatsapp Connector. " + err);
            }
        })

    }
}

var listener = new Listener();

module.exports = listener;