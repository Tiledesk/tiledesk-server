var express = require('express');
var router = express.Router();
var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var multer = require('multer')
var upload = multer()
const faqBotEvent = require('../event/faqBotEvent');
var winston = require('../config/winston');
const faqEvent = require('../event/faqBotEvent')

var parsecsv = require("fast-csv");
const botEvent = require('../event/botEvent');
const uuidv4 = require('uuid/v4');
csv = require('csv-express');
csv.separator = ';';
const axios = require("axios").default;
var configGlobal = require('../config/global');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;

// POST CSV FILE UPLOAD FROM CLIENT
router.post('/uploadcsv', upload.single('uploadFile'), function (req, res, next) {
  winston.debug(' -> -> REQ BODY ', req.body);
  winston.debug(' -> ID FAQ-KB  ', req.body.id_faq_kb);
  winston.debug(' -> DELIMITER ', req.body.delimiter);
  winston.debug(' -> FILE ', req.file);

  var id_faq_kb = req.body.id_faq_kb;
  winston.debug('id_faq_kb: ' + id_faq_kb);

  var delimiter = req.body.delimiter || ";";
  winston.debug('delimiter: ' + delimiter);

  var csv = req.file.buffer.toString('utf8');
  winston.debug("--> csv: ", csv)
  // winston.debug(' -> CSV STRING ', csv);

  // res.json({ success: true, msg: 'Importing CSV...' });

  // PARSE CSV



  Faq_kb.findById(id_faq_kb).exec(function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());

    // getFaqKbKeyById(req.body.id_faq_kb, function (remote_faqkb_key) {

    parsecsv.parseString(csv, { headers: false, delimiter: delimiter })
      .on("data", function (data) {
        winston.debug('PARSED CSV ', data);

        winston.debug('--> PARSED CSV ', data);

        var question = data[0]
        //var answer = data[1]
        var intent_id = data[2];
        var intent_display_name = data[3];
        var webhook_enabled = data[4];


        var actions = [
          {
            _tdActionType: "reply",
            _tdActionId: uuidv4(),
            text: data[1],
            attributes: {
              commands: [
                {
                  type: "wait",
                  time: 500
                },
                {
                  type: "message",
                  message: {
                    type: "text",
                    text: data[1]
                  }
                }
              ]
            }

          }
        ]

        var webhook_enabled_boolean = false;
        if (webhook_enabled) {
          webhook_enabled_boolean = (webhook_enabled == 'true');
        }
        // var row = {question: element.question, answer: element.answer, 
        //   intent_id: element.intent_id, intent_display_name: element.intent_display_name,
        //   webhook_enabled: element.webhook_enabled || false }

        var newFaq = new Faq({
          id_faq_kb: id_faq_kb,
          question: question,
          //answer: answer,
          actions: actions,
          intent_id: intent_id,
          intent_display_name: intent_display_name,
          webhook_enabled: webhook_enabled_boolean,
          language: faq_kb.language,
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id
        });

        winston.debug("--> newFaq: ", JSON.stringify(newFaq, null, 2));

        newFaq.save(function (err, savedFaq) {
          if (err) {
            winston.error('--- > ERROR uploadcsv', err)

            // return res.status(500).send({ success: false, msg: 'Error saving object.' }); // ADDED 24 APR
          } else {
            faqBotEvent.emit('faq.create', savedFaq);
          }

        });
      })
      .on("end", function () {
        winston.debug("PARSE DONE");
        //faqBotEvent.emit('faq_train.create', id_faq_kb)
        res.json({ success: true, msg: 'CSV Parsed' });
      })
      .on("error", function (err) {
        winston.error("PARSE ERROR uploadcsv", err);
        res.json({ success: false, msg: 'Parsing error' });
      });
  });
});


router.post('/', function (req, res) {

  winston.debug(req.body);

  Faq_kb.findById(req.body.id_faq_kb).exec(function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());

    var newFaq = new Faq({
      _id: req.body._id,
      id_faq_kb: req.body.id_faq_kb,
      question: req.body.question,
      answer: req.body.answer,
      reply: req.body.reply,
      form: req.body.form,
      enabled: true,
      id_project: req.projectid,
      topic: req.body.topic,
      language: faq_kb.language,
      webhook_enabled: req.body.webhook_enabled,
      intent_display_name: req.body.intent_display_name,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    if (req.body.enabled != undefined) {
      newFaq.enabled = req.body.enabled;
    }
    if (req.body.actions) {
      newFaq.actions = req.body.actions
    }
    if (req.body.attributes) {
      newFaq.attributes = req.body.attributes
    }
    if (req.body.intent_id) {
      newFaq.intent_id = req.body.intent_id;
    }

    newFaq.save(function (err, savedFaq) {
      if (err) {
        if (err.code == 11000) {
          return res.status(409).send({ success: false, msg: 'Duplicate  intent_display_name.' });
        } else {
          winston.debug('--- > ERROR ', err)
          return res.status(500).send({ success: false, msg: 'Error saving object.' });
        }
      }
      winston.debug('1. ID OF THE NEW FAQ CREATED ', savedFaq._id)
      winston.debug('1. QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
      winston.debug('1. ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)
      winston.debug('1. ID FAQKB GET IN THE OBJECT OF NEW FAQ CREATED ', savedFaq.id_faq_kb);

      faqBotEvent.emit('faq.create', savedFaq);
      //faqBotEvent.emit('faq_train.create', req.body.id_faq_kb)

      res.json(savedFaq);


    });
  });
});

router.post('/ops_update', async (req, res) => {

  let id_faq_kb = req.body.id_faq_kb;
  let operations = req.body.operations;

  for (let op of operations) {
    let HTTPREQUEST;
    let id;

    // method post
    switch (op.type) {
      case 'post':
        HTTPREQUEST = {
          url: apiUrl + '/' + req.projectid + '/faq/',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          json: op.intent,
          method: 'post'
        }
        winston.debug("operation HTTPREQUEST: ", HTTPREQUEST);
        myrequest(
          HTTPREQUEST, async (err, resbody) => {
            if (err) {
              winston.error("err performing operation: ", err);
            } else {
              winston.debug("\n\nresbody operation: ", resbody);
            }
          }
        )
        break;

      // method put
      case 'put':
        id = op.intent._id;
        if (op.intent.intent_id) {
          id = "intentId" + op.intent.intent_id;
        }
        HTTPREQUEST = {
          url: apiUrl + '/' + req.projectid + '/faq/' + id,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          json: op.intent,
          method: 'put'
        }
        winston.debug("operation HTTPREQUEST: ", HTTPREQUEST);
        myrequest(
          HTTPREQUEST, async (err, resbody) => {
            if (err) {
              winston.error("err performing operation: ", err);
            } else {
              winston.debug("\n\nresbody operation: ", resbody);
            }
          }
        )
        break;

      // method patch
      case 'patch':
        HTTPREQUEST = {
          url: apiUrl + '/' + req.projectid + '/faq/' + op.intent._id + '/attributes',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          json: op.intent.attributes,
          method: 'patch'
        }
        winston.debug("operation HTTPREQUEST: ", HTTPREQUEST);
        myrequest(
          HTTPREQUEST, async (err, resbody) => {
            if (err) {
              winston.error("err performing operation: ", err);
            } else {
              winston.debug("\n\nresbody operation: ", resbody);
            }
          }
        )
        break;

      // method delete
      case 'delete':
        id = op.intent._id;
        if (op.intent.intent_id) {
          id = "intentId" + op.intent.intent_id;
        }
        HTTPREQUEST = {
          url: apiUrl + '/' + req.projectid + '/faq/' + id + '?id_faq_kb=' + id_faq_kb,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          method: 'delete'
        }
        winston.debug("operation HTTPREQUEST: ", HTTPREQUEST);
        myrequest(
          HTTPREQUEST, async (err, resbody) => {
            if (err) {
              winston.error("err performing operation: ", err);
            } else {
              winston.debug("\n\nresbody operation: ", resbody);
            }
          }
        )
        break;
    }
  }

  res.status(200).send({ success: true });


})

router.patch('/:faqid/attributes', function (req, res) {
  let data = req.body;
  winston.debug("data: ", data);

  // aggiugnere controllo su intent_id qui

  Faq.findById(req.params.faqid, function (err, updatedFaq) {
    if (err) {
      winston.error('Find Faq by id ERROR: ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    if (!updatedFaq) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    if (!updatedFaq.attributes) {
      winston.debug("empty attributes");
      winston.debug("empty attributes");
      updatedFaq.attributes = {};
    }

    winston.debug("updatedFaq attributes", updatedFaq.attributes);

    Object.keys(data).forEach(function (key) {
      var val = data[key];
      winston.debug("data attributes" + key + " " + val);
      updatedFaq.attributes[key] = val;
    })

    winston.debug("updatedFaq: ", updatedFaq);
    winston.debug("updatedFaq attributes: ", updatedFaq.attributes);

    winston.debug("updatedBot attributes", updatedFaq.attributes)

    updatedFaq.markModified('attributes');

    //cache invalidation
    updatedFaq.save(function (err, savedFaq) {
      if (err) {
        winston.error("saving faq attributes ERROR: ", err);
        return res.status(500).send({ success: false, msg: 'Error saving object.' });
      }

      winston.debug("saved faq attributes", savedFaq.toObject());

      winston.verbose("saved faq attributes", savedFaq.toObject());
      faqBotEvent.emit('faq.update', savedFaq);
      res.json(savedFaq);
    })
  })
})

router.put('/:faqid', function (req, res) {

  winston.debug('UPDATE FAQ ', req.body);
  let faqid = req.params.faqid;

  if (!req.body.id_faq_kb) {
    return res.status(422).send({ err: "Missing id_faq_kb in Request Body" })
  }
  let id_faq_kb = req.body.id_faq_kb;

  var update = {};

  if (req.body.intent != undefined) {
    update.intent = req.body.intent;
  }
  if (req.body.question != undefined) {
    update.question = req.body.question;
  }
  if (req.body.answer != undefined) {
    update.answer = req.body.answer;
  }
  if (req.body.topic != undefined) {
    update.topic = req.body.topic;
  }
  if (req.body.status != undefined) {
    update.status = req.body.status;
  }
  if (req.body.language != undefined) {
    update.language = req.body.language;
  }
  if (req.body.intent_display_name != undefined) {
    update.intent_display_name = req.body.intent_display_name;
  }
  if (req.body.webhook_enabled != undefined) {
    update.webhook_enabled = req.body.webhook_enabled;
  }
  if (req.body.enabled != undefined) {
    update.enabled = req.body.enabled;
  }
  if (req.body.reply != undefined) {
    update.reply = req.body.reply;
  }
  if (req.body.form != undefined) {
    update.form = req.body.form;
  }
  if (req.body.actions != undefined) {
    update.actions = req.body.actions;
  }
  if (req.body.attributes != undefined) {
    update.attributes = req.body.attributes;
  }

  if (faqid.startsWith("intentId")) {
    let intent_id = faqid.substring(8);
    //Faq.findOneAndUpdate({ id_faq_kb: id_faq_kb, intent_id: intent_id }, update, { new: true, upsert: true }, (err, updatedFaq) => {
    Faq.findOneAndUpdate({ id_faq_kb: id_faq_kb, intent_id: intent_id }, update, { new: true }, (err, updatedFaq) => {
      if (err) {
        if (err.code == 11000) {
          return res.status(409).send({ success: false, msg: 'Duplicate  intent_display_name.' });
        } else {
          return res.status(500).send({ success: false, msg: 'Error updating object.' });
        }
      }

      faqBotEvent.emit('faq.update', updatedFaq);
      //faqBotEvent.emit('faq_train.update', updatedFaq.id_faq_kb);

      res.status(200).send(updatedFaq);
    })

  } else {

    Faq.findByIdAndUpdate(req.params.faqid, update, { new: true, upsert: true }, function (err, updatedFaq) {
      if (err) {
        if (err.code == 11000) {
          return res.status(409).send({ success: false, msg: 'Duplicate  intent_display_name.' });
        } else {
          return res.status(500).send({ success: false, msg: 'Error updating object.' });
        }
      }

      faqBotEvent.emit('faq.update', updatedFaq);
      //faqBotEvent.emit('faq_train.update', updatedFaq.id_faq_kb);

      res.status(200).send(updatedFaq);
      // updateRemoteFaq(updatedFaq)
    });
  }

});


// DELETE REMOTE AND LOCAL FAQ
router.delete('/:faqid', function (req, res) {

  winston.debug('DELETE FAQ - FAQ ID ', req.params.faqid);

  let faqid = req.params.faqid;
  let id_faq_kb;
  if (req.query && req.query.id_faq_kb) {
    id_faq_kb = req.query.id_faq_kb;
  }

  if (faqid.startsWith("intentId")) {
    let intent_id = faqid.substring(8);
    if (!id_faq_kb) {
      return res.status(500).send({ success: false, msg: "Unable to delete object. Query param 'id_faq_kb' is mandatory if you want to delete via intent_id" })
    }

    Faq.findOneAndDelete({ intent_id: intent_id, id_faq_kb: id_faq_kb }, (err, faq) => {
      if (err) {
        return res.status(500).send({ success: false, msg: "Error deleting object." });
      }

      if (!faq) {
        return res.status(404).send({ success: false, msg: "Error deleting object. The object does not exists." })
      }

      winston.debug('Deleted FAQ ', faq);

      faqBotEvent.emit('faq.delete', faq);
      //faqBotEvent.emit('faq_train.delete', faq.id_faq_kb);

      res.status(200).send(faq);

    })

  } else {
    Faq.findByIdAndRemove({ _id: req.params.faqid }, function (err, faq) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error deleting object.' });
      }
      winston.debug('Deleted FAQ ', faq);

      faqBotEvent.emit('faq.delete', faq);
      //faqBotEvent.emit('faq_train.delete', faq.id_faq_kb);

      res.status(200).send(faq);

    });
  }
});

// EXPORT FAQ TO CSV
router.get('/csv', function (req, res) {
  var query = {};

  winston.debug('req.query', req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  winston.debug('EXPORT FAQS TO CSV QUERY', query);

  Faq.find(query, 'question answer intent_id intent_display_name webhook_enabled -_id').lean().exec(function (err, faqs) {
    if (err) {
      winston.debug('EXPORT FAQS TO CSV ERR', err)
      return (err)
    };
    var csv = [];
    faqs.forEach(function (element) {
      var row = {
        question: element.question, answer: element.answer,
        intent_id: element.intent_id, intent_display_name: element.intent_display_name,
        webhook_enabled: element.webhook_enabled || false
      }
      csv.push(row);
    });
    winston.debug('EXPORT FAQ TO CSV FAQS', csv)
    res.csv(csv, true)
    // res.json(faq);
  });

});


router.get('/:faqid', function (req, res) {

  winston.debug(req.body);

  Faq.findById(req.params.faqid, function (err, faq) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(faq);
  });
});



router.get('/', function (req, res, next) {
  var query = {};

  winston.debug("GET ALL FAQ OF THE BOT ID (req.query): ", req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  var limit = 3000; // Number of request per page

  if (req.query.limit) {
    limit = parseInt(req.query.limit);
    winston.debug('faq ROUTE - limit: ' + limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('faq ROUTE - SKIP PAGE ', skip);



  if (req.query.text) {
    winston.debug("GET FAQ req.projectid", req.projectid);

    // query.$text = req.query.text;
    query.$text = { "$search": req.query.text };
    query.id_project = req.projectid
  }

  if (req.query.intent_display_name) {
    query.intent_display_name = req.query.intent_display_name
  }


  winston.debug("GET FAQ query", query);

  // query.$text = {"$search": "question"};

  // TODO ORDER BY SCORE
  // return Faq.find(query,  {score: { $meta: "textScore" } }) 
  // .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score

  // in testing...
  // return Faq.search('a closer', (err, result) => {
  //   console.log("result: ", result);
  // })

  return Faq.find(query).
    skip(skip).limit(limit).
    populate({ path: 'faq_kb' })//, match: { trashed: { $in: [null, false] } }}).
    .exec(function (err, faq) {
      winston.debug("GET FAQ ", faq);

      if (err) {
        winston.debug('GET FAQ err ', err)
        return next(err)
      };
      winston.debug('GET FAQ  ', faq)
      res.json(faq);

    });


});

async function myrequest(options, callback) {

  winston.debug("myrequest options: ", options)
  return await axios({
    url: options.url,
    method: options.method,
    data: options.json,
    params: options.params,
    headers: options.headers
  }).then((res) => {
    if (res && res.status == 200 && res.data) {
      if (callback) {
        callback(null, res.data);
      }
    }
    else {
      if (callback) {
        callback(TiledeskClient.getErr({ message: "Response status not 200" }, options, res), null, null);
      }
    }
  }).catch((err) => {
    if (callback) {
      callback(err, null, null);
    }
  })
}


module.exports = router;