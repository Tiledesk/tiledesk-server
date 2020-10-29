var Message = require("../models/message");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);
    return Message.updateMany({}, {"$set": {channel: {name: "chat21"}, channel_type: "group"}}, function (err, updates) {
        winston.info("Schema updated for " + updates.nModified + " messages")
       return resolve('ok'); 
    });  
  });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () { 
  // Write migration here
}

module.exports = { up, down };
 