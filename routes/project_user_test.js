var express = require('express');
var router = express.Router({mergeParams: true});

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role');



router.get('/test', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res) {
      // console.log("req.projectuser",req.projectuser);      
      res.json(req.projectuser);

});



module.exports = router;
