const EventEmitter = require('events');
const messageEvent = require('../event/messageEvent');
var winston = require('../config/winston');

class BotEvent extends EventEmitter {}

const botEvent = new BotEvent();



function getBotFromParticipants(participants) {
    var botIdTmp;
  
    if (participants) {
      participants.forEach(function(participant) { 
        //console.log("participant", participant);
        if (participant.indexOf("bot_")> -1) {
          botIdTmp = participant.replace("bot_","");
          //console.log("botIdTmp", botIdTmp);
          //break;        
        }
      });
    
      return botIdTmp;
    }else {
      return null;
    }
  }


function getBotId(message) {
    var sender = message.sender;
    winston.debug("sender", sender);
 
    if (sender=="sytem") {
         return null;
    }
 
    var recipient = message.recipient;
    winston.debug("recipient", recipient);
 
    if (recipient.startsWith('bot_')) {
        return recipient.replace('bot_','');
    }
    // var text = message.text;
    // console.log("text", text);
    
    if ( message.request== null || message.request.participants == null) {
        return null;
    }

    var participants = message.request.participants;
    winston.debug("participants", participants);
 
    var botId = getBotFromParticipants(participants);
    winston.debug("botId: " + botId);
 
   if (botId) {
      return botId;
   }else {
       return null;
   }
 
}

//modify to async
messageEvent.on('message.received', function(message) {

    winston.debug("message", message);

   var botId = getBotId(message);

   winston.debug("botId: " + botId);

   if (!botId) {
        return null;
    }else {
        messageEvent.emit('message.received.for.bot', message);
    }


    
    
    if(message.request && message.request.department && message.request.department) {
        winston.debug("message.request.department", message.request.department);

        var bot = message.request.department.bot;
    

        winston.debug("bot", bot);

        if (bot) {
            if (bot.external===true) {
                if (bot.url) {
                    var botNotification = {url: bot.url, message: message};
                    botEvent.emit('bot.message.received.notify.external', botNotification);
                }else {
                    winston.warn("bot url is not defined", bot);
                }
            }else {
                botEvent.emit('bot.message.received.notify.internal', message);
            }
        } 
    }
});


module.exports = botEvent;
