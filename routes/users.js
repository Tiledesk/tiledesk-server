var express = require('express');
var router = express.Router();

var User = require("../models/user");
var emailService = require("../models/emailService");

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

/* update user firstname/lastname */
router.put('/updateuser/:userid', function (req, res) {

  console.log('UPDATE USER - REQ BODY ', req.body);

  User.findByIdAndUpdate(req.params.userid, req.body, { new: true, upsert: true }, function (err, updatedUser) {
    if (err) {
      console.log(err);
      return res.status(500).send({ success: false, msg: err });
    }

    console.log('UPDATED USER ', updatedUser);
    if (!updatedUser) {
      return res.status(404).send({ success: false, msg: 'User not found' });
    }
    res.json({ success: true, updatedUser });
  });
});

router.put('/changepsw', function (req, res) {
  console.log('CHANGE PSW - USER ID: ', req.body.userid);

  
  User.findOne({ _id: req.body.userid })
  .select("+password")
  .exec(function (err, user) {

    if (err) throw err;
    console.log('CHANGE PSW - FINDONE ERROR ', err)
    if (!user) {
      console.log('CHANGE PSW - FINDONE USER NOT FOUND ', err)
      res.status(401).send({ success: false, msg: 'User not found.' });
    } else {
      console.log('CHANGE PSW - FOUND USER ', user)
      // check if password matches

      if (req.body.oldpsw) {
        console.log('CHANGE PSW - OLD PSW: ', req.body.oldpsw);

        user.comparePassword(req.body.oldpsw, function (err, isMatch) {
          if (isMatch && !err) {
            // if user is found and old password is right
            console.log('* THE PSW MATCH CURRENT PSW * PROCEED WITH THE UPDATE')
            console.log('CHANGE PSW - NEW PSW: ', req.body.newpsw);

            user.password = req.body.newpsw

            user.save(function (err, saveUser) {

              if (err) {
                console.log('--- > USER SAVE -ERROR ', err)
                return res.status(500).send({ success: false, msg: 'Error saving object.' });
              }
              console.log('--- > USER SAVED  ', saveUser)
              res.status(200).json({ message: 'Password change successful' });

            });

          } else {
            console.log('THE PSW DOES NOT MATCH CURRENT PSW ')
            res.status(401).send({ success: false, msg: 'Current password is invalid.' });
          }
        });

      }
    }
  });
});

router.get('/resendverifyemail', function (req, res) {
  console.log('RE-SEND VERIFY EMAIL - LOGGED USER ', req.user);
  try {
    emailService.sendVerifyEmailAddress(req.user.email, req.user);
    res.status(200).json({ success: true, message: 'Verify email successfully sent' });
  } catch (e) {
    console.log("RE-SEND VERIFY EMAIL error", e);
    res.status(500).json({ success: false, message: e });
  }
});

router.get('/:userid', function (req, res) {

  User.findById(req.params.userid, 'firstname lastname _id', function (err, user) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!user) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    console.log("GET USER BY ID RES JSON", user);
    res.json(user);
  });
});


module.exports = router;
