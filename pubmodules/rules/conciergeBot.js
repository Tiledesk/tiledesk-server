
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
var messageService = require('../../services/messageService');
var requestService = require('../../services/requestService');
var MessageConstants = require("../../models/messageConstants");
var winston = require('../../config/winston');
var i8nUtil = require("../../utils/i8nUtil");
var BotFromParticipant = require("../../utils/botFromParticipant");

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

        messageEvent.on('message.create',  function(message) {
            winston.info(" ConciergeBot message create", message);
            var botId = BotFromParticipant.getBotFromParticipants(message.request.participants);

            if (message.request.status < 100 && message.sender == message.request.lead.lead_id && !botId) {
            // if ( message.sender == message.request.lead.lead_id) {   
                winston.info("message send from lead");
                // changeStatusByRequestId(request_id, id_project, newstatus) {
                    // requestService.changeStatusByRequestId(message.request.request_id, message.request.id_project, "").then(function (reqStatusChanged) {
                         // reroute(request_id, id_project, nobot)
                        requestService.reroute(message.request.request_id, message.request.id_project, false );
                    // });
                

            }       

        });
        
*/
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
                    that.welcomeOnJoin(request);
                });
            });

            requestEvent.on('request.participants.update',  function(data) {     
            // requestEvent.on('request.participants.join',  function(data) {     
            // requestEvent.on('request.create',  function(request) {          
                let request = data.request;
                let member = data.member;
                setImmediate(() => {
                  

                    that.welcomeOnJoin(request);
                       
                    });



        });





        requestEvent.on('request.close',  function(request) {          

            setImmediate(() => {
                                      
                        winston.info("ConciergeBot send close bot message");     
                                            
                        // return chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", "Chat closed", app_id, {subtype:"info/support","updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"} });

                            messageService.send(
                                'system', 
                                'Bot',                                     
                                request.request_id,
                                "Chat closed", 
                                request.id_project,
                                'system', 
                                {subtype:"info/support", "updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"}}
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
                                {subtype:"info/support", "updateconversation" : false, messagelabel: {key: "CHAT_REOPENED"}}
                            );

                            
                        
                    
                
                });       

    });





    }




    welcomeOnJoin(request) {
        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
        if (!botId) {                        
        // if (!request.department.id_bot) {
            
            winston.debug("ConciergeBot send welcome bot message");     
            
            if (request.availableAgents.length==0) {
               
                // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type);
                messageService.send(
                    'system', 
                    'Bot',                                     
                    request.request_id,
                    i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                    request.id_project,
                    'system', 
                    {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
                );
            
                
            }else {

                messageService.send(
                    'system', 
                    'Bot',                                     
                    request.request_id,
                    i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                    request.id_project,
                    'system', 
                    {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
                );

               
            }
        } 
    }


    
}

var conciergeBot = new ConciergeBot();
module.exports = conciergeBot;
