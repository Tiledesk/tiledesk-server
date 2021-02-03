var Label = require("../models/label");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 * ./node_modules/.bin/migrate create message-channel_type-and-channel-fields-added--autosync
 */
async function up () {
  await new Promise((resolve, reject) => {
                  
    Label.find( 
      {
        // "data.data.WAITING_TIME_FOUND":  { $exists: true } 
      }, function(err, labels) {
      if (err) {
        winston.error("Schema migration: label WAITING_TIME_FOUND err", err);
        return reject(err);
      }
      labels.forEach(
        function(label, i){ 
          // console.log(label,i); 
          label.data.forEach(function(data, i) { 
            // console.log(data,i); 
            data.data.WAITING_TIME_FOUND = data.data.WAITING_TIME_FOUND + " $reply_time";
          });
          // console.log("after",JSON.stringify(label),i); 
          Label.findOneAndUpdate({_id: label.id}, label, {upsert: true}, function(err, doc) {
            if (err) {
              winston.error("Schema migration: label WAITING_TIME_FOUND update err", err);
            } else {
              //ok
            }
          });
          // label.markModified('data');
          // // label.save();  
          // label.update();
          // e.name='Big ';
          // Label.collection.save(e);
        }
     )

     winston.info("Schema updated label WAITING_TIME_FOUND  update")

    
     return resolve("ok"); 
    });
  

    // Label.updateMany({"data.data.WAITING_TIME_FOUND":  { $exists: true } }, [{ $set: { "data.data.WAITING_TIME_FOUND": { $concat: [ "$data.data.$WAITING_TIME_FOUND", " $reply_time" ] } } }], function (err, updates) {
    //   // Label.updateMany({"data.data.WAITING_TIME_FOUND":  { $exists: true } }, [{ $set: { "data.$[].data.WAITING_TIME_FOUND": { $concat: [ "$wt", " $reply_time" ] } } }], function (err, updates) {
    //   if (err) {  
    //     winston.error("Schema migration: label WAITING_TIME_FOUND err", err);
    //   } 
    //   winston.info("Schema updated for " + updates.nModified + " label WAITING_TIME_FOUND")
    //       return resolve('ok');  
    // });  
    
  
       
  });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () { 
  // Write migration here
}

module.exports = { up, down };
  