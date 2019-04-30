var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var winston = require('../config/winston');
var Project_user = require("../models/project_user");
var operatingHoursService = require("../models/operatingHoursService");
var AnalyticResult = require("../models/analyticResult");
var Department = require("../models/department");



  router.get('/', function(req, res) {
    winston.info(req.projectid);


    var availableUsers = function() {
      winston.info('availableUsers:');
      return new Promise(function (resolve, reject) {
      operatingHoursService.projectIsOpenNow(req.projectid, function (isOpen, err) {    
          winston.info('isOpen:'+ isOpen);
          if (isOpen) {            
            Project_user.find({ id_project: req.projectid, user_available: true }).
              populate('id_user').
              exec(function (err, project_users) {
                winston.info('project_users:'+ project_users);
                if (project_users) {    
                  user_available_array = [];
                  project_users.forEach(project_user => {
                    if (project_user.id_user) {
                      user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
                    } else {
                      winston.info('else:');
                    }
                  });      
                  winston.info('user_available_array:'+ JSON.stringify(user_available_array));          
                  return resolve(user_available_array);
                }
              });
          } else {          
            return resolve([]);
          }
        });
      });
  };

  var waiting = function() {
    return new Promise(function (resolve, reject) {
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
          return resolve(result);
    });
  });
  };



  // var departments = function() {
    
  //     return Department.find({ "id_project": req.projectid, "status": 1 }).exec(
  // };
  


    Promise.all([
      Project.findById(req.projectid).select('-settings'),
      availableUsers(),
      Department.find({ "id_project": req.projectid, "status": 1 }),
      waiting()
     

    ]).then(function(all) {
      let result = {project: all[0], user_available: all[1], departments: all[2], waiting: all[3]};
      res.json(result);
    });
  });



  


  

  


module.exports = router;
