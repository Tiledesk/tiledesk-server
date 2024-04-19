var express = require('express');
var router = express.Router();
var { KB } = require('../models/kb_setting');
var winston = require('../config/winston');

const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';

router.post('/kb/status', async (req, res) => {

  if (!req.headers['x-auth-token']) {
    return res.status(401).send({ success: false, error: "Unauthorized", message: "A x-auth-token must be provided" })
  }

  if (req.headers['x-auth-token'] != KB_WEBHOOK_TOKEN) {
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

    res.status(200).send(kb);
  })

})

module.exports = router;
