const whatsapp = require("@tiledesk/tiledesk-whatsapp-connector");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('Whatsapp apiUrl: ' + apiUrl);

class Listener {

    listen(config) {
        winston.info("WhatsApp Listener listen");
        if (config.databaseUri) {
            winston.debug("whatsapp config databaseUri: " + config.databaseUri);
        }

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("-Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("-Redis host: "+ host);

        var password = process.env.REDIS_PASSWORD;
        winston.debug("-Redis password: "+ password);


        let graph_url = process.env.META_GRAPH_URL || config.graphUrl || "https://graph.facebook.com/v14.0/"
        winston.debug("Whatsapp graph_url: "+ password);

        let log = process.env.WHATSAPP_LOG || false
        winston.debug("Whatsapp log: "+ log);

        whatsapp.startApp({
            MONGODB_URL: config.databaseUri,          
            API_URL: apiUrl,
            GRAPH_URL: graph_url,
            BASE_URL: apiUrl + "/modules/whatsapp",                     
            APPS_API_URL: apiUrl + "/modules/apps",
            REDIS_HOST: host,
            REDIS_PORT: port,
            REDIS_PASSWORD: password,
            log: log
        }, () => {
            winston.info("Tiledesk WhatsApp Connector proxy server succesfully started.");
        })

    }
}

var listener = new Listener();

module.exports = listener;