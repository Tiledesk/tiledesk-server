var Project_user = require("../models/project_user");

/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await new Promise((resolve, reject) => {
    // setTimeout(()=> { resolve('ok'); }, 3000);
    return Project_user.updateMany({}, {"$set": {presence: {status: "offline", lastOfflineAt: new Date()}}}, function (err, updatedProject_user) {
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
 