var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Project = require("../models/project");
var Project_user = require("../models/project_user");
var Department = require("../models/department");
var mongoose = require('mongoose');

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
    createdBy: req.user.id,
    updatedBy: req.user.id
  });
  // console.log('NEW PROJECT ', newProject)

  newProject.save(function (err, savedProject) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    // console.log('--- SAVE PROJECT ', savedProject)
    //res.json(savedProject);

    // PROJECT-USER POST
    var newProject_user = new Project_user({
      _id: new mongoose.Types.ObjectId(),
      id_project: savedProject._id,
      id_user: req.user.id,
      role: 'owner',
      user_available: true,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    newProject_user.save(function (err, savedProject_user) {
      if (err) {
        console.log('--- > ERROR ', err)
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
        console.log('--- > ERROR ', err)
        // return res.status(500).send({ success: false, msg: 'Error saving object.' });
      }
      console.log('Default Department created')
      // res.json(savedDepartment);
    });
  });
});

// PROJECT PUT
router.put('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  console.log('UPDATE PROJECT REQ BODY ', req.body);
  Project.findByIdAndUpdate(req.params.projectid, req.body, { new: true, upsert: true }, function (err, updatedProject) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedProject);
  });
});

// PROJECT DELETE
router.delete('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  console.log(req.body);
  Project.remove({ _id: req.params.projectid }, function (err, project) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(project);
  });
});

// PROJECT GET DETAIL
router.get('/:projectid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  console.log(req.body);
  Project.findById(req.params.projectid, function (err, project) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!project) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(project);
  });
});

// GET ALL PROJECTS BY CURRENT USER ID
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  console.log('REQ USER ID ', req.user.id)
  Project_user.find({ id_user: req.user.id }).
    populate('id_project').
    exec(function (err, projects) {
      console.log('ERR: ', err, ' - PROJ: ', projects)
      // if (err) return next(err);
      res.json(projects);
    });
});

// NEW -  RETURN  THE USER NAME AND THE USER ID OF THE AVAILABLE PROJECT-USER FOR THE PROJECT ID PASSED
router.get('/:projectid/users/availables', function (req, res) {
  console.log("PROJECT ROUTES FINDS AVAILABLES project_users: projectid", req.params.projectid);
  Project_user.find({ id_project: req.params.projectid, user_available: true }).
    populate('id_user').
    exec(function (err, project_users) {
      console.log('PROJECT ROUTES - FINDS AVAILABLES project_users: ', project_users);
      if (project_users) {
        console.log('PROJECT ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);
      }
      user_available_array = [];
      project_users.forEach(project_user => {
        console.log('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
        user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
      });

      console.log('ARRAY OF THE AVAILABLE USER ', user_available_array);

      res.json(user_available_array);
    });

});

// NEW - TIMETABLES AND AVAILABLE USERS
router.get('/:projectid/users/newavailables', function (req, res) {
  // orari attivi?
  //  no > goto: normal
  //  si > 
  //    now = Date();
  //    tomorrow = Date() + 24;
  //    Project.openAt?(projectId, tomorrow, function() {
  //      no > rispondi con user_available_array = []; return;
  //      si > goto: normal
  //    });0

  // normal:
  console.log("PROJECT-ROUTES - NEW AVAILABLES - projectid: ", req.params.projectid);
  console.log("PROJECT-ROUTES - NEW AVAILABLES - REQ BODY: ", req.body);
  Project.findById(req.params.projectid, function (err, project) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!project) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    console.log("PROJECT-ROUTES - NEW AVAILABLES - REQ BODY: ", project);

    if (project) {

      if (project.activeOperatingHours === true) {
        // OPERATING HOURS IS ACTIVE - CHECK IF THE CURRENT TIME IS OUT OF THE TIME OF ACTIVITY
        console.log('»»» OPERATING HOURS IS ACTIVE - CHECK HOURS')

        // DATE NOW UTC(0) IN MILLISECONDS
        var dateNowMillSec = Date.now();
        console.log('»»» DATE NOW (UTC(0) in ms)', dateNowMillSec);

        // CONVERT DATE NOW UTC(0) FROM MS IN DATE FORMAT
        var dateNow = new Date(dateNowMillSec);
        console.log('* * »»»» FOR DEBUG - DATE NOW (UTC(0)): ', dateNow);

        // PROJECT OPERATING HOURS 
        var operatingHours = project.operatingHours
        var operatingHoursPars = JSON.parse(operatingHours)
        console.log('»»» OPERATING HOURS PARSED: ', operatingHoursPars);

        // PROJECT TIMEZONE OFFSET (from the UTC(0)) (e.g: +2)
        var prjcTimezoneOffset = operatingHoursPars.tz
        console.log('»»» OPERATING HOURS -> TIMEZONE OFFSET: ', prjcTimezoneOffset);

        // PROJECT TIMEZONE OFFSET (from the UTC(0)) HOUR (e.g: 2)
        var prjcTimezoneOffsetHour = prjcTimezoneOffset.substr(1);
        console.log('TIMEZONE OFFSET HOUR: ', prjcTimezoneOffsetHour);

        // PROJECT TIMEZONE OFFSET HOUR CONVERTED IN MS
        var prjcTimezoneOffsetMillSec = prjcTimezoneOffsetHour * 3600000;
        console.log('TIMEZONE OFFSET HOUR in MS: ', prjcTimezoneOffsetMillSec);

        // console.log('DATE NOW (to STRING): ', dateNow.toString());

        // TIMEZONE OFFSET DIRECTION (e.g.: + or -)
        var timezoneDirection = prjcTimezoneOffset.charAt(0)
        console.log('TIMEZONE OFFSET DIRECTION: ', timezoneDirection);


        // https://stackoverflow.com/questions/5834318/are-variable-operators-possible
        var operators = {
          '+': function (dateNowMs, tzMs) { return dateNowMs + tzMs },
          '-': function (dateNowMs, tzMs) { return dateNowMs - tzMs },
        }

        // ON THE BASIS OF 'TIMEZONE DIRECTION' ADDS OR SUBSTRATES THE 'TIMEZONE OFFSET' (IN MILLISECONDS) OF THE PROJECT TO THE 'DATE NOW' (IN MILLISECONDS)
        var newDateNowMs = operators[timezoneDirection](dateNowMillSec, prjcTimezoneOffsetMillSec)
        // var dateNowPlusTzOffsetMs = dateNowMillSec + timezoneOffsetMillSec
        console.log('NEW DATE NOW (in ms) (IS THE DATE NOW UTC(0)', timezoneDirection, 'PRJC TZ OFFSET (in ms): ', newDateNowMs)

        // TRANSFORM IN DATE THE DATE NOW (IN MILLSEC) TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
        var newDateNow = new Date(newDateNowMs);
        // var dateNowPlusTzOffset = new Date(1529249066000);
        console.log('* * »»»» NEW DATE NOW ', newDateNow);

        // console.log('»»»» ', typeof (hour));
        // GET THE NEW DATE NOW DAY 
        var newDateNow_weekDay = newDateNow.getDay();
        console.log('* * »»»» NEW DATE NOW -> WEEK DAY ', newDateNow_weekDay);

        // TRASFORM IN STRING THE NEW DATE NOW (IS THE DATE NOW TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
        var newDateNowTOStr = newDateNow.toISOString();

        // GET THE NEW DATE NOE HOUR
        var newDateNow_hour = newDateNowTOStr.substring(
          newDateNowTOStr.lastIndexOf("T") + 1,
          newDateNowTOStr.lastIndexOf(".")
        );
        console.log('* * »»»» NEW DATE NOW -> HOURS ', newDateNow_hour);

        // operatingHoursPars.forEach(operatingHour => {
        //   console.log('OPERATING HOUR ', operatingHour)
        // });


        // il date.string ritorna la data al timestamp corrente
        // var dateNowPlusTzOffsetToStr = dateNowPlusTzOffset.toString();
        // console.log('DATE NOW + OFFSET (to STRING): ', dateNowPlusTzOffsetToStr);

        // var date = new Date();
        // console.log('»»» DATE ', date.toUTCString());
        // console.log('»»» DATE 2', date.toLocaleTimeString());

        // console.log('FORMATTED DATA ', formattedTime);
        // var timestamp = timestampMillSec / 1000
        // console.log('»»» NOW TIMESTAMP ', timestamp);

      } else {
        // OPERATING HOURS IS NOT ACTIVE - NORMALLY PROCESS
        console.log('»»» OPERATING HOURS IS NOT ACTIVE')
        Project_user.find({ id_project: req.params.projectid, user_available: true }).
          populate('id_user').
          exec(function (err, project_users) {
            console.log('PROJECT ROUTES - FINDS AVAILABLES project_users: ', project_users);
            if (project_users) {
              console.log('PROJECT ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);
            }
            user_available_array = [];
            project_users.forEach(project_user => {
              console.log('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
              user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
            });

            console.log('ARRAY OF THE AVAILABLE USER ', user_available_array);

            res.json(user_available_array);
          });
      }
    }
    // res.json(project);
  });



  // Project_user.find({ id_project: req.params.projectid, user_available: true }).
  //   populate('id_user').
  //   exec(function (err, project_users) {
  //     console.log('PROJECT ROUTES - FINDS AVAILABLES project_users: ', project_users);
  //     if (project_users) {
  //       console.log('PROJECT ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);
  //     }
  //     user_available_array = [];
  //     project_users.forEach(project_user => {
  //       console.log('PROJECT ROUTES - AVAILABLES PROJECT-USER: ', project_user)
  //       user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
  //     });

  //     console.log('ARRAY OF THE AVAILABLE USER ', user_available_array);

  //     res.json(user_available_array);
  //   });

});

module.exports = router;
