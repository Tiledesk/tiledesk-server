
const requestEvent = require('../../event/requestEvent');
const messageEvent = require('../../event/messageEvent');
var messageService = require('../../services/messageService');
var requestService = require('../../services/requestService');
var leadService = require('../../services/leadService');
var MessageConstants = require("../../models/messageConstants");
var LeadConstants = require("../../models/leadConstants");
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

                // winston.debug(" ConciergeBot message.request.preflight: "+message.request.preflight);
                // winston.debug(" ConciergeBot message.sender: "+message.sender);
                // winston.debug(" ConciergeBot message.request.lead.lead_id: "+message.request.lead.lead_id);
                // winston.debug(" ConciergeBot message.text: "+message.text);
                // winston.debug(" ConciergeBot message.request.first_text: "+message.request.first_text);

                // lead_id used. Change it?
                
                if (message.request && message.request.preflight === true  && message.sender == message.request.lead.lead_id && message.text != message.request.first_text) {
                    winston.debug("conciergebot: " + message.request.first_text );
                // if (message.request && message.request.preflight === true  && message.sender == message.request.lead.lead_id && message.text != message.request.first_text ) {
                    // if (message.request.status < 100 && message.sender == message.request.lead.lead_id && message.text != message.request.first_text ) {
                    // if (message.request.status < 100 && message.sender == message.request.lead.lead_id && message.text != message.request.first_text && !botId) {
                
                    winston.debug("message send from lead with preflight on");

                        // changeFirstTextAndPreflightByRequestId(request_id, id_project, first_text, preflight) {

                        let first_text =  message.text;
                        if (message.type === MessageConstants.MESSAGE_TYPE.IMAGE)  {
                            first_text = "Image";
                            winston.debug("setting first_text to image");
                        }      

                        if (message.type === MessageConstants.MESSAGE_TYPE.FRAME)  {
                            first_text = "Frame";
                            winston.debug("setting first_text to frame");
                        }


                        requestService.changeFirstTextAndPreflightByRequestId(message.request.request_id, message.request.id_project, first_text, false).then(function (reqChanged) {
                        //TESTA QUESTO

                                winston.debug("message.request.status: "+message.request.status);
                                
                                winston.debug("message.request.hasBot: "+message.request.hasBot);
                                // winston.info("message.request.department.id_bot: "+message.request.department.id_bot);
                                if (message.request.status === 50 &&  message.request.hasBot === false) { 
                                    // if (message.request.status === 50 &&  message.request.department.id_bot == undefined) { 
                                    //apply only if the status is temp and no bot is available. with agent you must reroute to assign temp request to an agent 
                                    winston.debug("rerouting");
                                    // reroute(request_id, id_project, nobot)
                                    requestService.reroute(message.request.request_id, message.request.id_project, false ).catch((err) => {
                                        winston.error("ConciergeBot error reroute: ", err);
                                    });     
                                }
                                
                                // updateStatusWitId(lead_id, id_project, status)
                                // lead_id used. Change it?
                                leadService.updateStatusWitId(message.request.lead.lead_id, message.request.id_project, LeadConstants.NORMAL);
                            // });
                        });


                        // do not update lead here: otherwise it override contact info of the console

                        // if (message.attributes.userFullname) {
                        //     var  userFullname = message.attributes.userFullname;
                        //     winston.info("concierge userFullname: "+ userFullname);

                        //     if (!userFullname) {
                        //         userFullname = message.sender_fullname;
                        //     }

                        //     var userEmail = message.attributes.userEmail;
                        //     winston.info("concierge userEmail:" + userEmail);

                        //     leadService.updateWitId(message.sender, userFullname, userEmail, message.request.id_project).then(function (updatedLead) {
                        //         winston.info("concierge updated lead", updatedLead);                            
                        //     });
                        
                        // }else {
                        //     winston.info("concierge message.attributes.userFullname null");
                        // }



                        
                }
            });       

        });
        

       
        

        requestEvent.on('request.participants.join',  function(data) {       
                    let request = data.request;
                    let member = data.member;

                setImmediate(() => {
                    winston.debug("ConciergeBot member: " + member);
                    // botprefix
                    if (member.indexOf("bot_")==-1) {
                        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
                        if (botId) {
                            winston.verbose("ConciergeBot: removing bot with id: " + botId + " from the request with request_id: " + request.request_id + " from the project with id: " + request.id_project);
                            
                            // botprefix
                            // removeParticipantByRequestId(request_id, id_project, member) 
                            requestService.removeParticipantByRequestId(request.request_id, request.id_project,"bot_"+botId ).catch((err) => {
                                winston.error("(ConciergeBot) removeParticipantByRequestId error", err)
                            });
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
                                      
                        winston.debug("ConciergeBot send close bot message",request);     
                                            
                        // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language) 
                            messageService.send(
                                'system', 
                                'Bot',                                     
                                request.request_id,
                                "Chat closed", 
                                request.id_project,
                                'system', 
                                {subtype:"info/support", "updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"}},   // TODO send request.closed_by <- c'è il campo l'ho verificato
                                undefined,
                                request.language
                            );

                           
                        
                    
                
                });

    });




    requestEvent.on('request.reopen',  function(request) {          

            setImmediate(() => {
                                        
                        winston.debug("ConciergeBot send reopen bot message");     
                                            
                        // return chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", "Chat closed", app_id, {subtype:"info/support","updateconversation" : false, messagelabel: {key: "CHAT_CLOSED"} });

                            messageService.send(
                                'system', 
                                'Bot',                                     
                                request.request_id,
                                "Chat reopened", 
                                request.id_project,
                                'system',                                       //changed from false to true 6Aug22 because reopen from dashboard history doesn't update convs in ionic
                                {subtype:"info/support", "updateconversation" : true, messagelabel: {key: "CHAT_REOPENED"}},
                                undefined,
                                request.language

                            );

                            
                        
                    
                
                });       

    });





    }



    // unused
    // welcomeOnJoin(request) {
    //     var botId = BotFromParticipant.getBotFromParticipants(request.participants);
    //     if (!botId) {                        
    //     // if (!request.department.id_bot) {
            
    //         winston.debug("ConciergeBot send welcome bot message");     
          
    //           // TODO if (request is assigned allora manda we are putting inn touch )
    //         // controlla dopo reassing
    //         if (request.status == RequestConstants.ASSIGNED) {
    //             if (request.participants.length==0) {
    //                 // if (request.availableAgents.length==0) {
                       
    //                     // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type);
    //                     messageService.send(
    //                         'system', 
    //                         'Bot',                                     
    //                         request.request_id,
    //                         i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
    //                         request.id_project,
    //                         'system', 
    //                         //{"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
    //                         {messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}},
    //                         undefined,
    //                         request.language
                           

    //                     );
                    
                        
    //                 }else {
        
    //                     messageService.send(
    //                         'system', 
    //                         'Bot',                                     
    //                         request.request_id,
    //                         i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
    //                         request.id_project,
    //                         'system', 
    //                         {messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}},
    //                         // {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
    //                         undefined,
    //                         request.language

    //                     );
        
                       
    //                 }
    //         }
            
    //     } 
    // }




    welcomeAgentOnJoin(request, member) {
        var botId = BotFromParticipant.getBotFromParticipants(request.participants);
        if (!botId) {                        
        // if (!request.department.id_bot) {
            
            winston.debug("ConciergeBot send agent welcome bot message");     
          
              // TODO if (request is assigned allora manda we are putting inn touch )
            // controlla dopo reassing
            if (request.status == RequestConstants.ASSIGNED) {
                if (request.participants.length>0) {
                    
                    // if (request.availableAgents.length==0) {
                       
                    var updateconversationfor = request.participants;

                    if (member) {
                        updateconversationfor = [member];
                    }

                    let touchText = request.first_text;
                    if (touchText) {  //first_text can be empty for type image
                        touchText = touchText.replace(/[\n\r]+/g, ' '); //replace new line with space
                    }
                    if (touchText.length > 30) {
                        touchText = touchText.substring(0,30);
                    }
                    if (request.subject) {
                        touchText = request.subject;
                    }

                    
                    // touchText.replace(String.fromCharCode(92),""); //Bugfix when a conversation has a first_text with \agent
                    touchText = touchText.replace(/\\/g, "");

                    winston.debug("touchText: " + touchText);

                        // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type);
                        messageService.send(
                            'system', 
                            'Bot',                                     
                            request.request_id,
                            i8nUtil.getMessage("TOUCHING_OPERATOR", request.language, MessageConstants.LABELS)+": " + touchText, 
                            request.id_project,
                            'system',                             
                            {subtype:"info", "updateconversation" : true, "updateconversationfor":updateconversationfor, forcenotification: true,  messagelabel: {key: "TOUCHING_OPERATOR"}},
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
