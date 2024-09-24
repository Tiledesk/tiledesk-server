'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var departmentService = require('../services/departmentService');
var projectEvent = require("../event/projectEvent");
var winston = require('../config/winston');
const cacheEnabler = require("./cacheEnabler");
const cacheUtil = require("../utils/cacheUtil");

class ProjectService {

  createAndReturnProjectAndProjectUser(name, createdBy, settings) {
    return new Promise(function (resolve, reject) {

    
      var newProject = new Project({
          name: name,
          activeOperatingHours: false,
          settings: settings,
          createdBy: createdBy,
          updatedBy: createdBy
        });
      
        return newProject.save(function (err, savedProject) {
          if (err) {
            winston.error('Error saving the project ', err)
            return reject({ success: false, msg: 'Error saving project.' });
          }
      
          // PROJECT-USER POST
          var newProject_user = new Project_user({
            id_project: savedProject._id,
            id_user: createdBy,
            role: 'owner',
            user_available: true,
            createdBy: createdBy,
            updatedBy: createdBy
          });
      
         return  newProject_user.save(function (err, savedProject_user) {
            if (err) {
              winston.error('Error saving the projet_user ', err)
              return reject(err);
            }


            return departmentService.createDefault(savedProject._id, createdBy).then(function(createdDepartment){
              winston.verbose("Project created", savedProject.toObject() );

              projectEvent.emit('project.create', savedProject );
              
              return resolve({project:savedProject, project_user: savedProject_user});
            });
          });


      });  

  });

  }

  create(name, createdBy, settings) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return that.createAndReturnProjectAndProjectUser(name, createdBy, settings).then(function(projectAndProjectUser){
        return resolve(projectAndProjectUser.project);
      }).catch(function(err){
        return reject(err);
      });
    });
  }

  async getCachedProject(id_project) {
    return new Promise((resolve, reject) => {
      let q = Project.findOne({ _id: id_project, status: 100 });
      if (cacheEnabler.project) {
        q.cache(cacheUtil.longTTL, "projects:id:" + id_project)  //project_cache
        winston.debug('project cache enabled for /project detail');
      }
      q.exec( async (err, p) => {
        if (err) {
          reject(err);
        }
        if (!p) {
          reject('Project not found')
        }

        resolve(p);
      })
    })
  }


}

var projectService = new ProjectService();


module.exports = projectService;
