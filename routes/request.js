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
var moment = require('moment');




router.post('/', function (req, res) {

  console.log("req.body", req.body);

  console.log("req.projectid", req.projectid);
  console.log("req.user.id", req.user.id);


  // var first_message = new Message({
  //   sender: req.body.requester_id,
  //   senderFullname: req.body.requester_fullname,
  //   recipient: req.body.first_message.recipient,
  //   recipientFullname: req.body.first_message.recipient_fullname,
  //   text: req.body.first_message.text,
  //   id_project: req.projectid,
  //   createdBy: req.user.id,
  //   updatedBy: req.user.id
  // });

  var newRequest = new Request({
    requester_id: req.body.requester_id,
    requester_fullname: req.body.requester_fullname,
    first_text: req.body.first_text,
    //    status: req.body.status,
    support_status: req.body.support_status,

    partecipants: req.body.partecipants,
    departmentid: req.body.departmentid,

    // recipient: req.body.recipient,
    // recipientFullname: req.body.recipient_fullname,
    // sender: req.body.sender,
    // senderFullname: req.body.sender_fullname,
    // first_message: first_message,

    rating: req.body.rating,
    rating_message: req.body.rating_message,

    agents: req.body.agents,
    availableAgents: req.body.availableAgents,
    assigned_operator_id: req.body.assigned_operator_id,

    //others
    sourcePage: req.body.sourcePage,
    language: req.body.language,
    userAgent: req.body.userAgent,

    //standard
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  return newRequest.save(function (err, savedRequest) {
    if (err) {
      console.log('Error saving object.', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.', err: err });
    }


    console.log("savedRequest", savedRequest);

    // console.log("XXXXXXXXXXXXXXXX");
    this.sendEmail(req.projectid, savedRequest);



    return res.json(savedRequest);

  });
});



router.patch('/:requestid', function (req, res) {
  console.log(req.body);
  // const update = _.assign({ "updatedAt": new Date() }, req.body);
  const update = req.body;
  console.log(update);

  // Request.update({_id  : ObjectId(req.params.requestid)}, {$set: update}, {new: true, upsert:false}, function(err, updatedMessage) {

  return Request.findByIdAndUpdate(req.params.requestid, { $set: update }, { new: true, upsert: false }, function (err, updatedMessage) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    return res.json(updatedMessage);
  });

});





router.get('/', function (req, res, next) {

  console.log("req projectid", req.projectid);
  console.log("rreq.query.sort", req.query.sort);
  console.log('REQUEST ROUTE - QUERY ', req.query)

  var query = { "id_project": req.projectid };

  if (req.query.dept_id) {
    query.departmentid = req.query.dept_id;
    console.log('REQUEST ROUTE - QUERY DEPT ID', query.departmentid)
  }

  if (req.query.start_date && req.query.end_date) {
    console.log('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date)
    console.log('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date)
    // query.createdAt = { $gte : new Date((new Date().getTime() - (7 * 24 * 60 * 60 * 1000))) }}
    //  { $gte : new Date(req.query.start_date) },


    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }

    /**
     * USING EPOC    */
    // var startDateutcSeconds = +req.query.start_date;
    // var d = new Date(0);
    // var formattedStartDate = d.setUTCSeconds(startDateutcSeconds);

    /**
     * USING MOMENT      */
    var formattedStartDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
    var formattedEndDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
    query.createdAt = { $gte: new Date(Date.parse(formattedStartDate)).toISOString(), $lte: new Date(Date.parse(formattedEndDate)).toISOString() }
   
    console.log('REQUEST ROUTE - REQ QUERY formattedStartDate ', formattedStartDate)
    console.log('REQUEST ROUTE - REQ QUERY formattedStartDate ', formattedEndDate)
    // console.log('REQUEST ROUTE - REQ QUERY formattedStartDate TO DATE', formattedStartDate.toDate())
    // console.log('REQUEST ROUTE - REQ QUERY formattedEndDate ', formattedEndDate)



    // query.createdAt = { $gte: req.query.start_date, $lte: req.query.end_date }
    console.log('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt)
  }

  if (req.query.sort) {
    return Request.find(query).sort({ updatedAt: 'desc' }).exec(function (err, requests) {
      if (err) return next(err);

      return res.json(requests);
    });
  } else {
    console.log('REQUEST ROUTE - REQUEST FIND ', query)
    return Request.find(query).
      populate('departmentid').
      exec(function (err, requests) {
        if (err) return next(err);
        console.log('REQUEST ROUTE - REQUEST FIND ERR ', err)
        return res.json(requests);
      });
  }
});


module.exports = router;
