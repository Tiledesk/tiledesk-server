//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let expect = require('chai').expect;

let assert = require('chai').assert;
let config = require('../config/database');
let mongoose = require('mongoose');
let winston = require('../config/winston');

let log = false;

// let databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
// if (!databaseUri) {
//   console.log('DATABASE_URI not specified, falling back to localhost.');
// }

// mongoose.connect(databaseUri || config.database);
mongoose.connect(config.databasetest);

let projectService = require('../services/projectService');


describe('ProjectService()', function () {

  let userid = "5badfe5d553d1844ad654072";


  it('createProject', function (done) {

     projectService.create("test1", userid).then(function(savedProject) {
        if (log) { console.log("createProject resolve"); }
         expect(savedProject.name).to.equal("test1");
        done();
    }).catch(function(err) {
        winston.error("test reject", err);
        assert.isNotOk(err,'Promise error');
        done();
    });
  });
});


