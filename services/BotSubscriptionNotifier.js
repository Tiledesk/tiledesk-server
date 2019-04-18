var request = require('request');
const botEvent = require('../event/botEvent');
var winston = require('../config/winston');


class BotSubscriptionNotifier {
   
  
  notify(url, payload) {
  
   
      var json = {timestamp: Date.now(), payload: payload};
     
      winston.info("BotSubscriptionNotifier notify url " +url + " payload " + payload );


          //json["hook"] = s;

          request({
            url: url,
            headers: {
             'Content-Type' : 'application/json',        
              //'x-hook-secret': s.secret
            },
            json: json,
            method: 'POST'

          }, function(err, result, json){            
            winston.info("SENT notify for bot with url" + url +  " with error " + err);
            if (err) {
              winston.error("Error sending notify for bot with url " + url + " with error " + err);
              // next(err, json);
            }
          });
    
}


  start() {

    //modify to async
    botEvent.on('bot.message.received.notify.external', function(botNotification) {
      botSubscriptionNotifier.notify(botNotification.url, botNotification.message);
    });

   

  }



};

var botSubscriptionNotifier = new BotSubscriptionNotifier();


module.exports = botSubscriptionNotifier;