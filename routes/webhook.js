var express = require('express');
var router = express.Router();
const uuidv4 = require('uuid/v4');
var { KB, Namespace } = require('../models/kb_setting');
var winston = require('../config/winston');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
const { Scheduler } = require('../services/Scheduler');
const { AiReindexService } = require('../services/aiReindexService');
const { Webhook } = require('../models/webhook');
const httpUtil = require('../utils/httpUtil');
var jwt = require('jsonwebtoken');
const Faq_kb = require('../models/faq_kb');
const webhookService = require('../services/webhookService');
const errorCodes = require('../errorCodes');

const port = process.env.PORT || '3000';
let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/";;
if (process.env.TILEBOT_ENDPOINT) {
    TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/"
}
winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

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

let default_engine = {
  name: "pinecone",
  type: process.env.PINECONE_TYPE,
  apikey: "",
  vector_size: 1536,
  index_name: process.env.PINECONE_INDEX
}

router.post('/kb/reindex', async (req, res) => {

  winston.verbose("/kb/reindex webhook called")
  winston.debug("(webhook) req.body: ", req.body);

  if (!req.headers['x-auth-token']) {
    winston.error("(webhook) Unauthorized: A x-auth-token must be provided")
    return res.status(401).send({ success: false, error: "Unauthorized", message: "A x-auth-token must be provided" })
  }

  if (req.headers['x-auth-token'] != KB_WEBHOOK_TOKEN) {
    winston.error("(webhook) Unauthorized: You don't have the authorization to accomplish this operation")
    return res.status(401).send({ success: false, error: "Unauthorized", message: "You don't have the authorization to accomplish this operation" });
  }
  
  let content_id = req.body.content_id;

  let kb = await KB.findById(content_id).catch( async (err) => {
    winston.error("(webhook) Error getting kb content: ", err);
    return res.status(500).send({ success: false, error: "Error getting content with id " + content_id });
  })

  if (!kb) {
    winston.warn("(webhook) Kb content not found with id " + content_id + ". Deleting scheduler...");

    // Assuming the content has been deleted. The scheduler should be stopped and deleted.
    res.status(200).send({ success: true, message: "Content no longer exists. Deleting scheduler..." })

    setTimeout( async () => {
      let aiReindexService = new AiReindexService();
      let deleteResponse = await aiReindexService.delete(content_id).catch((err) => {
        winston.error("(webhook) Error deleting scheduler ", err);
        winston.error("(webhook) Error deleting scheduler " + err);
        return;
      });
      winston.verbose("(webhook) delete response: ", deleteResponse);
      return;
    }, 10000);
    
  } else {

    let json = {
      id: kb._id,
      type: kb.type,
      source: kb.source,
      content: "",
      namespace: kb.namespace,
      refresh_rate: kb.refresh_rate,
      last_refresh: kb.last_refresh
    }
  
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
      winston.error("(webhook) Error getting namespace ", err)
      return res.status(500).send({ success: false, error: err })
    })
  
    if (!namespace) {
      winston.warn("(webhook) Namespace not found with id " + kb.namespace);
      return res.status(500).send({ success: false, error: err })
    }
  
    json.engine = namespace.engine || default_engine;
  
    let resources = [];
    resources.push(json);
  
    if (process.env.NODE_ENV !== 'test') {
      scheduleScrape(resources);
    }
  
    res.status(200).send({ success: true, message: "Content queued for reindexing" });

  }
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

router.all('/:webhook_id', async (req, res) => {

  let webhook_id = req.params.webhook_id;
  let payload = req.body;
  payload.webhook_http_method = req.method;
  let params = req.query;
  let dev = params.dev;
  delete params.dev;
  if (params) {
    payload.webhook_query_params = params;
  }

  let webhook = await Webhook.findOne({ webhook_id: webhook_id }).catch((err) => {
    winston.error("Error finding webhook: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  if (!webhook) {
    winston.warn("Webhook not found with id " + webhook_id);
    return res.status(404).send({ success: false, error: "Webhook not found with id " + webhook_id });
  }

  if (!webhook.enabled) {
    winston.verbose("Webhook " + webhook_id + " is currently turned off")
    return res.status(422).send({ success: false, error: "Webhook " + webhook_id + " is currently turned off"})
  }

  // To delete - Start
  // This endpoint will be used only for production webhooks, so is no longer
  // necessary to pass dev and redis_client to webhookService.run().
  let redis_client = req.app.get('redis_client');
  // and substitute currect run with the following one
  //webhookService.run(webhook, payload)
  // To delete - End
  webhookService.run(webhook, payload, dev, redis_client).then((response) => {
    return res.status(200).send(response);
  }).catch((err) => {
    if (err.code === errorCodes.WEBHOOK.ERRORS.NO_PRELOADED_DEV_REQUEST) {
      return res.status(422).send({ success: false, message: "Development webhook is currently turned off", code: err.code })
    } else {
      let status = err.status || 500;
      return res.status(status).send(err.data);
    }
  })
  
})

router.all('/:webhook_id/dev', async (req, res) => {

  let webhook_id = req.params.webhook_id;
  let payload = req.body;
  payload.webhook_http_method = req.method;
  let params = req.query;
  delete params.dev;
  if (params) {
    payload.webhook_query_params = params;
  }

  let webhook = await Webhook.findOne({ webhook_id: webhook_id }).catch((err) => {
    winston.error("Error finding webhook: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  if (!webhook) {
    winston.warn("Webhook not found with id " + webhook_id);
    return res.status(404).send({ success: false, error: "Webhook not found with id " + webhook_id });
  }

  let redis_client = req.app.get('redis_client');
  webhookService.run(webhook, payload, true, redis_client).then((response) => {
    return res.status(200).send(response);
  }).catch((err) => {
    if (err.code === errorCodes.WEBHOOK.ERRORS.NO_PRELOADED_DEV_REQUEST) {
      return res.status(422).send({ success: false, message: "Development webhook is currently turned off", code: err.code })
    } else {
      let status = err.status || 500;
      return res.status(status).send(err.data);
    }
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

async function generateChatbotToken(chatbot) {
  let signOptions = {
    issuer: 'https://tiledesk.com',
    subject: 'bot',
    audience: 'https://tiledesk.com/bots/' + chatbot._id,
    jwtid: uuidv4()
  };

  let botPayload = chatbot.toObject();
  let botSecret = botPayload.secret;

  var bot_token = jwt.sign(botPayload, botSecret, signOptions);
  return bot_token;
}

module.exports = router;
