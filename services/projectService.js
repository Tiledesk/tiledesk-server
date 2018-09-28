'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var departmentService = require('../services/departmentService');

class ProjectService {


  create(name, createdBy) {

    return new Promise(function (resolve, reject) {

    
        var newProject = new Project({
            _id: new mongoose.Types.ObjectId(),
            name: name,
            // createdBy: req.body.id_user,
            // updatedBy: req.body.id_user
            activeOperatingHours: false,
            //operatingHours: req.body.hours,
            createdBy: createdBy,
            updatedBy: createdBy
          });
          // console.log('NEW PROJECT ', newProject)
        
          newProject.save(function (err, savedProject) {
            if (err) {
              console.error('--- > ERROR ', err)
              return reject({ success: false, msg: 'Error saving object.' });
            }
            // console.log('--- SAVE PROJECT ', savedProject)
            //res.json(savedProject);
        
            // PROJECT-USER POST
            var newProject_user = new Project_user({
              _id: new mongoose.Types.ObjectId(),
              id_project: savedProject._id,
              id_user: createdBy,
              role: 'owner',
              user_available: true,
              createdBy: createdBy,
              updatedBy: createdBy
            });
        
            newProject_user.save(function (err, savedProject_user) {
              if (err) {
                console.error('--- > ERROR ', err)
                return reject(err);
              }


                departmentService.createDefault(savedProject._id, createdBy).then(function(createdDepartment){
                  // console.info("Project created", )
                return resolve(savedProject);
              });
            });


        });  

    });
  }

}
var projectService = new ProjectService();


module.exports = projectService;
