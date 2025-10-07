let express = require('express');
let router = express.Router();
let Property = require("../models/property");
let winston = require('../config/winston');

router.post('/', function (req, res) {

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  let newProperty= new Property({
    label: req.body.label,
    name: req.body.name,
    type: req.body.type,
    id_project: req.projectid,
    createdBy: req.user._id,
  });

  newProperty.save(function(err, savedProperty) {
    if (err) {
      winston.error('Error saving the property '+ JSON.stringify(savedProperty), err)
      return reject(err);
    }            
    winston.verbose('Property created ', savedProperty.toJSON());

    res.json(savedProperty);
  });

});

router.put('/:propertyid', function (req, res) {
  winston.debug(req.body);
  let update = {};
  
  if (req.body.label!=undefined) {
    update.label = req.body.label;
  }
  
  if (req.body.name!=undefined) {
    update.name = req.body.name;
  }
  if (req.body.type!=undefined) {
    update.type = req.body.type;
  }
  if (req.body.status!=undefined) {
    update.status = req.body.status;
  }

  
  Property.findByIdAndUpdate(req.params.propertyid, update, { new: true, upsert: true }, function (err, updatedProperty) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }   
  
    res.json(updatedProperty);
  });
});




router.delete('/:propertyid', function (req, res) {
  winston.debug(req.body);

  Property.findByIdAndUpdate(req.params.propertyid, {status: 1000}, { new: true, upsert: true }, function (err, updatedProperty) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error updating object.' });
    }

    res.json(updatedProperty);
  });
});

router.delete('/:propertyid/physical', function (req, res) {
  winston.debug(req.body);

  let projectuser = req.projectuser;


  if (projectuser.role != "owner" ) {
    return res.status(403).send({ success: false, msg: 'Unauthorized.' });
  }
  
   Property.remove({ _id: req.params.propertyid }, function (err, property) {
    if (err) {
      winston.error('--- > ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error deleting object.' });
    }


    res.json(property);
  });
});



router.get('/:propertyid', function (req, res) {
  winston.debug(req.body);

  Property.findById(req.params.propertyid, function (err, property) {
    if (err) {
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!property) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(property);
  });
});


router.get('/', function (req, res) {

  let limit = 40; // Number of request per page

  if (req.query.limit) {    
    limit = parseInt(req.query.limit);
    winston.debug('property ROUTE - limit: '+limit);
  }

  let page = 0;

  if (req.query.page) {
    page = req.query.page;
  }

  let skip = page * limit;
  winston.debug('property ROUTE - SKIP PAGE ', skip);


  let query = { "id_project": req.projectid, "status": 100};

  if (req.query.name) {
    winston.debug('property ROUTE req.query.name', req.query.name);
    query.name = req.query.name;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  let direction = -1; //-1 descending , 1 ascending
  if (req.query.direction) {
    direction = req.query.direction;
  }

  let sortField = "createdAt";
  if (req.query.sort) {
    sortField = req.query.sort;
  }

  let sortQuery = {};
  sortQuery[sortField] = direction;

  winston.debug("sort query", sortQuery);  

  return Property.find(query).
    skip(skip).limit(limit).
    sort(sortQuery).
    exec(function (err, properties) {
      if (err) {
        winston.error('property ROUTE - REQUEST FIND ERR ', err)
        return (err);
      }
     
        return res.json(properties);
    });
});




module.exports = router;
