
'use strict';

// Modules imports
const express = require('express');
var router = express.Router();
var firebaseService = require("../services/firebaseService");
// var config = require('../config/database'); 
var jwt = require('jsonwebtoken');
var validtoken = require('../middleware/valid-token');
// var secret = process.env.SECRET || config.secret;
var requestUtil = require('../utils/requestUtil');
var Project = require('../models/project');

router.post('/createtoken', validtoken, function (req, res) {

    // var project_id = req.query.project_id;

    // console.log("project_id", project_id);

    // if (!project_id) {
    //     console.error("project_id parameter is required");
    //     res.status(400).send({ success: false, msg: "project_id parameter is required" });
    // }

    return Project.findById(req.projectid, '+jwtSecret',function(err, project) {
        if (err) {
          console.error('Error finding project', err);
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
                // verify a token symmetric - synchronous
                var decoded = jwt.verify(token, project.jwtSecret);
                console.log("decoded", decoded);
        
                // var email = decoded.email;
                var extuid = decoded.external_id;
                console.log("extuid", extuid);

            } catch(err) {
                console.error("myerror", err);
                res.status(401).send({ success: false, msg: 'Authentication failed', err: err });
            }

        

                var firebaseuid = req.projectid + '_' + extuid;
                console.log("firebaseuid", firebaseuid);

                firebaseService.createCustomToken(firebaseuid).then(customAuthToken => {
                

                    return res.json({firebaseToken: customAuthToken});   
                })
                .catch(err => {
                    console.error("err", err);
                    const ret = {
                        error_message: 'Authentication error: Cannot verify access token.'
                    };
                        return res.status(403).send(ret);
                });
                

    });

    
    
  


  });

// router.post('/createtoken', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
//     console.log("req.user.id", req.user.id);
//     User.findById(req.user.id, 'email firstname lastname  id', function (err, user) {
//         console.log("err", err);
//       if (err) throw err;
  
//       if (!user) {
//         res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
//       } else {


                  
//                 var uid = user.id;
//                 console.log("uid",uid);

//                 firebaseService.createCustomToken(uid).then(customAuthToken => {
                
       
//                     return res.status(200).send(customAuthToken);   
//                 })
//                 .catch(err => {
//                     const ret = {
//                         error_message: 'Authentication error: Cannot verify access token.'
//                     };
//                         return res.status(403).send(ret);
//                 });
          
//       }
//     });
//   });
  
  module.exports = router;