
const botEvent = require('../event/botEvent');
var Faq = require('../models/faq');
var Faq_kb = require('../models/faq_kb');
var messageService = require('../services/messageService');
var MessageConstants = require("../models/messageConstants");
var winston = require('../config/winston');
var faqBotSupport = require('../services/faqBotSupport');
var BotFromParticipant = require("../utils/botFromParticipant");

class FaqBotHandler {
 
    listen() {

        //modify to async
        botEvent.on('bot.message.received.notify.internal', function(message) {
                           

        //    var botName = message.request.department.bot.name;
        //    winston.debug("botName " + botName);

           var botId =  BotFromParticipant.getBotId(message);

           winston.debug("botId " + botId);

           winston.debug("message.text "+ message.text);
         

           Faq_kb.findById(botId).exec(function(err, faq_kb) {
            if (err) {
              return res.status(500).send({ success: false, msg: 'Error getting object.' });
            }
            if (!faq_kb) {
              return res.status(404).send({ success: false, msg: 'Object not found.' });
            }
            winston.debug('faq_kb ', faq_kb.toJSON());
            winston.debug('faq_kb.type :'+ faq_kb.type);

            var botName = faq_kb.name;
            winston.debug("botName " + botName);

            var query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id, "question": message.text};


            Faq.find(query) 
            .lean().               
             exec(function (err, faqs) {
               if (err) {
                 return res.status(500).send({ success: false, msg: 'Error getting object.' });
               }

               if (faqs && faqs.length>0) {
                    winston.debug("faqs exact", faqs);              
        
                    winston.debug("faqs", faqs);              

                    let sender = 'bot_' + botId;
                    winston.debug("sender", sender);          
                

                    var answerObj;
                    if (faqs && faqs.length>0 && faqs[0].answer) {
                        answerObj = faqs[0];                

                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type) {
                        messageService.send(sender, botName, message.recipient, answerObj.answer, 
                            message.id_project, sender).then(function(savedMessage){

                                winston.info("faqbot message sending ", savedMessage.toObject());  
                        });
        
                    }
                    
                

                    faqBotSupport.getBotMessage(answerObj, message.id_project, message.request.department._id, message.language, 1.2).then(function(botAns){
                        winston.debug("faqbot message botAns ", botAns);  

                        if (botAns) {
                            let attributes = {bot_reponse_template: botAns.template};
                            messageService.send(sender, botName, message.recipient, botAns.text, 
                                message.id_project, sender, attributes).then(function(savedMessage){
                                    winston.info("faqbot message botAns " ,savedMessage.toObject());  
                            });
                        }
                    

                    });


               } else {
 
                query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id};
                query.$text = {"$search": message.text};
            
                Faq.find(query,  {score: { $meta: "textScore" } })  
                .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
                .lean().               
                exec(function (err, faqs) {
                    winston.debug("faqs", faqs);              

                    let sender = 'bot_' + botId;
                    winston.debug("sender", sender);          
                

                    var answerObj;
                    if (faqs && faqs.length>0 && faqs[0].answer) {
                        answerObj = faqs[0];                

                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
                        messageService.send(sender, botName, message.recipient, answerObj.answer, 
                            message.id_project, sender).then(function(savedMessage){

                                winston.info("faqbot message sending ", savedMessage.toObject());  
                        });
        
                    }
                    
                

                    faqBotSupport.getBotMessage(answerObj, message.id_project, message.request.department._id, message.language, 1.2).then(function(botAns){
                        winston.debug("faqbot message botAns ", botAns);  

                        if (botAns) {
                            let attributes = {bot_reponse_template: botAns.template};
                            messageService.send(sender, botName, message.recipient, botAns.text, 
                                message.id_project, sender, attributes).then(function(savedMessage){
                                    winston.debug("faqbot message botAns " ,savedMessage.toObject());  
                            });
                        }

                    });


               

        
                });

            }
           
                

        });



             });

          
        });
    }







    
   

    
}

var faqBotHandler = new FaqBotHandler();
module.exports = faqBotHandler;