var express = require('express');
var router = express.Router();

var User = require("../models/user");

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

// router.put('/changepassword', function (req, res) {
//   console.log("req.body.email", req.body.email);

//   User.findOne({ email: req.body.email }, function (err, user) {
//     if (err) throw err;

//     if (!user) {
//       res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
//     } else {
//       // check if password matches

//       if (req.body.password) {
//       }
//     }
//   });
// });


module.exports = router;
