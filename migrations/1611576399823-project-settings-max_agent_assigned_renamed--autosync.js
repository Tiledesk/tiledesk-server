var Project = require("../models/project");
var winston = require('../config/winston');

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);
    return Project.updateMany({}, { $rename: { "settings.max_agent_served_chat": "settings.max_agent_assigned_chat" } } , function (err, updates) {
      winston.info("Schema updated for " + updates.nModified + " project.settings max_assigned_chat field")
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
 