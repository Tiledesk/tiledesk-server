var winston = require('../config/winston');
const emailService = require("../services/emailService");
const Project = require("../models/project");
var handlebars = require('handlebars');

class SendEmailUtil {
    async sendEmailDirect(to, text, id_project, recipient, subject, message) {

        let project = await Project.findById(id_project);
        winston.debug("project", project);

        winston.debug("text: " + text);
        winston.debug("recipient:"+ recipient);
        winston.debug("to:" + to);

        var template = handlebars.compile(text);

        var replacements = {        
            message: message,           
          };
        
        var finaltext = template(replacements);
        winston.debug("finaltext:" + finaltext);


        // sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage) {
        emailService.sendEmailDirect(to, finaltext, project, recipient, subject, undefined, undefined);
        // emailService.sendEmailDirect(to, text, project, recipient, subject, undefined, undefined);
    }
}

var sendEmailUtil = new SendEmailUtil();

module.exports = sendEmailUtil;