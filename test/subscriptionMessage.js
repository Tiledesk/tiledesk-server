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

var expect = chai.expect;
var assert = chai.assert;

//server client
var express = require('express');
const bodyParser = require('body-parser');


// var http = require('http');
// const { parse } = require('querystring');

//end server client

chai.use(chaiHttp);

describe('Subscription', () => {

  describe('/messages', () => {
 
   

    it('create', (done) => {
       
        var email = "test-subscription-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
        // console.log("server", server);
        // console.log("server.port", server.get('port'));

         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test-subscription", savedUser._id).then(function(savedProject) {    
                chai.request(server)
                .post('/'+ savedProject._id + '/subscriptions')
                .auth(email, pwd)
                .set('content-type', 'application/json')
                .send({"event":"message.create", "target":"http://localhost:3003/"})
                .end((err, res) => {
                    console.log("res.body",  res.body);
                    console.log("res.headers",  res.headers);
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    expect(res.body.event).to.equal("message.create"); 
                    var secret = res.body.secret;
                    expect(secret).to.not.equal(null);                     
                    expect(res.headers["x-hook-secret"]).to.equal(secret); 
                    
                    // server.post('subscriptions-test-unit', function (req, res) {
                    //     done();
                    //   });

                    var serverClient = express();
                    serverClient.use(bodyParser.json());
                    //serverClient.use(express.bodyParser());
                    serverClient.post('/', function (req, res) {
                        console.log('serverClient req', req.body);                        
                        expect(req.body.hook.event).to.equal("message.create");
                        // expect(req.body.data.sender).to.equal(savedUser._id);
                        // console.log('serverClient req2');                       
                        // console.log('serverClient req3');
                        res.send('POST request to the homepage');
                        //serverClient.close(function () { console.log('Server closed!'); });
                        // console.log('serverClient req4');
                        done();
                        // console.log('serverClient req5');
                                             
                      });
                      var listener = serverClient.listen(3003, '0.0.0.0', function(){ console.log('Node js Express started', listener.address());});


                    messageService.create(savedUser._id, "test sender", "testrecipient-createMessage", "hello",
                    savedProject._id, savedUser._id).then(function(savedMessage){
                        expect(savedMessage.text).to.equal("hello");


                       

                    //     var serverClient = http.createServer( function(req, res) {
                    //         console.log("serverClient"); 
                    //         var body = '';
                    //         req.on('data', function (data) {
                    //             body += data;
                    //         });     
                    //         req.on('end', function () {
                    //             console.log("Body: " + body);
                    //         });
                    //         expect(body.event).to.equal("message.create");
                    //         res.writeHead(200, {'Content-Type': 'application/json'});
                    //         res.end('post received');
                    //         serverClient.close(function () { console.log('Server closed!'); });


                    //         done();
                    // });

                    //serverClient.listen("3003", "127.0.0.4");
                    //serverClient.listen("3003");

                        
                    });
                
                });
            });
        });
        }).timeout(20000);
    });
    
    






    // describe('/update', () => {
 
   

    //     it('update', (done) => {
           
    //         var email = "test-subscription-" + Date.now() + "@email.com";
    //         var pwd = "pwd";
     
    //          userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
    //              projectService.create("test-subscription", savedUser._id).then(function(savedProject) {    
    //                 chai.request(server)
    //                 .post('/'+ savedProject._id + '/subscriptions')
    //                 .auth(email, pwd)
    //                 .send({"event":"message.update", "target":"http://localhost:3000/"})
    //                 .end((err, res) => {
    //                     console.log("res.body",  res.body);
    //                     res.should.have.status(200);
    //                     res.body.should.be.a('object');
    //                     expect(res.body.event).to.equal("message.update"); 
    
    //                     // console.log("server", server);
    //                     // server.post('subscriptions-test-unit', function (req, res) {
    //                     //     done();
    //                     //   });
    
    //                     messageService.create(savedUser._id, "test sender", "testrecipient-createMessage", "hello",
    //                     savedProject._id, savedUser._id).then(function(savedMessage){
    //                         Message.findByIdAndUpdate(savedMessage._id, {text: "hello2"}, { new: true, upsert: false }, function (err, modMessage) {
    //                             console.log("modMessage", modMessage);
    //                             expect(modMessage.text).to.equal("hello2");
    //                             done();
    //                         });
    //                     });
                    
    //                 });
    //             });
    //         });
    
    //     });


    // });


});
