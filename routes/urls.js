var express = require('express');
var router = express.Router();
var winston = require('../config/winston');


router.get('/redirect', function (req, res) {
  winston.debug("redirect: "+ req.query.path);
  res.redirect(req.query.path);
});


module.exports = router;
