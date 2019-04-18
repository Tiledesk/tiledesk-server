//During the test the env variable is set to test
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
let should = chai.should();
var messageService = require('../services/messageService');
var requestService = require('../services/requestService');


var Bot = require('../models/bot');
var Trigger = require('../models/trigger');
var Condition = require('../models/condition');

var rulesTrigger = require('../rules/rulesTrigger');


var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');

var leadService = require('../services/leadService');
var winston = require('../config/winston');

// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('BotRules', () => { 
   

    it('create', (done) => {
       
        var email = "test-botrules-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-botrules", savedUser._id).then(function(savedProject) {    
                    


                var b = new Bot({
                    name: 'test',
                    description: 'test desc',
                    id_project: savedProject._id,
                    trigger: new Trigger({key:'request.create',name:'request create', description: 'request create descr'}),
                    conditions:{ all: new Condition({fact: 'first_text', operator:'equal', value: 'first message'})},
                    enabled:true,
                    createdBy: savedUser._id,
                    updatedBy: savedUser._id
                    });

                    b.save(function (err, sb) {
                        winston.info('bot',sb.toObject(),err);
                        expect(sb.name).to.equal("test");
                        expect(sb.trigger.key).to.equal("request.create");
                        expect(sb.conditions.all[0].fact).to.equal("first_text");
                        expect(sb.conditions.all[0].operator).to.equal("equal");

                        rulesTrigger.listen();
                        leadService.createIfNotExists("leadfullname-botrules", "andrea.leo@-botrules.it", savedProject._id).then(function(createdLead) {
                            requestService.createWithId("request_id-botrules", createdLead._id, savedProject._id, "first message").then(function(savedRequest) {                            
                                    expect(savedRequest.request_id).to.equal("request_id-botrules");   
                                    done(); 
                                });
                            });

                       
                            
                    });

                    });
                });
           
                 
           

        }).timeout(20000);






});
