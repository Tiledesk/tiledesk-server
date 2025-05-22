var express = require('express');
var router = express.Router();
var Role = require("../models/role");
var winston = require('../config/winston');

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  var newRole = new Role({
              name: req.body.name,
              permissions: req.body.permissions,              
              id_project: req.projectid,
              createdBy: req.user.id,
              updatedBy: req.user.id
            });
          
  newRole.save(function(err, savedRole) {
      if (err) {
        winston.error('Error saving the role '+ JSON.stringify(newRole), err)
        return res.status(500).send({ success: false, msg: 'Error inserting object.' });
      }            

      return res.json(savedRole);
  })


});

router.put('/:roleid', function (req, res) {
  winston.debug(req.body);
  var update = {};
  
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }
  
  if (req.body.permissions!=undefined) {
    update.permissions = req.body.permissions;
  }
   
  
  Role.findByIdAndUpdate(req.params.roleid, update, { new: true, upsert: true }, function (err, updatedRole) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
  
    res.json(updatedRole);
  });
});



router.delete('/:roleid', function (req, res) {
  winston.debug(req.body);

  Role.remove({ _id: req.params.roleid }, function (err, role) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }


    res.json(role);
  });
});


router.get('/:roleid', function (req, res) {
  winston.debug(req.body);

  Role.findById(req.params.roleid, function (err, role) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!role) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(role);
  });
});


router.get('/', async(req, res) => {

  var limit = 40; // Number of request per page

  if (req.query.limit) {    
    limit = parseInt(req.query.limit);
    winston.debug('LEAD ROUTE - limit: '+limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('ROLE ROUTE - SKIP PAGE ', skip);


  var query = {};


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);



  return Role.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, roles) {
      if (err) {
        winston.error('ROLE ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }


      return res.json(roles);
      
    });
});




module.exports = router;
