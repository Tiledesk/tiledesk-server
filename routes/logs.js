var express = require('express');
var router = express.Router();
var winston = require('../config/winston');



router.get('/', function(req, res, next) {
    winston.info("logs", req.body);
    return res.status(200).send({ success: true});
});


router.post('/', function(req, res, next) {
    winston.info("logs", req.body);
    return res.status(200).send({ success: true});
});

  


  

  


module.exports = router;
