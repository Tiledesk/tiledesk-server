const templates = require("@tiledesk/tiledesk-chatbot-templates");
const winston = require("../../config/winston");
var configGlobal = require('../../config/global');

class Listener {

    listen(config) {
     
        winston.info("Chatbot Templates Listener listen");
        if (config.databaseUri) {
            winston.debug("chatbot templates config databaseUri: " + config.databaseUri);
        }

        templates.startApp({
            MONGODB_URL: config.databaseUri,
            CHATBOT_TEMPLATES_LOG: 1
        }, (err) => {
            if (!err) {
                winston.info("Chatbot Templates proxy server successfully started.");
            } else {
                winston.info("unable to start Tiledesk Chatbot Templates." + err);
            }
        })
    }
}

var listener = new Listener();

module.exports = listener;