var express = require('express');
var router = express.Router();
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require("../models/user");
var emailService = require("../models/emailService");
var Project = require("../models/project");
// var PendingInvitation = require("../models/pending-invitation");
var pendinginvitation = require("../services/pendingInvitationService");
var Activity = require("../models/activity");
const activityEvent = require('../event/activityEvent');
var winston = require('../config/winston');

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
router.post('/invite', function (req, res) {

  winston.debug('-> INVITE USER ', req.body);

  // var email = req.body.email
  winston.debug('»»» INVITE USER EMAIL', req.body.email);
  winston.debug('»»» CURRENT USER ID', req.user.id);
  winston.debug('»»» PROJECT ID', req.body.id_project);

  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) throw err;

    if (!user) {
      /*
       * *** USER NOT FOUND > SAVE EMAIL AND PROJECT ID IN PENDING INVITATION *** */
      return pendinginvitation.saveInPendingInvitation(req.body.id_project, req.body.project_name, req.body.email, req.body.role, req.user.id, req.user.firstname, req.user.lastname)
        .then(function (savedPendingInvitation) {


        // try {
            var activity = new Activity({actor: {type:"user", id: req.user.id, name: req.user.fullName }, 
                verb: "PROJECT_USER_INVITE", actionObj: req.body, 
                target: {type:"pendinginvitation", id:savedPendingInvitation._id.toString(), object: savedPendingInvitation }, 
                id_project: req.projectid });
            activityEvent.emit('project_user.invite', activity);
        // } catch(e) {winston.error('Error emitting activity');}
     


          return res.json({ msg: "User not found, save invite in pending ", pendingInvitation: savedPendingInvitation });
        })
        .catch(function (err) {
          return res.send(err);
          // return res.status(500).send(err);
        });
      // return res.status(404).send({ success: false, msg: 'User not found.' });

    } else if (req.user.id == user._id) {
      winston.debug('-> -> FOUND USER ID', user._id)
      winston.debug('-> -> CURRENT USER ID', req.user.id);
      // if the current user id is = to the id of found user return an error:
      // (to a user is not allowed to invite oneself) 

      winston.debug('XXX XXX FORBIDDEN')
      return res.status(403).send({ success: false, msg: 'Forbidden. It is not allowed to invite oneself', code: 4000 });

    } else {

      /**
       * *** IT IS NOT ALLOWED TO INVITE A USER WHO IS ALREADY A MEMBER OF THE PROJECT *** 
       * FIND THE PROJECT USERS FOR THE PROJECT ID PASSED BY THE CLIENT IN THE BODY OF THE REQUEST
       * IF THE ID OF THE USER FOUND FOR THE EMAIL (PASSED IN THE BODY OF THE REQUEST - see above)
       * MATCHES ONE OF THE USER ID CONTENTS IN THE PROJECTS USER OBJECT STOP THE WORKFLOW AND RETURN AN ERROR */
      return Project_user.find({ id_project: req.body.id_project }, function (err, projectuser) {
        winston.debug('PRJCT-USERS FOUND (FILTERED FOR THE PROJECT ID) ', projectuser)
        if (err) {
          return res.status(500).send(err);
        }

        if (!projectuser) {
          // console.log('*** PRJCT-USER NOT FOUND ***')
          return res.status(404).send({ success: false, msg: 'Project user not found.' });
        }

        if (projectuser) {
          try {
            projectuser.forEach(p_user => {
              if (p_user) {
                // console.log('»»»» FOUND USER ID: ', user._id, ' TYPE OF ', typeof (user._id))
                // console.log('»»»» PRJCT USER > USER ID: ', p_user.id_user, ' TYPE OF ', typeof (p_user.id_user));
                var projectUserId = p_user.id_user.toString();
                var foundUserId = user._id.toString()

                winston.debug('»»»» FOUND USER ID: ', foundUserId, ' TYPE OF ', typeof (foundUserId))
                winston.debug('»»»» PRJCT USER > USER ID: ', projectUserId, ' TYPE OF ', typeof (projectUserId));

                // var n = projectuser.includes('5ae6c62c61c7d54bf119ac73');
                // console.log('USER IS ALREADY A MEMBER OF THE PROJECT ', n)
                if (projectUserId == foundUserId) {
                  // if ('5ae6c62c61c7d54bf119ac73' == '5ae6c62c61c7d54bf119ac73') {

                    winston.debug('»»»» THE PRJCT-USER ID ', p_user.id_user, ' MATCHES THE FOUND USER-ID', user._id)
                    winston.debug('»»»» USER IS ALREADY A MEMBER OF THE PROJECT ')

                  // cannot use continue or break inside a JavaScript Array.prototype.forEach loop. However, there are other options:
                  throw new Error('User is already a member'); // break
                  // return res.status(403).send({ success: false, msg: 'Forbidden. User is already a member' });
                }
              }
            });
          }
          catch (e) {
            winston.error('»»» ERROR ', e)
            return res.status(403).send({ success: false, msg: 'Forbidden. User is already a member', code: 4001 });
          }

          winston.debug('NO ERROR, SO CREATE AND SAVE A NEW PROJECT USER ')

          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: req.body.id_project,
            id_user: user._id,
            role: req.body.role,
            user_available: true,
            createdBy: req.user.id,
            updatedBy: req.user.id
          });

          return newProject_user.save(function (err, savedProject_user) {
            if (err) {
              winston.error('--- > ERROR ', err)
              return res.status(500).send({ success: false, msg: 'Error saving object.' });
            }



            winston.debug('INVITED USER (IS THE USER FOUND BY EMAIL) ', user);
            winston.debug('EMAIL of THE INVITED USER ', req.body.email);
            winston.debug('ROLE of THE INVITED USER ', req.body.role);
            winston.debug('PROJECT NAME ', req.body.role);
            winston.debug('LOGGED USER ID ', req.user.id);
            winston.debug('LOGGED USER NAME ', req.user.firstname);
            winston.debug('LOGGED USER NAME ', req.user.lastname);


            var invitedUserFirstname = user.firstname
            var invitedUserLastname = user.lastname

            emailService.sendYouHaveBeenInvited(req.body.email, req.user.firstname, req.user.lastname, req.body.project_name, req.body.id_project, invitedUserFirstname, invitedUserLastname, req.body.role)
            
            // try {
              //test it
              savedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, savedProject_userPopulated){
                var activity = new Activity({actor: {type:"user", id: req.user.id, name: req.user.fullName }, 
                  verb: "PROJECT_USER_INVITE", actionObj: req.body, 
                  target: {type:"project_user", id:savedProject_userPopulated._id.toString(), object: savedProject_userPopulated.toObject() }, 
                  id_project: req.projectid });
                activityEvent.emit('project_user.invite', activity);
              });
            // } catch(e) {winston.error('Error emitting activity');}
            
            return res.json(savedProject_user);

            // found the project by the project id to indicate the project name in the email
            // Project.findOne({ _id: req.body.id_project }, function (err, project) {

            //   if (err) throw err;

            //   if (!project) {
            //     return res.json({ success: false, msg: 'Project not found.' });
            //   }

            //   if (project) {
            //     console.log('INVITE USER - PROJECT FOUND BY PROJECT ID ' , project)
            //     if (project){
            //       var projectName = project.name;

            //     }
            //   }
            // });

          });

        }
      })
    }
  });
});


router.put('/:project_userid', function (req, res) {

  winston.debug(req.body);

  Project_user.findByIdAndUpdate(req.params.project_userid, req.body, { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    // try {
      // let updatedProject_userPopulated = await updatedProject_user.populate('id_user');
      // updatedProject_user.populate('id_user','firstname, lastname').execPopulate().exec(function (err, updatedProject_userPopulated) {
        updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){
        // console.log("updatedProject_userPopulated", updatedProject_userPopulated.toJSON());
          // var u = delete updatedProject_userPopulated.id_user.password;
          var activity = new Activity({actor: {type:"user", id: req.user.id, name: req.user.fullName }, 
              verb: "PROJECT_USER_UPDATE", actionObj: req.body, 
              target: {type:"project_user", id:updatedProject_user._id.toString(), object: updatedProject_userPopulated.toObject() }, 
              id_project: req.projectid });
          activityEvent.emit('project_user.update', activity);
      });
    // } catch(e) {winston.error('Error emitting activity');}
    

    res.json(updatedProject_user);
  });
});


router.delete('/:project_userid', function (req, res) {

  winston.debug(req.body);

  Project_user.findByIdAndRemove(req.params.project_userid, { new: false}, function (err, project_user) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    winston.info("Removed project_user", project_user);

  // try {
    project_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, project_userPopulated){
    var activity = new Activity({actor: {type:"user", id: req.user.id, name: req.user.fullName }, 
        verb: "PROJECT_USER_DELETE", actionObj: req.body, 
        target: {type:"project_user", id:req.params.project_userid, object: project_userPopulated.toObject() }, //Error saving activity Maximum call stack size exceeded
        id_project: req.projectid });
    activityEvent.emit('project_user.delete', activity);
    });
  // } catch(e) {winston.error('Error emitting activity');}

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

router.get('/details/:project_userid', function (req, res) {
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
router.get('/:user_id/:project_id', function (req, res, next) {
  // console.log("PROJECT USER ROUTES - req projectid", req.projectid);
  winston.debug("--> USER ID ", req.params.user_id);
  winston.debug("--> PROJECT ID ", req.params.project_id);
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
router.get('/', function (req, res) {
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


module.exports = router;
