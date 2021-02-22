var express = require('express');
var router = express.Router();
var Lead = require("../models/lead");
var LeadConstants = require("../models/leadConstants");
var winston = require('../config/winston');
var leadService = require("../services/leadService");
csv = require('csv-express');
csv.separator = ';';
const leadEvent = require('../event/leadEvent');


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
    res.json(updatedLead);
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

  // Lead.find({ "id_project": req.projectid }, function (err, leads, next) {
  return Lead.find(query, '-attributes -__v').
    skip(skip).limit(limit).
    sort(sortQuery).lean().
    exec(function (err, leads) {
      if (err) {
        winston.error('LEAD ROUTE - EXPORT CONTACT TO CSV ERR ', err)
        return next(err);
      }
      winston.error('LEAD ROUTE - EXPORT CONTACT TO CSV LEADS', leads)      
      
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


router.get('/', function (req, res) {

  var limit = 40; // Number of request per page

  if (req.query.limit) {    
    limit = parseInt(req.query.limit);
    winston.info('LEAD ROUTE - limit: '+limit);
  }

  var page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  var skip = page * limit;
  winston.debug('LEAD ROUTE - SKIP PAGE ', skip);


  var query = { "id_project": req.projectid, "status": LeadConstants.NORMAL};

  if (req.query.full_text) {
    winston.debug('LEAD ROUTE req.query.fulltext', req.query.full_text);
    query.$text = { "$search": req.query.full_text };
  }

  if (req.query.email) {
    winston.debug('LEAD ROUTE req.query.email', req.query.email);
    query.email = req.query.email;
  }

  // if (req.query.withemail) {  //for zapier to retrieve only lead with an email
  //   winston.debug('LEAD ROUTE req.query.withemail', req.query.withemail);
  //   query.email = { "$$exists": true };
  // }

  if (req.query.status) {
    query.status = req.query.status;
  }

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
      return Lead.count(query, function (err, totalRowCount) {

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
