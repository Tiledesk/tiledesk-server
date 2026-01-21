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


requestEvent.on('request.create.simple', function(request, snapshot) {


    // TODO setImmediate here?
    winston.debug('requestEvent here', request);
    winston.debug('executin query populate on requestEvent');

    winston.debug("request.create.simple");
    console.log('[WELCOME_MSG_FLOW] requestEvent: received request.create.simple', { request_id: request.request_id, id_project: request.id_project, first_text: request.first_text });
    //no cache required here. because is always new (empty)

    winston.info("main_flow_cache_3 requestEvent populate");
    const t1 = Date.now();

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

            winston.info("main_flow_cache_3 requestEvent populate end");
            console.log("[Performance] requestEvent populate time: " + (Date.now() - t1));
            winston.debug('emitting request.create', requestComplete.toObject());
            console.log('[WELCOME_MSG_FLOW] requestEvent: emitting request.create (after populate)', { request_id: requestComplete.request_id, id_project: requestComplete.id_project, first_text: requestComplete.first_text, channelOutbound: requestComplete.channelOutbound?.name });

            requestEvent.emit("request.snapshot.update", { request: request, snapshot: snapshot });
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
