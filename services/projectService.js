'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var departmentService = require('../services/departmentService');
var winston = require('../config/winston');

class ProjectService {


  create(name, createdBy, settings) {

    return new Promise(function (resolve, reject) {

    
        var newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            // createdBy: req.body.id_user,
            // updatedBy: req.body.id_user
            activeOperatingHours: false,
            //operatingHours: req.body.hours,
            settings: settings,
            createdBy: createdBy,
            updatedBy: createdBy
          });
          // console.log('NEW PROJECT ', newProject)
        
          return newProject.save(function (err, savedProject) {
            if (err) {
              winston.error('--- > ERROR ', err)
              return reject({ success: false, msg: 'Error saving object.' });
            }
            // console.log('--- SAVE PROJECT ', savedProject)
            //res.json(savedProject);
        
            // PROJECT-USER POST
            var newProject_user = new Project_user({
              // _id: new mongoose.Types.ObjectId(),
              id_project: savedProject._id,
              id_user: createdBy,
              role: 'owner',
              user_available: true,
              createdBy: createdBy,
              updatedBy: createdBy
            });
        
           return  newProject_user.save(function (err, savedProject_user) {
              if (err) {
                winston.error('--- > ERROR ', err)
                return reject(err);
              }


              return departmentService.createDefault(savedProject._id, createdBy).then(function(createdDepartment){
                winston.info("Project created", savedProject.toObject() );
                // console.info("Project user created", savedProject_user );
                // console.info("Department created", createdDepartment );
                return resolve(savedProject);
              });
            });


        });  

    });
  }

}
var projectService = new ProjectService();


module.exports = projectService;
