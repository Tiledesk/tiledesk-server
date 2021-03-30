// var Trigger = require("../models/request");
var mongoose = require('mongoose');

var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
    // winston.info("XXXXXXXXXXXXXXXXXXXXXXXXXX triggers ");
 
    
    // db.getCollection('triggers').find({"conditions.all.path":"availableAgentsCount"})
    // return mongoose.connection.db.collection('triggers').updateOne({"conditions.all.path":"availableAgentsCount"},{ "$set": { "conditions.all.$.path": "snapshot.availableAgentsCount" } }, function (err, updates) {
      return mongoose.connection.db.collection('triggers').find(
        // {
          // "$or": [ 
          {"conditions.all.key":"request.availableAgentsCount"},
          // {"conditions.all.key":"availableAgentsCount"}
          // ]
        // }
        ).toArray( function (err, triggers) {
        if (err) {
          winston.error("Schema migration: triggers err", err);
        }
        winston.debug("found triggers", triggers);
        winston.debug("found triggers"+triggers.length);

        triggers.forEach( 
          function(trigger, i){ 
            winston.debug("trigger",trigger);
            return mongoose.connection.db.collection('triggers').updateOne({_id:trigger._id, "conditions.all.key":"request.availableAgentsCount"},{ "$set": {"conditions.all.$.key": "request.snapshot.availableAgentsCount" } }
            // {
            //   multi: true,
            //   arrayFilters: [ {"conditions.all.path":"availableAgentsCount"} ] 
            // }
            ,
             function (err, updates) {
            // return mongoose.connection.db.collection('triggers').updateMany({"conditions.all.path":"availableAgentsCount"},{ "$set": { "conditions.all.$[0].path": "snapshot.availableAgentsCount" } }, function (err, updates) {
            if (err) {
              winston.error("Schema migration: triggers err", err);  
            }
            // winston.info("Schema updated for " + updates.n Modified + " triggers ");
        });
      }); 
      winston.info("Schema updated key for triggers "+triggers.length);
       return resolve('ok'); 
    });  
    
  }); 
}

/**
 * Make any changes that UNDO the up function side effects here (if possible )
 */
async function down () { 
  // Write migration here
}

module.exports = { up, down };
 

// db.getCollection('triggers').find({"conditions.all.key":"request.availableAgentsCount"}).count() -> 479

// db.getCollection('triggers').find({"conditions.all.key":"request.snapshot.availableAgentsCount"}) -> 4

// db.getCollection('triggers').find({"conditions.all.path":"snapshot.availableAgentsCount"}).count() -> 481