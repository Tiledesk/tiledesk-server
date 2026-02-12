var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
var multer = require('multer')
var upload = multer()
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
var configGlobal = require('../config/global');
var mongoose = require('mongoose');
var parsecsv = require("fast-csv");

var { Namespace, KB } = require('../models/kb_setting');
const faq = require('../models/faq');
const faq_kb = require('../models/faq_kb');

const { MODELS_MULTIPLIER } = require('../utils/aiUtils');
const { kbTypes } = require('../models/kbConstants');
const Sitemapper = require('sitemapper');

const aiService = require('../services/aiService');
const aiManager = require('../services/aiManager');
const integrationService = require('../services/integrationService');

const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL;
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';
const JOB_TOPIC_EXCHANGE_HYBRID = process.env.JOB_TOPIC_EXCHANGE_TRAIN_HYBRID || 'tiledesk-trainer-hybrid';
const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
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

let contexts = {
  "gpt-3.5-turbo":        process.env.GPT_3_5_CONTEXT       || "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### and the chat history to answer the question.\nIf you don't know the answer, just say: \"I don't know<NOANS>\"\n\n####{context}####",
  "gpt-4":                process.env.GPT_4_CONTEXT         || "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### and the chat history to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf and only if none of the retrieved context is useful for your task, add this word to the end <NOANS>\n\n####{context}####",
  "gpt-4-turbo-preview":  process.env.GPT_4T_CONTEXT        || "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### and the chat history to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf and only if none of the retrieved context is useful for your task, add this word to the end <NOANS>\n\n####{context}####",
  "gpt-4o":               process.env.GPT_4O_CONTEXT        || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, return <NOANS>\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-4o-mini":          process.env.GPT_4O_MINI_CONTEXT   || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, return <NOANS>\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-4.1":              process.env.GPT_4_1_CONTEXT       || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-4.1-mini":         process.env.GPT_4_1_MINI_CONTEXT  || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-4.1-nano":         process.env.GPT_4_1_NANO_CONTEXT  || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-5":                process.env.GPT_5_CONTEXT         || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-5-mini":           process.env.GPT_5_MINI_CONTEXT    || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "gpt-5-nano":           process.env.GPT_5_NANO_CONTEXT    || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end==",
  "general":              process.env.GENERAL_CONTEXT       || "You are an helpful assistant for question-answering tasks. Follow these steps carefully:\n1. Answer in the same language of the user question, regardless of the retrieved context language\n2. Use ONLY the pieces of the retrieved context and the chat history to answer the question.\n3. If the retrieved context does not contain sufficient information to generate an accurate and informative answer, append <NOANS> at the end of the answer\n\n==Retrieved context start==\n{context}\n==Retrieved context end=="
}

/**
* ****************************************
* Proxy Section - Start
* ****************************************
*/
router.post('/scrape/single', async (req, res) => {

  let project_id = req.projectid;

  let data = req.body;
  winston.debug("/scrape/single data: ", data)
  
  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, data.namespace);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  } 
  
  if (data.type === "sitemap") {

    const urls = await aiManager.fetchSitemap(data.source).catch((err) => {
      winston.error("Error fetching sitemap: ", err);
      return res.status(500).send({ success: false, error: err });
    })

    if (urls.length === 0) {
      return res.status(400).send({ success: false, error: "No url found on sitemap" });
    }

    let sitemapKb;
    try {
      sitemapKb = await KB.findById(data.id);
    } catch (err) {
      winston.error("Error finding sitemap content with id " +  data.id);
      return res.status(500).send({ success: false, error: "Error finding sitemap content with id " + data.id });
    }

    if (!sitemapKb) {
      return res.status(404).send({ success: false, error: "Content not found with id " + data.id });
    }
    
    let existingKbs;
    try {
      existingKbs = await KB.find({ id_project: project_id, namespace: data.namespace, sitemap_origin_id: data.id }).lean().exec();
    } catch(err) {
      winston.error("Error finding existing contents: ", err);
      return res.status(500).send({ success: false, error: "Error finding existing sitemap contents" });
    }

    const result = await aiManager.foundSitemapChanges(existingKbs, urls).catch((err) => {
      winston.error("Error finding sitemap differecens ", err);
      return res.status(400).send({ success: false, error: "Error finding sitemap differecens" });
    })

    if (!result) return; // esco qui

    const { addedUrls, removedIds } = result;

    if (removedIds.length > 0) {
      const idsSet = new Set(removedIds);
      const kbsToDelete = existingKbs.filter(obj => idsSet.has(obj._id));

      aiManager.removeMultipleContents(namespace, kbsToDelete).catch((err) => {
        winston.error("Error deleting multiple contents: ", err);
      })
    }

    if (addedUrls.length > 0) {
      const options = {
        sitemap_origin_id: sitemapKb._id,
        sitemap_origin: sitemapKb.source,
        scrape_type: sitemapKb.scrape_type,
        scrape_options: sitemapKb.scrape_options,
        refresh_rate: sitemapKb.refresh_rate
      }
      aiManager.addMultipleUrls(namespace, addedUrls, options).catch((err) => {
        winston.error("(webhook) error adding multiple urls contents: ", err);
      })
    }

    return res.status(200).send({ success: true, message: "Content queued for reindexing", added_urls: addedUrls.length, removed_url: removedIds.length });
  }

  KB.findById(data.id, (err, kb) => {
    if (err) {
      winston.error("findById error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    else if (!kb) {
      return res.status(404).send({ success: false, error: "Unable to find the kb requested" })
    }
    else {

      let json = {
        id: kb._id,
        type: kb.type,
        source: kb.source,
        content: "",
        namespace: kb.namespace
      }

      if (kb.content) {
        json.content = kb.content;
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

      json.engine = namespace.engine || default_engine;
      json.embedding = namespace.embedding || default_embedding;
      json.embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;

      if (namespace.hybrid === true) {
        json.hybrid = true;
      }

      winston.verbose("/scrape/single json: ", json);

      if (process.env.NODE_ENV === "test") {
        res.status(200).send({ success: true, message: "Skip indexing in test environment", data: json })
      }

      aiManager.startScrape(json).then((response) => {
        winston.verbose("startScrape response: ", response);
        res.status(200).send(response);
      }).catch((err) => {
        winston.error("startScrape err: ", err);
        res.status(500).send({ success: false, error: err });
      })

    }
  })

})

router.post('/scrape/status', async (req, res) => {

  let project_id = req.projectid;
  // (EXAMPLE) body: { id, namespace }
  let data = req.body;
  let namespace_id = data.namespace;
  winston.debug("/scrapeStatus req.body: ", req.body);

  let returnObject = false;

  if (req.query &&
    req.query.returnObject &&
    (req.query.returnObject === true || req.query.returnObject === 'true')) {
    returnObject = true;
  }

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  data.engine = namespace.engine || default_engine;

  aiService.scrapeStatus(data).then(async (response) => {

    winston.debug("scrapeStatus response.data: ", response.data);

    let update = {};

    if (response.data.status_code) {
      // update.status = response.data.status_code;
      update.status = await aiManager.statusConverter(response.data.status_code)

    }

    KB.findByIdAndUpdate(data.id, update, { new: true }, (err, savedKb) => {

      if (err) {
        winston.verbose("Status was successfully recovered, but the update on the db failed");
        winston.error("find kb by id and updated error: ", err);

        if (returnObject) {
          return res.status(206).send({ warning: "Unable to udpate content on db", message: "The original reply was forwarded", data: response.data });
        } else {
          return res.status(200).send(response.data);
        }
      }

      if (returnObject) {
        return res.status(200).send(savedKb);
      } else {
        return res.status(200).send(response.data);
      }
    })

  }).catch((err) => {
    winston.error("scrapeStatus err: ", err);
    let status = err.response.status;
    res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
  })
})

router.post('/qa', async (req, res) => {
  let id_project = req.projectid;
  let publicKey = false;
  let data = req.body;

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(id_project, data.namespace);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }
  winston.debug("/qa data: ", data);

  let model;
  try {
    model = await aiManager.resolveLLMConfig(id_project, data.llm, data.model);
  } catch (err) {
    let errorCode = err?.code ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  if (!model.api_key && model.provider === 'openai') {
    model.api_key = process.env.GPTKEY;
    publicKey = true;
  }

  data.model = model;

  let obj = { createdAt: new Date() };

  let quoteManager = req.app.get('quote_manager');
  if (publicKey === true) {
    let isAvailable = await quoteManager.checkQuote(req.project, obj, 'tokens');
    if (isAvailable === false) {
      return res.status(403).send({ success: false, message: "Tokens quota exceeded", error_code: 13001})
    }
  }

  // Check if "Advanced Mode" is active. In such case the default_context must be not appended
  if (!data.advancedPrompt) {
    const contextTemplate = contexts[data.model.name] || contexts["general"];
    if (data.system_context) {
      data.system_context = data.system_context + " \n" + contextTemplate;
    } else {
      data.system_context = contextTemplate;
    }
  }

  data.engine = namespace.engine || default_engine;
  data.embedding = namespace.embedding || default_embedding;
  data.embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;

  if (namespace.hybrid === true) {
    data.search_type = 'hybrid';
    
    if (data.reranking === true) {
      data.reranker_model = "cross-encoder/ms-marco-MiniLM-L-6-v2";
      
      if (!data.reranking_multiplier) {
        data.reranking_multiplier = 3;
      }

      if ((data.top_k * data.reranking_multiplier) > 100) {
        let calculatedRerankingMultiplier = Math.floor(100 / data.top_k);
        if (calculatedRerankingMultiplier < 1) {
          calculatedRerankingMultiplier = 1;
        }
        data.reranking_multiplier = calculatedRerankingMultiplier;
      }
    }
  }

  data.stream = false;
  data.debug = true;
  delete data.advancedPrompt;
  winston.verbose("ask data: ", data);

  if (process.env.NODE_ENV === 'test') {
    return res.status(200).send({ success: true, message: "Question skipped in test environment", data: data });
  }

  aiService.askNamespace(data).then((resp) => {
    winston.debug("qa resp: ", resp.data);
    let answer = resp.data;

    if (publicKey === true) {
      let multiplier = MODELS_MULTIPLIER[data.model];
      if (!multiplier) {
        multiplier = 1;
        winston.info("No multiplier found for AI model (qa) " + data.model);
      }
      obj.multiplier = multiplier;
      obj.tokens = answer.prompt_token_size;

      let incremented_key = quoteManager.incrementTokenCount(req.project, obj);
      winston.verbose("incremented_key: ", incremented_key);
    }
  
    return res.status(200).send(answer);

  }).catch((err) => {
    winston.error("qa err: ", err);
    winston.error("qa err.response: ", err.response);
    if (err.response && err.response.status) {
      let status = err.response.status;
      res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
    }
    else {
      res.status(500).send({ success: false, error: err });
    }

  })

})

// router.post('/qa', async (req, res) => {

//   let project_id = req.projectid;
//   let publicKey = false;
//   let data = req.body;
//   let ollama_integration;
//   let vllm_integration;

//   let namespace;
//   try {
//     namespace = await aiManager.checkNamespace(project_id, data.namespace);
//   } catch (err) {
//     let errorCode = err?.errorCode ?? 500;
//     return res.status(errorCode).send({ success: false, error: err.error });
//   }
//   winston.debug("/qa data: ", data);

//   if (!data.llm) {
//     data.llm = "openai";
//   }

//   if (data.llm === 'ollama') {
//     data.gptkey = process.env.GPTKEY;
//     try {
//       ollama_integration = await integrationService.getIntegration(project_id, 'ollama');
//     } catch (err) {
//       let error_code = err.code || 500;
//       let error_message = err.error || `Unable to get integration for ${data.llm}`;
//       return res.status(error_code).send({ success: false, error: error_message });
//     }
//   }
//   else if (data.llm === 'vllm') {
//     data.gptkey = process.env.GPTKEY;
//     try {
//       vllm_integration = await integrationService.getIntegration(project_id, 'vllm')
//     } catch (err) {
//       let error_code = err.code || 500;
//       let error_message = err.error || `Unable to get integration for ${data.llm}`;
//       return res.status(error_code).send({ success: false, error: error_message });
//     }
//   } else {
//     try {
//       let key = await integrationService.getKeyFromIntegration(project_id, data.llm);

//       if (!key) {
//         if (data.llm === 'openai') {
//           data.gptkey = process.env.GPTKEY;
//           publicKey = true;
//         } else {
//           return res.status(404).send({ success: false, error: `Invalid or empty key provided for ${data.llm}` });
//         }
//       } else {
//         data.gptkey = key;
//       }

//     } catch (err) {
//       let error_code = err.code || 500;
//       let error_message = err.error || `Unable to get integration for ${data.llm}`;
//       return res.status(error_code).send({ success: false, error: error_message });
//     }
//   }

//   let obj = { createdAt: new Date() };

//   let quoteManager = req.app.get('quote_manager');
//   if (publicKey === true) {
//     let isAvailable = await quoteManager.checkQuote(req.project, obj, 'tokens');
//     if (isAvailable === false) {
//       return res.status(403).send({ success: false, message: "Tokens quota exceeded", error_code: 13001})
//     }
//   }

//   // Check if "Advanced Mode" is active. In such case the default_context must be not appended
//   if (!data.advancedPrompt) {
//     const contextTemplate = contexts[data.model] || contexts["general"];
//     if (data.system_context) {
//       data.system_context = data.system_context + " \n" + contextTemplate;
//     } else {
//       data.system_context = contextTemplate;
//     }
//   }

//   data.engine = namespace.engine || default_engine;
//   data.embedding = namespace.embedding || default_embedding;
//   data.embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;

//   if (namespace.hybrid === true) {
//     data.search_type = 'hybrid';
    
//     if (data.reranking === true) {
//       data.reranking_multiplier = 3;
//       data.reranker_model = "cross-encoder/ms-marco-MiniLM-L-6-v2";
//     }
//   }

//   if (data.llm === 'ollama') {
//     if (!ollama_integration.value.url) {
//       return res.status(422).send({ success: false, error: "Server url for ollama is empty or invalid"})
//     }
//     data.model = {
//       name: data.model,
//       url: ollama_integration.value.url,
//       provider: 'ollama'
//     }
//     data.stream = false;
//   }

//   if (data.llm === 'vllm') {
//     if (!vllm_integration.value.url) {
//       return res.status(422).send({ success: false, error: "Server url for vllm is empty or invalid"})
//     }
//     data.model = {
//       name: data.model,
//       url: vllm_integration.value.url,
//       provider: 'vllm'
//     }
//     data.stream = false;
//   }

//   delete data.advancedPrompt;
//   winston.verbose("ask data: ", data);
  
//   if (process.env.NODE_ENV === 'test') {
//     return res.status(200).send({ success: true, message: "Question skipped in test environment", data: data });
//   }

//   data.debug = true;

//   aiService.askNamespace(data).then((resp) => {
//     winston.debug("qa resp: ", resp.data);
//     let answer = resp.data;

//     if (publicKey === true) {
//       let multiplier = MODELS_MULTIPLIER[data.model];
//       if (!multiplier) {
//         multiplier = 1;
//         winston.info("No multiplier found for AI model")
//       }
//       obj.multiplier = multiplier;
//       obj.tokens = answer.prompt_token_size;

//       let incremented_key = quoteManager.incrementTokenCount(req.project, obj);
//       winston.verbose("incremented_key: ", incremented_key);
//     }
  
//     return res.status(200).send(answer);

//   }).catch((err) => {
//     winston.error("qa err: ", err);
//     winston.error("qa err.response: ", err.response);
//     if (err.response && err.response.status) {
//       let status = err.response.status;
//       res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
//     }
//     else {
//       res.status(500).send({ success: false, error: err });
//     }

//   })
// })

router.delete('/delete', async (req, res) => {

  let project_id = req.projectid;
  let data = req.body;
  winston.debug("/delete data: ", data);

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  data.engine = namespace.engine || default_engine;

  aiService.deleteIndex(data).then((resp) => {
    winston.debug("delete resp: ", resp.data);
    res.status(200).send(resp.data);
  }).catch((err) => {
    winston.error("delete err: ", err);
    let status = err.response.status;
    res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
  })

})

router.delete('/deleteall', async (req, res) => {

  let project_id = req.projectid;
  let data = req.body;
  winston.debug('/delete all data: ', data);

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  data.engine = namespace.engine || default_engine;

  winston.verbose("/deleteall data: ", data);

  aiService.deleteNamespace(data).then((resp) => {
    winston.debug("delete namespace resp: ", resp.data);
    res.status(200).send(resp.data);
  }).catch((err) => {
    winston.error("delete namespace err: ", err);
    let status = err.response.status;
    res.status(status).send({ statusText: err.response.statusText, error: err.response.data.detail });
  })
})
/**
* ****************************************
* Proxy Section - Start
* ****************************************
*/


//----------------------------------------


/**
 * ****************************************
 * Namespace Section - Start
 * ****************************************
 */
router.get('/namespace/all', async (req, res) => {

  let project_id = req.projectid;

  Namespace.find({ id_project: project_id }).lean().exec( async (err, namespaces) => {

    if (err) {
      winston.error("find namespaces error: ", err);
      return res.status(500).send({ success: false, error: err });
    }
    else if (namespaces.length == 0) {

      // Create Default Namespace
      let new_namespace = new Namespace({
        id_project: project_id,
        id: project_id,
        name: "Default",
        preview_settings: default_preview_settings,
        default: true,
        engine: default_engine,
        embedding: default_embedding
      })

      new_namespace.save((err, savedNamespace) => {
        if (err) {
          winston.error("create default namespace error: ", err);
          return res.status(500).send({ success: false, error: err });
        }

        let namespaceObj = savedNamespace.toObject();
        delete namespaceObj._id;
        delete namespaceObj.__v;

        let namespaces = [];
        namespaces.push(namespaceObj);

        return res.status(200).send(namespaces);

      })

    } else {

      let namespaceObjArray = [];
      if (req.query.count) {
        namespaceObjArray = await Promise.all(
          namespaces.map(async ({ _id, __v, ...keepAttrs }) => {
            const count = await KB.countDocuments({ id_project: keepAttrs.id_project, namespace: keepAttrs.id });
            return { ...keepAttrs, count };
          })
        );
      } else {
        namespaceObjArray = namespaces.map(({ _id, __v, ...keepAttrs }) => keepAttrs)
      }
        
      winston.debug("namespaceObjArray: ", namespaceObjArray);
      return res.status(200).send(namespaceObjArray);
    }
  })
})

router.get('/namespace/:id/chunks/:content_id', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.params.id;
  let content_id = req.params.content_id;

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let content = await KB.find({ id_project: project_id, namespace: namespace_id, _id: content_id }).catch((err) => {
    winston.error("find content error: ", err);
    return res.status(403).send({ success: false, error: err })
  })

  if(!content) {
    return res.status(403).send({ success: false, error: "Not allowed. The content does not belong to the current namespace." })
  }

  let engine = namespace.engine || default_engine;

  if (process.env.NODE_ENV === 'test') {
    return res.status(200).send({ success: true, message: "Get chunks skipped in test environment"});
  }

  aiService.getContentChunks(namespace_id, content_id, engine).then((resp) => {
    let chunks = resp.data;
    winston.debug("chunks for content " + content_id);
    winston.debug("chunks found ", chunks);
    return res.status(200).send(chunks);

  }).catch((err) => {
    winston.error("error getting content chunks err.response: ", err.response)
    winston.error("error getting content chunks err.data: ", err.data)
    return res.status(500).send({ success: false, error: err });
  })

})

router.get('/namespace/:id/chatbots', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.params.id;
  
  let chatbotsArray = [];

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let intents = await faq.find({ id_project: project_id, 'actions.namespace': namespace_id }).catch((err) => {
    winston.error("Error find intents: ", err);
    return res.status(500).send({ success: false, message: 'Unable to retrieve intents using the selected namespace', error: err });
  })

  if (!intents || intents.length == 0) {
    winston.verbose("No intents found for the selected chatbot")
    return res.status(200).send(chatbotsArray);
  }

  let chatbots = intents.map(i => i.id_faq_kb);
  let uniqueChatbots = [...new Set(chatbots)];

  let chatbotPromises = uniqueChatbots.map(async (c_id) => {
    try {
      let chatbot = await faq_kb.findOne({ _id: c_id, trashed: false });
      if (chatbot) {
        let data = {
          _id: chatbot._id,
          name: chatbot.name
        }
        chatbotsArray.push(data);
      }
    } catch (err) {
      winston.error("error getting chatbot: ", err);
    }
  });

  await Promise.all(chatbotPromises);

  winston.debug("chatbotsArray: ", chatbotsArray);
  
  res.status(200).send(chatbotsArray);
})

router.get('/namespace/export/:id', async (req, res) => {
  
  let id_project = req.projectid;
  let namespace_id = req.params.id;

  let query = {};
  query.id_project = id_project;
  query.namespace = namespace_id;

  if (req.query.status) {
    query.status = parseInt(req.query.status)
  }

  query.type = { $in: [ kbTypes.URL, kbTypes.TEXT, kbTypes.FAQ ] };

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(id_project, namespace_id);
  } catch (err) {
    winston.error("Error checking namespace: ", err);
    let errorCode = err?.errorCode ?? 500;
    let errorMessage = err?.error || "Error checking namespace";
    return res.status(errorCode).send({ success: false, error: errorMessage });
  }

  let name = namespace.name;
  let preview_settings = namespace.preview_settings;

  let contents = await KB.find(query).catch((err) => {
    winston.error("Error getting contents for export ", err);
    return res.status(500).send({ success: false, error: "Unable to get contents for namespace " + namespace_id })
  })

  try {
    let filename = await aiManager.generateFilename(name);
    let json = {
      name: name,
      preview_settings: preview_settings,
      contents: contents
    }
    let json_string = JSON.stringify(json);
    res.set({ "Content-Disposition": `attachment; filename="${filename}.json"` });
    return res.send(json_string);
  } catch(err) {
    winston.error("Error genereting json ", err);
    return res.status(500).send({ success: false, error: "Error genereting json file" })
  }
  
})

router.post('/namespace', async (req, res) => {

  let project_id = req.projectid;
  let body = req.body;
  winston.debug("add namespace body: ", body);

  let engine = default_engine;

  let hybrid = false;
  if ('hybrid' in req.body) {
    if (typeof req.body.hybrid !== 'boolean') {
      return res.status(400).send({ success: false, error: "Value not accepted for 'hybrid' field. Expected boolean." });
    }
    hybrid = req.body.hybrid;
  }

  if (hybrid) {
    if (req.project?.profile?.customization?.hybrid) {
      engine = default_engine_hybrid;
    } else {
      return res.status(403).send({ success: false, error: "Hybrid mode is not allowed for the current project" });
    }
  }

  var namespace_id = mongoose.Types.ObjectId();
  let new_namespace = new Namespace({
    id_project: project_id,
    id: namespace_id,
    name: body.name,
    hybrid: hybrid,
    preview_settings: default_preview_settings,
    engine: engine,
    embedding: default_embedding
  })

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    //res.status(500).send({ success: false, error: err })
  })
  if (!namespaces || namespaces.length == 0) {
    new_namespace.default = true;
  }

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let ns_limit = limits.namespace;

  if (namespaces.length >= ns_limit) {
    return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: ns_limit });
  }

  new_namespace.save((err, savedNamespace) => {
    if (err) {
      winston.error("create namespace error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    let namespaceObj = savedNamespace.toObject();
    delete namespaceObj._id;
    delete namespaceObj.__v;
    return res.status(200).send(namespaceObj);
  })
})

router.post('/namespace/import/:id', upload.single('uploadFile'), async (req, res) => {

  let id_project = req.projectid;
  let namespace_id = req.params.id;

  let json_string;
  let json;
  if (req.file) {
    json_string = req.file.buffer.toString('utf-8');
    json = JSON.parse(json_string);
  } else {
    json = req.body;
  }

  if (!json.contents) {
    winston.warn("Imported json don't contain contents array");
    return res.status(400).send({ success: false, error: "Imported json must contain the contents array" });
  }

  if (!Array.isArray(json.contents)) {
    winston.warn("Invalid contents type. Expected type: array");
    return res.status(400).send({ success: false, error: "The content field must be of type Array[]" });
  }

  let contents = json.contents;

  let namespaces = await Namespace.find({ id_project: id_project }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + id_project + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(namespace_id)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let kbs_limit = limits.kbs;
  winston.verbose("Limit of kbs for current plan: " + kbs_limit);

  // let kbs_count = await KB.countDocuments({ id_project: id_project }).exec();
  // winston.verbose("Kbs count: " + kbs_count);

  // if (kbs_count >= kbs_limit) {
  //   return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
  // }

  // let total_count = kbs_count + contents.length;
  if (contents.length > kbs_limit) {
    return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
  }

  let addingContents = [];
  contents.forEach( async (e) => {
    let content = {
      id_project: id_project,
      name: e.name,
      source: e.source,
      type: e.type,
      content: e.content,
      namespace: namespace_id,
      status: -1
    }

    const optionalFields = ['scrape_type', 'scrape_options', 'refresh_rate'];

    for (const key of optionalFields) {
      if (e[key] !== undefined) {
        content[key] = e[key];
      }
    }

    addingContents.push(content);
  })

  // const operations = addingContents.map(({ _id, ...doc }) => ({
  //   replaceOne: {
  //     filter: {
  //       id_project: doc.id_project,
  //       type: doc.type,
  //       source: doc.source,
  //       namespace: namespace_id
  //     },
  //     replacement: doc,
  //     upsert: true
  //   }
  // }));

  // Try without delete all contents before imports
  // Issue 1: the indexes of the content replaced are not deleted from Pinecone
  // Issue 2: isn't possibile to know how many content will be replaced, so isn't possibile to determine if after the
  //          import operation the content's limit is respected
  let ns = namespaces.find(n => n.id === namespace_id);
  let engine = ns.engine || default_engine;
  let embedding = ns.embedding || default_embedding;
  embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;
  let hybrid = ns.hybrid;


  if (process.env.NODE_ENV !== "test") {
    await aiService.deleteNamespace({
      namespace: namespace_id,
      engine: engine
    }).catch((err) => {
      winston.error("Error deleting namespace contents: ", err)
      return res.status(500).send({ success: true, error: "Unable to delete namespace contents" })
    });
  }

  let deleteResponse = await KB.deleteMany({ id_project: id_project, namespace: namespace_id, type: { $in: ['url', 'text', 'faq'] } }).catch((err) => {
    winston.error("deleteMany error: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  winston.verbose("Content deletetion response: ", deleteResponse);

  await KB.insertMany(addingContents).catch((err) => {
    winston.error("Error adding contents with insertMany: ", err);
    return res.status(500).send({ success: true, error: "Error importing contents" });
  })

  let new_contents;
  try {
    new_contents = await KB.find({ id_project: id_project, namespace: namespace_id }).lean();
  } catch (err) {
    winston.error("Error getting new contents: ", err);
    return res.status(500).send({ success: false, error: "Unable to get new content" });
  }

  let resources = new_contents.map(({ name, status, __v, createdAt, updatedAt, id_project, ...keepAttrs }) => keepAttrs)
  resources = resources.map(({ _id, scrape_options, ...rest }) => {
    return { id: _id, parameters_scrape_type_4: scrape_options, embedding: embedding, engine: engine, ...rest}
  });
  
  winston.verbose("resources to be sent to worker: ", resources);

  if (process.env.NODE_ENV !== "test") {
    aiManager.scheduleScrape(resources, hybrid);
  }

  res.status(200).send({ success: true, message: "Contents imported successfully" });


  // saveBulk(operations, addingContents, id_project).then((result) => {
    
  //   let ns = namespaces.find(n => n.id === namespace_id);
  //   let engine = ns.engine || default_engine;

  //   let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project, ...keepAttrs }) => keepAttrs)
  //   resources = resources.map(({ _id, scrape_options, ...rest }) => {
  //     return { id: _id, parameters_scrape_type_4: scrape_options, engine: engine, ...rest}
  //   });

  //   winston.verbose("resources to be sent to worker: ", resources);

  //   if (process.env.NODE_ENV !== 'test') {
  //     scheduleScrape(resources);
  //   }
    
  //   //res.status(200).send(result);
  //   res.status(200).send({ success: true, message: "Contents imported successfully"});

  // }).catch((err) => {
  //   winston.error("Unable to save kbs in bulk ", err)
  //   res.status(500).send(err);
  // })
  
})

router.put('/namespace/:id', async (req, res) => {

  let namespace_id = req.params.id;
  let body = req.body;
  winston.debug("update namespace body: ", body);

  let update = {};

  if (body.name) {
    update.name = body.name;
  }
  if (body.preview_settings) {
    update.preview_settings = body.preview_settings;
  }

  Namespace.findOneAndUpdate({ id: namespace_id }, update, { new: true, upsert: true }, (err, updatedNamespace) => {
    if (err) {
      winston.error("update namespace error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    let namespaceObj = updatedNamespace.toObject();
    delete namespaceObj._id;
    delete namespaceObj.__v;
    res.status(200).send(namespaceObj);
  })
})

router.delete('/namespace/:id', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.params.id;

  let namespace = await Namespace.findOne({ id_project: project_id, id: namespace_id }).catch((err) => {
    winston.error("find namespace error: ", err);
    res.status(500).send({ success: false, error: err });
  })

  if (!namespace) {
    let alert = "No namespace found for id " + namespace_id;
    winston.warn(alert);
    res.status(404).send({ success: false, error: alert })
  }

  let data = {
    namespace: namespace_id,
    engine: namespace.engine || default_engine
  }

  if (req.query.contents_only && (req.query.contents_only === true || req.query.contents_only === 'true')) {

    aiService.deleteNamespace(data).then(async (resp) => {
      winston.debug("delete namespace resp: ", resp.data);

      let deleteResponse = await KB.deleteMany({ id_project: project_id, namespace: namespace_id }).catch((err) => {
        winston.error("deleteMany error: ", err);
        return res.status(500).send({ success: false, error: err });
      })
      winston.debug("delete all contents response: ", deleteResponse);

      return res.status(200).send({ success: true, message: "All contents deleted successfully" })

    }).catch((err) => {

      winston.error("deleteNamespace err: ", err);
      winston.error("deleteNamespace err.response: ", err.response);
      if (err.response && err.response.status) {
        let status = err.response.status;
        res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
      } else {
        res.status(500).send({ success: false, message: "Unable to delete namespace", error: err })
      }
    })

  } else {

    let namespace = await Namespace.findOne({ id: namespace_id }).catch((err) => {
      winston.error("findOne namespace error: ", err);
      return res.status(500).send({ success: false, error: err });
    })
    if (namespace.default === true) {
      winston.error("Default namespace cannot be deleted");
      return res.status(403).send({ success: false, error: "Default namespace cannot be deleted" });
    }

    aiService.deleteNamespace(data).then(async (resp) => {
      winston.debug("delete namespace resp: ", resp.data);

      let deleteResponse = await KB.deleteMany({ id_project: project_id, namespace: namespace_id }).catch((err) => {
        winston.error("deleteMany error: ", err);
        return res.status(500).send({ success: false, error: err });
      })
      winston.debug("delete all contents response: ", deleteResponse);

      let deleteNamespaceResponse = await Namespace.findOneAndDelete({ id: namespace_id }).catch((err) => {
        winston.error("deleteOne namespace error: ", err);
        return res.status(500).send({ success: false, error: err });
      })
      winston.debug("delete namespace response: ", deleteNamespaceResponse);

      return res.status(200).send({ success: true, message: "Namespace deleted succesfully" })

    }).catch((err) => {
      let status = 400;
      if (err.response && err.response.status) {
        status = err.response.status;
      }
      return res.status(status).send({ success: false, error: "Unable to delete namespace" })
    })

  }



})
/**
 * ****************************************
 * Namespace Section - End
 * ****************************************
 */


//----------------------------------------


/**
* ****************************************
* Content Section - Start
* ****************************************
*/
router.get('/', async (req, res) => {

  let project_id = req.projectid;
  let namespace = req.query.namespace;
  if (!namespace) {
    return res.status(400).send({ success: false, error: "queryParam 'namespace' is not defined" })
  }
  let status;
  let type;
  let limit = 200;
  let page = 0;
  let direction = -1;
  let sortField = "updatedAt";
  let text;

  let query = {};
  query["id_project"] = project_id;
  query["namespace"] = namespace;

  if (req.query.status) {
    status = parseInt(req.query.status);
    query["status"] = status;
    winston.debug("Get kb status: " + status)
  }

  if (req.query.type) {
    type = req.query.type;
    query["type"] = type;
    winston.debug("Get kb type: " + type);
  }

  if (req.query.limit) {
    limit = parseInt(req.query.limit);
    winston.debug("Get kb limit: " + limit)
  }

  if (req.query.page) {
    page = parseInt(req.query.page);
    winston.debug("Get kb page: " + page)
  }

  let skip = page * limit;
  winston.debug("Get kb skip page: " + skip);

  if (req.query.direction) {
    direction = parseInt(req.query.direction)
    winston.debug("Get kb direction: " + direction)
  }

  if (req.query.sortField) {
    sortField = req.query.sortField;
    winston.debug("Get kb sortField: " + sortField)
  }

  if (req.query.search) {
    text = req.query.search;
    query['source'] = new RegExp(text);
    winston.debug("Get kb text: " + text);
  }

  let sortQuery = {};
  sortQuery[sortField] = direction;
  winston.debug("Get kb sortQuery: " + sortQuery);

  KB.countDocuments(query, (err, kbs_count) => {
    if (err) {
      winston.error("Find all kbs error: ", err);
    }
    winston.debug("KBs count: ", kbs_count);

    KB.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortQuery)
      .exec((err, kbs) => {
        if (err) {
          winston.error("Find all kbs error: ", err);
          return res.status(500).send({ success: false, error: err });
        }

        winston.debug("KBs found: ", kbs);

        let response = {
          count: kbs_count,
          query: {},
          kbs: kbs
        }
        if (status) {
          response.query.status = status;
        }
        if (limit) {
          response.query.limit = limit;
        }
        if (status) {
          response.query.page = page;
        }
        if (sortField) {
          response.query.sortField = sortField;
        }
        if (direction) {
          response.query.direction = direction;
        }
        if (text) {
          response.query.search = text;
        }


        return res.status(200).send(response);
      })

  })


})

router.get('/:kb_id', async (req, res) => {

  let kb_id = req.params.kb_id;

  KB.findById(kb_id, (err, kb) => {
    if (err) {
      winston.error("Find kb by id error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    if (!kb) {
      return res.status(404).send({ success: false, error: "Content not found with id " + kb_id });
    }

    return res.status(200).send(kb);
  })
})

router.post('/', async (req, res) => {

  let project_id = req.projectid;
  let body = req.body;
  let namespace_id = body.namespace;

  if (!body.namespace) {
    return res.status(400).send({ success: false, error: "parameter 'namespace' is not defined" });
  }

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }
  
  let quoteManager = req.app.get('quote_manager');
  try {
    await aiManager.checkQuotaAvailability(quoteManager, req.project, 1)
  } catch(err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error, plan_limit: err.plan_limit })
  }

  let new_kb = {
    id_project: project_id,
    name: body.name,
    type: body.type,
    source: body.source,
    content: body.content,
    namespace: body.namespace,
    status: -1
  }
  if (!new_kb.namespace) {
    new_kb.namespace = project_id;
  }
  if (new_kb.type === 'txt') {
    new_kb.scrape_type = 1;
  }
  if (new_kb.type === 'url') {
    new_kb.refresh_rate = body.refresh_rate;
    if (!body.scrape_type || body.scrape_type === 2) {
      new_kb.scrape_type = 2;
      new_kb.scrape_options = aiManager.setDefaultScrapeOptions();
    } else {
      new_kb.scrape_type = body.scrape_type;
      new_kb.scrape_options = body.scrape_options;
    }
  }

  winston.debug("adding kb: ", new_kb);

  KB.findOneAndUpdate({ id_project: project_id, type: 'url', source: new_kb.source }, new_kb, { upsert: true, new: true, rawResult: true }, async (err, raw_content) => {
    if (err) {
      winston.error("findOneAndUpdate with upsert error: ", err);
      res.status(500).send({ success: false, error: err });
    }
    else {

      delete raw_content.ok;
      delete raw_content.$clusterTime;
      delete raw_content.operationTime;
      
      let saved_kb = raw_content.value;
      let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

      let json = {
        id: saved_kb._id,
        type: saved_kb.type,
        source: saved_kb.source,
        content: "",
        namespace: saved_kb.namespace,
        webhook: webhook
      }
      winston.debug("json: ", json);

      if (saved_kb.content) {
        json.content = saved_kb.content;
      }
      if (saved_kb.scrape_type) {
        json.scrape_type = saved_kb.scrape_type;
      }
      if (saved_kb.scrape_options) {
        json.parameters_scrape_type_4 = saved_kb.scrape_options;
      }
      json.engine = namespace.engine || default_engine;
      json.hybrid = namespace.hybrid;
      
      let embedding = namespace.embedding || default_embedding;
      embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;
      json.embedding = embedding;

      let resources = [];

      resources.push(json);
      
      if (process.env.NODE_ENV === 'test') {
        return res.status(200).send({ success: true, message: "Schedule scrape skipped in test environment", data: raw_content, schedule_json: json });
      }
        
      aiManager.scheduleScrape(resources, namespace.hybrid);
      return res.status(200).send(raw_content);

    }
  })

})

router.post('/multi', upload.single('uploadFile'), async (req, res) => {

  let list;
  if (req.file) {
    file_string = req.file.buffer.toString('utf-8');
    list = file_string.trim().split('\n');
  } else {
    list = req.body.list;
  }

  let project_id = req.projectid;
  let refresh_rate = req.body.refresh_rate;
  let scrape_type = req.body.scrape_type ?? 2;
  let scrape_options = req.body.scrape_options;
  if (scrape_type === 2 && scrape_options == null) {
    scrape_options = aiManager.setDefaultScrapeOptions();
  }

  let namespace_id = req.query.namespace;
  if (!namespace_id) {
    return res.status(400).send({ success: false, error: "queryParam 'namespace' is not defined" })
  }

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let quoteManager = req.app.get('quote_manager');
  try {
    await aiManager.checkQuotaAvailability(quoteManager, req.project, list.length)
  } catch(err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error, plan_limit: err.plan_limit })
  }

  if (list.length > 300) {
    winston.error("Too many urls. Can't index more than 300 urls at a time.");
    return res.status(403).send({ success: false, error: "Too many urls. Can't index more than 300 urls at a time." })
  }

  const options = {
    scrape_type: scrape_type,
    scrape_options: scrape_options,
    refresh_rate: refresh_rate
  }

  let result;
  try {
    result = await aiManager.addMultipleUrls(namespace, list, options);
    return res.status(200).send(result);
  } catch (err) {
    winston.error("addMultipleUrls error: ", err)
    return res.status(500).send({ success: false, error: "Unable to add multiple urls due to an error." });
  }

})

router.post('/csv', upload.single('uploadFile'), async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.query.namespace;

  let csv = req.file.buffer.toString('utf8');
  winston.debug("csv: ", csv);

  let delimiter = req.body.delimiter || ";";
  winston.debug("delimiter: ", delimiter);

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

  let kbs = [];

  parsecsv.parseString(csv, { headers: false, delimiter: delimiter })
    .on("data", (data) => {

      let question = data[0];
      let answer = data[1];

      kbs.push({
        id_project: project_id,
        name: question,
        source: question,
        type: 'faq',
        content: question + "\n" + answer,
        namespace: namespace_id,
        status: -1
      })
    })
    .on("end", async () => {
      winston.debug("kbs after CSV parsing: ", kbs);

      try {
        let quoteManager = req.app.get('quote_manager');
        await aiManager.checkQuotaAvailability(quoteManager, req.project, kbs.length)
      } catch(err) {
        let errorCode = err?.errorCode ?? 500;
        return res.status(errorCode).send({ success: false, error: err.error, plan_limit: err.plan_limit })
      }

      let operations = kbs.map(doc => {
        return {
          updateOne: {
            filter: { id_project: doc.id_project, type: 'faq', source: doc.source, namespace: namespace_id },
            update: doc,
            upsert: true,
            returnOriginal: false
          }
        }
      })

      aiManager.saveBulk(operations, kbs, project_id, namespace_id).then((result) => {

        let engine = namespace.engine || default_engine;
        let embedding = namespace.embedding || default_embedding;
        embedding.api_key = process.env.EMBEDDING_API_KEY || process.env.GPTKEY;
        let hybrid = namespace.hybrid;

        let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project,  ...keepAttrs }) => keepAttrs)
        resources = resources.map(({ _id, ...rest}) => {
          return { id: _id, webhook: webhook, embedding: embedding, engine: engine, ...rest };
        })
        winston.verbose("resources to be sent to worker: ", resources);

        if (process.env.NODE_ENV === 'test') {
          return res.status(200).send({ success: true, message: "Schedule scrape skipped in test environment", data: result, schedule_json: resources });
        }
        
        aiManager.scheduleScrape(resources, hybrid);
        return res.status(200).send(result);

      }).catch((err) => {
        winston.error("Unabled to saved kbs in bulk " + err);
        res.status(500).send(err);
      })

    })
    .on("error", (err) => {
      winston.error("CSV parsing error: ", err);
      res.status(400).send({ success: false, error: err });
    })

})

router.post('/sitemap', async (req, res) => {

  let sitemap_url = req.body.sitemap;

  const sitemap = new Sitemapper({
    url: sitemap_url,
    timeout: 15000,
    debug: false
  });

  sitemap.fetch().then((data) => {
    // TODO - check on data.errors to catch error
    winston.debug("data: ", data);
    res.status(200).send(data);
  }).catch((err) => {
    console.error("err ", err)
    res.status(500).send({ success: false, error: err });
  })

})

router.post('/sitemap/import', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.query.namespace;
  let content = req.body;

  if (content.type !== "sitemap") {
    return res.status(403).send({success: false, error: "Endpoint available for sitemap type only." });
  }

  if (!namespace_id) {
    return res.status(400).send({ success: false, error: "queryParam 'namespace' is not defined" })
  }
  
  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let sitemap_url = req.body.source;

  // let quoteManager = req.app.get('quote_manager');
  // let limits = await quoteManager.getPlanLimits(req.project);
  // let kbs_limit = limits.kbs;
  // winston.verbose("Limit of kbs for current plan: " + kbs_limit);

  // let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
  // winston.verbose("Kbs count: " + kbs_count);

  const sitemap = new Sitemapper({
    url: sitemap_url,
    timeout: 15000,
    debug: false
  });

  const data = await sitemap.fetch().catch((err) => {
    winston.error("Error fetching sitemap: ", err);
    return res.status(500).send({ success: false, error: err });
  })

  if (data.errors && data.errors.length > 0) {
    winston.error("An error occurred during sitemap fetch: ", data.errors[0])
    return res.status(500).send({ success: false, error: "Unable to fecth sitemap due to an error: " + data.errors[0].message})
  }

  const urls = Array.isArray(data.sites) ? data.sites : [];
  if (urls.length === 0) {
    return res.status(400).send({ success: false, error: "No url found on sitemap" });
  }

  // let total_count = kbs_count + 1 + urls.length;
  // if (total_count > kbs_limit) {
  //   return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
  // }

  let refresh_rate = req.body.refresh_rate;
  let scrape_type = req.body.scrape_type ?? 2;
  let scrape_options = req.body.scrape_options;
  if (scrape_type === 2 && scrape_options == null) {
    scrape_options = aiManager.setDefaultScrapeOptions();
  }

  let sitemap_content = {
    id_project: project_id,
    name: sitemap_url,
    source: sitemap_url,
    type: 'sitemap',
    content: "",
    namespace: namespace_id,
    scrape_type: scrape_type,
    scrape_options: scrape_options,
    refresh_rate: refresh_rate
  }

  let saved_content;
  try {
    saved_content = await KB.findOneAndUpdate({ id_project: project_id, type: 'sitemap', source: sitemap_url, namespace: namespace_id }, sitemap_content, { upsert: true, new: true }).lean().exec();
  } catch (err) {
    winston.error("Error saving content: ", err);
    return res.status(500).send({ success: false, error: err });
  }



  const options = {
    sitemap_origin_id: saved_content._id,
    sitemap_origin: saved_content.source,
    scrape_type: saved_content.scrape_type,
    scrape_options: saved_content.scrape_options,
    refresh_rate: saved_content.refresh_rate
  }
  
  try {
    await aiManager.scheduleSitemap(namespace, saved_content, options);
    let result = await aiManager.addMultipleUrls(namespace, urls, options);
    if (process.env.NODE_ENV === 'test') {
      result.result.push(saved_content);
      return res.status(200).send(result);
    }
    result.push(saved_content);
    return res.status(200).send(result);
  } catch (err) {
    return res.status(500).send({ success: false, error: "Unable to add multiple urls from sitemap due to an error." });
  }  
  
})

router.put('/:kb_id', async (req, res) => {

  let kb_id = req.params.kb_id;
  winston.verbose("update kb_id " + kb_id);

  let update = {};

  if (req.body.name != undefined) {
    update.name = req.body.name;
  }

  if (req.body.status != undefined) {
    update.status = req.body.status;
  }

  winston.debug("kb update: ", update);

  KB.findByIdAndUpdate(kb_id, update, { new: true }, (err, savedKb) => {

    if (err) {
      winston.error("KB findByIdAndUpdate error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    if (!savedKb) {
      winston.debug("Try to updating a non-existing kb");
      return res.status(400).send({ success: false, message: "Content not found" })
    }

    res.status(200).send(savedKb)
  })

})

router.delete('/:kb_id', async (req, res) => {

  let project_id = req.projectid;
  let kb_id = req.params.kb_id;
  winston.verbose("delete kb_id " + kb_id);

  let kb = await KB.findOne({ id_project: project_id, _id: kb_id}).catch((err) => {
    winston.warn("Unable to find kb. Error: ", err);
    return res.status(500).send({ success: false, error: err })
  })
  
  if (!kb) {
    winston.error("Unable to delete kb. Kb not found...")
    return res.status(404).send({ success: false, error: "Content not found" })
  }

  let namespace_id = kb.namespace ?? project_id;

  let namespace;
  try {
    namespace = await aiManager.checkNamespace(project_id, namespace_id);
  } catch (err) {
    let errorCode = err?.errorCode ?? 500;
    return res.status(errorCode).send({ success: false, error: err.error });
  }

  let data = {
    id: kb_id,
    namespace: namespace_id
  }

  if (!data.namespace) {
    data.namespace = project_id;
  }
  
  data.engine = namespace.engine || default_engine;
  winston.verbose("/:delete_id data: ", data);

  aiService.deleteIndex(data).then((resp) => {
    winston.debug("delete resp: ", resp.data);
    if (resp.data.success === true) {
      KB.findByIdAndDelete(kb_id, (err, deletedKb) => {

        if (err) {
          winston.error("Delete kb error: ", err);
          return res.status(500).send({ success: false, error: err });
        }
        res.status(200).send(deletedKb);
      })

    } else {
      winston.verbose("resp.data: ", resp.data);

      KB.findOneAndDelete({ _id: kb_id, status: { $in: [-1, 3, 4, 100, 300, 400] } }, (err, deletedKb) => {
        if (err) {
          winston.error("findOneAndDelete err: ", err);
          return res.status(500).send({ success: false, error: "Unable to delete the content due to an error" })
        }
        else if (!deletedKb) {
          winston.verbose("Unable to delete the content in indexing status")
          return res.status(500).send({ success: false, error: "Unable to delete the content in indexing status" })
        } else {
          res.status(200).send(deletedKb);
        }
      })
    }

  }).catch((err) => {
    let status = err.response?.status || 500;
    res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
  })

})

/**
* ****************************************
* Content Section - End
* ****************************************
*/


module.exports = router;