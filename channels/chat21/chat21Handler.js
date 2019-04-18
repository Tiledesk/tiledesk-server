
const messageEvent = require('../../event/messageEvent');
const requestEvent = require('../../event/requestEvent');
var messageService = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");
var ChannelConstants = require("../../models/channelConstants");
var winston = require('../../config/winston');

var chat21Config = require('../../config/chat21');
// var Chat21 = require('@chat21/chat21-node-sdk');


// var chat21 = new Chat21({
//  url: chat21Config.url,
//  appid: chat21Config.appid,
//  //authurl: process.env.CHAT21_AUTH_URL
// });

var chat21 = require('../../channels/chat21/chat21Client');


var adminToken = process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken 
winston.info('Chat21Handler adminToken: '+ adminToken);


const chat21Event = require('../../channels/chat21/chat21Event');


var admin = require('../../utils/firebaseConnector');
const firestore = admin.firestore();


class Chat21Handler {


    listen() {

        var that = this;
        
        messageEvent.on('message.sending', function(message) {

            setImmediate(() => {
                    winston.debug("Chat21Sender listen " + message);


                    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && message.request.channel.name === ChannelConstants.CHAT21) {

                    
                        chat21.auth.setAdminToken(adminToken);

                        let attributes = {tiledesk_message_id: message._id };

                        chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                            'Recipient Fullname', message.text, message.sender, attributes)
                                    .then(function(data){
                                        winston.debug("send resolve ", data);
                                
                                        chat21Event.emit('message.sent', data);

                                    messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                        winston.debug("upMessage ", upMessage.toObject());                                        
                                    });

                            }).catch(function(err) {
                                winston.error("err", err);
                                chat21Event.emit('message.sent.error', err);
                            });
                    }
                });
            });



            requestEvent.on('request.create',  function(request) {          

                setImmediate(() => {
                    if (request.channel.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                        // let requestObj = request.toObject();
                        let requestObj = request.toJSON();
                        
                        winston.info("creating chat21 group for request", requestObj);

                        // winston.info("requestObj.participants: "+ Object.prototype.toString.call(requestObj.participants));
                        winston.debug("requestObj.participants: "+ JSON.stringify(requestObj.participants));
                        
                        let members = requestObj.participants;
                        // var members = reqParticipantArray;
                        members.push(request.requester_id);
                        // let membersArray = JSON.parse(JSON.stringify(members));
                        // winston.info("membersArray", membersArray);

                        var gAttributes = request.attributes || {};
                        gAttributes["requester_id"] = request.requester_id;

                        chat21.groups.create('Guest', members, gAttributes).then(function(data) {
                                winston.info("group created", data);      
                                chat21Event.emit('group.create', data);                                          
                            }).catch(function(err) {
                                winston.error("Error creating chat21 group ", err);
                                chat21Event.emit('group.create.error', err);
                            });


                            // return Promise.all([

                        // if (!idBot) {
                        //     if (availableAgentsCount==0) {
                        //         chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"} });
                        //     }else {
                        //         chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}});
                        //     }
                        // }



                        that.saveNewRequest(JSON.parse(JSON.stringify(requestObj)), members,
                            chat21Config.appid);
                    }
                });
            });
    


            messageEvent.on('message.create.first',  function(message) {          

                setImmediate(() => {
                    if (message.request.channel.name === ChannelConstants.CHAT21) {

                        var firestoreUpdate = {first_message : JSON.parse(JSON.stringify(message))};

                        winston.info("firestoreUpdate", firestoreUpdate); 

                        return firestore.collection('conversations').doc(message.request.request_id).set(firestoreUpdate, { merge: true }).then(function(writeResult) {                            
                             winston.info('message.create.first saved', writeResult);
                             chat21Event.emit('firestore.first_message', firestoreUpdate);
                        }) ;    
                    }
                });
            });

            


        }


     saveNewRequest (request, group_members, app_id) {
            //creare firestore conversation
            var newRequest = {};

            newRequest.created_on = admin.firestore.FieldValue.serverTimestamp(); 

            newRequest.requester_id = request.requester_id;

            if (request.lead) {
                newRequest.requester_fullname = request.lead.fullname;
            }
            

            newRequest.first_text = request.first_text;
            newRequest.departmentid = request.department._id.toString(); 
    
            newRequest.members = group_members;
            newRequest.membersCount = Object.keys(group_members).length;
            newRequest.agents = request.agents;
            newRequest.availableAgents = request.availableAgents;
    
            if (request.assignedOperatorId) {
                newRequest.assigned_operator_id = request.assignedOperatorId;
            }
    
            if (newRequest.membersCount==2){
                newRequest.support_status = 100;
            }else {
                newRequest.support_status = 200;
            }
    
            if (request.attributes != null) {
                newRequest.attributes = request.attributes;
            }
    
            newRequest.app_id = app_id;
    
            // if (request.messages && request.messages.length>0) {
            //     newRequest.first_message = request.messages[0];
            // }
            
            
            winston.info('newRequest', newRequest);
    
    
           
            return firestore.collection('conversations').doc(request.request_id).set(newRequest, { merge: true }).then(function(writeResult){
                winston.info('newRequest saved', writeResult);
                chat21Event.emit('firestore.newRequest', writeResult);
            }) ;          
    }



    
}
var chat21Handler = new Chat21Handler();
module.exports = chat21Handler;
