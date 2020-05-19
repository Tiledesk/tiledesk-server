
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
var messageService = require('../../services/messageService');
var requestService = require('../../services/requestService');
var leadService = require('../../services/leadService');
var MessageConstants = require("../../models/messageConstants");
var winston = require('../../config/winston');
var i8nUtil = require("../../utils/i8nUtil");
var BotFromParticipant = require("../../utils/botFromParticipant");
const RequestConstants = require('../../models/requestConstants');

class ConciergeBot {


    listen() {

        var that = this;
        winston.info("ConciergeBot listener start ");
        

 /*
        requestEvent.on('request.create',  function(request) {   
            winston.info(" ConciergeBot request create", request);
            if (request.status < 100 && request.department.id_bot) {
                // addParticipantByRequestId(request_id, id_project, member) {
                    requestService.addParticipantByRequestId(request.request_id, request.id_project, "bot_"+request.department.id_bot);
devi mandare un messaggio welcome tu altrimenti il bot inserito successivamente al primo messaggio non riceve il welcome iniziale
            }
        });
*/
        messageEvent.on('message.create',  function(message) {
            winston.debug(" ConciergeBot message create", message);
            //var botId = BotFromParticipant.getBotFromParticipants(message.request.participants);

            setImmediate(() => {

                if (message.request.preflight === true  && message.sender == message.request.lead.lead_id && message.text != message.request.first_text ) {
                    // if (message.request.status < 100 && message.sender == message.request.lead.lead_id && message.text != message.request.first_text ) {
                    // if (message.request.status < 100 && message.sender == message.request.lead.lead_id && message.text != message.request.first_text && !botId) {
                
                    winston.debug("message send from lead with preflight on");
                    // changeFirstTextByRequestId(request_id, id_project, first_text) {
                        // TODO  arrivano due request.update su ws 


                        requestService.changeFirstTextByRequestId(message.request.request_id, message.request.id_project, message.text).then(function (reqChanged) {
                            requestService.changePreflightByRequestId(message.request.request_id, message.request.id_project, false).then(function (reqChanged) {
                                // reroute(request_id, id_project, nobot)
                                requestService.reroute(message.request.request_id, message.request.id_project, false );                                
                            });
                        });

                        if (message.attributes.userFullname) {
                            var  userFullname = message.attributes.userFullname;
                            winston.info("concierge userFullname", userFullname);

                            if (!userFullname) {
                                userFullname = message.sender_fullname;
                            }

                            var userEmail = message.attributes.userEmail;
                            winston.info("concierge userEmail", userEmail);

                            leadService.updateWitId(message.sender, userFullname, userEmail, id_project).then(function (updatedLead) {
                                winston.info("concierge updated lead", updatedLead);                            
                            });
                        
                        }else {
                            winston.info("concierge message.attributes.userFullname null");
                        }

                        
                }
            });       

        });
        

       
        

        requestEvent.on('request.participants.join',  function(data) {       
                    let request = data.request;
                    let member = data.member;

                setImmediate(() => {
                    winston.debug("ConciergeBot member: " + member);
                    if (member.indexOf("bot_")==-1) {
                        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
                        if (botId) {
                            winston.debug("removing botId: " + botId);
                            
                            // removeParticipantByRequestId(request_id, id_project, member) 
                            requestService.removeParticipantByRequestId(request.request_id, request.id_project,"bot_"+botId );
                        }      
                    }
                    

                });
            });

            requestEvent.on('request.create',  function(request) {   
                setImmediate(() => {                  
                    // that.welcomeOnJoin(request);
                    // that.welcomeAgentOnJoin(request);
                });
            });

            requestEvent.on('request.participants.update',  function(data) {                      
                let request = data.request;            
                setImmediate(() => {
                  

                    // that.welcomeOnJoin(request);
                    that.welcomeAgentOnJoin(request);
                       
                });

            });


            requestEvent.on('request.participants.join',  function(data) {       
                let request = data.request;
                let member = data.member;

                setImmediate(() => {
                  

                    // manda solo a nuovo agente

                    // that.welcomeOnJoin(request);
                    that.welcomeAgentOnJoin(request, member);
                       
                });

                
            });





        requestEvent.on('request.close',  function(request) {          

            setImmediate(() => {
                                      
                        winston.info("ConciergeBot send close bot message");     
                                            
                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language) 
                            messageService.send(
                                'system', 
                                'Bot',                                     
                                request.request_id,
                                "Chat closed", 
                                request.id_project,
                                'system', 
                                {subtype:"info/support", "updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"}},
                                undefined,
                                request.language
                            );

                           
                        
                    
                
                });

    });




    requestEvent.on('request.reopen',  function(request) {          

            setImmediate(() => {
                                        
                        winston.info("ConciergeBot send reopen bot message");     
                                            
                        // return chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", "Chat closed", app_id, {subtype:"info/support","updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"} });

                            messageService.send(
                                'system', 
                                'Bot',                                     
                                request.request_id,
                                "Chat reopened", 
                                request.id_project,
                                'system', 
                                {subtype:"info/support", "updateconversation" : false, messagelabel: {key: "CHAT_REOPENED"}},
                                undefined,
                                request.language

                            );

                            
                        
                    
                
                });       

    });





    }




    welcomeOnJoin(request) {
        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
        if (!botId) {                        
        // if (!request.department.id_bot) {
            
            winston.debug("ConciergeBot send welcome bot message");     
          
              // TODO if (request is assigned allora manda we are putting inn touch )
            // controlla dopo reassing
            if (request.status == RequestConstants.SERVED) {
                if (request.participants.length==0) {
                    // if (request.availableAgents.length==0) {
                       
                        // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type);
                        messageService.send(
                            'system', 
                            'Bot',                                     
                            request.request_id,
                            i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                            request.id_project,
                            'system', 
                            //{"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
                            {messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}},
                            undefined,
                            request.language
                           

                        );
                    
                        
                    }else {
        
                        messageService.send(
                            'system', 
                            'Bot',                                     
                            request.request_id,
                            i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                            request.id_project,
                            'system', 
                            {messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}},
                            // {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
                            undefined,
                            request.language

                        );
        
                       
                    }
            }
            
        } 
    }




    welcomeAgentOnJoin(request, member) {
        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
        if (!botId) {                        
        // if (!request.department.id_bot) {
            
            winston.debug("ConciergeBot send agent welcome bot message");     
          
              // TODO if (request is assigned allora manda we are putting inn touch )
            // controlla dopo reassing
            if (request.status == RequestConstants.SERVED) {
                if (request.participants.length>0) {
                    
                    // if (request.availableAgents.length==0) {
                       
                    var updateconversationfor = request.participants;

                    if (member) {
                        updateconversationfor = [member];
                    }
                        // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type);
                        messageService.send(
                            'system', 
                            'Bot',                                     
                            request.request_id,
                            i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS), 
                            request.id_project,
                            'system',                             
                            {subtype:"info", "updateconversation" : true, "updateconversationfor":updateconversationfor,messagelabel: {key: "TOUCHING_OPERATOR"}},
                            undefined,
                            request.language

                        );
                    
                                           
            }
            
        } 
    }
    }

    
}

var conciergeBot = new ConciergeBot();
module.exports = conciergeBot;
