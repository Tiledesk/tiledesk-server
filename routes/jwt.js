
'use strict';

// Modules imports
const express = require('express');
var router = express.Router();
var config = require('../config/database'); 
var jwt = require('jsonwebtoken');
var validtoken = require('../middleware/valid-token');
// var secret = process.env.SECRET || config.secret;
var requestUtil = require('../utils/requestUtil');
var Project = require('../models/project');
var winston = require('../config/winston');


router.post('/decode', validtoken, function (req, res) {

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
          console.log("requestUtil", requestUtil);
            var token = requestUtil.getToken(req.headers);


            console.log("token", token);
            // verify a token symmetric - synchronous
            var decoded = jwt.verify(token, project.jwtSecret);
            
            console.log("decoded", decoded);
      

            if(!decoded.iat ) {                  
                console.log("token.iat is required");
                return res.status(401).send({ success: false, msg: 'Authentication failed. Token iat is required'});
            }
            if(!decoded.exp ) {                  
                console.log("token.exp is required");
                return res.status(401).send({ success: false, msg: 'Authentication failed. Token exp is required'});
            }
            if(decoded.exp - decoded.iat  > 600  ) {                  
                console.log("The value of exp is permitted to be up to a maximum of 10 minutes from the iat value");
                return res.status(401).send({ success: false, msg: 'Authentication failed. The value of exp is permitted to be up to a maximum of 10 minutes from the iat value'});
            }


            return res.json({decoded: decoded});
          
    
        } catch(err) {
            winston.error("Authentication failed", err);
            return res.status(401).send({ success: false, msg: 'Authentication failed', err: err });
        }  

    });
    
  
  });

  router.post('/generatetestjwt', validtoken, function (req, res) {
    
    console.log("req.body", req.body);

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

        var token = jwt.sign(req.body, project.jwtSecret,{ expiresIn: 300 });
        // var token = jwt.sign(req.body, project.jwtSecret);


     
        res.json({ success: true, token: 'JWT ' + token });
    });

  });


  module.exports = router;