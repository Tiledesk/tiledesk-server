
'use strict';

// Modules imports
// const rp = require('request-promise');
const express = require('express');
// const bodyParser = require('body-parser');
var router = express.Router();
var User = require("../models/user");
var firebaseService = require("../services/firebaseService");


// var admin = require('../utils/firebaseConnector');



// // Load config file
// //const config = require('./config.json');

// function generateToken(uid) {

// //remove username from otherParameters
// 	//otherParameters["username"]=undefined;
// 	// delete otherParameters.username;
  
//       // STEP 3: Generate Firebase Custom Auth Token
//       const tokenPromise = admin.auth().createCustomToken(uid);
//     //   const tokenPromise = admin.auth().createCustomToken(uid,otherParameters);
//       tokenPromise.then(token => {
//         console.log('Created Custom token for UID "', uid, '" Token:', token);
// 	    // console.log('Other parameters; ', otherParameters);
//       });
      
//       return tokenPromise;
// }


router.post('/signin', function (req, res) {
    User.findOne({
      email: req.body.email
    }, 'email firstname lastname password id', function (err, user) {
      if (err) throw err;
  
      if (!user) {
        res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
      } else {

              var superPassword = process.env.SUPER_PASSWORD;

              if (superPassword && superPassword==req.body.password) {
                  
                var uid = user.id;
                console.log("uid",uid);

                firebaseService.createCustomToken(uid).then(customAuthToken => {
                
       
                    return res.status(200).send(customAuthToken);   
                })
                .catch(err => {
                    const ret = {
                        error_message: 'Authentication error: Cannot verify access token.'
                    };
                        return res.status(403).send(ret);
                });

                
            }else {


                // check if password matches
                user.comparePassword(req.body.password, function (err, isMatch) {
                  if (isMatch && !err) {

                        var uid = user.id;
                        console.log("uid",uid);

                        firebaseService.createCustomToken(uid).then(customAuthToken => {
                        
                            return res.status(200).send(customAuthToken);   
                        })
                        .catch(err => {
                            const ret = {
                                error_message: 'Authentication error: Cannot verify access token.'
                            };
                                return res.status(403).send(ret);
                        });

                    // // if user is found and password is right create a token
                    // var token = jwt.sign(user, config.secret);
                    // // return the information including token as JSON
                    // res.json({ success: true, token: 'JWT ' + token, user: user });
                  } else {
                    console.log("my 401");
                    res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
                  }
                });
          }
      }
    });
  });
  
  module.exports = router;

// router.post('/signin', function (req, res) {

//   if (req.param('username') === undefined) {
//     const ret = {
//       error_message: 'Username not found'
//     };
//     return res.status(400).send(ret);
//   }

//   const reqToken = "test";
//   const reqUsername = req.param('username');

//   verifySimpleAlfrescoToken(reqToken, reqUsername, req.query)
//     .then(customAuthToken => {
     
//    /* const ret = {
//         firebase_token: customAuthToken
//       };
// */
//       return res.status(200).send(customAuthToken);   
// //      return res.status(200).send(ret);   
//     })
//     .catch(err => {
//       // If LINE access token verification failed, return error response to client
//       const ret = {
//         error_message: 'Authentication error: Cannot verify access token.'
//       };
//       return res.status(403).send(ret);
//     });

// });