var express = require('express');
var router = express.Router();
var AnalyticResult = require("../models/analyticResult");
var mongoose = require('mongoose');
var winston = require('../config/winston');
var ObjectId = require('mongodb').ObjectId;
var ObjectId2 = require('mongoose').Types.ObjectId;



// mongoose.set('debug', true);




router.get('/requests/count', function(req, res) {
  
  winston.debug(req.params);
  winston.debug("req.projectid",  req.projectid);    
 
    
  AnalyticResult.aggregate([
      // { "$match": {"id_project": req.projectid } },
      // { "$match": {} },
      { "$match": {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
      { "$count": "totalCount" }
    
  ])
  // .exec((err, result) => {
    .exec(function(err, result) {

   
//, function (err, result) {
      if (err) {
          winston.debug(err);
          return res.status(500).send({success: false, msg: 'Error getting analytics.'});
        }
        winston.debug(result);

        res.json(result);
  });

});




// https://stackoverflow.com/questions/22516514/mongodb-return-the-count-of-documents-for-each-day-for-the-last-one-month
// https://stackoverflow.com/questions/15938859/mongodb-aggregate-within-daily-grouping
// db.requests.aggregate(
//   [
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
// ]
// )

  // router.get('/requests/aggregate/day', function(req, res) {
    
  //   //set default value for lastdays&department_id 
  //   let lastdays=7
    
    
  //   //check for lastdays&dep_id parameters
  //   if(req.query.lastdays){
  //     lastdays=req.query.lastdays
  //   }
  
  //   let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}

  //   if(req.query.department_id){      
  //     //add field departmentid to query if req.query.department_id exist
  //     query.department=req.query.department_id;

  //   }

    
    
  //   console.log("QueryParams:", lastdays,req.query.department_id)
  //   console.log("Query", query)

  //   winston.debug(req.params);
  //   winston.debug("req.projectid",  req.projectid);    
   
  //   AnalyticResult.aggregate([
  //       // { "$match": {"id_project": req.projectid } },
  //       // { "$match": {} },
  //       { $match: query },
  //       { "$project":{
  //         "year":{"$year":"$createdAt"}, 
  //         "month":{"$month":"$createdAt"}, 
  //         "day": {"$dayOfMonth":"$createdAt"}
  //       }}, 
  //       // // Group by year, month and day and get the count
  //       { "$group":{
  //             "_id":{"year":"$year", "month":"$month", "day":"$day"}, 
  //             "count":{"$sum":1}
  //       }},
  //       { "$sort": {"_id":1}},  
  //       // { "$limit": 7 },
  //   ])
  //   // .exec((err, result) => {
  //     .exec(function(err, result) {

     
  // //, function (err, result) {
  //       if (err) {
  //           winston.debug(err);
  //           console.log("ERR",err)
  //           return res.status(500).send({success: false, msg: 'Error getting analytics.'});
  //         }
  //         winston.debug(result);
  //         console.log("RES",result)
  //         res.json(result);
  //   });

  // });

  router.get('/requests/aggregate/day', function(req, res) {
    
    //set default value for lastdays&department_id 
    let lastdays=7
    //let department_id='';
    
    
    //check for lastdays&dep_id parameters
    if(req.query.lastdays){
      lastdays=req.query.lastdays
    }
    let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      query.department= new ObjectId(req.query.department_id);
      
    }
    
    console.log("QueryParams_LastDayCHART:", lastdays,req.query.department_id)
    console.log("Query_LastDayCHART", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
    AnalyticResult.aggregate([
        // { "$match": {"id_project": req.projectid } },
        // { "$match": {} },
        { $match: query },
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
        { "$sort": {"_id":1}},  
        // { "$limit": 7 },
    ])
    // .exec((err, result) => {
      .exec(function(err, result) {

     
  //, function (err, result) {
        if (err) {
            winston.debug(err);
            console.log("ERR",err)
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);
          console.log("RESULT",result)
          res.json(result);
    });

  });

  router.get('/requests/aggregate/month', function(req, res) {
    
    
    let query={"id_project": req.projectid }
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      query.department= new ObjectId(req.query.department_id);
      
    }
    
    console.log("QueryParams_MonthCHART:", req.query.department_id)
    console.log("Query_LastDayCHART", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
    AnalyticResult.aggregate([
         { "$match":  query},
        // { "$match": {} },
        //{ $match: query },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"}, 
          
        }}, 
        // // Group by year and month and get the count
        { "$group":{
              "_id":{"year":"$year", "month":"$month"}, 
              "count":{"$sum":1}
        }},
        { "$sort": {"_id":1}},  
        // { "$limit": 7 },
    ])
    // .exec((err, result) => {
      .exec(function(err, result) {

     
  //, function (err, result) {
        if (err) {
            winston.debug(err);
            console.log("ERR",err)
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);
          console.log("RESULT",result)
          res.json(result);
    });

  });

  router.get('/requests/aggregate/week', function(req, res) {
    
    
    //let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      //query.department= new ObjectId(req.query.department_id);
      
    }
    
    //console.log("QueryParams_WeekCHART:", lastdays,req.query.department_id)
    //console.log("Query_LastDayCHART", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
    AnalyticResult.aggregate([
         { "$match": {"id_project": req.projectid } },
        // { "$match": {} },
        //{ $match: query },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "day": {"$dayOfMonth":"$createdAt"},
          "week":{"$week":"$createdAt"},
          
          
        }}, 
        // // Group by year and month and get the count
        { "$group":{
              "_id":{"year":"$year", "month":"$month","week":"$week", }, 
              "count":{"$sum":1}
        }},
        { "$sort": {"_id":1}},  
        // { "$limit": 7 },
    ])
    // .exec((err, result) => {
      .exec(function(err, result) {

     
  //, function (err, result) {
        if (err) {
            winston.debug(err);
            console.log("ERR",err)
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);
          console.log("RESULT",result)
          res.json(result);
    });

  });

  

// db.requests.aggregate([
  //   // Get only records created in the last 30 days
  //   { $match: {"id_project":"5ad5bd52c975820014ba900a","createdAt" : { $gte : new Date(ISODate().getTime() - 1000*60*60*24*30) }} },
  //   // Get the year, month and day from the createdTimeStamp
  //   {$project:{
  //         "hour":{$hour:"$createdAt"}
  //   }}, 
  //   // Group by year, month and day and get the count
  //   {$group:{
  //         _id:{hour:"$hour"}, 
  //         "count":{$sum:1}
  //   }},
  //   {$sort:{_id:-1}},
  // ])

  router.get('/requests/aggregate/hours', function(req, res) {  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
    let timezone = req.query.timezone || "+00:00";
    winston.debug("timezone", timezone);

    AnalyticResult.aggregate([
        // { "$match": {"id_project": req.projectid } },
        // { "$match": {} },
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
        { "$project":{
          "hour":{"$hour": {date: "$createdAt", timezone: timezone} } 
        }}, 
        // // Group by year, month and day and get the count
        { "$group":{
              "_id":{"hour":"$hour"},
              "count":{"$sum":1}
        }},
        { "$sort": {"_id":-1}}
    ])
    // .exec((err, result) => {
      .exec(function(err, result) {

     
  //, function (err, result) {
        if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });


//test importante qui decommenta per vedere 
//   AnalyticResult.aggregate([
//     // { "$match": {"id_project": req.projectid } },
//     // { "$match": {} },
//     { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
//     { "$project":{
//       "hour":{"$hour":"$createdAt"},
//       "weekday":{"$dayoftheweek":"$createdAt"}
//     }}, 
//     // // Group by year, month and day and get the count
//     { "$group":{
//           "_id":{"hour":"$hour","weekday":"$weekday"},
//           "count":{"$sum":1}
//     }},
//     { "$sort": {"_id":-1}}
// ])
  router.get('/requests/aggregate/dayoftheweek/hours', function(req, res) {  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);  

    let timezone = req.query.timezone || "+00:00";
    winston.debug("timezone", timezone);

    AnalyticResult.aggregate([
        // { "$match": {"id_project": req.projectid } },
        // { "$match": {} },
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
        { "$project":{
            "hour":{"$hour":{date: "$createdAt", timezone: timezone} },
            "weekday":{"$dayOfWeek":"$createdAt"}
          }}, 
          // // Group by year, month and day and get the count
          { "$group":{
                "_id":{"hour":"$hour","weekday":"$weekday"},
                "count":{"$sum":1}
          }},
        { "$sort": {"_id":-1}}
    ])
      .exec(function(err, result) {

     
        if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });






  // db.requests.aggregate([
  //   { $match: {"id_project":"5ad5bd52c975820014ba900a"} },
  //     { $group: { _id: "$id_project", 
  //       "waiting_time_avg":{$avg: "$waiting_time"}
  //       }
  //     },
  //     { "$sort": {"_id":-1}},  
  //   ])

  
    
  router.get('/requests/waiting', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
      { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
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
          winston.debug(result);

          res.json(result);
    });

  });
  

  // db.requests.aggregate([
  //   { $match: {"id_project":"5ad5bd52c975820014ba900a"} },
  //    { $project:{
        
  //         "month":{$month:"$createdAt"},
  //         "year":{$year:"$createdAt"},
  //         "waiting_time_project" : "$waiting_time"
  //       }}, 
  //     { $group: { _id: {month:"$month", year: "$year"}, 
  //       "waiting_time_avg":{$avg: "$waiting_time_project"}
  //       }
  //     },
  //     { "$sort": {"_id":-1}},  
  //   ])
    

  router.get('/requests/waiting/day/last', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        //{ "$match": {"id_project":req.projectid }},
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (1 * 24 * 60 * 60 * 1000))) }} },
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
          winston.debug(result);

          res.json(result);
    });

  });



  router.get('/requests/waiting/day', function(req, res) {
  
    //set default value for lastdays&department_id 
    let lastdays=7
    //let department_id='';
    
    
    //check for lastdays&dep_id parameters
    if(req.query.lastdays){
      lastdays=req.query.lastdays
    }
    let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      query.department= new ObjectId(req.query.department_id);
      
    }
    
    console.log("QueryParams_AvgTime:", lastdays,req.query.department_id)
    console.log("Query_AvgTIME", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { $match: query },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "day":{"$dayOfMonth":"$createdAt"},
          "waiting_time_project" : "$waiting_time"
        }}, 
        { "$group": { 
          "_id": {"day":"$day","month":"$month", "year": "$year"}, 
         "waiting_time_avg":{"$avg": "$waiting_time_project"}
        }
      },
      { "$sort": {"_id":-1}}
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);
          console.log("RES",result)
          res.json(result);
    });

  });



  router.get('/requests/waiting/month', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { "$match": {"id_project":req.projectid }},
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "waiting_time_project" : "$waiting_time"
        }}, 
        { "$group": { 
          "_id": {"month":"$month", "year": "$year"}, 
         "waiting_time_avg":{"$avg": "$waiting_time_project"}
        }
      },
      { "$sort": {"_id":-1}}
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });



//duration



  // db.getCollection('requests').aggregate( [ 
  //   { $match: {"closed_at":{$exists:true}, "id_project":"5ad5bd52c975820014ba900a","createdAt" : { $gte : new Date(ISODate().getTime() - 1000*60*60*24*1) }} },
  //   {$project:{       
  //         "duration": {$subtract: ["$closed_at","$createdAt"]},
  //         "id_project":1
  //   }},
  //   { "$group": { 
  //     "_id": "$id_project", 
  //    "duration_avg":{"$avg": "$duration"}
  //   }   
  //   }
  // ] )


  router.get('/requests/duration', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
      { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
      {$project:{       
        "duration": {$subtract: ["$closed_at","$createdAt"]},
        "id_project":1
      }},  
      { "$group": { 
          "_id": "$id_project", 
         "duration_avg":{"$avg": "$duration"}
        }
      },
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });

/*
  db.getCollection('requests').aggregate( [ 
    { $match: {"closed_at":{$exists:true}, "id_project":"5ad5bd52c975820014ba900a","createdAt" : { $gte : new Date(ISODate().getTime() - 1000*60*60*24*30) }} },
    { "$project":{
      "year":{"$year":"$createdAt"}, 
      "month":{"$month":"$createdAt"},
      "day":{"$dayOfMonth":"$createdAt"},
      "duration": {$subtract: ["$closed_at","$createdAt"]},
    }}, 
    { "$group": { 
      "_id": {"day":"$day","month":"$month", "year": "$year"}, 
     "duration_avg":{"$avg": "$duration"}
    }
    },
    { "$sort": {"_id":-1}}
  ] )
  */


  router.get('/requests/duration/day', function(req, res) {
  
    //set default value for lastdays&department_id 
    let lastdays=7
    //let department_id='';
    
    
    //check for lastdays&dep_id parameters
    if(req.query.lastdays){
      lastdays=req.query.lastdays
    }
    
    let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      query.department= new ObjectId(req.query.department_id);
      
    }
    
    console.log("QueryParams_DurationTIME:", lastdays,req.query.department_id)
    console.log("Query_DurationTIME", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { $match: query },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "day":{"$dayOfMonth":"$createdAt"},
          "duration": {"$subtract": ["$closed_at","$createdAt"]},
        }}, 
        { "$group": { 
          "_id": {"day":"$day","month":"$month", "year": "$year"}, 
          "duration_avg":{"$avg": "$duration"}
        }
      },
      { "$sort": {"_id":-1}}
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });


  router.get('/requests/duration/month', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { $match: {"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) }} },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "duration": {"$subtract": ["$closed_at","$createdAt"]},
        }}, 
        { "$group": { 
          "_id": {"month":"$month", "year": "$year"}, 
          "duration_avg":{"$avg": "$duration"}
        }
      },
      { "$sort": {"_id":-1}}
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });




    
  router.get('/requests/satisfaction', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { "$match": {"id_project":req.projectid }},
        { "$group": { 
          "_id": "$id_project", 
         "satisfaction_avg":{"$avg": "$rating"}
        }
      },
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });
  
  router.get('/requests/satisfaction/day', function(req, res) {
  
    //set default value for lastdays&department_id 
    let lastdays=7
    //let department_id='';

    //check for lastdays&dep_id parameters
    if(req.query.lastdays){
      lastdays=req.query.lastdays
    }
    
    let query={"id_project":req.projectid, "createdAt" : { $gte : new Date((new Date().getTime() - (lastdays * 24 * 60 * 60 * 1000))) }}
    
    if(req.query.department_id){
      //department_id=req.query.department_id;
      //add field departmentid to query if req.query.department_id exist
      query.department= new ObjectId(req.query.department_id);
      
    }
    
    console.log("QueryParams_SatisfactionTIME:", lastdays,req.query.department_id)
    console.log("Query_SatisfactionTIME", query)

    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { $match: query },
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "day":{"$dayOfMonth":"$createdAt"},
          "satisfaction_project" : "$rating"
        }}, 
        { "$group": { 
          "_id": {"day":"$day","month":"$month", "year": "$year"}, 
          "satisfaction_avg":{"$avg": "$satisfaction_project"}
        }
      },
      { "$sort": {"_id":-1}}
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });


  router.get('/requests/satisfaction/month', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("req.projectid",  req.projectid);    
   
      
    AnalyticResult.aggregate([
        { "$match": {"id_project":req.projectid }},
        { "$project":{
          "year":{"$year":"$createdAt"}, 
          "month":{"$month":"$createdAt"},
          "satisfaction_project" : "$rating"
        }}, 
        { "$group": { 
          "_id": {"month":"$month", "year": "$year"}, 
         "satisfaction_avg":{"$avg": "$satisfaction_project"}
        }
      },
      
    ])
      .exec(function(err, result) {

          if (err) {
            winston.debug(err);
            return res.status(500).send({success: false, msg: 'Error getting analytics.'});
          }
          winston.debug(result);

          res.json(result);
    });

  });


  


  

  


module.exports = router;
