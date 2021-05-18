var mongoose = require('mongoose');
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 */
async function up () { 
  // Write migration here 
  await new Promise((resolve, reject) => {

  winston.info("Duplicate");


  return mongoose.connection.db.collection('requests').aggregate(
    {"$group" : { "_id": "$request_id", "count": { "$sum": 1 } } },
    {"$match": {"_id" :{ "$ne" : null }, "count" : {"$gt": 1} } }, //"duplicated_request_id":{"$ne":true} 
    {"$sort": {"count" : -1} },
    {"$project": {"request_id" : "$_id", "_id" : 0} }
  ).toArray( function (err, requests) {
    if (err) {
      winston.error("Schema migration: requests err", err);
    }

    winston.info("found requests", requests);
    winston.info("found requests.length"+requests.length);
 
    
    requests.forEach(   
      function(request, i){ 

        winston.info("request",request); 
        winston.info("request._id: " + request._id); 
        

        return mongoose.connection.db.collection('requests')
          //.findOne({request_id:request._id},
          // ,"id_project": request.id_project+"_deleted", 
          .updateOne({request_id:request._id},{ "$set": { "request_id": request._id+"_duplicated", "duplicated_request_id":true } },
          function (err, updates) {          
            if (err) {
              winston.error("Schema migration: requests err", err);  
            } 
            winston.info("updates",updates); 
          });
         
      });
      


      winston.info("Schema updated path for requests "+requests.length);
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


