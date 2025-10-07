let express = require('express');
let router = express.Router();
let winston = require('../config/winston');

router.get('/headers', function(req, res) {
  winston.info("req.headers", req.headers);
  // TODO chech if query is null
  res.json(req.headers);

});

module.exports = router;
