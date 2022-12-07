var express = require('express');
var router = express.Router({mergeParams: true});
var Department = require("../models/department");
var departmentService = require("../services/departmentService");

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role');

var winston = require('../config/winston');
var cacheUtil = require('../utils/cacheUtil');

var departmentEvent = require("../event/departmentEvent");


router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug("DEPT REQ BODY ", req.body);
  var newDepartment = new Department({
      routing: req.body.routing,
      name: req.body.name,
      description: req.body.description,
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
      winston.debug('NEW DEPT SAVED ', savedDepartment);
      departmentEvent.emit('department.create', savedDepartment);
      res.json(savedDepartment);
  });
});



router.put('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);

  var update = {};

  // qui errore su visibile invisible
  // if (req.body.id_bot!=undefined) {
      update.id_bot = req.body.id_bot;
  // }
  if (req.body.bot_only!=undefined) {
      update.bot_only = req.body.bot_only;
  }
  if (req.body.routing!=undefined) {
      update.routing = req.body.routing;
  }
  if (req.body.name!=undefined) {
      update.name = req.body.name;
  }
  if (req.body.description!=undefined) {
      update.description = req.body.description;
  }  
  // if (req.body.id_group!=undefined) {
      update.id_group = req.body.id_group;
  // }
  if (req.body.online_msg!=undefined) {
      update.online_msg = req.body.online_msg;
  }
  if (req.body.status!=undefined) {
      update.status = req.body.status;
  }
  


  Department.findByIdAndUpdate(req.params.departmentid, update, { new: true, upsert: true }, function (err, updatedDepartment) {
      if (err) {
      winston.error('Error putting the department ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
      }
      departmentEvent.emit('department.update', updatedDepartment);
      res.json(updatedDepartment);
  });
  });


  router.patch('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

    winston.debug(req.body);
  
    var update = {};
  
   
    if (req.body.status!=undefined) {
        update.status = req.body.status;
    }
    if (req.body.id_bot!=undefined) {
      update.id_bot = req.body.id_bot;
    }
    if (req.body.bot_only!=undefined) {
      update.bot_only = req.body.bot_only;
    }
    if (req.body.routing!=undefined) {
        update.routing = req.body.routing;
    }
    if (req.body.name!=undefined) {
        update.name = req.body.name;
    }
    if (req.body.description!=undefined) {
        update.description = req.body.description;
    }  
    if (req.body.id_group!=undefined) {
        update.id_group = req.body.id_group;
    }    
  
  
    Department.findByIdAndUpdate(req.params.departmentid, update, { new: true, upsert: true }, function (err, updatedDepartment) {
        if (err) {
        winston.error('Error patching the department ', err);
        return res.status(500).send({ success: false, msg: 'Error patching object.' });
        }
        departmentEvent.emit('department.update', updatedDepartment);
        res.json(updatedDepartment);
    });
    });


  // TODO aggiungere altro endpoint qui che calcola busy status come calculate di tiledesk-queue


router.get('/:departmentid/operators', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])], async (req, res) => {
  winston.debug("Getting department operators req.projectid: "+req.projectid);
  
  var disableWebHookCall = undefined;
  if (req.query.disableWebHookCall) {
    disableWebHookCall = (req.query.disableWebHookCall == 'true') ;
  }

  winston.debug("disableWebHookCall: "+ disableWebHookCall);

  // getOperators(departmentid, projectid, nobot) {


    var context = {req:req};
  var operatorsResult = await departmentService.getOperators(req.params.departmentid, req.projectid, req.query.nobot, disableWebHookCall, context);
  winston.debug("Getting department operators operatorsResult", operatorsResult);


  
    return res.json(operatorsResult);

});


// ======================== ./END - GET MY DEPTS ========================

// GET ALL DEPTS (i.e. NOT FILTERED FOR STATUS and WITH AUTHENTICATION (USED BY THE DASHBOARD)
router.get('/allstatus', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])], function (req, res) {

  // winston.debug("## GET ALL DEPTS req.project.isActiveSubscription ", req.project.isActiveSubscription)
  // winston.debug("## GET ALL DEPTS req.project.trialExpired ", req.project.trialExpired)

  // if (req.project.profile) {
  //   winston.debug("## GET ALL DEPTS eq.project.profile.type ", req.project.profile.type);
  // }

  winston.debug("## GET ALL DEPTS req.project ", req.project)

  var query = { "id_project": req.projectid, status: { $gte:  0 } }; // nascondi quelli con status = hidden (-1) for dashboard
                                            //secondo me qui manca un parentesi tonda per gli or
  if (req.project && req.project.profile && (req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {

    query.default = true;
  }


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
    return Department.find(query)
    //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, req.projectid+":departments:query:allstatus")
    .exec(function (err, departments) {
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
  if (req.project && req.project.profile) {
    winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.profile.type ', req.project.profile.type);
  }
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.profile.type ',  req.project.trialExpired);
  winston.debug('GET DEPTS FILTERED FOR STATUS === 1 req.project.isActiveSubscription ',  req.project.isActiveSubscription);
  
                                            //secondo me qui manca un parentesi tonda per gli or
  if (req.project && req.project.profile && (req.project.profile.type === 'free' && req.project.trialExpired === true) || (req.project.profile.type === 'payment' && req.project.isActiveSubscription === false)) {

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

router.delete('/:departmentid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);
  winston.debug("req.params.departmentid: "+req.params.departmentid);

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


module.exports = router;
