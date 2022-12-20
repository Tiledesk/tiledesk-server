var express = require('express');
var router = express.Router();
var winston = require('../config/winston');

router.get('/headers', function(req, res) {
  winston.info("req.headers", req.headers);
  // TODO chech if query is null
  res.json(req.headers);

});

module.exports = router;
