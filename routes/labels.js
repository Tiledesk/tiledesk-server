var express = require('express');
var router = express.Router({mergeParams: true});
var Label = require("../models/label");
var winston = require('../config/winston');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var roleChecker = require('../middleware/has-role')
var labelService = require("../services/labelService");
var labelEvent = require("../event/labelEvent");
var mongoose = require('mongoose');

const { check, validationResult } = require('express-validator');


winston.debug("  labelService.FALLBACK_LANGUAGE: " +   labelService.FALLBACK_LANGUAGE  );

var Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;



router.get('/default', function (req, res) {
  
  res.json(req.labels);
 
});
// curl -v -X POST -H 'Content-Type:application/json'  -d '{"lang":"IT"}' http://localhost:3000/123/labels/default/clone

// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"lang":"IT"}' http://localhost:3001/624c78e27b91d2a2ab49543a/labels/default/clone

router.post('/default/clone', 
  [
    passport.authenticate(['basic', 'jwt'], { session: false }), 
    validtoken, 
    roleChecker.hasRole('admin'),
    check('lang').notEmpty(),  
  ],
  function (req, res, next) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


  var lang = req.body.lang;
  winston.debug("lang: " + lang);
  
  var pickedLang = req.labels.find(l => l.lang === lang);

  if (!pickedLang) {
      // FALLBACK_LANGUAGE IMP
    var pickedLangPivot = req.labels.find(l => l.lang === labelService.FALLBACK_LANGUAGE);
    pickedLangPivot.lang = lang;
    pickedLang = pickedLangPivot;
  }
  var newLabel = pickedLang;
  winston.debug("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {

        // auto make default the new lang
        newLabel.default = true;

        label = new Label({          
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id,        
          data: [newLabel]
        });
      }else {
        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.debug("foundIndex: " + foundIndex);
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
          
          labelEvent.emit('label.clone', savedLabel);

          // express forward          
          req.url =  '/';
          winston.debug('--- > req.url'+req.url);

          req.method = 'GET';  

          return router.handle(req, res, next);        
        });
    }
});

   
        
});
 
 

router.get('/default/:lang', function (req, res) {
  var pickedLang = req.labels.find(l => l.lang === req.params.lang);

  res.json(pickedLang);
});

// Update labels
// curl -v -X PATCH -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"lang":"FR", "data":{"a":"b","c":"d"}}' http://localhost:3000/4321/labels/EN/default
router.patch('/:lang/default',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res, next) {

  var lang = req.params.lang;
  winston.debug("lang: " + lang);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        winston.error('Lang not found');
        return res.status(404).send({ success: false, msg: 'Lang not found' });
      }else {

        var foundDefaultIndex = -1;
        label.data.forEach(function(l, index){
            if (l.default === true ) {
              foundDefaultIndex = index;
            }
        });

        winston.debug("foundDefaultIndex: " + foundDefaultIndex);
        if (foundDefaultIndex>-1) {
          label.data[foundDefaultIndex].default = false;
          winston.debug("label.data[foundDefaultIndex]: ", label.data[foundDefaultIndex]);
        }
        

        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.debug("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          label.data[foundIndex].default = true;
        }

        
      
      
        winston.debug("saving label ", label);

        label.save(function (err, savedLabel) {
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }      
          labelEvent.emit('label.update', savedLabel);

           // express forward          
           req.url =  '/'+lang;
           winston.debug('--- > req.url'+req.url);
 
           req.method = 'GET';  
 
           return router.handle(req, res, next);
        });
      }

    }
  });
  

});

// Update labels
// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"lang":"FR", "data":{"a":"b","c":"d"}}' http://localhost:3000/4321/labels/
router.post('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res, next) {
 
  var lang = req.body.lang;
  winston.debug("lang: " + lang);

  var defaultValue =  req.body.default;
  winston.debug("defaultValue: " + defaultValue);

  var newLabel = {lang: lang, data: req.body.data, default: defaultValue};
  winston.debug("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {

        // auto make default the new lang
        newLabel.default = true;

        label = new Label({          
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id,          
          data: [newLabel]
        });
      }else {
        //remove existing default

        if (defaultValue===true) {
          winston.debug("defaultValue: " + defaultValue);
          var foundDefaultIndex = -1;
          label.data.forEach(function(l, index){
              if (l.default === true ) {
                foundDefaultIndex = index;
              }
          });

          winston.debug("foundDefaultIndex: " + foundDefaultIndex);
          if (foundDefaultIndex>-1) {
            label.data[foundDefaultIndex].default = false;
            winston.debug("label.data[foundDefaultIndex]: ", label.data[foundDefaultIndex]);
          }
        }

        var foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.debug("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          label.data[foundIndex] = newLabel;
        }else {
          label.data.push(newLabel);
        }

        
      }
      
      winston.debug("saving label ", label);

        label.save(function (err, savedLabel) {
          if (err) {
            winston.error('--- > ERROR ', err);
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }      
          labelEvent.emit('label.create', savedLabel);

           // express forward          
           req.url =  '/'+lang;
           winston.debug('--- > req.url'+req.url);
 
           req.method = 'GET';  
 
           return router.handle(req, res, next);
        });
      }
    });

});

  
// curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/4321/labels/

router.delete('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')], function (req, res) {
  winston.debug(req.body);

  Label.remove({ id_project: req.projectid }, function (err, label) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

    labelEvent.emit('label.delete', label);


    res.json(label);
  });
});

// curl -v -X DELETE -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 http://localhost:3000/1235/labels/EN
router.delete('/:lang',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res, next) {
  var lang = req.params.lang;
  winston.debug("lang: " + lang);


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
        winston.debug("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          var labelFound = label.data[foundIndex];
          if (labelFound.default === true) {
            return res.status(400).send({ success: false, msg: 'You can\'t delete the default language.' });
          }
          var idData = labelFound._id;
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

          labelEvent.emit('label.delete', savedLabel);

         
           req.url =  '/'+lang;
           winston.debug('--- > req.url'+req.url);
 
           req.method = 'GET';  
 
           return router.handle(req, res, next);
        });
      }
    });
});


// return all the project labels
router.get('/', async (req, res)  => {
 

  winston.debug("projectid", req.projectid);


   var labels = await labelService.getAll(req.projectid);
   winston.debug("labels",labels);
    
   if (!labels) {
    winston.warn('Label not found for projectid: ' + req.projectid);
    return res.json({});
  }

  return res.json(labels);
          
});





router.get('/:lang', async (req, res) => {
  // get a specific project language but if not found return Pivot
  var labels = await labelService.getLanguage(req.projectid, req.params.lang);
  return res.json(labels);

});


module.exports = router;
