let express = require('express');

let router = express.Router();

let noentitycheck = require('../middleware/noentitycheck');


router.get('/', 
 function (req, res) {
    res.send('{"success":true}');
});
  
  
  router.get('/noentitycheck', 
    [noentitycheck,
    ], function (req, res) {
    res.send('{"success":true}');
  });
  

module.exports = router;