const botEvent = require('../../event/botEvent');
var Faq_kb = require("../../models/faq_kb");
var winston = require('../../config/winston');

var port = process.env.PORT || '3000';

const TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT || "http://localhost:" + port+ "/modules/tilebot/";
winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

winston.info("Tilebot endpoint: " + TILEBOT_ENDPOINT);

class Listener {

    listen(config) {

        winston.info('Tilebot Listener listen');
        // winston.debug("config databaseUri: " + config.databaseUri);  
        

        var that = this;

      
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
                        winston.verbose('Saved faqkb tilebot', savedFaq_kb.toObject())      
                    });
                }
            }
        });
        
    }

}

var listener = new Listener();


module.exports = listener;