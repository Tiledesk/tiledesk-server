//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var projectService = require('../services/projectService');


describe('ProjectService()', function () {

  var userid = "5badfe5d553d1844ad654072";


  it('createProject', function (done) {

     projectService.create("test1", userid).then(function(savedProject) {
        console.log("createProject resolve");
         expect(savedProject.name).to.equal("test1");
        done();
    }).catch(function(err) {
        winston.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });
});


