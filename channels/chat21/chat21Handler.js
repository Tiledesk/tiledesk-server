
const messageEvent = require('../../event/messageEvent');
const requestEvent = require('../../event/requestEvent');
var messageService = require('../../services/messageService');
//var chatUtil = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");
var ChannelConstants = require("../../models/channelConstants");
var winston = require('../../config/winston');

var chat21Config = require('./chat21Config');
var chat21 = require('./chat21Client');
var chat21Util = require('./chat21Util');

var adminToken =  process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken;
winston.info('Chat21Handler adminToken: '+ adminToken);


const chat21Event = require('./chat21Event');


var validtoken = require('../../middleware/valid-token');
var roleChecker = require('../../middleware/has-role');
var passport = require('passport');
require('../../middleware/passport')(passport);

const leadEvent = require('../../event/leadEvent');

var admin = require('./firebaseConnector');
var firestore;
var chat21WebHook;
var firebaseAuth;
var firebaseAuthDep;

if (admin) {
    firestore = admin.firestore();
    chat21WebHook = require('./chat21WebHook');
    chat21ConfigRoute = require('./configRoute');
    firebaseAuth = require('./firebaseauth');
    firebaseAuthDep = require('./firebaseauthDEP');
    firebase = require('./firebase');
}

class Chat21Handler {

    use(app) {
        
        if (admin){
            app.use('/chat21/requests',  chat21WebHook);
            app.use('/chat21/firebase/auth', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], firebaseAuth);
            app.use('/chat21/config',  chat21ConfigRoute);
            app.use('/firebase/auth',  firebaseAuthDep);
            app.use('/:projectid/firebase', firebase); 
            winston.info("Chat21Handler using controller chat21WebHook and FirebaseAuth and chat21ConfigRoute");
        }else {
            winston.info("chat21WebHook not initialized ");
        }
        
    }

    listen() {

        var that = this;
        winston.info("Chat21Handler listener start ");
        
         // leadEvent.on('update')change group name wirth fullname)
         leadEvent.on('lead.update', function(lead) {
            setImmediate(() => {
                winston.info("Chat21Sender on message.sending ",  message);


               if (message && message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && message.request && message.request.channel.name === ChannelConstants.CHAT21) {
                // if (message && message.status === MessageConstants.CHAT_MESS
               }
            });
        });


        messageEvent.on('message.sending', function(message) {

            setImmediate(() => {
                    winston.info("Chat21Sender on message.sending ",  message);


                   if (message && message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && message.request && message.request.channel.name === ChannelConstants.CHAT21) {
                    // if (message && message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {

                    
                        chat21.auth.setAdminToken(adminToken);

                        //'https://us-central1-chat21-pre-01.cloudfunctions.net/api/tilechat/typings/support-group-LvtMo6VMxX1j3xV3b-X?token=chat21-secret-orgAa,',

                        chat21.conversations.typing(message.recipient,message.sender).finally(function() {
                        // .then(function(){
                        //     setTimeout(function() {
                        //         chat21.conversations.stopTyping(message.recipient,message.sender);
                        //     }, 1000);
                        // });

                        let attributes = message.attributes;

                        if (!attributes) attributes = {};
                        
                        attributes['tiledesk_message_id'] = message._id;

                        if (message.request) {
                            attributes['projectId'] = message.request.id_project; //TODO not used. used by ionic to open request detail ???
                        }
                        


                        winston.debug("Chat21Sender sending message.sending ",  message);

                        // chat21Util.getButtonFromText().then(function(messageData) {
                        //     message = messageData;

                            // doent'work must merge older field with new message = chat21Util.parseReply(message.text);

                            // sendToGroup: function(sender_fullname, recipient_id, recipient_fullname, text, sender_id, attributes, type, metadata, timestamp){


                            var timestamp = undefined;
                            if (message.attributes && message.attributes.clienttimestamp) {
                                timestamp = message.attributes.clienttimestamp;
                            }

                            var recipient_fullname = "Guest"; 
                            if (message.request && message.request.lead && message.request.lead.fullname) {
                                recipient_fullname = message.request.lead.fullname;
                            }

                            chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                                recipient_fullname, message.text, message.sender, attributes, message.type, message.metadata, timestamp)
                                        .then(function(data){
                                            winston.info("Chat21 sendToGroup sent ", data);
                                    
                                            chat21.conversations.stopTyping(message.recipient,message.sender);
    
                                            chat21Event.emit('message.sent', data);
    
                                                messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                                    winston.info("Chat21 message sent ", upMessage.toObject());                                        
                                                });
    
                                }).catch(function(err) {
                                    winston.error("Chat21 sendToGroup err", err);
                                    chat21Event.emit('message.sent.error', err);
                                });

                            });
                        
                        // });
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

                        members.push("system");
                        if (request.lead) {
                            members.push(request.lead.lead_id);
                        }
                        
                        
                        // let membersArray = JSON.parse(JSON.stringify(members));
                        // winston.info("membersArray", membersArray);

                        var gAttributes = request.attributes || {};
                        // problema requester_id
                        gAttributes["requester_id"] = request.requester_id;
                    
                       
                        gAttributes['projectId'] = request.id_project; //used by ionic to open request detail 

                        if (request.lead) {
                            gAttributes['userFullname'] = request.lead.fullname; //used by ionic to open request detail 
                            gAttributes['userEmail'] = request.lead.email; //used by ionic to open request detail 
                        }
                        gAttributes['client'] = request.userAgent; //used by ionic to open request detail 
                        gAttributes['departmentId'] = request.department._id; //used by ionic to open request detail 
                        gAttributes['departmentName'] = request.department.name; //used by ionic to open request detail 
                        gAttributes['sourcePage'] = request.sourcePage; //used by ionic to open request detail 
                        
                        
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


                    }
                });
            });
    
            requestEvent.on('request.close',  function(request) {          

                setImmediate(() => {
                    if (request.channel.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);                      

                        winston.info("Chat21Sender archiving conversations for ",request.participants);

                       //iterate request.participant and archive conversation
                       request.participants.forEach(function(participant,index) {

                        winston.info("Chat21Sender archiving conversation: " + request.request_id + "for " + participant);

                            chat21.conversations.archive(request.request_id, participant)
                                        .then(function(data){
                                            winston.info("Chat21 conversation archived result "+ data);
                                    
                                            chat21Event.emit('conversation.archived', data);                                               

                                }).catch(function(err) {
                                    winston.error("Chat21 archived err", err);
                                    chat21Event.emit('conversation.archived.error', err);
                                });
                       });


                       chat21.conversations.archive("system")
                       .then(function(data){
                           winston.info("Chat21 archived ", data);
                   
                           chat21Event.emit('conversation.archived', data);                                               

                        }).catch(function(err) {
                            winston.error("Chat21 archived err", err);
                            chat21Event.emit('conversation.archived.error', err);
                        });

                        chat21.conversations.archive(request.requester_id)
                       .then(function(data){
                           winston.info("Chat21 archived ", data);
                   
                           chat21Event.emit('conversation.archived', data);                                               

                        }).catch(function(err) {
                            winston.error("Chat21 archived err", err);
                            chat21Event.emit('conversation.archived.error', err);
                        });


                    }
                });
            });
            
             requestEvent.on('request.participants.update',  function(data) {       
                   let request = data.request;
                   //let oldParticipants = data.beforeRequest.participants;

                setImmediate(() => {
                    if (request.channel.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                     
                        let requestObj = request.toJSON();
                        
                        winston.info("joining chat21 group for request with id: " + requestObj._id);
                    
                        var groupId = request.request_id;

                        let members = [];
                        
                        members.push("system");

                        // qui errore participants sembra 0,1 object ???
                        request.participants.forEach(function(participant,index) {
                            members.push(participant);
                        });
                        // requestObj.participants;
                        // var members = reqParticipantArray;

                        if (request.lead) {
                            members.push(request.lead.lead_id);
                        }
                        winston.info("Chat21 group with members: " , members);  

                         //setMembers: function(members, group_id){
                        chat21.groups.setMembers(members, groupId).then(function(data) {
                                winston.info("Chat21 group set: " , data);      
                                chat21Event.emit('group.join', data);                                          
                            }).catch(function(err) {
                                winston.error("Error joining chat21 group ", err);
                                chat21Event.emit('group.join.error', err);
                            });



                    }
                });
            });
            
            
               requestEvent.on('request.participants.join',  function(data) {       
                   let request = data.request;
                   let member = data.member;

                setImmediate(() => {
                    if (request.channel.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                     
                        // let requestObj = request.toJSON();
                        
                        var groupId = request.request_id;

                        winston.info("joining member " + member +" for chat21 group with request : " + groupId);
                                            

                         //join: function(member_id, group_id){
                        chat21.groups.join(member, groupId).then(function(data) {
                                winston.info("Chat21 group joined: " + data);      
                                chat21Event.emit('group.join', data);                                          
                            }).catch(function(err) {
                                winston.error("Error joining chat21 group ", err);
                                chat21Event.emit('group.join.error', err);
                            });



                    }
                });
            });
            
            
               requestEvent.on('request.participants.leave',  function(data) {       
                   let request = data.request;
                   let member = data.member;

                setImmediate(() => {
                    if (request.channel.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                     

                     
                        // let requestObj = request.toJSON();
                        
                        var groupId = request.request_id;

                        winston.info("leaving " + member +" for chat21 group for request with id: " + groupId);
                                   

                         //leave: function(member_id, group_id){
                        chat21.groups.leave(member, groupId).then(function(data) {
                                winston.info("Chat21 group leaved: " + data);      
                                chat21Event.emit('group.leave', data);                                          
                            }).catch(function(err) {
                                winston.error("Error leaving chat21 group ", err);
                                chat21Event.emit('group.leave.error', err);
                            });



                    }
                });
            })
            
            
            

/*
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

*/


        }

/*
     saveNewRequest (request, group_members, app_id) {
            //creare firestore conversation
            var newRequest = {};

            newRequest.created_on = admin.firestore.FieldValue.serverTimestamp(); 

            if (request.lead._id) {
                //newRequest.requester_id = request.requester_id;
                newRequest.requester_id = request.lead.lead_id;
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

            var group_membersAsObj = {};
            group_members.forEach(function(prop,index) {
                group_membersAsObj[prop] = 1;
            });
            winston.info('group_membersAsObj', group_membersAsObj);
            newRequest.members = group_membersAsObj;
            
            
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

*/

    
}

var chat21Handler = new Chat21Handler();
module.exports = chat21Handler;