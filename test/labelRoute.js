//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.BRAND_NAME = 'MyCustomName'

var User = require('../models/user');
var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

chai.use(chaiHttp);

describe('LabelRoute', () => {

  describe('/clone', () => {
 
   

    it('clone', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test1", savedUser._id).then(function(savedProject) {

                chai.request(server)
                        .post('/'+ savedProject._id + '/labels/default/clone')
                        .auth(email, pwd)
                        .send({lang: "EN"})
                        .end((err, res) => {
                            console.log("err",  err);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject.id);     
                            expect(res.body.data[0].default).to.equal(true);
                            expect(res.body.data[0].lang).to.equal("EN");     

                        
                            done();
                        });

                        
                });
                });
                
    });




    it('cloneENAndGetByLanguageEN', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test1", savedUser._id).then(function(savedProject) {
    
                    chai.request(server)
                            .post('/'+ savedProject._id + '/labels/default/clone')
                            .auth(email, pwd)
                            .send({lang: "EN"})
                            .end((err, res) => {
                                //console.log("res",  res);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                expect(res.body.id_project).to.equal(savedProject.id);     
                                expect(res.body.data[0].default).to.equal(true);
                                expect(res.body.data[0].lang).to.equal("EN");  

                                chai.request(server)
                                .get('/'+ savedProject._id + '/labels/EN')
                                .auth(email, pwd)
                                .send()
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");     
                                    expect(res.body.default).to.equal(true);
                                    expect(res.body.lang).to.equal("EN");  
                                    done();
                                });
                            });
    
                            
                    });
                    });
                    
        });
    



        it('CloneENAndGetByLanguageIT', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "EN"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
                                    expect(res.body.data[0].default).to.equal(true);                                    
                                    expect(res.body.data[0].lang).to.equal("EN");     
    
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/labels/IT')
                                    .auth(email, pwd)
                                    .send()
                                    .end((err, res) => {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");     
                                        //expect(res.body.default).to.equal(false);
                                        expect(res.body.lang).to.equal("EN"); 
                                        done();
                                    });
                                });
        
                                
                        });
                        });
                        
            });




            it('cloneENAndGetByLanguageAR', (done) => {

        
                //   this.timeout();
            
                   var email = "test-signup-" + Date.now() + "@email.com";
                   var pwd = "pwd";
            
                    userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                        projectService.create("test1", savedUser._id).then(function(savedProject) {
            
                            chai.request(server)
                                    .post('/'+ savedProject._id + '/labels/default/clone')
                                    .auth(email, pwd)
                                    .send({lang: "EN"})
                                    .end((err, res) => {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                        expect(res.body.id_project).to.equal(savedProject.id);     
                                        expect(res.body.data[0].lang).to.equal("EN");    
                                        expect(res.body.data[0].default).to.equal(true); 
        
                                        chai.request(server)
                                        .get('/'+ savedProject._id + '/labels/AR')
                                        .auth(email, pwd)
                                        .send()
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body",  res.body);
                                            expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");    
                                            //expect(res.body.default).to.equal(false);
                                            expect(res.body.lang).to.equal("EN");  
                                            done();
                                        });
                                    });
            
                                    
                            });
                            });
                            
                });




                it('cloneARAndGetByLanguageAR', (done) => {

        
                    //   this.timeout();
                
                       var email = "test-signup-" + Date.now() + "@email.com";
                       var pwd = "pwd";
                
                        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                            projectService.create("test1", savedUser._id).then(function(savedProject) {
                
                                chai.request(server)
                                        .post('/'+ savedProject._id + '/labels/default/clone')
                                        .auth(email, pwd)
                                        .send({lang: "ARR"}) //not exists
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body",  res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                            expect(res.body.id_project).to.equal(savedProject.id);     
                                            expect(res.body.data[0].lang).to.equal("ARR");          
            
            
                                            chai.request(server)
                                            .get('/'+ savedProject._id + '/labels/ARR')
                                            .auth(email, pwd)
                                            .send()
                                            .end((err, res) => {
                                                //console.log("res",  res);
                                                console.log("res.body ar",  res.body);
                                                expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");  
                                                expect(res.body.lang).to.equal("ARR");   
                                                expect(res.body.default).to.equal(true);     
                                                done();
                                            });
                                        });
                
                                        
                                });
                                });
                                
                    });        




        // mocha test/labelRoute.js  --grep 'cloneITAndgetByLanguageEN'
        it('cloneITAndgetByLanguageEN', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
                                    expect(res.body.data[0].default).to.equal(true);
                                    expect(res.body.data[0].lang).to.equal("IT");     
    
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/labels/EN')
                                    .auth(email, pwd)
                                    .send()
                                    .end((err, res) => {
                                        //console.log("res",  res);
                                        console.log("res.body",  res.body);
                                        expect(res.body.data.LABEL_PLACEHOLDER).to.equal("Scrivi la tua domanda...");     
                                        expect(res.body.lang).to.equal("IT");                                         
                                        expect(res.body.default).to.equal(true);    
                                        done();
                                    });
                                });
        
                                
                        });
                        });
                        
            });






            // mocha test/labelRoute.js  --grep 'cloneITcloneENAndgetByLanguageEN'
        it('cloneITcloneENAndgetByLanguageEN', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
                                    expect(res.body.data[0].default).to.equal(true);
                                    expect(res.body.data[0].lang).to.equal("IT");     
    
                                            chai.request(server)
                                        .post('/'+ savedProject._id + '/labels/default/clone')
                                        .auth(email, pwd)
                                        .send({lang: "EN"})
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body en",  res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                            expect(res.body.id_project).to.equal(savedProject.id);     
                                            expect(res.body.data[1].default).to.equal(false);
                                            expect(res.body.data[1].lang).to.equal("EN");     
            
                                            chai.request(server)
                                            .get('/'+ savedProject._id + '/labels/EN')
                                            .auth(email, pwd)
                                            .send()
                                            .end((err, res) => {
                                                //console.log("res",  res);
                                                console.log("res.body",  res.body);
                                                expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message..");  
                                                expect(res.body.lang).to.equal("EN");                                                    
                                                expect(res.body.default).to.equal(false);    
                                                done();
                                            });
                                        });
                                        
                                 
                                });
        
                                
                        });
                        });
                        
            });






            // mocha test/labelRoute.js  --grep 'cloneITAndgetByLanguageEN'
        it('cloneITcloneENModifyENAndgetByLanguageEN', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
    
    
                                            chai.request(server)
                                        .post('/'+ savedProject._id + '/labels/default/clone')
                                        .auth(email, pwd)
                                        .send({lang: "EN"})
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body",  res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                            expect(res.body.id_project).to.equal(savedProject.id);     
            


                                            var modifiedEN = {"lang":"EN","data":{"LABEL_PLACEHOLDER":"type your message modified..","LABEL_START_NW_CONV":"New conversation","LABEL_FIRST_MSG":"Describe shortly your problem, you will be contacted by an agent.","LABEL_FIRST_MSG_NO_AGENTS":"🤔 All operators are offline at the moment. You can anyway describe your problem. It will be assigned to the support team who will answer you as soon as possible.","LABEL_FIRST_MSG_OPERATING_HOURS_CLOSED":"🤔 Our offices are closed. You can anyway describe your problem. It will be assigned to the support team who will answer you as soon as possible.","LABEL_SELECT_TOPIC":"Select a topic","LABEL_COMPLETE_FORM":"Complete the form to start a conversation with the next available agent.","LABEL_FIELD_NAME":"Name","LABEL_ERROR_FIELD_NAME":"Required field (minimum 5 characters).","LABEL_FIELD_EMAIL":"Email","LABEL_ERROR_FIELD_EMAIL":"Enter a valid email address.","LABEL_WRITING":"is writing...","AGENT_NOT_AVAILABLE":" Offline","AGENT_AVAILABLE":" Online","GUEST_LABEL":"Guest","ALL_AGENTS_OFFLINE_LABEL":"All operators are offline at the moment","LABEL_LOADING":"Loading...","CALLOUT_TITLE_PLACEHOLDER":"Need Help?","CALLOUT_MSG_PLACEHOLDER":"Click here and start chatting with us!","CUSTOMER_SATISFACTION":"Customer satisfaction","YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE":"your opinion on our customer service","DOWNLOAD_TRANSCRIPT":"Download transcript","BACK":"Back","YOUR_RATING":"your rating","WRITE_YOUR_OPINION":"Write your opinion ... (optional)","SUBMIT":"Submit","THANK_YOU_FOR_YOUR_EVALUATION":"Thank you for your evaluation","YOUR_RATING_HAS_BEEN_RECEIVED":"your rating has been received","ALERT_LEAVE_CHAT":"Do you want to leave the chat?","YES":"Yes","NO":"No","BUTTON_CLOSE_TO_ICON":"Minimize chat","BUTTON_EDIT_PROFILE":"Update profile","BUTTON_DOWNLOAD_TRANSCRIPT":"Download transcript","RATE_CHAT":"Rate chat","WELLCOME_TITLE":"Hi, welcome to Tiledesk 👋","WELLCOME_MSG":"How can we help?","WELLCOME":"Welcome","OPTIONS":"options","SOUND_OFF":"sound off","SOUND_ON":"sound on","LOGOUT":"logout","CLOSE":"close","PREV_CONVERSATIONS":"Your conversations","YOU":"You","SHOW_ALL_CONV":"show all","START_A_CONVERSATION":"Start a conversation","NO_CONVERSATION":"No conversation","SEE_PREVIOUS":"see previous","WAITING_TIME_FOUND":"The team typically replies in ","WAITING_TIME_NOT_FOUND":"The team will reply as soon as possible","CLOSED":"CLOSED"}};

                                            chai.request(server)
                                            .post('/'+ savedProject._id + '/labels')
                                            .auth(email, pwd)
                                            .send(modifiedEN)
                                            .end((err, res) => {
                                                //console.log("res",  res);
                                                console.log("res.body",  res.body);
                                                res.should.have.status(200);
                                                res.body.should.be.a('object');
                                                // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                
    
                                                
                
                                                chai.request(server)
                                                .get('/'+ savedProject._id + '/labels/EN')
                                                .auth(email, pwd)
                                                .send()
                                                .end((err, res) => {
                                                    //console.log("res",  res);
                                                    console.log("res.body",  res.body);
                                                    expect(res.body.data.LABEL_PLACEHOLDER).to.equal("type your message modified..");     
                                                    done();
                                                });
                                            });




                                        });
                                        
                                 
                                });
        
                                
                        });
                        });
                        
            });







            // mocha test/labelRoute.js  --grep 'cloneITAndgetByLanguageEN'
        it('cloneITcloneENAndgetByLanguageFR', (done) => {

        
            //   this.timeout();
        
               var email = "test-signup-" + Date.now() + "@email.com";
               var pwd = "pwd";
        
                userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                    projectService.create("test1", savedUser._id).then(function(savedProject) {
        
                        chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    //console.log("res",  res);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                    expect(res.body.id_project).to.equal(savedProject.id);     
    
    
                                            chai.request(server)
                                        .post('/'+ savedProject._id + '/labels/default/clone')
                                        .auth(email, pwd)
                                        .send({lang: "EN"})
                                        .end((err, res) => {
                                            //console.log("res",  res);
                                            console.log("res.body",  res.body);
                                            res.should.have.status(200);
                                            res.body.should.be.a('object');
                                            // expect(res.body.jwtSecret).to.not.equal(null);                                                                              
                                            expect(res.body.id_project).to.equal(savedProject.id);     
            
            
                                            chai.request(server)
                                            .get('/'+ savedProject._id + '/labels/FR')
                                            .auth(email, pwd)
                                            .send()
                                            .end((err, res) => {
                                                //console.log("res",  res);
                                                console.log("res.body",  res.body);
                                                expect(res.body.data.LABEL_PLACEHOLDER).to.equal("Scrivi la tua domanda...");     
                                                done();
                                            });
                                        });
                                        
                                 
                                });
        
                                
                        });
                        });
                        
            });

});




describe('/update', () => {
 
   
// mocha test/labelRoute.js  --grep 'update'
    it('updateENforClonedEN', (done) => {

        
    //   this.timeout();

       var email = "test-signup-" + Date.now() + "@email.com";
       var pwd = "pwd";

        userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
            projectService.create("test1", savedUser._id).then(function(savedProject) {

                chai.request(server)
                        .post('/'+ savedProject._id + '/labels/default/clone')
                        .auth(email, pwd)
                        .send({lang: "EN"})
                        .end((err, res) => {
                            console.log("err",  err);
                            console.log("res.body",  res.body);
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.id_project).to.equal(savedProject.id);     
                            expect(res.body.data[0].default).to.equal(true);
                            expect(res.body.data[0].lang).to.equal("EN");     


                            chai.request(server)
                            .post('/'+ savedProject._id + '/labels/')
                            .auth(email, pwd)
                            .send({lang: "EN", default:true, data: {PIPPO: "pippo", PLUTO: "pluto"}})
                            .end((err, res) => {
                                console.log("err",  err);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.data.PIPPO).to.equal( "pippo");
                                expect(res.body.data.PLUTO).to.equal( "pluto");
                                expect(res.body.default).to.equal( true);
                        
                                chai.request(server)
                                    .get('/'+ savedProject._id + '/labels/')
                                    .auth(email, pwd)
                                    .send({})
                                    .end((err, res) => {
                                        console.log("err",  err);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.data[0].lang).to.equal("EN");     
                                        expect(res.body.data[0].default).to.equal(true);
                                        
                                        done();
                                    });
                               
                        });

                        
                });
                });
                
       });

    });



    // mocha test/labelRoute.js  --grep 'update'
    it('updateARforClonedEN', (done) => {

        
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test1", savedUser._id).then(function(savedProject) {
    
                    chai.request(server)
                            .post('/'+ savedProject._id + '/labels/default/clone')
                            .auth(email, pwd)
                            .send({lang: "EN"})
                            .end((err, res) => {
                                console.log("err",  err);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_project).to.equal(savedProject.id);     
                                expect(res.body.data[0].default).to.equal(true);
                                expect(res.body.data[0].lang).to.equal("EN");     
    
    
                                chai.request(server)
                                .post('/'+ savedProject._id + '/labels/')
                                .auth(email, pwd)
                                .send({lang: "AR", default:true, data: {PIPPO: "pippo", PLUTO: "pluto"}})
                                .end((err, res) => {
                                    console.log("err",  err);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.data.PIPPO).to.equal( "pippo");
                                    expect(res.body.data.PLUTO).to.equal( "pluto");
                                    expect(res.body.default).to.equal( true);
                            
                                    chai.request(server)
                                    .get('/'+ savedProject._id + '/labels/')
                                    .auth(email, pwd)
                                    .send({})
                                    .end((err, res) => {
                                        console.log("err",  err);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.data[0].lang).to.equal("EN");     
                                        expect(res.body.data[0].default).to.equal(false);
                                        expect(res.body.data[1].lang).to.equal("AR");     
                                        expect(res.body.data[1].default).to.equal(true);
                                        done();
                                    });
                            });
    
                            
                    });
                    });
                    
           });
    
        });





        
    

});










describe('/patch', () => {
 
   
    // mocha test/labelRoute.js  --grep 'patchdefaultENforClonedENanIT'
        it('patchdefaultENforClonedENanIT', (done) => {
    
            
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test1", savedUser._id).then(function(savedProject) {
    
                    chai.request(server)
                            .post('/'+ savedProject._id + '/labels/default/clone')
                            .auth(email, pwd)
                            .send({lang: "EN"})
                            .end((err, res) => {
                                console.log("err",  err);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_project).to.equal(savedProject.id);     
                                expect(res.body.data[0].default).to.equal(true);
                                expect(res.body.data[0].lang).to.equal("EN");     


                                chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    console.log("err",  err);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.id_project).to.equal(savedProject.id);     
                                    expect(res.body.data[0].default).to.equal(true);
                                    expect(res.body.data[0].lang).to.equal("EN");  
                                    expect(res.body.data[1].default).to.equal(false);
                                    expect(res.body.data[1].lang).to.equal("IT");     
    
    
                                    chai.request(server)
                                    .patch('/'+ savedProject._id + '/labels/IT/default')
                                    .auth(email, pwd)
                                    .send({})
                                    .end((err, res) => {
                                        console.log("err",  err);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        
                                        expect(res.body.default).to.equal( true);
                                        done();                                      
                                    
                                });
                            });
    
                            
                    });
                    });
                    
           });
    
        });

    });



describe('/delete', () => {
   
    // mocha test/labelRoute.js  --grep 'deletedforClonedENanIT'
    it('deletedforClonedENanIT', (done) => {
    
            
        //   this.timeout();
    
           var email = "test-signup-" + Date.now() + "@email.com";
           var pwd = "pwd";
    
            userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
                projectService.create("test1", savedUser._id).then(function(savedProject) {
    
                    chai.request(server)
                            .post('/'+ savedProject._id + '/labels/default/clone')
                            .auth(email, pwd)
                            .send({lang: "EN"})
                            .end((err, res) => {
                                console.log("err",  err);
                                console.log("res.body",  res.body);
                                res.should.have.status(200);
                                res.body.should.be.a('object');
                                expect(res.body.id_project).to.equal(savedProject.id);     
                                expect(res.body.data[0].default).to.equal(true);
                                expect(res.body.data[0].lang).to.equal("EN");     


                                chai.request(server)
                                .post('/'+ savedProject._id + '/labels/default/clone')
                                .auth(email, pwd)
                                .send({lang: "IT"})
                                .end((err, res) => {
                                    console.log("err",  err);
                                    console.log("res.body",  res.body);
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.id_project).to.equal(savedProject.id);     
                                    expect(res.body.data[0].default).to.equal(true);
                                    expect(res.body.data[0].lang).to.equal("EN");  
                                    expect(res.body.data[1].default).to.equal(false);
                                    expect(res.body.data[1].lang).to.equal("IT");     
    
    
                                    chai.request(server)
                                    .delete('/'+ savedProject._id + '/labels/')
                                    .auth(email, pwd)
                                    .send({})
                                    .end((err, res) => {
                                        console.log("err",  err);
                                        console.log("res.body",  res.body);
                                        res.should.have.status(200);
                                        res.body.should.be.a('object');
                                        expect(res.body.deletedCount).to.equal(1);     
                                        
                                        chai.request(server)
                                        .get('/'+ savedProject._id + '/labels/')
                                        .auth(email, pwd)
                                        .send({})
                                        .end((err, res) => {
                                            console.log("err",  err);
                                            console.log("res.body",  res.body);
                                            res.should.have.status(200);
                                            expect(res.body).to.deep.equal({});    
                                            
                                            
                                            done();                                      
                                        
                                        });

                                    
                                    });
                            });
    
                            
                    });
                    });
                    
           });
    
        });







     // mocha test/labelRoute.js  --grep 'deleteITforClonedENanIT'
     it('deleteITforClonedENanIT', (done) => {
            
        //   this.timeout();
    
        var email = "test-signup-" + Date.now() + "@email.com";
        var pwd = "pwd";
 
         userService.signup( email ,pwd, "Test Firstname", "Test lastname").then(function(savedUser) {
             projectService.create("test1", savedUser._id).then(function(savedProject) {
 
                 chai.request(server)
                         .post('/'+ savedProject._id + '/labels/default/clone')
                         .auth(email, pwd)
                         .send({lang: "EN"})
                         .end((err, res) => {
                             console.log("err",  err);
                             console.log("res.body",  res.body);
                             res.should.have.status(200);
                             res.body.should.be.a('object');
                             expect(res.body.id_project).to.equal(savedProject.id);     
                             expect(res.body.data[0].default).to.equal(true);
                             expect(res.body.data[0].lang).to.equal("EN");     


                             chai.request(server)
                             .post('/'+ savedProject._id + '/labels/default/clone')
                             .auth(email, pwd)
                             .send({lang: "IT"})
                             .end((err, res) => {
                                 console.log("err",  err);
                                 console.log("res.body",  res.body);
                                 res.should.have.status(200);
                                 res.body.should.be.a('object');
                                 expect(res.body.id_project).to.equal(savedProject.id);     
                                 expect(res.body.data[0].default).to.equal(true);
                                 expect(res.body.data[0].lang).to.equal("EN");  
                                 expect(res.body.data[1].default).to.equal(false);
                                 expect(res.body.data[1].lang).to.equal("IT");     
 
 
                                 chai.request(server)
                                 .delete('/'+ savedProject._id + '/labels/IT')
                                 .auth(email, pwd)
                                 .send({})
                                 .end((err, res) => {
                                     console.log("err",  err);
                                     console.log("res.body",  res.body);
                                     res.should.have.status(200);
                                     res.body.should.be.a('object');
                                     expect(res.body.lang).to.equal("EN");    
                                     
                                     chai.request(server)
                                     .get('/'+ savedProject._id + '/labels/')
                                     .auth(email, pwd)
                                     .send({})
                                     .end((err, res) => {
                                         console.log("err",  err);
                                         console.log("res.body",  res.body);

                                         res.should.have.status(200);
                                         res.body.should.be.a('object');
                                         expect(res.body.data[0].lang).to.equal("EN");    
                                         
                                         
                                         done();                                      
                                     
                                     });

                                 
                                 });
                         });
 
                         
                 });
                 });
                 
        });
 
     });

    });



});


