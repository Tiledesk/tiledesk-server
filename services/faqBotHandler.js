
const botEvent = require('../event/botEvent');
var Faq = require('../models/faq');
var Faq_kb = require('../models/faq_kb');
var messageService = require('../services/messageService');
var MessageConstants = require("../models/messageConstants");
var winston = require('../config/winston');
var faqBotSupport = require('../services/faqBotSupport');
var BotFromParticipant = require("../utils/botFromParticipant");
var cacheUtil = require('../utils/cacheUtil');
var eventService = require('../pubmodules/events/eventService');

class FaqBotHandler {
 

      
    listen() {

        var that = this;
        //modify to async
        botEvent.on('bot.message.received.notify.internal', function(message) {
                           

        //    var botName = message.request.department.bot.name;
        //    winston.debug("botName " + botName);

           var botId =  BotFromParticipant.getBotId(message);

           winston.debug("botId " + botId);

           winston.debug("message.text "+ message.text);
         

           Faq_kb.findById(botId)
           .cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+botId)
           .exec(function(err, faq_kb) {
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

                    // botprefix
                    let sender = 'bot_' + botId;
                    winston.debug("sender", sender);          
                

                    var answerObj;
                    if (faqs && faqs.length>0 && faqs[0].answer) {
                        answerObj = faqs[0];     

                        answerObj.score = 100; //exact search not set score
                        winston.debug("answerObj.score", answerObj.score);  

                        faqBotSupport.getButtonFromText(answerObj.answer, message, faq_kb, answerObj).then(function(bot_answer) {
                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type) {
                           

                            var attr = bot_answer.attributes;                            
                            if (!attr) {
                                attr = {};
                            }
                           // attr._answer = that.getCircularReplacer(answerObj);
                            if (answerObj && answerObj._id) {
                                attr._answerid = answerObj._id.toString();
                            }
                                                       
                            winston.debug("answerObj", answerObj);
                            // winston.info("that.getCircularReplacer(answerObj)",  that.getCircularReplacer(answerObj));
                            winston.debug("attr", attr);

                            messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                message.id_project, sender, attr, bot_answer.type, bot_answer.metadata).then(function(savedMessage){
                                    winston.debug("faqbot message botAns ", savedMessage.toObject());  
                            });
                        
                           /* messageService.send(sender, botName, message.recipient, answerObj.answer, 
                                message.id_project, sender).then(function(savedMessage){
                                    winston.info("faqbot message sending ", savedMessage.toObject());  
                            });*/
                        });
                      
        
                    }
                    
                
                    // getBotMessageNew(botAnswer, projectid, bot, language, threshold) 
                    // faqBotSupport.getBotMessageNew(answerObj, message.id_project, faq_kb, message, 1.2).then(function(botAns){
                    // // faqBotSupport.getBotMessage(answerObj, message.id_project, message.request.department._id, message.language, 1.2).then(function(botAns){
                    //     winston.debug("faqbot message botAns ", botAns);  

                    //     if (botAns) {
                    //         // let attributes = {bot_reponse_template: botAns.template};
                    //         messageService.send(sender, botName, message.recipient, botAns.text, 
                    //             message.id_project, sender, botAns.attributes, botAns.type, botAns.metadata).then(function(savedMessage){
                    //                 winston.info("faqbot message bot answer " ,savedMessage.toObject());  
                    //         });                           
                    //     }            
                    // });


               } else {
 
                query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id};
                query.$text = {"$search": message.text};
            
                Faq.find(query,  {score: { $meta: "textScore" } })  
                .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
                .lean().               
                exec(function (err, faqs) {
                    winston.debug("faqs", faqs);              

                    // botprefix
                    let sender = 'bot_' + botId;
                    winston.debug("sender", sender);          
                

                    var answerObj;
                    if (faqs && faqs.length>0 && faqs[0].answer) {
                        answerObj = faqs[0];                

                        faqBotSupport.getButtonFromText(answerObj.answer, message, faq_kb, answerObj).then(function(bot_answer) {

                            var attr = bot_answer.attributes;                            
                            if (!attr) {
                                attr = {};
                            }
                            // attr._answer = that.getCircularReplacer(answerObj);
                            if (answerObj && answerObj._id) {
                                attr._answerid = answerObj._id.toString();
                            }
                            
                            winston.debug("attr", attr);
                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
                                messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                    message.id_project, sender, attr, bot_answer.type, bot_answer.metadata).then(function(savedMessage){

                                        winston.debug("faqbot message sending ", savedMessage.toObject());  
                                });
                        });
                        
        
                    }
                    
                        var threshold = 1.2;

                        faqBotSupport.getBotMessage(answerObj, message.id_project, faq_kb, message, threshold).then(function(botAns){
                    // faqBotSupport.getBotMessage(answerObj, message.id_project, message.request.department._id, message.language, 1.2).then(function(botAns){
                        winston.debug("faqbot message botAns ", botAns);  

                        if (botAns) {

                            if (botAns.defaultFallback === true) {
                                winston.debug("defaultFallback event");  
                                //           emit(name,                     attributes,                                                                id_project,         project_user, createdBy, user) {
                                eventService.emit("faqbot.answer_not_found", 
                                          // optional. TODO fare solo text
                                        { botAnswer:answerObj, 
                                            bot: faq_kb, message:message},
                                        //threshold:threshold}, 
                                        message.id_project, undefined,  "system", undefined);
                            }
                            

                            var attr = botAns.attributes;                            
                            if (!attr) {
                                attr = {};
                            }

                     
                            winston.debug("botAns", botAns);


                            //Mongoose error to save botAns
                            // let clonedBotAns = Object.assign({}, botAns);
                            // delete clonedBotAns.attributes;
                            // winston.info("********clonedBotAns: "+ JSON.stringify(clonedBotAns));

                            // attr._answer = clonedBotAns;
                            if (botAns._id) {
                                attr._answerid = botAns._id.toString();
                            }
                            

                            winston.debug("attr", attr);


                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata) 
                            messageService.send(sender, botName, message.recipient, botAns.text, 
                                message.id_project, sender, attr, botAns.type, botAns.metadata).then(function(savedMessage){
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