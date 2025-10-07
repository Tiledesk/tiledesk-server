let winston = require('../config/winston');
const emailService = require("../services/emailService");
const Project = require("../models/project");
let handlebars = require('handlebars');

class SendEmailUtil {
    async sendEmailDirect(to, text, id_project, recipient, subject, message) {

        let project = await Project.findById(id_project);
        winston.debug("project", project);

        winston.debug("text: " + text);
        winston.debug("recipient:"+ recipient);
        winston.debug("to:" + to);

        let template = handlebars.compile(text);

        let replacements = {        
            message: message,           
          };
        
        let finaltext = template(replacements);
        winston.debug("finaltext:" + finaltext);


        // sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage, payload) {
        emailService.sendEmailDirect(to, finaltext, project, recipient, subject, undefined, undefined, message);
        
    }
}

let sendEmailUtil = new SendEmailUtil();

module.exports = sendEmailUtil;