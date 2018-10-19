
'use strict';

// Modules imports
const express = require('express');
var router = express.Router();
var config = require('../config/database'); 
var jwt = require('jsonwebtoken');
var validtoken = require('../middleware/valid-token');
var secret = process.env.SECRET || config.secret;
var requestUtil = require('../utils/requestUtil');
var Project = require('../models/project');


router.post('/decode', validtoken, function (req, res) {

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
        return res.status(404).send({ success: false, msg: 'Project hasnt  a publicKey' });
    }


        try {
          console.log("requestUtil", requestUtil);
            var token = requestUtil.getToken(req.headers);
            console.log("token", token);
            // verify a token symmetric - synchronous
            // var decoded = jwt.verify(token, secret);
            var decoded = jwt.verify(token, project.jwtSecret);
            
            console.log("decoded", decoded);
      
            return res.json({decoded: decoded});
          
    
        } catch(err) {
            console.error("myerror", err);
            return res.status(401).send({ success: false, msg: 'Authentication failed', err: err });
        }  

    });
    


  });
  module.exports = router;