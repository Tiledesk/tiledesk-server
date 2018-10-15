var admin = require('../utils/firebaseConnector');

class FirebaseService {

    createCustomToken(uid) {

        return new Promise(function (resolve, reject) {
          
              // STEP 3: Generate Firebase Custom Auth Token
              const tokenPromise = admin.auth().createCustomToken(uid);
            //   const tokenPromise = admin.auth().createCustomToken(uid,otherParameters);
              return tokenPromise.then(token => {
                // console.log('Created Custom token for UID "', uid, '" Token:', token);
                return resolve(token);
              });
              
        });
    }

}

var firebaseService = new FirebaseService();


module.exports = firebaseService;