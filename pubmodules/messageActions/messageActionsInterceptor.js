
const messageEvent = require('../../event/messageEvent');
const botEvent = require('../../event/botEvent');
var messageActionEvent = require('./event/messageActionEvent');
var winston = require('../../config/winston');
var messageService = require('../../services/messageService');
var requestService = require('../../services/requestService');
var i8nUtil = require("../../utils/i8nUtil");
var MessageConstants = require("../../models/messageConstants");
var BotFromParticipant = require("../../utils/botFromParticipant");

class MessageActionsInterceptor {

 


    listen() {

        var that = this;
        winston.info("MessageActionsInterceptor listener start ");
        

        messageEvent.on('message.create',  function(message) {          

                setImmediate(() => {
                  
                       if (message.text.indexOf("\\")>-1) {
                             winston.info("message text contains command ");
                             
                             var start = message.text.indexOf("\\");
                             var end = message.text.length;
                             
                             var action = message.text.substring(start+1, end);
                             winston.info("message text contains action: "+ action);
                             messageActionEvent.emit(action, message);
                             
                             //messageActionEvent.emit("message.create", message);
                             
                       }
                    
                });
        });
        
        // messageActionEvent.on("start", function(message) {
        //     winston.info("called \\agent action");
             
        //     var request = message.request;
            
            
        //      //var botId = botEvent.getBotId(message);
        //      var botId =  BotFromParticipant.getBotId(message);

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
            
             winston.info("called \\agent action");
             
             var request = message.request;
             
             
              //var botId = botEvent.getBotId(message);
              var botId =  BotFromParticipant.getBotId(message);

               winston.debug("botId: " + botId);
            
               if (botId) {
                   winston.info("removing botId: " + botId);
                   
                   // removeParticipantByRequestId(request_id, id_project, member) 
                   //TODO USE FINALLY?
                   //TODO you can use reroute?
                   requestService.removeParticipantByRequestId(request.request_id, request.id_project,"bot_"+botId ).then(function(){
                        requestService.route(request.request_id, request.department, request.id_project, true ).then(function() {

                                // messageService.send(
                                //     'system', 
                                //     'Bot',                                     
                                //     request.request_id,
                                //     i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS), 
                                //     request.id_project,
                                //     'system', 
                                //     {"updateconversation" : false, messagelabel: {key: "TOUCHING_OPERATOR"}}
                                // );

                        });
                   });
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

                    });
               }   
               
               
               
                      
                  
                                
                                
        });
        
        


       

    }


    
}

var messageActionsInterceptor = new MessageActionsInterceptor();
module.exports = messageActionsInterceptor;