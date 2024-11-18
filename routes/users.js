var express = require('express');
var router = express.Router();

var User = require("../models/user");
var emailService = require("../services/emailService");
var winston = require('../config/winston');
const authEvent = require('../event/authEvent');
const uuidv4 = require('uuid/v4');
var uniqid = require('uniqid');

router.put('/', function (req, res) {

  winston.debug('UPDATE USER - REQ BODY ', req.body);

  var update = {};

  // update.firstname = req.body.firstname;
  // update.lastname = req.body.lastname;
  // update.attributes = req.body.attributes;
  // update.description = req.body.description;

  if (req.body.firstname != undefined) {
    update.firstname = req.body.firstname;
  }
  if (req.body.lastname != undefined) {
    update.lastname = req.body.lastname;
  }
  if (req.body.attributes != undefined) {
    update.attributes = req.body.attributes;
  }
  if (req.body.description != undefined) {
    update.description = req.body.description;
  }
  if (req.body.public_email != undefined) {
    update.public_email = req.body.public_email;
  }
  if (req.body.public_website != undefined) {
    update.public_website = req.body.public_website;
  }
 
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

  // TODO use findByIdAndRemove otherwise user don't contains label object
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

            if (req.body.newpsw === req.body.oldpsw) {
              winston.warn("New password can't match the old one");
              return res.status(403).send({ success: false, message: "The new password must be different from the previous one."})
            }

            // const regex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/);
            // if (!regex.test(req.body.newpsw)) {
            //   return res.status(403).send({ success: false, message: "The password does not meet the minimum vulnerability requirements"})
            // }
            
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
  console.log("resendverifyemail req.user", req.user)
  let user = req.user;
  try {
    // TODO req.user.email is null for bot visitor
    let verify_email_code = uniqid();
    let redis_client = req.app.get('redis_client');
    let key = "emailverify:verify-" + verify_email_code;
    let obj = { _id: user._id, email: user.email}
    let value = JSON.stringify(obj);
    redis_client.set(key, value, { EX: 900} ) 
    emailService.sendVerifyEmailAddress(user.email, user, verify_email_code);
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

router.post('/loginemail', function (req, res) {

  winston.debug("/loginemail... req.body: ", req.body);
  let user_id = req.user._id;
  let token = req.headers.authorization;

  let project_id = req.body.id_project;
  let chatbot_id = req.body.bot_id;
  let namespace_id = req.body.namespace_id;

  if (!project_id) {
    return res.status(500).send({ success: false, error: "missing 'id_project' field" });
  }

  if (!chatbot_id && !namespace_id) {
    return res.status(500).send({ success: false, error: "missing 'bot_id' or 'namespace_id' field" });
  }

  User.findById(user_id, (err, user) => {
    if (err) {
      return res.status(404).send({ success: false, message: "No user found" });
    }
    winston.debug("user found: ", user);

    emailService.sendEmailRedirectOnDesktop(user.email, token, project_id, chatbot_id, namespace_id)
    return res.status(200).send({ success: true, message: "Sending email..."})
  })


})


module.exports = router;
