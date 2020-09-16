

'use strict';

const departmentService = require('../services/departmentService');
const Faq = require('../models/faq');
var winston = require('../config/winston');


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


    getButtonFromText(text, message, bot, faq) { 
        var that = this;
        // text = "*"
        return new Promise(function(resolve, reject) {
            winston.debug("getButtonFromText ******",text);
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
                            winston.error("Error from webhook reply of getButtonFromText", err);
                            return resolve(bot_answer);
                        }
                        // if (response.statusCode >= 400) {                  
                        //     return reject(`HTTP Error: ${response.statusCode}`);
                        // }
                        winston.debug("webhookurl repl_message ", response);

                        var text = undefined;
                        if(response && response.text===undefined) {
                            text = 'Field text is not defined in the webhook respose of the faq with id: '+ faq._id+ ". Error: " + response;
                        }else {
                            text = response.text;
                        }
                        that.getButtonFromText(text,message, bot, faq).then(function(bot_answer) {
                            return resolve(bot_answer);
                        });
                    });
             
            }else {
                winston.debug("repl_message ", repl_message)
                return resolve(repl_message);
            }


           
        });
    }


    getBotMessageNew(botAnswer, projectid, bot, message, threshold) {
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
                                // found = true;
                                // return resolve(bot_answer);
                                that.getButtonFromText(bot_answer.text,message, bot, faqs[0]).then(function(bot_answerres) {
                                    return resolve(bot_answerres);
                                });
                           } else {
                                var message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";                             
                                bot_answer.text = that.getMessage(message_key, message.language, faqBotSupport.LABELS);                        
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