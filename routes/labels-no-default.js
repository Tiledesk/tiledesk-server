let express = require('express');
let router = express.Router({mergeParams: true});
let Label = require("../models/label");
let winston = require('../config/winston');
let passport = require('passport');
require('../middleware/passport')(passport);
let validtoken = require('../middleware/valid-token')
let roleChecker = require('../middleware/has-role')
let labelService = require("../services/labelService");
let labelEvent = require("../event/labelEvent");
let mongoose = require('mongoose');

const { check, validationResult } = require('express-validator');


let Schema = mongoose.Schema,
   ObjectId = Schema.ObjectId;



router.get('/default', function (req, res) {
  
  res.json(req.labels);
 
});
// curl -v -X POST -H 'Content-Type:application/json'  -d '{"lang":"IT"}' http://localhost:3000/123/labels/default/clone

router.post('/default/clone', 
[passport.authenticate(['basic', 'jwt'], { session: false }), 
validtoken, 
roleChecker.hasRole('admin'),
check('lang').notEmpty(),  
],function (req, res, next) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


  let lang = req.body.lang;
  winston.debug("lang: " + lang);
  
  let pickedLang = req.labels.find(l => l.lang === lang);

  if (!pickedLang){
    let pickedLangPivot = req.labels.find(l => l.lang === "EN");
    pickedLangPivot.lang = lang;
    pickedLang = pickedLangPivot;
  }
  let newLabel = pickedLang;
  winston.debug("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        label = new Label({          
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id,        
          data: [newLabel]
        });
      }else {
        let foundIndex = -1;
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
  let pickedLang = req.labels.find(l => l.lang === req.params.lang);

  res.json(pickedLang);
});



// curl -v -X POST -H 'Content-Type:application/json' -u andrea.leo@f21.it:123456 -d '{"lang":"FR", "data":{"a":"b","c":"d"}}' http://localhost:3000/4321/labels/

router.post('/',  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRole('admin')],function (req, res, next) {
 
  let lang = req.body.lang;
  winston.debug("lang: " + lang);



  let newLabel = {lang: lang, data: req.body.data};
  winston.debug("newLabel: " ,newLabel);

  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        label = new Label({          
          id_project: req.projectid,
          createdBy: req.user.id,
          updatedBy: req.user.id,          
          data: [newLabel]
        });
      }else {
        let foundIndex = -1;
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
  let lang = req.params.lang;
  winston.debug("lang: " + lang);


  Label.findOne({id_project:req.projectid}, function(err, label) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    } else {
      if (!label) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }else {
        let foundIndex = -1;
        label.data.forEach(function(l, index){
            if (l.lang == lang ) {
              foundIndex = index;
            }
        });
        winston.debug("foundIndex: " + foundIndex);
        if (foundIndex>-1) {
          let idData = label.data[foundIndex]._id;
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


// return all the project labels merging db with widget.json
router.get('/', function (req, res) {
 
  let query = { "id_project": req.projectid};

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
        // let dataAsObj = {...req.labels, ...labels.data }
        // let data = Object.values(dataAsObj);
        req.labels.forEach(elementDef => {
          let pickedLang = labels.data.find(l => l.lang === elementDef.lang);
          if (!pickedLang) {
            returnval.data.push(elementDef);
          }
        });
      
      }
      
      winston.debug("returnval",returnval);
    
        return res.json(returnval);
      
    });
});





router.get('/:lang', async (req, res) => {
  // get a specific project language merged with default (widget.json) but if not found return Pivot
  let labels = await labelService.getAllByLanguage(req.projectid, req.params.lang);
  return res.json(labels);

});


module.exports = router;
