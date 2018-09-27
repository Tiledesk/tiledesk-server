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
    status: req.body.status,

    participants: req.body.participants,
    department: req.body.department,

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
    // this.sendEmail(req.projectid, savedRequest);



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

  var limit = 40; // No of request per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  console.log('REQUEST ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid };

  if (req.query.dept_id) {
    query.department = req.query.dept_id;
    console.log('REQUEST ROUTE - QUERY DEPT ID', query.department);
  }

  if (req.query.full_text) {
    console.log('req.query.fulltext', req.query.full_text);
    query.$text = {"$search": req.query.full_text};
  }

  if (req.query.status) {
    console.log('req.query.status', req.query.status);
    query.status = req.query.status;
  }

  /**
   * DATE RANGE  */
  if (req.query.start_date && req.query.end_date) {
    console.log('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
    console.log('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }


    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    console.log('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    console.log('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    console.log('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    console.log('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    console.log('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    console.log('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }


  var direction = "asc";
  if (req.query.direction) {
    direction = req.query.direction;
  } 

  var sortField = "updatedAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  } 

    console.log('REQUEST ROUTE - REQUEST FIND ', query)
    return Request.find(query).
    skip(skip).limit(limit).
      populate('department').
      sort({ sortField: direction }).
      exec(function (err, requests) {
        if (err) {
          console.error('REQUEST ROUTE - REQUEST FIND ERR ', err)
          return next(err);
        }
        console.log('REQUEST ROUTE - REQUEST ', requests);

        return Request.count(query, function(err, totalRowCount) {

          var objectToReturn = {
            perPage: limit,
            count: totalRowCount,
            requests : requests
          };
          console.log('REQUEST ROUTE - objectToReturn ', objectToReturn);
          return res.json(objectToReturn);
        });
       
      });
  
});


module.exports = router;
