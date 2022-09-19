var express = require('express');
var router = express.Router();
var Activity = require("../models/activity");
var winston = require('../../../config/winston');
var moment = require('moment');
var ObjectId = require('mongoose').Types.ObjectId;

csv = require('csv-express');
csv.separator = ';';
// csv = require('csv-express');
// csv.separator = ';';


// router.post('/', function (req, res) {

//   winston.debug(req.body);
//   winston.debug("req.user", req.user);

//   var newLead = new Lead({
//     fullname: req.body.fullname,
//     lead_id: req.body.lead_id,
//     email: req.body.email,
//     id_project: req.projectid,
//     createdBy: req.user.id,
//     updatedBy: req.user.id
//   });

//   newLead.save(function (err, savedLead) {
//     if (err) {
//       winston.debug('--- > ERROR ', err)
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     }
//     res.json(savedLead);
//   });
// });

// router.get('/:leadid', function (req, res) {
//   winston.debug(req.body);

//   Lead.findById(req.params.leadid, function (err, lead) {
//     if (err) {
//       return res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!lead) {
//       return res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     res.json(lead);
//   });
// });



router.get('/', function (req, res) {
  var limit = 40; // Number of activities per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Activity ROUTE - SKIP PAGE ', skip);
  // winston.debug('Activity ROUTE - SKIP PAGE ', skip);

  winston.debug('Activity ROUTE - QUERY ', req.query)


  var query = { "id_project": req.projectid };


  /**
   * DATE RANGE  */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('Activity ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('Activity ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('Activity ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('Activity ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('Activity ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('Activity ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('Activity ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    winston.debug('Activity ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }

  if (req.query.agent_id) {
    winston.debug('req.query.agent', req.query.agent_id);
    query["$or"] = [
      { "target.object.id_user._id": new ObjectId(req.query.agent_id) },
      { "actor.id": req.query.agent_id }
    ];

    // query["$or"] = [
    //   { $or: [{"target.object.id_user._id": new ObjectId(req.query.agent_id) }, { "actor.id": new ObjectId(req.query.agent_id) }]}
    // ];
  }

  if (req.query.activities) {
    winston.debug('req.query.activities:', req.query.activities);

    let verbs = req.query.activities.split(",")

    winston.debug('verbs: ', verbs);
    query.verb = verbs;

    // to test
    // query.verb = ['PROJECT_USER_DELETE','PROJECT_USER_INVITE']
  }


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  winston.debug('Activity ROUTE - Activity.find(query) ', query)
  return Activity.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, activities) {
      if (err) {
        winston.error('Activity ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      return Activity.countDocuments(query, function (err, totalRowCount) {
        if (err) {
          winston.error('Activity ROUTE - REQUEST FIND ERR ', err)
          return (err);
        }

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          activities: activities
        };
        winston.debug('Activity ROUTE - objectToReturn ', objectToReturn);

        objectToReturn.activities.forEach(activity => {
          winston.debug('Activity ROUTE - activity.target ', activity.target);
          if (activity.target && activity.target.object && activity.target.object.id_user) {
            winston.debug('Activity ROUTE - *** 9-+activity.target.id_user ', activity.target.object.id_user._id);
          }
        });

        return res.json(objectToReturn);
      });
    });
});

// DOWNLOAD ACTIVITIES AS CSV
router.get('/csv', function (req, res) {
  var limit = 100000; // Number of activities per page
  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('Activity ROUTE - SKIP PAGE ', skip);
  // winston.debug('Activity ROUTE - SKIP PAGE ', skip);

  winston.debug('Activity ROUTE - QUERY ', req.query)


  var query = { "id_project": req.projectid };

  /**
   * DATE RANGE  */
  if (req.query.start_date && req.query.end_date) {
    winston.debug('Activity ROUTE - REQ QUERY start_date ', req.query.start_date);
    winston.debug('Activity ROUTE - REQ QUERY end_date ', req.query.end_date);

    /**
     * USING MOMENT      */
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');
    var endDate = moment(req.query.end_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    winston.debug('Activity ROUTE - REQ QUERY FORMATTED START DATE ', startDate);
    winston.debug('Activity ROUTE - REQ QUERY FORMATTED END DATE ', endDate);

    // ADD ONE DAY TO THE END DAY
    var date = new Date(endDate);
    var newdate = new Date(date);
    var endDate_plusOneDay = newdate.setDate(newdate.getDate() + 1);
    winston.debug('Activity ROUTE - REQ QUERY FORMATTED END DATE + 1 DAY ', endDate_plusOneDay);
    // var endDate_plusOneDay =   moment('2018-09-03').add(1, 'd')
    // var endDate_plusOneDay =   endDate.add(1).day();
    // var toDate = new Date(Date.parse(endDate_plusOneDay)).toISOString()

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString(), $lte: new Date(endDate_plusOneDay).toISOString() }
    winston.debug('Activity ROUTE - QUERY CREATED AT ', query.createdAt);

  } else if (req.query.start_date && !req.query.end_date) {
    winston.debug('Activity ROUTE - REQ QUERY END DATE IS EMPTY (so search only for start date)');
    var startDate = moment(req.query.start_date, 'DD/MM/YYYY').format('YYYY-MM-DD');

    query.createdAt = { $gte: new Date(Date.parse(startDate)).toISOString() };
    winston.debug('Activity ROUTE - QUERY CREATED AT (only for start date)', query.createdAt);
  }

  if (req.query.agent_id) {
    winston.debug('req.query.agent', req.query.agent_id);
    query["$or"] = [
      { "target.object.id_user._id": new ObjectId(req.query.agent_id) },
      { "actor.id": req.query.agent_id }
    ];

    // query["$or"] = [
    //   { $or: [{"target.object.id_user._id": new ObjectId(req.query.agent_id) }, { "actor.id": new ObjectId(req.query.agent_id) }]}
    // ];
  }

  if (req.query.activities) {
    winston.debug('req.query.activities:', req.query.activities);

    let verbs = req.query.activities.split(",")

    winston.debug('verbs: ', verbs);
    query.verb = verbs;

    // to test
    // query.verb = ['PROJECT_USER_DELETE','PROJECT_USER_INVITE']
  }

  if (req.query.lang) {
    winston.debug('req.query.lang:', req.query.lang);
    var lang = req.query.lang;
  }


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  winston.debug('Activity ROUTE - Activity.find(query) ', query)
  return Activity.find(query).
    skip(skip).limit(limit).
    lean().
    sort(sortQuery).
    exec(function (err, activities) {
      if (err) {
        winston.error('Activity ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }
      winston.debug('activities: ', activities);


      // csvActivitiesToReturn = [];
      csvActivitiesToReturn = buildCsv(activities, lang);


      winston.debug('csvActivitiesToReturn: ', csvActivitiesToReturn);

      return res.csv(csvActivitiesToReturn, true);


    });


  function translateString(string, lang) {
    var translatedString = ''

    if (string === 'hasChanged') {
      if (lang === 'it') {
        translatedString = 'ha cambiato'
      } else {
        translatedString = 'has changed'
      }
    }

    if (string === 'hisStatus') {
      if (lang === 'it') {
        translatedString = ' il suo stato'
      } else {
        translatedString = ' his status'
      }
    }

    if (string === 'theAvailabilityStatusOf') {
      if (lang === 'it') {
        translatedString = ' lo stato di disponibilità di'
      } else {
        translatedString = ' the availability status of'
      }
    }


    if (string === 'theRoleOf') {
      if (lang === 'it') {
        translatedString = ' il ruolo di'
      } else {
        translatedString = ' the role of'
      }
    }

    if (string === 'intoUnavailable') {
      if (lang === 'it') {
        translatedString = ' in non disponibile'
      } else {
        translatedString = ' into unavailable'
      }
    }

    if (string === 'intoAvailable') {
      if (lang === 'it') {
        translatedString = ' in disponibile'
      } else {
        translatedString = ' into available'
      }
    }

    if (string === 'intoAdministrator') {
      if (lang === 'it') {
        translatedString = ' in Amministratore'
      } else {
        translatedString = ' into Administrator'
      }
    }

    if (string === 'intoAgent') {
      if (lang === 'it') {
        translatedString = ' in Agente'
      } else {
        translatedString = ' into Agent'
      }
    }


    if (string === 'HasRemoved') {
      if (lang === 'it') {
        translatedString = ' ha rimosso'
      } else {
        translatedString = ' has removed'
      }
    }

    if (string === 'FromTheProject') {
      if (lang === 'it') {
        translatedString = ' dal progetto'
      } else {
        translatedString = ' from the project'
      }
    }

    if (string === 'HasInvited') {
      if (lang === 'it') {
        translatedString = ' ha invitato'
      } else {
        translatedString = ' has invited'
      }
    }

    if (string === 'ToTakeOnTheRoleOf') {
      if (lang === 'it') {
        translatedString = ' ad assumere il ruolo di'
      } else {
        translatedString = ' to take on the role of'
      }
    }







    return translatedString
  }

  function buildMsg_REQUEST_CREATE(lang, activity) {
    winston.debug('buildMsg_REQUEST_CREATE - lang: ', lang, ' activity: ', activity)
  }

  function buildMsg_PROJECT_USER_INVITE(actor_name, target_fullname, lang, activity) {
    var action = '';


    action = translateString('HasInvited', lang) + ' ' + target_fullname


    // email with round brackets if it not is a pendinginvitation
    if (activity.target && activity.target.type !== 'pendinginvitation') {

      if (activity.actionObj && activity.actionObj.email) {

        action = action + '(' + activity.actionObj.email + ')'

      } else {

        // email without round brackets if it is a pendinginvitation

        action = action + activity.actionObj.email
      }

    }

    action = action + translateString('ToTakeOnTheRoleOf', lang)


    return message = actor_name + action

  }


  function buildMsg_PROJECT_USER_DELETE(actor_name, target_fullname, lang) {
    var action = '';
    action = translateString('HasRemoved', lang) + ' ' + target_fullname + translateString('FromTheProject', lang)

    return message = actor_name + action

  }

  function buildMsg_PROJECT_USER_UPDATE(actor_name, target_fullname, lang, activity) {

    var action = '';

    action = translateString('hasChanged', lang)
    // if (lang === 'it') {
    //   action = 'ha cambiato'
    // } else {
    //   action = 'has changed'
    // }

    if (activity.actor && activity.actor.id) {
      if (activity.target &&
        activity.target.object &&
        activity.target.object.id_user &&
        activity.target.object.id_user._id) {

        var target_user_id = JSON.stringify(activity.target.object.id_user._id).replace(/['"]+/g, '')

        if (activity.actor.id === target_user_id) {
          // USE CASE 1: THE TARGET OF THE ACTION IS THE CURRENT USER (YOURSELF) 

          action = action + translateString('hisStatus', lang)

        } else {

          // USE CASE 2: THE TARGET OF THE ACTION IS ANOTHER USER (NOT THE LOGGED USER)
          winston.debug('here + activity.actionObj.user_available ', activity.actionObj.user_available)
          if (activity.actionObj && activity.actionObj.user_available === false || activity.actionObj.user_available === true) {

            winston.debug('here ++')

            action = action + translateString('theAvailabilityStatusOf', lang)

            // if (lang === 'it') {
            //   action = action + ' lo stato di disponibilità di'
            // } else {
            //   action = action + ' the availability status of'
            // }

          }
          else if (activity.actionObj && activity.actionObj.role) {

            action = action + translateString('theRoleOf', lang)

            // if (lang === 'it') {
            //   action = action + ' il ruolo di'
            // } else {
            //   action = action + ' the role of'
            // }
          }

          action = action + ' ' + target_fullname

        }

        if (activity.actionObj && activity.actionObj.user_available === false) {

          action = action + translateString('intoUnavailable', lang);

          // if (lang === 'it') {
          //   action = action + ' in non disponibile'
          // } else {
          //   action = action + ' into unavailable'
          // }

        } else if (activity.actionObj && activity.actionObj.user_available === true) {

          action = action + translateString('intoAvailable', lang);

          // if (lang === 'it') {
          //   action = action + ' in disponibile'
          // } else {
          //   action = action + ' into available'
          // }
        }

        if (activity.actionObj && activity.actionObj.role === 'admin') {

          action = action + translateString('intoAdministrator', lang);

          // if (lang === 'it') {
          //   action = action + ' in Amministratore'
          // } else {
          //   action = action + ' into Administrator'
          // }

        } else if (activity.actionObj && activity.actionObj.role === 'agent') {

          action = action + translateString('intoAgent', lang);

          // if (lang === 'it') {
          //   action = action + ' in Agente'
          // } else {
          //   action = action + ' into Agent'
          // }

        }






      }
    }


    return message = actor_name + ' ' + action
  }


  function buildCsv(activities, lang) {
    csvActivitiesToReturn = []
    activities.forEach(activity => {

      // if (lang) {
      winston.debug('buildCsv lang: ', lang);

      var actor_name = '';
      var target_fullname = '';
      if (activity.actor) {
        actor_name = activity.actor.name;

      }

      if (activity.target &&
        activity.target.object &&
        activity.target.object.id_user &&
        activity.target.object.id_user.firstname) {

        target_fullname = activity.target.object.id_user.firstname

        if (activity.target.object.id_user.lastname) {

          target_fullname = target_fullname + ' ' + activity.target.object.id_user.lastname
        }

      }

      if (activity.verb === "PROJECT_USER_UPDATE") {
        var message = buildMsg_PROJECT_USER_UPDATE(actor_name, target_fullname, lang, activity)
      }

      if (activity.verb === "PROJECT_USER_DELETE") {
        var message = buildMsg_PROJECT_USER_DELETE(actor_name, target_fullname, lang)
      }

      if (activity.verb === "PROJECT_USER_INVITE") {
        var message = buildMsg_PROJECT_USER_INVITE(actor_name, target_fullname, lang, activity)
      }

      if (activity.verb === "REQUEST_CREATE") {
        var message = buildMsg_REQUEST_CREATE(lang, activity)
      }


      if (activity.actionObj && activity.actionObj.email) {
        var actionObj_email = activity.actionObj.email;
      } else {
        var actionObj_email = ""
      }

      if (activity.actionObj && activity.actionObj.id_project) {
        var actionObj_id_project = activity.actionObj.id_project;
      } else {
        var actionObj_id_project = ""
      }

      if (activity.actionObj && activity.actionObj.project_name) {
        var actionObj_project_name = activity.actionObj.project_name;
      } else {
        var actionObj_project_name = ""
      }

      if (activity.actionObj && activity.actionObj.role) {
        var actionObj_role = activity.actionObj.role;
      } else {
        var actionObj_role = ""
      }

      if (activity.actionObj && activity.actionObj.user_available) {
        var actionObj_user_available = activity.actionObj.user_available;
      } else {
        var actionObj_user_available = ""
      }

      if (activity.target) {
        var target_id = activity.target.id
        var target_type = activity.target.type
      }

      if (activity.target && activity.target.object) {
        var target_createdAt = activity.target.object.createdAt;
        var target_createdBy = activity.target.object.createdBy;
        var target_role = activity.target.object.role;
        var target_user_available = activity.target.object.user_available;
        // var target_id = activity.target.object._id;
      }

      if (activity.target && activity.target.object && activity.target.object.id_user) {
        var target_user_fullname = activity.target.object.id_user.firstname + " " + activity.target.object.id_user.lastname;
        var target_user_id = activity.target.object.id_user._id
      } else {
        var target_user_fullname = "";
        var target_user_id = "";
      }

      if (activity.target && activity.target.object && activity.target.object.email) {
        var target_email = activity.target.object.email;
      } else {
        var target_email = "";
      }


      csvActivitiesToReturn.push({
        'message': message,
        "activity_id": activity._id,
        "createdAt": activity.createdAt,
        "updatedAt": activity.updatedAt,
        "project_id": activity.id_project,
        "actor_name": activity.actor.name,
        "actor_id": activity.actor.id,
        "actor_type": activity.actor.type,
        "verb": activity.verb,
        "target_user_fullname": target_user_fullname,
        "target_email": target_email,
        "target_type": target_type,
        "target_user_id": target_user_id,
        "actionObj_email": actionObj_email,
        "actionObj_id_project": actionObj_id_project,
        "actionObj_project_name": actionObj_project_name,
        "actionObj_role": actionObj_role,
        "actionObj_user_available": actionObj_user_available,
        "target_id": target_id,
        "target_createdAt": target_createdAt,
        "target_createdBy": target_createdBy,
        "target_role": target_role,
        "target_user_available": target_user_available,
      })

    });

    return csvActivitiesToReturn
  }



});


module.exports = router;
