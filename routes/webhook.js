var express = require('express');
var router = express.Router();
var { KB, Namespace } = require('../models/kb_setting');
var winston = require('../config/winston');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
const { Scheduler } = require('../services/Scheduler');

const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL;
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';

let jobManager = new JobManager(AMQP_MANAGER_URL, {
  debug: false,
  topic: JOB_TOPIC_EXCHANGE,
  exchange: JOB_TOPIC_EXCHANGE
})

jobManager.connectAndStartPublisher((status, error) => {
  if (error) {
    winston.error("connectAndStartPublisher error: ", error);
  } else {
    winston.info("KbRoute - ConnectPublisher done with status: ", status);
  }
})


router.post('/kb/reindex', async (req, res) => {

  winston.info("(webhook) kb reindex called");
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

  winston.verbose('/webhook kb status body: ', req.body);

  // let id_project = req.body.id_project;
  // let namespace_id = req.body.namespace_id;
  let content_id = req.body.content_id;

  let kb = await KB.findById(content_id).catch((err) => {
    winston.error("Error getting kb content: ", err);
    return res.status(500).send({ success: false, error: err })
  })

  if (!kb) {
    winston.warn("Kb content not found with id ", content_id);
    return res.status(404).send({ success: false, error: "Content not found with id " + content_id })
  }

  let json = {
    id: kb._id,
    type: kb.type,
    source: kb.source,
    content: "",
    namespace: kb.namespace,
    refresh_rate: refresh_rate,
    last_refresh: kb.last_refresh
  }

  // if (kb.content) {
  //   json.content = kb.content;
  // }

  if (kb.scrape_type) {
    json.scrape_type = kb.scrape_type
  }

  if (kb.scrape_options) {
    json.parameters_scrape_type_4 = {
      tags_to_extract: kb.scrape_options.tags_to_extract,
      unwanted_tags: kb.scrape_options.unwanted_tags,
      unwanted_classnames: kb.scrape_options.unwanted_classnames
    }
  }

  let namespace = await Namespace.findOne({ id: kb.namespace }).catch((err) => {
    winston.error("Error getting namespace ", err)
    return res.status(500).send({ success: false, error: err })
  })

  if (!namespace) {
    winston.warn("Namespace not found with id " + kb.namespace);
    return res.status(500).send({ success: false, error: err })
  }

  json.engine = namespace.engine;

  let resources = [];
  resources.push(json);

  if (process.env.NODE_ENV !== 'test') {
    scheduleScrape(resources);
  }

  res.status(200).send({ success: true, message: "Content queued for reindexing" });

})


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

async function scheduleScrape(resources) {

  let scheduler = new Scheduler({ jobManager: jobManager });

  resources.forEach(r => {
    winston.debug("(Webhook) Schedule job with following data: ", r);
    scheduler.trainSchedule(r, async (err, result) => {
      if (err) {
        winston.error("Scheduling error: ", err);
      } else {
        winston.info("Scheduling result: ", result);
      }
    });
  })

  return true;
}

module.exports = router;
