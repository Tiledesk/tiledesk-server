var admin = require('./firebaseConnector');


var winston = require('../../config/winston');

class FirebaseService {

    createCustomToken(uid) {

        return new Promise(function (resolve, reject) {          
            winston.debug("createCustomToken for uid", uid);
              const tokenPromise = admin.auth().createCustomToken(uid);
              return tokenPromise.then(token => {
                winston.debug('Created Custom token for UID "', uid, '" Token:', token);
                return resolve(token);
              });
              
        });
    }

    createCustomTokenWithAttribute(uid, customAttributes) {

      return new Promise(function (resolve, reject) {          
          winston.debug("createCustomToken for uid", uid, " and customAttributes : ",customAttributes);
            const tokenPromise = admin.auth().createCustomToken(uid, customAttributes);
            return tokenPromise.then(token => {
              winston.debug('Created Custom token for UID "', uid, '" Token:', token);
              return resolve(token);
            });
            
      });
  }


}

var firebaseService = new FirebaseService();


module.exports = firebaseService;