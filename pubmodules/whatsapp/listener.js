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

        whatsapp.startApp({
            MONGODB_URL: config.databaseUri,          
            API_URL: apiUrl,
            GRAPH_URL: process.env.META_GRAPH_URL || config.graphUrl,
            BASE_URL: apiUrl + "/modules/whatsapp",                     
            APPS_API_URL: apiUrl + "/modules/apps",                 
            log: process.env.WHATSAPP_LOG
        }, () => {
            winston.info("Tiledesk WhatsApp Connector proxy server succesfully started.");
        })

    }
}

var listener = new Listener();

module.exports = listener;