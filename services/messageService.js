'use strict';

// var Request = require("../models/request");
var Message = require("../models/message");
var MessageConstants = require("../models/messageConstants");

// var mongoose = require('mongoose');
// var requestService = require('../services/requestService');
// var leadService = require('../services/leadService');
// winston.debug("requestService", requestService);

const messageEvent = require('../event/messageEvent');

var winston = require('../config/winston');

class MessageService {


    // sender: message.sender,
    //   senderFullname: message.sender_fullname,
    //   recipient: message.recipient,
    //   recipientFullname: message.recipient_fullname,
    //   text: message.text,
    //   id_project: projectid,
    //   createdBy: "system",
    //   updatedBy: "system"



   send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type) {
       return this.create(sender, senderFullname, recipient, text, id_project, createdBy, MessageConstants.CHAT_MESSAGE_STATUS.SENDING, attributes, type);
   }

   upsert(id, sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {
       if (!id) {
           return this.create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata);
       } else {
            winston.debug("Message changeStatus", status);
            return this.changeStatus(id, status);
       }
   }
  create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata) {

    var that = this;
    return new Promise(function (resolve, reject) {

        if (!createdBy) {
            createdBy = sender;
          }
    
          
    
        // if (id_project) {

            var newMessage = new Message({
                sender: sender,
                senderFullname: senderFullname,
                recipient: recipient,
                type: type,
                // recipientFullname: recipientFullname,
                text: text,
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy,
                status : status,
                metadata: metadata,
                attributes: attributes
            });
            
            // winston.debug("create new message", newMessage);

            return newMessage.save(function(err, savedMessage) {
                if (err) {
                    winston.error(err);
                    return reject(err);
                }
                winston.info("Message created", savedMessage.toObject());

                messageEvent.emit('message.create.simple', savedMessage);

                that.emitMessage(savedMessage);
                // if (savedMessage.status === MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED) {
                //     messageEvent.emit('message.received.simple', savedMessage);
                // }

                // if (savedMessage.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {
                //     messageEvent.emit('message.sending.simple', savedMessage);
                // }
                

                return resolve(savedMessage);
            });

    
       

    });

  };  



  emitMessage(message) {
    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.RECEIVED) {
        messageEvent.emit('message.received.simple', message);
    }

    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENDING) {
        messageEvent.emit('message.sending.simple', message);
    }

    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.SENT) {
        messageEvent.emit('message.sent.simple', message);
    }

    if (message.status === MessageConstants.CHAT_MESSAGE_STATUS.DELIVERED) {
        messageEvent.emit('message.delivered.simple', message);
    }
  }

//   TODO must update also message.attributes from chat21
  changeStatus(message_id, newstatus) {
    var that = this;
    return new Promise(function (resolve, reject) {
     // winston.debug("request_id", request_id);
     // winston.debug("newstatus", newstatus);

        return Message.findByIdAndUpdate(message_id, {status: newstatus}, {new: true, upsert:false}, function(err, updatedMessage) {
            if (err) {
              winston.error(err);
              return reject(err);
            }
            messageEvent.emit('message.update.simple',updatedMessage);
           // winston.debug("updatedMessage", updatedMessage);

           that.emitMessage(updatedMessage);

            return resolve(updatedMessage);
          });
    });

  }



  getTranscriptByRequestId(requestid, id_project) {
    winston.debug("requestid", requestid);
    winston.debug("id_project", id_project);
    var that = this;
    return new Promise(function (resolve, reject) {
        return Message.find({"recipient": requestid, id_project: id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
            if (err) {
                winston.error("Error getting the transcript", err);
                return reject(err);
            }
    
            winston.debug("messages", messages);

            if(!messages){
                return resolve(messages); 
            }

            

            var transcript = '';
            // messages.forEach(message => {
                for (var i = 0; i < messages.length; i++) {
                    var message = messages[i];
                    // winston.debug("message", message);
                    // winston.debug("message.createdAt", message.createdAt);
                    

                    transcript = transcript  +
                        message.createdAt.toLocaleString('it', { timeZone: 'UTC' }) +
                        ' ' + message.senderFullname + 
                        ': ' + message.text;

                        //not add line break for last message
                        if (i<messages.length-1){
                            transcript = transcript  + '\r\n';
                        }

                        // winston.debug("transcript", transcript);
                }
            // });

            // winston.debug("final transcript", transcript);

            // each message in messages
            // p [#{message.createdAt.toLocaleString('it', { timeZone: 'UTC' })}] #{message.senderFullname}: #{message.text}
            resolve(transcript);
    
        });
    });
  }








 
}


var messageService = new MessageService();


module.exports = messageService;