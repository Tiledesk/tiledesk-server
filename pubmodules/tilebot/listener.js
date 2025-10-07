const botEvent = require('../../event/botEvent');
let Faq_kb = require("../../models/faq_kb");
let winston = require('../../config/winston');
let configGlobal = require('../../config/global');

let port = process.env.PORT || '3000';

let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/ext/";;
if (process.env.TILEBOT_ENDPOINT) {
    TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/ext/"
}

winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

/**
 * process.env.API_ENDPOINT --> Internal url of the server inside the cluster
 * process.env.API_URL      --> External/Public server url
 */
const apiUrl = process.env.API_ENDPOINT || process.env.API_URL || configGlobal.apiUrl;
winston.info('Rasa apiUrl: '+ apiUrl);

const tybot = require("@tiledesk/tiledesk-tybot-connector");


class Listener {

    listen(config) {

        winston.info('Tilebot Listener listen');
        winston.debug("Tilebot config databaseUri: " + config.databaseUri);  
        

        let that = this;

        let port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        let host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        let password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: "+ password);

        // console.log("Using: REDIS_HOST:", process.env.CACHE_REDIS_HOST);
        // console.log("Using: REDIS_PORT", process.env.CACHE_REDIS_PORT);
        // console.log("Using: REDIS_PASSWORD", process.env.CACHE_REDIS_PASSWORD);
        tybot.startApp(
            {              
                MONGODB_URI: config.databaseUri,
                API_ENDPOINT: apiUrl,
                REDIS_HOST: host,
                REDIS_PORT: port,
                REDIS_PASSWORD: password,
                CACHE_ENABLED: process.env.CACHE_ENABLED,
                log: process.env.TILEBOT_LOG
            }, () => {
                winston.info("TileBot proxy server successfully started.");                 
            }
        );


        botEvent.on('faqbot.create', function(bot) {
            if (TILEBOT_ENDPOINT) {

                winston.debug('bot.type:'+bot.type); 
                if (bot.type==="tilebot") {

                    winston.debug('qui.type:'+bot.type); 


                    Faq_kb.findByIdAndUpdate(bot.id, {"url":TILEBOT_ENDPOINT+bot.id}, { new: true, upsert: true }, function (err, savedFaq_kb) {

                    // bot.save(function (err, savedFaq_kb) {
                        if (err) {
                         return winston.error('error saving faqkb tilebot ', err)
                        }
                        botEvent.emit("faqbot.update",savedFaq_kb); //cache invalidation
                        winston.verbose('Saved faqkb tilebot', savedFaq_kb.toObject())      
                    });
                }
            }
        });
        
    }

}

let listener = new Listener();


module.exports = listener;