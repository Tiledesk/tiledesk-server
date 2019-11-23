// var path = require('path');

var admin = require('./firebaseConnector');
// var admin = require('tiledesk-chat21-app');
// var admin = require('@tiledesk/tiledesk-chat21-app').firebaseConnector;


var winston = require('../../config/winston');

class FirebaseService {

    createCustomToken(uid) {

        return new Promise(function (resolve, reject) {          
            winston.debug("createCustomToken for uid", uid);
              // STEP 3: Generate Firebase Custom Auth Token
              const tokenPromise = admin.auth().createCustomToken(uid);
              return tokenPromise.then(token => {
                // winston.debug('Created Custom token for UID "', uid, '" Token:', token);
                return resolve(token);
              });
              
        });
    }

    createCustomTokenWithAttribute(uid, customAttributes) {

      return new Promise(function (resolve, reject) {          
          winston.debug("createCustomToken for uid", uid, " and customAttributes : ",customAttributes);
            // STEP 3: Generate Firebase Custom Auth Token
            const tokenPromise = admin.auth().createCustomToken(uid, customAttributes);
          //   const tokenPromise = admin.auth().createCustomToken(uid,otherParameters);
            return tokenPromise.then(token => {
              // winston.debug('Created Custom token for UID "', uid, '" Token:', token);
              return resolve(token);
            });
            
      });
  }


}

var firebaseService = new FirebaseService();


module.exports = firebaseService;