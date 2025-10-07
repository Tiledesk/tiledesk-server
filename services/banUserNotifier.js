let messageService = require("./messageService");
let projectEvent = require("../event/projectEvent");

let winston = require('../config/winston');

let MessageConstants = require("../models/messageConstants");

class BanUserNotifier {

    listen() {
        projectEvent.on("project.update.user.ban", function(data) {
            let project=data.project;
            let banInfo = data.banInfo;

            winston.debug("User Banned");

            let message = {
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
            let project=data.project;
            let banInfo = data.banInfo;

            winston.debug("User UnBanned: "+banInfo);

            // let message = {
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
let banUserNotifier = new BanUserNotifier();


module.exports = banUserNotifier;
