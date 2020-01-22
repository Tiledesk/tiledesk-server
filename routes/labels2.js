var express = require('express');
var router = express.Router({mergeParams: true});
var Label = require("../models/label2");
var winston = require('../config/winston');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role')

var mongoose = require('mongoose');

var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;

var fs = require('fs');
var path = require('path');


// var labelsDir = __dirname+"/../config/labels/widget/";
// winston.info('labelsDir: ' + labelsDir);


router.get('/default', function (req, res) {
  
  res.json(req.labels);
 
});
// curl -v -X POST -H 'Content-Type:application/json'  -d '{"lang":"IT"}' http://localhost:3000/123/labels2/default/clone
// [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],
router.post('/default/clone', function (req, res, next) {
// router.get('/default/clone', function (req, res) {

  // winston.info("req.body.lang: " + req.body.lang);
  // var lang = req.query.lang;
  var lang = req.body.lang;
  winston.info("lang: " + lang);
  
  var pickedLang = req.labels.find(l => l.lang === lang);

  if (!pickedLang){
    var pickedLangPivot = req.labels.find(l => l.lang === "EN");
    pickedLangPivot.lang = lang;
    pickedLang = pickedLangPivot;
  }
  // var newLabel = {lang: lang, data: pickedLang};
  var newLabel = pickedLang;
  winston.info("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        label = new Label({          
          id_project: req.projectid,
          // createdBy: req.user.id,
          // updatedBy: req.user.id,
          createdBy: "req.user.id,",
          updatedBy: "req.user.id,",
          data: [newLabel]
        });
      }else {
        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.info("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          label.data[foundIndex] = newLabel;
        }else {
          label.data.push(newLabel);
        }
      }
      
        label.save(function (err, savedLabel) {
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }
          // res.redirect(req.baseUrl + '/');
          
          // express forward          
          req.url =  '/';
          winston.debug('--- > req.url'+req.url);

          req.method = 'GET';  

          return router.handle(req, res, next);
          // res.json(savedLabel);
          // redirect to get
        });
    }
});

   
        
});
 
 

router.get('/default/:lang', function (req, res) {
  var pickedLang = req.labels.find(l => l.lang === req.params.lang);

  res.json(pickedLang);
});



// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"lang":"FR", "data":{"a":"b","c":"d"}}' http://localhost:3000/4321/labels2/

// router.post('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {
  router.post('/',function (req, res) {
 
  var lang = req.body.lang;
  winston.info("lang: " + lang);



  var newLabel = {lang: lang, data: req.body.data};
  winston.info("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        label = new Label({          
          id_project: req.projectid,
          // createdBy: req.user.id,
          // updatedBy: req.user.id,
          createdBy: "req.user.id,",
          updatedBy: "req.user.id,",
          data: [newLabel]
        });
      }else {
        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.info("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          label.data[foundIndex] = newLabel;
        }else {
          label.data.push(newLabel);
        }
      }
      
        label.save(function (err, savedLabel) {
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }
          // res.json(savedLabel);
          //res.redirect('/'+lang);
           // express forward          
           req.url =  '/'+lang;
           winston.debug('--- > req.url'+req.url);
 
           req.method = 'GET';  
 
           return router.handle(req, res, next);
        });
      }
    });

});

// router.put('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {

//   winston.debug(req.body);
//   winston.debug("req.user", req.user);

// //  var _id = new mongoose.Types.ObjectId();


//   var newLabel = req.body;
  
//   newLabel.id_project = req.projectid;
//   newLabel.createdBy = req.user.id
//   newLabel.updatedBy = req.user.id
  
//   // if (!req.body._id) {
//   //   newLabel._id = new mongoose.mongo.ObjectID();
//   // }

  
//   Label.findOneAndUpdate({id_project: req.projectid}, 
//     { $set: newLabel},
//     // newLabel,
//     // { $set: { 'products.$': products }},
//      {new: true, upsert:true, setDefaultsOnInsert: true },function(err, savedLabel) {
//   // Label.update({_id: req.body._id}, newLabel, {upsert: true, setDefaultsOnInsert: true}, function (err, savedLabel) {


//   // newLabel.save(function (err, savedLabel) {
//     if (err) {
//       winston.error('--- > ERROR ', err);
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     }
//     res.json(savedLabel);
//   });

//  });

  
// curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/4321/labels2/

router.delete('/', function (req, res) {
  winston.debug(req.body);

  Label.remove({ id_project: req.projectid }, function (err, label) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    res.json(label);
  });
});

// curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/1235/labels2/EN
//router.delete('/:lang',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {
router.delete('/:lang', function (req, res) {
  var lang = req.params.lang;
  winston.info("lang: " + lang);


  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }else {
        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.info("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          var idData = label.data[foundIndex]._id;
          label.data.id(idData).remove();
        }else {
          return res.status(404).send({ success: false, msg: 'Object not found.' });
        }
      }
      
        label.save(function (err, savedLabel) {
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }
          // res.json(savedLabel);
          // res.redirect('/'+lang);
           req.url =  '/'+lang;
           winston.debug('--- > req.url'+req.url);
 
           req.method = 'GET';  
 
           return router.handle(req, res, next);
        });
      }
    });
});



router.get('/', function (req, res) {
 
  var query = { "id_project": req.projectid};
  // var query = {};

  winston.debug("query /", query);


  return Label.findOne(query).lean().exec(function (err, labels) {

      if (err) {
        winston.error('Label ROUTE - REQUEST FIND ERR ', err)
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      winston.debug("here /", labels);
      let returnval;
      if (!labels) {
        winston.debug("here  no labels");

        returnval = {data: req.labels};
      } else {
        returnval = labels;
        // var dataAsObj = {...req.labels, ...labels.data }
        // var data = Object.values(dataAsObj);
        req.labels.forEach(elementDef => {
          var pickedLang = labels.data.find(l => l.lang === elementDef.lang);
          if (!pickedLang) {
            returnval.data.push(elementDef);
          }
        });
      
      }
      
      winston.debug("returnval",returnval);
    
        return res.json(returnval);
      
    });
});





router.get('/:lang', function (req, res) {
 
  
  var query = { "id_project": req.projectid};
  // var query = {};

  winston.debug("query /", query);


  return Label.findOne(query).lean().exec(function (err, labels) {

      if (err) {
        winston.error('Label ROUTE - REQUEST FIND ERR ', err)
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      }
      winston.debug("here /", labels);
      let returnval;
      if (!labels) {
        winston.info("here  no labels");

        returnval = {data: req.labels};
      } else {
        returnval = labels;
        // var dataAsObj = {...req.labels, ...labels.data }
        // var data = Object.values(dataAsObj);
        req.labels.forEach(elementDef => {
          var pickedLang = labels.data.find(l => l.lang === elementDef.lang);
          if (!pickedLang) {
            returnval.data.push(elementDef);
          }
        });
      
      }

      winston.info("returnval",returnval);

      var pickedLang = returnval.data.find(l => l.lang === req.params.lang);
      //var pickedLang = returnval.data[req.params.lang];

      return res.json(pickedLang);
      
    });
});




module.exports = router;
