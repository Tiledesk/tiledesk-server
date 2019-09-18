var express = require('express');
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
var requestService = require('../services/requestService');
var winston = require('../config/winston');


// var Chat21 = require('@chat21/chat21-node-sdk');


// var firebaseService = require("../services/firebaseService");

// var admin = require('../utils/firebaseConnector');

// var firebaseConfig = require('../config/firebase');
// var chat21Config = require('../config/chat21');

csv = require('csv-express');
csv.separator = ';';

// var chat21 = new Chat21({
//   url: chat21Config.url,
//   appid: chat21Config.appid,
//   // url: process.env.CHAT21_URL,
//   // appid: process.env.CHAT21_APPID,
//   oauth: true,

//   firebase_apikey:  process.env.FIREBASE_APIKEY,
//   firebase_database: firebaseConfig.databaseURL
// });

var messageService = require('../services/messageService');




router.post('/', function (req, res) {

  winston.info("req.body", req.body);

  winston.info("req.projectid: " + req.projectid);
  winston.info("req.user.id: " + req.user.id);


  // var newRequest = new Request({
  //   request_id: req.body.request_id,
  //   requester_id: req.body.requester_id,
  //   first_text: req.body.first_text,
  //   status: req.body.status,
  //   participants: req.body.participants, //??
  //   department: req.body.department,
  //   tags: req.body.tags,
  //   rating: req.body.rating,
  //   rating_message: req.body.rating_message,
  //   sourcePage: req.body.sourcePage,
  //   language: req.body.language,
  //   userAgent: req.body.userAgent,
  //   id_project: req.projectid,
  //   createdBy: req.user.id,
  //   updatedBy: req.user.id
  // });

  // return newRequest.save(function (err, savedRequest) {


  // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
  return requestService.createWithId(req.body.request_id, req.body.requester_id, req.projectid,
    req.body.first_text, req.body.department, req.body.sourcePage, req.body.language, req.body.userAgent,
    req.body.status, req.user.id, req.body.attributes).then(function (savedRequest) {


      // return messageService.create(req.body.requester_id, req.body.sender_fullname, req.params.request_id, req.body.text,
      //   req.projectid, req.user._id, messageStatus, req.body.attributes).then(function(savedMessage){                    
      //     return requestService.incrementMessagesCountByRequestId(savedRequest.request_id, savedRequest.id_project).then(function(savedRequestWithIncrement) {
      //       return res.json(savedRequestWithIncrement);
      //     });
      //   });     


      winston.debug("savedRequest", savedRequest);

      // console.log("XXXXXXXXXXXXXXXX");
      // this.sendEmail(req.projectid, savedRequest);
      return res.json(savedRequest);

    }).catch(function (err) {
      winston.error('Error saving request.', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.', err: err });

    });
});



router.patch('/:requestid', function (req, res) {
  winston.debug(req.body);
  // const update = _.assign({ "updatedAt": new Date() }, req.body);
  const update = req.body;
  winston.debug(update);

  // Request.update({_id  : ObjectId(req.params.requestid)}, {$set: update}, {new: true, upsert:false}, function(err, updatedMessage) {

  return Request.findOneAndUpdate({ "request_id": req.params.requestid }, { $set: update }, { new: true, upsert: false }, function (err, updatedMessage) {
    if (err) {
      winston.error('Error patching request.', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    return res.json(updatedMessage);
  });

});

router.post('/:requestid/share/email', function (req, res) {

  winston.debug("req.params.requestid", req.params.requestid);
  winston.debug("req projectid", req.projectid);
  winston.debug("req.user.id", req.user.id);

  const sendTo = req.query.to;
  winston.debug("sendTo", sendTo);


  return requestService.sendTranscriptByEmail(sendTo, req.params.requestid, req.projectid).then(function (result) {
    return res.json({ 'success': true });
  }).catch(function (err) {
    winston.error("err", err);
    return res.status(500).send({ success: false, msg: 'Error sharing the request.', err: err });
  });
  //  return Request.findOne({request_id: req.params.requestid, id_project: req.projectid})
  //   .populate('department')
  //   .exec(function(err, request) { 
  //   if (err){
  //     winston.error(err);
  //     return res.status(500).send({ success: false, msg: 'Error getting request.',err:err });
  //   }
  //   if (!request) {
  //     winston.error("Request not found for request_id "+ req.params.requestid + " and id_project " + req.projectid);
  //     return res.status(404).send({"success":false, msg:"Request not found for request_id "+ req.params.requestid  + " and id_project " + req.projectid});
  //   }



  //   return Message.find({"recipient": req.params.requestid,id_project : req.projectid})
  //     .sort({updatedAt: 'asc'})
  //     .exec(function(err, messages) { 
  //     if (err) {
  //       return res.status(500).send({success: false, msg: 'Error getting messages.'});
  //     }

  //     if(!messages){
  //       return res.status(404).send({success: false, msg: 'Object not found.'});
  //     }

  //     console.log("request", request);

  //     emailService.sendRequestTranscript(sendTo, messages, request);
  //     return res.json({'success':true});


  //   });

  //   });

  // return messageService.getTranscriptByRequestId(req.params.requestid, req.projectid).then(function(transcript) {
  //   console.log("transcript", transcript);
  //   emailService.sendRequestTranscript(sendTo, transcript);
  //   return res.json({'success':true});
  // }).catch(function (err) {
  //   return res.status(500).send({ success: false, msg: 'Error getting the request transcript.',err:err });
  // });





});

// router.post('/:requestid/assign', function (req, res) {

//   console.log(req.params.requestid);
//   console.log("req projectid", req.projectid);
//   console.log("req.user.id", req.user.id);

//   const assignee = req.body.assignee;
//   console.log("assignee", assignee);

//   return firebaseService.createCustomToken(req.user.id).then(customAuthToken => {
//         console.log("customAuthToken", customAuthToken);
//         // console.log("chat21", chat21);
//         // console.log(" admin.auth()", JSON.stringify(admin.auth()));
//         // console.log(" admin", admin.auth());

//        return chat21.firebaseAuth.signinWithCustomToken(customAuthToken).then(function(idToken) {
//           chat21.auth.setCurrentToken(idToken);
//           console.log("chat21.auth.getCurretToken()", chat21.auth.getCurrentToken());
//           return chat21.groups.leave(req.user.id, req.params.requestid).then(function(data){
//             return chat21.groups.join(assignee, req.params.requestid).then(function(data){
//                   // console.log("join resolve ", data);
//                   return res.json(data);
//               });
//           });
//         });
//     }).catch(function(err) {
//       return res.status(500).send({ success: false, msg: 'Error assigning the request.', err: err });
//     });




//   // return requestService.removeParticipantByRequestId(request_id, req.projectid, req.user.id).then(function(request) {
//   //   if (err) {
//   //     return res.status(500).send({ success: false, msg: 'Error updating object.' });
//   //   }
//   //   return requestService.addParticipantByRequestId(request_id, req.projectid, req.params.assignee).then(function(request) {
//   //     return res.json(request);
//   //   });
//   // });

// });




router.get('/', function (req, res, next) {

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  var limit = 40; // Number of request per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid };

  // console.log('REQUEST ROUTE - req ', req); 
  // console.log('REQUEST ROUTE - req.project ', req.project); 


  if (req.query.dept_id) {
    query.department = req.query.dept_id;
    winston.debug('REQUEST ROUTE - QUERY DEPT ID', query.department);
  }

  if (req.query.full_text) {
    winston.debug('req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.status) {
    winston.debug('req.query.status', req.query.status);
    query.status = req.query.status;
  }

  if (req.query.requester_id) {
    winston.debug('req.query.requester_id', req.query.requester_id);
    query.requester_id = req.query.requester_id;
  }

  // USERS & BOTS
  if (req.query.participant) {
    winston.debug('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
  }

  // if (req.query.request_id) {
  //   console.log('req.query.request_id', req.query.request_id);
  //   query.request_id = req.query.request_id;
  // }

  /**
   **! *** DATE RANGE  USECASE 1 ***
   *  in the tiledesk dashboard's HISTORY PAGE
   *  WHEN THE TRIAL IS EXIPIRED OR THE SUBSCIPTION IS NOT ACTIVE
   *  THE SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS ARE DISABLED AND 
   *  ARE DISPLAYED ONLY THE REQUESTS OF THE LAST 14 DAYS
   */
  if ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {


    var startdate = moment().subtract(14, "days").format("YYYY-MM-DD");

    var enddate = moment().format("YYYY-MM-DD");

    console.log('»»» REQUEST ROUTE - startdate ', startdate);
    console.log('»»» REQUEST ROUTE - enddate ', enddate);

    var enddatePlusOneDay=  moment(new Date()).add(1, 'days').toDate()
    console.log('»»» REQUEST ROUTE - enddate + 1 days: ', enddatePlusOneDay);

    // var enddatePlusOneDay = "2019-09-17T00:00:00.000Z"

    query.createdAt = { $gte: new Date(Date.parse(startdate)).toISOString(), $lte: new Date(enddatePlusOneDay).toISOString() }
    console.log('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  }
 
 /**
   **! *** DATE RANGE  USECASE 2 ***
   *  in the tiledesk dashboard's HISTORY PAGE 
   *  WHEN THE USER SEARCH FOR DATE INTERVAL OF THE HISTORY OF REQUESTS
   */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }

    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }
  // }




  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  winston.info('REQUEST ROUTE - REQUEST FIND ', query)
  return Request.find(query).
    skip(skip).limit(limit).
    populate('department').
    populate('lead').
    // populate('lead', function (err, lead44) {
    //   //assert(doc._id === user._id) // the document itself is passed
    //   winston.error('lead44',lead44)
    // }).
    // execPopulate(function (err, lead45) {
    //   //assert(doc._id === user._id) // the document itself is passed
    //   winston.error('lead45',lead45)
    // }).
    sort(sortQuery).
    exec(function (err, requests) {
      if (err) {
        winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err);
        console.log('REQUEST ROUTE - REQUEST FIND ERR 1', err)

        return res.status(500).send({ success: false, msg: 'Error getting requests.', err: err });
      }
      winston.debug('REQUEST ROUTE - REQUEST ', requests);

      return Request.count(query, function (err, totalRowCount) {
        if (err) {
          winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err);
          console.log('REQUEST ROUTE - REQUEST FIND ERR 2', err)
          return res.status(500).send({ success: false, msg: 'Error getting requests.', err: err });
        }
        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          requests: requests
        };
        winston.debug('REQUEST ROUTE - objectToReturn ', objectToReturn);
        return res.json(objectToReturn);
      });

    });

});


// DOWNLOAD HISTORY REQUESTS AS CSV
router.get('/csv', function (req, res, next) {

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  var limit = 100000; // Number of request per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid };

  if (req.query.dept_id) {
    query.department = req.query.dept_id;
    winston.debug('REQUEST ROUTE - QUERY DEPT ID', query.department);
  }

  if (req.query.full_text) {
    winston.debug('req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.status) {
    winston.debug('req.query.status', req.query.status);
    query.status = req.query.status;
  }

  if (req.query.requester_id) {
    winston.debug('req.query.requester_id', req.query.requester_id);
    query.requester_id = req.query.requester_id;
  }

  // USERS & BOTS
  if (req.query.participant) {
    winston.debug('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
  }

  /**
   * DATE RANGE  */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('REQUEST ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING TIMESTAMP  in MS    */
    // var formattedStartDate = new Date(+req.query.start_date);
    // var formattedEndDate = new Date(+req.query.end_date);
    // query.createdAt = { $gte: formattedStartDate, $lte: formattedEndDate }


    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('REQUEST ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('REQUEST ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }


  var direction = 1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  winston.debug('REQUEST ROUTE - REQUEST FIND ', query)
  return Request.find(query, '-transcript  -agents -status -__v').
    skip(skip).limit(limit).
    //populate('department', {'_id':-1, 'name':1}).     
    populate('department').
    lean().
    // populate({
    //   path: 'department', 
    //   //select: { '_id': -1,'name':1}
    //   select: {'name':1}
    // }).  
    sort(sortQuery).
    exec(function (err, requests) {
      if (err) {
        winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err)
        return res.status(500).send({ success: false, msg: 'Error getting csv requests.', err: err });
      }


      requests.forEach(function (element) {
        var depName = "";
        if (element.department && element.department.name) {
          depName = element.department.name;
        }
        delete element.department;
        element.department = depName;
      });

      winston.debug('REQUEST ROUTE - REQUEST AS CSV', requests);

      // return Request.count(query, function(err, totalRowCount) {

      // var objectToReturn = {
      //   perPage: limit,
      //   count: totalRowCount,
      //   requests : requests
      // };
      // console.log('REQUEST ROUTE - objectToReturn ', objectToReturn);
      return res.csv(requests, true);
      // return res.csv([ { name: "joe", id: 1 }])
    });

  // });

});

router.get('/:requestid', function (req, res) {

  winston.debug("get request by id ", req.params.requestid);

  Request.findOne({ "request_id": req.params.requestid })
    .populate('lead')
    .exec(function (err, request) {
      //Request.findOne({"request_id":req.params.requestid}).exec(function(err, request) {
      if (err) {
        winston.error("error getting request by id ", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!request) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(request);
    });
});


module.exports = router;
