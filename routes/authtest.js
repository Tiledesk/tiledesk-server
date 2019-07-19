var express = require('express');

var router = express.Router();
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token');
var roleChecker = require('../middleware/has-role');

var noentitycheck = require('../middleware/noentitycheck');


router.get('/', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], function (req, res) {
    console.warn("QUI1");
    res.send('{"success":true}');
  });
  
  router.get('/bot', [
    passport.authenticate(['jwt'], { session: false }), 
    validtoken, 
    roleChecker.hasRoleOrType(null,'bot')],
    // roleChecker.isType('bot')],
     function (req, res) {
      console.warn("QUI2");
    res.send('{"success":true}');
  });
  
  router.get('/noentitycheck', 
    [noentitycheck,
    passport.authenticate('jwt', { session: false }), 
    validtoken], function (req, res) {
      console.warn("QUI3");
    res.send('{"success":true}');
  });
  

module.exports = router;