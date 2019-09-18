var express = require('express');
var router = express.Router();
var Project = require("../models/project");
var Project_user = require("../models/project_user");
var Department = require("../models/department");
var mongoose = require('mongoose');
var operatingHoursService = require("../models/operatingHoursService");
var getTimezoneOffset = require("get-timezone-offset")

var winston = require('../config/winston');
var roleChecker = require('../middleware/has-role');

// THE THREE FOLLOWS IMPORTS  ARE USED FOR AUTHENTICATION IN THE ROUTE
var passport = require('passport');
require('../config/passport')(passport);
var validtoken = require('../middleware/valid-token')


// PROJECT POST
router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  // console.log(req.body, 'USER ID ',req.user.id );
  // var id = mongoose.Types.ObjectId()
  var newProject = new Project({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    // createdBy: req.body.id_user,
    // updatedBy: req.body.id_user
    activeOperatingHours: false,
    operatingHours: req.body.hours,
    widget: req.body.widget,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });
  // console.log('NEW PROJECT ', newProject)

  newProject.save(function (err, savedProject) {
    if (err) {
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    // console.log('--- SAVE PROJECT ', savedProject)
    //res.json(savedProject);

    // PROJECT-USER POST
    var newProject_user = new Project_user({
      // _id: new mongoose.Types.ObjectId(),
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
      res.json(savedProject);
    });

    // CREATE DEFAULT DEPARTMENT
    var newDepartment = new Department({
      _id: new mongoose.Types.ObjectId(),
      // id_bot: 'undefined',
      // routing: 'pooled',
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

// PROJECT PUT
// should check HasRole otherwise another project user can change this
router.put('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], function (req, res) {
  winston.debug('UPDATE PROJECT REQ BODY ', req.body);
  console.log('UPDATE PROJECT REQ BODY ', req.body);
  Project.findByIdAndUpdate(req.params.projectid, req.body, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      winston.error('Error putting project ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedProject);
  });
});

// DOWNGRADE PLAN. UNUSED
router.put('/:projectid/downgradeplan', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], function (req, res) {
  console.log('downgradeplan - UPDATE PROJECT REQ BODY ', req.body);
   Project.findByIdAndUpdate(req.params.projectid, req.body, { new: true, upsert: true }, function (err, updatedProject) {
     if (err) {
       winston.error('Error putting project ', err);
       return res.status(500).send({ success: false, msg: 'Error updating object.' });
     }
     res.json(updatedProject);
   });
 });


// PROJECT DELETE
router.delete('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], function (req, res) {
  winston.debug(req.body);
  Project.remove({ _id: req.params.projectid }, function (err, project) {
    if (err) {
      winston.error('Error deleting project ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(project);
  });
});

// PROJECT GET DETAIL
router.get('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole()], function (req, res) {
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
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  winston.debug('REQ USER ID ', req.user.id)
  Project_user.find({ id_user: req.user.id }).
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
      sendError(err, res);
      // return res.status(500).send({ success: false, msg: err });
    } 
     res.json({"isopen":isOpen});
  });

});

//togli questo route da qui e mettilo in altra route
// NEW -  RETURN  THE USER NAME AND THE USER ID OF THE AVAILABLE PROJECT-USER FOR THE PROJECT ID PASSED
router.get('/:projectid/users/availables', function (req, res) {
  //console.log("PROJECT ROUTES FINDS AVAILABLES project_users: projectid", req.params.projectid);

  // _findAvailableUsers(req.params.projectid, res);

  operatingHoursService.projectIsOpenNow(req.params.projectid, function (isOpen, err) {
    //console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT: ', isOpen);

    if (err) {
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - EROR: ', err)
      sendError(err, res);
      // return res.status(500).send({ success: false, msg: err });
    } else if (isOpen) {

     // console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PRJCT: ', isOpen, ' -> FIND AVAILABLE');
      findAndSendAvailableUsers(req.params.projectid, res);

    } else {
     // console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PRJCT: ', isOpen, ' -> AVAILABLE EMPTY');
      // closed
      user_available_array = [];
      res.json(user_available_array);
    }
  });

});

function findAndSendAvailableUsers(projectid, res) {
  Project_user.find({ id_project: projectid, user_available: true }).
    populate('id_user').
    exec(function (err, project_users) {
      //console.log('PROJECT ROUTES - FINDS AVAILABLES project_users: ', project_users);
      if (err) {
        console.log('PROJECT ROUTES - FINDS AVAILABLES project_users - ERROR: ', err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      // && project_users.id_user
      if (project_users) {
        // console.log('PROJECT ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);

        user_available_array = [];
        project_users.forEach(project_user => {
          if (project_user.id_user) {
            // console.log('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
            user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
          } else {
            // console.log('PROJECT ROUTES - AVAILABLES PROJECT-USER (else): ', project_user)
          }
        });

        //console.log('ARRAY OF THE AVAILABLE USER ', user_available_array);

        res.json(user_available_array);
      }
    });

}

function sendError(err, res) {
  var errcode = err.errorCode
  console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR CODE: ', errcode);
  switch (errcode) {
    // Project.findById -> Error getting object.
    case 1000:
      errMsg = err.msg;
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
      res.status(500).send({ success: false, msg: errMsg });
      break;
    // Project.findById -> Object not found.
    case 1010:
      errMsg = err.msg;
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
      res.status(404).send({ success: false, msg: errMsg });
      break;
    //  Operating hours is empty (e.g, "operatingHours" : "")
    case 1020:
      errMsg = err.msg;
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
      res.status(500).send({ success: false, msg: errMsg });
      break;
    // Timezone undefined. (e.g., "tzname":null; tzname: ""; undefined)
    case 2000:
      errMsg = err.msg;
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
      res.status(500).send({ success: false, msg: errMsg });
      break;
    // function addOrSubstractProjcTzOffsetFromDateNow ERROR
    case 3000:
      errMsg = err.msg;
      console.log('P ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
      res.status(500).send({ success: false, msg: errMsg });
      break;
  }

}


module.exports = router;
