let winston = require('../config/winston');


class BotFromParticipant {

     //TODO use request. getBotId
 getBotFromParticipants(participants) {
    let botIdTmp;
  
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
    let sender = message.sender;
    winston.debug("sender", sender);
 
    if (sender=="sytem") {
         return null;
    }
 
    let recipient = message.recipient;
    winston.debug("recipient", recipient);
 
    // botprefix
    if (recipient.startsWith('bot_')) {
      // botprefix
        return recipient.replace('bot_','');
    }
    // let text = message.text;
    // winston.debug("text", text);
    
    if ( message.request== null || message.request.participants == null) {
        return null;
    }

    let participants = message.request.participants;
    winston.debug("participants", participants);
 
    let botId = this.getBotFromParticipants(participants);
    winston.debug("botId: " + botId);
 
   if (botId) {
      return botId;
   }else {
       return null;
   }
 
}

}

 let botFromParticipant = new BotFromParticipant();

 module.exports = botFromParticipant;
 