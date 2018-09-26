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


  create(sender, senderFullname, recipient, recipientFullname, text, id_project, createdBy) {

    return new Promise(function (resolve, reject) {

    
        if (id_project) {

            var newMessage = new Message({
                sender: sender,
                senderFullname: senderFullname,
                recipient: recipient,
                recipientFullname: recipientFullname,
                text: text,
                id_project: id_project,
                createdBy: createdBy,
                updatedBy: createdBy
            });
            
            console.log("create new message", newMessage);

            return newMessage.save(function(err, savedMessage) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                return resolve(savedMessage);
            });

        } else {
            //lookup from requests
            return Request.findOne({request_id: recipient}, function(err, request) {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                if (request) {
                    
                    var newMessage = new Message({
                        sender: sender,
                        senderFullname: senderFullname,
                        recipient: recipient,
                        recipientFullname: recipientFullname,
                        text: text,
                        id_project: request.id_project,
                        createdBy: createdBy,
                        updatedBy: createdBy
                    });

                }else {
                    var newMessage = new Message({
                        sender: sender,
                        senderFullname: senderFullname,
                        recipient: recipient,
                        recipientFullname: recipientFullname,
                        text: text,
                        id_project: "undefined",
                        createdBy: createdBy,
                        updatedBy: createdBy
                    });
                }
              
                

                console.log("create new message with id_project from request lookup", newMessage);
    
                return newMessage.save(function(err, savedMessage) {
                    if (err) {
                        console.error(err);
                        return reject(err);
                    }
                    return resolve(savedMessage);
                });

              });
        }
    
       

    });

  };  









 
}


var messageService = new MessageService();


module.exports = messageService;
