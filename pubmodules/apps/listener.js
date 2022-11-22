const apps = require("@tiledesk/tiledesk-apps");
var winston = require('../../config/winston');

class Listener {

    listen(config) {

        winston.info("Apps Listener listen");
        
        if (config.databaseUri) {
            winston.debug("apps config databaseUri: " + config.databaseUri);
        }

        apps.startApp({
            ACCESS_TOKEN_SECRET: process.env.APPS_ACCESS_TOKEN_SECRET || 'nodeauthsecret',
            MONGODB_URI: process.env.APPS_MONGODB_URI || config.databaseUri,
        }, () => {
            winston.info("Tiledesk Apps proxy server succesfully started.")
        })

    }

}

var listener = new Listener();

module.exports = listener;