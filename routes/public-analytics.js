var express = require('express');
var router = express.Router();
var AnalyticResult = require("../models/analyticResult");
var mongoose = require('mongoose');
var winston = require('../config/winston');


  router.get('/waiting/current', function(req, res) {
  
    //winston.debug(req.params);
    //winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        //last 4
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (4 * 60 * 60 * 1000))) }} },
        { "$group": { 
          "_id": "$id_project", 
         "waiting_time_avg":{"$avg": "$waiting_time"}
        }
      },
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          //winston.debug(result);

          res.json(result);
    });

  });



  


  

  


module.exports = router;
