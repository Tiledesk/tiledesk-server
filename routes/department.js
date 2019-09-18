var express = require('express');
var router = express.Router();
var Department = require("../models/department");
var departmentService = require("../services/departmentService");

var Project_user = require("../models/project_user");
var Group = require("../models/group");

var passport = require('passport');
require('../config/passport')(passport);
var validtoken = require('../middleware/valid-token')
var operatingHoursService = require("../models/operatingHoursService");
// var passport = require('passport');
// var validtoken = require('.../middleware/valid-token')
var winston = require('../config/winston');
// var Project = require("../models/project");


router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  winston.debug("DEPT REQ BODY ", req.body);
  var newDepartment = new Department({
    routing: req.body.routing,
    name: req.body.name,
    default: req.body.default,
    status: req.body.status,
    id_group: req.body.id_group,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  if (req.body.id_bot) {
    newDepartment.id_bot = req.body.id_bot;
    newDepartment.bot_only = req.body.bot_only;
  }


  newDepartment.save(function (err, savedDepartment) {
    if (err) {
      winston.error('Error creating the department ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    winston.info('NEW DEPT SAVED ', savedDepartment)
    res.json(savedDepartment);
  });
});

router.put('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  winston.debug(req.body);

  Department.findByIdAndUpdate(req.params.departmentid, req.body, { new: true, upsert: true }, function (err, updatedDepartment) {
    if (err) {
      winston.error('Error putting the department ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedDepartment);
  });
});


router.delete('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  winston.debug(req.body);

  Department.remove({ _id: req.params.departmentid }, function (err, department) {
    if (err) {
      winston.error('Error deleting the department ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(department);
  });
});


router.get('/:departmentid/operators', function (req, res) {
  winston.info("Getting department operators");
  // getOperators(departmentid, projectid, nobot) {
  departmentService.getOperators(req.params.departmentid, req.projectid, req.query.nobot).then(function (operatorsResult) {
    return res.json(operatorsResult);
  }).catch(function (err) {
    winston.error('Error getting the department operators ', err);
    return res.status(500).send({ success: false, msg: 'Error getting departments operatotors.' });
  });
});
// START - GET OPERATORS OF A DEPT - 3 giu 2018 Nikola - Andrea L. - Andrea S.
//removed authentication for enabling the widget to use this endpoint
//router.get('/:departmentid/operators', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
// router.get('/:departmentid/operators', function (req, res) {
//   console.log("»»» »»» --> DEPT ID ", req.params.departmentid);

//   let query;
//   if (req.params.departmentid == 'default' || req.params.departmentid == undefined) {
//     query = { default: true, id_project: req.projectid };
//   } else {
//     query = { _id: req.params.departmentid };
//   }
//   console.log('query', query);
//   Department.findOne(query, function (err, department) {
//     if (err) {
//       console.log('-- > 1 DEPT FIND BY ID ERR ', err)
//       return res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!department) {
//       return res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     console.log('OPERATORS - »»» DETECTED ROUTING ', department.routing)
//     console.log('OPERATORS - »»» DEPARTMENT - ID BOT ', department.id_bot)

//     // start code FOR DEBUG
//     // NOTE: TO TEST '?nobot = true' see in the tiledesk dashboard: mongodb-department.service > testAssignesFunction
//     if (req.query.nobot) {
//       console.log('nobot IS == true ? ', req.query.nobot)
//       console.log('»»»» »»»» nobot is == TRUE - JUMP TO ASSIGNED / POOLED ')
//     } else if (!req.query.nobot) {
//       console.log('nobot IS != true ', req.query.nobot)
//       if ((department.id_bot == null || department.id_bot == undefined)) {
//         console.log('»»»» »»»» BOT IS UNDEFINED or NULL and nobot is != TRUE - JUMP TO ASSIGNED / POOLED')
//       } else {
//         console.log('»»»» »»»» BOT EXIST and nobot is != TRUE - ASSIGN THE SELECTED BOT ')
//       }
//     }
//     // /.end code FOR DEBUG 

//     // IF EXIST THE BOT AND nobot IS NOT UNDEFINED IN OPERATORS IS RETURNED THE ID OF THE BOT
//     if ((department.id_bot != null || department.id_bot != undefined) && (!req.query.nobot)) {

//       // if (department.id_group == null || department.id_group == undefined) {
//       // MAKE X 'BOT' AS FOR 'ASSIGNED' AND 'POOLED': IF THERE IS A GROUP THE BOT WILL BE VISIBLE ONLY BY THE GROUP MEMBERS 
//       // OTHERWISE THE BOT WILL BE VISIBLE TO ALL USERS (BECAUSE THERE IS NO GROUP)
//       console.log('OPERATORS - »»»» BOT IS DEFINED - !!! DEPT HAS NOT GROUP ID')
//       console.log('OPERATORS - »»»» BOT IS DEFINED -> ID BOT', department.id_bot);
//       console.log('OPERATORS - »»»» nobot ', req.params.nobot)

//       Project_user.find({ id_project: req.projectid }, function (err, project_users) {
//         if (err) {
//           console.log('-- > 2 DEPT FIND BY ID ERR ', err)
//           return (err);
//         }
//         console.log('OPERATORS - BOT IS DEFINED - MEMBERS ', project_users)
//         // if (project_users && project_users.length > 0) {
//         console.log('OPERATORS - BOT IS DEFINED - MEMBERS LENGHT ', project_users.length);

//         // getAvailableOperatorsWithOperatingHours: IN BASE ALLE 'OPERATING HOURS' DEL PROGETTO ESEGUE 
//         // getAvailableOperator CHE RITORNA I PROJECT USER DISPONIBILI
//         getAvailableOperatorsWithOperatingHours(project_users, req.projectid).then(function (_available_agents) {

//           console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", _available_agents);

//           return res.json({ department: department, available_agents: _available_agents, agents: project_users, operators: [{ id_user: 'bot_' + department.id_bot }] });
//         }).catch(function (error) {

//           winston.error("Write failed: ", error);

//           sendError(error, res);
//           console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", error);
//         });
//         // } else {
//         //   return res.json({ department: department, available_agents: [], agents: [], operators: [{ id_user: 'bot_' + department.id_bot }] });
//         // }
//       });
//     }

//     else { // if (department.routing === 'assigned' || department.routing === 'pooled') {
//       // console.log('OPERATORS - routing ', department.routing, ' - PRJCT-ID ', req.projectid)
//       // console.log('OPERATORS - routing ', department.routing, ' - DEPT GROUP-ID ', department.id_group)


//       /* ---------------------------------------------------------------------------------
//        *  findProjectUsersAllAndAvailableWithOperatingHours return: 
//        *  * available_agents (available project users considering personal availability in the range of the operating hours) 
//        *  * agents (i.e., all the project users) 
//        *  * operators (i.e. the id of a user selected random from the available project users considering personal availability in the range of the operating hours)
//        * --------------------------------------------------------------------------------*/
//       findProjectUsersAllAndAvailableWithOperatingHours(req.projectid, department).then(function (value) {

//         // console.log('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, '] ', value);
//         value['department'] = department

//         //if sendEmail==true send email to assigned Operator. Only for assigned opearator. for a Pooled request the mail is sent by requestService.
//         // if (req.query.sendemail) {
//         //   if (value && value.operators && value.operators.length>0) {
//         //     var opearator = value.operators[0];
//         //     User.findById( opearator, function (err, user) {
//         //       if (err) {
//         //         winston.error("Error sending email to " + opearator, err);
//         //       }
//         //       if (!user) {
//         //         console.warn("User not found",  opearator);
//         //       } else {
//         //         console.log("Sending sendNewAssignedRequestNotification to user with email", user.email);
//         //         emailService.sendNewAssignedRequestNotification(user.email, savedRequest, project);
//         //       }
//         //     });

//         //   }
//         // }

//         return res.json(value)

//       }).catch(function (error) {
//         winston.error('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ] -> ERROR: ', error);
//       });
//     }
//   });
// });

// function findProjectUsersAllAndAvailableWithOperatingHours(projectid, department) {

//   return new Promise(function (resolve, reject) {
//     winston.debug('D-1 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ], - ID GROUP', department.id_group);

//     if (department.id_group != null) {

//       resolve(findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department));

//     } else {

//       resolve(findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department));

//     }

//   });
// };

// function findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department) {
//   return new Promise(function (resolve, reject) {

//     Group.find({ _id: department.id_group }, function (err, group) {
//       if (err) {
//         console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
//         reject(err);
//       }
//       if (group) {

//         // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> GROUP FOUND:: ', group);
//         // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS LENGHT: ', group[0].members.length);
//         // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS ID: ', group[0].members);

//         // , user_available: true
//         //Project_user.findAllProjectUsersByProjectIdWhoBelongsToMembersOfGroup(id_prject, group[0]);
//         Project_user.find({ id_project: projectid, id_user: group[0].members }, function (err, project_users) {
//           // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT ID ', projectid);
//           if (err) {
//             // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER - ERR ', err);
//             reject(err);
//           }
//           if (project_users && project_users.length > 0) {
//             // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER (IN THE GROUP) LENGHT ', project_users.length);

//             // var _available_agents = getAvailableOperatorsWithOperatingHours(project_users, projectid);
//             // NK NEW
//             getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
//               var _available_agents = _available_agents
//               // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

//               var selectedoperator = []
//               if (department.routing === 'assigned') {
//                 selectedoperator = getRandomAvailableOperator(_available_agents);
//               }
//               resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

//             }).catch(function (error) {

//               // winston.error("Write failed: ", error);

//               sendError(error, res);
//               console.log('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_group ] - AVAILABLE AGENT - ERROR ', error);
//             });
//             // NK NEW

//             // var selectedoperator = []
//             // if (department.routing === 'assigned') {
//             //   selectedoperator = getRandomAvailableOperator(_available_agents);
//             // }
//             // resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

//           } else {
//             // return res.json({ department: department, available_agents: [], agents: [], operators: [] });
//             resolve({ available_agents: [], agents: [], operators: [] })
//           }

//         })
//       }
//     });
//   });
// }


// function findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department) {

//   return new Promise(function (resolve, reject) {
//     Project_user.find({ id_project: projectid }, function (err, project_users) {
//       if (err) {
//         console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
//         reject(err);
//       }
//       // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS LENGHT ', project_users.length)
//       // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS ', project_users)


//       if (project_users && project_users.length > 0) {
//         // var _available_agents = getAvailableOperatorsWithOperatingHours(project_users, projectid);
//         // NK NEW
//         getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
//           var _available_agents = _available_agents
//           // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

//           var selectedoperator = []
//           if (department.routing === 'assigned') {
//             selectedoperator = getRandomAvailableOperator(_available_agents);
//           }
//           resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

//         }).catch(function (error) {

//           // winston.error("Write failed: ", error);

//           sendError(error, res);
//           console.log('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_nogroup ] - AVAILABLE AGENT - ERROR ', error);
//         });

//         // NK NEW


//         // var selectedoperator = []
//         // if (department.routing === 'assigned') {
//         //   selectedoperator = getRandomAvailableOperator(_available_agents);
//         // }
//         // console.log('D-1-B -> [ findProjectUsersForAssignedPooledRouting_nogroup ] - AVAILABLE AGENT ', _available_agents);
//         // resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })
//       } else {
//         // return res.json({ department: department, available_agents: [], agents: [], operators: [] });
//         resolve({ available_agents: [], agents: [], operators: [] })
//       }

//     });
//   });
// }

// USED WHEN ID BOT IS DEFINED
// function __getAvailableOperatorWithOperatingHours(project_users, projectid) {
//   return new Promise(function (resolve, reject) {
//     operatingHoursService.projectIsOpenNow(projectid, function (isOpen, err) {
//       console.log('D ---> [ OHS ] -> [ PROJECT ROUTES ] -> PROJECT ID: ', projectid);
//       console.log('D ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT: ', isOpen);
//       console.log('D ---> [ OHS ] -> [ PROJECT ROUTES ] -> IS OPEN THE PROJECT - ERROR: ', err)

//       if (err) {
//         // reject(err);
//         sendError(err, res);
//         // return res.status(500).send({ success: false, msg: err });
//       } else if (isOpen) {
//         let availableOperator = getAvailableOperator(project_users);
//         console.log('D ---> [ OHS ] -> [ PROJECT ROUTES ] -> availableOperator ', availableOperator)
//         resolve(availableOperator);

//       } else {
//         console.log('D ---> [ OHS ] -> [ PROJECT ROUTES ] -> availableOperator ')
//         resolve([]);
//       }
//     });
//   });
// }


// function getAvailableOperatorsWithOperatingHours(project_users, projectid) {

//   return new Promise(function (resolve, reject) {

//     if (project_users && project_users.length > 0) {

//       operatingHoursService.projectIsOpenNow(projectid, function (isOpen, err) {
//         // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> PROJECT ID: ', projectid);
//         // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT: ', isOpen);
//         // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT - EROR: ', err)

//         if (err) {
//           reject(err);
//           // sendError(err, res);

//         } else if (isOpen) {

//           var _available_agents = getAvailableOperator(project_users);

//           resolve(_available_agents);
//           // console.log('D -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> AVAILABLE PROJECT USERS (returned by getAvailableOperator): ', _available_agents)
//           // resolve(findProjectUsersForAssignedPooledRouting_nogroup(projectid, department));
//         } else {
//           // resolve({ available_agents: [], agents: [], operators: [] });
//           resolve([]);
//           //resolve(res.json({ department: department, available_agents: [], agents: [], operators: [] }););
//         }
//       });
//     } else {
//       resolve([]);
//     }

//   });
// }

// // FILTER ALL THE PROJECT USERS FOR AVAILABLE = TRUE
// function getAvailableOperator(project_users) {
//   var project_users_available = project_users.filter(function (projectUser) {
//     if (projectUser.user_available == true) {
//       return true;
//     }
//   });
//   // console.log('D -> [GET AVAILABLE PROJECT-USER ] - AVAILABLE PROJECT USERS (getAvailableOperator): ', project_users_available)
//   return project_users_available
// }



// function sendError(err, res) {
//   if (err.errorCode == undefined) {
//     err = { errCode: 3000, msg: err.message }
//   }

//   var errcode = err.errorCode
//   console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR CODE: ', errcode);

//   switch (errcode) {
//     // Project.findById -> Error getting object.
//     case 1000:
//       errMsg = err.msg;
//       console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
//       res.status(500).send({ success: false, msg: errMsg });
//       break;
//     // Project.findById -> Object not found.
//     case 1010:
//       errMsg = err.msg;
//       console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
//       res.status(404).send({ success: false, msg: errMsg });
//       break;
//     //  Operating hours is empty (e.g, "operatingHours" : "")
//     case 1020:
//       errMsg = err.msg;
//       console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
//       res.status(500).send({ success: false, msg: errMsg });
//       break;
//     // Timezone undefined. (e.g., "tzname":null; tzname: ""; undefined)
//     case 2000:
//       errMsg = err.msg;
//       console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
//       res.status(500).send({ success: false, msg: errMsg });
//       break;
//     // function addOrSubstractProjcTzOffsetFromDateNow ERROR
//     case 3000:
//       errMsg = err.msg;
//       console.log('D ---> [ OHS ] -> [ OPERATORS ] -> IS OPEN THE PROJECT - ERROR TEXT: ', errMsg);
//       res.status(500).send({ success: false, msg: errMsg });
//       break;
//   }

// }


// function getRandomAvailableOperator(project_users_available) {
//   // var project_users_available = project_users.filter(function (projectUser) {
//   //   if (projectUser.user_available == true) {
//   //     return true;
//   //   }
//   //   //return projectUser.user_available;
//   // })
//   // var project_users_available = getAvailableOperator(project_users);

//   // console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE ', project_users_available);
//   // console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE LENGHT ', project_users_available.length);
//   if (project_users_available.length > 0) {
//     var operator = project_users_available[Math.floor(Math.random() * project_users_available.length)];
//     // console.log('OPERATORS - SELECTED MEMBER ID', operator.id_user);

//     // return operator.id_user
//     return [{ id_user: operator.id_user }]

//   }
//   else {

//     return []

//   }
// }
// ./END - GET OPERATORS OF A DEPT


// START - GET MY DEPTS
// !!! NO MORE USED 
// ============= GET ALL GROUPS WITH THE PASSED PROJECT ID =============
router.get('/mydepartments', function (req, res) {
  console.log("req projectid", req.projectid);

  var query = { "id_project": req.projectid };

  if (req.project.isActiveSubscription() == false) {
    query.default = true;
  }

  Department.find(query, function (err, departments) {
    if (err) return next(err);
    console.log('1) FIND MY DEPTS - ALL DEPTS ARRAY ', departments)
    // departments_array.push(departments);
    // console.log('-- -- -- array of depts - null', arr)

    Group.find({ "id_project": req.projectid, trashed: false, members: req.user.id }, function (err, groups) {
      if (err) return next(err);
      console.log('2) GET MY DEPTS - MY GROUPS ARRAY ', groups)
      var mydepts = []
      departments.forEach(dept => {

        // console.log('3) DEPT ', dept)
        if (dept.id_group == null) {
          console.log('DEPT NAME (when null/undefined) ', dept.name, ', dept id ', dept._id)
          mydepts.push(dept._id);

          // FOR DEBUG
          // mydepts.forEach(mydept => {
          //   console.log('- MY DEPT NAME: ', mydept.name, ', ID GROUP: ', mydept.id_group)
          // });
          // console.log('- MY DEPTS ARRAY ', mydepts)
        }
        else {
          deptContainsMyGroup(groups)
          // groups.forEach(group => {
          //   console.log('4) GROUP ', group)
          //   if ( group._id == dept.id_group) {
          //     mydepts.push(dept);
          //     console.log('-- MY DEPTS ARRAY ', mydepts)
          //   }
          // });
          // console.log('-- MY DEPTS ARRAY ', mydepts)
        }

        function deptContainsMyGroup(groups) {
          groups.forEach(group => {
            // console.log('4) GROUP ', group)
            if (group._id == dept.id_group) {
              console.log('DEPT NAME (my departments) ', dept.name, ', dept id ', dept._id)
              mydepts.push(dept._id);
            }
          });
        }

      });
      return res.json(mydepts);
    })

  });
})

// ======================== ./END - GET MY DEPTS ========================

// GET ALL DEPTS (i.e. NOT FILTERED FOR STATUS and WITH AUTHENTICATION (USED BY THE DASHBOARD)
router.get('/allstatus', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  console.log("## GET ALL DEPTS req.project.isActiveSubscription ", req.project.isActiveSubscription)
  console.log("## GET ALL DEPTS req.project.trialExpired ", req.project.trialExpired)
  console.log("## GET ALL DEPTS eq.project.profile.type ", req.project.profile.type)

  console.log("## GET ALL DEPTS req.project ", req.project)

  var query = { "id_project": req.projectid };
  if ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {

    query.default = true;
  }

  // if (req.project) {
  //   Project.findById(req.project._id, function (err, project) {
  //     if (err) {
  //       console.log("## GET ALL DEPTS Problem getting project with id:", req.project._id);
  //       //console.warn("Error getting project with id",projectid, err);
  //     } else {
  //       console.log("## GET ALL DEPTS project: ", project);
  //     }
  //   })
  // }
  //console.log("req projectid", req.projectid);
  //console.log("req.query.sort", req.query.sort);

  // var query = { "id_project": req.projectid };

  // if (req.project.isActiveSubscription()==false) {
  //   query.default=true;
  // }

  if (req.query.sort) {
    // return Department.find({ "id_project": req.projectid }).sort({ updatedAt: 'desc' }).exec(function (err, departments) {
    // QUESTO LO COMMENTO 11.09.19 return Department.find({ "id_project": req.projectid }).sort({ name: 'asc' }).exec(function (err, departments) { 
    console.log("## GET ALL DEPTS QUERY (1)", query)
    return Department.find(query).sort({ name: 'asc' }).exec(function (err, departments) {

      if (err) {
        winston.error('Error getting the departments.', err);
        console.log('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  } else {
    console.log("## GET ALL DEPTS QUERY (1)", query)
    // return Department.find({ "id_project": req.projectid }, function (err, departments) {
    return Department.find(query, function (err, departments) {
      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  }
});


router.get('/:departmentid', function (req, res) {
  console.log(req.body);

  let departmentid = req.params.departmentid;


  if (departmentid == "default") {
    console.log("departmentid", departmentid);

    var query = {};
    // console.log("req.query", req.query);

    // if (req.appid) {
    query.id_project = req.projectid;
    query.default = true;
    // }

    console.log("query", query);

    Department.findOne(query, function (err, department) {
      if (err) return (err);

      return res.json(department);
    });

  } else {
    Department.findById(departmentid, function (err, department) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!department) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(department);
    });
  }

});

// router.get('/', passport.authenticate(['anonymous'], { session: false }), function (req, res) {

// GET DEPTS FILTERED FOR STATUS === 1 and WITHOUT AUTHENTICATION (USED BY THE WIDGET)
// note:THE STATUS EQUAL TO 1 CORRESPONDS TO THE DEPARTMENTS VISIBLE THE STATUS EQUAL TO 0 CORRESPONDS TO THE HIDDEN DEPARTMENTS
router.get('/', function (req, res) {

  //console.log("req projectid", req.projectid);
  //console.log("req.query.sort", req.query.sort);

  /** 
   * inserire qui cond x far funzionare sul widget  dipartimenti nn disponibili se 
   * il piano e free con trial scaduto o a pagamento con sottoscrizione scaduta
   */
  var query = { "id_project": req.projectid, "status": 1 };
  console.log('GET DEPTS FILTERED FOR STATUS === 1')

  if ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {

    query.default = true;
  }

  if (req.query.sort) {
    // COMMENTO QUESTO 11.09.19 return Department.find({ "id_project": req.projectid, "status": 1 }).sort({ name: 'asc' }).exec(function (err, departments) {
    return Department.find(query).sort({ name: 'asc' }).exec(function (err, departments) {

      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  } else {
    return Department.find(query, function (err, departments) {
      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  }
});



module.exports = router;
