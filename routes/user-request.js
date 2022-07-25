var express = require('express');
var router = express.Router();
var Request = require("../models/request");
var winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
const { check, validationResult } = require('express-validator');
var requestService = require('../services/requestService');
var mongoose = require('mongoose');


router.patch('/:requestid/rating', function (req, res) {
  winston.debug(req.body);
  const update = {};


  if (req.body.rating) {
    update.rating = req.body.rating;
  }

  if (req.body.rating_message) {
    update.rating_message = req.body.rating_message;
  }


  
  winston.debug("Request user patch update",update);

  // var query = {"request_id":req.params.requestid};
  var query = {"request_id":req.params.requestid, "requester": req.projectuser.id};

    //cacheinvalidation
  return Request.findOneAndUpdate(query, { $set: update }, { new: true, upsert: false })
  .populate('lead')
  .populate('department')
  .populate('participatingBots')
  .populate('participatingAgents')  
  .populate({path:'requester',populate:{path:'id_user'}})
  .exec( function(err, request) {
       
    if (err) {
      winston.error('Error user patching request.', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    if (!request) {
      return res.status(404).send({ success: false, msg: 'Request not found' });
    }

    requestEvent.emit("request.update", request);
    requestEvent.emit("request.update.comment", {comment:"PATCH",request:request});//Deprecated
    requestEvent.emit("request.updated", {comment:"PATCH",request:request, patch:  update});

    return res.json(request);
  });

});


router.put('/:requestid/closeg', function (req, res) {
  winston.debug(req.body);
  
    // closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
    const closed_by = req.user.id;
  return requestService.closeRequestByRequestId(req.params.requestid, req.projectid, false, true, closed_by).then(function(closedRequest) {

      winston.verbose("request closed", closedRequest);

        return res.json(closedRequest);
      
  });


});




router.get('/me', function (req, res, next) {

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);
  winston.debug('REQUEST ROUTE - QUERY ', req.query)

  const DEFAULT_LIMIT = 40;

  var limit = DEFAULT_LIMIT; // Number of request per page

  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  if (limit > 100) {
    limit = DEFAULT_LIMIT;
  }


  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('REQUEST ROUTE - SKIP PAGE ', skip);


  var user_id = req.user._id;
  winston.debug('REQUEST ROUTE - user_id:  '+user_id);

  var isObjectId = mongoose.Types.ObjectId.isValid(user_id);
  winston.debug("isObjectId:"+ isObjectId);


  var query = { "id_project": req.projectid, "status": {$lt:1000}, preflight:false};

    
  if (isObjectId) {
    query["snapshot.requester.id_user"] = user_id;
    // query.id_user = mongoose.Types.ObjectId(contact_id);
  } else {
    query["snapshot.requester.uuid_user"] = user_id;
  }


  // $or:[{"snapshot.requester.id_user": user_id}, {"snapshot.requester.uuid_user": user_id}]};  

  winston.debug('REQUEST ROUTE - query ', query);


  if (req.query.dept_id) {
    query.department = req.query.dept_id;
    winston.debug('REQUEST ROUTE - QUERY DEPT ID', query.department);
  }

  if (req.query.full_text) {
    winston.debug('req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  var history_search = false;

  if (req.query.status) {
    winston.debug('req.query.status', req.query.status);
    query.status = req.query.status;

    if (req.query.status == 1000 || req.query.status == "1000") {
      history_search = true;
    }
    if (req.query.status==="all") {
      history_search = true;
      delete query.status;
    }
  }

  // if (req.query.lead) {
  //   winston.debug('req.query.lead', req.query.lead);
  //   query.lead = req.query.lead;
  // }

  // USERS & BOTS
  if (req.query.participant) {
    winston.debug('req.query.participant', req.query.participant);
    query.participants = req.query.participant;
  }

  winston.debug('req.query.hasbot', req.query.hasbot);
  if (req.query.hasbot!=undefined) {
    winston.debug('req.query.hasbot', req.query.hasbot);
    query.hasBot = req.query.hasbot;
  }

  // if (req.query.waiting_time_exists) { //non basta aggiungi anche che nn è null
  //   query.waiting_time = {"$exists": req.query.waiting_time_exists} //{$ne:null}
  //   winston.debug('REQUEST ROUTE - QUERY waiting_time_exists', query.waiting_time_exists);
  // }


  if (req.query.tags) {
    winston.debug('req.query.tags', req.query.tags);
    query["tags.tag"] = req.query.tags;
  }

  if (req.query.location) {
    query.location = req.query.location;
  }

  if (req.query.ticket_id) {
    query.ticket_id = req.query.ticket_id;
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
  if ( history_search === true && req.project && req.project.profile && (req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {


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

    var range = { $gte: new Date(Date.parse(startDate)).toISOString() };
    if (req.query.filterRangeField) {
      query[req.query.filterRangeField] = range;
    }else {
      query.createdAt = range;
    }
    
    winston.debug('REQUEST ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }
  // }



  if (req.query.snap_department_routing) {
    query["snapshot.department.routing"] = req.query.snap_department_routing;
    winston.debug('REQUEST ROUTE - QUERY snap_department_routing', query.snap_department_routing);
  }

  if (req.query.snap_department_default) {
    query["snapshot.department.default"] = req.query.snap_department_default;
    winston.debug('REQUEST ROUTE - QUERY snap_department_default', query.snap_department_default);
  }


  if (req.query.snap_department_id_bot) {
    query["snapshot.department.id_bot"] = req.query.snap_department_id_bot;
    winston.debug('REQUEST ROUTE - QUERY snap_department_id_bot', query.snap_department_id_bot);
  }

  if (req.query.snap_department_id_bot_exists) {
    query["snapshot.department.id_bot"] = {"$exists": req.query.snap_department_id_bot_exists}
    winston.debug('REQUEST ROUTE - QUERY snap_department_id_bot_exists', query.snap_department_id_bot_exists);
  }

  // if (req.query.snap_lead_lead_id) {
  //   query["snapshot.lead.lead_id"] = req.query.snap_lead_lead_id;
  //   winston.debug('REQUEST ROUTE - QUERY snap_lead_lead_id', query.snap_lead_lead_id);
  // }

  if (req.query.channel) {
    query["channel.name"] =  req.query.channel
    winston.debug('REQUEST ROUTE - QUERY channel', query.channel);
  }


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

  winston.verbose('REQUEST ROUTE - REQUEST FIND ', query);

  var projection = undefined;

  if (req.query.full_text) {  
    winston.debug('fulltext projection'); 

    projection = {score: { $meta: "textScore" } };
  }
  // requestcachefarequi populaterequired
  var q1 = Request.find(query, projection).
    skip(skip).limit(limit);


    winston.debug('REQUEST ROUTE no_populate:' + req.query.no_populate);

    if (req.query.no_populate != "true" && req.query.no_populate != true) {        
      winston.verbose('REQUEST ROUTE - no_polutate false ', req.headers);
      q1.populate('department').
      populate('participatingBots').            //nico già nn gli usa
      populate('participatingAgents').          //nico già nn gli usa
      populate('lead').
      populate({path:'requester',populate:{path:'id_user'}});        //toglilo perche nico lo prende già da snapshot
    }
        
    // cache(cacheUtil.defaultTTL, "requests-"+projectId).    


    // if (req.query.select_snapshot) {
    //   winston.info('select_snapshot');
    //   q1.select("+snapshot");
    //   // q1.select({ "snapshot": 1});
    // }

    if (req.query.full_text) {     
      winston.debug('fulltext sort'); 
      q1.sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
    } else {
      q1.sort(sortQuery);
    }

    // winston.info('q1',q1);


    q1.exec();

    // TODO if ?onlycount=true do not perform find query but only 
    // set q1 to undefined; to skip query

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


module.exports = router;
