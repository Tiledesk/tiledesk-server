

'use strict';

// const request = require('request-promise');  

// const Entities = require('html-entities').AllHtmlEntities;
// const entities = new Entities();
// const chatUtil = require('./chat-util');
// const https = require('https');
// const agent = new https.Agent({keepAlive: true});

// const BASE_API_URL = "https://api.tiledesk.com/v1";
const departmentService = require('../services/departmentService');
var winston = require('../config/winston');


class FaqBotSupport {

    //   getDepartmentOperator(projectid, departmentid, agent, nobot) {


    //     var that = this;

    //     return new Promise(function(resolve, reject) {

    //         var assigned_operator_id;
    //         var idBot;
    //         var agents = [];
    //         var availableAgents= [];
    //         var availableAgentsCount= 0;
            
    //         var objectyToReturn = {};

    //         var url = BASE_API_URL+ "/"+projectid+"/departments/"+departmentid+"/operators";
            
    //         if (nobot){
    //             url = url + '?nobot=true';
    //         }

    //         winston.debug(`url`, url);


    //             return request({
    //                 uri : url,
    //                 headers: {
    //                     // 'Authorization': 'Basic YWRtaW5AZjIxLml0OmFkbWluZjIxLA==',
    //                     //'Authorization': AUTHORIZATION_TOKEN_API,
    //                     'Content-Type': 'application/json'
    //                 },
    //                 method: 'GET',
    //                 json: true,
    //                 //agent: agent //The same approach works for HTTPS—just use https.Agent instead of http.Agent.
    //                 //resolveWithFullResponse: true
    //                 }).then(response => {
                    
    //                     if (!response) {
    //                         // throw new Error(`HTTP Error: ${response.statusCode}`);
    //                         winston.debug(`Error getting department.`);
    //                         return reject(response);

    //                     }else {
    //                         winston.debug('SUCCESS! response', response);
            
    //                         if (response) {

    //                             if (response.operators  && response.operators.length>0) {
    //                                 // var id_bot = "bot_"+response.id_bot;
    //                                 assigned_operator_id = response.operators[0].id_user;
    //                                 winston.debug('assigned_operator_id', assigned_operator_id);

    //                                 //group_members[assigned_operator_id] = 1; //bot
    //                             }
    //                             idBot = response.department.id_bot;
    //                             winston.debug('idBot', idBot);

    //                             if (response.agents) {
    //                                 agents = response.agents;
    //                                 winston.debug('agents', agents);

    //                             }
    //                             if (response.available_agents) {
    //                                 availableAgents = response.available_agents;
    //                                 winston.debug('availableAgents', availableAgents);

    //                                 availableAgentsCount = availableAgents.length;
    //                                 winston.debug('availableAgentsCount', availableAgentsCount);
    //                             }

    //                             objectyToReturn["assigned_operator_id"] = assigned_operator_id;
    //                             objectyToReturn["idBot"] = idBot;
    //                             objectyToReturn["agents"] = agents;
    //                             objectyToReturn["availableAgents"] = availableAgents;
    //                             objectyToReturn["availableAgentsCount"] = availableAgentsCount;
    //                             objectyToReturn["departmentid"] = response.department._id;
    //                              objectyToReturn["department"] = response.department;
    //                             winston.debug('objectyToReturn', objectyToReturn);


    //                             return resolve(objectyToReturn);
    //                         }
    //                     }
                    
            
    //                 }) .catch(function(error) { 
    //                     winston.debug("Error getting department.", error); 
    //                     return reject(error);
    //                 });
            


    //     });

    //   }
      

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

    getBotMessage(botAnswer, projectid, departmentid, language, threshold) {
      var that = this;
        return new Promise(function(resolve, reject) {

            winston.debug('botAnswer', botAnswer);
            departmentService.getOperators(departmentid, projectid, false).then(dep_op_response => {

                winston.debug('dep_op_response ' , dep_op_response);

                    var bot_answer= null
                    // var response_options;

                    if (botAnswer && botAnswer.answer) {

                        // if (qnaresp.answer.startsWith("\\")) { //if \\agent dont append se sei siddisfatto...

                        // } else {
                            winston.debug('botAnswer.score: ' + botAnswer.score);
                            if (botAnswer.score>threshold) {
                                winston.info('botAnswer.score is high. Not respond with bot sentence ');
                            }else {

                                winston.debug('dep_op_response.available_agents.length: ' + dep_op_response.available_agents.length);
                                if (dep_op_response.available_agents.length>0) {
                                    var message_key = "DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE";
                                    if (dep_op_response.department.bot_only){
                                        message_key = "DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE";
                                    }
                                } else {
                                    message_key = "DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE";
                                }
                                
                                winston.debug('message_key: ' + message_key);

                                bot_answer = {text: that.getMessage(message_key, language, faqBotSupport.LABELS), template: {buttons:[
                                    {value:"/agent", label:"Wait for an agent"},
                                    {value:"/close", label:"That's helped"},
                                    {value:"/next", label:"Next answer"}
                                    ]}
                                };
                            }
                        // }
                       

                    } else {

                        if (dep_op_response.availableAgentsCount>0) {

                            var message_key = "DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE";
                            if (dep_op_response.department.bot_only){
                                message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";                            
                            }

                        }else {
                            message_key = "DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE";
                        }   
                        
                        bot_answer = {text: that.getMessage(message_key, language, faqBotSupport.LABELS), template: 
                                        {buttons:[
                                            {value:"/agent", label:"Wait for an agent"},                         
                                        ]}
                                    };

                    }                
                  
                        return resolve(bot_answer);                            
            });

    });

    }
  
}


var faqBotSupport = new FaqBotSupport();

faqBotSupport.LABELS = {
    EN : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "If you want digit \\agent to talk to a human agent.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "I can not provide an adequate answer. \n Write a new question or type \\agent to talk to a human agent.",
        //DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Are you satisfied with the answer ?. \ n If you are satisfied, type \\ close to close the support chat or reformulate your question.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "I did not find an answer in the knowledge base. \n Please reformulate your question?"
    },
    IT : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "Se vuoi digita \\agent per parlare con un operatore umano.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Formula una nuova domanda oppure digita \\agent per parlare con un operatore umano.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        // DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure riformula la tua domanda.",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    },
    "IT-IT" : {
        DEFAULT_CLOSING_SENTENCE_REPLY_MESSAGE : "Se vuoi digita \\agent per parlare con un operatore umano.",
        DEFAULT_NOTFOUND_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Formula una nuova domanda oppure digita \\agent per parlare con un operatore umano.",
        DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "",
        // DEFAULT_CLOSING_NOBOT_SENTENCE_REPLY_MESSAGE : "Sei soddisfatto della risposta?. \n Se sei soddisfatto digita \\close per chiudere la chat di supporto oppure riformula la tua domanda.",
        DEFAULT_NOTFOUND_NOBOT_SENTENCE_REPLY_MESSAGE: "Non sono in grado di fornirti una risposta adeguata. \n Prego riformula la domanda."
    }
}

module.exports = faqBotSupport;