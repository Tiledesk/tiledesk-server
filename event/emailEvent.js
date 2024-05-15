const EventEmitter = require('events');
const project_user = require('../models/project_user');
var winston = require('../config/winston');
const user = require('../models/user');

class EmailEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
    }

    listen() {

        emailEvent.on('email.send.quote.checkpoint', function(data) {

            // TODO setImmediate here?
            winston.debug("emailEvent data: ", data);
        
            project_user.findOne({ id_project: data.id_project }, (err, puser) => {
        
                if (err) {
                    winston.error("error finding owner user: " + err);
                    return;
                }
        
                if (!puser) {
                    winston.error("Owner user not found. Unable to send checkpoint quota reached.");
                    return;
                }
        
                user.findOne({ _id: puser.id_user}, (err, user) => {
        
                    if (err) {
                        winston.error("Error finding user: ", err);
                        return
                    }
        
                    if (!user) {
                        winston.error("User not found. Unable to send checkpoint quota reached.")
                        return;
                    }
        
                    let resource_name;
                    if (data.type == 'requests') {
                        resource_name = 'Conversations'
                    }
                    if (data.type == 'tokens') {
                        resource_name = 'AI Tokens'
                    }
                    if (data.type == 'email') {
                        resource_name = 'Chatbot Email'
                    }
                    
                    const emailService = require('../services/emailService'); // imported here to ensure that the emailService instance was already created

                    emailService.sendEmailQuotaCheckpointReached(user.email, user.firstname, data.project_name, resource_name, data.checkpoint, data.quotes);
                })
        
            
            })
        
          });
    }
}

const emailEvent = new EmailEvent();
emailEvent.listen();

module.exports =  emailEvent;
