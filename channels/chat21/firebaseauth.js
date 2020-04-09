
'use strict';

// Modules imports
// const rp = require('request-promise');
const express = require('express');
// const bodyParser = require('body-parser');
var router = express.Router();
var firebaseService = require("./firebaseService");
var winston = require('../../config/winston');



router.post('/createCustomToken', function (req, res) {
                    
              
        var uid = req.user.id;
        winston.debug("uid",uid);

        firebaseService.createCustomToken(uid).then(customAuthToken => {
        
            return res.status(200).send(customAuthToken);   
        })
        .catch(err => {
            const ret = {
                error_message: 'Authentication error: Cannot verify access token.'
            };
                return res.status(403).send(ret);
        });
                 
  });
 
  


  module.exports = router;

