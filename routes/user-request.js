var express = require('express');
var router = express.Router();
var Request = require("../models/request");
var winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
const { check, validationResult } = require('express-validator');
var requestService = require('../services/requestService');


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
  
  // closeRequestByRequestId(request_id, id_project)
  return requestService.closeRequestByRequestId(req.params.requestid, req.projectid).then(function(closedRequest) {

      winston.verbose("request closed", closedRequest);

        return res.json(closedRequest);
      
  });


});

module.exports = router;
