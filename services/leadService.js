'use strict';

var Lead = require("../models/lead");
//var mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
//var Auth = require("../models/auth");
const leadEvent = require('../event/leadEvent');
var winston = require('../config/winston');


class LeadService {


  findByEmail(email, id_project) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return Lead.findOne({email: email, id_project: id_project}, function(err, lead)  {
          if (err) {
            return reject(err);
          }
          if (!lead) {
            return resolve(null);
          }
          return resolve(lead);
      
      });
    });
  }

 


  createIfNotExists(fullname, email, id_project, createdBy, attributes) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return Lead.findOne({email: email, id_project: id_project}, function(err, lead)  {
          if (err) {
            return resolve(that.create(fullname, email, id_project, createdBy, attributes));
          }
          if (!lead) {
            return resolve(that.create(fullname, email, id_project, createdBy, attributes));
          }
          return resolve(lead);
      
      });
    });
  }

  
  create(fullname, email, id_project, createdBy, attributes) {
    return this.createWitId(null, fullname, email, id_project, createdBy, attributes);
  }



  createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy, attributes) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return Lead.findOne({lead_id: lead_id, id_project: id_project}, function(err, lead)  {
          if (err) {
            winston.error("Error createIfNotExistsWithLeadId", err);
            return resolve(that.createWitId(lead_id, fullname, email, id_project, createdBy, attributes));
          }
          if (!lead) {
            return resolve(that.createWitId(lead_id, fullname, email, id_project, createdBy, attributes));
          }
          winston.debug("lead already exists createIfNotExistsWithLeadId");
          return resolve(lead);
      
      });
    });
  }

  
  createWitId(lead_id, fullname, email, id_project, createdBy, attributes) {

    if (!createdBy) {
      createdBy = "system";
    }

    if (!lead_id) {
      lead_id = uuidv4();
    }

    return new Promise(function (resolve, reject) {

      // var auth = new Auth({
      //   password: password
      // });
      // auth.save(function (err, authSaved) {
      //   if (err) {
      //       return reject(err);
      //   }

            var newLead = new Lead({
              lead_id: lead_id,
              fullname: fullname,
              email: email,
              attributes: attributes,
              id_project: id_project,
              createdBy: createdBy,
              updatedBy: createdBy
            });
          
            newLead.save(function(err, savedLead) {
              if (err) {
                winston.error('Error saving the lead '+ JSON.stringify(newLead), err)
                return reject(err);
                // return res.status(500).send({success: false, msg: 'Error saving the lead '+ JSON.stringify(newLead)});
              }
              // if (!savedLead) {
              //   console.log('lead not found', newLead);
              //   // return res.status(404).send({success: false, msg: 'lead not found' + JSON.stringify(newLead)});

              // }
              winston.info('Lead created ', newLead.toJSON());

              leadEvent.emit('lead.create', newLead);
              return resolve(savedLead);
            });
        });




        // });
  

  }

}
var leadService = new LeadService();


module.exports = leadService;
