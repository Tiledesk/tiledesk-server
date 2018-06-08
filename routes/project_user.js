var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require("../models/user");

var passport = require('passport');
require('../config/passport')(passport);
var validtoken = require('../middleware/valid-token')
// var User = require("../models/user");


// MOVED IN ROUTES > PROJECT.JS
// router.post('/', function (req, res) {

//   console.log(req.body);
//   var newProject_user = new Project_user({
//     id_project: req.body.id_project,
//     id_user: req.body.id_user,
//     role: req.body.role,
//     appId: req.appid,
//     createdBy: req.user.id,
//     updatedBy: req.user.id
//   });

//   newProject_user.save(function (err, savedProject_user) {
//     if (err) {
//       console.log('--- > ERROR ', err)
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     }
//     res.json(savedProject_user);
//   });
// });

// NEW: INVITE A USER
router.post('/invite', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  console.log('-> INVITE USER ', req.body);

  // var email = req.body.email
  console.log('INVITE USER EMAIL', req.body.email);

  User.findOne({
    email: req.body.email
  }, 'email firstname lastname password id', function (err, user) {
    if (err) throw err;

    if (!user) {

      return res.status(401).send({ success: false, msg: 'User not found.' });

    } else if (req.user.id == user._id) {
      console.log('-> -> FOUND USER ID', user._id)
      console.log('-> -> CURRENT USER ID', req.user.id);
      // if the current user id is = to the id of found user return an error:
      // (a user is not allowed to invite himself) 

      console.log('XXX XXX FORBIDDEN')
      return res.status(403).send({ success: false, msg: 'Forbidden.' });

    } else {
      var newProject_user = new Project_user({
        _id: new mongoose.Types.ObjectId(),
        id_project: req.body.id_project,
        id_user: user._id,
        role: req.body.role,
        user_available: true,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      newProject_user.save(function (err, savedProject_user) {
        if (err) {
          console.log('--- > ERROR ', err)
          return res.status(500).send({ success: false, msg: 'Error saving object.' });
        }
        res.json(savedProject_user);
      });
    }

  });
});



router.put('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  console.log(req.body);

  Project_user.findByIdAndUpdate(req.params.project_userid, req.body, { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedProject_user);
  });
});


router.delete('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  console.log(req.body);

  Project_user.remove({ _id: req.params.project_userid }, function (err, project_user) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(project_user);
  });
});


/* !! NOT USED */
// router.get('/:project_userid', function (req, res) {

//   console.log(req.body);

//   Project_user.findById(req.params.project_userid, function (err, project_user) {
//     if (err) {
//       return res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!project_user) {
//       return res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     res.json(project_user);
//   });
// });

router.get('/details/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  // console.log("PROJECT USER ROUTES - req projectid", req.projectid);
  Project_user.find({ _id: req.params.project_userid }).
    populate('id_user').
    exec(function (err, project_users) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!project_users) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(project_users);
    });

});


/**
 * GET PROJECT-USER BY PROJECT ID AND CURRENT USER ID
 */
router.get('/:user_id/:project_id', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  // console.log("PROJECT USER ROUTES - req projectid", req.projectid);
  console.log("--> USER ID ", req.params.user_id);
  console.log("--> PROJECT ID ", req.params.project_id);
  Project_user.find({ id_user: req.params.user_id, id_project: req.params.project_id }).
    exec(function (err, project_users) {
      if (err) return next(err);
      res.json(project_users);

    });
});


/**
 * RETURN THE PROJECT-USERS OBJECTS FILTERD BY PROJECT-ID AND WITH NESTED THE USER OBJECT
 * WF: 1. GET PROJECT-USER by the passed project ID
 *     2. POPULATE THE user_id OF THE PROJECT-USER object WITH THE USER OBJECT
 */
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
  // console.log("PROJECT USER ROUTES - req projectid", req.projectid);
  Project_user.find({ id_project: req.projectid }).
    populate('id_user').
    exec(function (err, project_users) {
      // console.log('PROJECT USER ROUTES - project_users: ', project_users)
      res.json(project_users);
    });
  // , function (err, project_users) {
  //   if (err) return next(err);
  //   console.log('PROJECT USER ROUTES - project_users ', project_users)
  //   res.json(project_users);
  // });
});

// NEW - AS ABOVE BUT RETURN ONLY THE USER NAME AND THE USER ID OF THE AVAILABLE PROJECT-USER
router.get('/availables', function (req, res) {
  // console.log("PROJECT USER ROUTES - req projectid", req.projectid);
  Project_user.find({ id_project: req.projectid, user_available: true }).
    populate('id_user').
    exec(function (err, project_users) {
      console.log('PROJECT USER ROUTES - AVAILABLES project_users: ', project_users);
      console.log('PROJECT USER ROUTES - COUNT OF AVAILABLES project_users: ', project_users.length);

      user_available_array = [];
      project_users.forEach(project_user => {

        user_available_array.push({ "id": project_user.id_user._id, "firstname": project_user.id_user.firstname });
      });

      console.log('ARRAY OF THE AVAILABLE USER ', user_available_array);

      res.json(user_available_array);
    });

});


module.exports = router;
