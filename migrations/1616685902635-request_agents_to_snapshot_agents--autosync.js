var Request = require("../models/request");
var winston = require('../config/winston');
const request = require("../models/request");

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);
    return Request.find(
      {
        "snapshot.agents":  { $exists: false } ,
        "agents":  { $exists: true } ,
      })
      .lean()
      // .limit(20000)
      .exec(function(err, requests) {
    if (err) {
      winston.error("Schema migration: agents err", err);
      return reject(err);
    }
    requests.forEach( 
      function(request, i){ 
        winston.debug(request.agents,i);
        // console.log(request,i); 

        // request.snapshot.agents = request.agents;

        Request.findOneAndUpdate({_id: request._id}, {"$set": {"snapshot.agents":request.agents}}, {upsert: true}, function(err, doc) {
          if (err) {
            winston.error("Schema migration: label agents update err", err);              
          } 
          // winston.debug("ok",doc);
          // return resolve('ok');
        }); 


        // request.snapshot.agents = request.agents;
        // request.markModified('snapshot');
        // request.save(function(err, data) {
        //   console.log("Error",err);
        // });
      });

      winston.info("Updated request agents found: " + requests.length);
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
 