
'use strict';

const express = require('express');
let router = express.Router();
let firebaseService = require("./firebaseService");
let winston = require('../../config/winston');



router.post('/createCustomToken', function (req, res) {
        // let uid = req.projectid + '-' + req.user.id;
        let uid = req.user.id;
        winston.debug("uid",uid);

        firebaseService.createCustomToken(uid).then(customAuthToken => {
        
            return res.status(200).send(customAuthToken);   
        })
        .catch(err => {
            const ret = {
                error_message: 'Authentication error: Cannot verify access token.',
                err: err
            };
                return res.status(403).send(ret);
        });
                 
  });
 
  


  module.exports = router;

