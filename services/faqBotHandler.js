
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
const ActionsConstants = require('../models/actionsConstants');
var httpUtil = require('../utils/httpUtil');

var webhook_origin = process.env.WEBHOOK_ORIGIN || "http://localhost:3000";
winston.debug("webhook_origin: "+webhook_origin);

class FaqBotHandler {
 
    static is_command(text) {
        // console.log("msg:", msg);
        if (!text) {
          return {
            'command': null,
            'text': null
          }
        }
        // const text = msg.text;
        // console.log("msg.text:", msg.text);
        // console.log("TiledeskChatbotUtil.AGENT_COMMAND:", TiledeskChatbotUtil.AGENT_COMMAND.replace(/\\\\/g, '\\'));
        //const agent_pattern = new RegExp('^(' + TiledeskChatbotUtil.AGENT_COMMAND.replace(/\\/g, '\\\\') + ')$', 'm');
        // console.log("agent_pattern:", agent_pattern);
        //const match_agent = text.match(agent_pattern);
        //console.log("match_agent: ", match_agent);
        const match_agent = text.indexOf(ActionsConstants.CHAT_ACTION_MESSAGE.AGENT);
        const match_close = text.indexOf(ActionsConstants.CHAT_ACTION_MESSAGE.CLOSE);
        //console.log("match_agent: ", match_agent);
        // const agent_handoff = null;
        //if (match_agent && match_agent.length >=2) {
        if (match_close >-1) {
            // console.log("match!");
            //   let parts = text.split('\\agent');
            // console.log(parts)
            const new_msg_text = text.replace(ActionsConstants.CHAT_ACTION_MESSAGE.CLOSE,"");
            //   const new_msg_text = parts[0].trim()
            // console.log(new_msg_text)
            return {
                'command': ActionsConstants.CHAT_ACTION_MESSAGE.CLOSE,
                'text': new_msg_text
            }
        }
        if (match_agent >-1) {
          // console.log("match!");
        //   let parts = text.split('\\agent');
          // console.log(parts)
          const new_msg_text = text.replace(ActionsConstants.CHAT_ACTION_MESSAGE.AGENT,"");
        //   const new_msg_text = parts[0].trim()
          // console.log(new_msg_text)
          return {
            'command': ActionsConstants.CHAT_ACTION_MESSAGE.AGENT,
            'text': new_msg_text
          }
        }
        return {
          'command': null,
          'text': text
        }
      }

      
    listen() {

        var that = this;
        //modify to async
        botEvent.on('bot.message.received.notify.internal', function(message) {
                           

        //    var botName = message.request.department.bot.name;
        //    winston.debug("botName " + botName);

           var botId =  BotFromParticipant.getBotId(message);

           winston.debug("botId " + botId);

           winston.debug("message.text "+ message.text);
         

           Faq_kb.findById(botId)  //TODO add cache_bot_NOT_here it's internal bot that is deprecated-> skip caching
           //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, message.id_project+":faq_kbs:id:"+botId)
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
                var action_parameters_index = action.indexOf("?");
                if (action_parameters_index > -1) {
                    action = action.substring(0,action_parameters_index);
                }
                winston.debug("action: " + action);

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
            

           

            // EXACT MATCH
            Faq.find(query) 
            .lean().               
             exec(async (err, faqs) => {
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
                            winston.debug("clonedfaqs", clonedfaqs);

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



                            const command_parsed = FaqBotHandler.is_command(bot_answer.text);
                            winston.debug('command_parsed?', command_parsed);
    
                            if (command_parsed.command) {
                                winston.debug("agent_handoff faqs command found");                    
                            
                                messageService.send(sender, botName, message.recipient, command_parsed.command, 
                                    message.id_project, sender, {subtype: "info"}, 'text', undefined).then(function(savedMessage){
                                        winston.debug("agent_handoff faqs agent sent ", savedMessage.toObject());  
                                }).catch(function(err){    
                                    winston.log({
                                      level: 'error',
                                      message: 'Error sending message bot: '+ JSON.stringify(err) ,
                                      label: message.id_project
                                    });
                                });                                                                
                                 // PATCH: Chat clients (i.e. web widget) remove messages with text = null
                                // command_parsed.text contains the eventual text before the \agent command
                                // or 'all the message text' if \agent was not found
                                bot_answer.text = command_parsed.text? command_parsed.text : undefined;
                                winston.debug("bot_answer.text1 "+ bot_answer.text );
                            } 



                            winston.debug("bot_answer.text2 "+ bot_answer.text );
                            // if (bot_answer.text) { //can be undefined id /agent only
                                messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                    message.id_project, sender, attr, bot_answer.type, bot_answer.metadata, bot_answer.language).then(function(savedMessage){
                                        winston.debug("faqbot message botAns ", savedMessage.toObject());  
                                }).catch(function(err){    
                                    winston.log({
                                      level: 'error',
                                      message: 'Error sending message bot: '+ JSON.stringify(err) ,
                                      label: message.id_project
                                    });
                                });                                    
                            // }
                            
                                                    
                           
                        });
                      
        
                    }
                    
                        

               } else {
 

                query = { "id_project": message.id_project, "id_faq_kb": faq_kb._id};
                var mongoproject = undefined;
                var sort = undefined;

                //make http request external   
                if (faq_kb.url) {

                                                                                        
                    var url = faq_kb.url+"/parse";
                    winston.debug("fulltext search external url " + url);   

                    var json = {text: message.text, language: faq_kb.language, id_project: message.id_project, id_faq_kb: faq_kb._id};
                    winston.debug("fulltext search external json", json);   

                    var headers = {
                        'Content-Type' : 'application/json', 
                        'User-Agent': 'tiledesk-bot',
                        'Origin': webhook_origin
                        };

                    var res = await httpUtil.call(url, headers, json, "POST")
                    winston.debug("res", res);
                    
                    if (res && res.intent && res.intent.name) {
                        var intent_name = res.intent.name;
                        winston.debug("intent_name", intent_name);
                        //filtra su intent name
                        query.intent_display_name = intent_name;
                        winston.debug("query",query);                        
                    
                    }
                } else {

                    var search_obj = {"$search": message.text};

                    if (faq_kb.language) {
                        search_obj["$language"] = faq_kb.language;
                    }
                    query.$text = search_obj;
                    winston.debug("fulltext search query", query);   
                    
                    mongoproject = {score: { $meta: "textScore" } };
                    sort = { score: { $meta: "textScore" } } //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
                }               
        
            
                
                Faq.find(query,  mongoproject)  
                .sort(sort) 
                .lean().               
                exec(async (err, faqs) => {
                    if (err) {
                        return winston.error('Error getting fulltext objects.', err);      
                    }
                    winston.debug("faqs", faqs);              

                    // botprefix
                    let sender = 'bot_' + botId;
                    winston.debug("sender", sender);          
                

                    var answerObj;
                    if (faqs && faqs.length>0 && faqs[0].answer) {
                        answerObj = faqs[0];                


                        // non fare la ricerca fulltext 
                        //make http request external   
                        /*
                        if (faq_kb.url) {

                                                                                                
                            var url = faq_kb.url+"/parse";
                            winston.verbose("fulltext search external url " + url);   

                            var json = {text: message.text, language: faq_kb.language, id_project: message.id_project, id_faq_kb: faq_kb._id};
                            winston.verbose("fulltext search external json", json);   

                            var headers = {
                                'Content-Type' : 'application/json', 
                                'User-Agent': 'tiledesk-bot',
                                'Origin': webhook_origin
                                };

                            var res = await httpUtil.call(url, headers, json, "POST")
                            console.log("res", res);
                            
                            if (res && res.intent && res.intent.name) {
                                var intent_name = res.intent.name;
                                console.log("intent_name", intent_name);
                                                        //filtra su intent name
                                var queryExternal = { id_project: message.id_project, id_faq_kb: faq_kb._id, intent_display_name: intent_name};
                                winston.verbose("queryExternal",queryExternal);

                                var faqExternal = await Faq.findOne(queryExternal) 
                                    .lean().               
                                    exec();

                                winston.verbose("faqExternal",faqExternal);

                                if (faqExternal) {
                                    answerObj = faqExternal;
                                }
                            
                            }
                        }
                        */





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
                            winston.debug("clonedfaqs", clonedfaqs);

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


                            const command_parsed = FaqBotHandler.is_command(bot_answer.text);
                            winston.debug('command_parsed?', command_parsed);
    
                            if (command_parsed.command) {
                                winston.debug("agent_handoff faqs command found");                    
                            
                                messageService.send(sender, botName, message.recipient, command_parsed.command, 
                                    message.id_project, sender, {subtype: "info"}, 'text', undefined).then(function(savedMessage){
                                        winston.debug("agent_handoff faqs agent sent ", savedMessage.toObject());  
                                }).catch(function(err){    
                                    winston.log({
                                      level: 'error',
                                      message: 'Error sending message bot: '+ JSON.stringify(err) ,
                                      label: message.id_project
                                    });
                                });           

                                 // PATCH: Chat clients (i.e. web widget) remove messages with text = null
                                // command_parsed.text contains the eventual text before the \agent command
                                // or 'all the message text' if \agent was not found
                                bot_answer.text = command_parsed.text? command_parsed.text : undefined;
                                winston.debug("bot_answer.text1 "+ bot_answer.text );
                            } 



                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes) {
                                messageService.send(sender, botName, message.recipient, bot_answer.text, 
                                    message.id_project, sender, attr, bot_answer.type, bot_answer.metadata, bot_answer.language).then(function(savedMessage){

                                        winston.debug("faqbot message sending ", savedMessage.toObject());  
                                }).catch(function(err){    
                                    winston.log({
                                      level: 'error',
                                      message: 'Error sending message bot: '+ JSON.stringify(err) ,
                                      label: message.id_project
                                    });
                                });           
                        });
                        
        
                    }
                    
                        var threshold = 1.2;

                        faqBotSupport.getBotMessage(answerObj, message.id_project, faq_kb, message, threshold).then(function(botAns){
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



                            const command_parsed = FaqBotHandler.is_command(botAns.text);
                            winston.debug('command_parsed?', command_parsed);
    
                            if (command_parsed.command) {
                                winston.debug("agent_handoff faqs command found");                    
                            
                                messageService.send(sender, botName, message.recipient, command_parsed.command, 
                                    message.id_project, sender, {subtype: "info"}, 'text', undefined).then(function(savedMessage){
                                        winston.debug("agent_handoff faqs agent sent ", savedMessage.toObject());  
                                }).catch(function(err){    
                                    winston.log({
                                      level: 'error',
                                      message: 'Error sending message bot: '+ JSON.stringify(err) ,
                                      label: message.id_project
                                    });
                                });                                                      
                                 // PATCH: Chat clients (i.e. web widget) remove messages with text = null
                                // command_parsed.text contains the eventual text before the \agent command
                                // or 'all the message text' if \agent was not found
                                botAns.text = command_parsed.text? command_parsed.text : undefined;
                                winston.debug("bot_answer.text1 "+ botAns.text );
                            } 




                            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata) 
                            messageService.send(sender, botName, message.recipient, botAns.text, 
                                message.id_project, sender, attr, botAns.type, botAns.metadata, botAns.language).then(function(savedMessage){
                                    winston.debug("faqbot message botAns " ,savedMessage.toObject());  
                            })
                            .catch(function(err){    
                                winston.log({
                                  level: 'error',
                                  message: 'Error sending message bot: '+ JSON.stringify(err) + " " + JSON.stringify(botAns.text) ,
                                  label: message.id_project
                                });
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