//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');

mongoose.connect(config.databasetest);

var labelService = require('../services/labelService');
var projectService = require("../services/projectService");
require('../services/mongoose-cache-fn')(mongoose);

describe('labelService', function () {


  it('getWithoutClonedLabel', function (done) {
    var userid = "5badfe5d553d1844ad654072";

    projectService.create("test1", userid).then(function (savedProject) {

      // get(id_project, language, key) {
      labelService.get(savedProject._id, "EN", "LABEL_PLACEHOLDER").then(function (label) {

        expect(label).to.equal("type your message..");

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('getITLanguageButNotPresentInProject', function (done) {
    var userid = "5badfe5d553d1844ad654072";

    projectService.create("test1", userid).then(function (savedProject) {

      // get(id_project, language, key) {
      labelService.get(savedProject._id, "IT", "LABEL_PLACEHOLDER").then(function (label) {

        expect(label).to.equal("type your message..");

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('getWrongLanguage', function (done) {
    var userid = "5badfe5d553d1844ad654072";

    projectService.create("test1", userid).then(function (savedProject) {

      // get(id_project, language, key) {
      labelService.get(savedProject._id, "OO", "LABEL_PLACEHOLDER").then(function (label) {

        expect(label).to.equal("type your message..");

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('getLanguage', function (done) {
    var userid = "5badfe5d553d1844ad654072";

    projectService.create("test1", userid).then(function (savedProject) {

      // getLanguage(id_project, language) {
      labelService.getLanguage(savedProject._id, "EN").then(function (labels) {

        expect(labels.data.LABEL_PLACEHOLDER).to.equal("type your message..");

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


  it('getLanguageWrongLang', function (done) {
    var userid = "5badfe5d553d1844ad654072";

    projectService.create("test1", userid).then(function (savedProject) {

      // getLanguage(id_project, language) {
      labelService.getLanguage(savedProject._id, "XX").then(function (labels) {

        expect(labels.data.LABEL_PLACEHOLDER).to.equal("type your message..");

        done();
      }).catch(function (err) {
        winston.error("test reject", err);
        assert.isNotOk(err, 'Promise error');
        done();
      });
    });
  });


});


