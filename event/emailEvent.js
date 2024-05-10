
const EventEmitter = require('events');
const emailService = require('../services/emailService');
const project_user = require('../models/project_user');
var winston = require('../config/winston');
const user = require('../models/user');

class EmailEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
    }
}

const emailEvent = new EmailEvent();

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

            emailService.sendEmailQuotaCheckpointReached(user.email, user.firstname, data.project_name, resource_name, data.checkpoint, data.quotes)
            
        })

    
    })

    //emailService.sendEmailQuotaCheckpointReached()

    //no cache required here. because is always new (empty)
    // request
    //     .populate(
    //         [           
    //         {path:'department'},
    //         {path:'lead'},
    //         {path:'participatingBots'},
    //         {path:'participatingAgents'},                                         
    //         {path:'requester',populate:{path:'id_user'}}
    //         ]
    //     )
    //     .execPopulate( function(err, requestComplete) {

    //         if (err){
    //             winston.error('error getting request', err);
    //             return requestEvent.emit('request.create', request);
    //         }

    //         winston.debug('emitting request.create', requestComplete.toObject());

    //         requestEvent.emit('request.create', requestComplete);

    //         //with request.create no messages are sent. So don't load messages
    //     // Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {                  
    //     //   if (err) {
    //     //         winston.error('err', err);
    //     //   }
    //     //   winston.debug('requestComplete',requestComplete.toObject());
    //     //   requestComplete.messages = messages;
    //     //   requestEvent.emit('request.create', requestComplete);

    //     // //   var requestJson = request.toJSON();
    //     // //   requestJson.messages = messages;
    //     // //   requestEvent.emit('request.create', requestJson);
    //     // });
    // });
  });

module.exports =  emailEvent;