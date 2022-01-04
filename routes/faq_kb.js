var express = require('express');
var router = express.Router();
var Faq_kb = require("../models/faq_kb");
var Faq= require("../models/faq");
var Department = require("../models/department");
var faqService = require("../services/faqService");
const botEvent = require('../event/botEvent');
var winston = require('../config/winston');
var httpUtil = require("../utils/httpUtil");

router.post('/', function (req, res) {
  winston.info('create BOT ', req.body);
  // create(name, url, projectid, user_id, type, description) {
  faqService.create(req.body.name, req.body.url, req.projectid, req.user.id, req.body.type, req.body.description, undefined, undefined,
    req.body.language).then(function(savedFaq_kb) {
    res.json(savedFaq_kb);
  });


});


router.post('/train', function (req, res) {

  winston.info('train BOT ', req.body);

  Faq_kb.findById(req.body.id_faq_kb).exec(function(err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());

    winston.debug('faq_kb.type :'+ faq_kb.type);
    if (faq_kb.type =="internal" && faq_kb.url) {



      var train =   {
        language:faq_kb.language,
        nlu:[]
      };
      winston.info("train", train);     
      

      var query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb};

      Faq.find(query) 
      .limit(10000)
      .lean().               
       exec(async (err, faqs) => {
         if (err) {
           return res.status(500).send({ success: false, msg: 'Error getting object.' });
         }
         if (faqs && faqs.length>0) {
          winston.info("faqs exact", faqs);              

          faqs.forEach(function(f) {
            var intent = {
              intent:f.intent_display_name,
              examples:[]
            }
            var questions = f.question.split("\n");
            winston.info("questions", questions);

            questions.forEach(function(q) {
              winston.info("q", q);
              intent.examples.push(q);
            });       
            winston.info("intent", intent);
            train.nlu.push(intent);            
          });
          winston.info("train", train);

          try {
            var trainHttp = await httpUtil.call(faq_kb.url+"/trainandload", undefined, train, "POST");
          }catch(e) {
            winston.error("error training", e);
          }
          

          return res.json({train:train, httpResponse:trainHttp});
          // return res.json(trainHttp);
         }else {
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

  Faq_kb.findById(req.body.id_faq_kb).exec(function(err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.debug('faq_kb ', faq_kb.toJSON());
    winston.debug('faq_kb.type :'+ faq_kb.type);
    if (faq_kb.type =="internal") {



      

      var query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb, "question": req.body.question};

      Faq.find(query) 
      .lean().               
       exec(function (err, faqs) {
         if (err) {
           return res.status(500).send({ success: false, msg: 'Error getting object.' });
         }
         if (faqs && faqs.length>0) {
          winston.debug("faqs exact", faqs);              

          faqs.forEach(f => {
            f.score = 100;
          });
          var result = {hits:faqs};


          res.json(result);
         }else {
          query = { "id_project": req.projectid, "id_faq_kb": req.body.id_faq_kb};

          var search_obj = {"$search": req.body.question};

          if (faq_kb.language) {
              search_obj["$language"] = faq_kb.language;
          }
          query.$text = search_obj;
          winston.debug("fulltext search query", query);  


          winston.debug('internal ft query: '+ query);
    
           Faq.find(query,  {score: { $meta: "textScore" } })  
           .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score
           .lean().               
            exec(function (err, faqs) {
              if (err) {
                winston.error('Error getting object.', err);      
                return res.status(500).send({ success: false, msg: 'Error getting fulltext object.' });
              }
    
               winston.debug("faqs", faqs);              
    
               var result = {hits:faqs};
               res.json(result);
            });

            
         }

         
       });

     
    }else {
      winston.debug('external query: ');
      return res.status(400).send({ success: false, msg: 'askbot on external bot.' });
    }
   
    
  });

});



router.put('/:faq_kbid', function (req, res) {

  winston.debug(req.body);

  var update = {};
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }
  if (req.body.description!=undefined) {
    update.description = req.body.description;
  }
  if (req.body.url!=undefined) {
    update.url = req.body.url;
  }
  if (req.body.webhook_url!=undefined) {
    update.webhook_url = req.body.webhook_url;
  }
  if (req.body.webhook_enabled!=undefined) {
    update.webhook_enabled = req.body.webhook_enabled;
  }
  
  if (req.body.type!=undefined) {
    update.type = req.body.type;
  }
  if (req.body.trashed!=undefined) {
    update.trashed = req.body.trashed;
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

  if (req.query.all!="true") {
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

module.exports = router;
