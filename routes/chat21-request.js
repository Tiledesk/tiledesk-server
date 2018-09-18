var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Request = require("../models/request");
var Message = require("../models/message");
var requestservice = require('../models/requestService');
var Project_userApi = require("../controllers/project_user");
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;





router.post('/', function(req, res) {

  console.log("chat21 req.body", req.body);

  // console.log("req.projectid", req.projectid);
  // console.log("req.user.id", req.user.id);

// curl -X POST -H 'Content-Type:application/json'  -d '{"event_type": "first-message", "data":{"sender":"sender", "sender_fullname": "sender_fullname", "text":"text", "projectid":"5ad5bd52c975820014ba900a", "attributes": {"departmentId":"5b8eb4955ca4d300141fb2cc"}}}' http://localhost:3000/chat21/requests
  if (req.body.event_type == "first-message") {

    var message = req.body.data;
    console.log("chat21 message", message);

    var departmentid = "default";

    var sourcePage;
    var client;
    var language;

    if (message.attributes) {

      departmentid = message.attributes.departmentId;
      console.log("chat21 departmentid", departmentid);

      sourcePage = message.attributes.sourcePage;
      console.log("chat21 sourcePage", sourcePage);
      
      client = message.attributes.client;
      console.log("chat21 client", client);
  
      language = message.attributes.language;
      console.log("chat21 language", language);
    }
    

    var projectid = message.projectid;
    console.log("chat21 projectid", projectid);

    requestservice.create(message.recipient, message.sender_fullname, projectid, message.text, departmentid, sourcePage, language, client).then(function (result) {
      res.json(result);
    });

    // var newRequest = new Request({
    //   requester_id: message.sender,
    //   requester_fullname: message.sender_fullname,
    //   first_text: message.text,
    //   // support_status: req.body.support_status,
    //   // partecipants: req.body.partecipants,
    //   departmentid: departmentid,
    //   first_message: message,
  
    //   // rating: req.body.rating,
    //   // rating_message: req.body.rating_message,
  
    //   // agents: req.body.agents,
    //   // availableAgents: req.body.availableAgents,
    //   // assigned_operator_id:  req.body.assigned_operator_id,
  
    //   //others
    //   sourcePage: sourcePage,
    //   language: message.language,
    //   userAgent: client,
  
    //   //standard
    //   id_project: projectid,
    //   createdBy: "system",
    //   updatedBy: "system"
    // });
  
    // console.log("newRequest",newRequest);

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





  } else if (req.body.event_type == "new-message") {

    console.log("new-message","new-message");

    var message = req.body.data;
    console.log("chat21 message", message);


    var projectid = message.projectid;
    console.log("chat21 projectid", projectid);

    

    var newMessage = new Message({
      sender: message.sender,
      senderFullname: message.sender_fullname,
      recipient: message.recipient,
      recipientFullname: message.recipient_fullname,
      text: message.text,
      id_project: projectid,
      createdBy: "system",
      updatedBy: "system"
    });
  
    console.log("newMessage", newMessage);


    newMessage.save(function(err, savedMessage) {
      if (err) {
        console.log(err);
  
        return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
      }
      res.json(savedMessage);
    });


  } else {
    res.json("Not implemented");
  }

  

});













module.exports = router;
