var express = require('express');
var router = express.Router();
var Lead = require("../models/lead");
var LeadConstants = require("../models/leadConstants");
var winston = require('../config/winston');
var leadService = require("../services/leadService");
csv = require('csv-express');
csv.separator = ';';
const leadEvent = require('../event/leadEvent');
var Segment = require("../models/segment");
var Segment2MongoConverter = require("../utils/segment2mongoConverter");


router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  leadService.createWitId(req.body.lead_id, req.body.fullname, req.body.email, req.projectid, req.user.id, req.body.attributes).then(function(savedLead) {
    res.json(savedLead);
  })

});

router.put('/:leadid', function (req, res) {
  winston.debug(req.body);
  var update = {};
  
    if (req.body.fullname!=undefined) {
      update.fullname = req.body.fullname;
    }
    
    if (req.body.email!=undefined) {
      update.email = req.body.email;
    }
    if (req.body.attributes!=undefined) {
      update.attributes = req.body.attributes;
    }
    if (req.body.status!=undefined) {
      update.status = req.body.status;
    }


    if (req.body.phone!=undefined) {
      update.phone = req.body.phone;
    }
    if (req.body.company!=undefined) {
      update.company = req.body.company;
    }
    if (req.body.note!=undefined) {
      update.note = req.body.note;
    }
    
    if (req.body.streetAddress!=undefined) {
      update.streetAddress = req.body.streetAddress;
    }
    if (req.body.city!=undefined) {
      update.city = req.body.city;
    }
    if (req.body.region!=undefined) {
      update.region = req.body.region;
    }
    if (req.body.zipcode!=undefined) {
      update.zipcode = req.body.zipcode;
    }
    if (req.body.country!=undefined) {
      update.country = req.body.country;
    }  

    if (req.body.tags) {
      update.tags = req.body.tags;
    }
    

  
  Lead.findByIdAndUpdate(req.params.leadid, update, { new: true, upsert: true }, function (err, updatedLead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

  

    leadEvent.emit('lead.update', updatedLead);

    if (req.body.fullname!=undefined) {
      leadEvent.emit('lead.fullname.update', updatedLead);
    }
    
    if (req.body.email!=undefined) {
      leadEvent.emit('lead.email.update', updatedLead);
    }

    if (req.body.email!=undefined || req.body.fullname!=undefined) {
      leadEvent.emit('lead.fullname.email.update', updatedLead);
    }
  
    res.json(updatedLead);
  });
});



router.patch('/:leadid/attributes',  function (req, res) {
  var data = req.body;

  // TODO use service method

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

     if (!lead) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      
      if (!lead.attributes) {
        winston.debug("empty attributes")
        lead.attributes = {};
      }

      winston.debug(" lead attributes", lead.attributes)
        
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          winston.debug("data attributes "+key+" " +val)
          lead.attributes[key] = val;
        });     
        
        winston.debug(" lead attributes", lead.attributes)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        lead.markModified('attributes');

          //cacheinvalidation
          lead.save(function (err, savedLead) {
          if (err) {
            winston.error("error saving lead attributes",err)
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          winston.verbose(" saved lead attributes",savedLead.toObject())
          leadEvent.emit('lead.update', savedLead);

            res.json(savedLead);
        });
  });
  
});


//.post and .patch for /properties are equals

router.post('/:leadid/properties',  function (req, res) {
  var data = req.body;

  // TODO use service method

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

     if (!lead) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      
      if (!lead.properties) {
        winston.debug("empty properties")
        lead.properties = {};
      }

      winston.debug(" lead properties", lead.properties)
        
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          winston.debug("data attributes "+key+" " +val)
          lead.properties[key] = val;
        });     
        
        winston.debug(" lead properties", lead.properties)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        lead.markModified('properties');

          //cacheinvalidation
          lead.save(function (err, savedLead) {
          if (err) {
            winston.error("error saving lead properties",err)
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          winston.verbose(" saved lead properties",savedLead.toObject())
          leadEvent.emit('lead.update', savedLead);

            res.json(savedLead);
        });
  });
  
});


router.patch('/:leadid/properties',  function (req, res) {
  var data = req.body;

  // TODO use service method

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

     if (!lead) {
        return res.status(404).send({ success: false, msg: 'Object not found.' });
      }
      
      if (!lead.properties) {
        winston.debug("empty properties")
        lead.properties = {};
      }

      winston.debug(" lead properties", lead.properties)
        
        Object.keys(data).forEach(function(key) {
          var val = data[key];
          winston.debug("data attributes "+key+" " +val)
          lead.properties[key] = val;
        });     
        
        winston.debug(" lead properties", lead.properties)

        // https://stackoverflow.com/questions/24054552/mongoose-not-saving-nested-object
        lead.markModified('properties');

          //cacheinvalidation
          lead.save(function (err, savedLead) {
          if (err) {
            winston.error("error saving lead properties",err)
            return res.status(500).send({ success: false, msg: 'Error getting object.' });
          }
          winston.verbose(" saved lead properties",savedLead.toObject())
          leadEvent.emit('lead.update', savedLead);

            res.json(savedLead);
        });
  });
  
});



// router.put('/:leadid', function (req, res) {
//   winston.debug(req.body);
//   var update = {};
  
//   // trasforma in patch altrimenti nn va
//     update.fullname = req.body.fullname;
//     update.email = req.body.email;
//     update.attributes = req.body.attributes;
//     update.status = req.body.status;
  
  
//   Lead.findByIdAndUpdate(req.params.leadid, update, { new: true, upsert: true }, function (err, updatedLead) {
//     if (err) {
//       winston.error('--- > ERROR ', err);
//       return res.status(500).send({ success: false, msg: 'Error updating object.' });
//     }

  

//     leadEvent.emit('lead.update', updatedLead);
//     res.json(updatedLead);
//   });
// });

router.delete('/:leadid', function (req, res) {
  winston.debug(req.body);

  Lead.findByIdAndUpdate(req.params.leadid, {status: LeadConstants.DELETED}, { new: true, upsert: true }, function (err, updatedLead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

   

    leadEvent.emit('lead.delete', updatedLead);
    res.json(updatedLead);
  });
});

router.delete('/:leadid/physical', function (req, res) {
  winston.debug(req.body);

  var projectuser = req.projectuser;


  if (projectuser.role != "owner" ) {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  
   // TODO use findByIdAndRemove otherwise lead don't contains label object
  Lead.remove({ _id: req.params.leadid }, function (err, lead) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }

  
    leadEvent.emit('lead.delete', lead);

    res.json(lead);
  });
});


// DOWNLOAD leads AS CSV
router.get('/csv', function (req, res, next) {
  var limit = 100000; // Number of leads per page
  var page = 0;
  if (req.query.page) {
    page = req.query.page;
  }
  var skip = page * limit;
  winston.debug('LEAD ROUTE - SKIP PAGE ', skip);

  var query = { "id_project": req.projectid, "status": {$lt: LeadConstants.DELETED}};

  if (req.query.full_text) {
    winston.debug('LEAD ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.email) {
    winston.debug('LEAD ROUTE req.query.email', req.query.email);
    query.email = req.query.email;
  }

  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }
  winston.debug("direction", direction);

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }
  winston.debug("sortField", sortField);

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  // TODO ORDER BY SCORE
  // return Faq.find(query,  {score: { $meta: "textScore" } }) 
  // .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score


  // Lead.find({ "id_project": req.projectid }, function (err, leads, next) {
  return Lead.find(query, '-attributes -__v').
    skip(skip).limit(limit).
    sort(sortQuery).lean().
    exec(function (err, leads) {
      if (err) {
        winston.error('LEAD ROUTE - EXPORT CONTACT TO CSV ERR ', err)
        return next(err);
      }
      winston.verbose('LEAD ROUTE - EXPORT CONTACT TO CSV LEADS', leads)      
      
      return res.csv(leads, true);
    });
});

router.get('/:leadid', function (req, res) {
  winston.debug(req.body);

  Lead.findById(req.params.leadid, function (err, lead) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!lead) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(lead);
  });
});


router.get('/', async(req, res) => {

  var limit = 40; // Number of request per page

  if (req.query.limit) {    
    limit = parseInt(req.query.limit);
    winston.debug('LEAD ROUTE - limit: '+limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('LEAD ROUTE - SKIP PAGE ', skip);


  var query = {};


  if (req.query.segment) {
    let segment = await Segment.findOne({id_project: req.projectid, _id: req.query.segment }).exec();
    if (!segment) {
      return res.status(404).send({ success: false, msg: 'Error segment not found' });
    }
    Segment2MongoConverter.convert(query, segment);
  }
  
  if (req.query.full_text) {
    winston.debug('LEAD ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.email) {
    winston.debug('LEAD ROUTE req.query.email', req.query.email);
    query.email = req.query.email;
  }

  if (req.query.with_email) {  //for internal request and zapier to retrieve only lead with an email
    winston.debug('LEAD ROUTE req.query.withemail', req.query.withemail);
    query.email = { "$exists": true };
  }

  if (req.query.with_fullname) {  //or internal request to retrieve only lead with an email
    winston.debug('LEAD ROUTE req.query.withfullname', req.query.with_fullname);
    query.fullname = { "$exists": true };
  }

  // aggiungi filtro per data


  if (req.query.tags) {
    winston.debug('req.query.tags', req.query.tags);
    query["tags"] = req.query.tags;
  }


  // last query modifier
  query["id_project"] = req.projectid;
  query["status"] = LeadConstants.NORMAL;

  if (req.query.status) {
    query.status = req.query.status;
  }

  winston.debug("query", query);


  var direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }

  var sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }

  var sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);

  // TODO ORDER BY SCORE
  // return Faq.find(query,  {score: { $meta: "textScore" } }) 
  // .sort( { score: { $meta: "textScore" } } ) //https://docs.mongodb.com/manual/reference/operator/query/text/#sort-by-text-search-score


  // aggiungi filtro per data marco

  return Lead.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, leads) {
      if (err) {
        winston.error('LEAD ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }

      // blocked to 1000 TODO increases it
      //  collection.count is deprecated, and will be removed in a future version. Use Collection.countDocuments or Collection.estimatedDocumentCount instead
      return Lead.countDocuments(query, function (err, totalRowCount) {

        var objectToReturn = {
          perPage: limit,
          count: totalRowCount,
          leads: leads
        };

        return res.json(objectToReturn);
      });
    });
});




module.exports = router;
