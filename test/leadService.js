//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');

mongoose.connect(config.databasetest);

var leadService = require('../services/leadService');
var projectService = require("../services/projectService");

let log = false;

describe('LeadService()', function () {

  var userid = "5badfe5d553d1844ad654072";

  it('create', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      var attr = { myprop: 123 };
      leadService.create("fullname", "email@email.com", savedProject._id, userid, attr).then(function (savedLead) {
        winston.debug("resolve", savedLead.toObject());
        expect(savedLead.fullname).to.equal("fullname");
        expect(savedLead.email).to.equal("email@email.com");
        expect(savedLead.id_project).to.equal(savedProject._id.toString());
        expect(savedLead.lead_id).to.not.equal(null);
        expect(savedLead.attributes).to.equal(attr);
        expect(savedLead.attributes.myprop).to.equal(123);

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('update', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      var attr = { myprop: 123 };
      leadService.create("fullname", "email@email.com", savedProject._id, userid, attr).then(function (savedLead) {
        winston.debug("resolve", savedLead.toObject());
        expect(savedLead.fullname).to.equal("fullname");
        expect(savedLead.email).to.equal("email@email.com");
        expect(savedLead.id_project).to.equal(savedProject._id.toString());
        expect(savedLead.lead_id).to.not.equal(null);
        expect(savedLead.attributes).to.equal(attr);
        expect(savedLead.attributes.myprop).to.equal(123);

        //  updateWitId(lead_id, fullname, email, id_project) {

        leadService.updateWitId(savedLead.lead_id, "fullname2", "email2@email2.com", savedProject._id).then(function (updatedLead) {

          expect(updatedLead.fullname).to.equal("fullname2");
          expect(updatedLead.email).to.equal("email2@email2.com");
          expect(updatedLead.id_project).to.equal(savedProject._id.toString());
          expect(updatedLead.lead_id).to.not.equal(savedLead.id);

          done();
        }).catch(function (err) {
          winston.error("test reject", err);
          assert.isNotOk(err, 'Promise error');
          done();
        });
      });
    });
  });


  it('createWithoutEmail', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      leadService.create("fullname", null, savedProject._id, userid).then(function (savedLead) {
        winston.debug("resolve", savedLead.toObject());
        expect(savedLead.fullname).to.equal("fullname");
        expect(savedLead.email).to.equal(null);
        expect(savedLead.id_project).to.equal(savedProject._id.toString());
        expect(savedLead.lead_id).to.not.equal(null);
        expect(savedLead.attributes).to.equal(undefined);
        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('createIfNotExists-already-exists', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      leadService.create("fullname", "email@email.com", savedProject._id, userid).then(function (savedLead) {
        if (log) { console.log("savedLead", savedLead); }
        leadService.createIfNotExists("fullname", "email@email.com", savedProject._id, userid).then(function (savedLeadIfNotExists) {
          if (log) { console.log("savedLeadIfNotExists", savedLeadIfNotExists); }
          expect(savedLead.fullname).to.equal("fullname");
          expect(savedLead.email).to.equal("email@email.com");
          expect(savedLead.id_project).to.equal(savedProject._id.toString());
          expect(savedLeadIfNotExists._id.toString()).to.equal(savedLead._id.toString());
          expect(savedLeadIfNotExists.lead_id).to.not.equal(null);

          done();
        }).catch(function (err) {
          winston.error("test reject", err);
          assert.isNotOk(err, 'Promise error');
          done();
        });

      });
    });
  });


  it('createIfNotExists-not-exists', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      leadService.createIfNotExists("fullname2", "email2@email.com", savedProject._id, userid).then(function (savedLeadIfNotExists) {
        if (log) { console.log("savedLeadIfNotExists", savedLeadIfNotExists); }
        expect(savedLeadIfNotExists.fullname).to.equal("fullname2");
        expect(savedLeadIfNotExists.email).to.equal("email2@email.com");
        expect(savedLeadIfNotExists.id_project).to.equal(savedProject._id.toString());
        expect(savedLeadIfNotExists.lead_id).to.not.equal(null);

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });


    });
  });


  it('createIfNotExistsWithId-already-exists', function (done) {
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)
      var lead_id = "lead_id_" + savedProject._id;
      leadService.createWitId(lead_id, "fullname", "email@email.com", savedProject._id, userid).then(function (savedLead) {
        if (log) { console.log("savedLead", savedLead); }
        leadService.createIfNotExistsWithLeadId(lead_id, "fullname", "email@email.com", savedProject._id, userid).then(function (savedLeadIfNotExists) {
          if (log) { console.log("savedLeadIfNotExists", savedLeadIfNotExists); }
          expect(savedLead.fullname).to.equal("fullname");
          expect(savedLead.email).to.equal("email@email.com");
          expect(savedLead.lead_id).to.equal(lead_id);
          expect(savedLead.id_project).to.equal(savedProject._id.toString());
          expect(savedLeadIfNotExists._id.toString()).to.equal(savedLead._id.toString());
          expect(savedLeadIfNotExists.lead_id).to.equal(lead_id);

          done();
        }).catch(function (err) {
          winston.error("test reject", err);
          assert.isNotOk(err, 'Promise error');
          done();
        });

      });
    });
  });

});


