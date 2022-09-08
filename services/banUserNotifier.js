var messageService = require("./messageService");
var projectEvent = require("../event/projectEvent");

var winston = require('../config/winston');

var MessageConstants = require("../models/messageConstants");

class BanUserNotifier {

    listen() {
        projectEvent.on("project.update.user.ban", function(data) {
            var project=data.project;
            var banInfo = data.banInfo;

            winston.debug("User Banned");

            var message = {
                sender: 'system',
                senderFullname: 'Bot',
                recipient: banInfo.id,
                recipientFullname: banInfo.id,
                text: "User Banned",
                id_project: project._id,
                createdBy: "system",
                attributes: {subtype:"info", messagelabel: {key: "USER_BANNED"} },
                channel_type: MessageConstants.CHANNEL_TYPE.DIRECT,
                status: MessageConstants.CHAT_MESSAGE_STATUS.SENDING,
                // channel: {name: "chat21"}
            };
            messageService.save(message);
            winston.info("User banned", message);
            // messageService.send(
            //     'system', 
            //     'Bot',                                     
            //     banInfo.id,
            //     "User Banned", 
            //     project._id,
            //     'system', 
            //     {subtype:"info"},
            //     undefined,
            //     undefined
            // );
        });
        projectEvent.on("project.update.user.unban", function(data) {
            var project=data.project;
            var banInfo = data.banInfo;

            winston.debug("User UnBanned: "+banInfo);

            // var message = {
            //     sender: 'system',
            //     senderFullname: 'Bot',
            //     recipient: banInfo,
            //     recipientFullname: banInfo,
            //     text: "User Unbanned",
            //     id_project: project._id,
            //     createdBy: "system",
            //     attributes: {subtype:"info", messagelabel: {key: "USER_BANNED"}},
            //     channel_type: MessageConstants.CHANNEL_TYPE.DIRECT,
            //     status: MessageConstants.CHAT_MESSAGE_STATUS.SENDING,
            // };
            // messageService.save(message);
            // winston.info("User UnBanned", message);


            

            // messageService.send(
            //     'system', 
            //     'Bot',                                     
            //     banInfo.id,
            //     "User Unbanned", 
            //     project._id,
            //     'system', 
            //     {subtype:"info"},
            //     undefined,
            //     undefined
            // );
        });
    }

}
var banUserNotifier = new BanUserNotifier();


module.exports = banUserNotifier;
