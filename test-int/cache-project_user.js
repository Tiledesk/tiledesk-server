
process.env.NODE_ENV = 'test';


//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
var projectService = require('../services/projectService');
var userService = require('../services/userService');
let should = chai.should();
var Project_user = require("../models/project_user");

var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');

//end server client

chai.use(chaiHttp);

describe('Cache', () => {

  if (process.env.CACHE_ENABLED == "true") {
    
  }else {
      console.log("Cache disabled");
      expect(true).to.equal(false); 
  }
  
  describe('/project_user', () => {
 
   
    // mocha test-int/bot.js  --grep 'createSimpleExatMatch'
    it('getCurrentProjectUser', (done) => {
       
        var email = "test-bot-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
       

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-getCurrentProjectUser", savedUser._id).then(function(savedProject) {    
               
                                        chai.request(server)
                                        .get('/'+ savedProject._id + '/project_users_test/test')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')
                                        .send()
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.role).to.equal("owner"); 
                                            expect(res.body.isAuthenticated).to.equal(true); 
                                            expect(res.body.id_project).to.equal(savedProject._id.toString()); 
                                            
                                           
                                        chai.request(server)
                                        .get('/'+ savedProject._id + '/project_users_test/test')
                                        .auth(email, pwd)
                                        .set('content-type', 'application/json')        //from cache
                                        .send()
                                        .end((err, res) => {
                                            console.log("res.body",  JSON.stringify(res.body));
                                            // console.dir("res.body 1",  res.body);
                                            console.log("res.headers",  res.headers);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            expect(res.body.role).to.equal("owner"); 
                                            expect(res.body.isAuthenticated).to.equal(true); 
                                            expect(res.body.id_project).to.equal(savedProject._id.toString()); 
                                            
                                            done()
                                        });
            });
        });
        });

    });
  });

});