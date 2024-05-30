var express = require('express');
var router = express.Router();
var { KB } = require('../models/kb_setting');
var winston = require('../config/winston');

const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';

router.post('/kb/status', async (req, res) => {

  winston.info("(webhook) kb status called");
  winston.info("(webhook) req.body: ", req.body);

  winston.info("(webhook) x-auth-token: " + req.headers['x-auth-token']);
  winston.info("(webhook) KB_WEBHOOK_TOKEN: " + KB_WEBHOOK_TOKEN);

  if (!req.headers['x-auth-token']) {
    winston.error("Unauthorized: A x-auth-token must be provided")
    return res.status(401).send({ success: false, error: "Unauthorized", message: "A x-auth-token must be provided" })
  }

  if (req.headers['x-auth-token'] != KB_WEBHOOK_TOKEN) {
    winston.error("Unauthorized: You don't have the authorization to accomplish this operation")
    return res.status(401).send({ success: false, error: "Unauthorized", message: "You don't have the authorization to accomplish this operation" });
  }

  let body = req.body;
  winston.verbose('/webhook kb status body: ', body);

  let kb_id = body.id;
  winston.verbose('/webhook kb status body: ' + kb_id);

  let update = {};

  if (body.status) {
    update.status = body.status;
  }

  KB.findByIdAndUpdate(kb_id, update, { new: true }, (err, kb) => {
    if (err) {
      winston.error(err);
      return res.status(500).send({ success: false, error: err });
    }

    if (!kb) {
      winston.info("Knwoledge Base content to be updated not found")
      return res.status(404).send({ success: false, messages: "Knwoledge Base content not found with id " + kb_id });
    }

    winston.info("kb updated succesfully: ", kb);
    res.status(200).send(kb);
  })

})

module.exports = router;
