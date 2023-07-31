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

var cacheUtil = require('../utils/cacheUtil');
var cacheEnabler = require("../services/cacheEnabler");




class BotSubscriptionNotifier {
   
  
  notify(bot,secret, payload) {
  
      winston.debug("BotSubscriptionNotifier bot", bot.toObject());
      winston.debug("BotSubscriptionNotifier payload", payload );

      var url = bot.url;

      if (bot.type == "tilebot" && payload.request && payload.request.attributes && payload.request.attributes.sourcePage  && payload.request.attributes.sourcePage.indexOf("&td_draft=true")>-1) {
          url = url.substr(0,url.lastIndexOf("/")+1)+bot.id;
        // url = url + "?forced_bot_id="+bot.id;   
        winston.verbose("BotSubscriptionNotifier it is a tilebot test page. Switch to current chabot id: "+ url);              
      }

      // if (url.startsWith("$ext_url")) {
      //   // url = url.replace ("$res_bot_url", prendi da env)
      // }

      //Removed snapshot from request 
      delete payload.request.snapshot
      
      var json = {timestamp: Date.now(), payload: payload};
    

      json["hook"] = bot;


      var signOptions = {
        issuer:  'https://tiledesk.com',
        subject:  'bot',
        audience:  'https://tiledesk.com/bots/'+bot._id,   
        jwtid: uuidv4()       
      };

      // TODO metti bot_? a user._id

      // tolgo description, attributes
      let botPayload = bot.toObject();
      delete botPayload.secret;
      delete botPayload.description;
      delete botPayload.attributes;

      var token = jwt.sign(botPayload, secret, signOptions);
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
      var secret = bot.secret;
      winston.debug('bot.message.received.notify.external: '+secret);

    //   winston.debug('getting botWithSecret');
    //   let qbot = Faq_kb.findById(bot._id).select('+secret')

    //   if (cacheEnabler.faq_kb) {
    //     let id_project = bot.id_project;
    //     winston.debug("id_project.id_project:"+id_project);
    //     qbot.cache(cacheUtil.defaultTTL, id_project+":faq_kbs:id:"+bot._id+":secret")
    //     winston.debug('faq_kb BotSubscriptionNotifier cache enabled');
    //   }

    //   qbot.exec(function (err, botWithSecret){   //TODO add cache_bot_here????
    //     if (err) {
    //       winston.debug('Error getting botWithSecret', err);
    //     }
    //     botSubscriptionNotifier.notify(bot, botWithSecret, botNotification.message);
    //   });
      
    botSubscriptionNotifier.notify(bot, secret, botNotification.message);


    });



    winston.info('BotSubscriptionNotifier started');

  }



};

var botSubscriptionNotifier = new BotSubscriptionNotifier();


module.exports = botSubscriptionNotifier;