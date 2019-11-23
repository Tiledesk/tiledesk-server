
'use strict';

// Modules imports
const express = require('express');
var router = express.Router();
var firebaseService = require("./firebaseService");
// var config = require('../config/database'); 
var jwt = require('jsonwebtoken');
var validtoken = require('../../middleware/valid-token');
// var secret = process.env.SECRET || config.secret;
var requestUtil = require('../../utils/requestUtil');
var Project = require('../../models/project');
var winston = require('../../config/winston');

router.post('/createtoken', validtoken, function (req, res) {

    // var project_id = req.query.project_id;

    // console.log("project_id", project_id);

    // if (!project_id) {
    //     winston.error("project_id parameter is required");
    //     res.status(400).send({ success: false, msg: "project_id parameter is required" });
    // }

    return Project.findById(req.projectid, '+jwtSecret',function(err, project) {
        if (err) {
          winston.error('Error finding project', err);
          return res.status(500).send({ success: false, msg: 'Error finding project.' });
       }
      
        console.log('project', project);
  
        if (!project) {
            return res.status(404).send({ success: false, msg: 'Project not found' });
        }
  
        if (!project.jwtSecret) {
          return res.status(404).send({ success: false, msg: 'Project hasnt  a jwtSecret' });
      }


            try {
                var token = requestUtil.getToken(req.headers);

              


                console.log("token", token);

                console.log("project.jwtSecret",  project.jwtSecret);
               
                // verify a token symmetric - synchronous
                var decoded = jwt.verify(token, project.jwtSecret);
                console.log("decoded", decoded);
        
                if(!decoded.iat ) {                  
                    console.log("token.iat is required");
                    return res.status(401).send({ success: false, msg: 'Authentication failed. Token iat is required' });
                }
                if(!decoded.exp ) {                  
                    console.log("token.exp is required");
                    return res.status(401).send({ success: false, msg: 'Authentication failed. Token exp is required' });
                }
                if(decoded.exp - decoded.iat  > 600  ) {                  
                    console.log("The value of exp is permitted to be up to a maximum of 10 minutes from the iat value");
                    return res.status(401).send({ success: false, msg: 'Authentication failed. The value of exp is permitted to be up to a maximum of 10 minutes from the iat value'});
                }


               

                // //iat is in second
                // if(decoded.iat  && decoded.iat + 300 > new Date()) {                  
                //     console.log("token.exp is null and token.iat +300 is expired");
                //     return res.status(401).send({ success: false, msg: 'Authentication failed. Token expired', err: err });
                // }

                

                // var email = decoded.email;
                var extuid = decoded.external_id;
                console.log("extuid", extuid);

            } catch(err) {
                winston.error("myerror", err);
                res.status(401).send({ success: false, msg: 'Authentication failed', err: err });
            }

        

                var firebaseuid = req.projectid + '_' + extuid;
                console.log("firebaseuid", firebaseuid);

                //evict JWT conflict *******If a reserved OIDC claim name is used (sub, iat, iss, etc), an error is thrown.******
                //https://firebase.google.com/docs/reference/admin/node/admin.auth.Auth#setCustomUserClaims
                // Sets additional developer claims on an existing user identified by the provided uid, typically used to define user roles and levels of access. These claims should propagate to all devices where the user is already signed in (after token expiration or when token refresh is forced) and the next time the user signs in. 
                // *******If a reserved OIDC claim name is used (sub, iat, iss, etc), an error is thrown.****** They are set on the authenticated user's ID token JWT.
                var customAttr =  {decoded: decoded};
                //
                firebaseService.createCustomTokenWithAttribute(firebaseuid,customAttr).then(customAuthToken => {
                

                    return res.json({firebaseToken: customAuthToken});   
                })
                .catch(err => {
                    winston.error("err", err);
                    const ret = {
                        error_message: 'Authentication error: Cannot verify access token.'
                    };
                        return res.status(403).send(ret);
                });
                

    });

    
    
  


  });

  
  module.exports = router;