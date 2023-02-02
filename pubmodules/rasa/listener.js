const botEvent = require('../../event/botEvent');
var Faq_kb = require("../../models/faq_kb");
var winston = require('../../config/winston');
const rasa = require("@tiledesk/tiledesk-rasa-connector");
var configGlobal = require('../../config/global');

var port = process.env.PORT || '3000';

const BOT_RASA_ENDPOINT = process.env.BOT_RASA_ENDPOINT || "http://localhost:" + port+ "/modules/rasa/rasabot";
winston.debug("BOT_RASA_ENDPOINT: " + BOT_RASA_ENDPOINT);

// if (BOT_RASA_ENDPOINT) {
  winston.info("Rasa endpoint: " + BOT_RASA_ENDPOINT);
// } else {
//    winston.info("Rasa endpoint not configured");
// }

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('Rasa apiUrl: '+ apiUrl);

class Listener {

    listen(config) {

        winston.info('Rasa Listener listen');
        winston.debug("rasa config databaseUri: " + config.databaseUri);  
        

        var that = this;


        rasa.startRasa(
            {
                KVBASE_COLLECTION : process.env.KVBASE_COLLECTION,
                MONGODB_URI: config.databaseUri,          
                API_ENDPOINT: apiUrl,   
                log: process.env.RASABOT_LOG
            }, () => {
                winston.info("RASA proxy server successfully started.");   
            });


      
        botEvent.on('faqbot.create', function(bot) {
            if (BOT_RASA_ENDPOINT) {

                winston.debug('bot.type:'+bot.type); 
                if (bot.type==="rasa") {

                    winston.debug('qui.type:'+bot.type); 


                    Faq_kb.findByIdAndUpdate(bot.id, {"url":BOT_RASA_ENDPOINT}, { new: true, upsert: true }, function (err, savedFaq_kb) {

                    // bot.save(function (err, savedFaq_kb) {
                        if (err) {
                         return winston.error('error saving faqkb rasa ', err)
                        }
                        botEvent.emit("faqbot.update",savedFaq_kb); //cache invalidation
                        winston.verbose('Saved faqkb rasa', savedFaq_kb.toObject())      
                    });
                }
            }
        });
        
    }

}

var listener = new Listener();


module.exports = listener;