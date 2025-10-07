
const messageEvent = require('../../event/messageEvent');
const botEvent = require('../../event/botEvent');
let messageActionEvent = require('./event/messageActionEvent');
let winston = require('../../config/winston');
let messageService = require('../../services/messageService');
let requestService = require('../../services/requestService');
let i8nUtil = require("../../utils/i8nUtil");
let MessageConstants = require("../../models/messageConstants");
let BotFromParticipant = require("../../utils/botFromParticipant");

class MessageActionsInterceptor {

 


    listen() {

        let that = this;
        winston.info("MessageActionsInterceptor listener start ");
                    
            //use .received to be sure for \close the message is sent to chat21 and after that you can archive the conversation. otherwise a race condition occurs with message.create if \close is sent by the bot      
            messageEvent.on('message.received',  function(message) {          
        // messageEvent.on('message.create',  function(message) {          
            winston.debug("message.received ", message);

                setImmediate(() => {
                  
                       if (message.text && message.text.indexOf("\\")>-1) {
                             winston.debug("message text contains command ");
                             
                             let start = message.text.indexOf("\\");
                             let end = message.text.length;
                             
                             let action = message.text.substring(start+1, end);
                             winston.debug("message text contains action: "+ action);
                             messageActionEvent.emit(action, message);
                             
                             //messageActionEvent.emit("message.create", message);
                             
                       }
                    
                });
        });
        
        // messageActionEvent.on("start", function(message) {
        //     winston.info("called \\agent action");
             
        //     let request = message.request;
            
            
        //      //let botId = botEvent.getBotId(message);
        //      let botId =  BotFromParticipant.getBotId(message);

        //       winston.debug("botId: " + botId);
           
              
        //       if (!botId) {
        //         if (request.availableAgents.length==0) {
                    
        //         }else {

        //         }
        //             messageService.send(
        //                             'system', 
        //                             'Bot',                                     
        //                             request.request_id,
        //                             i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS), 
        //                             request.id_project,
        //                             'system', 
        //                             {"updateconversation" : false, messagelabel: {key: "TOUCHING_OPERATOR"}}
        //                         );

        //       }
        // });

        messageActionEvent.on("agent", function(message) {
            
             winston.debug("called \\agent action");
             
             let request = message.request;
             

             if (request) {
                    //let botId = botEvent.getBotId(message);
                let botId =  BotFromParticipant.getBotId(message);

                winston.debug("botId: " + botId);
            
                if (botId) {
                    winston.debug("removing botId: bot_" + botId);
                    
                    // removeParticipantByRequestId(request_id, id_project, member) 
                    //TODO USE FINALLY?
                    //TODO you can use reroute?
                //    requestService.removeParticipantByRequestId(request.request_id, request.id_project,"bot_"+botId ).then(function(removedRequest){
                //     winston.debug("removeParticipantByRequestId: ", removedRequest);
    
                    // route(request_id, departmentid, id_project, nobot) {
                        // se \agent ma nessuno opertore online non toglie il bot 
                        requestService.route(request.request_id, request.department, request.id_project, true ).then(function(routedRequest) {
                            winston.debug("routedRequest: ", routedRequest);

                                // messageService.send(
                                //     'system', 
                                //     'Bot',                                     
                                //     request.request_id,
                                //     i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS), 
                                //     request.id_project,
                                //     'system', 
                                //     {"updateconversation" : false, messagelabel: {key: "TOUCHING_OPERATOR"}}
                                // );

                        }).catch((err) => {
                            winston.error("(MessageActionsInterceptor) route request error ", err)
                        });
                //    });
                }   else {
                //route(request_id, departmentid, id_project) {      
                    //TODO USE FINALLY?

                    requestService.reroute(request.request_id, request.id_project, true ).then(function() {

                        // messageService.send(
                        //     'system', 
                        //     'Bot',                                     
                        //     request.request_id,
                        //     i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS), 
                        //     request.id_project,
                        //     'system', 
                        //     {"updateconversation" : false, messagelabel: {key: "TOUCHING_OPERATOR"}}
                        // );

                    }).catch((err) => {
                        winston.error("(MessageActionsInterceptor) reroute request error ", err)
                    });
                }   
              
             }
                                                                                           
                                
                                
        });



        messageActionEvent.on("close", function(message) {
            
            winston.verbose("called \\close action");
            
            let request = message.request;
            
            if (request) {
                // setTimeout(function() {
                    // winston.info("delayed")
                    
                    // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
                    const closed_by = message.sender;
                    requestService.closeRequestByRequestId(request.request_id, request.id_project, false, true, closed_by );
                //   }, 1500);

               
            }
                                                                                                                                                        
       });
        
        /*
       messageActionEvent.on("actions", function(message) {
        //    esegui custom action--->
       });
       messageActionEvent.on("events", function(message) {
        // lancia event
    });*/

       

    }


    
}

let messageActionsInterceptor = new MessageActionsInterceptor();
module.exports = messageActionsInterceptor;