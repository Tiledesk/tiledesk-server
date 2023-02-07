const kaleyra = require("@tiledesk/tiledesk-kaleyra-proxy");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info("Kaleyra apiUrl: " + apiUrl);
 
class Listener {

    listen(config) {
        winston.info("Kaleyra Listener listen");
        if (config.databaseUri) {
            winston.debug("kaleyra config databaseUri: " + config.databaseUri);
        }

        if (!process.env.KALEYRA_API_URL || !process.env.API_KEY) {
            winston.info("Skip Kaleyra startApp")
        } else {
            kaleyra.startApp({
                MONGODB_URL: config.databaseUri,
                API_URL: apiUrl,
                BASE_URL: apiUrl + "/modules/kaleyra",
                APPS_API_URL: apiUrl + "/modules/apps",
                KALEYRA_API_URL: process.env.KALEYRA_API_URL,
                API_KEY: process.env.API_KEY,
                log: process.env.KALEYRA_LOG
            }, () => {
                winston.info("Tiledesk Kaleyra proxy server succesfully started.");
            })
        }
    }
}

var listener = new Listener();

module.exports = listener;