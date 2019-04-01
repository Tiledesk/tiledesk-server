'use strict';

var Project = require("../models/project");
var moment_tz = require('moment-timezone');
var winston = require('../config/winston');


class OperatingHoursService {

  projectIsOpenNow(projectId, callback) {

    // console.log('O ---> [ OHS ] -> PROJECT ID ', projectId)
    Project.findById(projectId, function (err, project) {
      // console.log("XXXXXXXX project", project);
      if (err) {
        winston.error("O ---> [ OHS ] -> ERROR GETTING PROJECT ", err);
        // throw error
        callback(null, { errorCode: 1000, msg: 'Error getting object.' });
        return;
      }
      if (!project) {
        winston.error("O ---> [ OHS ] -> PROJECT NOT FOUND");
        // throw error
        callback(null, { errorCode: 1010, msg: 'project not found for id', projectId });
        return;
      }

      // evaluate if is open...

      if (project) {
        // console.log("[ O ] [ H ] [ S ] -> PROJECT FOUND: ", project);
        // console.log("O ---> [ OHS ] -> PRJCT: IS ACTIVE OPERATING HOURS: ", project.activeOperatingHours);
        // console.log("O ---> [ OHS ] -> PRJCT: OBJECT OPERATING HOURS: ", project.operatingHours);


        // IF ACTIVE-OPERATING-HOURS 
        // - IS FALSE (activeOperatingHours is set to false when is created a new project) or 
        // - IS UNDEFINED (e.g.: for the project created before of the implementention of the property activeOperatingHours=false ) 
        // THE OPERATING-HOURS MUST NOT BE CONSIDERED AND THE AVAILABILITY WILL BE EVALUATED DIRECTLY ACCORDING TO 
        // AVAILABILITY OF THE USERS (THE PROJECT IS CONSIDERED OPEN 24 HOURS ON 24 AND SEVEN DAYS ON SEVEN)  
        if (project.activeOperatingHours == false || project.activeOperatingHours == undefined ) {
          // console.log('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE? -> ', project.activeOperatingHours)
          // console.log('O ---> [ OHS ] -> * USE CASE 0 * OPERATING HOURS ARE NOT ACTIVE')
          callback(true, null);
        }

        // operatingHours CAN NOT BE EMPTY - IT MUST AT LEAST CONTAIN THE TIMEZONE NAME
        // POSSO CONSIDERARLO UN ERRORE (E DI CONSEGUENZA RITORNARE UN ERRORE) 
        // O COMUNQUE VALUTARE L'INTEZIONE DELL'UTENTE CHE HA ATTIVATO GLI ORARI DI APERTURA E CONSIDERARE IL PROGETTO COME CHIUSO
        if (project.activeOperatingHours == true && project.operatingHours == '') {
          // console.log('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' BUT OBJECT OPERATING HOURS IS EMPTY')
          callback(null, { errorCode: 1020, msg: 'Operating hours is empty' });
          return;
        }

        if (project.activeOperatingHours == true) {
          // OPERATING HOURS IS ACTIVE - CHECK IF THE CURRENT TIME IS OUT OF THE TIME OF ACTIVITY
          // console.log('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE? -> ', project.activeOperatingHours, ' - CHECK HOURS')

          // PROJECT OPERATING HOURS 
          if (project.operatingHours) {
            var operatingHours = project.operatingHours
            var operatingHoursPars = JSON.parse(operatingHours)
            // console.log('O -----> [ OHS ] -> OPERATING HOURS PARSED: ', operatingHoursPars);

            var prjcTimezoneName = operatingHoursPars.tzname;

            if (prjcTimezoneName == undefined || prjcTimezoneName == '' || prjcTimezoneName == null) {
              // console.log('O ---> [ OHS ] -> PRJCT TIMEZONE NAME: ', prjcTimezoneName);
              // callback('Timezone undefined.');
              callback(null, { errorCode: 2000, msg: 'Timezone undefined.' });
              return;
              // return res.status(500).send({ success: false, msg: 'Timezone undefined.' });

            } else {
              // console.log('O ---> [ OHS ] -> PRJCT TIMEZONE NAME: ', prjcTimezoneName);

              // ==============================================================================
              //   ===================== * PROJECT TIMEZONE IS DEFINED * ====================
              // ==============================================================================

              // 1) ADD or SUBSTRACT PRJCT TZ FROM DATE NOW (is the date @ UTC 0) TO OBTAIN:
              //    THE CURRENT DATE @ THE PROJECT TZ   
              try {
                var dateNowAtPrjctTz = addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneName);
                // console.log('O ---> [ OHS ] -> *** CURRENT DATE @ THE PROJECT TZ ***', dateNowAtPrjctTz);

                // FOR DEBUG (TO VIEW, IN DEBUG, THE NAME OF THE DAY INSTEAD OF THE NUMBER OF THE DAY)
                var days = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };

                // WEEK DAY @ THE PROJECT TZ (note: the week day is represented as a number) 
                var dayNowAtPrjctTz = dateNowAtPrjctTz.getDay();
                // console.log('O ---> [ OHS ] -> *** DAY @ PRJCT TZ #', dayNowAtPrjctTz, '"', days[dayNowAtPrjctTz], '"');

                // TRASFORM IN STRING THE DATE @ THE PRJCT TZ (IS THE DATE NOW TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
                var dateNowAtPrjctTzToStr = dateNowAtPrjctTz.toISOString();

                // GET THE NEW DATE NOE HOUR
                var timeNowAtPrjctTz = dateNowAtPrjctTzToStr.substring(
                  dateNowAtPrjctTzToStr.lastIndexOf("T") + 1,
                  dateNowAtPrjctTzToStr.lastIndexOf(".")
                );
                // console.log('O ---> [ OHS ] -> **** TIME @ PRJCT TZ ', timeNowAtPrjctTz);

                var currentDayMatchesOneOfTheOpeningPrjctDays = checkDay(operatingHoursPars, dayNowAtPrjctTz);
                // console.log('O ---> [ OHS ] -> THE DAY MATCHES: ', currentDayMatchesOneOfTheOpeningPrjctDays, ' !!!' );

                if (currentDayMatchesOneOfTheOpeningPrjctDays == true) {


                  var currentTimeIsBetweenOperatingTimes = checkTimes(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz);
                  // console.log('O ---> [ OHS ] -> THE TIMES MATCHES', currentTimeIsBetweenOperatingTimes, ' !!!');
                  if (currentTimeIsBetweenOperatingTimes == true) {

                    // use case 1: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
                    //             THE CURRENT TIME (@ PRJCT TZ) IS BETWEEN THE START TIME AND THE END TIME
                    // console.log('O ---> [ OHS ] -> * USE CASE 1 * DAY & TIMES MATCHES')
                    // findAvailableUsers(req.params.projectid);
                    callback(true, null);

                  } else {

                    // use case 3: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS BUT 
                    //             THE CURRENT TIME (@ PRJCT TZ) IS ! NOT BETWEEN THE START TIME AND THE END TIME
                    // console.log('O ---> [ OHS ] -> * USE CASE 3 * DAY MATCHES BUT TIMES ! NOT')
                    // user_available_array = [];
                    // res.json(user_available_array);
                    callback(false, null);
                  }

                } else {

                  // use case 2: THE CURRENT DAY (@ PRJCT TZ) ! NOT MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
                  // console.log('O ---> [ OHS ] -> * USE CASE 2 * DAY ! NOT MATCHES')
                  // user_available_array = [];
                  // res.json(user_available_array);
                  callback(false, null);
                }

              } catch (error) {

                // console.log('O ---> [ OHS ] -> ERROR ADD/SUBSTRACT PRJCT TZ OFFSET FROM DATE NOW - ERROR: ', error)
                // return res.status(500).send({ success: false, msg: error.message });
                callback(null, { errorCode: 3000, msg: error.message });
                return;
              }

            }
          }
        }
      }

    });


  } // ./end projectIsOpenNow


}

function addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneName) {
  // DATE NOW UTC(0) IN MILLISECONDS
  var dateNowMillSec = Date.now();
  // console.log('O ---> [ OHS ] -> DATE NOW (UTC) in ms ', dateNowMillSec);

  // CONVERT DATE NOW UTC(0) FROM MS IN DATE FORMAT
  var dateNow = new Date(dateNowMillSec);
  // console.log('O ---> [ OHS ] -> FOR DEBUG - DATE NOW (UTC): ', dateNow);

  // =====================================================================
  //  === GET TIMEZONE OFFSET USING * moment-timezone * library ===
  // It returns, from the Area/Location passed, the offset in minutes of the Area/Location from UTC: 
  // > the minutes have NO sign if the timezone is after the UTC
  // > the minutes have NEGATIVE sign if the timezone is before the UTC time 
  //       ... | -10 | -9 | -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | UTC | +1 | +2 | +3 | +4 | +5 ...
  //                                                  ↑    ↑    ↑    ↑    ↑    ↑           
  //                here the minutes returned have negative sign  |  0  | here the minutes returned have no sign
  //  (e.g. for the timezone America/New_York the offset is -240) |  0  | (e.g. for the timezone Europe/Rome the offset is 120)
  //                                       
  // =====================================================================

  // ============>> using * moment-timezone * library
  var offset = moment_tz.tz(moment_tz.utc(), prjcTimezoneName).utcOffset()
  // console.log('O -----> [ OHS ] -> TIMEZONE OFFSET (USING MOMENT-TZ) ', offset);

  // console.log('O ---> [ OHS ] -> Timezone IN  ', prjcTimezoneName, ' IS ', offset, ' TyPE OF ', typeof (offset));

  if (offset < 0) {
    // console.log('O ---> [ OHS ] -> THE SIGN OF THE OFFSET RETURNED IS NEGATIVE: THE TZ IS BEFORE UTC -> OFFSET ', offset);
    var _offset = offset * -1
    // console.log('O ---> [ OHS ] -> OFFSET CONVERTED ', _offset);
    // console.log('O ---> [ OHS ] -> FOR DEBUG: ', prjcTimezoneName, 'is at "UTC(-', _offset / 60, ')"');
    // TIMEZONE OFFSET DIRECTION +
    var timezoneDirection = '-'
    // console.log('O ---> [ OHS ] -> TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

    var prjcTzOffsetMillsec = _offset * 60000;
    // console.log('O ---> [ OHS ] -> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
  } else {

    // console.log('O ---> [ OHS ] -> THE SIGN OF THE OFFSET RETURNED IS ! NOT NEGATIVE: THE TZ IS AFTER UTC OR IS UTC -> OFFSET ', offset)
    // console.log('O ---> [ OHS ] -> FOR DEBUG: ', prjcTimezoneName, 'is at "UTC(+', offset / 60, ')"');
    var timezoneDirection = '+'
    // console.log('O ---> [ OHS ] -> TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

    var prjcTzOffsetMillsec = offset * 60000;
    // console.log('O ---> [ OHS ] -> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
  }


  // https://stackoverflow.com/questions/5834318/are-variable-operators-possible
  var operators = {
    '+': function (dateNowMs, tzMs) { return dateNowMs + tzMs },
    '-': function (dateNowMs, tzMs) { return dateNowMs - tzMs },
  }

  // ON THE BASIS OF 'TIMEZONE DIRECTION' ADDS OR SUBSTRATES THE 'TIMEZONE OFFSET' (IN MILLISECONDS) OF THE PROJECT TO THE 'DATE NOW' (IN MILLISECONDS)
  var newDateNowMs = operators[timezoneDirection](dateNowMillSec, prjcTzOffsetMillsec)
  // console.log('O ---> [ OHS ] -> DATE@PRJCT TZ (in ms):', newDateNowMs, ' IS = TO THE DATE NOW UTC ', dateNowMillSec, ' (in ms)', timezoneDirection, 'PRJC TZ OFFSET (in ms): ', prjcTzOffsetMillsec)

  // TRANSFORM IN DATE THE DATE NOW (IN MILLSEC) TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
  var newDateNow = new Date(newDateNowMs);

  return newDateNow

}

function checkDay(operatingHoursPars, dayNowAtPrjctTz) {
  // FOR DEBUG (TO VIEW, IN DEBUG, THE NAME OF THE DAY INSTEAD OF THE NUMBER OF THE DAY)
  var days = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };
  for (var operatingHoursweekDay in operatingHoursPars) {
    if (operatingHoursweekDay != 'tzname') {
      if (dayNowAtPrjctTz == operatingHoursweekDay) {
        winston.debug('O ---> [ OHS ] -> CURRENT DAY "', days[dayNowAtPrjctTz], '" (CALCUCATE @THE PRJCT TZ) MATCHES TO THE PRJCT OPENING DAY "', days[operatingHoursweekDay], '"');

        return true
      }

    }
  }
}

function checkTimes(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz) {
  for (var operatingHoursweekDay in operatingHoursPars) {
    if (operatingHoursweekDay != 'tzname') {
      if (dayNowAtPrjctTz == operatingHoursweekDay) {

        // FOR DEBUG (TO VIEW, IN DEBUG, THE NAME OF THE DAY INSTEAD OF THE NUMBER OF THE DAY)
        var days = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };

        var result = false;
        operatingHoursPars[operatingHoursweekDay].forEach(operatingHour => {
          // console.log('O -----> [ OHS ] -> OPERATING HOUR ', operatingHour)
          var startTime = operatingHour.start;
          var endTime = operatingHour.end;
          // console.log('CURRENT TIME (@THE PRJCT TZ) ', timeNowAtPrjctTz);
          // console.log('O ---> [ OHS ] -> on', days[dayNowAtPrjctTz], 'the START OPERATING HOURS is AT: ', startTime);
          // console.log('O ---> [ OHS ] -> on', days[dayNowAtPrjctTz], 'the END OPERATING HOURS is AT: ', endTime);

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
          // console.log('O ---> [ OHS ] -> CURRENT TIME', moment_currentTime, ' (@THE PRJCT TZ) IS BETWEEN OH-Start:', moment_StartTime, ' OH-End ', moment_EndTime, '->', currentTimeIsBetween);

          if (currentTimeIsBetween == true) {
            // USE CASE: THE OPERATING HOURS ARE ACTIVE AND THE DAY OF THE REQUEST MATCH WITH THE OPERATING HOURS WEEK-DAY
            //           but the time of the request is outside the OPERATING hours
            // console.log('O -----> [ OHS ] -> THE CURRENT TIME (@THE PRJCT TZ) MATCHES WITH THE OPERATING HOURS')

            result = true;
          }

        });
        return result;
      }
    }
  }
}



var operatingHoursService = new OperatingHoursService();

module.exports = operatingHoursService;
