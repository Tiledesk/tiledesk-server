var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
var multer = require('multer')
var upload = multer()
const path = require('path');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
var configGlobal = require('../config/global');
var mongoose = require('mongoose');
var parsecsv = require("fast-csv");

var { Namespace, KB } = require('../models/kb_setting');
const faq = require('../models/faq');
const faq_kb = require('../models/faq_kb');

const { MODELS_MULTIPLIER } = require('../utils/aiUtils');
const { parseStringArrayField } = require('../utils/arrayUtil');
const { kbTypes } = require('../models/kbConstants');
const Sitemapper = require('sitemapper');

const aiService = require('../services/aiService');
const aiManager = require('../services/aiManager');

const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL;
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';
const JOB_TOPIC_EXCHANGE_HYBRID = process.env.JOB_TOPIC_EXCHANGE_TRAIN_HYBRID || 'tiledesk-trainer-hybrid';
const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
const PINECONE_RERANKING = process.env.PINECONE_RERANKING === true || process.env.PINECONE_RERANKING === "true";
const apiUrl = process.env.API_URL || configGlobal.apiUrl;


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.debug("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.debug("Max upload file size is infinity");
}
var upload = multer({limits: uploadlimits});


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

let jobManagerHybrid = new JobManager(AMQP_MANAGER_URL, {
  debug: false,
  topic: JOB_TOPIC_EXCHANGE_HYBRID,
  exchange: JOB_TOPIC_EXCHANGE_HYBRID
})

jobManagerHybrid.connectAndStartPublisher((status, error) => {
  if (error) {
    winston.error("connectAndStartPublisher error: ", error);
  } else {
    winston.info("KbRoute - ConnectPublisher done with status: ", status);
  }
})

let default_preview_settings = {
  model: 'gpt-4o',
  max_tokens: 256,
  temperature: 0.7,
  top_k: 4,
  alpha: 0.5,
  context: null
}

const default_engine = require('../config/kb/engine');
const default_engine_hybrid = require('../config/kb/engine.hybrid');
const default_embedding = require('../config/kb/embedding');
const PromptManager = require('../config/kb/prompt/rag/PromptManager');
const situatedContext = require('../config/kb/situatedContext');

const ragPromptManager = new PromptManager(path.join(__dirname, '../config/kb/prompt/rag'));

const RAG_CONTEXT_ENV_OVERRIDES = {
  "gpt-3.5-turbo":       process.env.GPT_3_5_CONTEXT,
  "gpt-4":               process.env.GPT_4_CONTEXT,
  "gpt-4-turbo-preview": process.env.GPT_4T_CONTEXT,
  "gpt-4o":              process.env.GPT_4O_CONTEXT,
  "gpt-4o-mini":         process.env.GPT_4O_MINI_CONTEXT,
  "gpt-4.1":             process.env.GPT_4_1_CONTEXT,
  "gpt-4.1-mini":        process.env.GPT_4_1_MINI_CONTEXT,
  "gpt-4.1-nano":        process.env.GPT_4_1_NANO_CONTEXT,
  "gpt-5":               process.env.GPT_5_CONTEXT,
  "gpt-5-mini":          process.env.GPT_5_MINI_CONTEXT,
  "gpt-5-nano":          process.env.GPT_5_NANO_CONTEXT,
  "general":             process.env.GENERAL_CONTEXT
};

/** RAG system prompt per modello: file in config/kb/prompt/rag, sovrascrivibili via env (come prima). */
function getRagContextTemplate(modelName) {
  const envOverride = RAG_CONTEXT_ENV_OVERRIDES[modelName];
  if (envOverride) {
    return envOverride;
  }
  if (!PromptManager.modelMap[modelName] && process.env.GENERAL_CONTEXT) {
    return process.env.GENERAL_CONTEXT;
  }
  return ragPromptManager.getPrompt(modelName);
}

function normalizeEmbedding(embedding) {
  const normalizedEmbedding = (embedding && typeof embedding.toObject === 'function')
    ? embedding.toObject()
    : (embedding || default_embedding);
  return { ...normalizedEmbedding };
}

function normalizeSituatedContext(enable = false) {
  situatedContext.enable = enable;
  return situatedContext.enable
    ? {
      ...situatedContext,
      api_key: process.env.SITUATED_CONTEXT_API_KEY || process.env.GPTKEY
    }
    : undefined;
}


/**
 * ****************************************
 * Namespace Section - Start
 * ****************************************
 */
router.get('/namespace/all', async (req, res) => {
  
  const project_id = req.projectid;

  let namespaces = [];
  try {
    namespaces = await Namespace.find({ id_project: project_id })
  } catch (error) {
    winston.error("Error find namespaces: ", error);
    return res.status(500).send({ success: false, error: error.message });
  }

  if (namespaces.length === 0) {
    const namespace = await aiManager.createNamespace(project_id, {}, true);
    winston.verbose("No namespaces found for project " + project_id + ", default namespace created: " + namespace.id);
    namespaces.push(namespace);

    return res.status(200).send(namespaces);
  }

  let namespaceObjArray = [];
  if (req.query.count) {
    namespaceObjArray = await Promise.all(
      namespaces.map(async ({ _id, __v, ...keepAttrs }) => {
        const count = await KB.countDocuments({ id_project: keepAttrs.id_project, namespace: keepAttrs.id });
        return { ...keepAttrs, count };
      })
    );
  } else {
    namespaceObjArray = namespaces.map(({ _id, __v, ...keepAttrs }) => keepAttrs);
  }

  return res.status(200).send(namespaceObjArray);
});

router.post('/namespace', async (req, res) => {
  
  const project_id = req.projectid;
  const data = req.body;

  let mandatoryFields = ['name'];

  try {
    validateMandatoryFields(data, mandatoryFields);
  } catch (err) {
    return res.status(400).send({ success: false, error: err.message });
  }

  if ('hybrid' in data) {
    if (typeof data.hybrid !== 'boolean') {
      return res.status(400).send({ success: false, error: "Value not accepted for 'hybrid' field. Expected boolean." });
    }
    if (data.hybrid && !req.project?.profile?.customization?.hybrid) {
      return res.status(403).send({ success: false, error: "Hybrid mode is not allowed for the current project" });
    }
  }

  let namespaces = [];
  try {
    namespaces = await Namespace.find({ id_project: project_id });
  } catch (err) {
    winston.error("Error find namespaces: ", err);
  }

  let isDefault = false;
  if (namespaces.length === 0) {
    isDefault = true;
  }

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let ns_limit = limits.namespace;

  if (namespaces.length >= ns_limit) {
    return res.status(403).send({ success: false, error: "Maximum number of Knowledge Bases reached for the current plan", plan_limit: ns_limit });
  }

  try {
    const namespace = await aiManager.createNamespace(project_id, data, isDefault);
    res.status(200).send({ success: true, data: namespace });
  } catch (err) {
    winston.error("Error create namespace: ", err);
    return res.status(500).send({ success: false, error: err.message });
  }

});




/**
 * ****************************************
 * Namespace Section - End
 * ****************************************
 */


//----------------------------------------



module.exports = router;