let express = require('express');
let router = express.Router();
let winston = require('../config/winston');


router.get('/redirect', function (req, res) {
  winston.debug("redirect: "+ req.query.path);
  res.redirect(req.query.path);
});


module.exports = router;
