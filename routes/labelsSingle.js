let express = require('express');
let router = express.Router({mergeParams: true});
let Label = require("../models/label");
let winston = require('../config/winston');
let passport = require('passport');
require('../middleware/passport')(passport);
let validtoken = require('../middleware/valid-token')
let roleChecker = require('../middleware/has-role')


// router.post('/',  function (req, res) {
router.post('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

 if (Array.isArray(req.body)) {

  req.body.forEach(function(lab,index) {
    let newLabel = new Label({
      lang: lab.lang,
      key: lab.key,
      message: lab.message,
      id_project: req.projectid,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    newLabel.save(function (err, savedLabel) {
      if (err) {
        winston.error('--- > ERROR ', err);
        return res.status(500).send({ success: false, msg: 'Error saving object.' });
      }
      
    });


    res.json('{"success":true}');
  });

  // Label.insertMany(req.body, function (err, savedLabels) {
  //   if (err) {
  //     winston.error('--- > ERROR ', err);
  //     return res.status(500).send({ success: false, msg: 'Error saving object.' });
  //   }
  //   res.json(savedLabels);
  // });

 }else {

  let newLabel = new Label({
    lang: req.body.lang,
    key: req.body.key,
    message: req.body.message,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newLabel.save(function (err, savedLabel) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedLabel);
  });

 }

  
});

// router.post('/bulk',  function (req, res) {

//   winston.debug(req.body);
//   winston.debug("req.user", req.user);

 

// });

router.put('/:labelid',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {
  winston.debug(req.body);

  Label.findByIdAndUpdate(req.params.labelid, req.body, { new: true, upsert: true }, function (err, updatedLabel) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    res.json(updatedLabel);
  });
});

router.delete('/:labelid',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {
  winston.debug(req.body);

  Label.remove({ _id: req.params.labelid }, function (err, label) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    res.json(label);
  });
});



router.get('/:lang', function (req, res) {
 
  let query = { "id_project": req.projectid,"lang": req.params.lang};

 
  winston.debug("query", query);

  return Label.find(query).  
    exec(function (err, labels) {
      if (err) {
        winston.error('Label ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

    
        return res.json(labels);
      
    });
});




module.exports = router;
