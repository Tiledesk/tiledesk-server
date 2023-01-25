

'use strict';

const Faq = require('../models/faq');
const Faq_kb = require('../models/faq_kb');
var winston = require('../config/winston');

var jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');

const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');

var request = require('retry-request', {
    request: require('request')
  });

 
var webhook_origin = process.env.WEBHOOK_ORIGIN || "http://localhost:3000";
winston.debug("webhook_origin: "+webhook_origin);

class FaqBotSupport {


      

    getMessage(key, lang, labelsObject) {
       

        if (!lang) {
            lang = "EN";
        }

        lang = lang.toUpperCase();

        winston.debug('getMessage: ' + key + ' ' + lang+ ' ' + JSON.stringify(labelsObject) );

        var label = "";

        try {
            // winston.debug("1");
         label = labelsObject[lang][key];
        //  winston.debug("2");
        } catch(e) {
            // winston.debug("Error", e);
         label = labelsObject["EN"][key];
        }
        winston.debug('label: ' + label );
        return label;
     
    }
// usa api di sponziello parseReply: https://github.com/Tiledesk/tiledesk-nodejs-libs/blob/master/tiledesk-chatbot-util/index.js 

    parseMicrolanguage(text, message, bot, faq, disableWebHook, json) { 
        var that = this;
        return new Promise(async (resolve, reject) => {
            winston.debug('parseMicrolanguage message: ' + JSON.stringify(message) );
            var reply = TiledeskChatbotUtil.parseReply(text);
            winston.debug('parseReply: ' + JSON.stringify(reply) );
            var messageReply = reply.message;
            
            var msg_attributes = {"_raw_message": text};

            // prendi attributi e li mergi
            // metadata prendi da messageReply SOLO SE CI SONO (DIVERSI NULL). Se riesci fai il merge
            // prendi type e text

            // if (message && message.attributes) {
            //     for(const [key, value] of Object.entries(message.attributes)) {
            //       msg_attributes[key] = value
            //     }
            // }

            if (json && json.attributes) {
                for(const [key, value] of Object.entries(json.attributes)) {
                  msg_attributes[key] = value
                }
            }

            if (messageReply && messageReply.attributes) {
                for(const [key, value] of Object.entries(messageReply.attributes)) {
                  msg_attributes[key] = value
                }
            }

            messageReply.attributes = msg_attributes;
            
            // not used in faqBotHandler but used when the message is returned by webhook (subscription). So you must clone(add) all message fields here.
            // winston.debug('message.language: '+ message.language );
            // if (message.language) {
            //     messageReply.language = message.language;
            // }

            if (json && json.language) {
                messageReply.language = json.language;
            }

            if (json && json.type) {
                messageReply.type = json.type;
            } 
            
            if (json && json.metadata) {
                messageReply.metadata = json.metadata;
            }

        
            winston.debug('faq: ', faq );
            if (disableWebHook === false && bot.webhook_enabled ===true && (faq.webhook_enabled  === true || reply.webhook)) {

                winston.debug("bot.webhook_url "+ bot.webhook_url)
                var webhookurl = bot.webhook_url;

               
                winston.debug("reply.webhook "+ reply.webhook )

                if (reply.webhook) {
                     if (reply.webhook === true) {
                        webhookurl = bot.webhook_url;
                    } else {
                        webhookurl = reply.webhook;
                    }
                }

                if (!webhookurl) {
                    winston.debug("webhookurl is undefined return standard");
                    return resolve(messageReply);
                }
                    
                var botWithSecret = await Faq_kb.findById(bot._id).select('+secret').exec();  //TODO add cache_bot_nOT_here?? it's internal bot that is deprecated-> skip caching

                var signOptions = {
                    issuer:  'https://tiledesk.com',
                    subject:  'bot',
                    audience:  'https://tiledesk.com/bots/'+bot._id,   
                    jwtid: uuidv4()       
                    };
            
                    // TODO metti bot_? a user._id
                var token = jwt.sign(bot.toObject(), botWithSecret.secret, signOptions);                  


                winston.debug("webhookurl "+ webhookurl)

                return request({                        
                    uri :  webhookurl,
                    headers: {
                        'Content-Type' : 'application/json', 
                        'User-Agent': 'tiledesk-bot',
                        'Origin': webhook_origin
                         //'x-hook-secret': s.secret
                       },
                    method: 'POST',
                    json: true,
                    body: {payload:{text: text, bot: bot, message: message, intent: faq}, token: token},
                    // }).then(response => {
                    }, function(err, response, json){
                        if (err) {
                            winston.error("Error from webhook reply of getParsedMessage. Return standard reply", err);

                            return resolve(messageReply);

                            // return error
                            /*
                            var bot_answer = {};
                            bot_answer.text = err.toString(); 
                            if(response && response.text) {
                                bot_answer.text = bot_answer.text + ' '+response.text;
                            }
                            bot_answer.type = "text";
                            
                            return resolve(bot_answer);
                            */
                        }
                         if (response.statusCode >= 400) {      
                            winston.verbose("The ChatBot webhook return error http status code. Return standard reply", response);            
                            return resolve(messageReply);
                        }

                        if (!json) { //the webhook return empty body
                            winston.verbose("The ChatBot webhook return no json. Return standard reply", response);
                            return resolve(messageReply);
                        }
                       
                        winston.debug("webhookurl repl_message ", response);

                        var text = undefined;
                        if(json && json.text===undefined) {
                            winston.verbose("webhookurl json is defined but text not. return standard reply",{json:json, response:response});
                            // text = 'Field text is not defined in the webhook respose of the faq with id: '+ faq._id+ ". Error: " + JSON.stringify(response);
                            return resolve(messageReply);
                        }else {
                            text = json.text;
                        }
                        winston.debug("webhookurl text:  "+ text);

                        // // let cloned_message = Object.assign({}, messageReply);
                        // let cloned_message =  message;
                        // winston.debug("cloned_message :  ",cloned_message);

                        // if (json.attributes) {
                        //     if (!cloned_message.attributes) {
                        //         cloned_message.attributes = {}
                        //     }
                        //     winston.debug("ChatBot webhook json.attributes: ",json.attributes);
                        //     for(const [key, value] of Object.entries(json.attributes)) {
                        //         cloned_message.attributes[key] = value
                        //     }
                        // }

                        // winston.debug("cloned_message after attributes:  ",cloned_message);

                        that.parseMicrolanguage(text, message, bot, faq, true, json).then(function(bot_answer) {
                            return resolve(bot_answer);
                        });
                    });
            }

            return resolve(messageReply);
        });
    }

    getParsedMessage(text, message, bot, faq) { 
        return this.parseMicrolanguage(text, message, bot, faq, false);
        // return this.parseMicrolanguageOld(text, message, bot, faq);
    }

    // parseMicrolanguageOld(text, message, bot, faq) { 
    //     var that = this;
    //     // text = "*"
    //     return new Promise(function(resolve, reject) {
    //         winston.debug("getParsedMessage ******",text);
    //         var repl_message = {};

    //         // cerca i bottoni eventualmente definiti
    //         var button_pattern = /^\*.*/mg; // buttons are defined as a line starting with an asterisk            
    //         var text_buttons = text.match(button_pattern);
    //         if (text_buttons) {
    //             var text_with_removed_buttons = text.replace(button_pattern,"").trim();
    //             repl_message.text = text_with_removed_buttons
    //             var buttons = []
    //             text_buttons.forEach(element => {
    //             winston.debug("button ", element)
    //             var remove_extra_from_button = /^\*/mg;
    //             var button_text = element.replace(remove_extra_from_button, "").trim()
    //             var button = {}
    //             button["type"] = "text"
    //             button["value"] = button_text
    //             buttons.push(button)
    //             });
    //             repl_message.attributes =
    //             { 
    //             attachment: {
    //                 type:"template",
    //                 buttons: buttons
    //             }
    //             }
    //             repl_message.type = MessageConstants.MESSAGE_TYPE.TEXT;
    //         } else {
    //             // no buttons
    //             repl_message.text = text
    //             repl_message.type =  MessageConstants.MESSAGE_TYPE.TEXT;
    //         }

    //         var image_pattern = /^\\image:.*/mg; 
    //         var imagetext = text.match(image_pattern);
    //         if (imagetext && imagetext.length>0) {
    //             var imageurl = imagetext[0].replace("\\image:","").trim();
    //             winston.debug("imageurl ", imageurl)
    //             var text_with_removed_image = text.replace(image_pattern,"").trim();
    //             repl_message.text = text_with_removed_image + " " + imageurl
    //             repl_message.metadata = {src: imageurl, width:200, height:200};
    //             repl_message.type =  MessageConstants.MESSAGE_TYPE.IMAGE;
    //         }

    //         var frame_pattern = /^\\frame:.*/mg; 
    //         var frametext = text.match(frame_pattern);
    //         if (frametext && frametext.length>0) {
    //             var frameurl = frametext[0].replace("\\frame:","").trim();
    //             winston.debug("frameurl ", frameurl)
    //             // var text_with_removed_image = text.replace(frame_pattern,"").trim();
    //             // repl_message.text = text_with_removed_image + " " + imageurl
    //             repl_message.metadata = {src: frameurl};
    //             repl_message.type = MessageConstants.MESSAGE_TYPE.FRAME;
    //         }


    //         var webhook_pattern = /^\\webhook:.*/mg; 
    //         var webhooktext = text.match(webhook_pattern);
    //         if (webhooktext && webhooktext.length>0) {
    //             var webhookurl = webhooktext[0].replace("\\webhook:","").trim();
    //             winston.debug("webhookurl ", webhookurl)

    //             return request({                        
    //                 uri :  webhookurl,
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 method: 'POST',
    //                 json: true,
    //                 body: {payload:{text: text, bot: bot, message: message, faq: faq}},
    //                 // }).then(response => {
    //                 }, function(err, response, json){
    //                     if (err) {
    //                         bot_answer.text = err +' '+ response.text;
    //                         bot_answer.type =  MessageConstants.MESSAGE_TYPE.TEXT;
    //                         winston.error("Error from webhook reply of getParsedMessage", err);
    //                         return resolve(bot_answer);
    //                     }
    //                     // if (response.statusCode >= 400) {                  
    //                     //     return reject(`HTTP Error: ${response.statusCode}`);
    //                     // }
    //                     winston.debug("webhookurl repl_message ", response);

    //                     var text = undefined;
    //                     if(json && json.text===undefined) {
    //                         text = 'Field text is not defined in the webhook respose of the faq with id: '+ faq._id+ ". Error: " + JSON.stringify(response);
    //                     }else {
    //                         text = json.text;
    //                     }


    //                     that.getParsedMessage(text,message, bot, faq).then(function(bot_answer) {
    //                         return resolve(bot_answer);
    //                     });
    //                 });
             
    //         }else {
    //             winston.debug("repl_message ", repl_message)
    //             return resolve(repl_message);
    //         }


           
    //     });
    // }


    getBotMessage(botAnswer, projectid, bot, message, threshold) {
        var that = this;
          return new Promise(function(resolve, reject) {
  
              winston.debug('botAnswer', botAnswer);
                // var found = false;
                var bot_answer={};
  
                      if (!botAnswer ) {                          
  
                        var query = { "id_project": projectid, "id_faq_kb": bot._id, "question": "defaultFallback"};
                        winston.debug('query', query);

                       
                        Faq.find(query) 
                        .lean().             //fai cache  
                         exec(function (err, faqs) {
                           if (err) {
                             return res.status(500).send({ success: false, msg: 'Error getting object.' });
                           }
            
                           winston.debug("faqs", faqs);  

                           if (faqs && faqs.length>0) {
                                winston.debug("faqs exact", faqs);  

                                bot_answer.text=faqs[0].answer;   
                                
                                winston.debug("bot_answer exact", bot_answer);  
                                // found = true;
                                // return resolve(bot_answer);

                                // problem with 
                                // if (message.channel.name == "chat21") {    //why this contition on chat21 channel? bacause only chat21 support parsed replies?
                                    winston.debug("faqBotSupport message.channel.name is chat21",message);
                                    that.getParsedMessage(bot_answer.text,message, bot, faqs[0]).then(function(bot_answerres) {
                                    
                                        bot_answerres.defaultFallback=true;
    
                                        return resolve(bot_answerres);
                                    });

                                // } else {
                                //     winston.debug("faqBotSupport message.channel.name is not chat21 returning default",message);
                                //     return resolve(bot_answer);
                                // }
                                
                           } else {
                                var message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";                             
                                bot_answer.text = that.getMessage(message_key, message.language, faqBotSupport.LABELS);  
                                bot_answer.defaultFallback = true;
                                // console.log("bot_answer ", bot_answer)
                                return resolve(bot_answer);
                           }
                        });                        
                      } 
                              
  
      });
  
      }


  
}


var faqBotSupport = new FaqBotSupport();

faqBotSupport.LABELS = {
    EN : {
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "I did not find an answer in the knowledge base. \n Please reformulate your question?"
    },
    IT : {
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    },
    "IT-IT" : {
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    }
}

module.exports = faqBotSupport;