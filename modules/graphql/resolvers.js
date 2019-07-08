/*
standalone mongo init

var config = require('../../config/database');
var winston = require('../..//config/winston');
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


const Message  =require('../..//models/message');
const Request  =require('../..//models/request');
const requestEvent = require('../../event/requestEvent');


const REQUEST_CREATED = 'REQUEST_CREATED';
const REQUEST_UPDATED = 'REQUEST_UPDATED';

const MESSAGE_CREATED = 'MESSAGE_CREATED';
const MESSAGE_UPDATED = 'MESSAGE_UPDATED';

const pubsub = new PubSub();


requestEvent.on('request.create',  function(request) {          
  pubsub.publish(REQUEST_CREATED, { requestCreated: request });
  // setImmediate(() => {
  // });
});

const resolvers = {
    Query: {
        async messages() {
          return await Message.find({});
        },
        async requests() {
          return await Request.find({});
        },
        async fetchMessage(_, { id }) {
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
        messageCreated: {
          subscribe: () => pubsub.asyncIterator([MESSAGE_CREATED]),
        },
        requestCreated: {
          subscribe: () => pubsub.asyncIterator([REQUEST_CREATED]),
        },
        messageUpdated: {
            subscribe: withFilter(
                                  () => pubsub.asyncIterator('MESSAGE_UPDATED'),
                                        (payload, variables) => {
                                                return payload.messageUpdated.id === variables.id;
                                            },
                                  ),
          },
    }
}

module.exports  = resolvers;
