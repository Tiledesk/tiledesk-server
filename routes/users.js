var express = require('express');
var router = express.Router();

var User = require("../models/user");
var emailService = require("../services/emailService");
var winston = require('../config/winston');
const authEvent = require('../event/authEvent');
const uuidv4 = require('uuid/v4');





router.put('/', function (req, res) {

  winston.debug('UPDATE USER - REQ BODY ', req.body);

  var update = {};
  
  update.firstname = req.body.firstname;
  update.lastname = req.body.lastname;
  update.attributes = req.body.attributes;
  
  

  User.findByIdAndUpdate(req.user.id, update, { new: true, upsert: true }, function (err, updatedUser) {
    if (err) {
      winston.error("Error putting user",err);
      return res.status(500).send({ success: false, msg: err });
    }

    winston.debug('UPDATED USER ', updatedUser);
    if (!updatedUser) {
      return res.status(404).send({ success: false, msg: 'User not found' });
    }

    authEvent.emit("user.update", {updatedUser: updatedUser, req: req});     

    res.json({ success: true, updatedUser });
  });
});


router.delete('/', function (req, res) {

  // cambia active 0
  // anonimizzo email 
  // cancello virtualmente progetti owner
  winston.debug('delete USER - REQ BODY ', req.body);

  
  var update = {status:0, email: uuidv4()+'@tiledesk.com',firstname: 'anonymized',lastname: 'anonymized'};
  User.findByIdAndUpdate(req.user.id, update, { new: true, upsert: true }, function (err, updatedUser) {
    if (err) {
      winston.error(err);
      return res.status(500).send({ success: false, msg: err });
    }

    winston.debug('UPDATED USER ', updatedUser);
    if (!updatedUser) {
      return res.status(404).send({ success: false, msg: 'User not found' });
    }

    authEvent.emit("user.delete", {user: updatedUser, req: req}); 

    res.json({ success: true, updatedUser });
  });
});


router.delete('/physical', function (req, res) {

  // cambia active 0
  // anonimizzo email 
  // cancello virtualmente progetti owner
  winston.debug('delete USER - REQ BODY ', req.body);

  User.remove({ _id: req.user.id }, function (err, user) {
    if (err) {
      winston.error(err);
      return res.status(500).send({ success: false, msg: err });
    }

    winston.debug('deleted USER ', user);  
    
    authEvent.emit("user.delete", {user: user, req: req}); 

    res.json({ success: true, user });
  });
});


router.put('/changepsw', function (req, res) {

  winston.debug('CHANGE PSW - USER ID: ', req.user.id);

  User.findOne({ _id: req.user.id })
  .select("+password")
  .exec(function (err, user) {
    
    if (err) throw err;
    winston.error('CHANGE PSW - FINDONE ERROR ', err)
    if (!user) {
      winston.debug('CHANGE PSW - FINDONE USER NOT FOUND ', err)
      res.status(401).send({ success: false, msg: 'User not found.' });
    } else {
      winston.debug('CHANGE PSW - FOUND USER ', user)
      // check if password matches

      if (req.body.oldpsw) {
        winston.debug('CHANGE PSW - OLD PSW: ', req.body.oldpsw);

        user.comparePassword(req.body.oldpsw, function (err, isMatch) {
          if (isMatch && !err) {
            // if user is found and old password is right
            winston.debug('* THE PSW MATCH CURRENT PSW * PROCEED WITH THE UPDATE')
            winston.debug('CHANGE PSW - NEW PSW: ', req.body.newpsw);

            user.password = req.body.newpsw

            user.save(function (err, saveUser) {

              if (err) {
                winston.error('--- > USER SAVE -ERROR ', err)
                return res.status(500).send({ success: false, msg: 'Error saving object.' });
              }
              winston.debug('--- > USER SAVED  ', saveUser)
              res.status(200).json({ message: 'Password change successful' });

            });

          } else {
            winston.debug('THE PSW DOES NOT MATCH CURRENT PSW ')
            res.status(401).send({ success: false, msg: 'Current password is invalid.' });
          }
        });

      }
    }
  });
});

router.get('/resendverifyemail', function (req, res) {
  winston.debug('RE-SEND VERIFY EMAIL - LOGGED USER ', req.user);
  try {
    // TODO req.user.email is null for bot visitor
    emailService.sendVerifyEmailAddress(req.user.email, req.user);
    res.status(200).json({ success: true, message: 'Verify email successfully sent' });
  } catch (e) {
    winston.debug("RE-SEND VERIFY EMAIL error", e);
    res.status(500).json({ success: false, message: e });
  }
});

router.get('/', function (req, res) {
  winston.debug("users");
  var userid = req.user.id;

  User.findById(userid, 'email firstname lastname _id emailverified', function (err, user) {
    if (err) {
      winston.error('Error getting object.',err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!user) {
      winston.warn("Object not found with id " +req.user.id);
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug("GET USER BY ID RES JSON", user);
    res.json(user);
  });
});


module.exports = router;
