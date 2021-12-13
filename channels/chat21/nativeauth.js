
'use strict';

const express = require('express');
var router = express.Router();
var winston = require('../../config/winston');
const uuidv4 = require('uuid/v4');
const jwt = require("jsonwebtoken")

const MaskData = require("maskdata");

const maskPhoneOptions = {
  // Character to mask the data. default value is '*'
  maskWith : "*",
  // If the starting 'n' digits needs to be unmasked
  // Default value is 4
  unmaskedStartDigits : 3, //Should be positive Integer
  //If the ending 'n' digits needs to be unmasked
  // Default value is 1
  unmaskedEndDigits : 3 // Should be positive Integer
  };


const jwtSecret = process.env.CHAT21_JWT_SECRET || "tokenKey";

const masked_jwtSecret = MaskData.maskPhone(jwtSecret, maskPhoneOptions);


winston.info("Chat21 Native channel jwtSecret: "+ masked_jwtSecret);



router.post('/createCustomToken', function (req, res) {

        var userid = req.user.id;
        winston.debug("userid",userid);

        var user = req.user;

        const appid = "tilechat";

        const scope = [
            `rabbitmq.read:*/*/apps.${appid}.users.${userid}.*`,
            `rabbitmq.write:*/*/apps.${appid}.users.${userid}.*`,
            `rabbitmq.write:*/*/apps.${appid}.outgoing.users.${userid}.*`,
            'rabbitmq.configure:*/*/*'
        ]
    
        const now = Math.round(new Date().getTime()/1000);
        // console.log("now: ", now)
        const exp = now + 60 * 60 * 24 * 30;

        var payload = {
            "jti": uuidv4(),
            "sub": user._id,
            scope: scope,
            "client_id": user._id, //"rabbit_client", SEMBRA SIA QUESTO LO USER-ID
            "cid": user._id, //"rabbit_client",
            "azp": user._id, //"rabbit_client",
            // "grant_type": "password", //"password", // client_credentials // REMOVED 2
            "user_id": user._id,
            "app_id": appid,
            // "origin": "uaa", // REMOVED 2
            // "user_name": user._id, // REMOVED 2
            // "email": user.email,
            // "auth_time": now, // REMOVED 2
            // "rev_sig": "d5cf8503",
            "iat": now,
            "exp": exp, // IF REMOVED TOKEN NEVER EXPIRES?
            // "iss": "http://localhost:8080/uaa/oauth/token", // REMOVED 2
            // "zid": "uaa", // REMOVED 2
            "aud": [
                "rabbitmq",
                user._id
            ],
            // "jku": "https://localhost:8080/uaa/token_keys", // REMOVED 2
            "kid": "tiledesk-key", //"legacy-token-key",
            "tiledesk_api_roles": "user"
        }
        winston.debug("payload:\n", payload)
        var token = jwt.sign(
            payload,
            jwtSecret,
            {
                "algorithm": "HS256"
            }
        );
        const result = {
            userid: user._id,
            fullname: user.fullName,
            firstname: user.firstname,
            lastname: user.lastname,
            token: token
        }
        return res.status(200).send(result);   


  });
 


  module.exports = router;

