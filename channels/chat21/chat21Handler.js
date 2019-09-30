
const messageEvent = require('../../event/messageEvent');
const requestEvent = require('../../event/requestEvent');
var messageService = require('../../services/messageService');
var chatUtil = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");
var ChannelConstants = require("../../models/channelConstants");
var winston = require('../../config/winston');

var chat21Config = require('../../channels/chat21/chat21Config');
var chat21 = require('../../channels/chat21/chat21Client');

var adminToken =  process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken;
winston.info('Chat21Handler adminToken: '+ adminToken);


const chat21Event = require('../../channels/chat21/chat21Event');


var validtoken = require('../../middleware/valid-token');
var roleChecker = require('../../middleware/has-role');
var passport = require('passport');
require('../../middleware/passport')(passport);


var admin = require('../../channels/chat21/firebaseConnector');
var firestore;
var chat21WebHook;
var firebaseAuth;

if (admin) {
    firestore = admin.firestore();
    chat21WebHook = require('../../channels/chat21/chat21WebHook');
    chat21ConfigRoute = require('../../channels/chat21/configRoute');
    firebaseAuth = require('./firebaseauth');
}

class Chat21Handler {

    use(app) {
        
        if (admin){
            app.use('/chat21/requests',  chat21WebHook);
            app.use('/chat21/firebase/auth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], firebaseAuth);
            app.use('/chat21/config',  chat21ConfigRoute);
            winston.info("Chat21Handler using controller chat21WebHook and FirebaseAuth and chat21ConfigRoute");
        }else {
            winston.info("chat21WebHook not initialized ");
        }
        
    }

    listen() {

        var that = this;
        winston.info("Chat21Handler listener start ");
        
        messageEvent.on('message.sending', function(message) {

            setImmediate(() => {
                    winston.info("Chat21Sender on message.sending ",  message);


                    if (message && message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && message.request && message.request.channel.name === ChannelConstants.CHAT21) {

                    
                        chat21.auth.setAdminToken(adminToken);

                        let attributes = message.attributes;

                        if (!attributes) attributes = {};
                        
                        attributes['tiledesk_message_id'] = message._id;


                        winston.debug("Chat21Sender sending message.sending ",  message);

                        chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                            'Recipient Fullname', message.text, message.sender, attributes)
                                    .then(function(data){
                                        winston.info("Chat21 sendToGroup sent ", data);
                                
                                        chat21Event.emit('message.sent', data);

                                            messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                                winston.info("Chat21 message sent ", upMessage.toObject());                                        
                                            });

                            }).catch(function(err) {
                                winston.error("Chat21 sendToGroup err", err);
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
                        
                        winston.info("creating chat21 group for request with id: " + requestObj._id);

                        // winston.info("requestObj.participants: "+ Object.prototype.toString.call(requestObj.participants));
                        winston.debug("requestObj.participants: "+ JSON.stringify(requestObj.participants));
                        
                        let members = requestObj.participants;
                        // var members = reqParticipantArray;

                        if (request.lead) {
                            members.push(request.lead.lead_id);
                        }
                        
                        
                        // let membersArray = JSON.parse(JSON.stringify(members));
                        // winston.info("membersArray", membersArray);

                        var gAttributes = request.attributes || {};
                        gAttributes["requester_id"] = request.requester_id;
                    
                        var groupId = request.request_id;

                        var group_name = "Guest"; 
                        if (request.lead) {
                            group_name = request.lead.fullname;
                        }

                        chat21.groups.create(group_name, members, gAttributes, groupId).then(function(data) {
                                winston.info("Chat21 group created: " + data);      
                                chat21Event.emit('group.create', data);                                          
                            }).catch(function(err) {
                                winston.error("Error creating chat21 group ", err);
                                chat21Event.emit('group.create.error', err);
                            });


                            // return Promise.all([

                        // if (!request.department.id_bot) {
                        //     winston.debug("Chat21 Send welcome bot message");     
                            
                        //     if (request.availableAgents.length==0) {
                               
                        //         // messageService.send(sender, senderFullname, recipient, text, id_project, createdBy, attributes);
                        //         messageService.send(
                        //             'system', 
                        //             'Bot',                                     
                        //             request.request_id,
                        //             i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                        //             request.id_project,
                        //             'system', 
                        //             {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
                        //         );

                        //         // chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"} });
                        //         // chat21.messages.sendToGroup(
                        //         //     'Bot', 
                        //         //     request.request_id, 
                        //         //     'Recipient Fullname', 
                        //         //     i8nUtil.getMessage("NO_AVAILABLE_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                        //         //     'system', 
                        //         //     {"updateconversation" : false, messagelabel: {key: "NO_AVAILABLE_OPERATOR_MESSAGE"}}
                        //         // ).then(function(data){
                        //                 // });
                                
                        //     }else {

                        //         messageService.send(
                        //             'system', 
                        //             'Bot',                                     
                        //             request.request_id,
                        //             i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                        //             request.id_project,
                        //             'system', 
                        //             {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
                        //         );


                        //         // chatApi.sendGroupMessage("system", "Bot", group_id, "Support Group", chatUtil.getMessage("JOIN_OPERATOR_MESSAGE", message.language, chatSupportApi.LABELS), app_id, {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}});
                                
                        //         // chat21.messages.sendToGroup(
                        //         //     'Bot', 
                        //         //     request.request_id, 
                        //         //     'Recipient Fullname', 
                        //         //     i8nUtil.getMessage("JOIN_OPERATOR_MESSAGE", request.language, MessageConstants.LABELS), 
                        //         //     'system', 
                        //         //     {"updateconversation" : false, messagelabel: {key: "JOIN_OPERATOR_MESSAGE"}}
                        //         // ).then(function(data){

                        //         //         });
                        //     }
                        // }



                        that.saveNewRequest(JSON.parse(JSON.stringify(requestObj)), members,
                            chat21Config.appid);
                    }
                });
            });
    


            messageEvent.on('message.create.first',  function(message) {          

                winston.info("chat21Handler.message.create.first", message); 

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

            if (request.requester_id) {
                //newRequest.requester_id = request.requester_id;
                newRequest.requester_id = request.lead._id;
            }
            

            if (request.lead) {
                newRequest.requester_fullname = request.lead.fullname;
            }
            
            // set projectid. widget send projectid field. ohh noooo
            // "channel_type":"group","language":"it","metadata":"", ...... , :( "projectid":"5cc2d1554ce7ee00175e07f2",......, "recipient":"support-group-Lde6vlnfK8k8SCgtbUd","recipient_fullname":"aleo1",
            newRequest.projectid = request.id_project;

            newRequest.first_text = request.first_text;
            newRequest.departmentid = request.department._id.toString(); 
    
            group_members.push("system");
            
            newRequest.members = group_members;
            
            var membersCount = Object.keys(group_members).length;
            // newRequest.membersCount = membersCount;

            newRequest.agents = request.agents;
            newRequest.availableAgents = request.availableAgents;
    
            if (request.assignedOperatorId) {
                newRequest.assigned_operator_id = request.assignedOperatorId;
            }
    
            if (membersCount==2){
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
            
            
            winston.info('firestore newRequest', newRequest);
    
    
           
            return firestore.collection('conversations').doc(request.request_id).set(newRequest, { merge: true }).then(function(writeResult){
                winston.info('newRequest saved', writeResult);
                chat21Event.emit('firestore.newRequest', writeResult);
            }) ;          
    }



    
}

var chat21Handler = new Chat21Handler();
module.exports = chat21Handler;
