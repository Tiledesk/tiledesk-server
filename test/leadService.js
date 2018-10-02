//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// require('./controllers/todo.controller.test.js');
var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');

mongoose.connect(config.databasetest);

var leadService = require('../services/leadService');
var projectService = require("../services/projectService");

describe('LeadService()', function () {

  var userid = "5badfe5d553d1844ad654072";


  it('create', function (done) {
    projectService.create("test1", userid).then(function(savedProject) {
    // create(fullname, email, id_project, createdBy)
     leadService.create("fullname", "email@email.com", savedProject._id, userid).then(function(savedLead) {
        console.log("resolve", savedLead);
         expect(savedLead.fullname).to.equal("fullname");
         expect(savedLead.email).to.equal("email@email.com");
         expect(savedLead.id_project).to.equal(savedProject._id.toString());
         expect(savedLead.lead_id).to.not.equal(null);

        done();
    }).catch(function(err) {
        console.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });
  });



  it('createIfNotExists-already-exists', function (done) {
    projectService.create("test1", userid).then(function(savedProject) {
    // create(fullname, email, id_project, createdBy)
     leadService.create("fullname", "email@email.com", savedProject._id, userid).then(function(savedLead) {
      console.log("savedLead", savedLead);
      leadService.createIfNotExists("fullname", "email@email.com", savedProject._id, userid).then(function(savedLeadIfNotExists) {
        console.log("savedLeadIfNotExists", savedLeadIfNotExists);
         expect(savedLead.fullname).to.equal("fullname");
         expect(savedLead.email).to.equal("email@email.com");
         expect(savedLead.id_project).to.equal(savedProject._id.toString());
         expect(savedLeadIfNotExists._id.toString()).to.equal(savedLead._id.toString());
         expect(savedLeadIfNotExists.lead_id).to.not.equal(null);

        done();
    }).catch(function(err) {
        console.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });

   });
  });
  });



  it('createIfNotExists-not-exists', function (done) {
    projectService.create("test1", userid).then(function(savedProject) {
    // create(fullname, email, id_project, createdBy)
 
    
    leadService.createIfNotExists("fullname2", "email2@email.com", savedProject._id, userid).then(function(savedLeadIfNotExists) {
      console.log("savedLeadIfNotExists", savedLeadIfNotExists);
       expect(savedLeadIfNotExists.fullname).to.equal("fullname2");
       expect(savedLeadIfNotExists.email).to.equal("email2@email.com");
       expect(savedLeadIfNotExists.id_project).to.equal(savedProject._id.toString());
       expect(savedLeadIfNotExists.lead_id).to.not.equal(null);

      done();
    }).catch(function(err) {
      console.error("test reject", err);
      assert.isNotOk(err,'Promise error');
      done();
  });

  
  });
  });








});


