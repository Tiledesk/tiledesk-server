const botEvent = require('../../event/botEvent');
var Faq_kb = require("../../models/faq_kb");
var winston = require('../../config/winston');

const BOT_RASA_ENDPOINT = process.env.BOT_RASA_ENDPOINT;
winston.debug("BOT_RASA_ENDPOINT: " + BOT_RASA_ENDPOINT);

if (BOT_RASA_ENDPOINT) {
  winston.info("Rasa endpoint: " + BOT_RASA_ENDPOINT);
} else {
   winston.info("Rasa endpoint not configured");
}


class Listener {

    listen() {

        winston.debug('rasa Listener listen');   

        var that = this;

        botEvent.on('faqbot.create', function(bot) {
            if (BOT_RASA_ENDPOINT) {

                winston.info('bot.type:'+bot.type); 
                if (bot.type==="rasa") {

                    winston.info('qui.type:'+bot.type); 


                    Faq_kb.findByIdAndUpdate(bot.id, {"url":BOT_RASA_ENDPOINT}, { new: true, upsert: true }, function (err, savedFaq_kb) {

                    // bot.save(function (err, savedFaq_kb) {
                        if (err) {
                         return winston.error('error saving faqkb rasa ', err)
                        }
                        winston.verbose('Saved faqkb rasa', savedFaq_kb.toObject())      
                    });
                }
            }
        });
        
    }

}

var listener = new Listener();


module.exports = listener;