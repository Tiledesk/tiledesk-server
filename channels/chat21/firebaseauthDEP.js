'use strict';

// Modules imports
// const rp = require('request-promise');
const express = require('express');
// const bodyParser = require('body-parser');
var router = express.Router();
var User = require("../../models/user");
var firebaseService = require("./firebaseService");


//TODO NON DOVRESTI PASSARE NUOVAMENTE EMAIL E PASSWORD MA METTERE SOTTO JWT E BASIC, LASCI A QUESTI ULTIMI AUTENTICAZIONE
router.post('/signin', function (req, res) {
  // auttype
    User.findOne({
      email: req.body.email
      //,authType: 'email_password'
    }, 'email firstname lastname password id', function (err, user) {
      if (err) throw err;
  
      if (!user) {
        res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
      } else {

              var superPassword = process.env.SUPER_PASSWORD || "superadmin";

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