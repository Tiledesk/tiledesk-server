var express = require('express');

var router = express.Router();

var emailService = require("../services/emailService");
var winston = require('../config/winston');

// http://localhost:3001/emails/templates/test.html
router.get('/templates/:templateid', 
 async (req, res) => {
  let templateid = req.params.templateid+".html";
  winston.debug("templateid",templateid);

  var html = await emailService.readTemplateFile(templateid);
    res.json({template:html});
});
  

module.exports = router;