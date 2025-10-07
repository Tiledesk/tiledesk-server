let express = require('express');

let router = express.Router({mergeParams: true});
let roleChecker = require('../middleware/has-role');

let noentitycheck = require('../middleware/noentitycheck');


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