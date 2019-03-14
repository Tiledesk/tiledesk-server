'use strict';



//firestore
var firebaseConfig = require('../config/firebase');

var private_key = process.env.FIREBASE_PRIVATE_KEY;
var client_email = process.env.FIREBASE_CLIENT_EMAIL;
var firebase_project_id = process.env.FIREBASE_PROJECT_ID;

// https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit
var serviceAccount;

if (!private_key || !client_email) {
  serviceAccount = require('../config/.firebase-key/key.json');
  console.log('FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL not specified, falling back to serviceAccountFromKey.');
}else {
    serviceAccount = {
        "private_key": private_key.replace(/\\n/g, '\n'),
        "client_email": client_email,
        "project_id": firebase_project_id,
      };
}

const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL
});

//var firestore = admin.firestore();
//end firestore



module.exports = admin;
