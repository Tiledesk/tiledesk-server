var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const { Webhook } = require('../models/webhook');
const webhookService = require('../services/webhookService');
const httpUtil = require('../utils/httpUtil');

const port = process.env.PORT || '3000';
let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/ext/";;
if (process.env.TILEBOT_ENDPOINT) {
    TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/ext/"
}
winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);


router.get('/:id_faq_kb/', async (req, res) => {
  
})
router.post('/', async (req, res) => {

  let id_project = req.projectid;

  let webhook = new Webhook({
    id_project: id_project,
    chatbot_id: req.body.chatbot_id || req.body.id_faq_kb,
    block_id: req.body.block_id,
    async: req.body.async
  })

  webhook.save((err, savedWebhook) => {
    if (err) {
      winston.error("Error saving new webhook ", err);
      return res.status(500).send({ success: false, error: err });
    }

    res.status(200).send(savedWebhook);
  })

})

router.post('/webhook_id', async (req, res) => {

  let id_project = req.projectid;
  let webhook_id = req.params.webhook_id;
  let payload = req.body;

  let webhook = await Webhook.findById(webhook_id).catch((err) => {
    winston.error("Error finding webhook: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  if (!webhook) {
    winston.warn("Webhook not found with id " + webhook_id);
    return res.status(404).send({ success: false, error: "Webhook not found with id " + webhook_id });
  }

  let url = TILEBOT_ENDPOINT + 'block/' + id_project + "/" + webhook.chatbot_id + "/" + webhook.block_id;

  payload.async = webhook.async;
  
  let response = httpUtil.post(url, payload).catch((err) => {
    winston.error("Error calling webhook on post: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  res.status(200).send(response);

})


module.exports = router;
