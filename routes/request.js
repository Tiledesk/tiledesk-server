var express = require('express');
var router = express.Router();
var Request = require("../models/request");
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var moment = require('moment');
var requestService = require('../services/requestService');
var winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');


csv = require('csv-express');
csv.separator = ';';

const { check, validationResult } = require('express-validator');

var messageService = require('../services/messageService');



// undocumented
router.post('/', function (req, res) {

  winston.info("req.body", req.body);

  winston.info("req.projectid: " + req.projectid);
  winston.info("req.user.id: " + req.user.id);

  // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
//errore requester_id
    return requestService.createWithIdAndRequester(req.body.request_id, req.user.id, req.body.requester_id, req.projectid, 
      req.body.first_text, req.body.department, req.body.sourcePage, req.body.language, req.body.userAgent, 
      req.body.status, req.user.id, req.body.attributes).then(function(savedRequest) {


    // createWithId(request_id, requester_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes) {
    // return requestService.createWithId(req.body.request_id, req.body.requester_id, req.projectid, 
    //   req.body.first_text, req.body.department, req.body.sourcePage, req.body.language, req.body.userAgent, 
    //   req.body.status, req.user.id, req.body.attributes).then(function(savedRequest) {
           
      
        winston.debug("savedRequest", savedRequest);

    return res.json(savedRequest);

  }).catch(function(err) {
    winston.error('Error saving request.', err);
    return res.status(500).send({ success: false, msg: 'Error saving object.', err: err });
  
  });
});







router.patch('/:requestid', function (req, res) {
  winston.debug(req.body);
  // const update = _.assign({ "updatedAt": new Date() }, req.body);
  //const update = req.body;
  const update = {};
  
  if (req.body.lead) {
    update.lead = req.body.lead;
  }
  
  if (req.body.status) {
    update.status = req.body.status;
  }

  if (req.body.tags) {
    update.tags = req.body.tags;
  }
  
  if (req.body.notes) {
    update.notes = req.body.notes;
  }

  if (req.body.rating) {
    update.rating = req.body.rating;
  }

  if (req.body.rating_message) {
    update.rating_message = req.body.rating_message;
  }

  if (req.body.sourcePage) {
    update.sourcePage = req.body.sourcePage;
  }

  if (req.body.language) {
    update.language = req.body.language;
  }

  if (req.body.first_text) {
    update.first_text = req.body.first_text;
  }

  if (req.body.subject) {
    update.subject = req.body.subject;
  }


  
  winston.info("Request patch update",update);

  return Request.findOneAndUpdate({"request_id":req.params.requestid}, { $set: update }, { new: true, upsert: false })
  .populate('lead')
  .populate('department')
  .populate('participatingBots')
  .populate('participatingAgents')  
  .populate({path:'requester',populate:{path:'id_user'}})
  .exec( function(err, request) {
       
    if (err) {
      winston.error('Error patching request.', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    if (!request) {
      return res.status(404).send({ success: false, msg: 'Request not found' });
    }

    requestEvent.emit("request.update", request);
    return res.json(request);
  });

});


router.put('/:requestid/close', function (req, res) {
  winston.debug(req.body);
  
  // closeRequestByRequestId(request_id, id_project)
  return requestService.closeRequestByRequestId(req.params.requestid, req.projectid).then(function(closedRequest) {

      winston.info("request closed", closedRequest);

      return res.json(closedRequest);
  });


});

router.put('/:requestid/reopen', function (req, res) {
  winston.debug(req.body);
  // reopenRequestByRequestId(request_id, id_project) {
  return requestService.reopenRequestByRequestId(req.params.requestid, req.projectid).then(function(reopenRequest) {

    winston.info("request reopen", reopenRequest);

    return res.json(reopenRequest);
});


});



router.put('/:requestid/assignee', function (req, res) {
  winston.debug(req.body);
  //TODO change assignee
});


router.post('/:requestid/participants', 
[
  check('member').notEmpty(),  
],
function (req, res) {
  winston.debug(req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  
  //addParticipantByRequestId(request_id, id_project, member)
  return requestService.addParticipantByRequestId(req.params.requestid, req.projectid, req.body.member ).then(function(updatedRequest) {

      winston.info("participant added", updatedRequest);

      return res.json(updatedRequest);
  });
  
});

router.put('/:requestid/participants', function (req, res) {
  winston.info("req.body", req.body);

  var participants = [];
  req.body.forEach(function(participant,index) {
    participants.push(participant);
  });
  winston.info("var participants", participants);
  
  //setParticipantsByRequestId(request_id, id_project, participants)
  return requestService.setParticipantsByRequestId(req.params.requestid, req.projectid, participants ).then(function(updatedRequest) {

      winston.info("participant set", updatedRequest);

      return res.json(updatedRequest);
  });
  
});

router.delete('/:requestid/participants/:participantid', function (req, res) {
  winston.debug(req.body);
  
   //removeParticipantByRequestId(request_id, id_project, member)
  return requestService.removeParticipantByRequestId(req.params.requestid, req.projectid, req.params.participantid ).then(function(updatedRequest) {

      winston.info("participant removed", updatedRequest);

      return res.json(updatedRequest);
  });
  
  
});

// // TODO deprecated
// router.delete('/:requestid/participants', function (req, res) {
//   winston.debug(req.body);
  
//    //removeParticipantByRequestId(request_id, id_project, member)
//   return requestService.removeParticipantByRequestId(req.params.requestid, req.projectid, req.body.member ).then(function(updatedRequest) {

//       winston.info("participant removed", updatedRequest);

//       return res.json(updatedRequest);
//   });
  
  
// });

router.put('/:requestid/departments', function (req, res) {
  winston.info(req.body);
   //route(request_id, departmentid, id_project) {      
    requestService.route(req.params.requestid, req.body.departmentid, req.projectid, req.body.nobot).then(function(updatedRequest) {
      
      winston.info("department changed", updatedRequest);

      return res.json(updatedRequest);
  });
});



// router.post('/:requestid/attributes', function (req, res) {
//   winston.debug(req.body);
  
//   //return Request.findOneAndUpdate({"request_id":req.params.requestid},{ $push: { attributes: req.body } } , { new: true, upsert: false }, function (err, updatedMessage) {
//     return Request.findOneAndUpdate({"request_id":req.params.requestid},{ $set: { attributes: req.body } } , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });

// router.put('/:requestid/attributes/:attributeid', function (req, res) {
//   winston.debug(req.body);
  
//   return Request.findOneAndUpdate({"request_id":req.params.requestid, "attributes._id": req.params.attributeid},{ $set: { "attributes.$": req.body}} , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });

// router.delete('/:requestid/attributes/:attributeid', function (req, res) {
//   winston.debug(req.body);
  

//   return Request.findOneAndUpdate({"request_id":req.params.requestid},{ "$pull": { "attributes": { "_id": req.params.attributeid } }} , { new: true, upsert: false }, function (err, updatedMessage) {
//     if (err) {
//       winston.error('Error patching request.', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//     requestEvent.emit("request.update", updatedMessage);
//     return res.json(updatedMessage);
//   });

// });


router.patch('/:requestid/attributes',  function (req, res) {
  var data = req.body;
  var id_project = req.projectid;

  // TODO use service method

  Request.findOne({"request_id":req.params.requestid, id_project:id_project})
  .populate('lead')
  .populate('department')
  .populate('participatingBots')
  .populate('participatingAgents')  
  .populate({path:'requester',populate:{path:'id_user'}})
  .exec( function(err, request) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!request) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }

      
      if (!request.attributes) {
        winston.info("empty attributes")
        request.attributes = {};
      }

      winston.info(" req attributes", request.attributes)
        
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          winston.info("data attributes "+key+" " +val)
          request.attributes[key] = val;
        });     
        
        winston.info(" req attributes", request.attributes)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        request.markModified('attributes');

        request.save(function (err, savedRequest) {
          if (err) {
            winston.error("error saving request attributes",err)
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          winston.info(" saved request attributes",savedRequest.toObject())
          requestEvent.emit("request.update", savedRequest);
          requestEvent.emit("request.attributes.update", savedRequest);
            res.json(savedRequest);
          });
  });
  
});

router.post('/:requestid/notes',  function (req, res) {
  var note = {};
  note.text = req.body.text;
  note.id_project = req.id_project;
  note.createdBy = req.user.id;

  return Request.findOneAndUpdate({request_id:req.params.requestid, id_project:req.projectid},{ $push: { notes: note } } , { new: true, upsert: false })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')  
    .populate({path:'requester',populate:{path:'id_user'}})
    .exec( function(err, updatedRequest) {

    if (err) {
      winston.error('Error adding request note.', err);
      return res.status(500).send({ success: false, msg: 'Error adding request object.' });
    }
    requestEvent.emit("request.update", updatedRequest);
    return res.json(updatedRequest);
  });

});


router.delete('/:requestid/notes/:noteid',  function (req, res) {
  
  return Request.findOneAndUpdate({request_id: req.params.requestid, id_project:req.projectid},{ $pull: { notes: { "_id": req.params.noteid }  } } , { new: true, upsert: false })
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')  
    .populate({path:'requester',populate:{path:'id_user'}})
    .exec( function(err, updatedRequest) {

    if (err) {
      winston.error('Error adding request note.', err);
      return res.status(500).send({ success: false, msg: 'Error adding request object.' });
    }
    requestEvent.emit("request.update", updatedRequest);
    return res.json(updatedRequest);
  });

});


// unused ?
router.post('/:requestid/share/email', function (req, res) {

  winston.debug("req.params.requestid", req.params.requestid);
  winston.debug("req projectid", req.projectid);
  winston.debug("req.user.id", req.user.id);
  
  const sendTo = req.query.to;
  winston.debug("sendTo", sendTo);


  return requestService.sendTranscriptByEmail(sendTo, req.params.requestid, req.projectid).then(function(result) {
    return res.json({'success':true});
  }).catch(function (err) {
    winston.error("err", err);
    return res.status(500).send({ success: false, msg: 'Error sharing the request.',err:err });
  });


});


router.get('/', function (req, res, next) {

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  var limit = 40; // Number of request per page

  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid, "status": {$lt:1000} };

  var projectuser = req.projectuser;

  if (projectuser.role == "owner" || projectuser.role == "admin") {
  }else {  
    query["$or"] = [ { "agents.id_user": req.user.id}, {"participants": req.user.id}]
  }

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

  if (req.query.lead) {
    winston.debug('req.query.lead', req.query.lead);
    query.lead = req.query.lead;
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

    winston.debug('»»» REQUEST ROUTE - startdate ', startdate);
    winston.debug('»»» REQUEST ROUTE - enddate ', enddate);

    var enddatePlusOneDay=  moment(new Date()).add(1, 'days').toDate()
    winston.debug('»»» REQUEST ROUTE - enddate + 1 days: ', enddatePlusOneDay);

    // var enddatePlusOneDay = "2019-09-17T00:00:00.000Z"

    query.createdAt = { $gte: new Date(Date.parse(startdate)).toISOString(), $lte: new Date(enddatePlusOneDay).toISOString() }
    winston.debug('REQUEST ROUTE - QUERY CREATED AT ', query.createdAt);

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

  winston.info('REQUEST ROUTE - REQUEST FIND ', query);

  var q1 = Request.find(query).
    skip(skip).limit(limit).
    populate('department').
    populate('participatingBots').
    populate('participatingAgents').
    populate('lead').
    populate({path:'requester',populate:{path:'id_user'}}).
    sort(sortQuery).
    exec();

  var q2 =  Request.countDocuments(query).exec();

  var promises = [
    q1,
    q2
  ];

  Promise.all(promises).then(function(results) {
    var objectToReturn = {
      perPage: limit,
      count: results[1],
      requests: results[0]
    };
    winston.debug('REQUEST ROUTE - objectToReturn ', objectToReturn);
    return res.json(objectToReturn);

  }).catch(function(err){
    winston.error('REQUEST ROUTE - REQUEST FIND ERR ', err);
    return res.status(500).send({ success: false, msg: 'Error getting requests.', err: err });
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
    query.$text = {"$search": req.query.full_text};
  }

  if (req.query.status) {
    winston.debug('req.query.status', req.query.status);
    query.status = req.query.status;
  }

  if (req.query.lead) {
    winston.debug('req.query.lead', req.query.lead);
    query.lead = req.query.lead;
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
  winston.debug("direction",direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  } 
  winston.debug("sortField",sortField);

  var sortQuery={};
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
          return res.status(500).send({ success: false, msg: 'Error getting csv requests.',err:err });
        }
        

         requests.forEach(function(element) {
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

  winston.info("get request by id ", req.params.requestid);

  Request.findOne({"request_id":req.params.requestid})
  .populate('lead')
  .populate('department')
  .populate('participatingBots')
  .populate('participatingAgents')  
  .populate({path:'requester',populate:{path:'id_user'}})
  //  .populate({path:'requester',populate:{path:'id_user', select:{'firstname':1, 'lastname':1}}})
  // .populate({path:'requester'})
  .exec(function(err, request) {  
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
