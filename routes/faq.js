var express = require('express');
var router = express.Router();
var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var request = require('request');
var multer = require('multer')
var upload = multer()
const faqBotEvent = require('../event/faqBotEvent');
var winston = require('../config/winston');

var parsecsv = require("fast-csv");
csv = require('csv-express');
csv.separator = ';';

// POST CSV FILE UPLOAD FROM CLIENT
router.post('/uploadcsv', upload.single('uploadFile'), function (req, res, next) {
  winston.debug(' -> -> REQ BODY ', req.body);
  winston.debug(' -> ID FAQ-KB  ', req.body.id_faq_kb);
  winston.debug(' -> DELIMITER ', req.body.delimiter);
  winston.debug(' -> FILE ', req.file);

  var csv = req.file.buffer.toString('utf8');
  // winston.debug(' -> CSV STRING ', csv);

  // res.json({ success: true, msg: 'Importing CSV...' });

  // PARSE CSV
  var CSV_STRING = csv;

  // getFaqKbKeyById(req.body.id_faq_kb, function (remote_faqkb_key) {

    parsecsv.fromString(CSV_STRING, { headers: false, delimiter: req.body.delimiter })
      .on("data", function (data) {
        // winston.debug('PARSED CSV ', data);

        var question = data[0]
        var answer = data[1]
        var newFaq = new Faq({
          id_faq_kb: req.body.id_faq_kb,
          question: question,
          answer: answer,
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id
        });

        newFaq.save(function (err, savedFaq) {
          if (err) {
            winston.debug('--- > ERROR ', err)

            // return res.status(500).send({ success: false, msg: 'Error saving object.' }); // ADDED 24 APR
          }

          faqBotEvent.emit('faq.create', savedFaq);

          // res.json({ success: true, savedFaq }); // ADDED 24 APR

          // createRemoteFaq(remote_faqkb_key, savedFaq);
          // winston.debug('ID OF THE NEW FAQ CREATED from CSV IMPORTED: ', savedFaq._id)
        });
      })
      .on("end", function () {
        winston.debug("PARSE DONE");
        res.json({ success: true, msg: 'CSV Parsed' });
      })
      .on("error", function (err) {
        winston.debug("PARSE ERROR ", err);
        res.json({ success: false, msg: 'Parsing error' });
      });
  // });
});


router.post('/', function (req, res) {

  winston.debug(req.body);
  var newFaq = new Faq({
    id_faq_kb: req.body.id_faq_kb,
    question: req.body.question,
    answer: req.body.answer,
    id_project: req.projectid,
    topic: req.body.topic,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newFaq.save(function (err, savedFaq) {
    if (err) {
      winston.debug('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    winston.debug('1. ID OF THE NEW FAQ CREATED ', savedFaq._id)
    winston.debug('1. QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
    winston.debug('1. ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)
    winston.debug('1. ID FAQKB GET IN THE OBJECT OF NEW FAQ CREATED ', savedFaq.id_faq_kb);

    faqBotEvent.emit('faq.create', savedFaq);

    res.json(savedFaq);

    // WF: from the saved FAQ take the id of th faq-kb
    //     with the id of the faq-kb find the faq-kb and from its object take the remote id faq-kb 
    //     the remote id faq-kb is used to save the faq in remote
    // getFaqKbKeyById(savedFaq.id_faq_kb, function (remote_faqkb_key) {
    //   winston.debug('1. remote_faqkb_key ', remote_faqkb_key)
    //   if (remote_faqkb_key != null) {
    //     createRemoteFaq(remote_faqkb_key, savedFaq)
    //   } else {
    //     winston.debug("Error during indexing on Gianluca's system.")
    //   }
    // })

  });
});

// NEW
// function getFaqKbKeyById(faqKb_id, callback) {
//   winston.debug('2. FAQ-KB ID ', faqKb_id)
//   Faq_kb.findById(faqKb_id, function (err, faq_kb) {
//     if (err) {
//       winston.debug('FAQKB GET BY ID ERROR ', err)
//       callback(null)
//       return
//       // res.status(500).send({ success: false, msg: 'Error getting object.' });
//     }
//     if (!faq_kb) {
//       winston.debug('FAQKB GET BY ID - OBJECT NOT FOUND')
//       callback(null)
//       return
//       // res.status(404).send({ success: false, msg: 'Object not found.' });
//     }
//     winston.debug('2. FAQ-KB', faq_kb)
//     callback(faq_kb.kbkey_remote);

//     // res.json(faq_kb);

//     // createRemoteFaq(faq_kb.kbkey_remote, savedFaq)
//   });
// }

// function createRemoteFaq(faqkb_remotekey, savedFaq) {

//   winston.debug('2. REMOTE KEY of the FAQKB GET BY ID ', faqkb_remotekey)
//   winston.debug('2. ID OF THE NEW FAQ CREATED ', savedFaq._id)
//   winston.debug('2. QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
//   winston.debug('2. ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)

//   var json = {
//     "id": savedFaq._id,
//     "conversation": "id:1006",
//     "index_in_conversation": 3,
//     "question": savedFaq.question,
//     "answer": savedFaq.answer,
//     "question_scored_terms": [
//     ],
//     "verified": true,
//     "topics": "t1 t2",
//     "doctype": "normal",
//     "state": "",
//     "status": 0
//   };


//   var options = {
//     url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faqkb_remotekey + '/knowledgebase',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='      
//     },
//     json: json
//   };

//   request(options, function (err, res, body) {
//     if (res && (res.statusCode === 200 || res.statusCode === 201)) {
//       // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
//       winston.debug('FAQ REMOTE POST BODY ', body);


//     }
//     if (err) {
//       winston.debug('FAQ REMOTE POST ERROR ', err);
//     }
//   });
// }


// END NEW

// SEARCH REMOTE FAQ 
//TODO RIFATTORIZZA IN MODALITA' REST CHIEDI LEO

router.post('/askbot', function (req, res) {

  winston.debug('ASK BOT ', req.body);

  Faq.findById(req.body.id_faq_kb).populate('lead').exec(function(err, faq) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    winston.info('faq ', faq);
    if (faq.)
   
    
  });

});

//DEPRECATED
// router.post('/askbot', function (req, res) {

//   winston.debug('ASK BOT ', req.body);

//   var json = {
//     'question': req.body.question,
//     'doctype': 'normal',
//     'min_score': 0.0
//   };

//   winston.debug('JSON BODY ', json)
//   var options = {
//     url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + req.body.remote_faqkb_key + '/generateAnswer',
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='
//       // 'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
      
//     },
//     json: json
//   };

//   request(options, function (err, response, body) {
//     // winston.debug('STO ESEGUENDO ', res)
//     if (res && (res.statusCode === 200 || res.statusCode === 201)) {
//       // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
//       winston.debug('REMOTE FAQ FOUND POST BODY ', body);
//       res.json(body)
//     }
//     if (err) {
//       winston.debug('FAQ FOUND REMOTE POST ERROR ', err);
//     }

//   });

// });

router.put('/:faqid', function (req, res) {

  winston.debug('UPDATE FAQ ', req.body);

  Faq.findByIdAndUpdate(req.params.faqid, req.body, { new: true, upsert: true }, function (err, updatedFaq) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    faqBotEvent.emit('faq.update', updatedFaq);

    res.json(updatedFaq);

    // updateRemoteFaq(updatedFaq)
  });
});

// NEW - UPDATE REMOTE FAQ
// function updateRemoteFaq(updatedFaq) {
//   winston.debug('has been called UPDATE FAQ FUNCTION ', updatedFaq)
//   Faq_kb.findById(updatedFaq.id_faq_kb, function (err, faq_kb) {
//     if (err) {
//       winston.debug('UPDATE REMOTE FAQ - FAQKB GET BY ID ERROR ', err)
//     }
//     if (!faq_kb) {
//       winston.debug('UPDATE REMOTE FAQ - FAQKB GET BY ID - OBJECT NOT FOUND')
//     }
//     if (faq_kb) {
//       winston.debug('UPDATE REMOTE FAQ - FOUND FAQ-KB ', faq_kb)

//       var json = {
//         "conversation": "",
//         "index_in_conversation": 2,
//         "question": updatedFaq.question,
//         "answer": updatedFaq.answer,
//         "question_scored_terms": [],
//         "verified": true,
//         "topics": "",
//         "doctype": "normal",
//         "state": "",
//         "status": 0
//       };
//       var options = {
//         url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faq_kb.kbkey_remote + '/knowledgebase/' + updatedFaq._id,
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='
//           // 'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
          
//         },
//         json: json
//       };

//       request(options, function (err, res, body) {
//         winston.debug('UPDATE REMOTE FAQ PUT body ', body);
//         if (res && (res.statusCode === 200 || res.statusCode === 201)) {
//           // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
//           winston.debug('UPDATE REMOTE FAQ - PUT BODY ', body);
//         }
//         if (err) {
//           winston.debug('UPDATE REMOTE FAQ - PUT ERROR ', err);
//         }
//       });

//     }

//   })

// }

// DELETE REMOTE AND LOCAL FAQ
router.delete('/:faqid', function (req, res) {

  // deleteRemoteFaq(req.params.faqid)
  winston.debug('DELETE FAQ - FAQ ID ', req.params.faqid);

  Faq.remove({ _id: req.params.faqid }, function (err, faq) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(faq);

  });

  // Faq.findById(req.params.faqid, function (err, faq) {
  //   if (err) {
  //     winston.debug('DELETE FAQ - FIND FAQ BY ID - ERROR GETTING OBJECT')

  //   }
  //   if (!faq) {
  //     winston.debug('DELETE FAQ - FIND FAQ BY ID - OBJECT NOT FOUND')
  //   }
  //   winston.debug('DELETE FAQ - FAQ-KB ID ', faq.id_faq_kb)

  //   Faq_kb.findById(faq.id_faq_kb, function (err, faq_kb) {
  //     if (err) {
  //       winston.debug('DELETE FAQ - FAQKB GET BY ID ERROR ', err)
  //     }
  //     if (!faq_kb) {
  //       winston.debug('DELETE FAQ  - FAQKB GET BY ID - OBJECT NOT FOUND')
  //     }

  //     if (faq_kb) {
  //       winston.debug('DELETE FAQ  - FOUND FAQ-KB REMOTE KEY ', faq_kb.kbkey_remote)

  //       // var options = {
  //       //   url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faq_kb.kbkey_remote + '/knowledgebase/' + req.params.faqid,
  //       //   method: 'DELETE',
  //       //   headers: {
  //       //     'Content-Type': 'application/json',
  //       //     // 'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
  //       //     'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='            
  //       //   },

  //       // };

  //       // request(options, function (err, res, body) {

  //       //   if (res && (res.statusCode === 200 || res.statusCode === 201)) {
  //       //     // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
  //       //     winston.debug('DELETE REMOTE FAQ - PUT BODY ', body);
  //       //   }

  //       //   if (err) {
  //       //     winston.debug('DELETE REMOTE FAQ - PUT ERROR ', err);
  //       //   }
  //       // });


  //       // DELETE FAQ FROM LOCAL
  //       Faq.remove({ _id: req.params.faqid }, function (err, faq) {
  //         if (err) {
  //           return res.status(500).send({ success: false, msg: 'Error deleting object.' });
  //         }

  //         faqBotEvent.emit('faq.delete', faq);
  //         res.json(faq);

  //       });
  //     }


  //   })
  // });

});

// NEW - DELETE REMOTE FAQ

// function deleteRemoteFaq(id_faq) {

//   winston.debug('DELETE FAQ - FAQ ID ', id_faq)

//   Faq.findById(id_faq, function (err, faq) {
//     if (err) {
//       winston.debug('DELETE FAQ - FIND FAQ BY ID - ERROR GETTING OBJECT')

//     }
//     if (!faq) {
//       winston.debug('DELETE FAQ - FIND FAQ BY ID - OBJECT NOT FOUND')
//     }
//     winston.debug('DELETE FAQ - FAQ-KB ID ', faq.id_faq_kb)

//     Faq_kb.findById(faq.id_faq_kb, function (err, faq_kb) {
//       if (err) {
//         winston.debug('DELETE FAQ - FAQKB GET BY ID ERROR ', err)
//       }
//       if (!faq_kb) {
//         winston.debug('DELETE FAQ  - FAQKB GET BY ID - OBJECT NOT FOUND')
//       }
//       if (faq_kb) {
//         winston.debug('DELETE FAQ  - FOUND FAQ-KB REMOTE KEY ', faq_kb.kbkey_remote)

//         var options = {
//           url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faq_kb.kbkey_remote + '/knowledgebase/' + id_faq,
//           method: 'DELETE',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
//           },

//         };

//         request(options, function (err, res, body) {

//           if (res && (res.statusCode === 200 || res.statusCode === 201)) {
//             // winston.debug('FAQ KB KEY POST REQUEST BODY ', body);
//             winston.debug('DELETE REMOTE FAQ - PUT BODY ', body);

//             // DELETE FAQ FROM LOCAL
//             Faq.remove({ _id: id_faq }, function (err, faq) {
//               if (err) {
//                 return res.status(500).send({ success: false, msg: 'Error deleting object.' });
//               }
//               res.json(faq);

//             });

//           }

//           if (err) {
//             winston.debug('DELETE REMOTE FAQ - PUT ERROR ', err);
//           }
//         });
//       }


//     })
//   });
// }

// EXPORT FAQ TO CSV
router.get('/csv', function (req, res) {
  var query = {};

  winston.debug('req.query', req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  winston.debug('EXPORT FAQS TO CSV QUERY', query);

  //Faq.find(query, '-__v').lean().exec(function (err, faq) {
   Faq.find(query, 'question answer -_id').lean().exec(function (err, faq) {
    if (err) {
      winston.debug('EXPORT FAQS TO CSV ERR', err)
      return (err)
    };
    winston.debug('EXPORT FAQ TO CSV FAQS', faq)
    res.csv(faq, true)
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



router.get('/', function (req, res) {
  var query = {};

  winston.debug("req.query", req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  winston.debug("query", query);

  Faq.find(query, function (err, faq) {
    if (err) return next(err);
    res.json(faq);
  });

});




module.exports = router;
