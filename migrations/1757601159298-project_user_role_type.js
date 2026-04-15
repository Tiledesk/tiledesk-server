var Project_user = require("../models/project_user");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  let p = await Project_user.find({}).exec()
  // Write migration here
  await new Promise((resolve, reject) => {
     Project_user.updateMany({"$or":[{ "role": "agent" }, { "role": "supervisor" }, { "role":  "admin" }, { "role": "owner" }]}, {"$set": {"roleType": 1 }}, function (err, updates) {
      if (err) {
        winston.error("Error appling the migration script", err);
      }
      winston.info("Schema updated for " + updates.nModified + " project_user of type agents")
      winston.debug("updates",updates)      
      //  return resolve('ok'); 
    });  

     return Project_user.updateMany({"$or":[{ "role": "user" }, { "role": "guest" }]}, {"$set": {"roleType": 2 }}, function (err, updates) {
          if (err) {
            winston.error("Error appling the migration script", err);
          }
          winston.info("Schema updated for " + updates.nModified + " project_user of type user"),
          winston.debug("updates",updates)
           return resolve('ok'); 
        });  
    
  
  });
     
 
} 
  
/** 
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  
  // Write migration here
  // console.log("down*********");
}

module.exports = { up, down }; 
  