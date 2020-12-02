var winston = require('../config/winston');


class BotFromParticipant {

     //TODO use request. getBotId
 getBotFromParticipants(participants) {
    var botIdTmp;
  
    if (participants) {
      participants.forEach(function(participant) { 
        //winston.debug("participant", participant);
        // botprefix
        if (participant.indexOf("bot_")> -1) {
          // botprefix
          botIdTmp = participant.replace("bot_","");
          //winston.debug("botIdTmp", botIdTmp);
          //break;        
        }
      });
    
      return botIdTmp;
    }else {
      return null;
    }
  }

//TODO use request. getBotId
 getBotId(message) {
    var sender = message.sender;
    winston.debug("sender", sender);
 
    if (sender=="sytem") {
         return null;
    }
 
    var recipient = message.recipient;
    winston.debug("recipient", recipient);
 
    // botprefix
    if (recipient.startsWith('bot_')) {
      // botprefix
        return recipient.replace('bot_','');
    }
    // var text = message.text;
    // winston.debug("text", text);
    
    if ( message.request== null || message.request.participants == null) {
        return null;
    }

    var participants = message.request.participants;
    winston.debug("participants", participants);
 
    var botId = this.getBotFromParticipants(participants);
    winston.debug("botId: " + botId);
 
   if (botId) {
      return botId;
   }else {
       return null;
   }
 
}

}

 var botFromParticipant = new BotFromParticipant();

 module.exports = botFromParticipant;
 