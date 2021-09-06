var express = require('express');

var router = express.Router();

var Request = require("../models/request");
var winston = require('../config/winston');


router.get('/lookup/id_project/:request_id',  function(req, res) {
  winston.info("lookup: "+req.params.request_id);
  
  return Request.findOne({request_id: req.params.request_id}).select("id_project").exec(function(err, request) { 
      if (err) return next(err);
      winston.info("request",request);
      res.json(request);
    });

});


module.exports = router;




