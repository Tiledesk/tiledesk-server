'use strict';

var Project = require("../models/project");
var moment_tz = require('moment-timezone');
var winston = require('../config/winston');
var cacheUtil = require('../utils/cacheUtil');
var cacheEnabler = require("../services/cacheEnabler");

class OperatingHoursService {

  projectIsOpenNow(projectId, callback) {

    // winston.debug('O ---> [ OHS ] -> PROJECT ID ', projectId)
    let q = Project.findOne({_id: projectId, status: 100});
    if (cacheEnabler.project) { 
      q.cache(cacheUtil.longTTL, "projects:id:"+projectId)  //project_cache
      winston.debug('project cache enabled for projectIsOpenNow');
    }
    q.exec(function (err, project) {
      // winston.debug("XXXXXXXX project", project);
      if (err) {
        winston.error("O ---> [ OHS ] -> ERROR GETTING PROJECT ", err);
        // throw error
        callback(null, { errorCode: 1000, msg: 'Error getting object.' });
        return;
      }
      if (!project) {
        winston.warn("OperatingHoursService projectIsOpenNow Project not found with id: " + projectId);
        // throw error
        callback(null, { errorCode: 1010, msg: 'project not found for id', projectId });
        return;
      }



      // evaluate if is open...

      if (project) {

        // IF THE TRIAL IS EXPIRED OR IF THE SUBSCIPTION IS NOT ACTIVE THE PROJECT IS ALWAYS OPEN EVEN IF activeOperatingHours IS SETTED TO true AND, FOR EXAMPLE,
        // THE USER HAS SETTED ALL DAYS TO CLOSED

                              //secondo me qui manca un parentesi tonda per gli or
        if (project.profile && (project.profile.type === 'free' && project.trialExpired === true) || (project.profile.type === 'payment' && project.isActiveSubscription === false)) {
          winston.debug('O ---> [ OHS ] -> trial Expired OR Subscription NOT Active - PROJECT ALWAYS OPEN') 
          callback(true, null) ;
          return;
        }


        // winston.debug("[ O ] [ H ] [ S ] -> PROJECT FOUND: ", project);
        // winston.debug("O ---> [ OHS ] -> PRJCT: IS ACTIVE OPERATING HOURS: ", project.activeOperatingHours);
        // winston.debug("O ---> [ OHS ] -> PRJCT: OBJECT OPERATING HOURS: ", project.operatingHours);


        // IF ACTIVE-OPERATING-HOURS 
        // - IS FALSE (activeOperatingHours is set to false when is created a new project) or 
        // - IS UNDEFINED (e.g.: for the project created before of the implementention of the property activeOperatingHours=false ) 
        // THE OPERATING-HOURS MUST NOT BE CONSIDERED AND THE AVAILABILITY WILL BE EVALUATED DIRECTLY ACCORDING TO 
        // AVAILABILITY OF THE USERS (THE PROJECT IS CONSIDERED OPEN 24 HOURS ON 24 AND SEVEN DAYS ON SEVEN)  
        if (project.activeOperatingHours == false || project.activeOperatingHours == undefined ) {
          // winston.debug('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE? -> ', project.activeOperatingHours)
          // winston.debug('O ---> [ OHS ] -> * USE CASE 0 * OPERATING HOURS ARE NOT ACTIVE')
          callback(true, null);
        }

        // operatingHours CAN NOT BE EMPTY - IT MUST AT LEAST CONTAIN THE TIMEZONE NAME
        // POSSO CONSIDERARLO UN ERRORE (E DI CONSEGUENZA RITORNARE UN ERRORE) 
        // O COMUNQUE VALUTARE L'INTEZIONE DELL'UTENTE CHE HA ATTIVATO GLI ORARI DI APERTURA E CONSIDERARE IL PROGETTO COME CHIUSO
        if (project.activeOperatingHours == true && project.operatingHours == '') {
          // winston.debug('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE', project.activeOperatingHours, ' BUT OBJECT OPERATING HOURS IS EMPTY')
          callback(null, { errorCode: 1020, msg: 'Operating hours is empty' });
          return;
        }

        if (project.activeOperatingHours == true) {
          // OPERATING HOURS IS ACTIVE - CHECK IF THE CURRENT TIME IS OUT OF THE TIME OF ACTIVITY
          // winston.debug('O ---> [ OHS ] -> OPERATING HOURS IS ACTIVE? -> ', project.activeOperatingHours, ' - CHECK HOURS')

          // PROJECT OPERATING HOURS 
          if (project.operatingHours) {
            var operatingHours = project.operatingHours
            var operatingHoursPars = JSON.parse(operatingHours)
            // winston.debug('O -----> [ OHS ] -> OPERATING HOURS PARSED: ', operatingHoursPars);

            var prjcTimezoneName = operatingHoursPars.tzname;

            if (prjcTimezoneName == undefined || prjcTimezoneName == '' || prjcTimezoneName == null) {
              // winston.debug('O ---> [ OHS ] -> PRJCT TIMEZONE NAME: ', prjcTimezoneName);
              // callback('Timezone undefined.');
              callback(null, { errorCode: 2000, msg: 'Timezone undefined.' });
              return;
              // return res.status(500).send({ success: false, msg: 'Timezone undefined.' });

            } else {
              // winston.debug('O ---> [ OHS ] -> PRJCT TIMEZONE NAME: ', prjcTimezoneName);

              // ==============================================================================
              //   ===================== * PROJECT TIMEZONE IS DEFINED * ====================
              // ==============================================================================

              // 1) ADD or SUBSTRACT PRJCT TZ FROM DATE NOW (is the date @ UTC 0) TO OBTAIN:
              //    THE CURRENT DATE @ THE PROJECT TZ   
              try {
                var dateNowAtPrjctTz = addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneName);
                // winston.debug('O ---> [ OHS ] -> *** CURRENT DATE @ THE PROJECT TZ ***', dateNowAtPrjctTz);

                // FOR DEBUG (TO VIEW, IN DEBUG, THE NAME OF THE DAY INSTEAD OF THE NUMBER OF THE DAY)
                var days = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday' };

                // WEEK DAY @ THE PROJECT TZ (note: the week day is represented as a number) 
                var dayNowAtPrjctTz = dateNowAtPrjctTz.getDay();
                // winston.debug('O ---> [ OHS ] -> *** DAY @ PRJCT TZ #', dayNowAtPrjctTz, '"', days[dayNowAtPrjctTz], '"');

                // TRASFORM IN STRING THE DATE @ THE PRJCT TZ (IS THE DATE NOW TO WHICH I ADDED (OR SUBTRACT) THE TIMEZONE OFFSET (IN MS)
                var dateNowAtPrjctTzToStr = dateNowAtPrjctTz.toISOString();

                // GET THE NEW DATE NOE HOUR
                var timeNowAtPrjctTz = dateNowAtPrjctTzToStr.substring(
                  dateNowAtPrjctTzToStr.lastIndexOf("T") + 1,
                  dateNowAtPrjctTzToStr.lastIndexOf(".")
                );
                // winston.debug('O ---> [ OHS ] -> **** TIME @ PRJCT TZ ', timeNowAtPrjctTz);

                var currentDayMatchesOneOfTheOpeningPrjctDays = checkDay(operatingHoursPars, dayNowAtPrjctTz);
                // winston.debug('O ---> [ OHS ] -> THE DAY MATCHES: ', currentDayMatchesOneOfTheOpeningPrjctDays, ' !!!' );

                if (currentDayMatchesOneOfTheOpeningPrjctDays == true) {


                  var currentTimeIsBetweenOperatingTimes = checkTimes(operatingHoursPars, dayNowAtPrjctTz, timeNowAtPrjctTz);
                  // winston.debug('O ---> [ OHS ] -> THE TIMES MATCHES', currentTimeIsBetweenOperatingTimes, ' !!!');
                  if (currentTimeIsBetweenOperatingTimes == true) {

                    // use case 1: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
                    //             THE CURRENT TIME (@ PRJCT TZ) IS BETWEEN THE START TIME AND THE END TIME
                    // winston.debug('O ---> [ OHS ] -> * USE CASE 1 * DAY & TIMES MATCHES')
                    // findAvailableUsers(req.params.projectid);
                    callback(true, null);

                  } else {

                    // use case 3: THE CURRENT DAY (@ PRJCT TZ) MATCHES TO A DAY OF PRJCT OPERATING HOURS BUT 
                    //             THE CURRENT TIME (@ PRJCT TZ) IS ! NOT BETWEEN THE START TIME AND THE END TIME
                    // winston.debug('O ---> [ OHS ] -> * USE CASE 3 * DAY MATCHES BUT TIMES ! NOT')
                    // user_available_array = [];
                    // res.json(user_available_array);
                    callback(false, null);
                  }

                } else {

                  // use case 2: THE CURRENT DAY (@ PRJCT TZ) ! NOT MATCHES TO A DAY OF PRJCT OPERATING HOURS AND 
                  // winston.debug('O ---> [ OHS ] -> * USE CASE 2 * DAY ! NOT MATCHES')
                  // user_available_array = [];
                  // res.json(user_available_array);
                  callback(false, null);
                }

              } catch (error) {

                // winston.debug('O ---> [ OHS ] -> ERROR ADD/SUBSTRACT PRJCT TZ OFFSET FROM DATE NOW - ERROR: ', error)
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

  slotIsOpenNow(projectId, slot_id, callback) {

    let q = Project.findOne({ _id: projectId, status: 100});
    if (cacheEnabler.project) { 
      q.cache(cacheUtil.longTTL, "projects:id:"+projectId)  //project_cache
      winston.debug('project cache enabled for slotIsOpenNow');
    }
    q.exec( async (err, project) => {

      if (err) {
        winston.error("(slotIsOpenNow) Error getting project: ", err);
        callback(null, { errorCode: 1000, msg: "Error getting project." })
        return;
      }
      if (!project) {
        winston.warn("(slotIsOpenNow) Project not found with id: " + projectId);
        callback(null, { errorCode: 1010, msg: 'Project not found for id' + projectId });
        return;
      }

      // Return ALWAYS true if the plan is free, trial is expired or the subscription is not active
      if (project.profile && (project.profile.type === 'free' && project.trialExpired === true) || (project.profile.type === 'payment' && project.isActiveSubscription === false)) {
        winston.debug('(slotIsOpenNow) Trial Expired or Subscription NOT Active') 
        callback(true, null) ;
        return;
      }

      if (!project.timeSlots) {
        winston.warn("(slotIsOpenNow) No time slots specified for the project " + projectId);
        callback(true, null)
        return
      }

      let timeSlot = project.timeSlots[slot_id];

      if (!timeSlot) {
        callback(null, { errorCode: 1030, msg: 'Slot not found with id ' + slot_id })
        return;
      }

      if (timeSlot.active == false) {
        winston.verbose("(slotIsOpenNow) selected slot is not active")
        callback(true, null);
        return;
      }

      if (!timeSlot.hours) {
        callback(null, { errorCode: 1020, msg: 'Operating hours is empty' });
        return;
      }

      const hours = JSON.parse(timeSlot.hours);
      const tzname = hours.tzname;
      delete hours.tzname;

      // Get the current time in the specified timezone
      const currentTime = moment_tz.tz(tzname);

      const currentWeekday = currentTime.isoWeekday();
      const daySlots = hours[currentWeekday];
      if (!daySlots) {
        callback(false, null)
        return;
      }

      let promises = [];

      daySlots.forEach((slot) => {
        promises.push(slotCheck(currentTime, tzname, slot))
      })
  
      await Promise.all(promises).then((resp) => {
        if (resp.indexOf(true) != -1) {
          callback(true, null);
          return;
        }
        callback(false, null);
        return;
      })
    })
  }
}

function slotCheck(currentTime, tzname, slot) {
  return new Promise((resolve) => {

    const startTime = moment_tz.tz(slot.start, 'HH:mm', tzname);
    const endTime = moment_tz.tz(slot.end, 'HH:mm', tzname);

    if (currentTime.isBetween(startTime, endTime, null, '[)')) {
      resolve(true)
    } else {
      resolve(false);
    }
  })
}

function addOrSubstractProjcTzOffsetFromDateNow(prjcTimezoneName) {
  // DATE NOW UTC(0) IN MILLISECONDS
  var dateNowMillSec = Date.now();
  // winston.debug('O ---> [ OHS ] -> DATE NOW (UTC) in ms ', dateNowMillSec);

  // CONVERT DATE NOW UTC(0) FROM MS IN DATE FORMAT
  var dateNow = new Date(dateNowMillSec);
  // winston.debug('O ---> [ OHS ] -> FOR DEBUG - DATE NOW (UTC): ', dateNow);

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
  // winston.debug('O -----> [ OHS ] -> TIMEZONE OFFSET (USING MOMENT-TZ) ', offset);

  // winston.debug('O ---> [ OHS ] -> Timezone IN  ', prjcTimezoneName, ' IS ', offset, ' TyPE OF ', typeof (offset));

  if (offset < 0) {
    // winston.debug('O ---> [ OHS ] -> THE SIGN OF THE OFFSET RETURNED IS NEGATIVE: THE TZ IS BEFORE UTC -> OFFSET ', offset);
    var _offset = offset * -1
    // winston.debug('O ---> [ OHS ] -> OFFSET CONVERTED ', _offset);
    // winston.debug('O ---> [ OHS ] -> FOR DEBUG: ', prjcTimezoneName, 'is at "UTC(-', _offset / 60, ')"');
    // TIMEZONE OFFSET DIRECTION +
    var timezoneDirection = '-'
    // winston.debug('O ---> [ OHS ] -> TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

    var prjcTzOffsetMillsec = _offset * 60000;
    // winston.debug('O ---> [ OHS ] -> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
  } else {

    // winston.debug('O ---> [ OHS ] -> THE SIGN OF THE OFFSET RETURNED IS ! NOT NEGATIVE: THE TZ IS AFTER UTC OR IS UTC -> OFFSET ', offset)
    // winston.debug('O ---> [ OHS ] -> FOR DEBUG: ', prjcTimezoneName, 'is at "UTC(+', offset / 60, ')"');
    var timezoneDirection = '+'
    // winston.debug('O ---> [ OHS ] -> TIMEZONE OFFSET DIRECTION: ', timezoneDirection);

    var prjcTzOffsetMillsec = offset * 60000;
    // winston.debug('O ---> [ OHS ] -> TIMEZONE OFFSET in MILLISECONDS: ', prjcTzOffsetMillsec);
  }


  // https://stackoverflow.com/questions/5834318/are-variable-operators-possible
  var operators = {
    '+': function (dateNowMs, tzMs) { return dateNowMs + tzMs },
    '-': function (dateNowMs, tzMs) { return dateNowMs - tzMs },
  }

  // ON THE BASIS OF 'TIMEZONE DIRECTION' ADDS OR SUBSTRATES THE 'TIMEZONE OFFSET' (IN MILLISECONDS) OF THE PROJECT TO THE 'DATE NOW' (IN MILLISECONDS)
  var newDateNowMs = operators[timezoneDirection](dateNowMillSec, prjcTzOffsetMillsec)
  // winston.debug('O ---> [ OHS ] -> DATE@PRJCT TZ (in ms):', newDateNowMs, ' IS = TO THE DATE NOW UTC ', dateNowMillSec, ' (in ms)', timezoneDirection, 'PRJC TZ OFFSET (in ms): ', prjcTzOffsetMillsec)

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
          // winston.debug('O -----> [ OHS ] -> OPERATING HOUR ', operatingHour)
          var startTime = operatingHour.start;
          var endTime = operatingHour.end;
          // winston.debug('CURRENT TIME (@THE PRJCT TZ) ', timeNowAtPrjctTz);
          // winston.debug('O ---> [ OHS ] -> on', days[dayNowAtPrjctTz], 'the START OPERATING HOURS is AT: ', startTime);
          // winston.debug('O ---> [ OHS ] -> on', days[dayNowAtPrjctTz], 'the END OPERATING HOURS is AT: ', endTime);

          // MOMENT 
          var moment = require('moment');
          // var currentTime = moment();
          // winston.debug('MOMEMT CURRENT TIME ', currentTime)
          var moment_currentTime = moment(timeNowAtPrjctTz, "HH:mm");
          var moment_StartTime = moment(startTime, "HH:mm");
          var moment_EndTime = moment(endTime, "HH:mm");
          // winston.debug('MOMENT REQUEST TIME (@THE PROJECT UTC)', moment_newDateNow_hour);
          // winston.debug('MOMENT START TIME ', moment_StartTime);
          // winston.debug('MOMENT ./END TIME ', moment_EndTime);

          var currentTimeIsBetween = moment_currentTime.isBetween(moment_StartTime, moment_EndTime);
          // winston.debug('O ---> [ OHS ] -> CURRENT TIME', moment_currentTime, ' (@THE PRJCT TZ) IS BETWEEN OH-Start:', moment_StartTime, ' OH-End ', moment_EndTime, '->', currentTimeIsBetween);

          if (currentTimeIsBetween == true) {
            // USE CASE: THE OPERATING HOURS ARE ACTIVE AND THE DAY OF THE REQUEST MATCH WITH THE OPERATING HOURS WEEK-DAY
            //           but the time of the request is outside the OPERATING hours
            // winston.debug('O -----> [ OHS ] -> THE CURRENT TIME (@THE PRJCT TZ) MATCHES WITH THE OPERATING HOURS')

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
