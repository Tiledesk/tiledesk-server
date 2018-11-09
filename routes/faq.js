var express = require('express');
var router = express.Router();
var Faq = require("../models/faq");
var Faq_kb = require("../models/faq_kb");
var request = require('request');
var multer = require('multer')
var upload = multer()

var parsecsv = require("fast-csv");

// POST CSV FILE UPLOAD FROM CLIENT
router.post('/uploadcsv', upload.single('uploadFile'), function (req, res, next) {
  console.log(' -> -> REQ BODY ', req.body);
  console.log(' -> ID FAQ-KB  ', req.body.id_faq_kb);
  console.log(' -> DELIMITER ', req.body.delimiter);
  console.log(' -> FILE ', req.file);

  var csv = req.file.buffer.toString('utf8');
  // console.log(' -> CSV STRING ', csv);

  // res.json({ success: true, msg: 'Importing CSV...' });

  // PARSE CSV
  var CSV_STRING = csv;

  getFaqKbKeyById(req.body.id_faq_kb, function (remote_faqkb_key) {

    parsecsv.fromString(CSV_STRING, { headers: false, delimiter: req.body.delimiter })
      .on("data", function (data) {
        // console.log('PARSED CSV ', data);

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
            console.log('--- > ERROR ', err)

            // return res.status(500).send({ success: false, msg: 'Error saving object.' }); // ADDED 24 APR
          }

          // res.json({ success: true, savedFaq }); // ADDED 24 APR

          createRemoteFaq(remote_faqkb_key, savedFaq);
          // console.log('ID OF THE NEW FAQ CREATED from CSV IMPORTED: ', savedFaq._id)
        });
      })
      .on("end", function () {
        console.log("PARSE DONE");
        res.json({ success: true, msg: 'CSV Parsed' });
      })
      .on("error", function (err) {
        console.log("PARSE ERROR ", err);
        res.json({ success: false, msg: 'Parsing error' });
      });
  });
});


router.post('/', function (req, res) {

  console.log(req.body);
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
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    console.log('1. ID OF THE NEW FAQ CREATED ', savedFaq._id)
    console.log('1. QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
    console.log('1. ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)
    console.log('1. ID FAQKB GET IN THE OBJECT OF NEW FAQ CREATED ', savedFaq.id_faq_kb)
    res.json(savedFaq);

    // WF: from the saved FAQ take the id of th faq-kb
    //     with the id of the faq-kb find the faq-kb and from its object take the remote id faq-kb 
    //     the remote id faq-kb is used to save the faq in remote
    getFaqKbKeyById(savedFaq.id_faq_kb, function (remote_faqkb_key) {
      console.log('1. remote_faqkb_key ', remote_faqkb_key)
      if (remote_faqkb_key != null) {
        createRemoteFaq(remote_faqkb_key, savedFaq)
      } else {
        console.log("Error during indexing on Gianluca's system.")
      }
    })

  });
});

// NEW
function getFaqKbKeyById(faqKb_id, callback) {
  console.log('2. FAQ-KB ID ', faqKb_id)
  Faq_kb.findById(faqKb_id, function (err, faq_kb) {
    if (err) {
      console.log('FAQKB GET BY ID ERROR ', err)
      callback(null)
      return
      // res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      console.log('FAQKB GET BY ID - OBJECT NOT FOUND')
      callback(null)
      return
      // res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    console.log('2. FAQ-KB', faq_kb)
    callback(faq_kb.kbkey_remote);

    // res.json(faq_kb);

    // createRemoteFaq(faq_kb.kbkey_remote, savedFaq)
  });
}

function createRemoteFaq(faqkb_remotekey, savedFaq) {

  console.log('2. REMOTE KEY of the FAQKB GET BY ID ', faqkb_remotekey)
  console.log('2. ID OF THE NEW FAQ CREATED ', savedFaq._id)
  console.log('2. QUESTION OF THE NEW FAQ CREATED ', savedFaq.question)
  console.log('2. ANSWER OF THE NEW FAQ CREATED ', savedFaq.answer)

  var json = {
    "id": savedFaq._id,
    "conversation": "id:1006",
    "index_in_conversation": 3,
    "question": savedFaq.question,
    "answer": savedFaq.answer,
    "question_scored_terms": [
    ],
    "verified": true,
    "topics": "t1 t2",
    "doctype": "normal",
    "state": "",
    "status": 0
  };


  var options = {
    url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faqkb_remotekey + '/knowledgebase',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic YWRtaW46YWRtaW5wNHNzdzByZA=='
    },
    json: json
  };

  request(options, function (err, res, body) {
    if (res && (res.statusCode === 200 || res.statusCode === 201)) {
      // console.log('FAQ KB KEY POST REQUEST BODY ', body);
      console.log('FAQ REMOTE POST BODY ', body);


    }
    if (err) {
      console.log('FAQ REMOTE POST ERROR ', err);
    }
  });
}
// END NEW

// SEARCH REMOTE FAQ 
router.post('/:askbot', function (req, res) {

  console.log('ASK BOT ', req.body);

  var json = {
    'question': req.body.question,
    'doctype': 'normal',
    'min_score': 0.0
  };

  console.log('JSON BODY ', json)
  var options = {
    url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + req.body.remote_faqkb_key + '/generateAnswer',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
    },
    json: json
  };

  request(options, function (err, response, body) {
    // console.log('STO ESEGUENDO ', res)
    if (res && (res.statusCode === 200 || res.statusCode === 201)) {
      // console.log('FAQ KB KEY POST REQUEST BODY ', body);
      console.log('REMOTE FAQ FOUND POST BODY ', body);
      res.json(body)
    }
    if (err) {
      console.log('FAQ FOUND REMOTE POST ERROR ', err);
    }

  });

});

router.put('/:faqid', function (req, res) {

  console.log('UPDATE FAQ ', req.body);

  Faq.findByIdAndUpdate(req.params.faqid, req.body, { new: true, upsert: true }, function (err, updatedFaq) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    res.json(updatedFaq);

    updateRemoteFaq(updatedFaq)
  });
});

// NEW - UPDATE REMOTE FAQ
function updateRemoteFaq(updatedFaq) {
  console.log('has been called UPDATE FAQ FUNCTION ', updatedFaq)
  Faq_kb.findById(updatedFaq.id_faq_kb, function (err, faq_kb) {
    if (err) {
      console.log('UPDATE REMOTE FAQ - FAQKB GET BY ID ERROR ', err)
    }
    if (!faq_kb) {
      console.log('UPDATE REMOTE FAQ - FAQKB GET BY ID - OBJECT NOT FOUND')
    }
    if (faq_kb) {
      console.log('UPDATE REMOTE FAQ - FOUND FAQ-KB ', faq_kb)

      var json = {
        "conversation": "",
        "index_in_conversation": 2,
        "question": updatedFaq.question,
        "answer": updatedFaq.answer,
        "question_scored_terms": [],
        "verified": true,
        "topics": "",
        "doctype": "normal",
        "state": "",
        "status": 0
      };
      var options = {
        url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faq_kb.kbkey_remote + '/knowledgebase/' + updatedFaq._id,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
        },
        json: json
      };

      request(options, function (err, res, body) {
        console.log('UPDATE REMOTE FAQ PUT body ', body);
        if (res && (res.statusCode === 200 || res.statusCode === 201)) {
          // console.log('FAQ KB KEY POST REQUEST BODY ', body);
          console.log('UPDATE REMOTE FAQ - PUT BODY ', body);
        }
        if (err) {
          console.log('UPDATE REMOTE FAQ - PUT ERROR ', err);
        }
      });

    }

  })

}

// DELETE REMOTE AND LOCAL FAQ
router.delete('/:faqid', function (req, res) {

  // deleteRemoteFaq(req.params.faqid)

  // Faq.remove({ _id: req.params.faqid }, function (err, faq) {
  //   if (err) {
  //     return res.status(500).send({ success: false, msg: 'Error deleting object.' });
  //   }
  //   res.json(faq);

  // });
  console.log('DELETE FAQ - FAQ ID ', req.params.faqid)

  Faq.findById(req.params.faqid, function (err, faq) {
    if (err) {
      console.log('DELETE FAQ - FIND FAQ BY ID - ERROR GETTING OBJECT')

    }
    if (!faq) {
      console.log('DELETE FAQ - FIND FAQ BY ID - OBJECT NOT FOUND')
    }
    console.log('DELETE FAQ - FAQ-KB ID ', faq.id_faq_kb)

    Faq_kb.findById(faq.id_faq_kb, function (err, faq_kb) {
      if (err) {
        console.log('DELETE FAQ - FAQKB GET BY ID ERROR ', err)
      }
      if (!faq_kb) {
        console.log('DELETE FAQ  - FAQKB GET BY ID - OBJECT NOT FOUND')
      }

      if (faq_kb) {
        console.log('DELETE FAQ  - FOUND FAQ-KB REMOTE KEY ', faq_kb.kbkey_remote)

        var options = {
          url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qnamaker/v2.0/knowledgebases/' + faq_kb.kbkey_remote + '/knowledgebase/' + req.params.faqid,
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ZnJvbnRpZXJlMjE6cGFzc3dvcmQ='
          },

        };

        request(options, function (err, res, body) {

          if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            // console.log('FAQ KB KEY POST REQUEST BODY ', body);
            console.log('DELETE REMOTE FAQ - PUT BODY ', body);
          }

          if (err) {
            console.log('DELETE REMOTE FAQ - PUT ERROR ', err);
          }
        });


        // DELETE FAQ FROM LOCAL
        Faq.remove({ _id: req.params.faqid }, function (err, faq) {
          if (err) {
            return res.status(500).send({ success: false, msg: 'Error deleting object.' });
          }
          res.json(faq);

        });
      }


    })
  });

});

// NEW - DELETE REMOTE FAQ

// function deleteRemoteFaq(id_faq) {

//   console.log('DELETE FAQ - FAQ ID ', id_faq)

//   Faq.findById(id_faq, function (err, faq) {
//     if (err) {
//       console.log('DELETE FAQ - FIND FAQ BY ID - ERROR GETTING OBJECT')

//     }
//     if (!faq) {
//       console.log('DELETE FAQ - FIND FAQ BY ID - OBJECT NOT FOUND')
//     }
//     console.log('DELETE FAQ - FAQ-KB ID ', faq.id_faq_kb)

//     Faq_kb.findById(faq.id_faq_kb, function (err, faq_kb) {
//       if (err) {
//         console.log('DELETE FAQ - FAQKB GET BY ID ERROR ', err)
//       }
//       if (!faq_kb) {
//         console.log('DELETE FAQ  - FAQKB GET BY ID - OBJECT NOT FOUND')
//       }
//       if (faq_kb) {
//         console.log('DELETE FAQ  - FOUND FAQ-KB REMOTE KEY ', faq_kb.kbkey_remote)

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
//             // console.log('FAQ KB KEY POST REQUEST BODY ', body);
//             console.log('DELETE REMOTE FAQ - PUT BODY ', body);

//             // DELETE FAQ FROM LOCAL
//             Faq.remove({ _id: id_faq }, function (err, faq) {
//               if (err) {
//                 return res.status(500).send({ success: false, msg: 'Error deleting object.' });
//               }
//               res.json(faq);

//             });

//           }

//           if (err) {
//             console.log('DELETE REMOTE FAQ - PUT ERROR ', err);
//           }
//         });
//       }


//     })
//   });
// }


router.get('/:faqid', function (req, res) {

  console.log(req.body);

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

  console.log("req.query", req.query);

  if (req.query.id_faq_kb) {
    query.id_faq_kb = req.query.id_faq_kb;
  }

  console.log("query", query);

  Faq.find(query, function (err, faq) {
    if (err) return next(err);
    res.json(faq);
  });

});

module.exports = router;
