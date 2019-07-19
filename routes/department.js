var express = require('express');
var router = express.Router();
var Department = require("../models/department");
var departmentService = require("../services/departmentService");

var Project_user = require("../models/project_user");
var Group = require("../models/group");

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var operatingHoursService = require("../models/operatingHoursService");
// var passport = require('passport');
// var validtoken = require('.../middleware/valid-token')
var winston = require('../config/winston');


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

// questo viene chiamato dal widget perche?

router.get('/:departmentid/operators', function (req, res) {
  winston.info("Getting department operators");
  // getOperators(departmentid, projectid, nobot) {
  departmentService.getOperators(req.params.departmentid, req.projectid, req.query.nobot ).then(function(operatorsResult) {
    return res.json(operatorsResult);
  }).catch(function(err){
    winston.error('Error getting the department operators ', err);     
    return res.status(500).send({ success: false, msg: 'Error getting departments operatotors.' });
  });
});


// START - GET MY DEPTS
// !!! NO MORE USED 
// ============= GET ALL GROUPS WITH THE PASSED PROJECT ID =============
router.get('/mydepartments', function (req, res) {
  console.log("req projectid", req.projectid);

  
  Department.find({ "id_project": req.projectid }, function (err, departments) {
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

  winston.info("req projectid", req.projectid);
  winston.info("req.query.sort", req.query.sort);


  if (req.query.sort) {
    winston.info("req.query.sort");
    // return Department.find({ "id_project": req.projectid }).sort({ updatedAt: 'desc' }).exec(function (err, departments) {
      return Department.find({ "id_project": req.projectid }).sort({ name: 'asc' }).exec(function (err, departments) {      
        if (err) {
          winston.error('Error getting the departments.', err);
          return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
        }
        winston.info("departments", departments);
        return res.json(departments);
    });
  } else {
    winston.info("no req.query.sort");
    return Department.find({ "id_project": req.projectid }, function (err, departments) {
      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }
      winston.info("departments", departments);
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


  if (req.query.sort) {
     Department.find({ "id_project": req.projectid, "status": 1 }).sort({ name: 'asc' }).exec(function (err, departments) {
      // return Department.find({ "id_project": req.projectid, "status": 1 }).sort({ updatedAt: 'desc' }).exec(function (err, departments) {
      
      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  } else {
     Department.find({ "id_project": req.projectid, "status": 1 }, function (err, departments) {
      if (err) {
        winston.error('Error getting the departments.', err);
        return res.status(500).send({ success: false, msg: 'Error getting the departments.', err: err });
      }

      return res.json(departments);
    });
  }
});



module.exports = router;
