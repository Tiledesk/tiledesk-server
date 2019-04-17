var express = require('express');
var PendingInvitation = require("../models/pending-invitation");
var emailService = require("../models/emailService");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var winston = require('../config/winston');

class Pending_Invitation {

  // USER NOT FOUND > SAVE IN PENDING INVITATION
  saveInPendingInvitation(project_id, project_name, invited_user_email, invited_user_role, currentUserId, currentUserFirstname, currentUserLastname) {
    return new Promise(function (resolve, reject) {
      console.log('** ** SAVE IN PENDING INVITATION ** **');
      // router.post('/', function (req, res) {

      return PendingInvitation.find({ email: invited_user_email, id_project: project_id }, function (err, pendinginvitation) {
        console.log('** ** FIND IN PENDING INVITATION ** ** ');

        if (err) {
          winston.error('** ** FIND IN PENDING INVITATION - ERROR ** **', err)
          return reject({ success: false, msg: 'Error find object.', err: err });
        }

        if (!pendinginvitation.length) {
          console.log('** ** FIND IN PENDING INVITATION - OBJECT NOT FOUND -- SAVE IN PENDING INVITATION ** **')

          // return reject({ success: false, msg: 'Object not found.' });
          // console.log('** ** FOUND PENDING INVITATION ** ** ', pendinginvitation);

          var newPendingInvitation = new PendingInvitation({
            email: invited_user_email,
            role: invited_user_role,
            id_project: project_id,
            createdBy: currentUserId,
            updatedBy: currentUserId
          });
          return newPendingInvitation.save(function (err, savedPendingInvitation) {
            if (err) {
              console.log('** ** SAVE IN PENDING INVITATION ERROR ** **', err)
              return reject({ success: false, msg: 'Error saving object.', err: err });
            }
            console.log('** ** SAVE IN PENDING INVITATION RESPONSE ** **', savedPendingInvitation)
            emailService.sendInvitationEmail_UserNotRegistered(invited_user_email, currentUserFirstname, currentUserLastname, project_name, project_id, invited_user_role)

            return resolve(savedPendingInvitation);

          });

        } else {

          console.log('** ** FIND IN PENDING INVITATION - OBJECT FOUND ', pendinginvitation)
          emailService.sendInvitationEmail_UserNotRegistered(invited_user_email, currentUserFirstname, currentUserLastname, project_name, project_id, invited_user_role)

          return reject({ success: false, msg: 'Pending Invitation already exist.', pendinginvitation });
        }
      });
    });
  };

  checkNewUserInPendingInvitationAndSavePrcjUser(newUserEmail, newUserId) {
    winston.debug('** ** CHECK NEW USER EMAIL ** **');
    var that = this;
    return new Promise(function (resolve, reject) {

      return PendingInvitation.find({ email: newUserEmail }, function (err, pendinginvitations) {
        if (err) {
          winston.error('** ** CHECK NEW USER EMAIL IN PENDING INVITATION ** ERROR ** ', err);
          return reject({ msg: 'Error getting pending invitation' });
        }
        if (!pendinginvitations.length) {
          winston.debug('** ** CHECK NEW USER EMAIL IN PENDING INVITATION ** OBJECT NOT FOUND ** ');
          return resolve({ msg: 'New user email not found in pending invitation' });
        }

        winston.debug('** ** CHECK NEW USER EMAIL ** PENDING INVITATION FOUND ** SAVE A NEW PROJECT USER', pendinginvitations);

        pendinginvitations.forEach(invite => {

          winston.debug('** ** CHECK NEW USER EMAIL ** PENDING INVITATION FOUND ** PENDING INVITATION ROLE', invite.role);
          winston.debug('** ** CHECK NEW USER EMAIL ** PENDING INVITATION FOUND ** PENDING INVITATION PRJCT ID', invite.id_project);

          var newProject_user = new Project_user({
            // _id: new mongoose.Types.ObjectId(),
            id_project: invite.id_project,
            id_user: newUserId,
            role: invite.role,
            user_available: true,
            createdBy: invite.createdBy,
            updatedBy: invite.createdBy
          });

          return newProject_user.save(function (err, savedProject_user) {
            if (err) {
              winston.debug('--- > ERROR ', err)
              return reject({ msg: 'Error saving project user.' });

            }
             that.removePendingInvitation(invite._id)
            
            //cancella inviti pending
            winston.debug('** ** CHECK NEW USER EMAIL ** PENDING INVITATION FOUND ** SAVED PROJECT USER', savedProject_user);
            return resolve(savedProject_user);
          });

          
          // return resolve(pendinginvitation);
        });
      });
      // });
    });

  }

  removePendingInvitation(pendingInvitationId) {
    winston.debug('DELETING PENDING INVITATION');
    return new Promise(function (resolve, reject) {
        return PendingInvitation.remove({ _id: pendingInvitationId }, function (err, pendinginvitation) {
          if (err) {
            winston.error('DELETING PENDING INVITATION - ERROR ', err);
            return reject({ success: false, msg: 'Error deleting object.' });
          }
          // return resolve(pendinginvitation);
          });
      });
  }
  // router.post('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  //   console.log(req.body);
  //   var newPendingInvitation = new PendingInvitation({
  //     email: req.body.email,
  //     role: req.body.role,
  //     id_project: req.id_projectid,
  //     createdBy: req.user.id,
  //     updatedBy: req.user.id
  //   });

  //   newPendingInvitation.save(function (err, savedPendingInvitation) {
  //     if (err) {
  //       console.log('--- > ERROR ', err)
  //       return res.status(500).send({ success: false, msg: 'Error saving object.' });
  //     }
  //     res.json(savedPendingInvitation);
  //   });
  // });

  // router.put('/:pendinginvitationid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  //   console.log('PENDING INVITATION UPDATE - BODY ', req.body);

  //   PendingInvitation
  //     .findByIdAndUpdate(req.params.pendinginvitationid, req.body, { new: true, upsert: true },
  //       function (err, updatedPendingInvitation) {
  //         if (err) {
  //           return res.status(500).send({ success: false, msg: 'Error updating object.' });
  //         }
  //         res.json(updatedPendingInvitation);
  //       });
  // });


  // router.delete('/:pendinginvitationid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  //   console.log('PENDING INVITATION DELETE - BODY ', req.body);

  //   PendingInvitation.remove({ _id: req.params.pendinginvitationid }, function (err, pendinginvitation) {
  //     if (err) {
  //       return res.status(500).send({ success: false, msg: 'Error deleting object.' });
  //     }
  //     res.json(pendinginvitation);
  //   });
  // });


  // router.get('/:pendinginvitationid', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  //   console.log('PENDING INVITATION GET BY ID - BODY ', req.body);

  //   PendingInvitation.findById(req.params.pendinginvitationid, function (err, pendinginvitation) {
  //     if (err) {
  //       return res.status(500).send({ success: false, msg: 'Error getting object.' });
  //     }
  //     if (!pendinginvitation) {
  //       return res.status(404).send({ success: false, msg: 'Object not found.' });
  //     }
  //     res.json(pendinginvitation);
  //   });
  // });



  // router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {

  //   PendingInvitation.find(function (err, next, pendinginvitations) {
  //     if (err) {
  //       return next(err);
  //     }

  //     res.json(pendinginvitations);
  //   });
  // });


}
var pending_invitation = new Pending_Invitation();
module.exports = pending_invitation;
