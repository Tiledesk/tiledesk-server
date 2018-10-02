'use strict';

var Lead = require("../models/lead");
var mongoose = require('mongoose');

class LeadService {


  createIfNotExists(fullname, email, id_project, createdBy) {
    var that = this;
    return Lead.findOne({email: email, id_project: id_project}, function(err, lead)  {
        if (err) {
          return that.create(fullname, email, id_project, createdBy);
        }
        if (!lead) {
          return that.create(fullname, email, id_project, createdBy);
        }
        return lead;
    
    });
  }

  create(fullname, email, id_project, createdBy) {

    return new Promise(function (resolve, reject) {

    
      var newLead = new Lead({
        fullname: fullname,
        email: email,
        id_project: id_project,
        createdBy: createdBy,
        updatedBy: createdBy
      });
    
      newLead.save(function(err, savedLead) {
        if (err) {
          console.error('Error saving the lead '+ JSON.stringify(newLead), err)
          return reject(err);
          // return res.status(500).send({success: false, msg: 'Error saving the lead '+ JSON.stringify(newLead)});
        }
        // if (!savedLead) {
        //   console.log('lead not found', newLead);
        //   // return res.status(404).send({success: false, msg: 'lead not found' + JSON.stringify(newLead)});

        // }
        return resolve(savedLead);
      });
    });

  

  }

}
var leadService = new LeadService();


module.exports = leadService;
