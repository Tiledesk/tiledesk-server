

'use strict';

const departmentService = require('../services/departmentService');
const Faq = require('../models/faq');
var winston = require('../config/winston');

const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');

var request = require('retry-request', {
    request: require('request')
  });

  
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

    parseMicrolanguage(text, message, bot, faq) { 
        var that = this;
        return new Promise(function(resolve, reject) {
            var reply = TiledeskChatbotUtil.parseReply(text);
            winston.debug('parseReply: ' + JSON.stringify(reply) );
            var messageReply = reply.message;
            
            var msg_attributes = {"_raw_message": text};

            if (message && message.attributes) {
                for(const [key, value] of Object.entries(message.attributes)) {
                  msg_attributes[key] = value
                }
            }

            if (messageReply && messageReply.attributes) {
                for(const [key, value] of Object.entries(messageReply.attributes)) {
                  msg_attributes[key] = value
                }
            }

            messageReply.attributes = msg_attributes;
              
/*
            // TEMPORARY: search for handoff to agent command (\agent)
            const handoff_parsed = TiledeskChatbotUtil.is_agent_handoff_command(parsed_message);
            console.log('handoff_parsed?', handoff_parsed);
            if (handoff_parsed.agent_handoff) {
                console.log("agent_handoff command found");
                let handoff_msg = {
                'text': handoff_parsed.agent_handoff,
                'type': 'text',
                'attributes': {
                    'subtype': 'info' // hidden to users
                }
                }
                cbclient.sendMessage(handoff_msg, function (err) {
                console.log("agent_handoff message sent:", JSON.stringify(handoff_msg));
                if (err) {
                    console.log("agent_handoff Message sending error:", err);
                }
                });
            }

            // PATCH: Chat clients (i.e. web widget) remove messages with text = null
            // handoff_parsed.text contains the eventual text before the \agent command
            // or 'all the message text' if \agent was not found
            let message_text = handoff_parsed.text? handoff_parsed.text : '';
            
        let msg = {
                "text": message_text,
                "type": parsed_message.type,
                "attributes": msg_attributes,
                "metadata": parsed_message.metadata,
                // attributes._answerid=<INTENT NAME>
                // "senderFullname": tdclient.botName
            }
*/

            if (reply.webhook) {

                var webhookurl = reply.webhook;

                if (webhookurl === true) {
                    //testa 
                    webhookurl = bot.url;
                }
                winston.debug("webhookurl "+ webhookurl)

                return request({                        
                    uri :  webhookurl,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    json: true,
                    body: {payload:{text: text, bot: bot, message: message, faq: faq}},
                    // }).then(response => {
                    }, function(err, response, json){
                        if (err) {
                            bot_answer.text = err +' '+ response.text;
                            bot_answer.type = "text";
                            winston.error("Error from webhook reply of getParsedMessage", err);
                            return resolve(bot_answer);
                        }
                        // if (response.statusCode >= 400) {                  
                        //     return reject(`HTTP Error: ${response.statusCode}`);
                        // }
                        winston.debug("webhookurl repl_message ", response);

                        var text = undefined;
                        if(json && json.text===undefined) {
                            text = 'Field text is not defined in the webhook respose of the faq with id: '+ faq._id+ ". Error: " + JSON.stringify(response);
                        }else {
                            text = json.text;
                        }
                        that.getParsedMessage(text,message, bot, faq).then(function(bot_answer) {
                            return resolve(bot_answer);
                        });
                    });
            }

            return resolve(messageReply);
        });
    }

    getParsedMessage(text, message, bot, faq) { 
        return this.parseMicrolanguage(text, message, bot, faq);
        // return this.parseMicrolanguageOld(text, message, bot, faq);
    }

    parseMicrolanguageOld(text, message, bot, faq) { 
        var that = this;
        // text = "*"
        return new Promise(function(resolve, reject) {
            winston.debug("getParsedMessage ******",text);
            var repl_message = {};

            // cerca i bottoni eventualmente definiti
            var button_pattern = /^\*.*/mg; // buttons are defined as a line starting with an asterisk            
            var text_buttons = text.match(button_pattern);
            if (text_buttons) {
                var text_with_removed_buttons = text.replace(button_pattern,"").trim();
                repl_message.text = text_with_removed_buttons
                var buttons = []
                text_buttons.forEach(element => {
                winston.debug("button ", element)
                var remove_extra_from_button = /^\*/mg;
                var button_text = element.replace(remove_extra_from_button, "").trim()
                var button = {}
                button["type"] = "text"
                button["value"] = button_text
                buttons.push(button)
                });
                repl_message.attributes =
                { 
                attachment: {
                    type:"template",
                    buttons: buttons
                }
                }
                repl_message.type = "text";
            } else {
                // no buttons
                repl_message.text = text
                repl_message.type = "text";
            }

            var image_pattern = /^\\image:.*/mg; 
            var imagetext = text.match(image_pattern);
            if (imagetext && imagetext.length>0) {
                var imageurl = imagetext[0].replace("\\image:","").trim();
                winston.debug("imageurl ", imageurl)
                var text_with_removed_image = text.replace(image_pattern,"").trim();
                repl_message.text = text_with_removed_image + " " + imageurl
                repl_message.metadata = {src: imageurl, width:200, height:200};
                repl_message.type = "image";
            }

            var frame_pattern = /^\\frame:.*/mg; 
            var frametext = text.match(frame_pattern);
            if (frametext && frametext.length>0) {
                var frameurl = frametext[0].replace("\\frame:","").trim();
                winston.debug("frameurl ", frameurl)
                // var text_with_removed_image = text.replace(frame_pattern,"").trim();
                // repl_message.text = text_with_removed_image + " " + imageurl
                repl_message.metadata = {src: frameurl};
                repl_message.type = "frame";
            }


            var webhook_pattern = /^\\webhook:.*/mg; 
            var webhooktext = text.match(webhook_pattern);
            if (webhooktext && webhooktext.length>0) {
                var webhookurl = webhooktext[0].replace("\\webhook:","").trim();
                winston.debug("webhookurl ", webhookurl)

                return request({                        
                    uri :  webhookurl,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    method: 'POST',
                    json: true,
                    body: {payload:{text: text, bot: bot, message: message, faq: faq}},
                    // }).then(response => {
                    }, function(err, response, json){
                        if (err) {
                            bot_answer.text = err +' '+ response.text;
                            bot_answer.type = "text";
                            winston.error("Error from webhook reply of getParsedMessage", err);
                            return resolve(bot_answer);
                        }
                        // if (response.statusCode >= 400) {                  
                        //     return reject(`HTTP Error: ${response.statusCode}`);
                        // }
                        winston.debug("webhookurl repl_message ", response);

                        var text = undefined;
                        if(json && json.text===undefined) {
                            text = 'Field text is not defined in the webhook respose of the faq with id: '+ faq._id+ ". Error: " + JSON.stringify(response);
                        }else {
                            text = json.text;
                        }
                        that.getParsedMessage(text,message, bot, faq).then(function(bot_answer) {
                            return resolve(bot_answer);
                        });
                    });
             
            }else {
                winston.debug("repl_message ", repl_message)
                return resolve(repl_message);
            }


           
        });
    }


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

                                if (message.channel.name == "chat21") {

                                    that.getParsedMessage(bot_answer.text,message, bot, faqs[0]).then(function(bot_answerres) {
                                    
                                        bot_answerres.defaultFallback=true;
    
                                        return resolve(bot_answerres);
                                    });

                                } else {
                                    return resolve(bot_answer);
                                }
                                
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