var express = require('express');
var router = express.Router();

var User = require("../models/user");
var winston = require('../config/winston');
var mongoose = require('mongoose');





// sponz: realizza mini servizio senza sec
router.get('/:userid', function (req, res) {
  winston.debug("users");
  var userid = req.params.userid;

  var isObjectId = mongoose.Types.ObjectId.isValid(userid);
  winston.debug("isObjectId:"+ isObjectId);

  if (!isObjectId) {
    return res.status(404).send({ success: false, msg: 'User id not found' });
  }

  User.findById(userid, 'firstname lastname _id public_website public_email description', function (err, user) {
    if (err) {
      winston.error('Error getting object.',err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!user) {
      winston.warn("Object not found with id " +userid);
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug("GET USER BY ID RES JSON", user);
    res.json(user);
  });
});


module.exports = router;
