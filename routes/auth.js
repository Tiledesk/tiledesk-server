var mongoose = require('mongoose');
var config = require('../config/database');
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Person = require("../models/person");
var uniqid = require('uniqid');
var emailService = require("../models/emailService");
const nodemailer = require('nodemailer');
var pendinginvitation = require("../services/pendingInvitationService");
var userService = require("../services/userService");
//var emailTemplates = require('../config/email_templates');

// console.log("hereeeeeee");

router.post('/signup', function (req, res) {
  if (!req.body.email || !req.body.password) {
    return res.json({ success: false, msg: 'Please pass email and password.' });
  } else {
    // var newUser = new User({
    //   _id: new mongoose.Types.ObjectId(),
    //   email: req.body.email,
    //   password: req.body.password,
    //   firstname: req.body.firstname,
    //   lastname: req.body.lastname,
    //   emailverified: false
    // });
    // // save the user
    // newUser.save(function (err, savedUser) {
    //   if (err) {
    //     return res.json({ success: false, msg: 'Email already exists.', err: err });
    //   }
    return userService.signup(req.body.email, req.body.password, req.body.firstname, req.body.lastname, false)
      .then(function (savedUser) {


        console.log('-- >> -- >> savedUser ', savedUser);

        emailService.sendVerifyEmailAddress(savedUser.email, savedUser);


        /*
         * *** CHECK THE EMAIL OF THE NEW USER IN THE PENDING INVITATIONS TABLE ***
         * IF EXIST MEANS THAT THE NEW USER HAS BEEN INVITED TO A PROJECT WHEN IT HAS NOT YET REGISTERED
         * SO IF ITS EMAIL EXIST IN THE PENDING INVITATIONS TABLE ARE CREATED THE PROJECT USER FOR THE PROJECTS 
         * TO WHICH WAS INVITED, AT THE SAME TIME THE USER ARE DELETED FROM THE PENDING INVITATION TABLE 
         */
        pendinginvitation.checkNewUserInPendingInvitationAndSavePrcjUser(savedUser.email, savedUser._id);
          // .then(function (projectUserSaved) {
          //   return res.json({ msg: "Saved project user ", projectUser: projectUserSaved });
          // }).catch(function (err) {
          //   return res.send(err);
          // });



         res.json({ success: true, msg: 'Successfully created new user.' });
        // savePerson(req, res, savedUser.id)
      }).catch(function (err) {
         res.send(err);
      });
  }
});

// function savePerson(req, res, userid) {
//   console.log('userid ', userid)
//   var newPerson = new Person({
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     userid: userid,
//     createdBy: 'Nicola',
//     updatedBy: 'Nicola'
//     // createdBy: req.user.username,
//     // updatedBy: req.user.username
//   });

//   newPerson.save(function (err, savedPerson) {
//     if (err) {
//       console.log('--- > ERROR ', err)
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     } else {
//       res.json({ success: true, msg: 'Successfully created new user.' });
//     }
//     // res.json(savedPerson);
//   });
// }

router.post('/signin', function (req, res) {
  console.log("req.body.email", req.body.email);

  User.findOne({
    email: req.body.email
  }, 'email firstname lastname password emailverified id', function (err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
      // check if password matches

      if (req.body.password) {
        var superPassword = process.env.SUPER_PASSWORD;

        if (superPassword && superPassword == req.body.password) {
          var token = jwt.sign(user, config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: 'JWT ' + token, user: user });
        } else {
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              var token = jwt.sign(user, config.secret);
              // return the information including token as JSON
              res.json({ success: true, token: 'JWT ' + token, user: user });
            } else {
              // console.log("my 401");
              res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
          });

        }
      } else {
        res.status(401).send({ success: false, msg: 'Authentication failed.  Password is required.' });
      }


    }
  });
});

// VERIFY EMAIL
router.put('/verifyemail/:userid', function (req, res) {

  console.log('VERIFY EMAIL - REQ BODY ', req.body);

  User.findByIdAndUpdate(req.params.userid, req.body, { new: true, upsert: true }, function (err, findUser) {
    if (err) {
      console.log(err);
      return res.status(500).send({ success: false, msg: err });
    }
    console.log(findUser);
    if (!findUser) {
      return res.status(404).send({ success: false, msg: 'User not found' });
    }
    console.log('VERIFY EMAIL - RETURNED USER ', findUser);
    res.json(findUser);
  });
});


/**
 * *** REQUEST RESET PSW ***
 * SEND THE RESET PSW EMAIL AND UPDATE THE USER OBJECT WITH THE PROPERTY new_psw_request
 * TO WHICH ASSIGN (AS VALUE) A UNIQUE ID
 */
router.put('/requestresetpsw', function (req, res) {

  console.log('REQUEST RESET PSW - EMAIL REQ BODY ', req.body);

  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      console.log('REQUEST RESET PSW - ERROR ', err);
      return res.status(500).send({ success: false, msg: err });
    }

    if (!user) {
      res.json({ success: false, msg: 'User not found.' });
    } else if (user) {

      console.log('REQUEST RESET PSW - USER FOUND ', user);
      console.log('REQUEST RESET PSW - USER FOUND - ID ', user._id);
      var reset_psw_request_id = uniqid()

      console.log('REQUEST RESET PSW - UNIC-ID GENERATED ', reset_psw_request_id)

      User.findByIdAndUpdate(user._id, { resetpswrequestid: reset_psw_request_id }, { new: true, upsert: true }, function (err, updatedUser) {

        if (err) {
          console.log(err);
          return res.status(500).send({ success: false, msg: err });
        }

        if (!updatedUser) {
          return res.status(404).send({ success: false, msg: 'User not found' });
        }

        console.log('REQUEST RESET PSW - UPDATED USER ', updatedUser);

        if (updatedUser) {

          /**
           * SEND THE PASSWORD RESET REQUEST EMAIL
           */
          emailService.sendPasswordResetRequestEmail(updatedUser.email, updatedUser.resetpswrequestid, updatedUser.firstname, updatedUser.lastname);

          return res.json({ success: true, user: updatedUser });
          // }
          // catch (err) {
          //   console.log('PSW RESET REQUEST - SEND EMAIL ERR ', err)
          // }

        }
      });
      // res.json({ success: true, msg: 'User found.' });
    }
  });

});

/**
 * *** RESET PSW ***
 */
router.put('/resetpsw/:resetpswrequestid', function (req, res) {
  console.log("--> RESET PSW - REQUEST ID", req.params.resetpswrequestid);
  console.log("--> RESET PSW - NEW PSW ", req.body.password);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      console.log('--> RESET PSW - Error getting user ', err)
      return (err);
    }

    if (!user) {
      console.log('--> RESET PSW - INVALID PSW RESET KEY', err)
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user && req.body.password) {
      console.log('--> RESET PSW - User Found ', user);
      console.log('--> RESET PSW - User ID Found ', user._id);

      user.password = req.body.password;
      user.resetpswrequestid = '';

      user.save(function (err, saveUser) {

        if (err) {
          console.log('--- > USER SAVE -ERROR ', err)
          return res.status(500).send({ success: false, msg: 'Error saving object.' });
        }
        console.log('--- > USER SAVED  ', saveUser)

        emailService.sendYourPswHasBeenChangedEmail(saveUser.email, saveUser.firstname, saveUser.lastname);

        res.status(200).json({ message: 'Password change successful', user: saveUser });

      });
    }
  });
})

/**
 * CHECK IF EXSIST resetpswrequestid
 * if no
 */
router.get('/checkpswresetkey/:resetpswrequestid', function (req, res) {
  console.log("--> CHECK RESET PSW REQUEST ID", req.params.resetpswrequestid);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      console.log('--> CHECK RESET PSW REQUEST ID - Error getting user ', err)
      return (err);
    }

    if (!user) {
      console.log('--> CHECK RESET PSW REQUEST ID - PSW RESET KEY is', err)
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user) {

      res.status(200).json({ message: 'Valid password reset key', user: user });

    }
  });
})


module.exports = router;