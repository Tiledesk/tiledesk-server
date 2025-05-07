var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const { Webhook } = require('../models/webhook');
const httpUtil = require('../utils/httpUtil');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);
var ObjectId = require('mongoose').Types.ObjectId;
// const port = process.env.PORT || '3000';
// let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/ext/";;
// if (process.env.TILEBOT_ENDPOINT) {
//     TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/ext/"
// }
// winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);


router.get('/:chatbot_id/', async (req, res) => {
  
  let id_project = req.projectid;
  let chatbot_id = req.params.chatbot_id;

  let webhook = await Webhook.findOne({ id_project: id_project, chatbot_id: chatbot_id }).catch((err) => {
    winston.error("Error finding webhook: ", err);
    return res.status(500).send({ success: false, error: "Error findin webhook with for chatbot " + chatbot_id });
  })

  if (!webhook) {
    winston.verbose("Webhook not found for chatbot " + chatbot_id);
    return res.status(404).send({ success: false, error: "Webhook not found for chatbot " + chatbot_id });
  }

  res.status(200).send(webhook);

})


router.post('/', async (req, res) => {

  let id_project = req.projectid;

  let webhook = new Webhook({
    id_project: id_project,
    chatbot_id: req.body.chatbot_id || req.body.id_faq_kb,
    block_id: req.body.block_id,
    copilot: req.body.copilot,
    async: req.body.async
  })

  webhook.save((err, savedWebhook) => {
    if (err) {
      if (err.code === 11000) {
        winston.verbose("Webhook already exists for chatbot " + chatbot_id);
        return res.status(403).send({ success: false, message: "Webhook already exists for chatbot " + chatbot_id });
      } 
      winston.error("Error saving new webhook ", err);
      return res.status(500).send({ success: false, error: err });
    }

    res.status(200).send(savedWebhook);
  })

})

router.post('/preload/:webhook_id', async (req, res) => {

  let id_project = req.projectid;
  let webhook_id = req.params.webhook_id;
  let request_id = "automation-request-" + id_project + "-" + new ObjectId() + "-" + webhook_id;
  let redis_client = req.app.get('redis_client');

  try {
    let key = "logs:webhook:" + id_project + ":" + webhook_id;
    let value = JSON.stringify({ request_id: request_id });
    redis_client.set(key, value, { EX: 900 });
    res.status(200).send({ success: true, message: "Webhook preloaded successfully", request_id: request_id });
  } catch(err) {
    winston.error("Error adding key in cache ", err);
    res.status(500).send({ success: false, message: "Unable to start development webhook" })
  }

})

router.delete('/preload/:webhook_id', async (req, res) => {
  
  let id_project = req.projectid;
  let webhook_id = req.params.webhook_id;
  let key = "logs:webhook:" + id_project + ":" + webhook_id;
  let redis_client = req.app.get('redis_client');
  
  try {
    redis_client.del(key);
    res.status(200).send({ success: true, message: "Development webhook stopped" })
  } catch(err) {
    winston.error("Error deleting key from cache ", err);
    res.status(500).send({ success: false, message: "Unable to stop development webhook" })
  }

})

// router.post('/webhook_id', async (req, res) => {

//   let id_project = req.projectid;
//   let webhook_id = req.params.webhook_id;
//   let payload = req.body;

//   let webhook = await Webhook.findOne({ id_project: id_project, webhook_id: webhook_id }).catch((err) => {
//     winston.error("Error finding webhook: ", err);
//     return res.status(500).send({ success: false, error: err });
//   })

//   if (!webhook) {
//     winston.warn("Webhook not found with id " + webhook_id);
//     return res.status(404).send({ success: false, error: "Webhook not found with id " + webhook_id });
//   }

//   let url = TILEBOT_ENDPOINT + 'block/' + id_project + "/" + webhook.chatbot_id + "/" + webhook.block_id;

//   payload.async = webhook.async;
  
//   let response = httpUtil.post(url, payload).catch((err) => {
//     winston.error("Error calling webhook on post: ", err);
//     return res.status(500).send({ success: false, error: err });
//   })

//   res.status(200).send(response);

// })

router.put("/:chatbot_id/regenerate", async (req, res) => {
  
  let id_project = req.projectid;
  let chatbot_id = req.params.chatbot_id;

  let update = {
    webhook_id: nanoid()
  }

  let updatedWebhook = await Webhook.findOneAndUpdate({ id_project: id_project, chatbot_id: chatbot_id }, update, { new: true }).catch((err) => {
    winston.error("Error updating webhook ", err);
    return res.status(500).send({ success: false, error: "Error updating webhook for chatbot " + chatbot_id });
  })

  if (!updatedWebhook) {
    winston.verbose("Webhook not found for chatbot " + chatbot_id);
    return res.status(404).send({ success: false, error: "Webhook not found for chatbot " + chatbot_id });
  }

  res.status(200).send(updatedWebhook);
})

router.put("/:chatbot_id", async (req, res) => {

  let id_project = req.projectid;
  let chatbot_id = req.params.chatbot_id;

  let update = {};

  if (req.body.hasOwnProperty("async")) {
    update.async = req.body.async;
  }

  if (req.body.hasOwnProperty("copilot")) {
    update.copilot = req.body.copilot;
  }

  let updatedWebhook = await Webhook.findOneAndUpdate({ id_project: id_project, chatbot_id: chatbot_id }, update, { new: true }).catch((err) => {
    winston.error("Error updating webhook ", err);
    return res.status(500).send({ success: false, error: "Error updating webhook for chatbot " + chatbot_id });
  })

  if (!updatedWebhook) {
    winston.verbose("Webhook not found for chatbot " + chatbot_id);
    return res.status(404).send({ success: false, error: "Webhook not found for chatbot " + chatbot_id });
  }

  res.status(200).send(updatedWebhook);
})

router.delete("/:chatbot_id", async (req, res) => {

  let id_project = req.projectid;
  let chatbot_id = req.params.chatbot_id;

  await Webhook.deleteOne({ id_project: id_project, chatbot_id: chatbot_id }).catch((err) => {
    winston.error("Error deleting webhook ", err);
    return res.status(500).send({ success: false, error: "Error deleting webhook for chatbot " + chatbot_id });
  })

  res.status(200).send({ success: true, message: "Webhook for chatbot " + chatbot_id +  " deleted successfully" });
})


module.exports = router;
