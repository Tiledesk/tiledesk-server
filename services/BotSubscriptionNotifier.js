const botEvent = require('../event/botEvent');
var winston = require('../config/winston');
var jwt = require('jsonwebtoken');
const Faq_kb = require('../models/faq_kb');
const uuidv4 = require('uuid/v4');

var request = require('retry-request', {
  request: require('request')
});

var webhook_origin = process.env.WEBHOOK_ORIGIN || "http://localhost:3000";
winston.debug("webhook_origin: "+webhook_origin);

class BotSubscriptionNotifier {
   
  
  notify(bot,botWithSecret, payload) {
  
      winston.verbose("BotSubscriptionNotifier bot", bot.toObject(), 'payload', payload );

      var url = bot.url;

      // if (url.startsWith("$ext_url")) {
      //   // url = url.replace ("$res_bot_url", prendi da env)
      // }

      var json = {timestamp: Date.now(), payload: payload};
    

      json["hook"] = bot;


      var signOptions = {
        issuer:  'https://tiledesk.com',
        subject:  'bot',
        audience:  'https://tiledesk.com/bots/'+bot._id,   
        jwtid: uuidv4()       
      };

      // TODO metti bot_? a user._id
      var token = jwt.sign(bot.toObject(), botWithSecret.secret, signOptions);
      json["token"] = token;


      winston.debug("BotSubscriptionNotifier notify json ", json );

          request({
            url: url,
            headers: {
             'Content-Type' : 'application/json', 
             'User-Agent': 'tiledesk-bot',
             'Origin': webhook_origin
              //'x-hook-secret': s.secret
            },
            json: json,
            method: 'POST'

          }, function(err, result, json){            
            winston.verbose("SENT notify for bot with url " + url +  " with err " + err);
            winston.debug("SENT notify for bot with url ", result);
            if (err) {
              winston.error("Error sending notify for bot with url " + url + " with err " + err);
              //TODO Reply with error
              // next(err, json);
            }
          });
    
}


  start() {
    winston.debug('BotSubscriptionNotifier start');
    //modify to async
    botEvent.on('bot.message.received.notify.external', function(botNotification) {
      var bot = botNotification.bot;
      Faq_kb.findById(bot._id).select('+secret').exec(function (err, botWithSecret){
        if (err) {
          winston.debug('Error getting botWithSecret', err);
        }
        botSubscriptionNotifier.notify(bot, botWithSecret, botNotification.message);
      });
      
    });

    winston.info('BotSubscriptionNotifier started');

  }



};

var botSubscriptionNotifier = new BotSubscriptionNotifier();


module.exports = botSubscriptionNotifier;