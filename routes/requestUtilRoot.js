var express = require('express');

var router = express.Router();

var Request = require("../models/request");
var winston = require('../config/winston');

// https://tiledesk-server-pre.herokuapp.com/requests_util/lookup/id_project/support-group-60ffe291f725db00347661ef-b4cb6875785c4a23b27244fe498eecf4
router.get('/lookup/id_project/:request_id',  function(req, res) {
  winston.debug("lookup: "+req.params.request_id);
  
  return Request.findOne({request_id: req.params.request_id}).select("id_project").exec(function(err, request) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error creating message', err:err });
      } 
      if (!request) {
        return res.status(404).send({success: false, msg: "Request with  " + req.params.request_id + " not found" });
      }
      winston.debug("request",request);
      res.json({id_project: request.id_project});
    });

});


module.exports = router;




