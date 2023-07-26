'use strict';

var Lead = require("../models/lead");
const uuidv4 = require('uuid/v4');
const leadEvent = require('../event/leadEvent');
var winston = require('../config/winston');
var cacheUtil = require('../utils/cacheUtil');
var cacheEnabler = require("../services/cacheEnabler");


class LeadService {


  findByEmail(email, id_project) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return Lead.findOne({email: email, id_project: id_project})
      //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, id_project+":leads:email:"+email)  //lead_cache
      .exec(function(err, lead)  {
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

 


  createIfNotExists(fullname, email, id_project, createdBy, attributes, status) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.findByEmail(email, id_project).then(function(lead) {
      // return Lead.findOne({email: email, id_project: id_project}, function(err, lead)  {         
          if (!lead) {
            return resolve(that.create(fullname, email, id_project, createdBy, attributes, status));
          }
          return resolve(lead);
      
      }).catch(function(err) {
        return resolve(that.create(fullname, email, id_project, createdBy, attributes, status));
      })
    });
  }

  
  create(fullname, email, id_project, createdBy, attributes, status) {
    return this.createWitId(null, fullname, email, id_project, createdBy, attributes, status);
  }



  createIfNotExistsWithLeadId(lead_id, fullname, email, id_project, createdBy, attributes, status) {
    var that = this;
    return new Promise(function (resolve, reject) {
      return Lead.findOne({lead_id: lead_id, id_project: id_project})
        //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, id_project+":leads:lead_id:"+lead_id) //lead_cache
        .exec(function(err, lead)  {
          if (err) {
            winston.error("Error createIfNotExistsWithLeadId", err);
            return resolve(that.createWitId(lead_id, fullname, email, id_project, createdBy, attributes, status));
          }
          if (!lead) {
            return resolve(that.createWitId(lead_id, fullname, email, id_project, createdBy, attributes, status));
          }

          winston.debug("lead.email: " + lead.email); 
          winston.debug("email: " + email); 
          
          if (lead.email == email) {
            winston.debug("lead already exists createIfNotExistsWithLeadId with the same email");
            return resolve(lead);
          } else {
            winston.debug("lead already exists createIfNotExistsWithLeadId but with different email");
            return resolve(that.updateWitId(lead_id, fullname, email, id_project, status));
          }
          
      
      });
    });
  }


  updateStatusWitId(lead_id, id_project, status) {
    winston.debug("lead_id: "+ lead_id);
    winston.debug("id_project: "+ id_project);
    winston.debug("status: "+ status);

    return new Promise(function (resolve, reject) {

    var update = {};

    update.status = status;

    
      Lead.findOneAndUpdate({lead_id:lead_id}, update, { new: true, upsert: true }, function (err, updatedLead) {
        if (err) {
          winston.error('Error updating lead ', err);
          return reject(err);
        }

      
        leadEvent.emit('lead.update', updatedLead);
        return resolve(updatedLead);
      });
    });
  }

  updateWitId(lead_id, fullname, email, id_project, status) {
    winston.debug("updateWitId lead_id: "+ lead_id);
    winston.debug("fullname: "+ fullname);
    winston.debug("email: "+ email);
    winston.debug("id_project: "+ id_project);
    winston.debug("status: "+ status);

    return new Promise(function (resolve, reject) {

    var update = {};

    update.fullname = fullname;
    update.email = email;
    
    if (status) {
      update.status = status;
    }
    

    
      Lead.findOneAndUpdate({lead_id:lead_id}, update, { new: true, upsert: true }, function (err, updatedLead) {
        if (err) {
          winston.error('Error updating lead ', err);
          return reject(err);
        }

      
        leadEvent.emit('lead.update', updatedLead);
        leadEvent.emit('lead.email.update', updatedLead);
        leadEvent.emit('lead.fullname.update', updatedLead);
        leadEvent.emit('lead.fullname.email.update', updatedLead);
        return resolve(updatedLead);
      });
    });
  }

  createWitId(lead_id, fullname, email, id_project, createdBy, attributes, status) {

    if (!createdBy) {
      createdBy = "system";
    }

    if (!lead_id) {
      lead_id = uuidv4();
    }

    return new Promise(function (resolve, reject) {

            var newLead = new Lead({
              lead_id: lead_id,
              fullname: fullname,
              email: email,
              attributes: attributes,
              status: status,
              id_project: id_project,
              createdBy: createdBy,
              updatedBy: createdBy
            });
          
            newLead.save(function(err, savedLead) {
              if (err) {
                winston.error('Error saving the lead '+ JSON.stringify(newLead), err)
                return reject(err);
              }            
              winston.verbose('Lead created ', newLead.toJSON());

              leadEvent.emit('lead.create', newLead);
              return resolve(savedLead);
            });
        });


  }

}
var leadService = new LeadService();


module.exports = leadService;
