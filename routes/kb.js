var express = require('express');
var { Namespace, KB, Engine } = require('../models/kb_setting');
// var { KB } = require('../models/kb_setting');
// var { Engine } = require('../models/kb_setting')
var router = express.Router();
var winston = require('../config/winston');
var multer = require('multer')
var upload = multer()
const openaiService = require('../services/openaiService');
const JobManager = require('../utils/jobs-worker-queue-manager/JobManagerV2');
const { Scheduler } = require('../services/Scheduler');
var configGlobal = require('../config/global');
const Sitemapper = require('sitemapper');
var mongoose = require('mongoose');
const faq = require('../models/faq');
const faq_kb = require('../models/faq_kb');
let Integration = require('../models/integrations');
var parsecsv = require("fast-csv");

const { MODELS_MULTIPLIER } = require('../utils/aiUtils');
const { body } = require('express-validator');

const AMQP_MANAGER_URL = process.env.AMQP_MANAGER_URL;
const JOB_TOPIC_EXCHANGE = process.env.JOB_TOPIC_EXCHANGE_TRAIN || 'tiledesk-trainer';
const KB_WEBHOOK_TOKEN = process.env.KB_WEBHOOK_TOKEN || 'kbcustomtoken';
const apiUrl = process.env.API_URL || configGlobal.apiUrl;

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

let default_preview_settings = {
  model: 'gpt-4o',
  max_tokens: 256,
  temperature: 0.7,
  top_k: 4,
  //context: "You are an awesome AI Assistant."
  context: null
}
let default_engine = {
  name: "pinecone",
  type: process.env.PINECONE_TYPE,
  apikey: "",
  vector_size: 1536,
  index_name: process.env.PINECONE_INDEX
}

//let default_context = "Answer if and ONLY if the answer is contained in the context provided. If the answer is not contained in the context provided ALWAYS answer with <NOANS>\n{context}"
//let default_context = "You are an helpful assistant for question-answering tasks.\nUse ONLY the following pieces of retrieved context to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf none of the retrieved context answer the question, add this word to the end <NOANS>\n\n{context}";
let contexts = {
  "gpt-3.5-turbo":        "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### to answer the question.\nIf you don't know the answer, just say: \"I don't know<NOANS>\"\n\n####{context}####",
  "gpt-4":                "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf and only if none of the retrieved context is useful for your task, add this word to the end <NOANS>\n\n####{context}####",
  "gpt-4-turbo-preview":  "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf and only if none of the retrieved context is useful for your task, add this word to the end <NOANS>\n\n####{context}####",
  "gpt-4o":               "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf the context does not contain sufficient information to generate an accurate and informative answer, return <NOANS>\n\n####{context}####",
  "gpt-4o-mini":          "You are an helpful assistant for question-answering tasks.\nUse ONLY the pieces of retrieved context delimited by #### to answer the question.\nIf you don't know the answer, just say that you don't know.\nIf the context does not contain sufficient information to generate an accurate and informative answer, return <NOANS>\n\n####{context}####"
}

/**
* ****************************************
* Proxy Section - Start
* ****************************************
*/
router.post('/scrape/single', async (req, res) => {

  let project_id = req.projectid;

  let data = req.body;
  winston.debug("/scrape/single data: ", data);

  // if (!data.scrape_type) {
  //   data.scrape_type = 1;
  // }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  KB.findById(data.id, (err, kb) => {
    if (err) {
      winston.error("findById error: ", err);
      return res.status(500).send({ success: false, error: err });
    }

    else if (!kb) {
      return res.status(404).send({ success: false, error: "Unable to find the kb requested" })
    }
    else {

      if (!namespaceIds.includes(kb.namespace)) {
        return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
      }

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

      // json.scrape_type = 1;
      // if (data.scrape_type) {
      //   json.scrape_type = data.scrape_type;
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

      let ns = namespaces.find(n => n.id === kb.namespace);
      json.engine = ns.engine || default_engine;

      winston.verbose("/scrape/single json: ", json);

      startScrape(json).then((response) => {
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
  winston.debug("/scrapeStatus req.body: ", req.body);

  let returnObject = false;

  if (req.query &&
    req.query.returnObject &&
    (req.query.returnObject === true || req.query.returnObject === 'true')) {
    returnObject = true;
  }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);
  if (!namespaceIds.includes(data.namespace)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let ns = namespaces.find(n => n.id === data.namespace);
  data.engine = ns.engine || default_engine;

  openaiService.scrapeStatus(data).then(async (response) => {

    winston.debug("scrapeStatus response.data: ", response.data);

    let update = {};

    if (response.data.status_code) {
      // update.status = response.data.status_code;
      update.status = await statusConverter(response.data.status_code)

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

  let project_id = req.projectid;
  let publicKey = false;
  let data = req.body;

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);
  if (!namespaceIds.includes(data.namespace)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }
  
  winston.debug("/qa data: ", data);

  if (!data.gptkey) {
    let gptkey = await getKeyFromIntegrations(project_id);
    if (!gptkey) {
      gptkey = process.env.GPTKEY;
      publicKey = true;
    }
    if (!gptkey) {
      return res.status(403).send({ success: false, error: "GPT apikey undefined" })
    }
    data.gptkey = gptkey;
  }

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
    if (data.system_context) {
      data.system_context = data.system_context + " \n" + contexts[data.model];
    } else {
      data.system_context = contexts[data.model];
    }
  }

  let ns = namespaces.find(n => n.id === data.namespace);
  data.engine = ns.engine || default_engine;
  
  delete data.advancedPrompt;
  winston.verbose("ask data: ", data);
  
  if (process.env.NODE_ENV === 'test') {
    return res.status(200).send({ success: true, message: "Question skipped in test environment"});
  }

  openaiService.askNamespace(data).then((resp) => {
    winston.debug("qa resp: ", resp.data);
    let answer = resp.data;

    let id = answer.id;
    let index = id.indexOf("#");
    if (index != -1) {
      id = id.substring(index + 1);
    }

    KB.findById(id, (err, resource) => {

      if (publicKey === true) {
        let multiplier = MODELS_MULTIPLIER[data.model];
        if (!multiplier) {
          multiplier = 1;
          winston.info("No multiplier found for AI model")
        }
        obj.multiplier = multiplier;
        obj.tokens = answer.prompt_token_size;
  
        let incremented_key = quoteManager.incrementTokenCount(req.project, obj);
        winston.verbose("incremented_key: ", incremented_key);
      }

      if (err) {
        winston.error("Unable to find resource with id " + id + " in namespace " + answer.namespace + ". The standard answer is returned.")
        return res.status(200).send(resp.data);
      }

      if (!resource) {
        winston.error("Resource with id " + id + " not found in namespace " + answer.namespace + ". The standard answer is returned.")
        return res.status(200).send(resp.data);
      }

      answer.source = resource.name;
      return res.status(200).send(answer);
    })


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

router.delete('/delete', async (req, res) => {

  let project_id = req.projectid;
  let data = req.body;
  winston.debug("/delete data: ", data);

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(data.namespace)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }
  
  let ns = namespaces.find(n => n.id === data.namespace);
  data.engine = ns.engine || default_engine;

  openaiService.deleteIndex(data).then((resp) => {
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

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(data.namespace)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let ns = namespaces.find(n => n.id === data.namespace);
  data.engine = ns.engine || default_engine;

  winston.verbose("/deleteall data: ", data);

  openaiService.deleteNamespace(data).then((resp) => {
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

  Namespace.find({ id_project: project_id }).lean().exec((err, namespaces) => {

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
        engine: default_engine
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

      const namespaceObjArray = namespaces.map(({ _id, __v, ...keepAttrs }) => keepAttrs)
      winston.debug("namespaceObjArray: ", namespaceObjArray);
      return res.status(200).send(namespaceObjArray);
    }
  })
})

router.get('/namespace/:id/chunks/:content_id', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.params.id;
  let content_id = req.params.content_id;

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    return res.status(500).send({ success: false, error: err })
  })

  let namespaceIds = namespaces.map(namespace => namespace.id);
  if (!namespaceIds.includes(namespace_id)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let content = await KB.find({ id_project: project_id, namespace: namespace_id, _id: content_id }).catch((err) => {
    winston.error("find content error: ", err);
    return res.status(403).send({ success: false, error: err })
  })

  if(!content) {
    return res.status(403).send({ success: false, error: "Not allowed. The conten does not belong to the current namespace." })
  }

  let ns = namespaces.find(n => n.id === namespace_id);
  let engine = ns.engine || default_engine;
  delete engine._id;

  if (process.env.NODE_ENV === 'test') {
    return res.status(200).send({ success: true, message: "Get chunks skipped in test environment"});
  }

  openaiService.getContentChunks(namespace_id, content_id, engine).then((resp) => {
    let chunks = resp.data;
    winston.debug("chunks for content " + content_id);
    winston.debug("chunks found ", chunks);
    return res.status(200).send(chunks);

  }).catch((err) => {
    console.error("error getting content chunks err.response: ", err.response)
    console.error("error getting content chunks err.data: ", err.data)
    return res.status(500).send({ success: false, error: err });
  })

})

router.get('/namespace/:id/chatbots', async (req, res) => {

  let project_id = req.projectid;
  let namespace_id = req.params.id;
  
  let chatbotsArray = [];

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  let namespaceIds = namespaces.map(namespace => namespace.id);
  if (!namespaceIds.includes(namespace_id)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
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

router.post('/namespace', async (req, res) => {

  let project_id = req.projectid;
  let body = req.body;
  winston.debug("add namespace body: ", body);

  var namespace_id = mongoose.Types.ObjectId();
  let new_namespace = new Namespace({
    id_project: project_id,
    id: namespace_id,
    name: body.name,
    preview_settings: default_preview_settings,
    engine: default_engine
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
  //console.log("Limit of namespaces for current plan " + ns_limit);

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

    openaiService.deleteNamespace(data).then(async (resp) => {
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

    openaiService.deleteNamespace(data).then(async (resp) => {
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

    return res.status(200).send(kb);
  })
})

router.post('/', async (req, res) => {

  let project_id = req.projectid;
  let body = req.body;

  if (!body.namespace) {
    return res.status(400).send({ success: false, error: "parameter 'namespace' is not defined" });
  }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send(alert);
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(body.namespace)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }
  
  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let kbs_limit = limits.kbs;
  winston.verbose("Limit of kbs for current plan: " + kbs_limit);

  let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
  winston.verbose("Kbs count: " + kbs_count);

  if (kbs_count >= kbs_limit) {
    return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
  }

  let total_count = kbs_count + 1;
  if (total_count > kbs_limit) {
    return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
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
    if (!body.scrape_type || body.scrape_type === 2) {
      new_kb.scrape_type = 2;
      new_kb.scrape_options = await setDefaultScrapeOptions();
    } else {
      new_kb.scrape_type = body.scrape_type;
      new_kb.scrape_options = body.scrape_options;
    }
  }

  winston.debug("adding kb: ", new_kb);

  KB.findOneAndUpdate({ id_project: project_id, type: 'url', source: new_kb.source }, new_kb, { upsert: true, new: true, rawResult: true }, async (err, raw) => {
    if (err) {
      winston.error("findOneAndUpdate with upsert error: ", err);
      res.status(500).send({ success: false, error: err });
    }
    else {

      delete raw.ok;
      delete raw.$clusterTime;
      delete raw.operationTime;
      res.status(200).send(raw);

      let saved_kb = raw.value;
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
      let ns = namespaces.find(n => n.id === body.namespace);
      json.engine = ns.engine || default_engine;

      let resources = [];

      resources.push(json);
      if (!process.env.NODE_ENV) {
        scheduleScrape(resources);
      }

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
  let scrape_type = req.body.scrape_type;
  let scrape_options = req.body.scrape_options;

  let namespace_id = req.query.namespace;
  if (!namespace_id) {
    return res.status(400).send({ success: false, error: "queryParam 'namespace' is not defined" })
  }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send({ success: false, error: alert });
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(namespace_id)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let kbs_limit = limits.kbs;
  winston.verbose("Limit of kbs for current plan: " + kbs_limit);

  let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
  winston.verbose("Kbs count: " + kbs_count);

  if (kbs_count >= kbs_limit) {
    return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
  }

  let total_count = kbs_count + list.length;
  if (total_count > kbs_limit) {
    return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
  }

  if (list.length > 300) {
    winston.error("Too many urls. Can't index more than 300 urls at a time.");
    return res.status(403).send({ success: false, error: "Too many urls. Can't index more than 300 urls at a time." })
  }

  let webhook = apiUrl + '/webhook/kb/status?token=' + KB_WEBHOOK_TOKEN;

  let kbs = [];
  list.forEach( async (url) => {
    let kb = {
      id_project: project_id,
      name: url,
      source: url,
      type: 'url',
      content: "",
      namespace: namespace_id,
      status: -1,
      scrape_type: scrape_type
    }

    if (!kb.scrape_type) {
      scrape_type = 2;
    }

    if (scrape_type == 2) {
      kb.scrape_options = {
        tags_to_extract: ["body"],
        unwanted_tags: [],
        unwanted_classnames: []
      }
    } else {
      kb.scrape_options = scrape_options;
    }
    // if (scrape_type === 2) {
    //   kb.scrape_options = await setDefaultScrapeOptions();
    // } else {
    //   kb.scrape_options = await setCustomScrapeOptions(scrape_options);
    // }
    kbs.push(kb)
  })

  let operations = kbs.map(doc => {
    return {
      updateOne: {
        filter: { id_project: doc.id_project, type: 'url', source: doc.source, namespace: namespace_id },
        update: doc,
        upsert: true,
        returnOriginal: false
      }
    }
  })

  saveBulk(operations, kbs, project_id).then((result) => {

    let ns = namespaces.find(n => n.id === namespace_id);
    let engine = ns.engine || default_engine;

    let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project, ...keepAttrs }) => keepAttrs)
    resources = resources.map(({ _id, scrape_options, ...rest }) => {
      return { id: _id, webhook: webhook, parameters_scrape_type_4: scrape_options, engine: engine, ...rest}
    });
    winston.verbose("resources to be sent to worker: ", resources);

    if (!process.env.NODE_ENV) {
      scheduleScrape(resources);
    }
    res.status(200).send(result);

  }).catch((err) => {
    winston.error("Unable to save kbs in bulk ", err)
    res.status(500).send(err);
  })

})

router.post('/csv', upload.single('uploadFile'), async (req, res) => {

  let project_id = req.projectid;

  let csv = req.file.buffer.toString('utf8');
  winston.debug("csv: ", csv);

  let delimiter = req.body.delimiter || ";";
  winston.debug("delimiter: ", delimiter);

  let namespace_id = req.query.namespace;
  if (!namespace_id) {
    return res.status(400).send({ success: false, error: "queryParam 'namespace' is not defined" })
  }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  if (!namespaces || namespaces.length == 0) {
    let alert = "No namespace found for the selected project " + project_id + ". Cannot add content to a non-existent namespace."
    winston.warn(alert);
    res.status(403).send({ success: false, error: alert });
  }

  let namespaceIds = namespaces.map(namespace => namespace.id);

  if (!namespaceIds.includes(namespace_id)) {
    return res.status(403).send({ success: false, error: "Not allowed. The namespace does not belong to the current project." })
  }

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let kbs_limit = limits.kbs;
  winston.verbose("Limit of kbs for current plan: " + kbs_limit);

  let kbs_count = await KB.countDocuments({ id_project: project_id }).exec();
  winston.verbose("Kbs count: " + kbs_count);

  if (kbs_count >= kbs_limit) {
    return res.status(403).send({ success: false, error: "Maximum number of resources reached for the current plan", plan_limit: kbs_limit })
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
    .on("end", () => {
      winston.debug("kbs after CSV parsing: ", kbs);

      let total_count = kbs_count + kbs.length;
      if (total_count >= kbs_limit) {
        return res.status(403).send({ success: false, error: "Cannot exceed the number of resources in the current plan", plan_limit: kbs_limit })
      }

      if (kbs.length > 300) {
        return res.status(403).send({ success: false, error: "Too many faqs. Can't index more than 300 urls at a time." })
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

      saveBulk(operations, kbs, project_id).then((result) => {

        let ns = namespaces.find(n => n.id === namespace_id);
        let engine = ns.engine || default_engine;

        let resources = result.map(({ name, status, __v, createdAt, updatedAt, id_project,  ...keepAttrs }) => keepAttrs)
        resources = resources.map(({ _id, ...rest}) => {
          return { id: _id, webhooh: webhook, engine: engine, ...rest };
        })
        winston.verbose("resources to be sent to worker: ", resources);
        if (!process.env.NODE_ENV) {
          scheduleScrape(resources);
        }
        res.status(200).send(result);
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
    timeout: 15000
  });

  sitemap.fetch().then((data) => {
    winston.debug("data: ", data);
    res.status(200).send(data);
  }).catch((err) => {
    console.error("err ", err)
    res.status(500).send({ success: false, error: err });
  })

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
  
  let data = {
    id: kb_id,
    namespace: kb.namespace
  }

  if (!data.namespace) {
    data.namespace = project_id;
  }

  let namespaces = await Namespace.find({ id_project: project_id }).catch((err) => {
    winston.error("find namespaces error: ", err)
    res.status(500).send({ success: false, error: err })
  })

  let ns = namespaces.find(n => n.id === data.namespace);
  data.engine = ns.engine || default_engine;

  winston.verbose("/:delete_id data: ", data);

  openaiService.deleteIndex(data).then((resp) => {
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
    let status = err.response.status;
    res.status(status).send({ success: false, statusText: err.response.statusText, error: err.response.data.detail });
  })

})

/**
* ****************************************
* Content Section - End
* ****************************************
*/


//----------------------------------------


/**
* ****************************************
* Utils Methods Section - Start
* ****************************************
*/

async function saveBulk(operations, kbs, project_id) {

  return new Promise((resolve, reject) => {
    KB.bulkWrite(operations, { ordered: false }).then((result) => {
      winston.verbose("bulkWrite operations result: ", result);

      KB.find({ id_project: project_id, source: { $in: kbs.map(kb => kb.source) } }).lean().then((documents) => {
        winston.debug("documents: ", documents);
        resolve(documents)
      }).catch((err) => {
        winston.error("Error finding documents ", err)
        reject(err);
      })

    }).catch((err) => {
      reject(err);
    })
  })

}

async function statusConverter(status) {
  return new Promise((resolve) => {

    let td_status;
    switch (status) {
      case 0:
        td_status = -1;
        break;
      case 2:
        td_status = 200;
        break;
      case 3:
        td_status = 300;
        break;
      case 4:
        td_status = 400;
        break;
      default:
        td_status = -1
    }
    resolve(td_status);
  })
}

async function updateStatus(id, status) {
  return new Promise((resolve) => {

    KB.findByIdAndUpdate(id, { status: status }, { new: true }, (err, updatedKb) => {
      if (err) {
        resolve(false)
      } else if (!updatedKb) {
        winston.verbose("Unable to update status. Data source not found.")
        resolve(false)
      } else {
        winston.debug("updatedKb: ", updatedKb)
        resolve(true);
      }
    })
  })
}

async function scheduleScrape(resources) {

  // let data = {
  //     resources: resources
  // }
  let scheduler = new Scheduler({ jobManager: jobManager });

  resources.forEach(r => {
    winston.debug("Schedule job with following data: ", r);
    scheduler.trainSchedule(r, async (err, result) => {
      let error_code = 100;
      if (err) {
        winston.error("Scheduling error: ", err);
        error_code = 400;
      } else {
        winston.info("Scheduling result: ", result);
      }
      await updateStatus(r.id, error_code);
    });
  })


  return true;
}

async function startScrape(data) {

  if (!data.gptkey) {
    let gptkey = process.env.GPTKEY;
    if (!gptkey) {
      return { error: "GPT apikey undefined" }
    }
    data.gptkey = gptkey;
  }


  let status_updated = await updateStatus(data.id, 200);
  winston.verbose("status of kb " + data.id + " updated: " + status_updated);

  return new Promise((resolve, reject) => {
    openaiService.singleScrape(data).then(async (resp) => {
      winston.debug("singleScrape resp: ", resp.data);
      let status_updated = await updateStatus(data.id, 300);
      winston.verbose("status of kb " + data.id + " updated: " + status_updated);
      resolve(resp.data);
    }).catch( async (err) => {
      winston.error("singleScrape err: ", err);
      let status_updated = await updateStatus(data.id, 400);
      winston.verbose("status of kb " + data.id + " updated: " + status_updated);
      reject(err);
    })
  })
}

async function getKeyFromIntegrations(project_id) {

  return new Promise( async (resolve) => {

    let integration = await Integration.findOne({ id_project: project_id, name: 'openai' }).catch((err) => {
      winston.error("Unable to find openai integration for the current project " + project_id);
      resolve(null);
    })
    if (integration && integration.value && integration.value.apikey) {
      resolve(integration.value.apikey);
    } else {
      resolve(null);
    }
  })
}

async function setDefaultScrapeOptions() {
  return {
    tags_to_extract: ["body"],
    unwanted_tags: [],
    unwanted_classnames: []
  }
}

async function setCustomScrapeOptions(options) {
  if (!options) {
    options = await setDefaultScrapeOptions();
  } else {
    if (!options.tags_to_extract || options.tags_to_extract.length == 0) {
      options.tags_to_extract = ["body"];
    }
    if (!options.unwanted_tags) {
      options.unwanted_tags = [];
    }
    if (!options.unwanted_classnames) {
      options.unwanted_classnames = [];
    }
  }
}
/**
* ****************************************
* Utils Methods Section - End
* ****************************************
*/



module.exports = router;