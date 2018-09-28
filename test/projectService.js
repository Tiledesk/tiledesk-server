//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// require('./controllers/todo.controller.test.js');
var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');

// var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

var projectService = require('../services/projectService');


describe('ProjectService()', function () {
  it('createProject', function (done) {

     projectService.create("test1", "5badfe5d553d1844ad654072").then(function(savedProject) {
        console.log("createProject resolve");
         expect(savedProject.name).to.equal("test1");
        done();
    }).catch(function(err) {
        console.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });
});


