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

  console.log("req.projectid", req.projectid);
  console.log("req.user.id", req.user.id);



  // var newRequest = new Request({
  //   requester_id: req.body.requester_id,
  //   requester_fullname: req.body.requester_fullname,
  //   first_text: req.body.first_text,
  //   support_status: req.body.support_status,
  //   partecipants: req.body.partecipants,
  //   departmentid: req.body.departmentid,

  //   // recipient: req.body.recipient,
  //   // recipientFullname: req.body.recipient_fullname,
  //   // sender: req.body.sender,
  //   // senderFullname: req.body.sender_fullname,
  //   // first_message: first_message,

  //   rating: req.body.rating,
  //   rating_message: req.body.rating_message,

  //   agents: req.body.agents,
  //   availableAgents: req.body.availableAgents,
  //   assigned_operator_id:  req.body.assigned_operator_id,

  //   //others
  //   sourcePage: req.body.sourcePage,
  //   language: req.body.language,
  //   userAgent: req.body.userAgent,

  //   //standard
  //   id_project: req.projectid,
  //   createdBy: req.user.id,
  //   updatedBy: req.user.id
  // });

  // newRequest.save(function(err, savedRequest) {
  //   if (err) {
  //     console.log('Error saving object.',err);
  //     return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
  //   }


  //   console.log("savedRequest",savedRequest);
    
  //   // console.log("XXXXXXXXXXXXXXXX");
  //   this.sendEmail(req.projectid, savedRequest);
     
    

  //   res.json(savedRequest);
    
  // });

  res.json("savedRequest");
});













module.exports = router;
