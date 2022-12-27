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
var upload = multer()
var configGlobal = require('../config/global');

var chatbot_templates_api_url = "https://chatbot-templates.herokuapp.com/chatbots/public/templates"

router.post('/', function (req, res) {
  winston.info('create BOT ', req.body);
  //create(name, url, projectid, user_id, type, description, webhook_url, webhook_enabled, language, template)
  faqService.create(req.body.name, req.body.url, req.projectid, req.user.id, req.body.type, req.body.description, undefined, undefined, req.body.language, req.body.template, req.body.mainCategory, req.body.intentsEngine).then(function (savedFaq_kb) {
    res.json(savedFaq_kb);
  });

});


router.post('/train', function (req, res) {

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
            // return res.json(trainHttp);
          } else {
            return res.status(400).send({ success: false, msg: 'no faq to  train on external bot.' });
          }
        });
    } else {
      winston.debug('external query: ');
      return res.status(400).send({ success: false, msg: 'you can train a standard internal bot or an external bot.' });
    }

  });

  /*
{
  "language":"it",
  "nlu":[
     {
        "intent":"eta",
        "examples":[
           "quanti anni hai",
           "dimmi la tua età",
           "quanto sei grande",
           "parlami della tua età"
        ]
     },
     {
        "intent":"brutteparole",
        "examples":[
           "non dire parolacce",
           "le brutte parole non dovrebbero dirsi"
        ]
     }
  ]
}
*/

});


router.post('/askbot', function (req, res) {

  winston.debug('ASK BOT ', req.body);

  Faq_kb.findById(req.body.id_faq_kb).exec(function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());
    winston.debug('faq_kb.type :' + faq_kb.type);
    if (faq_kb.type == "internal" || faq_kb.type == "tilebot") {





      var query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb, "question": req.body.question };

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



router.put('/:faq_kbid', function (req, res) {

  winston.debug(req.body);

  var update = {};
  if (req.body.name != undefined) {
    update.name = req.body.name;
  }
  if (req.body.description != undefined) {
    update.description = req.body.description;
  }
  if (req.body.url != undefined) {
    update.url = req.body.url;
  }
  if (req.body.webhook_url != undefined) {
    update.webhook_url = req.body.webhook_url;
  }
  if (req.body.webhook_enabled != undefined) {
    update.webhook_enabled = req.body.webhook_enabled;
  }
  if (req.body.type != undefined) {
    update.type = req.body.type;
  }
  if (req.body.trashed != undefined) {
    update.trashed = req.body.trashed;
  }
  if (req.body.public != undefined) {
    update.public = req.body.public;
  }
  if (req.body.certified != undefined) {
    update.certified = req.body.certified;
  }
  if (req.body.mainCategory != undefined) {
    update.mainCategory = req.body.mainCategory;
  }
  if (req.body.intentsEngine != undefined) {
    update.intentsEngine = req.body.intentsEngine;
  }

  Faq_kb.findByIdAndUpdate(req.params.faq_kbid, update, { new: true, upsert: true }, function (err, updatedFaq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    botEvent.emit('faqbot.update', updatedFaq_kb);
    res.json(updatedFaq_kb);
  });
});


router.delete('/:faq_kbid', function (req, res) {

  winston.debug(req.body);

  Faq_kb.remove({ _id: req.params.faq_kbid }, function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    botEvent.emit('faqbot.delete', faq_kb);
    res.json(faq_kb);
  });
});


router.get('/:faq_kbid', function (req, res) {

  winston.debug(req.query);

  Faq_kb.findById(req.params.faq_kbid, function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
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


// NEW - GET ALL FAQKB WITH THE PASSED PROJECT ID
router.get('/', function (req, res) {

  winston.debug("req.query", req.query);


  winston.debug("GET FAQ-KB req projectid", req.projectid);
  /**
   * if filter only for 'trashed = false', 
   * the bots created before the implementation of the 'trashed' property are not returned 
   */
  var query = { "id_project": req.projectid, "trashed": { $in: [null, false] } };

  if (req.query.all != "true") {
    query.type = { $ne: "identity" }
  }

  winston.debug("query", query);

  Faq_kb.find(query, function (err, faq_kb) {
    if (err) {
      winston.error('GET FAQ-KB ERROR ', err)
      return (err);
    }

    res.json(faq_kb);

  });

});

router.post('/fork/:id_faq_kb', async (req, res) => {

  let id_faq_kb = req.params.id_faq_kb;
  winston.info('id_faq_kb: ' + id_faq_kb);

  const api_url = process.env.API_URL || configGlobal.apiUrl;
  winston.info("fork --> base_url: " + api_url); // check if correct

  let current_project_id = req.projectid;
  winston.info("current project id: " + current_project_id);

  let landing_project_id = req.query.projectid;
  winston.info("landing project id " + landing_project_id)

  let public = req.query.public;
  winston.info("public " + public);

  let token = req.headers.authorization;

  let cs = req.app.get('chatbot_service')

  let chatbot = await cs.getBotById(id_faq_kb, public, api_url, chatbot_templates_api_url, token, current_project_id);
  winston.debug("chatbot: ", chatbot)

  if (!chatbot) {
    return res.status(500).send({ success: false, message: "Unable to get chatbot" });
  }

  let savedChatbot = await cs.createBot(api_url, token, chatbot, landing_project_id);
  winston.info("savedChatbot: ", savedChatbot)

  if (!savedChatbot) {
    return res.status(500).send({ success: false, message: "Unable to create new chatbot" });
  }

  let import_result = await cs.importFaqs(api_url, savedChatbot._id, token, chatbot, landing_project_id);
  winston.info("imported: ", import_result);

  if (import_result.success == "false") {
    return res.status(500).send({ success: false, message: "Unable to import intents in the new chatbot" });
  }

  return res.status(200).send({ message: "Chatbot forked successfully", bot_id: savedChatbot._id });

})


router.post('/importjson/:id_faq_kb', upload.single('uploadFile'), (req, res) => {

  let id_faq_kb = req.params.id_faq_kb;
  winston.info('import on id_faq_kb: ', id_faq_kb);

  let json_string;
  let json;
  if (req.file) {
    json_string = req.file.buffer.toString('utf-8');
    json = JSON.parse(json_string);
  } else {
    json = req.body;
  }

  winston.info("json source " + json_string)

  if (req.query.intentsOnly && req.query.intentsOnly == "true") {

    winston.info("intents only")

    json.intents.forEach((intent) => {

      let new_faq = {
        id_faq_kb: id_faq_kb,
        id_project: req.projectid,
        createdBy: req.user.id,
        intent_display_name: intent.intent_display_name,
        question: intent.question,
        answer: intent.answer,
        reply: intent.reply,
        form: intent.form,
        enabled: intent.enabled,
        webhook_enabled: intent.webhook_enabled,
        language: intent.language
      }

      // overwrite duplicated intents
      if (req.query.overwrite == "true") {
        Faq.findOneAndUpdate({ id_faq_kb: id_faq_kb, intent_display_name: intent.intent_display_name }, new_faq, { new: true, upsert: true, rawResult: true }, (err, savingResult) => {
          if (err) {
            winston.error("findOneAndUpdate (upsert) FAQ ERROR ", err);
          } else {
            if (savingResult.lastErrorObject.updatedExisting == true) {
              winston.info("updated existing intent")
              faqBotEvent.emit('faq.update', savingResult.value);
            } else {
              winston.info("new intent crated")
              faqBotEvent.emit('faq.create', savingResult.value);
            }
          }
        })

      // don't overwrite duplicated intents
      } else {
        Faq.create(new_faq, (err, savedFaq) => {
          if (err) {
            winston.debug("create new FAQ ERROR ", err);
            if (err.code == 11000) {
              winston.error("Duplicate intent_display_name.");
              winston.info("Skip duplicated intent_display_name");
            } else {
              winston.info("new intent crated")
              faqBotEvent.emit('faq.create', savedFaq);
            }
          }
        })
      }

    })

    return res.status(200).send({ success: true, msg: "Intents imported successfully" })

  } else {

    if (req.query.create && req.query.create == 'true') {
      faqService.create(json.name, undefined, req.projectid, req.user.id, "tilebot", json.description, json.webhook_url, json.webhook_enabled, json.language, undefined, undefined, undefined).then((savedFaq_kb) => {
        winston.debug("saved (and imported) faq kb: ", savedFaq_kb);
        botEvent.emit('faqbot.create', savedFaq_kb);

        json.intents.forEach((intent) => {
  
          let new_faq = {
            id_faq_kb: savedFaq_kb._id,
            id_project: req.projectid,
            createdBy: req.user.id,
            intent_display_name: intent.intent_display_name,
            question: intent.question,
            answer: intent.answer,
            reply: intent.reply,
            form: intent.form,
            enabled: intent.enabled,
            webhook_enabled: intent.webhook_enabled,
            language: intent.language
          }

          // TO DELETE: no used when req.query.create = 'true'
          if (req.query.overwrite == "true") {
            Faq.findOneAndUpdate({ id_faq_kb: id_faq_kb, intent_display_name: intent.intent_display_name }, new_faq, { new: true, upsert: true, rawResult: true }, (err, savingResult) => {
              if (err) {
                winston.error("findOneAndUpdate (upsert) FAQ ERROR ", err);
              } else {

                if (savingResult.lastErrorObject.updatedExisting == true) {
                  winston.info("updated existing intent")
                  faqBotEvent.emit('faq.update', savingResult.value);
                } else {
                  winston.info("new intent crated")
                  faqBotEvent.emit('faq.create', savingResult.value);
                }

              }

            })

          // don't overwrite duplicated intents
          } else {
            Faq.create(new_faq, (err, savedFaq) => {
              if (err) {
                winston.debug("create new FAQ ERROR ", err);
                if (err.code == 11000) {
                  winston.error("Duplicate intent_display_name.");
                  winston.info("Skip duplicated intent_display_name");
                } else {
                  winston.info("new intent crated")
                  faqBotEvent.emit('faq.create', savedFaq);
                }
              }
            })
          }

        })
        return res.status(200).send(savedFaq_kb);

      }).catch((err) => {
        console.error("error saving faq_kb: ", err);
        return res.status(500).send(err);
      })

    } else {

      Faq_kb.findById(id_faq_kb, (err, faq_kb) => {
        if (err) {
          winston.error("GET FAQ-KB ERROR", err);
          return res.status(500).send({ success: false, msg: "Error getting bot." });
        }
        if (!faq_kb) {
          return res.status(404).send({ success: false, msg: 'Bot not found.' });
        }
  
        // should be wrong
        //const json = JSON.parse(json_string);
  
        if (json.webhook_enabled) {
          faq_kb.webhook_enabled = json.webhook_enabled;
        }
        if (json.webhook_url) {
          faq_kb.webhook_url = json.webhook_url;
        }
        if (json.language) {
          faq_kb.language = json.language;
        }
        if (json.name) {
          faq_kb.name = json.name;
        }
        if (json.description) {
          faq_kb.description = json.description;
        }
  
        Faq_kb.findByIdAndUpdate(id_faq_kb, faq_kb, { new: true }, (err, updatedFaq_kb) => {
          if (err) {
            return res.status(500).send({ success: false, msg: "Error updating bot." });
          }
  
          botEvent.emit('faqbot.update', updatedFaq_kb);
  
          json.intents.forEach((intent) => {
  
            let new_faq = {
              id_faq_kb: updatedFaq_kb._id,
              id_project: req.projectid,
              createdBy: req.user.id,
              intent_display_name: intent.intent_display_name,
              question: intent.question,
              answer: intent.answer,
              reply: intent.reply,
              form: intent.form,
              enabled: intent.enabled,
              webhook_enabled: intent.webhook_enabled,
              language: intent.language
            }
  
            // overwrite duplicated intents
            if (req.query.overwrite == "true") {
              Faq.findOneAndUpdate({ id_faq_kb: id_faq_kb, intent_display_name: intent.intent_display_name }, new_faq, { new: true, upsert: true, rawResult: true }, (err, savingResult) => {
                if (err) {
                  winston.error("findOneAndUpdate (upsert) FAQ ERROR ", err);
                } else {
  
                  if (savingResult.lastErrorObject.updatedExisting == true) {
                    winston.info("updated existing intent")
                    faqBotEvent.emit('faq.update', savingResult.value);
                  } else {
                    winston.info("new intent crated")
                    faqBotEvent.emit('faq.create', savingResult.value);
                  }
  
                }
  
              })
  
              // don't overwrite duplicated intents
            } else {
              Faq.create(new_faq, (err, savedFaq) => {
                if (err) {
                  winston.debug("create new FAQ ERROR ", err);
                  if (err.code == 11000) {
                    winston.error("Duplicate intent_display_name.");
                    winston.info("Skip duplicated intent_display_name");
                  } else {
                    winston.info("new intent crated")
                    faqBotEvent.emit('faq.create', savedFaq);
                  }
                }
              })
            }
  
          })
  
          return res.send(updatedFaq_kb);
  
        })
  
      })
    }

  }

})

router.get('/exportjson/:id_faq_kb', (req, res) => {

  winston.info("exporting bot...")


  let id_faq_kb = req.params.id_faq_kb;

  Faq_kb.findById(id_faq_kb, (err, faq_kb) => {
    if (err) {
      winston.error('GET FAQ-KB ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error getting bot.' });
    } else {
      winston.debug('FAQ-KB: ', faq_kb)


      faqService.getAll(id_faq_kb).then((faqs) => {

        const intents = faqs.map(({ _id, id_project, topic, status, id_faq_kb, createdBy, intent_id, createdAt, updatedAt, __v, ...keepAttrs }) => keepAttrs)

        let json = {
          webhook_enabled: faq_kb.webhook_enabled,
          webhook_url: faq_kb.webhook_url,
          language: faq_kb.language,
          name: faq_kb.name,
          description: faq_kb.description,
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
    }
  })

})


module.exports = router;
