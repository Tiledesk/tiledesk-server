var express = require('express');
var router = express.Router({mergeParams: true});
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require("../models/user");
var emailService = require("../services/emailService");
var Project = require("../models/project");
var pendinginvitation = require("../services/pendingInvitationService");
const authEvent = require('../event/authEvent');
var winston = require('../config/winston');
var RoleConstants = require("../models/roleConstants");
var ProjectUserUtil = require("../utils/project_userUtil");
const uuidv4 = require('uuid/v4');


var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role');



// NEW: INVITE A USER
router.post('/invite', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug('-> INVITE USER ', req.body);

  var email = req.body.email;
  if (email) {
    email = email.toLowerCase();
  }

  winston.debug('»»» INVITE USER EMAIL', email);
  winston.debug('»»» CURRENT USER ID', req.user._id);
  winston.debug('»»» PROJECT ID', req.projectid);
// authType
  User.findOne({ email: email, status: 100
    // , authType: 'email_password' 
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      /*
       * *** USER NOT FOUND > SAVE EMAIL AND PROJECT ID IN PENDING INVITATION *** */
      // TODO req.user.firstname is null for bot visitor
      return pendinginvitation.saveInPendingInvitation(req.projectid, req.project.name, email, req.body.role, req.user._id, req.user.firstname, req.user.lastname)
        .then(function (savedPendingInvitation) {      
           
            var eventData = {req: req, savedPendingInvitation: savedPendingInvitation};
            winston.debug("eventData",eventData);
            authEvent.emit('project_user.invite.pending', eventData);
     
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

      var role = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT];     
      winston.debug("role", role);
    
      // winston.debug("PROJECT USER ROUTES - req projectid", req.projectid);

        return Project_user.find({ id_project: req.projectid, role: { $in : role }, status: "active"}, function (err, projectuser) {

      
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
                    winston.warn("User " + projectUserId+ " is already a member of the project: " + req.projectid)

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

          var user_available = true;
          if (req.body.user_available!=undefined) {
            user_available = req.body.user_available;
          }
          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: req.projectid,
            id_user: user._id,
            role: req.body.role,           
            user_available: user_available, 
            createdBy: req.user.id,
            updatedBy: req.user.id
          });

          return newProject_user.save(function (err, savedProject_user) {
            if (err) {
              winston.error('--- > ERROR ', err)
              return res.status(500).send({ success: false, msg: 'Error saving object.' });
            }



            winston.debug('INVITED USER (IS THE USER FOUND BY EMAIL) ', user);
            winston.debug('EMAIL of THE INVITED USER ', email);
            winston.debug('ROLE of THE INVITED USER ', req.body.role);
            winston.debug('PROJECT NAME ', req.body.role);
            winston.debug('LOGGED USER ID ', req.user.id);
            winston.debug('LOGGED USER NAME ', req.user.firstname);
            winston.debug('LOGGED USER NAME ', req.user.lastname);


            var invitedUserFirstname = user.firstname
            var invitedUserLastname = user.lastname

            emailService.sendYouHaveBeenInvited(email, req.user.firstname, req.user.lastname, req.project.name, req.projectid, invitedUserFirstname, invitedUserLastname, req.body.role)
            
            // try {
              //test it
              savedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, savedProject_userPopulated){
                var pu = savedProject_userPopulated.toJSON();
                pu.isBusy = ProjectUserUtil.isBusy(savedProject_userPopulated, req.project.settings && req.project.settings.max_agent_assigned_chat);
        
                
                  var eventData = {req:req, savedProject_userPopulated: pu};
                  winston.debug("eventData",eventData);
                  authEvent.emit('project_user.invite', eventData);
              });
            // } catch(e) {winston.error('Error emitting activity');}
            
            return res.json(savedProject_user);

  
          });

        }
      })
    }
  });
});

router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {

  var newProject_user = new Project_user({
    id_project: req.projectid, //il fullname????
    uuid_user: uuidv4(),
    // role: RoleConstants.USER,   
    // - Create project_user endpoint by agent (Ticketing) now is with Guest Role      
    role: RoleConstants.GUEST,
    // permissions: req.body.permissions,         securiry issue here. you must check permession. Use only put endpoint (secured by admin)
    user_available: false,
    tags: req.body.tags, 
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  return newProject_user.save(function (err, savedProject_user) {
    if (err) {
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    return res.json(savedProject_user);
  });
})

router.put('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('agent')], function (req, res) {

  winston.debug("projectuser patch", req.body);

  var update = {};
  
  if (req.body.user_available!=undefined) {
    update.user_available = req.body.user_available;
  }

  if (req.body.profileStatus!=undefined) {
    update.profileStatus = req.body.profileStatus;
  }
  
  if (req.body.max_assigned_chat!=undefined) {
    update.max_assigned_chat = req.body.max_assigned_chat;
  }

  if (req.body.number_assigned_requests!=undefined) {
    update.number_assigned_requests = req.body.number_assigned_requests;
  }

  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }

  if (req.body["settings.email.notification.conversation.assigned.toyou"]!=undefined) {
    update["settings.email.notification.conversation.assigned.toyou"] = req.body["settings.email.notification.conversation.assigned.toyou"];
  }

  if (req.body["settings.email.notification.conversation.pooled"]!=undefined) {
    update["settings.email.notification.conversation.pooled"] = req.body["settings.email.notification.conversation.pooled"];
  }
  if (req.body.tags!=undefined) {
    update.tags = req.body.tags;
  }




  Project_user.findByIdAndUpdate(req.projectuser.id, update,  { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user for update", err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
      updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){    

        var pu = updatedProject_userPopulated.toJSON();
        pu.isBusy = ProjectUserUtil.isBusy(updatedProject_userPopulated, req.project.settings && req.project.settings.max_agent_assigned_chat);
        
        authEvent.emit('project_user.update', {updatedProject_userPopulated:pu, req: req});
      });
    

    res.json(updatedProject_user);
  });
});


router.put('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('admin', ['subscription'])], function (req, res) {

  winston.debug("project_userid update", req.body);

  var update = {};
  
  if (req.body.role!=undefined) {
    update.role = req.body.role;
  }

  // if (req.body.permissions!=undefined) {
  //   update.permissions = req.body.permissions;
  // }

  if (req.body.user_available!=undefined) {
    update.user_available = req.body.user_available;
  }

  if (req.body.profileStatus!=undefined) {
    update.profileStatus = req.body.profileStatus;
  }
  
  if (req.body.max_assigned_chat!=undefined) {
    update.max_assigned_chat = req.body.max_assigned_chat;
  }

  if (req.body.number_assigned_requests!=undefined) {
    update.number_assigned_requests = req.body.number_assigned_requests;
  }
  
  if (req.body.attributes!=undefined) {
    update.attributes = req.body.attributes;
  }

  if (req.body.status!=undefined) {
    update.status = req.body.status;
  }

  if (req.body["settings.email.notification.conversation.assigned.toyou"]!=undefined) {
    update["settings.email.notification.conversation.assigned.toyou"] = req.body["settings.email.notification.conversation.assigned.toyou"];
  }

  if (req.body["settings.email.notification.conversation.pooled"]!=undefined) {
    update["settings.email.notification.conversation.pooled"] = req.body["settings.email.notification.conversation.pooled"];
  }
  
  if (req.body.tags!=undefined) {
    update.tags = req.body.tags;
  }

  winston.debug("project_userid update", update);

  Project_user.findByIdAndUpdate(req.params.project_userid, update, { new: true, upsert: true }, function (err, updatedProject_user) {
    if (err) {
      winston.error("Error gettting project_user for update", err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
      updatedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){    
        if (err) {
          winston.error("Error gettting updatedProject_userPopulated for update", err);
        }            
        var pu = updatedProject_userPopulated.toJSON();
        pu.isBusy = ProjectUserUtil.isBusy(updatedProject_user, req.project.settings && req.project.settings.max_agent_assigned_chat);
        
          authEvent.emit('project_user.update', {updatedProject_userPopulated:pu, req: req});
      });
    

    res.json(updatedProject_user);
  });
});



// TODO fai servizio di patch degli attributi come request
// TODO  blocca cancellazione owner?
router.delete('/:project_userid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug(req.body);

  Project_user.findByIdAndRemove(req.params.project_userid, { new: false}, function (err, project_user) {
    if (err) {
      winston.error("Error gettting project_user for delete", err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    winston.debug("Removed project_user", project_user);

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
    populate('id_user'). //qui cache importante ma populatevirtual
    exec(function (err, project_user) {
      if (err) {
        winston.error("Error gettting project_user for get", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      if (!project_user) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      // res.json(project_user);
      var pu = project_user.toJSON();
      pu.isBusy = ProjectUserUtil.isBusy(project_user, req.project.settings && req.project.settings.max_agent_assigned_chat);
      res.json(pu);
    });

});


router.get('/users/search', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('user', ['subscription'])], async (req, res, next) => { //changed for smtp 
  // router.get('/users/search', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], async (req, res, next) => {
  winston.debug("--> users search  ");

  if (!req.project) {
    return res.status(404).send({ success: false, msg: 'Project not found.' });
  }


  let query =  {email: req.query.email};
  
  winston.debug('query: ', query);
  
  let user = await User.findOne(query).exec();
  winston.debug('user: ', user);
  
  if (!user) {
    return res.status(404).send({ success: false, msg: 'Object not found.' });
  }
 

  let project_user = await Project_user.findOne({id_user: user._id, id_project: req.projectid}).exec();
  winston.debug('project_user: ', project_user);
  
  if (!project_user) {
    return res.status(403).json({msg: "Unauthorized. This is not a your teammate." });
  }
  

  return res.json({_id: user._id});

});

/**
 * GET PROJECT-USER BY PROJECT ID AND CURRENT USER ID 
//  */
 

router.get('/users/:user_id', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res, next) {
  winston.debug("--> users USER ID ", req.params.user_id);

  if (!req.project) {
    return res.status(404).send({ success: false, msg: 'Project not found.' });
  }

  var isObjectId = mongoose.Types.ObjectId.isValid(req.params.user_id);
  winston.debug("isObjectId:"+ isObjectId);

  var queryProjectUser ={ id_project: req.projectid};

  
  if (isObjectId) {          
    queryProjectUser.id_user = req.params.user_id
  }else {
    queryProjectUser.uuid_user = req.params.user_id
  }

  var q1 = Project_user.findOne(queryProjectUser);

  if (isObjectId) {    
    q1.populate('id_user'); //qui cache importante ma populatevirtual
  }

 //  Project_user.findOne({ id_user: req.params.user_id, id_project: req.projectid }).
  
   q1.exec(function (err, project_user) {
     if (err) {
       winston.error("Error gettting project_user for get users", err);
       return res.status(500).send({ success: false, msg: 'Error getting object.' });
     }
     if (!project_user) {
       return res.status(404).send({ success: false, msg: 'Object not found.' });
     }
    
     // res.json(project_user);
     var pu = project_user.toJSON();


   
     pu.isBusy = ProjectUserUtil.isBusy(project_user, req.project.settings && req.project.settings.max_agent_assigned_chat);
     res.json([pu]);

    });
});


  // TODO if project is deleted

// 2020-03-31T17:25:45.939421+00:00 app[web.1]: 
// 2020-03-31T17:25:45.998260+00:00 app[web.1]: error: uncaughtException: Cannot read property 'settings' of undefined
// 2020-03-31T17:25:45.998262+00:00 app[web.1]: TypeError: Cannot read property 'settings' of undefined
// 2020-03-31T17:25:45.998262+00:00 app[web.1]:     at /app/routes/project_user.js:372:68
// 2020-03-31T17:25:45.998263+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:4779:16
// 2020-03-31T17:25:45.998263+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/utils.js:276:16
// 2020-03-31T17:25:45.998263+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:4798:21
// 2020-03-31T17:25:45.998264+00:00 app[web.1]:     at _hooks.execPost (/app/node_modules/mongoose/lib/query.js:4364:11)
// 2020-03-31T17:25:45.998264+00:00 app[web.1]:     at /app/node_modules/kareem/index.js:135:16
// 2020-03-31T17:25:45.998269+00:00 app[web.1]:     at processTicksAndRejections (internal/process/next_tick.js:74:9) {"error":{},"stack":"TypeError: Cannot read property 'settings' of undefined\n    at /app/routes/project_user.js:372
// 

/**
 * RETURN THE PROJECT-USERS OBJECTS FILTERD BY PROJECT-ID AND WITH NESTED THE USER OBJECT
 * WF: 1. GET PROJECT-USER by the passed project ID
 *     2. POPULATE THE user_id OF THE PROJECT-USER object WITH THE USER OBJECT
 */                                                                                       
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res) {

  var role = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT];

  if (req.query.role) {
    role = req.query.role;
  }
  winston.debug("role", role);

  var query =  {id_project: req.projectid, role: { $in : role } };

  if (req.query.presencestatus) {
    query["presence.status"] = req.query.presencestatus;
  }

  winston.debug("query", query);

  Project_user.find(query).
    populate('id_user').
    // lean().                   
    exec(function (err, project_users) {
      if (err) {
        winston.error("Error gettting project_user for get users", err);
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }

      var ret = [];

      project_users.forEach(function(project_user) {
        var pu = project_user.toJSON();
        pu.isBusy = ProjectUserUtil.isBusy(project_user, req.project && req.project.settings && req.project.settings.max_agent_assigned_chat);
        ret.push(pu);
      });

      res.json(ret);
      
    });
});


module.exports = router;
