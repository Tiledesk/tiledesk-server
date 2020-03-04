var express = require('express');

var router = express.Router({mergeParams: true});
var roleChecker = require('../middleware/has-role');

var noentitycheck = require('../middleware/noentitycheck');


router.get('/',  function (req, res) {
    res.send('{"success":true}');
  });
  
  router.get('/bot', [   
    roleChecker.hasRoleOrTypes(null,['bot'])],
     function (req, res) {
    res.send('{"success":true}');
  });
  
  router.get('/noentitycheck', 
    [noentitycheck,
    ], function (req, res) {
    res.send('{"success":true}');
  });
  

module.exports = router;