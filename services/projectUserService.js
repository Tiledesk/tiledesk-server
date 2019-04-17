'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require('../models/user');
var winston = require('../config/winston');
var pendinginvitation = require("../services/pendingInvitationService");

class ProjectUserService {


  // invite(email, id_project, project_name, role, userid, firstname, lastname) {

  //   return new Promise(function (resolve, reject) {

    
     
  //         User.findOne({ email: email }, function (err, user) {
  //           if (err){
  //             winston.error("Error finding user", err);
  //             reject(err);
  //           } 

  //           if (!user) {
  //             /*
  //             * *** USER NOT FOUND > SAVE EMAIL AND PROJECT ID IN PENDING INVITATION *** */
  //             return pendinginvitation.saveInPendingInvitation(id_project, project_name, email, role, userid, firstname, lastname)
  //               .then(function (savedPendingInvitation) {


  //               // try {
  //                   var activity = new Activity({actor: {type:"user", id: userid, name: firstname + '' + lastname}, 
  //                       verb: "PROJECT_USER_INVITE", actionObj: req.body, 
  //                       target: {type:"pendinginvitation", id:savedPendingInvitation._id.toString(), object: savedPendingInvitation }, 
  //                       id_project: req.projectid });
  //                   activityEvent.emit('project_user.invite', activity);
  //               // } catch(e) {winston.error('Error emitting activity');}
            


  //                 return res.json({ msg: "User not found, save invite in pending ", pendingInvitation: savedPendingInvitation });
  //               })
  //               .catch(function (err) {
  //                 return res.send(err);
  //                 // return res.status(500).send(err);
  //               });
  //             // return res.status(404).send({ success: false, msg: 'User not found.' });

  //           } else if (req.user.id == user._id) {
  //             winston.debug('-> -> FOUND USER ID', user._id)
  //             winston.debug('-> -> CURRENT USER ID', req.user.id);
  //             // if the current user id is = to the id of found user return an error:
  //             // (to a user is not allowed to invite oneself) 

  //             winston.debug('XXX XXX FORBIDDEN')
  //             return res.status(403).send({ success: false, msg: 'Forbidden. It is not allowed to invite oneself', code: 4000 });

  //           } else {

  //             /**
  //              * *** IT IS NOT ALLOWED TO INVITE A USER WHO IS ALREADY A MEMBER OF THE PROJECT *** 
  //              * FIND THE PROJECT USERS FOR THE PROJECT ID PASSED BY THE CLIENT IN THE BODY OF THE REQUEST
  //              * IF THE ID OF THE USER FOUND FOR THE EMAIL (PASSED IN THE BODY OF THE REQUEST - see above)
  //              * MATCHES ONE OF THE USER ID CONTENTS IN THE PROJECTS USER OBJECT STOP THE WORKFLOW AND RETURN AN ERROR */
  //             return Project_user.find({ id_project: req.body.id_project }, function (err, projectuser) {
  //               winston.debug('PRJCT-USERS FOUND (FILTERED FOR THE PROJECT ID) ', projectuser)
  //               if (err) {
  //                 return res.status(500).send(err);
  //               }

  //               if (!projectuser) {
  //                 // console.log('*** PRJCT-USER NOT FOUND ***')
  //                 return res.status(404).send({ success: false, msg: 'Project user not found.' });
  //               }

  //               if (projectuser) {
  //                 try {
  //                   projectuser.forEach(p_user => {
  //                     if (p_user) {
  //                       // console.log('»»»» FOUND USER ID: ', user._id, ' TYPE OF ', typeof (user._id))
  //                       // console.log('»»»» PRJCT USER > USER ID: ', p_user.id_user, ' TYPE OF ', typeof (p_user.id_user));
  //                       var projectUserId = p_user.id_user.toString();
  //                       var foundUserId = user._id.toString()

  //                       winston.debug('»»»» FOUND USER ID: ', foundUserId, ' TYPE OF ', typeof (foundUserId))
  //                       winston.debug('»»»» PRJCT USER > USER ID: ', projectUserId, ' TYPE OF ', typeof (projectUserId));

  //                       // var n = projectuser.includes('5ae6c62c61c7d54bf119ac73');
  //                       // console.log('USER IS ALREADY A MEMBER OF THE PROJECT ', n)
  //                       if (projectUserId == foundUserId) {
  //                         // if ('5ae6c62c61c7d54bf119ac73' == '5ae6c62c61c7d54bf119ac73') {

  //                           winston.debug('»»»» THE PRJCT-USER ID ', p_user.id_user, ' MATCHES THE FOUND USER-ID', user._id)
  //                           winston.debug('»»»» USER IS ALREADY A MEMBER OF THE PROJECT ')

  //                         // cannot use continue or break inside a JavaScript Array.prototype.forEach loop. However, there are other options:
  //                         throw new Error('User is already a member'); // break
  //                         // return res.status(403).send({ success: false, msg: 'Forbidden. User is already a member' });
  //                       }
  //                     }
  //                   });
  //                 }
  //                 catch (e) {
  //                   winston.error('»»» ERROR ', e)
  //                   return res.status(403).send({ success: false, msg: 'Forbidden. User is already a member', code: 4001 });
  //                 }

  //                 winston.debug('NO ERROR, SO CREATE AND SAVE A NEW PROJECT USER ')

  //                 var newProject_user = new Project_user({
  //                   _id: new mongoose.Types.ObjectId(),
  //                   id_project: req.body.id_project,
  //                   id_user: user._id,
  //                   role: req.body.role,
  //                   user_available: true,
  //                   createdBy: req.user.id,
  //                   updatedBy: req.user.id
  //                 });

  //                 return newProject_user.save(function (err, savedProject_user) {
  //                   if (err) {
  //                     winston.error('--- > ERROR ', err)
  //                     return res.status(500).send({ success: false, msg: 'Error saving object.' });
  //                   }



  //                   winston.debug('INVITED USER (IS THE USER FOUND BY EMAIL) ', user);
  //                   winston.debug('EMAIL of THE INVITED USER ', req.body.email);
  //                   winston.debug('ROLE of THE INVITED USER ', req.body.role);
  //                   winston.debug('PROJECT NAME ', req.body.role);
  //                   winston.debug('LOGGED USER ID ', req.user.id);
  //                   winston.debug('LOGGED USER NAME ', req.user.firstname);
  //                   winston.debug('LOGGED USER NAME ', req.user.lastname);


  //                   var invitedUserFirstname = user.firstname
  //                   var invitedUserLastname = user.lastname

  //                   emailService.sendYouHaveBeenInvited(req.body.email, req.user.firstname, req.user.lastname, req.body.project_name, req.body.id_project, invitedUserFirstname, invitedUserLastname, req.body.role)
                    
  //                   // try {
  //                     //test it
  //                     savedProject_user.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, savedProject_userPopulated){
  //                       var activity = new Activity({actor: {type:"user", id: req.user.id, name: req.user.fullName }, 
  //                         verb: "PROJECT_USER_INVITE", actionObj: req.body, 
  //                         target: {type:"project_user", id:savedProject_userPopulated._id.toString(), object: savedProject_userPopulated.toObject() }, 
  //                         id_project: req.projectid });
  //                       activityEvent.emit('project_user.invite', activity);
  //                     });
  //                   // } catch(e) {winston.error('Error emitting activity');}
                    
  //                   return res.json(savedProject_user);        

  //                 });

  //               }
  //             })
  //           }
  //         });
      
      
      

  //   });
  // }

}
var projectUserService = new ProjectUserService();


module.exports = projectUserService;
