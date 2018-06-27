var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Project = require("../models/project");
var Project_user = require("../models/project_user");
var Department = require("../models/department");
var mongoose = require('mongoose');

var getTimezoneOffset = require("get-timezone-offset")

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

      // for debug 
      if (project.operatingHours) {
        // console.log('»»» OPERATING HOURS IS NOT EMPTY ')
        var operatingHoursIsEmpty = false
      } else {
        console.log('»»» OPERATING HOURS IS EMPTY ')
        var operatingHoursIsEmpty = true
      }

      // for debug 
      if (project.activeOperatingHours == true) {
        // console.log('»»» OPERATING HOURS IS NOT ACTIVE ')
        var operatingHoursIsActive = true
      } else {
        // console.log('»»» OPERATING HOURS IS NOT ACTIVE ')
        var operatingHoursIsActive = false
      }

      if (project.activeOperatingHours == true && project.operatingHours == '') {

        console.log('»»» OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' BUT OBJECT OPERATING HOURS IS EMPTY')
        user_available_array = [];
        res.json(user_available_array);

        return;
      }

      if (project.activeOperatingHours == true) {
        // OPERATING HOURS IS ACTIVE - CHECK IF THE CURRENT TIME IS OUT OF THE TIME OF ACTIVITY
        console.log('»»» OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' - CHECK HOURS')

        // PROJECT OPERATING HOURS 
        var operatingHours = project.operatingHours
        var operatingHoursPars = JSON.parse(operatingHours)
        console.log('»»» OPERATING HOURS PARSED: ', operatingHoursPars);
        // PROJECT TIMEZONE OFFSET (from the UTC(0)) (e.g: +2)
        var prjcTimezoneOffset = operatingHoursPars.tz;
        var prjcTimezoneName = operatingHoursPars.tzname;

        console.log('»»» OPERATING HOURS -> PRJCT TIMEZONE OFFSET NAME: ', prjcTimezoneOffset);
        console.log('»»» OPERATING HOURS -> PRJCT TIMEZONE OFFSET HOURS: ', prjcTimezoneName);

        if (prjcTimezoneOffset == undefined) {
          return res.status(500).send({ success: false, msg: 'Timezone undefined.' });
        }

        var dateNowAtPrjctTz = addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneOffset, prjcTimezoneName)

        console.log('* * »»»» CURRENT DATE @ THE PROJECT TZ', dateNowAtPrjctTz)

        // FOR DEBUG (TO VIEW, IN DEBUG, THE NAME OF THE DAY INSTEAD OF THE NUMBER OF THE DAY)
        days = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };
        // console.log('»»»» ', typeof (hour));

        // WEEK DAY @ THE PROJECT TZ (note: the week day is represented as a number) 
        var dayNowAtPrjctTz = dateNowAtPrjctTz.getDay();
        console.log('* * »»»» WEEK DAY @ PRJCT TZ #', dayNowAtPrjctTz, '"', days[dayNowAtPrjctTz], '"');

        // TRASFORM IN STRING THE DATE @ THE PRJCT TZ (IS THE DATE NOW TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
        var dateNowAtPrjctTzToStr = dateNowAtPrjctTz.toISOString();

        // GET THE NEW DATE NOE HOUR
        var timeNowAtPrjctTz = dateNowAtPrjctTzToStr.substring(
          dateNowAtPrjctTzToStr.lastIndexOf("T") + 1,
          dateNowAtPrjctTzToStr.lastIndexOf(".")
        );
        console.log('* * »»»» TIME @ PRJCT TZ ', timeNowAtPrjctTz);
        // console.log('TYPE OF OPERATING HOURS PARSED ', typeof (operatingHoursPars))
        // console.log('DAYS 0 ', days[0]);

        // dayNowAtPrjctTz_MatchesTo_OperatingHoursDay
        var currentDayMatchesProjectDay = checkWeekDays(operatingHoursPars, dayNowAtPrjctTz);
        console.log('»»»»»»»»»»»»»  WDAY MATCHES', currentDayMatchesProjectDay)

        if (currentDayMatchesProjectDay == true) {


          var currentTimeIsBetweenOperatingTimes = checkTimes(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz);
          console.log('»»»»»»»»»»»»»  TIMES MATCHES', currentTimeIsBetweenOperatingTimes);
          if (currentTimeIsBetweenOperatingTimes == true) {

            // use case 1: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
            //           THE CURRENT TIME (@ PRJCT TZ) IS BETWEEN THE START TIME AND THE END TIME
            console.log('USE CASE 1')
            findAvailableUsers(req.params.projectid);

          } else {

            // use case 3: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
            //           THE CURRENT TIME (@ PRJCT TZ) IS ! NOT BETWEEN THE START TIME AND THE END TIME
            console.log('USE CASE 3')
            user_available_array = [];
            res.json(user_available_array);
          }

        } else {

          // use case 2: THE CURRENT DAY (@ PRJCT TZ) ! NOT MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
          console.log('USE CASE 2')
          user_available_array = [];
          res.json(user_available_array);
        }

        // prjctIsOpenAt(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz);

        // console.log('/* /* /* CALL RESULT', result);
        // if (result == 'dayAndTimeMatches') {
        //   findAvailableUsers(req.params.projectid);

        // } else {

        //   user_available_array = [];
        //   res.json(user_available_array);
        // }


      } else {
        // OPERATING HOURS IS NOT ACTIVE or OPERATING HOURS IS EMPTY - NORMALLY PROCESS
        console.log('»»» OPERATING HOURS IS ACTIVE ', operatingHoursIsActive)
        console.log('»»» OPERATING HOURS IS EMPTY ', operatingHoursIsEmpty)


        findAvailableUsers(req.params.projectid);

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
      }
    }
  });

  function checkWeekDays(operatingHoursPars, dayNowAtPrjctTz) {
    for (var operatingHoursweekDay in operatingHoursPars) {
      if (operatingHoursweekDay != 'tz') {
        if (dayNowAtPrjctTz == operatingHoursweekDay) {
          console.log(':) :) THE CURRENT DAY "', days[dayNowAtPrjctTz], '" (@THE PRJCT TZ) MATCHES TO OPERATING-HOURS WEEK-DAY "', days[operatingHoursweekDay], '"');

          return true
        }

      }
    }
  }

  function checkTimes(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz) {
    for (var operatingHoursweekDay in operatingHoursPars) {
      if (operatingHoursweekDay != 'tz') {
        if (dayNowAtPrjctTz == operatingHoursweekDay) {

          var result = false;
          operatingHoursPars[operatingHoursweekDay].forEach(operatingHour => {
            console.log('OPERATING HOUR ', operatingHour)
            var startTime = operatingHour.start;
            var endTime = operatingHour.end;
            console.log('CURRENT TIME (@THE PRJCT TZ) ', timeNowAtPrjctTz);
            console.log('on', days[dayNowAtPrjctTz], 'the START OPERATING HOURS is AT: ', startTime);
            console.log('on', days[dayNowAtPrjctTz], 'the END OPERATING HOURS is AT: ', endTime);

            // MOMENT 
            var moment = require('moment');
            // var currentTime = moment();
            // console.log('MOMEMT CURRENT TIME ', currentTime)
            var moment_currentTime = moment(timeNowAtPrjctTz, "HH:mm");
            var moment_StartTime = moment(startTime, "HH:mm");
            var moment_EndTime = moment(endTime, "HH:mm");
            // console.log('MOMENT REQUEST TIME (@THE PROJECT UTC)', moment_newDateNow_hour);
            // console.log('MOMENT START TIME ', moment_StartTime);
            // console.log('MOMENT ./END TIME ', moment_EndTime);

            var currentTimeIsBetween = moment_currentTime.isBetween(moment_StartTime, moment_EndTime);
            console.log(':) :) THE CURRENT TIME (@THE PRJCT TZ) IS BETWEEN OPERATING HOURS ', currentTimeIsBetween);

            if (currentTimeIsBetween == true) {
              // USE CASE: THE OPERATING HOURS ARE ACTIVE AND THE DAY OF THE REQUEST MATCH WITH THE OPERATING HOURS WEEK-DAY
              //           but the time of the request is outside the OPERATING hours
              console.log('THE CURRENT TIME (@THE PRJCT TZ) MATCHES WITH THE OPERATING HOURS')

              result = true;
            }

          });
          return result;
        }
      }
    }
  }

  function findAvailableUsers(projectid) {
    Project_user.find({ id_project: projectid, user_available: true }).
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

  function addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneOffset, prjcTimezoneName) {
    // DATE NOW UTC(0) IN MILLISECONDS
    var dateNowMillSec = Date.now();
    console.log('»»» DATE NOW (UTC(0) in ms)', dateNowMillSec);

    // CONVERT DATE NOW UTC(0) FROM MS IN DATE FORMAT
    var dateNow = new Date(dateNowMillSec);
    console.log('* * »»»» FOR DEBUG - DATE NOW (UTC(0)): ', dateNow);

    var prjct_timezone_name = prjcTimezoneName
    console.log('K --> PROJECT TIMEZONE NAME ', prjct_timezone_name);

    // =====================================================================
    //  === NEW - GET TIMEZONE OFFSET USING get-timezone-offset library ===
    // It returns, from the Area/Location passed, the offset in minutes of the Area/Location from UTC: 
    // > the minutes have negative sign if the timezone is after the UTC
    // > the minutes have no sign if the timezone is before the UTC time 
    // ... | -10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | UTC | +1 | +2 | +3 | +4 | +5 ...
    //                                                 ↑    ↑    ↑     ↑    ↑    ↑           
    //                    here the minutes returned have no sign    | here the minutes returned have negative sign
    //     (e.g. for the timezone Europe/Rome the offset is -120)   | (e.g. for the timezone Europe/Rome the offset is -120)
    //                                       
    // =====================================================================
    var now = new Date();
    console.log('K --> NOW ', now)

    // ======== OFFSET TEST Area/Location
    // var offset = getTimezoneOffset('America/New_York', now);
    // var offset = getTimezoneOffset('Etc/UTC', now);
    var offset = getTimezoneOffset('America/Argentina/Rio_Gallegos', now);
    

    // var offset = getTimezoneOffset(prjct_timezone_name, now);

    console.log('K --> Timezone IN  ', prjct_timezone_name, ' IS ', offset, ' TyPE OF ', typeof (offset));



    // var offsetStr = offset.toString();
    // console.log('K --> Timezone IN  ', prjct_timezone_name, ' IS ', offsetStr, ' TyPE OF ', typeof (offsetStr));
    // var prjcTzOffsetMin = offsetStr.substr(1);
    // console.log('K --> TIMEZONE OFFSET MINUTE: ', prjcTzOffsetMin);
    // var prjcTzOffsetMillsec = prjcTzOffsetMin * 60000;
    // console.log('K --> TIMEZONE OFFSET MILLISECONDS: ', prjcTzOffsetMillsec);

    if (offset < 0) {
      console.log('K --> THE SIGN OF THE OFFSET RETURNED IS NEGATIVE: THE TZ IS AFTER UTC -> OFFSET ', offset);
      var _offset = offset * -1
      console.log('K --> OFFSET CONVERTED ', _offset);
      console.log('K --> FOR DEBUG: ', prjct_timezone_name, 'is at "UTC(+', _offset / 60, ')"');
      // TIMEZONE OFFSET DIRECTION +
      var timezoneDirection = '+'
      console.log('TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

      var prjcTzOffsetMillsec = _offset * 60000;
      console.log('K --> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
    } else {

      console.log('K --> THE SIGN OF THE OFFSET RETURNED IS ! NOT NEGATIVE: THE TZ IS BEFORE UTC OR IS UTC -> OFFSET ', offset)
      console.log('K --> FOR DEBUG: ', prjct_timezone_name, 'is at "UTC(-', offset / 60, ')"');
      var timezoneDirection = '-'
      console.log('TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

      var prjcTzOffsetMillsec = offset * 60000;
      console.log('K --> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
    }


    // PROJECT TIMEZONE OFFSET (from the UTC(0)) HOUR (e.g: 2)
    // var prjcTimezoneOffsetHour = prjcTimezoneOffset.substr(1);
    // console.log('TIMEZONE OFFSET HOUR: ', prjcTimezoneOffsetHour);

    // PROJECT TIMEZONE OFFSET HOUR CONVERTED IN MS
    // var prjcTimezoneOffsetMillSec = prjcTimezoneOffsetHour * 3600000;
    // console.log('TIMEZONE OFFSET HOUR in MS: ', prjcTimezoneOffsetMillSec);

    // TIMEZONE OFFSET DIRECTION (e.g.: + or -)
    // var timezoneDirection = prjcTimezoneOffset.charAt(0)
    // console.log('TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

    // https://stackoverflow.com/questions/5834318/are-variable-operators-possible
    var operators = {
      '+': function (dateNowMs, tzMs) { return dateNowMs + tzMs },
      '-': function (dateNowMs, tzMs) { return dateNowMs - tzMs },
    }

    // ON THE BASIS OF 'TIMEZONE DIRECTION' ADDS OR SUBSTRATES THE 'TIMEZONE OFFSET' (IN MILLISECONDS) OF THE PROJECT TO THE 'DATE NOW' (IN MILLISECONDS)
    // var newDateNowMs = operators[timezoneDirection](dateNowMillSec, prjcTimezoneOffsetMillSec)
    // console.log('NEW DATE NOW (in ms) (IS THE DATE NOW UTC(0)', timezoneDirection, 'PRJC TZ OFFSET (in ms): ', newDateNowMs)

    var newDateNowMs = operators[timezoneDirection](dateNowMillSec, prjcTzOffsetMillsec)
    console.log('DATE @ the PRJCT TZ (in ms):', newDateNowMs, ' IS = TO THE DATE NOW UTC ', dateNowMillSec, ' (in ms)', timezoneDirection, 'PRJC TZ OFFSET (in ms): ', prjcTzOffsetMillsec)

    // TRANSFORM IN DATE THE DATE NOW (IN MILLSEC) TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
    var newDateNow = new Date(newDateNowMs);


    return newDateNow

  }



  function prjctIsOpenAt(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz) {
    // ====================================================================================================================
    //    ===  RUN A FOR LOOP TO DETERMINE IF THE CURRENT-DAY MATCHS WITH ONES OF THE WEEKDAY OF THE OPERATING HOURS  ===
    // ====================================================================================================================

    for (var operatingHoursweekDay in operatingHoursPars) {
      if (operatingHoursweekDay != 'tz') {
        // console.log("weekDay (as number): " + operatingHoursweekDay);
        // console.log("OpetatingHours: " + operatingHoursPars[operatingHoursweekDay]);

        // - USE CASE 1) THE CURRENT DAY (@THE PRJCT TZ) MATCHES TO A WEEK-DAY OF THE OPERATING HOURS:
        //   -- USE CASE 1A) THE CURRENT TIME (@THE PRJCT TZ) IS !NOT BETWEEN 
        //                   THE START TIME AND THE END TIME OF THE OPERATING HOURS: 
        //                   RETURNS THE ARRAY OF THE AVAILABLE USERS EMPTY
        //
        //   -- USE CASE 1B) THE CURRENT TIME (@THE PRJCT TZ) IS BETWEEN 
        //                   THE START TIME AND THE END TIME THE OPERATING HOURS: 
        //                   RUNS 'FIND AVAILABLE USERS' 
        //
        // - USE CASE 2) THE CURRENT DAY (@THE PRJCT TZ) DOES !NOT MATCHES A WEEK-DAY OF THE OPERATING HOURS:
        //               RETURN THE ARRAY OF USERS AVAILABLE EMPTY
        if (dayNowAtPrjctTz == operatingHoursweekDay) {
          console.log(':) :) THE CURRENT DAY "', days[dayNowAtPrjctTz], '" (@THE PRJCT TZ) MATCHES TO OPERATING-HOURS WEEK-DAY "', days[operatingHoursweekDay], '"')


          operatingHoursPars[operatingHoursweekDay].forEach(operatingHour => {
            console.log('OPERATING HOUR ', operatingHour)
            var startTime = operatingHour.start;
            var endTime = operatingHour.end;
            console.log('CURRENT TIME (@THE PRJCT TZ) ', timeNowAtPrjctTz);
            console.log('on', days[dayNowAtPrjctTz], 'the START OPERATING HOURS is AT: ', startTime);
            console.log('on', days[dayNowAtPrjctTz], 'the END OPERATING HOURS is AT: ', endTime);

            // MOMENT 
            var moment = require('moment');
            // var currentTime = moment();
            // console.log('MOMEMT CURRENT TIME ', currentTime)
            var moment_currentTime = moment(timeNowAtPrjctTz, "HH:mm");
            var moment_StartTime = moment(startTime, "HH:mm");
            var moment_EndTime = moment(endTime, "HH:mm");
            // console.log('MOMENT REQUEST TIME (@THE PROJECT UTC)', moment_newDateNow_hour);
            // console.log('MOMENT START TIME ', moment_StartTime);
            // console.log('MOMENT ./END TIME ', moment_EndTime);

            var currentTimeIsBetween = moment_currentTime.isBetween(moment_StartTime, moment_EndTime);
            console.log(':) :) THE CURRENT TIME (@THE PRJCT TZ) IS BETWEEN OPERATING HOURS ', currentTimeIsBetween);

            if (currentTimeIsBetween == false) {
              // USE CASE: THE OPERATING HOURS ARE ACTIVE AND THE DAY OF THE REQUEST MATCH WITH THE OPERATING HOURS WEEK-DAY
              //           but the time of the request is outside the OPERATING hours
              console.log('THE CURRENT DAY (@THE PRJCT TZ) MATCHES ! BUT THE CURRENT TIME (@THE PRJCT TZ) IS OUTSIDE THE OPERATING HOURS')


              result = 'onlyDayMatches';


            } else {
              console.log(':) :) THE CURRENT DAY AND THE CURRENT TIME (@THE PRJCT TZ) MATCHES WITH THE OPERATING HOURS SO:')
              console.log('      ---> OK WE ARE OPENED -> RUNS: FIND THE AVAILABLE OPERATORS <---');

              result = 'dayAndTimeMatches'

            }
          });
        }
        else {

          // USE CASE: THE OPERATING HOURS ARE ACTIVE BUT THE DAY OF THE REQUEST DOES NOT MATCH WITH THE OPERATING HOURS WEEK-DAY
          //          SO IS TO CONSIDER AS NO USER AVAILABLE 
          console.log('!!! THE CURRENT DAY: "', days[dayNowAtPrjctTz], '" (@THE PRJCT TZ)  NOT MATCHES TO THE OPERATING-HOURS WEEK-DAY: "', days[operatingHoursweekDay], '"')
          // console.log('THE DAY NOT MATCHS - SORRY WE ARE CLOSED');

          result = 'dayNotMatches'

        }
      }
    }
  }




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
