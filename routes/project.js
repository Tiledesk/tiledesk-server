var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var projectEvent = require("../event/projectEvent");
var Project_user = require("../models/project_user");
var Department = require("../models/department");
var mongoose = require('mongoose');
var operatingHoursService = require("../services/operatingHoursService");
var getTimezoneOffset = require("get-timezone-offset")

var winston = require('../config/winston');
var roleChecker = require('../middleware/has-role');

// THE THREE FOLLOWS IMPORTS  ARE USED FOR AUTHENTICATION IN THE ROUTE
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var RoleConstants = require("../models/roleConstants");


router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  // winston.debug(req.body, 'USER ID ',req.user.id );
  var newProject = new Project({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,    
    activeOperatingHours: false,
    operatingHours: req.body.hours,
    widget: req.body.widget,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newProject.save(function (err, savedProject) {
    if (err) {
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    // winston.debug('--- SAVE PROJECT ', savedProject)   

    // PROJECT-USER POST
    var newProject_user = new Project_user({
      id_project: savedProject._id,
      id_user: req.user.id,
      role: 'owner',
      user_available: true,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    newProject_user.save(function (err, savedProject_user) {
      if (err) {
        winston.error('--- > ERROR ', err)
        return res.status(500).send({ success: false, msg: 'Error saving object.' });
      }
      projectEvent.emit('project.create', savedProject );
      res.json(savedProject);
    });

    // CREATE DEFAULT DEPARTMENT
    var newDepartment = new Department({
      _id: new mongoose.Types.ObjectId(),   
      routing: 'assigned',
      name: 'Default Department',
      id_project: savedProject._id,
      default: true,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    newDepartment.save(function (err, savedDepartment) {
      if (err) {
        winston.error('Error creating department for project ', err);
        // return res.status(500).send({ success: false, msg: 'Error saving object.' });
      }
      winston.info('Default Department created')
      // res.json(savedDepartment);
    });
  });
});

router.put('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  winston.info('UPDATE PROJECT REQ BODY ', req.body);

  var update = {};
  
//like patch
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }

  if (req.body.activeOperatingHours!=undefined) {
    update.activeOperatingHours = req.body.activeOperatingHours;
  }
  
  if (req.body.operatingHours!=undefined) {
    update.operatingHours = req.body.operatingHours;
  }
  
  if (req.body.settings!=undefined) {
    update.settings = req.body.settings;
  }
  if (req.body["settings.email.autoSendTranscriptToRequester"]!=undefined) {
    update["settings.email.autoSendTranscriptToRequester"] = req.body["settings.email.autoSendTranscriptToRequester"];
  }

  if (req.body["settings.max_agent_served_chat"]!=undefined) {
    update["settings.max_agent_served_chat"] = req.body["settings.max_agent_served_chat"];
  }

  if (req.body["settings.reassignment_delay"]!=undefined) {
    update["settings.reassignment_delay"] = req.body["settings.reassignment_delay"];
  }

  if (req.body["settings.automatic_idle_chats"]!=undefined) {
    update["settings.automatic_idle_chats"] = req.body["settings.automatic_idle_chats"];
  }
  
  if (req.body.widget!=undefined) {
    update.widget = req.body.widget;
  }

  if (req.body.versions!=undefined) {
    update.versions = req.body.versions;
  }
  
  if (req.body.channels!=undefined) {
    update.channels = req.body.channels; 
  }
  

  winston.info('UPDATE PROJECT REQ BODY ', update);



  Project.findByIdAndUpdate(req.params.projectid, update, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    projectEvent.emit('project.update', updatedProject );
    res.json(updatedProject);
  });
});

router.patch('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  winston.debug('PATCH PROJECT REQ BODY ', req.body);

  var update = {};
  
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }

  if (req.body.activeOperatingHours!=undefined) {
    update.activeOperatingHours = req.body.activeOperatingHours;
  }
  
  if (req.body.operatingHours!=undefined) {
    update.operatingHours = req.body.operatingHours;
  }
  
  if (req.body.settings!=undefined) {
    update.settings = req.body.settings;
  }
  
  if (req.body["settings.email.autoSendTranscriptToRequester"]!=undefined) {
    update["settings.email.autoSendTranscriptToRequester"] = req.body["settings.email.autoSendTranscriptToRequester"];
  }

  if (req.body["settings.max_agent_served_chat"]!=undefined) {
    update["settings.max_agent_served_chat"] = req.body["settings.max_agent_served_chat"];
  }

  if (req.body["settings.reassignment_delay"]!=undefined) {
    update["settings.reassignment_delay"] = req.body["settings.reassignment_delay"];
  }

  if (req.body["settings.automatic_idle_chats"]!=undefined) {
    update["settings.automatic_idle_chats"] = req.body["settings.automatic_idle_chats"];
  }
  
  if (req.body.widget!=undefined) {
    update.widget = req.body.widget;
  }

  if (req.body.versions!=undefined) {
    update.versions = req.body.versions;
  }
  
  if (req.body.channels!=undefined) {
    update.channels = req.body.channels; 
  }
  
 
  winston.info('UPDATE PROJECT REQ BODY ', update);

  Project.findByIdAndUpdate(req.params.projectid, update, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error patching object.' });
    }
    projectEvent.emit('project.update', updatedProject );
    res.json(updatedProject);
  });
});

// DOWNGRADE PLAN. UNUSED
router.put('/:projectid/downgradeplan', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('owner')], function (req, res) {
  winston.debug('downgradeplan - UPDATE PROJECT REQ BODY ', req.body);
   Project.findByIdAndUpdate(req.params.projectid, req.body, { new: true, upsert: true }, function (err, updatedProject) {
     if (err) {
       winston.error('Error putting project ', err);
       return res.status(500).send({ success: false, msg: 'Error updating object.' });
     }
     projectEvent.emit('project.downgrade', updatedProject );
     res.json(updatedProject);
   });
 });


router.delete('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('owner')], function (req, res) {
  winston.debug(req.body);
  // TODO delete also department, faq_kb, faq, group, label, lead, message, project_users, requests, subscription
  Project.remove({ _id: req.params.projectid }, function (err, project) {
    if (err) {
      winston.error('Error deleting project ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    projectEvent.emit('project.delete', project );
    res.json(project);
  });
});

//roleChecker.hasRole('agent') works because req.params.projectid is valid using :projectid of this method
router.get('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {
  winston.debug(req.body);
  Project.findById(req.params.projectid, function (err, project) {
    if (err) {
      winston.error('Error getting project ', err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!project) {
      winston.warn('Project not found ');
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(project);
  });
});

// GET ALL PROJECTS BY CURRENT USER ID
// TODO controlla hasrole serve????? 
// router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {
  // altrimenti 403
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  winston.debug('REQ USER ID ', req.user._id)
   // project_user_qui
  Project_user.find({ id_user: req.user._id , role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]}}).
    populate('id_project').
    exec(function (err, projects) {
      if (err) {
        winston.error('Error getting projects: ', err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }            
      res.json(projects);
    });
});

// GET ALL PROJECTS BY CURRENT USER ID. usaed by unisalento to know if a project is open 
router.get('/:projectid/isopen', function (req, res) {
   operatingHoursService.projectIsOpenNow(req.params.projectid, function (isOpen, err) {
    winston.debug('project', req.params.projectid, 'isopen: ', isOpen);

    if (err) {
      winston.error('Error getting projectIsOpenNow', err);
      // sendError(err, res);
      return res.status(500).send({ success: false, msg: err });
    } 
     res.json({"isopen":isOpen});
  });

});

//togli questo route da qui e mettilo in altra route
// NEW -  RETURN  THE USER NAME AND THE USER ID OF THE AVAILABLE PROJECT-USER FOR THE PROJECT ID PASSED
router.get('/:projectid/users/availables', function (req, res) {
  //winston.debug("PROJECT ROUTES FINDS AVAILABLES project_users: projectid", req.params.projectid);

  operatingHoursService.projectIsOpenNow(req.params.projectid, function (isOpen, err) {
    //winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT: ', isOpen);

    if (err) {
      winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - EROR: ', err)
      // sendError(err, res);
      return res.status(500).send({ success: false, msg: err });
    } else if (isOpen) {

     // winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PRJCT: ', isOpen, ' -> FIND AVAILABLE');
      Project_user.find({ id_project: req.params.projectid, user_available: true, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]}}).
        populate('id_user').
        exec(function (err, project_users) {
          //winston.debug('PROJECT ROUTES - FINDS AVAILABLES project_users: ', project_users);
          if (err) {
            winston.debug('PROJECT ROUTES - FINDS AVAILABLES project_users - ERROR: ', err);
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          // && project_users.id_user
          if (project_users) {
            // winston.debug('PROJECT ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);

            user_available_array = [];
            project_users.forEach(project_user => {
              if (project_user.id_user) {
                // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
                user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
              } else {
                // winston.debug('PROJECT ROUTES - AVAILABLES PROJECT-USER (else): ', project_user)
              }
            });

            //winston.debug('ARRAY OF THE AVAILABLE USER ', user_available_array);

            res.json(user_available_array);
          }
        });


    } else {
     // winston.debug('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PRJCT: ', isOpen, ' -> AVAILABLE EMPTY');
      // closed
      user_available_array = [];
      res.json(user_available_array);
    }
  });

});




module.exports = router;
