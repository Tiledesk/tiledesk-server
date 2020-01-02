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


var labelsDir = __dirname+"/../config/labels/widget/";
winston.info('labelsDir: ' + labelsDir);



router.get('/default/:lang', function (req, res) {
  

  var filePath = path.join(labelsDir, req.params.lang+'.json');
 
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        winston.debug('received data: ' + data);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    } else {
        winston.error(err);
        return res.status(500).send({ success: false, msg: 'Error reading object.' });
    }
  });
});

router.get('/default/clone', function (req, res) {

 winston.info("req.body.lang: " + req.body.lang);
 
 var filePath = path.join(labelsDir, req.body.lang+'.json');
 
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
    if (!err) {
      
       Label.findOneAndUpdate({id_project: req.projectid}, 
        { $set: newLabel},
        {new: true, upsert:true, setDefaultsOnInsert: true }, 
        function(err, savedLabel) {
           
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }
          res.json(savedLabel);
      });
  
       
    } else {
        winston.error(err);
        return res.status(500).send({ success: false, msg: 'Error reading object.' });
    }
  });
});


router.patch('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {
  var data = req.body;
  var id_project = req.projectid;

  Label.findOne({id_project:id_project}, function(err, label) {
      if (err) {
        return res.status(500).send({ success: false, msg: 'Error getting object.' });
      } else {
        if (!label) {
          label = new Label({          
            id_project: req.projectid,
            createdBy: req.user.id,
            updatedBy: req.user.id
          });
        }
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          label[key] = val;
        });        
          label.save(function (err, savedLabel) {
            res.json(savedLabel);
          });
      }
  });
});

router.put('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

//  var _id = new mongoose.Types.ObjectId();


  var newLabel = req.body;
  
  newLabel.id_project = req.projectid;
  newLabel.createdBy = req.user.id
  newLabel.updatedBy = req.user.id
  
  // if (!req.body._id) {
  //   newLabel._id = new mongoose.mongo.ObjectID();
  // }

  
  Label.findOneAndUpdate({id_project: req.projectid}, 
    { $set: newLabel},
    // newLabel,
    // { $set: { 'products.$': products }},
     {new: true, upsert:true, setDefaultsOnInsert: true },function(err, savedLabel) {
  // Label.update({_id: req.body._id}, newLabel, {upsert: true, setDefaultsOnInsert: true}, function (err, savedLabel) {


  // newLabel.save(function (err, savedLabel) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error saving object.' });
    }
    res.json(savedLabel);
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



router.get('/', function (req, res) {
 
  var query = { "id_project": req.projectid};

 
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





router.get('/:lang', function (req, res) {
 
  var query = { "id_project": req.projectid,"lang": req.params.lang};

 
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
