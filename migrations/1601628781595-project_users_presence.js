let Project_user = require("../models/project_user");
let winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);
    return Project_user.updateMany({}, {"$set": {presence: {status: "offline", changedAt: new Date()}}}, function (err, updates) {
      winston.info("Schema updated for " + updates.nModified + " project_user")
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
  