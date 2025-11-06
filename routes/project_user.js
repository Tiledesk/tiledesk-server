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
const puEvent = require('../event/projectUserEvent');


router.post('/invite', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {

  winston.debug('Invite ProjectUser body ', req.body);

  let id_project = req.projectid;
  let email = req.body.email;
  if (email) {
    email = email.toLowerCase();
  }

  winston.debug('Invite ProjectUser with email ' + email + ' on project ' + req.projectid);
  
  User.findOne({ email: email, status: 100 }, (err, user) => {
    
    if (err) {
      winston.error("Error in searching for a possible existing project user with email " + email);
      return res.status(500).send({ success: false, error: "An error occurred during the invite process" });
    }

    if (!user) {
      // User not registered on Tiledesk Platform -> Save email and project_id in pending invitation
      // TODO req.user.firstname is null for bot visitor
      return pendinginvitation.saveInPendingInvitation(req.projectid, req.project.name, email, req.body.role, req.user._id, req.user.firstname, req.user.lastname).then(function (savedPendingInvitation) {
        var eventData = { req: req, savedPendingInvitation: savedPendingInvitation };
        winston.debug("eventData", eventData);
        authEvent.emit('project_user.invite.pending', eventData);
        return res.json({ msg: "User not found, save invite in pending ", pendingInvitation: savedPendingInvitation });
      }).catch(function (err) {
        return res.send(err);
      });

    } else if (req.user.id == user._id) {
      // If the current user id is = to the id of found user return an error. To a user is not allowed to invite oneself.
      winston.debug('Invite User: found user ' + user._id + ' is equal to current user ' + req.user.id + '. Is not allowed to invite oneself.')
      return res.status(403).send({ success: false, msg: 'Forbidden. It is not allowed to invite oneself', code: 4000 });

    } else {

      //let roles = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT];

      Project_user.findOne({ id_project: id_project, id_user: user._id, roleType: RoleConstants.TYPE_AGENTS }, (err, puser) => {
        if (err) {
          winston.error("Error inviting an already existing user: ", err);
          return res.status(500).send({ success: false, msg: "An error occurred on inviting user " + email + " on project " + id_project })
        }

        // if (!roles.includes(req.body.role)) {
        //   return res.status(400).send({ success: false, msg: 'Invalid role specified: ' + req.body.role });
        // }
        
        let user_available = typeof req.body.user_available === 'boolean' ? req.body.user_available : true

        if (puser) {
          if (puser.trashed !== true) {
            winston.warn("Trying to invite an already project member user")
            return res.status(403).send({ success: false, msg: 'Forbidden. User is already a member', code: 4001 });
          }

          Project_user.findByIdAndUpdate(puser._id, { role: req.body.role, user_available: user_available, trashed: false, status: 'active' }, { new: true}, (err, updatedPuser) => {
            if (err) {
              winston.error("Error update existing project user before inviting it ", err)
              return res.status(500).send({ success: false, msg: "An error occurred on inviting user " + email + " on project " + id_project })
            }

            emailService.sendYouHaveBeenInvited(email, req.user.firstname, req.user.lastname, req.project.name, id_project, user.firstname, user.lastname, req.body.role)

            updatedPuser.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedPuserPopulated){
              var pu = updatedPuserPopulated.toJSON();
              pu.isBusy = ProjectUserUtil.isBusy(savedProject_userPopulated, req.project.settings && req.project.settings.max_agent_assigned_chat);
              var eventData = {req:req, updatedPuserPopulated: pu};
              winston.debug("eventData",eventData);
              authEvent.emit('project_user.invite', eventData);
            });

            return res.status(200).send(updatedPuser);
          })

        } else {

          let newProject_user = new Project_user({
            id_project: id_project,
            id_user: user._id,
            role: req.body.role,
            roleType : RoleConstants.TYPE_AGENTS,
            user_available: user_available,
            createdBy: req.user.id,
            updatedBy: req.user.id
          })

          newProject_user.save((err, savedProject_user) => {
            if (err) {
              winston.error("Error saving new project user: ", err)
              return res.status(500).send({ success: false, msg: "An error occurred on inviting user " + email + " on project " + id_project })
            }

            emailService.sendYouHaveBeenInvited(email, req.user.firstname, req.user.lastname, req.project.name, id_project, user.firstname, user.lastname, req.body.role)

            savedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, savedProject_userPopulated){
              var pu = savedProject_userPopulated.toJSON();
              pu.isBusy = ProjectUserUtil.isBusy(savedProject_userPopulated, req.project.settings && req.project.settings.max_agent_assigned_chat);
              var eventData = {req:req, savedProject_userPopulated: pu};
              winston.debug("eventData",eventData);
              authEvent.emit('project_user.invite', eventData);
            });

            return res.status(200).send(savedProject_user);
          })
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
    roleType : RoleConstants.TYPE_USERS,   
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
    
    updatedProject_user.populate({ path:'id_user', select: { 'firstname': 1, 'lastname': 1 }}, function (err, updatedProject_userPopulated) {    
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

  const allowedStatuses = ['active', 'disabled'];
  if (req.body.status !== undefined && allowedStatuses.includes(req.body.status)) {
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

  const { hard, soft } = req.query;
  const pu_id = req.params.project_userid;

  winston.debug(req.body);

  if (soft === "true") {
    // Soft Delete
    Project_user.findByIdAndUpdate(pu_id, { trashed: true }, { new: true }, (err, project_user) => {
      if (err) {
        winston.error("Error gettting project_user for soft delete", err);
        return res.status(500).send({ success: false, msg: 'Error deleting Project User with id ' + pu_id });
      }

      winston.debug("Soft deleted project_user", project_user);
      if (!project_user) {
        winston.warn("Project user not found for soft delete with id " + pu_id);
        return res.status(404).send({ success: false, error: 'Project user not found with id ' + pu_id });
      }

      puEvent.emit('project_user.deleted', project_user);
      // Event 'project_user.delete' not working - Check it and improve it to manage soft/hard delete
      return res.status(200).send(project_user);

    })
  }
  else if (hard === "true") {
    // Hard Delete
    Project_user.findByIdAndRemove(pu_id, { new: false }, (err, project_user) => {
      if (err) {
        winston.error("Error gettting project_user for hard delete", err);
        return res.status(500).send({ success: false, msg: 'Error deleting Project user with id ' + pu_id });
      }

      if (!project_user) {
        winston.warn("Project user not found for soft delete with id " + pu_id);
        return res.status(404).send({ success: false, error: 'Project user not found with id ' + pu_id });
      }

      winston.debug("Hard deleted project_user", project_user);

      if (project_user) {
        project_user.populate({ path: 'id_user', select: { 'firstname': 1, 'lastname': 1 } }, function (err, project_userPopulated) {
          authEvent.emit('project_user.delete', { req: req, project_userPopulated: project_userPopulated });
        });
      }

      puEvent.emit('project_user.deleted', project_user);
      return res.status(200).send(project_user);
    });
  }
  else {
    // Disable
    Project_user.findByIdAndUpdate(pu_id, { status: "disabled", user_available: false }, { new: true }, (err, project_user) => {
        if (err) {
          winston.error("Error gettting project_user for disable user", err);
          return res.status(500).send({ success: false, msg: 'Error disabling Project User with id ' + pu_id });
        }

        if (!project_user) {
          winston.warn("Project user not found for soft delete with id " + pu_id);
          return res.status(404).send({ success: false, error: 'Project user not found with id ' + pu_id });
        }

        winston.debug("Disabled project_user", project_user);

        // Event 'project_user.delete' not working - Check it and improve it to manage disable project user
        return res.status(200).send(project_user);
      }
    );
  }
});

router.get('/me', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res, next) {
  if (!req.project) {
    return res.status(404).send({ success: false, msg: 'Project not found.' });
  }
  var project_user = req.projectuser;

  var pu = project_user.toJSON();
   
  pu.isBusy = ProjectUserUtil.isBusy(project_user, req.project.settings && req.project.settings.max_agent_assigned_chat);
  res.json([pu]);


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
router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['bot', 'subscription'])], function (req, res) {

  // rolequery
  // var role = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT];

  var query;
  if (req.query.role) {
    role = req.query.role;
    winston.debug("role", role);
    query =  {id_project: req.projectid, role: { $in : role } };
  } else {
     query =  {id_project: req.projectid, roleType: RoleConstants.TYPE_AGENTS, trashed: { $ne: true } };
  }

  if (req.query.presencestatus) {
    query["presence.status"] = req.query.presencestatus;
  }

  winston.debug("query", query);

  if (req.query.status) {
    query["status"] = req.query.status;
  }

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
