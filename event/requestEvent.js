const EventEmitter = require('events');
var Message = require("../models/message");
var Request = require("../models/request");

var winston = require('../config/winston');

class RequestEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
        this.setMaxListeners(11);
      }
}

const requestEvent = new RequestEvent();


requestEvent.on('request.create.simple', function(request) {


    // TODO setImmediate here?
    winston.debug('requestEvent here', request);
    winston.debug('executin query populate on requestEvent');

    winston.debug("request.create.simple");
    //no cache required here. because is always new (empty)
    request
        .populate(
            [           
            {path:'department'},
            {path:'lead'},
            {path:'participatingBots'},
            {path:'participatingAgents'},                                         
            {path:'requester',populate:{path:'id_user'}}
            ]
        )
        .execPopulate( function(err, requestComplete) {

            if (err){
                winston.error('error getting request', err);
                return requestEvent.emit('request.create', request);
            }

            winston.debug('emitting request.create', requestComplete.toObject());

            requestEvent.emit('request.create', requestComplete);

            //with request.create no messages are sent. So don't load messages
        // Message.find({recipient:  request.request_id, id_project: request.id_project}).sort({updatedAt: 'asc'}).exec(function(err, messages) {                  
        //   if (err) {
        //         winston.error('err', err);
        //   }
        //   winston.debug('requestComplete',requestComplete.toObject());
        //   requestComplete.messages = messages;
        //   requestEvent.emit('request.create', requestComplete);

        // //   var requestJson = request.toJSON();
        // //   requestJson.messages = messages;
        // //   requestEvent.emit('request.create', requestJson);
        // });
    });
  });


module.exports = requestEvent;
