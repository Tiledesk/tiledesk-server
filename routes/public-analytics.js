var express = require('express');
var router = express.Router();
var AnalyticResult = require("../models/analyticResult");
var mongoose = require('mongoose');



  router.get('/waiting/current', function(req, res) {
  
    //console.log(req.params);
    //console.log("req.projectid",  req.projectid);    
   
      
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
            console.log(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          //console.log(result);

          res.json(result);
    });

  });



  


  

  


module.exports = router;
