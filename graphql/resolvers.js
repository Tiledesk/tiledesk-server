var winston = require('../config/winston');

/*
standalone mongo init

var config = require('../../config/database');

var mongoose = require('mongoose');
require('dotenv').config();

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

if (!databaseUri) {
  winston.warn('DATABASE_URI not specified, falling back to localhost.');
}

winston.info("databaseUri: " + databaseUri);

var autoIndex = true;
if (process.env.MONGOOSE_AUTOINDEX) {
  autoIndex = process.env.MONGOOSE_AUTOINDEX;
}
winston.info("autoIndex: " + autoIndex);

if (process.env.NODE_ENV == 'test')  {
  mongoose.connect(config.databasetest, { "autoIndex": true });
}else {
  mongoose.connect(databaseUri, { "autoIndex": autoIndex });
}

*/


const  PubSub  = require('apollo-server').PubSub;
const withFilter = require('apollo-server').withFilter;


const Message  =require('../models/message');
const Request  =require('../models/request');
const requestEvent = require('../event/requestEvent');
var connectionEvent = require('../event/connectionEvent');


const REQUEST_CREATED = 'REQUEST_CREATED';
const REQUEST_UPDATED = 'REQUEST_UPDATED';
const REQUEST_CLOSED = 'REQUEST_CLOSED';
const REQUEST_REOPENED = 'REQUEST_REOPENED';

const MESSAGE_CREATED = 'MESSAGE_CREATED';
const MESSAGE_UPDATED = 'MESSAGE_UPDATED';

const PRESENCE_ONLINE = 'PRESENCE_ONLINE';

const pubsub = new PubSub();


requestEvent.on('request.create',  function(request) {          
  pubsub.publish(REQUEST_CREATED, { requestCreated: request });
});

requestEvent.on('request.update',  function(request) {          
  pubsub.publish(REQUEST_UPDATED, { requestUpdated: request });
});

requestEvent.on('request.close',  function(request) {          
  pubsub.publish(REQUEST_CLOSED, { requestClosed: request });
});

requestEvent.on('request.reopen',  function(request) {          
  pubsub.publish(REQUEST_REOPENED, { requestReopened: request });
});

connectionEvent.on('subscription.connected',  function(sub) {   
  winston.info("subscription.connected:"+sub.userid);       
  pubsub.publish(PRESENCE_ONLINE, { userPresenceOnline: sub });
});

const resolvers = {
    Query: {        
        async requests(_, { id_project }) {
          winston.info("requests");
          var query = { "id_project": id_project };
          winston.info("query: ",query);
          return await Request.find(query)
            .populate('department').
            populate('lead').
            populate('participatingBots').
            populate('participatingAgents'). 
            populate({path:'requester',populate:{path:'id_user'}});
        },
        async messages() {
          winston.info("messages");
          return await Message.find({});
        },
        async fetchMessage(_, { id }) {
          winston.info("fetchMessage:"+id);
          return await Message.findById(id);
        },
    },
    Mutation: {
        async createMessage(_, { text,createdBy, id_project,recipient, sender }) {
            const message = await Message.create({ text,createdBy, id_project,recipient, sender });
            await pubsub.publish(MESSAGE_CREATED, { messageCreated: message });
            return message;
        },
        async updateMessage(_, { id, text, isFavorite}) {
            const message = await Message.findById(id);
            await message.update({text,isFavorite})
            .then(message=>{
                pubsub.publish(MESSAGE_UPDATED, { messageUpdated: message });
            });
            return message;
        },
    },
    Subscription: {       
        requestCreated: {
                    // subscribe: () => pubsub.asyncIterator([REQUEST_CREATED]),
          subscribe: withFilter(
            () => pubsub.asyncIterator('REQUEST_CREATED'),
                  (payload, variables) => {
                          return payload.requestCreated.id_project === variables.id_project;
                      },
            ),
          },
        
      requestUpdated: {
          subscribe: withFilter(
            () => pubsub.asyncIterator('REQUEST_UPDATED'),
                  (payload, variables) => {
                          return payload.requestUpdated.id_project === variables.id_project;
                      },
            ),
          },
      requestClosed: {
            subscribe: withFilter(
              () => pubsub.asyncIterator('REQUEST_CLOSED'),
                    (payload, variables) => {
                            return payload.requestClosed.id_project === variables.id_project;
                        },
              ),
            },

      requestReopened: {
              subscribe: withFilter(
                () => pubsub.asyncIterator('REQUEST_REOPENED'),
                      (payload, variables) => {
                              return payload.requestReopened.id_project === variables.id_project;
                          },
                ),
              },
        messageUpdated: {
            subscribe: withFilter(
                                  () => pubsub.asyncIterator('MESSAGE_UPDATED'),
                                        (payload, variables) => {
                                                return payload.messageUpdated.id === variables.id;
                                            },
                                  ),
          },
          messageCreated: {
            subscribe: () => pubsub.asyncIterator([MESSAGE_CREATED]),
          },
          userPresenceOnline: {
            subscribe: withFilter(
              () => pubsub.asyncIterator('PRESENCE_ONLINE'),
                    (payload, variables) => {
                      winston.info("payload.userPresenceOnline.id_project: "+payload.userPresenceOnline.id_project);
                      winston.info("variables.id_project:"+variables.id_project);
                            return payload.userPresenceOnline.id_project === variables.id_project;
                        },
              ),
            // subscribe: () => pubsub.asyncIterator([PRESENCE_ONLINE]),
            },
        },
          // subscriptionDisconnected: Request
    
}

module.exports  = resolvers;
