let express = require('express');
let router = express.Router({mergeParams: true});

let passport = require('passport');
require('../middleware/passport')(passport);
let validtoken = require('../middleware/valid-token')
let roleChecker = require('../middleware/has-role');



router.get('/test', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('agent', ['subscription'])], function (req, res) {
      // console.log("req.projectuser",req.projectuser);      
      res.json(req.projectuser);

});



module.exports = router;
