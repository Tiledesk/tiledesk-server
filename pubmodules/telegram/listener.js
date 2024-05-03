const telegram = require("@tiledesk/tiledesk-telegram-connector");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');
const mongoose = require("mongoose");

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info("telegram apiUrl: " + apiUrl);

const dbConnection = mongoose.connection;

class Listener {

    listen(config) {
        winston.info("Telegram Listener listen");
        if (config.databaseUri) {
            winston.debug("telegram config databaseUri: " + config.databaseUri);
        }

        let telegram_api_url = process.env.TELEGRAM_API_URL || config.telegramApiUrl || "https://api.telegram.org/bot"
        winston.debug("Telegram api url: " + telegram_api_url);

        let telegram_file_url = process.env.TELEGRAM_FILE_URL || config.telegramFileUrl || "https://api.telegram.org/file/bot"
        winston.debug("Telegram file url: " + telegram_file_url);

        let log = process.env.TELEGRAM_LOG || 'debug'
        winston.debug("Telegram log: " + log);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME
        }

        telegram.startApp({
            MONGODB_URL: config.databaseUri,
            dbconnection: dbConnection,
            API_URL: apiUrl,
            TELEGRAM_API_URL: telegram_api_url,
            TELEGRAM_FILE_URL: telegram_file_url,
            BASE_URL: apiUrl + "/modules/telegram",
            APPS_API_URL: apiUrl + "/modules/apps",
            BRAND_NAME: brand_name,
            log: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk Telegram Connector proxy server successfully started");
            } else {
                winston.info("unable to start Tiledesk Telegram Connector. " + err);
            }
        })
    }
}

var listener = new Listener();

module.exports = listener;