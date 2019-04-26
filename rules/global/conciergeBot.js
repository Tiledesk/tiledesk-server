
const requestEvent = require('../../event/requestEvent');
var messageService = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");
var winston = require('../../config/winston');
var i8nUtil = require("../../utils/i8nUtil");

class ConciergeBot {


    listen() {

        var that = this;
        winston.info("ConciergeBot listener start ");
        

            requestEvent.on('request.create',  function(request) {          

                setImmediate(() => {
                  

                        if (!request.department.id_bot) {
                            
                            winston.debug("ConciergeBot send welcome bot message");     
                            
                            if (request.availableAgents.length==0) {
                               
                                // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes);
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


    }


    
}

var conciergeBot = new ConciergeBot();
module.exports = conciergeBot;
