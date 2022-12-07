var winston = require('../config/winston');
const emailService = require("../services/emailService");
const Project = require("../models/project");

class SendEmailUtil {
    async sendEmailDirect(to, text, id_project, recipient, subject) {

        let project = await Project.findById(id_project);
        winston.debug("project", project);

        winston.debug("text: " + text);
        winston.debug("recipient:"+ recipient);
        winston.debug("to:" + to);

        // sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage) {
        emailService.sendEmailDirect(to, text, project, recipient, subject, undefined, undefined);
        // winston.info("qui:");
    }
}

var sendEmailUtil = new SendEmailUtil();

module.exports = sendEmailUtil;