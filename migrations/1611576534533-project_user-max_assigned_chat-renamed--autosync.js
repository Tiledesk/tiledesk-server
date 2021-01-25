var Project_user = require("../models/project_user");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);

    //https://github.com/Automattic/mongoose/issues/3171
    return Project_user.collection.updateMany({"max_served_chat":{$exists:true}}, { $rename: { "max_served_chat": "max_assigned_chat" } } , function (err, updates) {
      if (err) {
        winston.error("Schema updated project_user max_assigned_chat  error ",err);
        return reject(err);
      }
      winston.info("Schema updated for " + updates.nModified + " project_user max_assigned_chat field")
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
