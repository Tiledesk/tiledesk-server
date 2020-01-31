
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
        


        
        requestEvent.on('request.create',  function(request) {   
            winston.info(" ConciergeBot request create", message);
            if (request.status < 100 && request.department.id_bot) {
                // addParticipantByRequestId(request_id, id_project, member) {
                    requestService.addParticipantByRequestId(request.request_id, request.id_project, botId);

            }
        });

        messageEvent.on('message.create',  function(message) {
            winston.info(" ConciergeBot message create", message);
            var botId = BotFromParticipant.getBotFromParticipants(request.participants);

            if (message.request.status < 100 && message.sender == message.request.lead.lead_id && !botId) {
            // if ( message.sender == message.request.lead.lead_id) {   
                winston.info("message send from lead");
                // reroute(request_id, id_project, nobot)
                requestService.reroute(request.request_id, request.id_project, false );

            }       

        });

        requestEvent.on('request.participants.join',  function(data) {       
                    let request = data.request;
                    let member = data.member;

                setImmediate(() => {
                    winston.info("ConciergeBot member: " + member);
                    if (member.indexOf("bot_")==-1) {
                        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
                        if (botId) {
                            winston.info("removing botId: " + botId);
                            
                            // removeParticipantByRequestId(request_id, id_project, member) 
                            requestService.removeParticipantByRequestId(request.request_id, request.id_project,"bot_"+botId );
                        }      
                    }
                    

                });
            });

            requestEvent.on('request.participants.update',  function(data) {     
            // requestEvent.on('request.participants.join',  function(data) {     
            // requestEvent.on('request.create',  function(request) {          
                let request = data.request;
                let member = data.member;
                setImmediate(() => {
                  

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





    }


    
}

var conciergeBot = new ConciergeBot();
module.exports = conciergeBot;
