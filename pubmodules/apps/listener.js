const apps = require("@tiledesk/tiledesk-apps");
var winston = require('../../config/winston');

var config = require('../../config/database'); // get db config file

let configSecretOrPubicKay = process.env.GLOBAL_SECRET || config.secret;   

var pKey = process.env.GLOBAL_SECRET_OR_PUB_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecretOrPubicKay = pKey.replace(/\\n/g, '\n');
}

// console.log("configSecretOrPubicKay",configSecretOrPubicKay);

class Listener {

    listen(config) {

        winston.info("Apps Listener listen");
        
        if (config.databaseUri) {
            winston.debug("apps config databaseUri: " + config.databaseUri);
        }
        // console.log("ACCESS_TOKEN_SECRET",process.env.APPS_ACCESS_TOKEN_SECRET || configSecretOrPubicKay);

        apps.startApp({
            ACCESS_TOKEN_SECRET: process.env.APPS_ACCESS_TOKEN_SECRET || configSecretOrPubicKay,
            MONGODB_URI: process.env.APPS_MONGODB_URI || config.databaseUri,
            KALEYRA_ENABLED: process.env.KALEYRA_ENABLED || config.kaleyra_enabled,
            VOICE_ENABLED: process.env.VOICE_ENABLED || false
        }, () => {
            winston.info("Tiledesk Apps proxy server succesfully started.")
        })

    }

}

var listener = new Listener();

module.exports = listener;