
const requestEvent = require('../../event/requestEvent');
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


            requestEvent.on('request.create',  function(request) {          

                setImmediate(() => {
                  

                        if (!request.department.id_bot) {
                            
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

                                // chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"} });
                                // chat21.messages.sendToGroup(
                                //     'Bot', 
                                //     request.request_id, 
                                //     'Recipient Fullname', 
                                //     i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                                //     'system', 
                                //     {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
                                // ).then(function(data){
                                        // });
                                
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


                                // chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}});
                                
                                // chat21.messages.sendToGroup(
                                //     'Bot', 
                                //     request.request_id, 
                                //     'Recipient Fullname', 
                                //     i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                                //     'system', 
                                //     {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
                                // ).then(function(data){

                                //         });
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
