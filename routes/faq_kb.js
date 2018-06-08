var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Faq_kb = require("../models/faq_kb");
var Department = require("../models/department");


// START - CREATE FAQ KB KEY 
var request = require('request');

// THIS CALLBACK IS PERFORMED WHEN IS CREATED A NEW FAQKB (router.post)
function createFaqKbRemote(faqkb_id) {
  var json = {
    "username": "frontiere21",
    "password": "password",
    "language": "italian"
  };

  var options = {
    url: 'http://ec2-52-47-168-118.eu-west-3.compute.amazonaws.com/qna_kbmanagement/create',
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
      console.log('FAQ-KB REMOTE POST: FAQKB KEY RETURNED ', body.kbkey);

      updateFaqKbKey(faqkb_id, body.kbkey)
    }
    if (err) {
      console.log('FAQ-KB REMOTE POST ERROR ', err);
    }
  });
}

function updateFaqKbKey(faqkb_id, remotefaqkb_key) {
  console.log('UPDATING FAQKB WITH THE REMOTE FAQKB KEY')
  Faq_kb.findByIdAndUpdate(
    faqkb_id,
    { kbkey_remote: remotefaqkb_key },
    { new: true, upsert: true },
    function (err, updatedFaq_kb) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error updating updateFaqKbKey object.' });
      }
      // res.json(updatedFaq_kb);
    });
}

// END NEW 

router.post('/', function (req, res) {

  console.log('FAQ-KB POST REQUEST BODY ', req.body);
  var newFaq_kb = new Faq_kb({
    name: req.body.name,
    url: req.body.url,
    id_project: req.projectid,
    kbkey_remote: req.body.kbkey_remote,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newFaq_kb.save(function (err, savedFaq_kb) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    console.log('SAVED FAQFAQ KB ', savedFaq_kb)
    res.json(savedFaq_kb);

    createFaqKbRemote(savedFaq_kb._id)
  });
});

router.put('/:faq_kbid', function (req, res) {

  console.log(req.body);

  Faq_kb.findByIdAndUpdate(req.params.faq_kbid, req.body, { new: true, upsert: true }, function (err, updatedFaq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }
    res.json(updatedFaq_kb);
  });
});


router.delete('/:faq_kbid', function (req, res) {

  console.log(req.body);

  Faq_kb.remove({ _id: req.params.faq_kbid }, function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }
    res.json(faq_kb);
  });
});


router.get('/:faq_kbid', function (req, res) {

   console.log(req.query);

  Faq_kb.findById(req.params.faq_kbid, function (err, faq_kb) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!faq_kb) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }

    if (req.query.departmentid) {

      console.log("req.query.departmentid",req.query.departmentid);

        Department.findById(req.query.departmentid, function (err, department) {
          if (err) {
            console.log(err);
            return res.status(500).send({ success: false, msg: 'Error getting department.' });
          }
          if (!department) {
            console.log("Department not found", req.query.departmentid);
            return res.status(404).send({ success: false, msg: 'Department not found.' });
          } else {
            console.log("department", department);
            
            // https://github.com/Automattic/mongoose/issues/4614
            faq_kb._doc.department = department;
            console.log("faq_kb", faq_kb);

            res.json(faq_kb);          
          }
        });

    } else {
      res.json(faq_kb);
    }
    
  });
});


// NEW - GET ALL FAQKB WITH THE PASSED PROJECT ID
router.get('/', function (req, res) {
  // var query = {};

  // console.log("req.query", req.query);

  // if (req.query.id_project) {
  //   query.id_project = req.query.id_project;
  // }

  console.log("req projectid", req.projectid);
   
  Faq_kb.find({ "id_project": req.projectid }, function (err, faq_kb) {
    if (err) return next(err);

    res.json(faq_kb);

  });

});


// GET ALL FAQKB NO MORE USED - NOW THE FAQKB ARE FILTERED BY PROJECT ID
// router.get('/', function (req, res) {

//   Faq_kb.find(function (err, faq_kb) {
//     if (err) return next(err);
//     res.json(faq_kb);
//   });
// });

module.exports = router;
