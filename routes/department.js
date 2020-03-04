var express = require('express');
var router = express.Router({mergeParams: true});
var Department = require("../models/department");
var departmentService = require("../services/departmentService");
var departmentEvent = require("../event/departmentEvent");

var Group = require("../models/group");

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role');

var winston = require('../config/winston');

// attento qui

router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

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
    winston.info('NEW DEPT SAVED ', savedDepartment);
    departmentEvent.emit('department.create', savedDepartment);
    res.json(savedDepartment);
  });
});

router.put('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);

  var update = {};
  
    update.id_bot = req.body.id_bot;
    update.bot_only = req.body.bot_only;
    update.routing = req.body.routing;
    update.name = req.body.name;
    update.id_group = req.body.id_group;
    update.online_msg = req.body.online_msg;
    update.status = req.body.status;
  


  Department.findByIdAndUpdate(req.params.departmentid, update, { new: true, upsert: true }, function (err, updatedDepartment) {
    if (err) {
      winston.error('Error putting the department ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    departmentEvent.emit('department.update', updatedDepartment);
    res.json(updatedDepartment);
  });
});
// nn funziona

router.delete('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);
  winston.info("req.params.departmentid: "+req.params.departmentid);

  Department.findOneAndRemove({_id: req.params.departmentid}, function (err, department) {
  // Department.remove({ _id: req.params.departmentid }, function (err, department) {
    
    if (err) {
      winston.error('Error deleting the department ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    // nn funziuona perchje nn c'è id_project
    departmentEvent.emit('department.delete', department);
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

// START - GET MY DEPTS
// !!! NO MORE USED 
// ============= GET ALL GROUPS WITH THE PASSED PROJECT ID =============
// elimino???
// router.get('/mydepartments', function (req, res) {
//   winston.debug("req projectid", req.projectid);

//   var query = { "id_project": req.projectid };

//   if (req.project.isActiveSubscription() == false) {
//     query.default = true;
//   }

//   Department.find(query, function (err, departments) {
//     if (err) return next(err);
//     winston.debug('1) FIND MY DEPTS - ALL DEPTS ARRAY ', departments)
//     // departments_array.push(departments);
//     // winston.debug('-- -- -- array of depts - null', arr)

//     Group.find({ "id_project": req.projectid, trashed: false, members: req.user.id }, function (err, groups) {
//       if (err) return next(err);
//       winston.debug('2) GET MY DEPTS - MY GROUPS ARRAY ', groups)
//       var mydepts = []
//       departments.forEach(dept => {

//         // winston.debug('3) DEPT ', dept)
//         if (dept.id_group == null) {
//           winston.debug('DEPT NAME (when null/undefined) ', dept.name, ', dept id ', dept._id)
//           mydepts.push(dept._id);

//           // FOR DEBUG
//           // mydepts.forEach(mydept => {
//           //   winston.debug('- MY DEPT NAME: ', mydept.name, ', ID GROUP: ', mydept.id_group)
//           // });
//           // winston.debug('- MY DEPTS ARRAY ', mydepts)
//         }
//         else {
//           deptContainsMyGroup(groups)
//           // groups.forEach(group => {
//           //   winston.debug('4) GROUP ', group)
//           //   if ( group._id == dept.id_group) {
//           //     mydepts.push(dept);
//           //     winston.debug('-- MY DEPTS ARRAY ', mydepts)
//           //   }
//           // });
//           // winston.debug('-- MY DEPTS ARRAY ', mydepts)
//         }

//         function deptContainsMyGroup(groups) {
//           groups.forEach(group => {
//             // winston.debug('4) GROUP ', group)
//             if (group._id == dept.id_group) {
//               winston.debug('DEPT NAME (my departments) ', dept.name, ', dept id ', dept._id)
//               mydepts.push(dept._id);
//             }
//           });
//         }

//       });
//       return res.json(mydepts);
//     })

//   });
// })

// ======================== ./END - GET MY DEPTS ========================

// GET ALL DEPTS (i.e. NOT FILTERED FOR STATUS and WITH AUTHENTICATION (USED BY THE DASHBOARD)
router.get('/allstatus', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])], function (req, res) {

  winston.debug("## GET ALL DEPTS req.project.isActiveSubscription ", req.project.isActiveSubscription)
  winston.debug("## GET ALL DEPTS req.project.trialExpired ", req.project.trialExpired)
  winston.debug("## GET ALL DEPTS eq.project.profile.type ", req.project.profile.type)

  winston.debug("## GET ALL DEPTS req.project ", req.project)

  var query = { "id_project": req.projectid };
  if ((req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {

    query.default = true;
  }

  // if (req.project) {
  //   Project.findById(req.project._id, function (err, project) {
  //     if (err) {
  //       winston.debug("## GET ALL DEPTS Problem getting project with id:", req.project._id);
  //       //console.warn("Error getting project with id",projectid, err);
  //     } else {
  //       winston.debug("## GET ALL DEPTS project: ", project);
  //     }
  //   })
  // }
  //winston.debug("req projectid", req.projectid);
  //winston.debug("req.query.sort", req.query.sort);

  // var query = { "id_project": req.projectid };

  // if (req.project.isActiveSubscription()==false) {
  //   query.default=true;
  // }

  if (req.query.sort) {
    // return Department.find({ "id_project": req.projectid }).sort({ updatedAt: 'desc' }).exec(function (err, departments) {
    // QUESTO LO COMMENTO 11.09.19 return Department.find({ "id_project": req.projectid }).sort({ name: 'asc' }).exec(function (err, departments) { 
      winston.debug("## GET ALL DEPTS QUERY (1)", query)
    return Department.find(query).sort({ name: 'asc' }).exec(function (err, departments) {

      if (err) {
        winston.error('Error getting the departments.', err);
        winston.debug('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  } else {
    winston.debug("## GET ALL DEPTS QUERY (1)", query)
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
  winston.debug(req.body);

  let departmentid = req.params.departmentid;


  if (departmentid == "default") {
    winston.debug("departmentid", departmentid);

    var query = {};
    // winston.debug("req.query", req.query);

    // if (req.appid) {
    query.id_project = req.projectid;
    query.default = true;
    // }

    winston.debug("query", query);

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

  winston.debug("req projectid", req.projectid);
  winston.debug("req.query.sort", req.query.sort);


  var query = { "id_project": req.projectid, "status": 1 };
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.projectid ', req.projectid);
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.profile.type ', req.project.profile.type);
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.profile.type ',  req.project.trialExpired);
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.isActiveSubscription ',  req.project.isActiveSubscription);
  

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
