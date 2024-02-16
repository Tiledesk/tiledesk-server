
const messageEvent = require('../../event/messageEvent');
const authEvent = require('../../event/authEvent');
const botEvent = require('../../event/botEvent');
const requestEvent = require('../../event/requestEvent');
const groupEvent = require('../../event/groupEvent');
const chat21Event = require('./chat21Event');
const leadEvent = require('../../event/leadEvent');

var messageService = require('../../services/messageService');
var MessageConstants = require("../../models/messageConstants");
var ChannelConstants = require("../../models/channelConstants");
var winston = require('../../config/winston');
var Request = require("../../models/request");
var chat21Config = require('./chat21Config');
var chat21 = require('./chat21Client');





const MaskData = require("maskdata");

const maskPasswordOptions = {
    // Character to mask the data. default value is '*'
    maskWith : "*",
    //Should be positive Integer
    // If the starting 'n' digits needs to be unmasked
    // Default value is 4
    unmaskedStartDigits: 3, 
    
    // Should be positive Integer
    //If the ending 'n' digits needs to be unmasked
    // Default value is 1
    unmaskedEndDigits: 2
  };




// var chat21Util = require('./chat21Util');
// var tiledeskUtil = require('./tiledesk-util');

var adminToken =  process.env.CHAT21_ADMIN_TOKEN || chat21Config.adminToken;

const masked_adminToken = MaskData.maskPhone(adminToken, maskPasswordOptions);

winston.info('Chat21Handler adminToken: '+ masked_adminToken);




class Chat21Handler {

 
    typing(message, timestamp) {
        return new Promise(function (resolve, reject) {

            // if privateFor skip typing
            //no typing for subtype info
            if (message.attributes && message.attributes.subtype && (message.attributes.subtype==='info' || message.attributes.subtype==='private')) {
                return resolve();
            }else {
                chat21.conversations.typing(message.recipient, message.sender, message.text, timestamp).finally(function() {
                    return resolve();
                });
            }
            

        });
    }


    listen() {

        var that = this;       
       
        winston.debug("Chat21Handler listener start ");
        

        if (process.env.SYNC_CHAT21_GROUPS !=="true") {
            winston.info("Sync Tiledesk to Chat21 groups disabled");
            // return; questo distrugge il tread. attento non lo mettere +
        }

        
      
        // chat21Handler on worker is loaded with stadard events like request.create and NOT request.create.queue because it is used internally by the worker when the request is closed by ChatUnhandledRequestScheduler

        // su projectUser create e update
        authEvent.on('user.signup', function(userData) {
            var firstName = userData.savedUser.firstname;
            var lastName = userData.savedUser.lastname;
            var email = userData.savedUser.email;
            var current_user = userData.savedUser.id;

            setImmediate(() => {
                winston.debug("Chat21Handler on user.signup ",  userData);

                chat21.auth.setAdminToken(adminToken);

                // create: function(firstname, lastname, email, current_user){
                chat21.contacts.create(firstName, lastName, email, current_user).then(function(data) {
                    winston.verbose("Chat21 contact created: " + JSON.stringify(data));      
                    chat21Event.emit('contact.create', data);                                          
                }).catch(function(err) {
                    winston.error("Error creating chat21 contact ", err);
                    chat21Event.emit('contact.create.error', err);
                });

            });
        });


        authEvent.on('user.update', function(userData) {
            var firstName = userData.updatedUser.firstname;
            var lastName = userData.updatedUser.lastname;            
            var current_user = userData.updatedUser.id;

            setImmediate(() => {
                winston.debug("Chat21Handler on user.update ",  userData);

                chat21.auth.setAdminToken(adminToken);

                // update: function(firstname, lastname, current_user){
                chat21.contacts.update(firstName, lastName, current_user).then(function(data) {
                    winston.verbose("Chat21 contact updated: " + JSON.stringify(data));      
                    chat21Event.emit('contact.update', data);                                          
                }).catch(function(err) {
                    winston.error("Error updating chat21 contact ", err);
                    chat21Event.emit('contact.update.error', err);
                });

            });
        });


        botEvent.on('faqbot.create', function(bot) {
            var firstName = bot.name;
            var lastName = "";
            var email = "";
            // botprefix
            var current_user = "bot_"+bot.id;

            setImmediate(() => {
                winston.debug("Chat21Handler on faqbot.create ",  bot);

                chat21.auth.setAdminToken(adminToken);

                // create: function(firstname, lastname, email, current_user){
                chat21.contacts.create(firstName, lastName, email, current_user).then(function(data) {                    
                    winston.verbose("Chat21 contact created: " + JSON.stringify(data));         
                    chat21Event.emit('contact.create', data);                                          
                }).catch(function(err) {
                    winston.error("Error creating chat21 contact ", err);
                    chat21Event.emit('contact.create.error', err);
                });

            });
        });



        botEvent.on('faqbot.update', function(bot) {
            var firstName = bot.name;
            var lastName = "";
            // botprefix
            var current_user = "bot_"+bot.id;

            setImmediate(() => {
                winston.debug("Chat21Handler on faqbot.create ",  bot);

                chat21.auth.setAdminToken(adminToken);

               // update: function(firstname, lastname, current_user){
                chat21.contacts.update(firstName, lastName, current_user).then(function(data) {
                    winston.verbose("Chat21 contact updated: " + JSON.stringify(data));      
                    chat21Event.emit('contact.update', data);                                          
                }).catch(function(err) {
                    winston.error("Error updating chat21 contact ", err);
                    chat21Event.emit('contact.update.error', err);
                });

            });
        });


    // quando passa da lead temp a default aggiorna tutti va bene?        
         leadEvent.on('lead.update', function(lead) {
            //  non sembra funzionare chiedi a Dario dove prende le info
            setImmediate(() => {
                winston.debug("Chat21Handler on lead.update ",  lead);

                //  TODO AGGIORNA SOLO SE PASSA DA GUEST A ALTRO??
                Request.find({lead: lead._id, id_project: lead.id_project}, function(err, requests) {

                    if (err) {
                        winston.error("Error getting request by lead", err);
                        return 0;
                    }
                    if (!requests || (requests && requests.length==0)) {
                        winston.warn("No request found for lead id " +lead._id );
                        return 0;
                    }
                    
                    chat21.auth.setAdminToken(adminToken);

                    requests.forEach(function(request) {
                        if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                            winston.verbose("Chat21Handler lead.update for request ",  request);
                            
                            var groupName = lead.fullname;
                            if (request.subject) {
                                groupName=request.subject;
                            }
                            // update: function(name, owner, attributes, group_id){

                            chat21.groups.update(groupName, undefined, undefined, request.request_id).then(function(data) {
                                winston.verbose("Chat21 group updated for lead.update: " + JSON.stringify(data));      
                                chat21Event.emit('group.update', data);                                          
                            }).catch(function(err) {
                                winston.error("Error updating chat21 group for lead.update", err);
                                chat21Event.emit('group.update.error', err);
                            });

                             // updateAttributes: function(attributes, group_id){
                                 var gattributes = {userFullname:lead.fullname, userEmail: lead.email }
                                //  qui1
                            chat21.groups.updateAttributes(gattributes, request.request_id).then(function(data) {
                                winston.verbose("Chat21 group gattributes for lead.update updated: " + JSON.stringify(data));      
                                chat21Event.emit('group.update', data);        
                                chat21Event.emit('group.attributes.update', data);                                          
                            }).catch(function(err) {
                                winston.error("Error updating chat21 gattributes for lead.update group ", err);
                                chat21Event.emit('group.attributes.update.error', err);
                            });


                        }
                    })
                  
                });

              
            });
        });


        messageEvent.on('message.test', function(message) {
        
            winston.info("Chat21Sender message.test");

            chat21.auth.setAdminToken(adminToken);

            return  chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                message.recipient_fullname, message.text, message.sender, message.attributes, message.type, message.metadata, message.timestamp, message.group)
                        .then(function(data){
                            winston.info("Chat21Sender sendToGroup test: "+ JSON.stringify(data));
                        });
        });
       
        // chat21Handler on worker is loaded with stadard events like request.create and NOT request.create.queue because it is used internally by the worker when the request is closed by ChatUnhandledRequestScheduler
        messageEvent.on('message.sending', function(message) {

            // setImmediate(() => {
                // TODO perche nn c'è setImmedite? per performace


                    winston.verbose("Chat21Sender on message.sending: "+  message.text);
                    winston.debug("Chat21Sender on message.sending ",  message);
                   
                   if (message && 
                    message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING &&
                    message.channel_type ==  MessageConstants.CHANNEL_TYPE.GROUP &&
                    message.request && 
                    message.request.channelOutbound.name == ChannelConstants.CHAT21) { //here only request.channelOutbound is important because chat21handler is for outgoing messages( from Tiledesk to agents clients)

                    
                        chat21.auth.setAdminToken(adminToken);


                        //chat21.conversations.typing(message.recipient, message.sender, message.text, new Date()).finally(function() {
                        return that.typing(message,new Date() ).then(function() {
                       

                        let attributes = message.attributes;

                        if (!attributes) attributes = {};
                        
                        attributes['tiledesk_message_id'] = message._id;

                        attributes['projectId'] = message.id_project; //TODO not used. used by ionic to open request detail ???
                        
                        if (message.channel && message.channel.name) {
                            attributes['channel'] = message.channel.name;
                        }
                        
                       


                        winston.verbose("Chat21Sender sending message.sending: "+  message.text);
                        winston.debug("Chat21Sender sending message.sending ",  message);

                        // chat21Util.getParsedMessage().then(function(messageData) {
                        //     message = messageData;

                            // doent'work must merge older field with new message = chat21Util.parseReply(message.text);

                            // sendToGroup: function(sender_fullname, recipient_id, recipient_fullname, text, sender_id, attributes, type, metadata, timestamp){


                            var timestamp = Date.now();
                            // var timestamp = undefined;
                            if (message.attributes && message.attributes.clienttimestamp) {
                                timestamp = message.attributes.clienttimestamp;
                            }

                            var recipient_fullname = "Guest"; 
                            // guest_here
                        
                            if (message.request && message.request.lead && message.request.lead.fullname) {
                                recipient_fullname = message.request.lead.fullname;
                            }
                            if (message.request && message.request.subject ) {
                                recipient_fullname = message.request.subject;
                            }
                            if (message.request && message.request.channel  && message.request.channel.name ) {
                                attributes['request_channel'] = message.request.channel.name;
                            }

                            /*
                            const parsedReply = tiledeskUtil.parseReply(message.text);
                            winston.info("Chat21 sendToGroup parsedMessage " + JSON.stringify(parsedReply));

                            // message = {...message, ...parsedReply.message };
                            // merge(message, parsedReply.message );

                            if (parsedReply.message.text) {
                                message.text = parsedReply.message.text;
                            }
                            if (parsedReply.message.type) {
                                message.type = parsedReply.message.type;
                            }
                            if (parsedReply.message.type) {
                                message.metadata = parsedReply.message.metadata;
                            }
                            
                            // var msg_attributes = {...message.attributes, ...parsedReply.message.attributes };
                            if (parsedReply.message && parsedReply.message.attributes) {
                                for(const [key, value] of Object.entries(parsedReply.message.attributes)) {
                                    attributes[key] = value
                                }
                            }    
                            */   
                         
                            // performance console log
                            // console.log("************* send message chat21: "+new Date().toISOString(), message.text );

                           return  chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                                recipient_fullname, message.text, message.sender, attributes, message.type, message.metadata, timestamp)
                                        .then(function(data){
                                            winston.verbose("Chat21Sender sendToGroup sent: "+ JSON.stringify(data) + " for text message " + message.text);
                                    

                                            // chat21.conversations.stopTyping(message.recipient,message.sender);
                                            
                                            
                                            // performance console log
                                            // console.log("************* senttt message chat21: "+new Date().toISOString(), message.text );

                                            chat21Event.emit('message.sent', data);
    
                                                winston.debug("Message changeStatus 1");
                                                messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                                    winston.debug("Chat21 message sent ", upMessage.toObject());                                        
                                                }).catch(function(err) {
                                                    winston.error("Error Chat21 message sent with id: "+message._id, err);                                        
                                                });
    
                                }).catch(function(err) {
                                    winston.error("Chat21 sendToGroup err", err);
                                    chat21Event.emit('message.sent.error', err);
                                });

                            });
                        
                        // });
                    }
                    else if (message &&
                         message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && 
                         message.channel_type ==  MessageConstants.CHANNEL_TYPE.DIRECT &&
                         message.channel.name == ChannelConstants.CHAT21) {
                        
                            // winston.warn("Chat21Sender this is a direct message. Unimplemented method", message);

                            chat21.auth.setAdminToken(adminToken);

                            winston.debug("Chat21Sender");
                            // send: function(sender_fullname, recipient_id, recipient_fullname, text, sender_id, attributes, type, metadata){
                           return  chat21.messages.send(message.senderFullname,     message.recipient, 
                            message.recipientFullname, message.text, message.sender, message.attributes, message.type, message.metadata)
                                    .then(function(data){
                                        winston.verbose("Chat21Sender send sent: "+ JSON.stringify(data));
                                

                                        // chat21.conversations.stopTyping(message.recipient,message.sender);

                                        chat21Event.emit('message.sent', data);
                                            winston.debug("Message changeStatus 2");
                                            messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                                winston.debug("Chat21 message sent ", upMessage.toObject());                                        
                                            }).catch(function(err) {
                                                winston.error("Error Chat21 message sent with id: "+message._id, err);                                        
                                            });

                            }).catch(function(err) {
                                winston.error("Chat21 send direct err", err);
                                chat21Event.emit('message.sent.error', err);
                            });

                            

                    } 
                    
                    else if (message &&
                        message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING && 
                        message.channel_type ==  MessageConstants.CHANNEL_TYPE.GROUP &&
                        message.channel.name == ChannelConstants.CHAT21) {
                       
                           // winston.warn("Chat21Sender this is a group message. Unimplemented method", message);

                           chat21.auth.setAdminToken(adminToken);

                           var timestamp = Date.now();
                           // var timestamp = undefined;
                           if (message.attributes && message.attributes.clienttimestamp) {
                               timestamp = message.attributes.clienttimestamp;
                           }


                           return  chat21.messages.sendToGroup(message.senderFullname,     message.recipient, 
                            message.recipientFullname, message.text, message.sender, message.attributes, message.type, message.metadata, timestamp)                         
                                   .then(function(data){
                                       winston.verbose("Chat21Sender send sent: "+ JSON.stringify(data));
                               

                                       // chat21.conversations.stopTyping(message.recipient,message.sender);

                                       chat21Event.emit('message.sent', data);
                                       winston.debug("Message changeStatus 3");
                                           messageService.changeStatus(message._id, MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) .then(function(upMessage){
                                               winston.debug("Chat21 message sent ", upMessage.toObject());                                        
                                           }).catch(function(err) {
                                               winston.error("Error Chat21 message sent with id: "+message._id, err);                                        
                                           });

                           }).catch(function(err) {
                               winston.error("Chat21 sendToGroup err", err);
                               chat21Event.emit('message.sent.error', err);
                           });

                           

                   } else {
                        winston.error("Chat21Sender this is not a group o direct message", message);
                        return;
                    }
                // });
            });


            requestEvent.on('request.attributes.update',  function(request) {          

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        var gattributes = request.attributes;
                        // qui1
                        chat21.groups.updateAttributes(gattributes, request.request_id).then(function(data) {
                            winston.verbose("Chat21 group gattributes for request.attributes.update updated: " + JSON.stringify(data));      
                            chat21Event.emit('group.update', data);        
                            chat21Event.emit('group.attributes.update', data);                                          
                        }).catch(function(err) {
                            winston.error("Error updating chat21 gattributes for request.attributes.update group ", err);
                            chat21Event.emit('group.attributes.update.error', err);
                        });

                    }
                });
            });

            
            //   not used now. Before used by ionic
            // requestEvent.on('request.update',  function(request) {          

            //     setImmediate(() => {
            //         if (request.channelOutbound.name === ChannelConstants.CHAT21) {

            //             chat21.auth.setAdminToken(adminToken);

            //               // https://stackoverflow.com/questions/42310950/handling-undefined-values-with-firebase/42315610                        
            //             //   var requestWithoutUndefined = JSON.parse(JSON.stringify(request, function(k, v) {
            //             //     if (v === undefined) { return null; } return v; 
            //             //  }));

            //             // var gattributes = { "_request":requestWithoutUndefined};

            //             // qui1
            //             chat21.groups.updateAttributes(gattributes, request.request_id).then(function(data) {
            //                 winston.verbose("Chat21 group gattributes for request.update updated: " +  JSON.stringify(data));      
            //                 chat21Event.emit('group.update', data);        
            //                 chat21Event.emit('group.attributes.update', data);                                          
            //             }).catch(function(err) {
            //                 winston.error("Error updating chat21 gattributes for request.update group ", err);
            //                 chat21Event.emit('group.attributes.update.error', err);
            //             });

            //         }
            //     });
            // });


            // chat21Handler on worker is loaded with stadard events like request.create and NOT request.create.queue because it is used internally by the worker when the request is closed by ChatUnhandledRequestScheduler
            requestEvent.on('request.create',  function(request) {          

                winston.debug("chat21Handler requestEvent request.create called" , request);
                // setImmediate(() => {
// perche nn c'è setImmedite? per performace
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                        // let requestObj = request.toObject();
                        let requestObj = request.toJSON();
                        
                        winston.verbose("creating chat21 group for request with id: " + requestObj._id);

                        // winston.info("requestObj.participants: "+ Object.prototype.toString.call(requestObj.participants));
                        winston.debug("requestObj.participants: "+ JSON.stringify(requestObj.participants));
                        
                        let members = requestObj.participants;
                        // var members = reqParticipantArray;

                        members.push("system");
                        if (request.lead) {
                            // lead_id used. Change it?
                            members.push(request.lead.lead_id);
                        }
                        
                        
                        // let membersArray = JSON.parse(JSON.stringify(members));
                        // winston.info("membersArray", membersArray);

                        var gAttributes = requestObj.attributes || {};
                        // TODO ATTENTION change value by reference
                        // var gAttributes = request.attributes || {}; //BUG LINK TO event emmiter obiect


                        // problema requester_id
                        gAttributes["requester_id"] = request.requester_id;
                    
                       
                        gAttributes['projectId'] = request.id_project; //used by ionic to open request detail 

                        if (request.lead) {
                            gAttributes['userFullname'] = request.lead.fullname; //used by ionic to open request detail 
                            gAttributes['userEmail'] = request.lead.email; //used by ionic to open request detail 
                            // TOOD is it necessary? 
                            // lead_id used. Change it?
                            gAttributes['senderAuthInfo'] = {authType: "USER", authVar: {uid:request.lead.lead_id}}; //used by ionic otherwise ionic dont show userFullname in the participants panel
                        }
                        // TODO ionic dont show attributes panel if attributes.client is empty. bug?
                        gAttributes['client'] = request.userAgent || 'n.d.'; //used by ionic to open request detail 
                        if (request.department) {
                            gAttributes['departmentId'] = request.department._id; //used by ionic to open request detail 
                            gAttributes['departmentName'] = request.department.name; //used by ionic to open request detail 
                        }                        
                        gAttributes['sourcePage'] = request.sourcePage; //used by ionic to open request detail 

                        
                        // https://stackoverflow.com/questions/42310950/handling-undefined-values-with-firebase/42315610

                        //   not used now. Before used by ionic
                        // var requestWithoutUndefined = JSON.parse(JSON.stringify(request, function(k, v) {
                        //     if (v === undefined) { return null; } return v; 
                        //  }));
                        //  gAttributes['_request'] = requestWithoutUndefined; //used by ionic to open request detail 
                        
                        


 
                        winston.debug("Chat21 group create gAttributes: ",gAttributes);  

                        var groupId = request.request_id;

                        var group_name = "Guest"; 
                        // guest_here
                        
                        if (request.lead && request.lead.fullname) {
                            group_name = request.lead.fullname;
                        }
                        if (request.subject) {
                            group_name = request.subject;
                        }
                        
                        // performance console log
                        // console.log("************* before request.support_group.created: "+new Date().toISOString());

                        //TODO racecondition?
                        return chat21.groups.create(group_name, members, gAttributes, groupId).then(function(data) {
                                winston.verbose("Chat21 group created: " + JSON.stringify(data));     

                                // performance console log
                                // console.log("************* after request.support_group.created: "+new Date().toISOString()); 

                                requestEvent.emit('request.support_group.created', request);

                                chat21Event.emit('group.create', data);      
                            }).catch(function(err) {
                                winston.error("Error creating chat21 group ", err);

                                requestEvent.emit('request.support_group.created.error', request);

                                chat21Event.emit('group.create.error', err);
                            });


                    }
                // });
            });
    

            // chat21Handler on worker is loaded with stadard events like request.create and NOT request.create.queue because it is used internally by the worker when the request is closed by ChatUnhandledRequestScheduler

            requestEvent.on('request.close',  function(request) {          //request.close event here noqueued
                winston.debug("request.close event here 8")
                winston.debug("chat21Handler requestEvent request.close called" , request);

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);                      

                        winston.debug("Chat21Sender archiving conversations for ",request.participants);

                       //iterate request.participant and archive conversation
                       request.participants.forEach(function(participant,index) {

                        winston.debug("Chat21Sender archiving conversation: " + request.request_id + "for " + participant);

                            chat21.conversations.archive(request.request_id, participant)
                                        .then(function(data){
                                            winston.verbose("Chat21 conversation archived result "+ JSON.stringify(data));
                                    
                                            chat21Event.emit('conversation.archived', data);                                               

                                }).catch(function(err) {
                                    winston.error("Chat21 archived err", err);
                                    chat21Event.emit('conversation.archived.error', err);
                                });
                       });

                        //    archive: function(recipient_id, user_id){
                       chat21.conversations.archive(request.request_id, "system")
                       .then(function(data){
                           winston.verbose("Chat21 archived for system"+ JSON.stringify(data));
                   
                           chat21Event.emit('conversation.archived', data);                                               

                        }).catch(function(err) {
                            winston.error("Chat21 archived  for system err", err);
                            chat21Event.emit('conversation.archived.error', err);
                        });

                        
                        //  request.lead can be undefined because some test case uses the old deprecated method requestService.createWithId.
                        if (request.lead) {
                            // lead_id used. Change it?
                            chat21.conversations.archive(request.request_id, request.lead.lead_id)  //                        chat21.conversations.archive(request.request_id, request.requester_id)<-desnt'archive

                            .then(function(data){
                                winston.verbose("Chat21 archived for request.lead.lead_id"+ JSON.stringify(data));
                        
                                chat21Event.emit('conversation.archived', data);                                               
     
                             }).catch(function(err) {
                                 winston.error("Chat21 archived for request.lead.lead_id err", err);
                                 chat21Event.emit('conversation.archived.error', err);
                             });
                        }
                        
                    }
                });
            });
            
            requestEvent.on('request.delete', function(request) {

                winston.debug("chat21Handler requestEvent request.delete called" , request);

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        winston.debug("Chat21Sender deleting conversations for ",request.participants);

                        chat21.conversations.delete(request.request_id).then((data) => {
                            winston.verbose("Chat21 conversation archived result "+ JSON.stringify(data));
                            chat21Event.emit('conversation.deleted', data);                                               
                        }).catch((err) => {
                            winston.error("Chat21 deleted err", err);
                            chat21Event.emit('conversation.deleted.error', err);
                        })
                    }
                })

            });

             requestEvent.on('request.participants.update',  function(data) {      
                 
                winston.debug("chat21Handler requestEvent request.participants.update called" , data);

                   let request = data.request;
                   let removedParticipants = data.removedParticipants;
                

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                     
                        let requestObj = request.toJSON();
                        
                        winston.verbose("setting chat21 group for request.participants.update for request with id: " + requestObj._id);
                    
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
                            // lead_id used. Change it?
                            members.push(request.lead.lead_id);
                        }
                        winston.verbose("Chat21 group with members for request.participants.update: " , members);  

                         //setMembers: function(members, group_id){
                                //racecondition  
                        chat21.groups.setMembers(members, groupId).then(function(data) {
                                winston.verbose("Chat21 group set for request.participants.update : " + JSON.stringify(data));      
                                chat21Event.emit('group.setMembers', data);                                          
                            }).catch(function(err) {
                                winston.error("Error setting chat21 group for request.participants.update ", err);
                                chat21Event.emit('group.setMembers.error', err);
                            });


                        // let oldParticipants = data.beforeRequest.participants;
                        // winston.info("oldParticipants ", oldParticipants);

                        // let newParticipants = data.request.participants;
                        // winston.info("newParticipants ", newParticipants);

                        // var removedParticipants = oldParticipants.filter(d => !newParticipants.includes(d));
                        // winston.info("removedParticipants ", removedParticipants);

                       

                        removedParticipants.forEach(function(removedParticipant) {
                            winston.debug("removedParticipant ", removedParticipant);

                            // archive: function(recipient_id, user_id){
                            //racecondition?low it's not dangerous archive a conversation that doen't exist

                            chat21.conversations.archive(request.request_id, removedParticipant)
                            .then(function(data){
                                winston.verbose("Chat21 archived "+ JSON.stringify(data));
                        
                                chat21Event.emit('conversation.archived', data);                                               
        
                                }).catch(function(err) {
                                    winston.error("Chat21 archived err", err);
                                    chat21Event.emit('conversation.archived.error', err);
                                });

                        });
                        



                    }
                });
            });
            
            
               requestEvent.on('request.participants.join',  function(data) {       
                   winston.debug("chat21Handler requestEvent request.participants.join called" , data);

                   let request = data.request;
                   let member = data.member;

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                        

                     
                        // let requestObj = request.toJSON();
                        
                        var groupId = request.request_id;

                        winston.verbose("joining member " + member +" for chat21 group with request : " + groupId);
                                            
                             //racecondition?

                         //join: function(member_id, group_id){
                        chat21.groups.join(member, groupId).then(function(data) {
                                winston.verbose("Chat21 group joined: " + JSON.stringify(data));      
                                chat21Event.emit('group.join', data);                                          
                            }).catch(function(err) {
                                winston.error("Error joining chat21 group ", err);
                                chat21Event.emit('group.join.error', err);
                            });



                    }
                });
            });
            
            
               requestEvent.on('request.participants.leave',  function(data) {     
                   winston.debug("chat21Handler requestEvent request.participants.leave called" , data);

                   let request = data.request;
                   let member = data.member;

                setImmediate(() => {
                    if (request.channelOutbound.name === ChannelConstants.CHAT21) {

                        chat21.auth.setAdminToken(adminToken);

                     

                     
                        // let requestObj = request.toJSON();
                        
                        var groupId = request.request_id;

                        winston.verbose("leaving " + member +" for chat21 group for request with id: " + groupId);
                                   
                        //racecondition?
                         //leave: function(member_id, group_id){
                        chat21.groups.leave(member, groupId).then(function(data) {
                                winston.verbose("Chat21 group leaved: " + JSON.stringify(data));      
                                chat21Event.emit('group.leave', data);                                          
                            }).catch(function(err) {
                                winston.error("Error leaving chat21 group ", err);
                                chat21Event.emit('group.leave.error', err);
                            });


                            // anche devi archiviare la conversazione per utente corrente 
                            //racecondition?
                            chat21.conversations.archive(request.request_id, member)
                            .then(function(data){
                                winston.verbose("Chat21 archived " + JSON.stringify(data));
                        
                                chat21Event.emit('conversation.archived', data);                                               
     
                             }).catch(function(err) {
                                 winston.error("Chat21 archived err", err);
                                 chat21Event.emit('conversation.archived.error', err);
                             });

                           


                    }
                });
            })
            




            groupEvent.on('group.create',  function(group) {                       

                if (process.env.SYNC_CHAT21_GROUPS !=="true") {
                    winston.debug("Sync Tiledesk to Chat21 groups disabled");
                    return;
                }

                winston.verbose("Creating chat21 group", group);
                
                setImmediate(() => {

                    chat21.auth.setAdminToken(adminToken);


                    var groupMembers = group.members;
                    winston.debug("groupMembers ", groupMembers); 
                    
                    var group_id = "group-" + group._id;
                    winston.debug("group_id :" + group_id); 

                    return chat21.groups.create(group.name, groupMembers, undefined, group_id).then(function(data) {
                        winston.verbose("Chat21 group created: " + JSON.stringify(data));      
                        // TODO ritorna success anche se 
                        // verbose: Chat21 group created: {"success":false,"err":{"message":"Channel closed","stack":"IllegalOperationError: Channel closed\n    at ConfirmChannel.<anonymous> (/usr/src/app/node_modules/amqplib/lib/channel.js:160:11)\n    at ConfirmChannel.Channel.publish (/usr/src/app/node_modules/amqplib/lib/callback_model.js:171:17)\n    at ConfirmChannel.publish (/usr/src/app/node_modules/amqplib/lib/callback_model.js:301:36)\n    at Chat21Api.publish (/usr/src/app/chat21Api/index.js:1028:29)\n    at Chat21Api.sendMessageRaw (/usr/src/app/chat21Api/index.js:762:14)\n    at Chat21Api.sendGroupWelcomeMessage (/usr/src/app/chat21Api/index.js:205:14)\n    at /usr/src/app/chat21Api/index.js:99:22\n    at /usr/src/app/chat21Api/index.js:234:17\n    at /usr/src/app/chatdb/index.js:77:9\n    at executeCallback (/usr/src/app/node_modules/mongodb/lib/operations/execute_operation.js:70:5)\n    at updateCallback (/usr/src/app/node_modules/mongodb/lib/operations/update_one.js:41:3)\n    at /usr/src/app/node_modules/mongodb/lib/operations/update_one.js:24:64\n    at handleCallback (/usr/src/app/node_modules/mongodb/lib/utils.js:128:55)\n    at /usr/src/app/node_modules/mongodb/lib/operations/common_functions.js:378:5\n    at handler (/usr/src/app/node_modules/mongodb/lib/core/sdam/topology.js:913:24)","stackAtStateChange":"Stack capture: Socket error\n    at Connection.C.onSocketError (/usr/src/app/node_modules/amqplib/lib/connection.js:354:13)\n    at Connection.emit (events.js:314:20)\n    at Socket.go (/usr/src/app/node_modules/amqplib/lib/connection.js:481:12)\n    at Socket.emit (events.js:314:20)\n    at emitReadable_ (_stream_readable.js:557:12)\n    at processTicksAndRejections (internal/process/task_queues.js:83:21)"}}
                        chat21Event.emit('group.create', data);                                          
                    }).catch(function(err) {
                        winston.error("Error creating chat21 group ", err);
                        chat21Event.emit('group.create.error', err);
                    });

                });

             });


             groupEvent.on('group.update',  function(group) {                       

                if (process.env.SYNC_CHAT21_GROUPS !=="true") {
                    winston.debug("Sync Tiledesk to Chat21 groups disabled");
                    return;
                }

                winston.verbose("Updating chat21 group", group);
                
                setImmediate(() => {

                    chat21.auth.setAdminToken(adminToken);


                    var groupMembers = group.members;
                    winston.debug("groupMembers ", groupMembers); 
                    
                    var group_id = "group-" + group._id;
                    winston.debug("group_id :" + group_id); 

                            // update: function(name, owner, attributes, group_id){
                    return chat21.groups.update(group.name, undefined, undefined, group_id).then(function(data) {
                        winston.verbose("Chat21 group.update updated: " + JSON.stringify(data));      
                        chat21Event.emit('group.update', data);     
                        return chat21.groups.setMembers(groupMembers, group_id).then(function(data) {      
                            winston.verbose("Chat21 group.update set: " + JSON.stringify(data));      
                            chat21Event.emit('group.setMembers', data);          
                        }).catch(function(err) {
                            winston.error("Error setMembers chat21 group.update ", err);
                            chat21Event.emit('group.setMembers.error', err);
                        });                             
                    }).catch(function(err) {
                        winston.error("Error setting chat21 group.update ", err);
                        chat21Event.emit('group.update.error', err);
                    });

                });

             });





             groupEvent.on('group.delete',  function(group) {                       

                if (process.env.SYNC_CHAT21_GROUPS !=="true") {
                    winston.debug("Sync Tiledesk to Chat21 groups disabled");
                    return;
                }

                winston.verbose("Deleting chat21 group for group.delete", group);
                
                setImmediate(() => {

                    chat21.auth.setAdminToken(adminToken);
                  
                    var group_id = "group-" + group._id;
                    winston.debug("group_id :" + group_id); 

                    //Remove members but group remains.

                    return chat21.groups.setMembers(["system"], group_id).then(function(data) {      
                        winston.verbose("Chat21 group set for group.delete : " + JSON.stringify(data));      
                        chat21Event.emit('group.setMembers', data);          
                    }).catch(function(err) {
                        winston.error("Error setMembers chat21 group for group.delete", err);
                        chat21Event.emit('group.setMembers.error', err);
                    });           

                });

             });

    }

    
}

var chat21Handler = new Chat21Handler();
module.exports = chat21Handler;
