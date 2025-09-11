//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var assert = require('chai').assert;
var config = require('../config/database');
var mongoose = require('mongoose');
var winston = require('../config/winston');

mongoose.connect(config.databasetest);

var projectService = require("../services/projectService");
const emailService = require('../services/emailService');

let log = false;

describe('EmailService', function () {


  it('direct', function (done) {
    var userid = "5badfe5d553d1844ad654072";
    projectService.create("test1", userid).then(function (savedProject) {
      // create(fullname, email, id_project, createdBy)

      let request_id = "support-group-" + savedProject._id + "-123456";

      //let text = "this is\n<b>the</b>\ntext";
      //let text = 'this is <script>alert("XSS")</script>';
      let text = 'Go to [Google](https://google.com)';
      emailService.sendEmailDirect("my@email.com", text, savedProject._id, request_id, "Suubject").then((response) => {
        console.log("response: ", response);
        done();
      }).catch((err) => {
        console.error("err: ", err)
        done();
      })

      
    });
  });

});