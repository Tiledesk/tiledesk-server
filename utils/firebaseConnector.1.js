'use strict';



//firestore
var firebaseConfig = require('../config/firebase');


var Setting = require('../models/setting');
const admin = require('firebase-admin');



// https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit
var serviceAccount;

try {
  var firebaseConfigKey = require('../config/.firebase-key/key.json');
  if (firebaseConfigKey) {
    serviceAccount = firebaseConfigKey;
    console.log('FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL not specified, falling back to serviceAccountFromKey.',serviceAccount);
  }
} catch(e) {
  console.error("firebaseConfigKey not found");
}

var private_key = process.env.FIREBASE_PRIVATE_KEY;
var client_email = process.env.FIREBASE_CLIENT_EMAIL;
var firebase_project_id = process.env.FIREBASE_PROJECT_ID;
if (private_key && client_email && firebase_project_id) {

  serviceAccount = {
    "private_key": private_key.replace(/\\n/g, '\n'),
    "client_email": client_email,
    "project_id": firebase_project_id,
  };

} 



// const settingQuery = Setting.findOne({});
// const setting = await Setting.findOne({});

// let getSettingFromDb = async function() {
//   let settingFromDb = await Setting.findOne({});
//   console.log("settingFromDb", settingFromDb);
//   return settingFromDb;
  // Setting.findOne({}, function (err, setting) {
    // if (err) {
    //   console.error(err);
    // }
    // if (!setting) {
    //   console.log("setting doesnt exist. Creare it from serviceAccount", setting);
    //       var setting = new Setting({firebase: {private_key: serviceAccount.private_key, client_email: serviceAccount.client_email, project_id: serviceAccount.project_id}})
    //       setting.save(function(err, ssetting) {
    //         if (err) {
    //           console.error('Error saving ssetting ', err);
    //         }else {
    //           console.error('ssetting saved', ssetting)
    //         }
    //       });
    // } else {
    //   console.log("setting", setting);
    //   serviceAccount = setting.firebase;
  
  
   
    // }
    
  // });
// }





// let sdb = getSettingFromDb();
// console.log("sdb", sdb);





// admin.initializeApp(functions.config().firebase);

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseConfig.databaseURL
  });
}else {
  console.error("firebase not inizialized");
}


//var firestore = admin.firestore();
//end firestore



module.exports = admin;
