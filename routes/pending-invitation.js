var PendingInvitation = require("../models/pending-invitation");
var express = require('express');
var router = express.Router();

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
// var pendingInvitationService = require("../services/pendingInvitationService");
var emailService = require("../services/emailService");
var winston = require('../config/winston');

router.get('/resendinvite/:pendinginvitationid', function (req, res) {

  PendingInvitation.findById(req.params.pendinginvitationid, function (err, pendinginvitation) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!pendinginvitation) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    if (pendinginvitation) {
      winston.debug('RESEND INVITE TO THE PENDING INVITATION: ', pendinginvitation);
      winston.debug('RESEND INVITE - CURRENT PROJECT: ', req.project);
      winston.debug('RESEND INVITE - CURRENT USER: ', req.user);

      emailService.sendInvitationEmail_UserNotRegistered(pendinginvitation.email, req.user.firstname, req.user.lastname, req.project.name, req.project._id, pendinginvitation.role, pendinginvitation._id)
      //                                                         // invited_user_email, currentUserFirstname, currentUserLastname, project_name, project_id, invited_user_role
      // return pendingInvitationService.saveInPendingInvitation(pendinginvitation.email, req.user.firstname, req.user.lastname, req.project.name, req.project._id,  pendinginvitation.role)
      // .then(function (savedPendingInvitation) {
      //   return res.json({ msg: "User not found, save invite in pending ", pendingInvitation: savedPendingInvitation });
      // })
      // .catch(function (err) {
      //   return res.send(err);
      //   // return res.status(500).send(err);
      // });

    }
    res.json({ 'Resend invitation email to': pendinginvitation });
  });
});



router.post('/', function (req, res) {

  winston.debug(req.body);

  var email = req.body.email;
  if (email) {
    email = email.toLowerCase();
  }
  var newPendingInvitation = new PendingInvitation({
    email: email,
    role: req.body.role,
    id_project: req.id_projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newPendingInvitation.save(function (err, savedPendingInvitation) {
    if (err) {
      winston.error('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedPendingInvitation);
  });
});

router.put('/:pendinginvitationid', function (req, res) {

  winston.debug('PENDING INVITATION UPDATE - BODY ', req.body);

  var update = {};

  var email = req.body.email;
  if (email) {
    email = email.toLowerCase();
  }

  update.email = email;
  update.role = req.body.role;

  PendingInvitation
    .findByIdAndUpdate(req.params.pendinginvitationid, update, { new: true, upsert: true },
      function (err, updatedPendingInvitation) {
        if (err) {
          return res.status(500).send({ success: false, msg: 'Error updating object.' });
        }
        res.json(updatedPendingInvitation);
      });
});


router.delete('/:pendinginvitationid', function (req, res) {

  winston.debug('PENDING INVITATION DELETE - BODY ', req.body);

  PendingInvitation.remove({ _id: req.params.pendinginvitationid }, function (err, pendinginvitation) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(pendinginvitation);
  });
});



router.get('/:pendinginvitationid', function (req, res) {

  winston.debug('PENDING INVITATION GET BY ID - BODY ', req.body);

  PendingInvitation.findById(req.params.pendinginvitationid, function (err, pendinginvitation) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!pendinginvitation) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(pendinginvitation);
  });
});




router.get('/', function (req, res) {

  winston.debug("GET PENDING INVITATION - req projectid", req.projectid);

  PendingInvitation.find({ "id_project": req.projectid }, function (err, pendinginvitation) {
    if (err) {
      winston.error('GET PENDING INVITATION ERROR ', err);
      return (err);
    }
    if (!pendinginvitation) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('GET PENDING INVITATION ', pendinginvitation);

    res.json(pendinginvitation);
  });
});


module.exports = router;
