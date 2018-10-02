var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Lead = require("../models/lead");



router.post('/', function(req, res) {

  console.log(req.body);
  console.log("req.user",req.user);

  var newLead = new Lead({
    fullname: req.body.fullname,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newLead.save(function(err, savedLead) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({success: false, msg: 'Error saving object.'});
    }
    res.json(savedLead);
  });
});

router.put('/:leadid', function(req, res) {
  
    console.log(req.body);
    
    Lead.findByIdAndUpdate(req.params.leadid, req.body, {new: true, upsert:true}, function(err, updatedLead) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error updating object.'});
      }
      res.json(updatedLead);
    });
  });


  router.delete('/:leadid', function(req, res) {
  
    console.log(req.body);
    
    Lead.remove({_id:req.params.leadid}, function(err, lead) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error deleting object.'});
      }
      res.json(lead);
    });
  });


  router.get('/:leadid', function(req, res) {
  
    console.log(req.body);
    
    Lead.findById(req.params.leadid, function(err, lead) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }
      if(!Lead){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      res.json(lead);
    });
  });



router.get('/', function(req, res) {

    Lead.find({ "id_project": req.projectid },function (err, leads) {
      if (err) return next(err);
      res.json(leads);
    });
});

module.exports = router;
