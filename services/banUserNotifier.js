var messageService = require("./messageService");
var projectEvent = require("../event/projectEvent");

var winston = require('../config/winston');


class BanUserNotifier {

    listen() {
        projectEvent.on("project.update.user.ban", function(data) {
            var project=data.project;
            var banInfo = data.banInfo;

            winston.debug("User Banned");
            messageService.send(
                'system', 
                'Bot',                                     
                banInfo.id,
                "User Banned", 
                project._id,
                'system', 
                {subtype:"info"},
                undefined,
                undefined
            );
        });
        projectEvent.on("project.update.user.unban", function(data) {
            var project=data.project;
            var banInfo = data.banInfo;

            winston.debug("User UnBanned");

            messageService.send(
                'system', 
                'Bot',                                     
                banInfo.id,
                "User Unbanned", 
                project._id,
                'system', 
                {subtype:"info"},
                undefined,
                undefined
            );
        });
    }

}
var banUserNotifier = new BanUserNotifier();


module.exports = banUserNotifier;
