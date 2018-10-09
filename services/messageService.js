'use strict';

var Request = require("../models/request");
var Message = require("../models/message");

var mongoose = require('mongoose');


class MessageService {


    // sender: message.sender,
    //   senderFullname: message.sender_fullname,
    //   recipient: message.recipient,
    //   recipientFullname: message.recipient_fullname,
    //   text: message.text,
    //   id_project: projectid,
    //   createdBy: "system",
    //   updatedBy: "system"



  create(sender, senderFullname, recipient, text, id_project, createdBy) {

    return new Promise(function (resolve, reject) {

        if (!createdBy) {
            createdBy = sender;
          }
    
          
    
        // if (id_project) {

            var newMessage = new Message({
                sender: sender,
                senderFullname: senderFullname,
                recipient: recipient,
                // recipientFullname: recipientFullname,
                text: text,
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy
            });
            
            // console.log("create new message", newMessage);

            return newMessage.save(function(err, savedMessage) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                console.log("Message created", savedMessage);
                return resolve(savedMessage);
            });

        // } else {
            //lookup from requests
            // return Request.findOne({request_id: recipient}, function(err, request) {
            //     if (err) {
            //         console.error(err);
            //         return reject(err);
            //     }
            //     if (request) {
                    
            //         var newMessage = new Message({
            //             sender: sender,
            //             senderFullname: senderFullname,
            //             recipient: recipient,
            //             recipientFullname: recipientFullname,
            //             text: text,
            //             id_project: request.id_project,
            //             createdBy: createdBy,
            //             updatedBy: createdBy
            //         });

            //     }else {
            //         var newMessage = new Message({
            //             sender: sender,
            //             senderFullname: senderFullname,
            //             recipient: recipient,
            //             recipientFullname: recipientFullname,
            //             text: text,
            //             id_project: "undefined",
            //             createdBy: createdBy,
            //             updatedBy: createdBy
            //         });
            //     }
              
                

            //     // console.log("create new message with id_project from request lookup", newMessage);
    
            //     return newMessage.save(function(err, savedMessage) {
            //         if (err) {
            //             console.error(err);
            //             return reject(err);
            //         }
            //         return resolve(savedMessage);
            //     });

            //   });
        // }
    
       

    });

  };  


  getTranscriptByRequestId(requestid, id_project) {
    var that = this;
    return new Promise(function (resolve, reject) {
        return Message.find({"recipient": requestid, id_project: id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) { 
            if (err) {
                console.error("Error getting the transcript", err);
                return reject(err);
            }
    
            if(!messages){
                return resolve(messages); 
            }

            // console.log("messages", messages);

            var transcript = '';
            // messages.forEach(message => {
                for (var i = 0; i < messages.length; i++) {
                    var message = messages[i];
                    // console.log("message", message);
                    // console.log("message.createdAt", message.createdAt);
                    

                    transcript = transcript  +
                        message.createdAt.toLocaleString('it', { timeZone: 'UTC' }) +
                        ' ' + message.senderFullname + 
                        ': ' + message.text;

                        //not add line break for last message
                        if (i<messages.length-1){
                            transcript = transcript  + '\r\n';
                        }

                        // console.log("transcript", transcript);
                }
            // });

            // console.log("final transcript", transcript);

            // each message in messages
            // p [#{message.createdAt.toLocaleString('it', { timeZone: 'UTC' })}] #{message.senderFullname}: #{message.text}
            resolve(transcript);
    
        });
    });
  }








 
}


var messageService = new MessageService();


module.exports = messageService;
