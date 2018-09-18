var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Request = require("../models/request");
var Message = require("../models/message");
var emailService = require("../models/emailService");
var Project_userApi = require("../controllers/project_user");
var User = require("../models/user");
var Project = require("../models/project");
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;





router.post('/', function(req, res) {

  console.log("chat21 req.body", req.body);

  // console.log("req.projectid", req.projectid);
  // console.log("req.user.id", req.user.id);


  if (req.body.event_type == "first-message") {

    var message = req.body.data;
    console.log("chat21 message", message);

    var departmentid = message.attributes.departmentid;
    console.log("chat21 departmentid", departmentid);

    var sourcePage = message.attributes.sourcePage;
    console.log("chat21 sourcePage", sourcePage);

    var client = message.attributes.client;
    console.log("chat21 client", client);


    var projectid = message.projectid;
    console.log("chat21 projectid", projectid);

    

    var newRequest = new Request({
      requester_id: message.sender,
      requester_fullname: message.sender_fullname,
      first_text: message.text,
      // support_status: req.body.support_status,
      // partecipants: req.body.partecipants,
      departmentid: departmentid,
  
      // rating: req.body.rating,
      // rating_message: req.body.rating_message,
  
      // agents: req.body.agents,
      // availableAgents: req.body.availableAgents,
      // assigned_operator_id:  req.body.assigned_operator_id,
  
      //others
      sourcePage: sourcePage,
      language: message.language,
      userAgent: client,
  
      //standard
      id_project: projectid,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });
  
    newRequest.save(function(err, savedRequest) {
      if (err) {
        console.log('Error saving object.',err);
        return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
      }
  
  
      console.log("savedRequest",savedRequest);
      
      // console.log("XXXXXXXXXXXXXXXX");
      this.sendEmail(req.projectid, savedRequest);
       
      
  
      res.json(savedRequest);
      
    });

  } else {
    res.json("Not implemented");
  }

  

});













module.exports = router;
