const botEvent = require('../../event/botEvent');
var Faq_kb = require("../../models/faq_kb");
var winston = require('../../config/winston');
const df = require("@tiledesk/tiledesk-dialogflow-connector");
var configGlobal = require('../../config/global');

var port = process.env.PORT || '3000';

const BOT_DIALOGFLOW_ENDPOINT = process.env.BOT_DIALOGFLOW_ENDPOINT || "http://localhost:" + port+ "/modules/dialogflow/tdbot/";
winston.debug("BOT_DIALOGFLOW_ENDPOINT: " + BOT_DIALOGFLOW_ENDPOINT);

// if (BOT_DIALOGFLOW_ENDPOINT) {
  winston.info("Dialogflow endpoint: " + BOT_DIALOGFLOW_ENDPOINT);
// } else {
//    winston.info("Dialogflow endpoint not configured");
// }


const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('Dialogflow apiUrl: '+ apiUrl);

class Listener {

    listen(config) {

        winston.debug('dialogflow Listener listen');   

        var that = this;


        df.startApp(
            {
              MONGODB_URI: config.databaseUri,   
              API_ENDPOINT: apiUrl,
              log: process.env.DIALOGFLOW_LOG
            }, () => {
              winston.info("Dialogflow route successfully started.");                           
            }
          ); 

        botEvent.on('faqbot.create', function(bot) {
            if (BOT_DIALOGFLOW_ENDPOINT) {

                if (bot.type==="dialogflow") {
                    // bot.url = BOT_DIALOGFLOW_ENDPOINT;

                    Faq_kb.findByIdAndUpdate(bot.id, {"url":BOT_DIALOGFLOW_ENDPOINT}, { new: true, upsert: true }, function (err, savedFaq_kb) {

                    // bot.save(function (err, savedFaq_kb) {
                        if (err) {
                         return winston.error('error saving faqkb dialogflow ', err)
                        }
                        botEvent.emit("faqbot.update",savedFaq_kb); //cache invalidation
                        winston.verbose('Saved faqkb dialogflow', savedFaq_kb.toObject())      
                    });
                }
            }
        });
        
    }

}

var listener = new Listener();


module.exports = listener;