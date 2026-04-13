var express = require('express');
var router = express.Router();
var Faq_kb = require("../models/faq_kb");
var Faq = require("../models/faq");
var Department = require("../models/department");
var faqService = require("../services/faqService");
const botEvent = require('../event/botEvent');
const faqBotEvent = require('../event/faqBotEvent');
var winston = require('../config/winston');
var httpUtil = require("../utils/httpUtil");
const { forEach } = require('lodash');
var multer = require('multer')
var configGlobal = require('../config/global');
const faq = require('../models/faq');
var jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const trainingService = require('../services/trainingService');
var roleChecker = require('../middleware/has-role');
const roleConstants = require('../models/roleConstants');
const errorCodes = require('../errorCodes');
const faq_kb = require('../models/faq_kb');

let chatbot_templates_api_url = process.env.CHATBOT_TEMPLATES_API_URL


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = { fileSize: parseInt(MAX_UPLOAD_FILE_SIZE) };
  winston.debug("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.debug("Max upload file size is infinity");
}
var upload = multer({ limits: uploadlimits });


router.post('/', roleChecker.hasRole('admin'), async function (req, res) {
  winston.debug('create BOT ', req.body);

  let quoteManager = req.app.get('quote_manager');
  let limits = await quoteManager.getPlanLimits(req.project);
  let chatbots_limit = limits.chatbots;
  winston.debug("chatbots_limit for project " + req.projectid + ": " + chatbots_limit);

  let chatbots_count = await Faq_kb.countDocuments({ id_project: req.projectid, type: { $ne: "identity" } }).exec();
  winston.debug("chatbots_count for project " + req.projectid + ": " + chatbots_count);

  if (chatbots_count >= chatbots_limit) {
    winston.info("Chatbots limit reached for project " + req.projectid + ". Block currently disabled.");
    //return res.status(403).send({ success: false, error: "Maximum number of chatbots reached for the current plan", plan_limit: chatbots_limit })
  }

  faqService.create(req.projectid, req.user.id, req.body).then((savedFaq_kb) => {
    res.status(200).send(savedFaq_kb);
  }).catch((err) => {
    res.status(500).send({ succes: false, error: err })
  })

});

router.post('/train', roleChecker.hasRole('admin'), function (req, res) {

  winston.info('train BOT ', req.body);

  Faq_kb.findById(req.body.id_faq_kb).exec(function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());

    winston.debug('faq_kb.type :' + faq_kb.type);
    if (faq_kb.type == "internal" && faq_kb.url) {

      var train = {
        language: faq_kb.language,
        nlu: []
      };
      winston.info("train", train);

      var query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb };

      Faq.find(query)
        .limit(10000)
        .lean().
        exec(async (err, faqs) => {
          if (err) {
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          if (faqs && faqs.length > 0) {
            winston.info("faqs exact", faqs);

            faqs.forEach(function (f) {
              var intent = {
                intent: f.intent_display_name,
                examples: []
              }
              var questions = f.question.split("\n");
              winston.info("questions", questions);

              questions.forEach(function (q) {
                winston.info("q", q);
                intent.examples.push(q);
              });
              winston.info("intent", intent);
              train.nlu.push(intent);
            });
            winston.info("train", train);

            try {
              var trainHttp = await httpUtil.call(faq_kb.url + "/trainandload", undefined, train, "POST");
            } catch (e) {
              winston.error("error training", e);
            }

            return res.json({ train: train, httpResponse: trainHttp });

          } else {
            return res.status(400).send({ success: false, msg: 'no faq to  train on external bot.' });
          }
        });
    } else {
      winston.debug('external query: ');
      return res.status(400).send({ success: false, msg: 'you can train a standard internal bot or an external bot.' });
    }

  });
});

router.post('/aitrain/', roleChecker.hasRole('admin'), async (req, res) => {

  const chatbot_id = req.body.id_faq_kb;
  const id_project = req.projectid;
  let webhook_enabled = req.body.webhook_enabled;

  Faq_kb.findOne({ _id: chatbot_id, id_project: id_project}, async (err, chatbot) => {
    if (err) {
      return res.status(400).send({ success: false, error: err })
    }
    if (!chatbot) {
      return res.status(404).send({ sucess: false, error: "Chatbot not found" });
    }
    if (chatbot.intentsEngine === 'tiledesk-ai') {

      // Option 1: emit event
      //faqBotEvent.emit('faq_train.train', chatbot_id, webhook_enabled);

      // Option 2: call service directly
      trainingService.train(null, chatbot_id, webhook_enabled).then((training_result) => {
        winston.info("training result: ", training_result);
        let response = {
          succes: true,
          message: "Training started"
        }
        if (webhook_enabled === false) {
          response.queue_message = training_result;
        }
        return res.status(200).send(response);

      }).catch((err) => {
        winston.error("training error: ", err);
        return res.status(200).send({ success: false, message: "Trained not started", error: err });
      })

    } else {
      return res.status(200).send({ success: true, message: "Trained not started", reason: "Training available for intentsEngine equal to tiledesk-ai only" })
    }
  })
})

router.post('/askbot', roleChecker.hasRole('admin'), function (req, res) {

  winston.debug('ASK BOT ', req.body);

  const chatbot_id = req.body.id_faq_kb;
  const id_project = req.projectid;

  Faq_kb.findOne({ _id: chatbot_id, id_project: id_project }).exec(function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());
    winston.debug('faq_kb.type :' + faq_kb.type);
    if (faq_kb.type == "internal" || faq_kb.type == "tilebot") {

      var query = { "id_project": id_project, "id_faq_kb": chatbot_id, "question": req.body.question };

      Faq.find(query)
        .lean().
        exec(function (err, faqs) {
          if (err) {
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          if (faqs && faqs.length > 0) {
            winston.debug("faqs exact", faqs);

            faqs.forEach(f => {
              f.score = 100;
            });
            var result = { hits: faqs };

            res.json(result);
          } else {
            query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb };

            var search_obj = { "$search": req.body.question };

            if (faq_kb.language) {
              search_obj["$language"] = faq_kb.language;
            }
            query.$text = search_obj;
            winston.debug("fulltext search query", query);
            winston.debug('internal ft query: ' + query);

            Faq.find(query, { score: { $meta: "textScore" } })
              .sort({ score: { $meta: "textScore" } }) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
              .lean().
              exec(function (err, faqs) {
                if (err) {
                  winston.error('Error getting object.', err);
                  return res.status(500).send({ success: false, msg: 'Error getting fulltext object.' });
                }

                winston.debug("faqs", faqs);

                var result = { hits: faqs };
                res.json(result);
              });
          }
        });
    } else {
      winston.debug('external query: ');
      return res.status(400).send({ success: false, msg: 'askbot on external bot.' });
    }
  });
});

router.put('/:faq_kbid/publish', roleChecker.hasRole('admin'), async (req, res) => {

  let id_faq_kb = req.params.faq_kbid;
  winston.debug('id_faq_kb: ' + id_faq_kb);

  let chatbot_id;
  let release_note;

  if (req.body.restore_from) {
    chatbot_id = req.body.restore_from;
    release_note = "Restored from " + chatbot_id;
  } else {
    chatbot_id = id_faq_kb;
    release_note = req.body.release_note || "No comment";
  }

  const api_url = process.env.API_URL || configGlobal.apiUrl;
  winston.debug("fork --> base_url: " + api_url); // check if correct

  let current_project_id = req.projectid;
  winston.debug("current project id: " + current_project_id);

  let token = req.headers.authorization;

  let cs = req.app.get('chatbot_service')

  try {
    //  fork(id_faq_kb, api_url, token, project_id)
    let forked = await cs.fork(chatbot_id, api_url, token, current_project_id);
    // winston.debug("forked: ", forked)

    let forkedChatBotId = forked.bot_id;
    winston.debug("forkedChatBotId: " + forkedChatBotId);

    let updatedForkedChabot = await Faq_kb.findByIdAndUpdate(forkedChatBotId, { $unset: { slug: 1 }, trashed: true, root_id: id_faq_kb, release_note: release_note, publishedBy: req.user.id, publishedAt: new Date().getTime() }, { new: true, upsert: true }).exec();
    //let updatedForkedChabot = await Faq_kb.findByIdAndUpdate(forkedChatBotId, { $unset: { slug: 1 }, trashed: true, root_id: id_faq_kb, publishedBy: req.user.id, publishedAt: new Date().getTime() }, { new: true }).exec();
    winston.debug("updatedForkedChabot: ", updatedForkedChabot);
    botEvent.emit('faqbot.update', updatedForkedChabot);

    const port = process.env.PORT || '3000';
    let TILEBOT_ENDPOINT = "http://localhost:" + port + "/modules/tilebot/ext/";;
    if (process.env.TILEBOT_ENDPOINT) {
      TILEBOT_ENDPOINT = process.env.TILEBOT_ENDPOINT + "/ext/"
    }
    winston.debug("TILEBOT_ENDPOINT: " + TILEBOT_ENDPOINT);

    let updatedOriginalChabot = await Faq_kb.findByIdAndUpdate(id_faq_kb, { url: TILEBOT_ENDPOINT + forkedChatBotId }, { new: true, upsert: true }).exec();
    winston.debug("updatedOriginalChabot: ", updatedOriginalChabot);

    cs.setModified(id_faq_kb, false);

    botEvent.emit('faqbot.update', updatedOriginalChabot);

    return res.status(200).send({ message: "Chatbot published successfully", bot_id: forkedChatBotId });

  } catch (e) {
    winston.error("Error Unable publish chatbot: ", e);
    return res.status(500).send({ success: false, message: "Unable publish chatbot" });
  }
});

router.put('/:faq_kbid', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), function (req, res) {

  winston.debug(req.body);

  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  var update = {};
  const allowedFields = [
    'name',
    'description',
    'url',
    'webhook_url',
    'webhook_enabled',
    'type',
    'trashed',
    'public',
    'certified',
    'mainCategory',
    'intentsEngine',
    'tags',
    'trained',
    'short_description',
    'title',
    'certifiedTags',
    'agents_available',
    'slug'
  ];

  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) {
      update[f] = req.body[f];
    }
  });

  update.modified = true;
  
  winston.debug("update", update);

  Faq_kb.findOneAndUpdate({ _id: chatbot_id, id_project: id_project }, update, { new: true }, function (err, updatedFaq_kb) {   //TODO add cache_bot_here
    if (err) {
      if (err.code === 11000 && err.keyValue.slug) {
        return res.status(500).send({ success: false, msg: 'Error updating object.', error: 'Slug already exists: ' + err.keyValue.slug, error_code: errorCodes.CHATBOT.ERRORS.DUPLICATE_SLUG })
      } else {
        return res.status(500).send({ success: false, msg: 'Error updating object.' });
      }
    }

    if (!updatedFaq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }

    botEvent.emit('faqbot.update', updatedFaq_kb);
    res.json(updatedFaq_kb);
  });
});

router.put('/:faq_kbid/language/:language', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), (req, res) => {

  winston.debug("update language: ", req.params);
  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  let update = {};
  if (req.params.language != undefined) {
    update.language = req.params.language;
  }

  winston.debug("update", update);
  Faq_kb.findOneAndUpdate({ _id: chatbot_id, id_project: id_project }, update, { new: true }, (err, updatedFaq_kb) => {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    if (!updatedFaq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }

    Faq.updateMany({ id_faq_kb: req.params.faq_kbid }, update, (err, result) => {
      if (err) {
        botEvent.emit('faqbot.update', updatedFaq_kb);
        return res.status(500).send({ success: false, msg: 'Error updating multiple object.' });
      }
      return res.status(200).send(updatedFaq_kb)
    })

  })

})

router.patch('/:faq_kbid/attributes', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), function (req, res) {   //TODO add cache_bot_here
  var data = req.body;

  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  // TODO use service method
  Faq_kb.findOne({ _id: chatbot_id, id_project: id_project }, function (err, updatedBot) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    if (!updatedBot) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }
    
    if (!updatedBot.attributes) {
      winston.debug("empty attributes")
      updatedBot.attributes = {};
    }

    winston.debug(" updatedBot attributes", updatedBot.attributes)

    Object.keys(data).forEach(function (key) {
      var val = data[key];
      winston.debug("data attributes " + key + " " + val)
      updatedBot.attributes[key] = val;
    });

    winston.debug("updatedBot attributes", updatedBot.attributes)

    // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
    updatedBot.markModified('attributes');

    //cacheinvalidation
    updatedBot.save(function (err, savedProject) {
      if (err) {
        winston.error("error saving bot attributes", err)
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      winston.verbose(" saved bot attributes", updatedBot.toObject())
      botEvent.emit('faqbot.update', updatedBot);
      res.json(updatedBot);
    });
  });

});

router.delete('/:faq_kbid', roleChecker.hasRole('admin'), function (req, res) {

  winston.debug(req.body);

  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  Faq_kb.findOneAndDelete({ _id: chatbot_id, id_project: id_project }, function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }
    /**
     * WARNING: faq_kb is the operation result, not the faq_kb object. The event subscriber will not receive the object as expected.
     */
    botEvent.emit('faqbot.delete', faq_kb);
    res.status(200).send({ success: true, message: "Chatbot with id " + req.params.faq_kbid + " deleted successfully" })
  });
});

router.get('/:faq_kbid', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), function (req, res) {

  winston.debug(req.query);

  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  Faq_kb.findOne({ _id: chatbot_id, id_project: id_project }, function (err, faq_kb) {   //TODO add cache_bot_here
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }

    if (req.query.departmentid) {

      winston.debug("»»» »»» req.query.departmentid", req.query.departmentid);

      Department.findById(req.query.departmentid, function (err, department) {
        if (err) {
          winston.error(err);
          // return res.status(500).send({ success: false, msg: 'Error getting department.' });
          res.json(faq_kb);
        }
        if (!department) {
          winston.debug("Department not found", req.query.departmentid);
          // return res.status(404).send({ success: false, msg: 'Department not found.' });
          res.json(faq_kb);
        } else {
          winston.debug("department", department);

          // https://github.com/Automattic/mongoose/issues/4614
          faq_kb._doc.department = department;
          winston.debug("faq_kb", faq_kb);

          res.json(faq_kb);
        }
      });

    } else {
      winston.debug('¿¿ MY USECASE ?? ')
      res.json(faq_kb);
    }

  });
});

router.get('/:faq_kbid/published', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), async function (req, res) {

  const id_project = req.projectid;
  const chatbot_id = req.params.faq_kbid;

  let published_chatbots = await faq_kb.find({ id_project: id_project, root_id: chatbot_id })
    .sort({ publishedAt: -1 })
    .limit(100)
    .populate('publishedBy', '_id firstname lastname email')
    .catch((err) => {
      winston.error("Error finding published chatbots: ", err);
      return res.status(500).send({ success: false, error: "Error finding published chatbots from root " + chatbot_id });
    })

  res.status(200).send(published_chatbots);

})

router.get('/:faq_kbid/jwt', roleChecker.hasRoleOrTypes('admin', ['bot', 'subscription']), function (req, res) {

  winston.debug(req.query);

  const chatbot_id = req.params.faq_kbid;
  const id_project = req.projectid;

  Faq_kb.findOne({ _id: chatbot_id, id_project: id_project }).select("+secret").exec(function (err, faq_kb) {   //TODO add cache_bot_here
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }

    var signOptions = {
      issuer: 'https://tiledesk.com',
      subject: 'bot',
      audience: 'https://tiledesk.com/bots/' + faq_kb._id,
      jwtid: uuidv4()
    };

    // TODO metti bot_? a user._id

    // tolgo description, attributes
    let botPayload = faq_kb.toObject();

    let botSecret = botPayload.secret;
    // winston.info("botSecret: " + botSecret);

    delete botPayload.secret;
    delete botPayload.description;
    delete botPayload.attributes;

    var token = jwt.sign(botPayload, botSecret, signOptions);

    res.json({ "jwt": token });
  });
});

/**
 * This endpoint should be the only one reachble with role agent.
 * If the role is agent the response must contain only _id, name, or other non relevant info.
 */
router.get('/', roleChecker.hasRoleOrTypes('agent', ['bot', 'subscription']), function (req, res) {

  winston.debug("req.query", req.query);

  const id_project = req.projectid;
  winston.debug("GET FAQ-KB req projectid " + id_project);


  let restricted_mode = false;

  let project_user = req.projectuser;
  if (project_user && project_user.role === roleConstants.AGENT) {
    restricted_mode = true;
  }


  /**
   * if filter only for 'trashed = false', 
   * the bots created before the implementation of the 'trashed' property are not returned 
   */
  let query = { id_project: id_project, trashed: { $in: [null, false] } };

  if (restricted_mode === true) {
    query.agents_available = {
      $in: [null, true]
    }
  }

  if (req.query.all != "true") {
    query.type = { $ne: "identity" }
  }

  if (req.query.text) {
    const search_obj = { $search: req.query.text };
    if (req.query.language) search_obj.$language = req.query.language;
    query.$text = search_obj;
  }

  const allowedFilters = ["public", "certified"];
  allowedFilters.forEach(f => {
    if (req.query[f] !== undefined) {
      query[f] = req.query[f];
    }
  });

  winston.debug("query", query);

  Faq_kb.find(query).lean().exec((err, faq_kbs) => {
    if (err) {
      winston.error('GET FAQ-KB ERROR ', err)
      return res.status(500).send({ success: false, message: "Unable to get chatbots" });
    }

    if (restricted_mode === true) {
      // Returns only: _id, name, id_project, language
      faq_kbs = faq_kbs.map(({ webhook_enabled, intentsEngine, score, url, attributes, trained, certifiedTags, createdBy, createdAt, updatedAt, __v, ...keepAttrs }) => keepAttrs)
    }

    res.json(faq_kbs)

  })
});

router.post('/fork/:id_faq_kb', roleChecker.hasRole('admin'), async (req, res) => {

  let id_faq_kb = req.params.id_faq_kb;
  winston.debug('id_faq_kb: ' + id_faq_kb);

  const api_url = process.env.API_URL || configGlobal.apiUrl;
  winston.debug("fork --> base_url: " + api_url); // check if correct

  let current_project_id = req.projectid;
  winston.debug("current project id: " + current_project_id);

  let landing_project_id = req.query.projectid;
  winston.debug("landing project id " + landing_project_id)

  let public = req.query.public;
  winston.debug("public " + public);

  let globals = req.query.globals;
  winston.debug("export globals " + globals);

  let token = req.headers.authorization;

  let cs = req.app.get('chatbot_service')
  let chatbot;
  try {
    chatbot = await cs.getBotById(id_faq_kb, public, api_url, chatbot_templates_api_url, token, current_project_id, globals);
  } catch (err) {
    return res.status(500).send({ success: false, error: "Unable to get chatbot to be forked"});
  }

  if (!chatbot) {
    return res.status(500).send({ success: false, message: "Unable to get chatbot to be forked" });
  }

  if (!globals) {
    if (chatbot.attributes) {
      delete chatbot.attributes.globals
    }
  }
  
  delete chatbot.modified;

  chatbot.template = "empty";
  
  let savedChatbot
  try {
    savedChatbot = await cs.createBot(api_url, token, chatbot, landing_project_id);
    winston.debug("savedChatbot: ", savedChatbot)
  } catch(err) {
    winston.error("Error creating new chatbot: ", err);
    return res.status(500).send({ success: false, message: "An error occurred during chatbot creation"});
  }

  if (!savedChatbot) {
    return res.status(500).send({ success: false, message: "Unable to create new chatbot" });
  }
  
  let import_result
  try {
    import_result = await cs.importFaqs(api_url, savedChatbot._id, token, chatbot, landing_project_id);
    winston.debug("imported: ", import_result);
  } catch(err) {
    winston.error("Error importing intents on new chatbot: ", err);
    return res.status(500).send({ success: false, message: "Error importing intents in the chatbot"});
  }

  if (import_result?.success == false) {
    return res.status(500).send({ success: false, message: "Unable to import intents in the new chatbot" });
  }

  return res.status(200).send({ message: "Chatbot forked successfully", bot_id: savedChatbot._id });

})

router.post('/importjson/:id_faq_kb', roleChecker.hasRole('admin'), upload.single('uploadFile'), async (req, res) => {

  let chatbot_id = req.params.id_faq_kb;
  let id_project = req.projectid;

  winston.debug('import on id_faq_kb: ' + chatbot_id);

  winston.debug('import with option create: ' + req.query.create);
  winston.debug('import with option replace: ' + req.query.replace);
  winston.debug('import with option overwrite: ' + req.query.overwrite);

  let json_string;
  let json;
  if (req.file) {
    json_string = req.file.buffer.toString('utf-8');
    json = JSON.parse(json_string);
  } else {
    json = req.body;
  }

  winston.debug("json source " + json_string)

  // ****************************
  // **** CREATE TRUE option ****
  // ****************************
  if (req.query.create === 'true') {
    // if (json.subtype && (json.subtype === 'webhook' || json.subtype === 'copilot')) {
    //   json.template = 'empty';
    // }
    json.template = 'empty';
    let savedChatbot = await faqService.create(req.projectid, req.user.id, json)
      .catch((err) => {
        winston.error("Error creating new chatbot")
        return res.status(400).send({ succes: false, message: "Error creatings new chatbot", error: err })
      })

    // Edit attributes.rules
    let attributes = json.attributes;
    if (attributes &&
      attributes.rules &&
      attributes.rules.length > 0) {

      await attributes.rules.forEach((rule) => {
        if (rule.do &&
          rule.do[0] &&
          rule.do[0].message &&
          rule.do[0].message.participants &&
          rule.do[0].message.participants[0]) {
          rule.do[0].message.participants[0] = "bot_" + savedChatbot._id
          winston.debug("attributes rule new participant: ", rule.do[0].message.participants[0])
        }
      })
    }

    let chatbot_edited = { attributes: attributes };

    let updatedChatbot = await Faq_kb.findByIdAndUpdate(savedChatbot._id, chatbot_edited, { new: true }).catch((err) => {
      winston.error("Error updating chatbot attributes: ", err);
      winston.debug("Skip Error updating chatbot attributes: ", err);
      // return res.status(400).send({ success: false, message: "Error updating chatbot attributes", error: err })
    })

    botEvent.emit('faqbot.create', savedChatbot);

    if (json.intents) {

      json.intents.forEach(async (intent) => {

        let new_faq = {
          id_faq_kb: savedChatbot._id,
          id_project: req.projectid,
          createdBy: req.user.id,
          intent_display_name: intent.intent_display_name,
          intent_id: intent.intent_id,
          question: intent.question,
          answer: intent.answer,
          reply: intent.reply,
          form: intent.form,
          enabled: intent.enabled,
          webhook_enabled: intent.webhook_enabled,
          language: intent.language,
          actions: intent.actions,
          attributes: intent.attributes
        }

        let faq = await Faq.create(new_faq).catch((err) => {
          if (err.code == 11000) { // should never happen
            winston.error("Duplicate intent_display_name.");
            winston.debug("Skip duplicated intent_display_name"); // Don't stop the flow
          } else {
            winston.error("Error saving new faq: ", err)
          }
        })

        if (faq) {
          winston.debug("new intent created")
          faqBotEvent.emit('faq.create', faq);
        }
      })
    }

    if (updatedChatbot) {
      return res.status(200).send(updatedChatbot)
    } else {
      return res.status(200).send(savedChatbot)
    }
  }
  // *****************************
  // **** CREATE FALSE option ****
  // *****************************
  else {

    if (!chatbot_id) {
      return res.status(400).send({ success: false, message: "With replace or overwrite option a id_faq_kb must be provided" })
    }

    let chatbot = await Faq_kb.findOne({ _id: chatbot_id, id_project: id_project }).catch((err) => {
      winston.error("Error finding chatbot with id " + chatbot_id);
      return res.status(404).send({ success: false, message: "Error finding chatbot with id " + chatbot_id, error: err });
    })

    if (!chatbot) {
      winston.error("Chatbot not found with id " + chatbot_id + " for project " + id_project);
      return res.status(404).send({ success: false, message: "Chatbot not found with id " + chatbot_id + " for project " + id_project });
    }

    if (json.webhook_enabled) {
      chatbot.webhook_enabled = json.webhook_enabled;
    }
    if (json.webhook_url) {
      chatbot.webhook_url = json.webhook_url;
    }
    if (json.language) {
      chatbot.language = json.language;
    }
    if (json.name) {
      chatbot.name = json.name;
    }
    if (json.description) {
      chatbot.description = json.description;
    }

    if (json.attributes) {
      let attributes = json.attributes;
      if (attributes.rules &&
        attributes.rules.length > 0) {
        await attributes.rules.forEach((rule) => {
          if (rule.do &&
            rule.do[0] &&
            rule.do[0].message &&
            rule.do[0].message.participants &&
            rule.do[0].message.participants[0]) {
            rule.do[0].message.participants[0] = "bot_" + chatbot._id
            winston.debug("attributes rule new participant: " + rule.do[0].message.participants[0])
          }
        })
        chatbot.attributes = json.attributes;
      }
    }

    let updatedChatbot = await Faq_kb.findByIdAndUpdate(chatbot._id, chatbot, { new: true }).catch((err) => {
      winston.error("Error updating chatbot");
      return res.status(400).send({ success: false, message: "Error updating chatbot", error: err })
    })

    botEvent.emit('faqbot.update', updatedChatbot);

    // *****************************
    // **** REPLACE TRUE option ****
    // *****************************
    if (req.query.replace === 'true') {
      let result = await Faq.deleteMany({ id_faq_kb: chatbot._id }).catch((err) => {
        winston.error("Unable to delete all existing faqs with id_faq_kb " + chatbot._id);
      })

      winston.verbose("All faq for chatbot " + chatbot._id + " deleted successfully")
      winston.debug("DeleteMany faqs result ", result);
    }

    if (json.intents) {
      await json.intents.forEach(async (intent) => {

        let new_faq = {
          id_faq_kb: updatedChatbot._id,
          id_project: req.projectid,
          createdBy: req.user.id,
          intent_display_name: intent.intent_display_name,
          intent_id: intent.intent_id,
          question: intent.question,
          answer: intent.answer,
          reply: intent.reply,
          form: intent.form,
          enabled: intent.enabled,
          webhook_enabled: intent.webhook_enabled,
          language: intent.language,
          actions: intent.actions,
          attributes: intent.attributes
        }

        // *******************************
        // **** OVERWRITE TRUE option ****
        // *******************************
        if (req.query.overwrite == "true") {

          let savingResult = await Faq.findOneAndUpdate({ id_faq_kb: chatbot._id, intent_display_name: intent.intent_display_name }, new_faq, { new: true, upsert: true, rawResult: true }).catch((err) => {
            winston.error("Unable to create faq: ", err);
          })

          if (savingResult) {
            if (savingResult.lastErrorObject.updatedExisting === true) {
              winston.verbose("updated existing intent")
              faqBotEvent.emit('faq.update', savingResult.value);
            } else {
              winston.verbose("new intent created")
              faqBotEvent.emit('faq.create', savingResult.value);
            }
          }

          // ********************************
          // **** OVERWRITE FALSE option ****
          // ********************************
        } else {

          let faq = await Faq.create(new_faq).catch((err) => {
            if (err.code == 11000) {
              winston.error("Duplicate intent_display_name.");
              winston.verbose("Skip duplicated intent_display_name");
            } else {
              winston.error("Error creating new intent: ", err);
            }
          })

          if (faq) {
            winston.debug("new intent created: ", faq)
            faqBotEvent.emit('faq.create', faq);
          }
        }
      })
    }

    if (updatedChatbot) {
      return res.send(updatedChatbot);
    } else {
      return res.send(chatbot);
    }
  }
})

router.get('/exportjson/:id_faq_kb', roleChecker.hasRole('admin'), (req, res) => {

  winston.debug("exporting bot...")

  const chatbot_id = req.params.id_faq_kb;
  const id_project = req.projectid;

  Faq_kb.findOne({ _id: chatbot_id }, (err, faq_kb) => {
    if (err) {
      winston.error('GET FAQ-KB ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error getting bot.' });
    }
    
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: "Chatbot not found with id " + chatbot_id });
    }

    const isPublic = faq_kb.public === true;
    const isOwner = faq_kb.id_project === id_project;

    if (!isPublic && !isOwner) {
      return res.status(403).send({
        success: false,
        msg: "Chatbot not found with id " + chatbot_id + " for project " + id_project
      });
    }

    winston.debug('FAQ-KB: ', faq_kb)

    faqService.getAll(chatbot_id).then((faqs) => {

      // delete from exclude map intent_id
      const intents = faqs.map(({ _id, id_project, topic, status, chatbot_id, createdBy, createdAt, updatedAt, __v, ...keepAttrs }) => keepAttrs)

      if (!req.query.globals) {
        winston.verbose("Delete globals from attributes!")
        if (faq_kb.attributes) {
          delete faq_kb.attributes.globals;
        }
      }

      let json = {
        webhook_enabled: faq_kb.webhook_enabled,
        webhook_url: faq_kb.webhook_url,
        language: faq_kb.language,
        name: faq_kb.name,
        slug: faq_kb.slug,
        type: faq_kb.type,
        subtype: faq_kb.subtype,
        description: faq_kb.description,
        attributes: faq_kb.attributes,
        intents: intents
      }

      if (req.query.intentsOnly == 'true') {
        let intents_obj = {
          intents: intents
        }
        let intents_string = JSON.stringify(intents_obj);
        res.set({ "Content-Disposition": "attachment; filename=\"intents.json\"" });
        return res.send(intents_string);

      } else {

        // if (req.query.file == "false") {
        //   return res.status(200).send(json);
        // }
        let json_string = JSON.stringify(json);
        res.set({ "Content-Disposition": "attachment; filename=\"bot.json\"" });
        return res.send(json_string);
      }

    }).catch((err) => {
      winston.error('GET FAQ ERROR: ', err)
      return res.status(500).send({ success: false, msg: 'Error getting faqs.' });
    })
  })
})

router.post('/:faq_kbid/training', roleChecker.hasRole('admin'), function (req, res) {

  winston.debug(req.body);
  winston.info(req.params.faq_kbid + "/training called");

  var update = {};
  update.trained = true;
  // update._id = req.params.faq_kbid;

  winston.debug("update", update);
  // "$set": req.params.faq_kbid

  Faq_kb.findByIdAndUpdate(req.params.faq_kbid, update, { new: true, upsert: true }, function (err, updatedFaq_kb) {   //TODO add cache_bot_here
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    botEvent.emit('faqbot.update', updatedFaq_kb);
    res.json(updatedFaq_kb);
  });
});

module.exports = router;
