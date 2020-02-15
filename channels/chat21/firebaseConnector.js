'use strict';

var winston = require('../../config/winston');

var chat21Enabled = process.env.CHAT21_ENABLED;
winston.debug("chat21Enabled: "+chat21Enabled);

if (chat21Enabled && chat21Enabled == "true"){
  // if (chat21Enabled){

      //firestore
      winston.info("chat21 channel enabled"); 
      var firebaseConfig = require('./firebaseConfig');

      var firebaseConfigFilePath = process.env.FIREBASE_CONFIG_FILE || '../../.firebasekey.json';

      winston.info('firebaseConnector firebaseConfig.databaseURL:'+ firebaseConfig.databaseUrl);

      var private_key = process.env.FIREBASE_PRIVATE_KEY;
      winston.info('firebaseConnector private_key:'+ private_key);
      var client_email = process.env.FIREBASE_CLIENT_EMAIL;
      winston.info('firebaseConnector client_email:'+ client_email);
      var firebase_project_id = process.env.FIREBASE_PROJECT_ID;
      winston.info('firebaseConnector firebase_project_id:'+ firebase_project_id);

      // https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit
      var serviceAccount;

      if (!private_key || !client_email) {
        serviceAccount = require(firebaseConfigFilePath);
        winston.debug('FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL not specified, falling back to serviceAccountFromKey from path',firebaseConfigFilePath, serviceAccount);
      }else {
          serviceAccount = {
              "private_key": private_key.replace(/\\n/g, '\n'),
              "client_email": client_email,
              "project_id": firebase_project_id,
            };
            winston.debug('firebase serviceAccount from env', serviceAccount);
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

          
}else { 
  winston.info("chat21 channel disabled"); 
  module.exports = undefined;
}
