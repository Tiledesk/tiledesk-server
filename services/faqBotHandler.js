
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
var mongoose = require('mongoose');
const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');

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
              return winston.error("Error getting bot object.",err);
            }
            if (!faq_kb) {
                return winston.error("Bot not found with id: "+botId);              
            }
            winston.debug('faq_kb ', faq_kb.toJSON());
            winston.debug('faq_kb.type :'+ faq_kb.type);

            var botName = faq_kb.name;
            winston.debug("botName " + botName);
           

            var query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id, "question": message.text};

            if (message.attributes && message.attributes.action) {
                var action = message.attributes.action;
                
                var isObjectId = mongoose.Types.ObjectId.isValid(action);
                winston.debug("isObjectId:"+ isObjectId);
                             
              
                if (isObjectId) {                    
                    query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id, "_id": action};
                }else {
                    query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id,  $or:[{"intent_id": action}, {"intent_display_name": action}]};
                }
                
                winston.debug("query message.attributes.action ", query);
            }

            
            if (message.request && message.request.attributes && message.request.attributes.blocked_intent) {
                query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id,  $or:[{"intent_id": message.request.attributes.blocked_intent}, {"intent_display_name": message.request.attributes.blocked_intent}]};
                // TODO skip if type  reset (better create a resetIntent action /reset reset the attributes) -> TODO DELETE message.request.attributes.blocked_intent for next call
                winston.debug("query message.attributes.blocked_intent ", query);
                // res.send({text:"ripeti la mail", action: id_intent}); fai un test che forse già funziona
            }
            

           


            Faq.find(query) 
            .lean().               
             exec(function (err, faqs) {
               if (err) {
                return winston.error("Error getting faq object.",err);                
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



                // ===         TEMPORARY: search for handoff to agent command (\agent)
                
                        const handoff_parsed = TiledeskChatbotUtil.is_agent_handoff_command(message);
                        winston.debug('handoff_parsed?', handoff_parsed);

                        if (handoff_parsed.agent_handoff) {
                            winston.verbose("agent_handoff faqs command found");                    
                        
                            messageService.send(sender, botName, message.recipient, handoff_parsed.agent_handoff, 
                                message.id_project, sender, {subtype: "info"}, 'text', undefined).then(function(savedMessage){
                                    winston.info("agent_handoff faqs agent sent ", savedMessage.toObject());  
                            });                                                       
                             // PATCH: Chat clients (i.e. web widget) remove messages with text = null
                            // handoff_parsed.text contains the eventual text before the \agent command
                            // or 'all the message text' if \agent was not found
                            message.text = handoff_parsed.text? handoff_parsed.text : '';
                        }
                       
                        // ===         TEMPORARY: search for handoff to agent command (\agent)


                        // qui
                        faqBotSupport.getParsedMessage(answerObj.answer, message, faq_kb, answerObj).then(function(bot_answer) {
                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type) {
                           

                            var attr = bot_answer.attributes;                            
                            if (!attr) {
                                attr = {};
                            }
                           // attr._answer = that.getCircularReplacer(answerObj);
                            if (answerObj && answerObj._id) {
                                attr._answerid = answerObj._id.toString();
                            }                            
                            
                            let question_payload = Object.assign({}, message);
                            delete question_payload.request;

                            winston.debug("question_payload", question_payload);

                            let clonedfaqs = faqs.slice();
                            if (clonedfaqs && clonedfaqs.length>0) {
                                clonedfaqs = clonedfaqs.shift()
                            }
                            winston.verbose("clonedfaqs", clonedfaqs);

                            const intent_info = {
                                intent_name: answerObj.intent_display_name,
                                is_fallback: false,
                                confidence: answerObj.score,
                                question_payload: question_payload,
                                others: clonedfaqs
                              }
                            winston.debug("intent_info", intent_info);
                            attr.intent_info = intent_info;
                                                       
                            winston.debug("answerObj", answerObj);
                            // winston.info("that.getCircularReplacer(answerObj)",  that.getCircularReplacer(answerObj));
                            winston.debug("attr", attr);

                            messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                message.id_project, sender, attr, bot_answer.type, bot_answer.metadata, bot_answer.language).then(function(savedMessage){
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


                         // ===         TEMPORARY: search for handoff to agent command (\agent)
                
                         const handoff_parsed = TiledeskChatbotUtil.is_agent_handoff_command(message);
                         winston.debug('handoff_parsed?', handoff_parsed);
 
                         if (handoff_parsed.agent_handoff) {
                             winston.verbose("agent_handoff faqs search command found");                    
                         
                             messageService.send(sender, botName, message.recipient, handoff_parsed.agent_handoff, 
                                 message.id_project, sender, {subtype: "info"}, 'text', undefined).then(function(savedMessage){
                                     winston.info("agent_handoff faqs search agent sent ", savedMessage.toObject());  
                             });                                                       
                              // PATCH: Chat clients (i.e. web widget) remove messages with text = null
                             // handoff_parsed.text contains the eventual text before the \agent command
                             // or 'all the message text' if \agent was not found
                             message.text = handoff_parsed.text? handoff_parsed.text : '';
                         }
                        
                         // ===         TEMPORARY: search for handoff to agent command (\agent)

                         
                        // qui
                        faqBotSupport.getParsedMessage(answerObj.answer, message, faq_kb, answerObj).then(function(bot_answer) {

                            var attr = bot_answer.attributes;                            
                            if (!attr) {
                                attr = {};
                            }
                            // attr._answer = that.getCircularReplacer(answerObj);
                            if (answerObj && answerObj._id) {
                                attr._answerid = answerObj._id.toString();
                            }



                            let question_payload = Object.assign({}, message);
                            delete question_payload.request;

                            winston.debug("question_payload", question_payload);

                            let clonedfaqs = faqs.slice();
                            if (clonedfaqs && clonedfaqs.length>0) {
                                clonedfaqs = clonedfaqs.shift()
                            }
                            winston.verbose("clonedfaqs", clonedfaqs);

                            const intent_info = {
                                intent_name: answerObj.intent_display_name,
                                is_fallback: false,
                                confidence: answerObj.score,
                                question_payload: question_payload,
                                others: clonedfaqs
                              }
                            winston.debug("intent_info", intent_info);
                            attr.intent_info = intent_info;


                            
                            winston.debug("attr", attr);
                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
                                messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                    message.id_project, sender, attr, bot_answer.type, bot_answer.metadata, bot_answer.language).then(function(savedMessage){

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
                                var project_user = undefined;
                                // emit(name, attributes, id_project, project_user, createdBy, status) {                                
                                eventService.emit("faqbot.answer_not_found", 
                                          // optional. TODO fare solo text
                                        { botAnswer:answerObj, 
                                            bot: faq_kb, message:message},
                                        //threshold:threshold}, 
                                        message.id_project, project_user,  "system", undefined);
                            }
                           
                            // not sending with ws event with project_user undefined {"_id":"601be8bf5e24bf0012d653be","name":"faqbot.answer_not_found","attributes":{"bot":{"type":"internal","_id":"601baf4d9974d20019469ea8","name":"Bot2","description":"HI,IM","id_project":"60113c4f9974d200191d90d3","trashed":false,"createdBy":"60113ba19974d200191d868a","createdAt":"2021-02-04T08:24:45.137Z","updatedAt":"2021-02-04T08:24:45.137Z","__v":0},"message":{"senderFullname":"IndelishFinal ","type":"text","channel_type":"group","status":0,"_id":"601be8be5e24bf0012d653b7","sender":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","recipient":"support-group-acbc3f18-fc6b-41fc-a257-ce68f51f2551","text":"Chineese","id_project":"60113c4f9974d200191d90d3","createdBy":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","channel":{"name":"chat21"},"createdAt":"2021-02-04T12:29:50.753Z","updatedAt":"2021-02-04T12:29:50.753Z","__v":0,"request":{"_id":"601be8be5e24bf0012d653b4","status":200,"preflight":false,"hasBot":true,"participants":["bot_601baf4d9974d20019469ea8"],"participantsAgents":[],"participantsBots":["601baf4d9974d20019469ea8"],"request_id":"support-group-acbc3f18-fc6b-41fc-a257-ce68f51f2551","requester":{"_id":"601be8945e24bf0012d65311","user_available":true,"number_assigned_requests":0,"last_login_at":"2021-02-04T11:47:39.753Z","status":"active","id_project":"60113c4f9974d200191d90d3","uuid_user":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","role":"guest","createdBy":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","createdAt":"2021-02-04T12:29:08.397Z","updatedAt":"2021-02-04T12:29:08.397Z","__v":0},"lead":{"_id":"601be8be5e24bf0012d653b3","status":100,"lead_id":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","fullname":"IndelishFinal ","id_project":"60113c4f9974d200191d90d3","createdBy":"system","tags":[],"createdAt":"2021-02-04T12:29:50.696Z","updatedAt":"2021-02-04T12:29:50.696Z","__v":0},"first_text":"Chineese","department":{"_id":"60113c4f9974d200191d90d5","routing":"assigned","default":true,"status":1,"name":"Default Department","id_project":"60113c4f9974d200191d90d3","createdBy":"60113ba19974d200191d868a","createdAt":"2021-01-27T10:11:27.117Z","updatedAt":"2021-02-04T08:27:04.354Z","__v":0,"id_bot":"601baf4d9974d20019469ea8","id_group":null,"bot":{"type":"internal","_id":"601baf4d9974d20019469ea8","name":"Bot2","description":"HI,IM","id_project":"60113c4f9974d200191d90d3","trashed":false,"createdBy":"60113ba19974d200191d868a","createdAt":"2021-02-04T08:24:45.137Z","updatedAt":"2021-02-04T08:24:45.137Z","__v":0}},"agents":[{"user_available":false,"number_assigned_requests":4,"last_login_at":"2021-01-21T20:57:22.057Z","status":"active","_id":"601308d89974d2001925e57e","id_project":"60113c4f9974d200191d90d3","id_user":"6012f23e9974d200192594cc","role":"agent","createdBy":"60113ba19974d200191d868a","createdAt":"2021-01-28T18:56:24.213Z","updatedAt":"2021-01-28T18:56:24.213Z","__v":0,"max_assigned_chat":-1},{"user_available":false,"number_assigned_requests":12,"last_login_at":"2021-01-21T20:57:22.057Z","status":"active","_id":"60113c4f9974d200191d90d4","id_project":"60113c4f9974d200191d90d3","id_user":"60113ba19974d200191d868a","role":"owner","createdBy":"60113ba19974d200191d868a","createdAt":"2021-01-27T10:11:27.110Z","updatedAt":"2021-01-27T10:11:27.110Z","__v":0,"presence":{"status":"online","changedAt":"2021-02-04T12:21:50.878Z"},"max_assigned_chat":-1}],"assigned_at":"2021-02-04T12:29:50.732Z","id_project":"60113c4f9974d200191d90d3","createdBy":"acbc3f18-fc6b-41fc-a257-ce68f51f2551","channel":{"name":"chat21"},"tags":[],"notes":[],"channelOutbound":{"name":"chat21"},"createdAt":"2021-02-04T12:29:50.739Z","updatedAt":"2021-02-04T12:29:50.739Z","__v":0,"participatingAgents":[],"participatingBots":[{"_id":"601baf4d9974d20019469ea8","type":"internal","name":"Bot2","description":"HI,IM","id_project":"60113c4f9974d200191d90d3","trashed":false,"createdBy":"60113ba19974d200191d868a","createdAt":"2021-02-04T08:24:45.137Z","updatedAt":"2021-02-04T08:24:45.137Z","__v":0}]}}},"id_project":"60113c4f9974d200191d90d3","createdBy":"system","createdAt":"2021-02-04T12:29:51.074Z","updatedAt":"2021-02-04T12:29:51.074Z","__v":0,"id":"601be8bf5e24bf0012d653be"}

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
                            


                            let question_payload = Object.assign({}, message);
                            delete question_payload.request;

                            winston.debug("question_payload", question_payload);

                            const intent_info = {
                                intent_name: "DEFAULT_FALLBACK", //answerObj.intent_display_name
                                is_fallback: true,
                                confidence: 0,
                                question_payload: question_payload 
                              }
                            winston.debug("intent_info", intent_info);
                            attr.intent_info = intent_info;

                            


                            winston.debug("attr", attr);


                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata) 
                            messageService.send(sender, botName, message.recipient, botAns.text, 
                                message.id_project, sender, attr, botAns.type, botAns.metadata, botAns.language).then(function(savedMessage){
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