var express = require('express');
var router = express.Router({mergeParams: true});
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require("../models/user");
var emailService = require("../services/emailService");
var Project = require("../models/project");
// var PendingInvitation = require("../models/pending-invitation");
var pendinginvitation = require("../services/pendingInvitationService");
const authEvent = require('../event/authEvent');
var winston = require('../config/winston');
var RoleConstants = require("../models/roleConstants");


var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role');



// NEW: INVITE A USER
router.post('/invite', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug('-> INVITE USER ', req.body);

  winston.debug('»»» INVITE USER EMAIL', req.body.email);
  winston.debug('»»» CURRENT USER ID', req.user._id);
  winston.debug('»»» PROJECT ID', req.projectid);
// authType
  User.findOne({ email: req.body.email
    // , authType: 'email_password' 
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      /*
       * *** USER NOT FOUND > SAVE EMAIL AND PROJECT ID IN PENDING INVITATION *** */
      // TODO req.user.firstname is null for bot visitor
      return pendinginvitation.saveInPendingInvitation(req.projectid, req.project.name, req.body.email, req.body.role, req.user._id, req.user.firstname, req.user.lastname)
        .then(function (savedPendingInvitation) {      
           
            authEvent.emit('project_user.invite.pending', {req: req, savedPendingInvitation: savedPendingInvitation});
     
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

      var role = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT];     
      winston.debug("role", role);
    
      // winston.debug("PROJECT USER ROUTES - req projectid", req.projectid);
      return Project_user.find({ id_project: req.projectid, role: { $in : role }  }, function (err, projectuser) {
        winston.debug('PRJCT-USERS FOUND (FILTERED FOR THE PROJECT ID) ', projectuser)
        if (err) {
          winston.error("Error gettting project_user for invite", err);
          return res.status(500).send(err);
        }

        if (!projectuser) {
          // winston.debug('*** PRJCT-USER NOT FOUND ***')
          return res.status(404).send({ success: false, msg: 'Project user not found.' });
        }

        if (projectuser) {
          try {
            projectuser.forEach(p_user => {
              if (p_user) {
                // winston.debug('»»»» FOUND USER ID: ', user._id, ' TYPE OF ', typeof (user._id))
                // winston.debug('»»»» PRJCT USER > USER ID: ', p_user.id_user, ' TYPE OF ', typeof (p_user.id_user));
                var projectUserId = p_user.id_user.toString();
                var foundUserId = user._id.toString()

                winston.debug('»»»» FOUND USER ID: ', foundUserId, ' TYPE OF ', typeof (foundUserId))
                winston.debug('»»»» PRJCT USER > USER ID: ', projectUserId, ' TYPE OF ', typeof (projectUserId));

                // var n = projectuser.includes('5ae6c62c61c7d54bf119ac73');
                // winston.debug('USER IS ALREADY A MEMBER OF THE PROJECT ', n)
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
            id_project: req.projectid,
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

            emailService.sendYouHaveBeenInvited(req.body.email, req.user.firstname, req.user.lastname, req.project.name, req.projectid, invitedUserFirstname, invitedUserLastname, req.body.role)
            
            // try {
              //test it
              savedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, savedProject_userPopulated){
                   authEvent.emit('project_user.invite', {req:req, savedProject_userPopulated: savedProject_userPopulated});
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
            //     winston.debug('INVITE USER - PROJECT FOUND BY PROJECT ID ' , project)
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


// router.put('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {

//   winston.debug("projectuser put", req.body);

//   var update = {};
  
//   update.user_available = req.body.user_available;
//   update.max_served_chat = req.body.max_served_chat;
//   update.attributes = req.body.attributes;


//   Project_user.findByIdAndUpdate(req.projectuser.id, update,  { new: true, upsert: true }, function (err, updatedProject_user) {
//     if (err) {
//       winston.error("Error gettting project_user for update", err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//       updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){                
//           authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});
//       });
    

//     res.json(updatedProject_user);
//   });
// });

router.put('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {

  winston.debug("projectuser patch", req.body);

  var update = {};
  
  if (req.body.user_available!=undefined) {
    update.user_available = req.body.user_available;
  }
  
  if (req.body.max_served_chat!=undefined) {
    update.max_served_chat = req.body.max_served_chat;
  }
  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }


  Project_user.findByIdAndUpdate(req.projectuser.id, update,  { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user for update", err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
      updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){                
          authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});
      });
    

    res.json(updatedProject_user);
  });
});

// router.put('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

//   winston.info("project_userid update", req.body);

//   var update = {};
  
//   update.role = req.body.role;
//   update.user_available = req.body.user_available;
//   update.max_served_chat = req.body.max_served_chat;
//   update.attributes = req.body.attributes;

//   winston.info("project_userid update", update);

//   Project_user.findByIdAndUpdate(req.params.project_userid, update, { new: true, upsert: true }, function (err, updatedProject_user) {
//     if (err) {
//       winston.error("Error gettting project_user for update", err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }
//       updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){                
//           authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});
//       });
    

//     res.json(updatedProject_user);
//   });
// });


router.put('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('admin', ['subscription'])], function (req, res) {

  winston.info("project_userid update", req.body);

  var update = {};
  
  if (req.body.role!=undefined) {
    update.role = req.body.role;
  }

  if (req.body.user_available!=undefined) {
    update.user_available = req.body.user_available;
  }

  if (req.body.max_served_chat!=undefined) {
    update.max_served_chat = req.body.max_served_chat;
  }

  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }

  winston.info("project_userid update", update);

  Project_user.findByIdAndUpdate(req.params.project_userid, update, { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user for update", err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
      updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){                
          authEvent.emit('project_user.update', {updatedProject_userPopulated:updatedProject_userPopulated, req: req});
      });
    

    res.json(updatedProject_user);
  });
});


router.delete('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);

  Project_user.findByIdAndRemove(req.params.project_userid, { new: false}, function (err, project_user) {
    if (err) {
      winston.error("Error gettting project_user for delete", err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    winston.info("Removed project_user", project_user);

    project_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, project_userPopulated){   
      authEvent.emit('project_user.delete', {req: req, project_userPopulated: project_userPopulated});
    });
    
    res.json(project_user);
  });
});

router.get('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res) {
  // router.get('/details/:project_userid', function (req, res) {
  // winston.debug("PROJECT USER ROUTES - req projectid", req.projectid);
  Project_user.findOne({ _id: req.params.project_userid, id_project: req.projectid}).
    populate('id_user').
    exec(function (err, project_user) {
      if (err) {
        winston.error("Error gettting project_user for get", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!project_user) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(project_user);
    });

});



/**
 * GET PROJECT-USER BY PROJECT ID AND CURRENT USER ID 
//  */
 router.get('/users/:user_id', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res, next) {
   winston.debug("--> users USER ID ", req.params.user_id);
   // project_user_qui
   Project_user.find({ id_user: req.params.user_id, id_project: req.projectid }).
    populate('id_user').
     exec(function (err, project_user) {
      if (err) {
        winston.error("Error gettting project_user for get users", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!project_user) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      res.json(project_user);

     });
});


//TODO deprecate. Used by pstream dashboard
// router.get('/:user_id/:project_id', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')],function (req, res, next) {
//  winston.debug("--> USER ID ", req.params.user_id);
//  winston.debug("--> PROJECT ID ", req.params.project_id);
//  Project_user.find({ id_user: req.params.user_id, id_project: req.params.project_id }).
//     exec(function (err, project_users) {
//       if (err) return next(err);
//       res.json(project_users);

//     });
// });


/**
 * RETURN THE PROJECT-USERS OBJECTS FILTERD BY PROJECT-ID AND WITH NESTED THE USER OBJECT
 * WF: 1. GET PROJECT-USER by the passed project ID
 *     2. POPULATE THE user_id OF THE PROJECT-USER object WITH THE USER OBJECT
 */
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {
  var role = [RoleConstants.OWNER, RoleConstants.ADMIN,RoleConstants.AGENT];
  if (req.query.role) {
    role = req.query.role;
  }
  winston.debug("role", role);

  Project_user.find({ id_project: req.projectid, role: { $in : role } }).
    populate('id_user').
    exec(function (err, project_users) {
      if (err) {
        winston.info("Error gettting project_user for get users", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      res.json(project_users);
    });
});


module.exports = router;
