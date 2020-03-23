
'use strict';

// Modules imports
const express = require('express');
var router = express.Router();
const NodeRSA = require('node-rsa');
const Project = require('../models/project');
const uuidv4 = require('uuid/v4');
var winston = require('../config/winston');

// curl -v -X POST -u andrea.leo@f21.it:123456 http://localhost:3000/5bae41325f03b900401e39e8/keys/generate
router.post('/generate', function (req, res) {

    winston.debug('req.projectid', req.projectid);

    // const key = new NodeRSA();
    // const key = new NodeRSA({b: 512});
    const key = new NodeRSA({b: 256});
    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');

    const jwtSecret = uuidv4();
   
    winston.debug('publicKey', publicKey);
    winston.debug('privateKey', privateKey);
    winston.debug('jwtSecret', jwtSecret);

    

    var update = {
        publicKey: publicKey, 
        privateKey: privateKey,
        jwtSecret: jwtSecret
    };
    winston.debug('update', update);

    return Project.findOneAndUpdate({_id: req.projectid, status:100}, update, { new: true, upsert: false }, function (err, updatedProject) {
        if (err) {
            winston.error('Error updating project key', err);
            return res.status(500).send({ success: false, msg: 'Error updating project key.' });
        }
        
        winston.debug('updatedProject', updatedProject);

        if (!updatedProject) {
            return res.status(404).send({ success: false, msg: 'Project not found' });
        }
        else {
            return res.json({publicKey: publicKey, privateKey: privateKey,jwtSecret: jwtSecret });
        }
     });
        

   


  });
  module.exports = router;