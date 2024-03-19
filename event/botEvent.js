const EventEmitter = require('events');
const messageEvent = require('../event/messageEvent');
const Faq_kb = require('../models/faq_kb');
var winston = require('../config/winston');


const cacheUtil = require("../utils/cacheUtil");
const cacheEnabler = require("../services/cacheEnabler");

// class BotEvent extends EventEmitter {}
class BotEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
        this.setMaxListeners(11);
      }


      listen() {
        //TODO modify to async
        //messageEvent.on('message.received', function(message) {


        var messageCreateKey = 'message.create';
        if (messageEvent.queueEnabled) {
            messageCreateKey = 'message.create.queue';
        }

        winston.info("Listening " + messageCreateKey + " event for Chatbot messages");

        messageEvent.on(messageCreateKey, function(message) {

            winston.debug("message", message);

            // TODO usa meglio se attributes.reply_always=true

            // if (message.sender === "system" && message.text && message.text!="\\start") {
            //     winston.debug("it s a message sent from system, exit");
            //     return null;
            // }


            //sbagliato
            // if (message.sender === "system" && message.text && (message.text=="\\start" || message.text=="/start") ) {
            //     winston.debug("it s a start message");
            // } else {
            //     winston.debug("it s a message sent from system, exit");
            //     return null;
            // }

            if (message.sender === "system") {
                if (message.text && (message.text=="\\start" || message.text=="/start") ) {
                    winston.debug("it s a start message");
                } else {
                    winston.debug("it s a message sent from system, exit");
                    return null;
                }
            } else {
                winston.debug("it s a message sent from other let s go");
            }
            
            if (message.text && ( message.text.indexOf("\\agent") > -1 || message.text.indexOf("\\close") > -1)) { //not reply to a message containing \\agent
                return 0;
            }

            // if (message.text.startsWith("\\")) { //not reply to a message containing \
            //     return null;
            // }
            
        var botId = getBotId(message);

        winston.debug("botId: " + botId);

        if (!botId) {
                return null;
            }else {
                                                        //loop fix for messages sent from external bot    
                // botprefix         
                if (message.sender === 'bot_'+botId || message.sender === botId) {
                    winston.debug("it s a message sent from bot, exit");
                    return null;        
                }else {
                    messageEvent.emit('message.received.for.bot', message);  //UNUSED
                }

            }

            // qui potresti leggere anche +secret ed evitare prossima query in botNotification
            // let qbot = Faq_kb.findById(botId);  //TODO add cache_bot_here
            let qbot = Faq_kb.findById(botId).select('+secret')
        //TODO unselect secret. secret is unselectable by default in the model

                if (cacheEnabler.faq_kb) {
                    winston.debug('message.id_project+":faq_kbs:id:"+botId: '+ message.id_project+":faq_kbs:id:"+botId);  
                    // qbot.cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+botId)
                    qbot.cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+botId+":secret")
                    winston.debug('faq_kb cache enabled');
                }

                qbot.exec(function(err, bot) {


            
                if (err) {
                winston.error('Error getting object.', err);
                return 0;
                }
                if (!bot) {
                    winston.warn('Bot not found with id '+botId);
                }

                winston.debug("bot debug", bot);
                winston.debug('bot debug secret: '+ bot.secret);

                if (bot) {
                    if (bot.type==="internal") {
                        botEvent.emit('bot.message.received.notify.internal', message);
                    
                    }else {  //external 
                        if (bot.url) {
                            var botNotification = {bot: bot, message: message};
                            botEvent.emit('bot.message.received.notify.external', botNotification);
                        }else {
                            winston.warn("bot url is not defined", bot);
                        }
                    }
                } 

            });
            


        });

      }

}

const botEvent = new BotEvent();

//TODO use request. getBotId
function getBotFromParticipants(participants) {
    var botIdTmp;
  
    if (participants) {
      participants.forEach(function(participant) { 
        winston.debug("participant", participant);
        
        // botprefix
        if (participant.indexOf("bot_")> -1) {
            // botprefix
          botIdTmp = participant.replace("bot_","");
          winston.debug("botIdTmp", botIdTmp);
          //break;        
        }
      });
    
      return botIdTmp;
    }else {
      return null;
    }
  }

//TODO use request. getBotId
function getBotId(message) {
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
 
    var botId = getBotFromParticipants(participants);
    winston.debug("botId: " + botId);
 
   if (botId) {
      return botId;
   }else {
       return null;
   }
 
}



module.exports = botEvent;
