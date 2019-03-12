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

  console.log("req.body", req.body);

  console.log("req.projectid", req.projectid);
  console.log("req.user.id", req.user.id);


  var newRequest = new Request({
    requester_id: req.body.requester_id,
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
    // availableAgents: req.body.availableAgents,
    // assigned_operator_id: req.body.assigned_operator_id,

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

  return Request.findOneAndUpdate({"request_id":req.params.requestid}, { $set: update }, { new: true, upsert: false }, function (err, updatedMessage) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    return res.json(updatedMessage);
  });

});

router.post('/:requestid/share/email', function (req, res) {

  console.log("req.params.requestid", req.params.requestid);
  console.log("req projectid", req.projectid);
  console.log("req.user.id", req.user.id);
  
  const sendTo = req.query.to;
  console.log("sendTo", sendTo);


  return requestService.sendTranscriptByEmail(sendTo, req.params.requestid, req.projectid).then(function(result) {
    return res.json({'success':true});
  }).catch(function (err) {
    console.error("err", err);
    return res.status(500).send({ success: false, msg: 'Error sharing the request.',err:err });
  });
  //  return Request.findOne({request_id: req.params.requestid, id_project: req.projectid})
  //   .populate('department')
  //   .exec(function(err, request) { 
  //   if (err){
  //     console.error(err);
  //     return res.status(500).send({ success: false, msg: 'Error getting request.',err:err });
  //   }
  //   if (!request) {
  //     console.error("Request not found for request_id "+ req.params.requestid + " and id_project " + req.projectid);
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

  console.log("req projectid", req.projectid);
  console.log("req.query.sort", req.query.sort);
  console.log('REQUEST ROUTE - QUERY ', req.query)

  var limit = 40; // Number of request per page
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

  if (req.query.requester_id) {
    console.log('req.query.requester_id', req.query.requester_id);
    query.requester_id = req.query.requester_id;
  }

  // USERS & BOTS
  if (req.query.participant) {
    console.log('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
  }

  // if (req.query.request_id) {
  //   console.log('req.query.request_id', req.query.request_id);
  //   query.request_id = req.query.request_id;
  // }

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


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  } 
  console.log("direction",direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  } 
  console.log("sortField",sortField);

  var sortQuery={};
  sortQuery[sortField] = direction;

  console.log("sort query", sortQuery);

    console.log('REQUEST ROUTE - REQUEST FIND ', query)
    return Request.find(query).
    skip(skip).limit(limit).
      populate('department').
      populate('lead').
      // populate('lead', function (err, lead44) {
      //   //assert(doc._id === user._id) // the document itself is passed
      //   console.error('lead44',lead44)
      // }).
      // execPopulate(function (err, lead45) {
      //   //assert(doc._id === user._id) // the document itself is passed
      //   console.error('lead45',lead45)
      // }).
      sort(sortQuery).
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


// DOWNLOAD HISTORY REQUESTS AS CSV
router.get('/csv', function (req, res, next) {

  console.log("req projectid", req.projectid);
  console.log("req.query.sort", req.query.sort);
  console.log('REQUEST ROUTE - QUERY ', req.query)

  var limit = 100000; // Number of request per page
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

  if (req.query.requester_id) {
    console.log('req.query.requester_id', req.query.requester_id);
    query.requester_id = req.query.requester_id;
  }

  // USERS & BOTS
  if (req.query.participant) {
    console.log('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
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


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  } 
  console.log("direction",direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  } 
  console.log("sortField",sortField);

  var sortQuery={};
  sortQuery[sortField] = direction;

  console.log("sort query", sortQuery);

    console.log('REQUEST ROUTE - REQUEST FIND ', query)
    return Request.find(query, '-transcript  -department -agents -status -__v').
    skip(skip).limit(limit).
      populate({
        path: 'department', 
        //select: { '_id': -1,'name':1}
        select: {'name':1}
      }).          
      exec(function (err, requests) {
        if (err) {
          console.error('REQUEST ROUTE - REQUEST FIND ERR ', err)
          return next(err);
        }
        console.log('REQUEST ROUTE - REQUEST AS CSV', requests);

   
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

  console.log("get request by id ", req.params.requestid);

  Request.findOne({"request_id":req.params.requestid})
  .populate('lead')
  .exec(function(err, request) {
    //Request.findOne({"request_id":req.params.requestid}).exec(function(err, request) {
    if (err) {
      console.error("error getting request by id ", err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!request) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(request);
  });
});


module.exports = router;
