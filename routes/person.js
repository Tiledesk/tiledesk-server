var express = require('express');
var router = express.Router();
var Person = require("../models/person");



router.post('/', function(req, res) {

  console.log(req.body);
  var newPerson = new Person({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newPerson.save(function(err, savedPerson) {
    if (err) {
      console.log('--- > ERROR ', err)
      return res.status(500).send({success: false, msg: 'Error saving object.'});
    }
    res.json(savedPerson);
  });
});

router.put('/:personid', function(req, res) {
  
    console.log(req.body);
    
    Person.findByIdAndUpdate(req.params.personid, req.body, {new: true, upsert:true}, function(err, updatedPerson) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error updating object.'});
      }
      res.json(updatedPerson);
    });
  });


  router.delete('/:personid', function(req, res) {
  
    console.log(req.body);
    
    Person.remove({_id:req.params.personid}, function(err, person) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error deleting object.'});
      }
      res.json(person);
    });
  });


  router.get('/:personid', function(req, res) {
  
    console.log(req.body);
    
    Person.findById(req.params.personid, function(err, person) {
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }
      if(!person){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      res.json(person);
    });
  });



router.get('/', function(req, res) {

  Person.find(function (err, people) {
      if (err) return next(err);
      res.json(people);
    });
});

module.exports = router;
