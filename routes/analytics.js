var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var AnalyticResult = require("../models/analyticResult");
var mongoose = require('mongoose');



// mongoose.set('debug', true);



// https://stackoverflow.com/questions/22516514/mongodb-return-the-count-of-documents-for-each-day-for-the-last-one-month
// https://stackoverflow.com/questions/15938859/mongodb-aggregate-within-daily-grouping
// db.requests.aggregate([
//   // Get only records created in the last 30 days
//   { $match: {"id_project":"5ad5bd52c975820014ba900a","createdAt" : { $gte : new Date(ISODate().getTime() - 1000*60*60*24*30) }} },
//   // Get the year, month and day from the createdTimeStamp
//   {$project:{
//         "year":{$year:"$createdAt"}, 
//         "month":{$month:"$createdAt"}, 
//         "day": {$dayOfMonth:"$createdAt"}
//   }}, 
//   // Group by year, month and day and get the count
//   {$group:{
//         _id:{year:"$year", month:"$month", day:"$day"}, 
//         "count":{$sum:1}
//   }},
//   {$sort:{_id:1}},
// ])

  router.get('/requests', function(req, res) {
  
    console.log(req.params);
    console.log("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        // { "$match": {"id_project": req.projectid } },
        // { "$match": {} },
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"}, 
          "day": {"$dayOfMonth":"$createdAt"}
        }}, 
        // // Group by year, month and day and get the count
        { "$group":{
              "_id":{"year":"$year", "month":"$month", "day":"$day"}, 
              "count":{"$sum":1}
        }},
        { "$sort": {"_id":1}}
    ])
    // .exec((err, result) => {
      .exec(function(err, result) {

     
  //, function (err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          console.log(result);

          res.json(result);
    });

  });




  


module.exports = router;
