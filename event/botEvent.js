const EventEmitter = require('events');
const messageEvent = require('../event/messageEvent');
const Faq_kb = require('../models/faq_kb');
var winston = require('../config/winston');
const cacheUtil = require("../utils/cacheUtil");
const cacheEnabler = require("../services/cacheEnabler");
var Faq = require("../models/faq");
const { Webhook } = require('../models/webhook');

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

        messageEvent.on(messageCreateKey, function (message) {

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
                if (message.text && (message.text == "\\start" || message.text == "/start")) {
                    winston.debug("it s a start message");
                } else {
                    winston.debug("it s a message sent from system, exit");
                    return null;
                }
            } else {
                winston.debug("it s a message sent from other let s go");
            }

            if (message.text && (message.text.indexOf("\\agent") > -1 || message.text.indexOf("\\close") > -1)) { //not reply to a message containing \\agent
                return 0;
            }

            // if (message.text.startsWith("\\")) { //not reply to a message containing \
            //     return null;
            // }

            var botId = getBotId(message);

            winston.debug("botId: " + botId);

            if (!botId) {
                return null;
            } else {
                //loop fix for messages sent from external bot    
                // botprefix         
                if (message.sender === 'bot_' + botId || message.sender === botId) {
                    winston.debug("it s a message sent from bot, exit");
                    return null;
                } else {
                    messageEvent.emit('message.received.for.bot', message);  //UNUSED
                }

            }

            // qui potresti leggere anche +secret ed evitare prossima query in botNotification
            // let qbot = Faq_kb.findById(botId);  //TODO add cache_bot_here
            let qbot = Faq_kb.findById(botId).select('+secret')
            //TODO unselect secret. secret is unselectable by default in the model

            if (cacheEnabler.faq_kb) {
                winston.debug('message.id_project+":faq_kbs:id:"+botId: ' + message.id_project + ":faq_kbs:id:" + botId);
                // qbot.cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+botId)
                qbot.cache(cacheUtil.defaultTTL, message.id_project + ":faq_kbs:id:" + botId + ":secret")
                winston.debug('faq_kb cache enabled');
            }

            qbot.exec(function (err, bot) {

                if (err) {
                    winston.error('Error getting object.', err);
                    return 0;
                }
                if (!bot) {
                    winston.warn('Bot not found with id ' + botId);
                }

                winston.debug("bot debug", bot);
                winston.debug('bot debug secret: ' + bot.secret);

                if (bot) {
                    if (bot.type === "internal") {
                        botEvent.emit('bot.message.received.notify.internal', message);

                    } else {  //external 
                        if (bot.url) {
                            var botNotification = { bot: bot, message: message };
                            botEvent.emit('bot.message.received.notify.external', botNotification);
                        } else {
                            winston.warn("bot url is not defined", bot);
                        }
                    }
                }

            });

        });

        botEvent.on('faqbot.update.virtual.delete', async (chatbot) => {
            winston.verbose("botEvent ON faqbot.update.virtual.delete: ", chatbot);

            if (chatbot.publishedAt) {
                // Stop the flow if the chatbot is a published one
                return;
            }

            await Faq.updateMany({ id_faq_kb: chatbot._id }, { trashed: true, trashedAt: chatbot.trashedAt }).catch((err) => {
                winston.error("Event faqbot.update.virtual.delete error updating faqs ", err);
            })

            let deletedW = await Webhook.findOneAndDelete({ chatbot_id: chatbot._id }).catch((err) => {
                winston.error("Error deleting webhook on chatbot deleting: ", err);
            })

            let publishedChatbots = await Faq_kb.find({ root_id: chatbot._id }, { _id: 1 }).catch((err) => {
                winston.error("Event faqbot.update.virtual.delete error getting all published chatbots ", err);
            })

            const publishedChatbotIds = publishedChatbots.map(c => c._id);

            if (publishedChatbotIds.length > 0) {

                const batchSize = 20;
                const sleep_ms = 500;
                const batches = [];
                for (let i = 0; i < publishedChatbotIds.length; i += batchSize) {
                    batches.push(publishedChatbotIds.slice(i, i + batchSize));
                }

                for (const batch of batches) {
                    await Faq_kb.updateMany(
                        { _id: { $in: batch } },
                        { $set: { trashed: true, trashedAt: chatbot.trashedAt } }
                    );

                    await Faq.updateMany(
                        { id_faq_kb: { $in: batch } },
                        { $set: { trashed: true, trashedAt: chatbot.trashedAt } }
                    );
                
                    await sleep(sleep_ms);
                }                

            }
        })

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
          }

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
