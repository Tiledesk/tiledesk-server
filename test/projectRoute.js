//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = "admin@tiledesk.com";

let log = false;
var projectService = require('../services/projectService');
var userService = require('../services/userService');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
var fs = require('fs');
const path = require('path');

// chai.config.includeStack = true;

var expect = chai.expect;
var assert = chai.assert;

let operatingHours = '{"1":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],"2":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],"3":[{"start":"09:00","end":"11:00"},{"start":"14:00","end":"18:00"}],"4":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],"5":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],"tzname":"Europe/Rome"}';
let timeSlotsSample = {
    "819559cc": {
        name: "Slot1",
        active: true,
        //hours: "{\"1\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"3\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"5\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"tzname\":\"America/Los_Angeles\"}"
        hours: "{\"1\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"3\":[{\"start\":\"09:00\",\"end\":\"15:00\"},{\"start\":\"17:00\",\"end\":\"18:00\"}],\"5\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"tzname\":\"Europe/Rome\"}"
    },
    "5d4368de": {
        name: "Slot2",
        active: true,
        hours: "{\"0\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"6\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"tzname\":\"Europe/Rome\"}"
    },
    "2975ec45": {
        name: "Slot3",
        active: false,
        hours: "{\"0\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"6\":[{\"start\":\"09:00\",\"end\":\"13:00\"},{\"start\":\"14:00\",\"end\":\"18:00\"}],\"tzname\":\"Europe/Rome\"}"
    }
}



chai.use(chaiHttp);

describe('ProjectRoute', () => {

    describe('/create', () => {

        it('updateProjectProfileWithSuperAdminCredential', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .post('/auth/signin')
                        .send({ email: "admin@tiledesk.com", password: "adminadmin" })
                        .end((err, res) => {

                            if (log) { console.log("login with superadmin res.body: ", res.body) };
                            res.should.have.status(200);
                            res.body.should.be.a('object');
                            expect(res.body.success).to.equal(true);
                            expect(res.body.token).not.equal(null);

                            let superadmin_token = res.body.token;

                            chai.request(server)
                                // .put('/projects/' + savedProject._id + "/update")
                                .put('/projects/' + savedProject._id)
                                .set('Authorization', superadmin_token)
                                .send({ profile: { name: "Custom", quotes: { kbs: 1000 } } })
                                .end((err, res) => {

                                    if (log) { console.log("update project profile res.body: ", res.body) };
                                    res.should.have.status(200);
                                    res.body.should.be.a('object');
                                    expect(res.body.profile.name).to.equal("Custom");
                                    // expect(res.body.profile.quotes.kbs).to.equal(1000);

                                    done();
                                })
                        })
                })
            })
        }).timeout(10000)

        it('denyUpdateProjectProfile', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        .put('/projects/' + savedProject._id)
                        // .put('/projects/' + savedProject._id + "/update")
                        .auth(email, pwd)
                        .send({ profile: { name: "Custom", quotes: { kbs: 1000 } } })
                        .end((err, res) => {

                            if (log) { console.log("update project profile res.body: ", res.body) };
                            res.should.have.status(403);
                            expect(res.body.success).to.equal(false);
                            expect(res.body.error).to.equal("You don't have the permission required to modify the project profile");
                            done();
                        })
                })
            })
        }).timeout(10000)




        it('updateProjectTimeSlots', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        // .put('/projects/' + savedProject._id + "/update")
                        .put('/projects/' + savedProject._id)
                        .auth(email, pwd)
                        .send({ timeSlots: timeSlotsSample })
                        .end((err, res) => {

                            if (log) { console.log("update project time slots res.body: ", res.body) };
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            done();
                        })
                })
            })
        }).timeout(10000)

        it('isOpenTimeSlot', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        // .put('/projects/' + savedProject._id + "/update")
                        .put('/projects/' + savedProject._id)
                        .auth(email, pwd)
                        .send({ timeSlots: timeSlotsSample })
                        .end((err, res) => {

                            if (log) { console.log("update project time slots res.body: ", res.body) };
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .get('/projects/' + savedProject._id + '/isopen?timeSlot=819559cc')
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body isopen: ", res.body) };

                                    // Unable to do other checks due to currentTime change.
                                    res.should.have.status(200);

                                    done();

                                })
                        })


                })
            })
        }).timeout(10000)

        it('isOpenOperatingHours', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        // .put('/projects/' + savedProject._id + "/update")
                        .put('/projects/' + savedProject._id)
                        .auth(email, pwd)
                        .send({ activeOperatingHours: true, operatingHours: operatingHours })
                        .end((err, res) => {

                            if (log) { console.log("update project time slots res.body: ", res.body) };
                            console.log("update project time slots res.body: ", res.body)
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .get('/projects/' + savedProject._id + '/isopen')
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body isopen: ", res.body) };
                                    console.log("res.body isopen: ", res.body)

                                    // Unable to do other checks due to currentTime change.
                                    res.should.have.status(200);

                                    done();

                                })
                        })


                })
            })
        }).timeout(10000)

        it('utcChecker', (done) => {

            var email = "test-signup-" + Date.now() + "@email.com";
            var pwd = "pwd";

            userService.signup(email, pwd, "Test Firstname", "Test Lastname").then((savedUser) => {
                projectService.create("test-project-create", savedUser._id).then((savedProject) => {

                    chai.request(server)
                        // .put('/projects/' + savedProject._id + "/update")
                        .put('/projects/' + savedProject._id)
                        .auth(email, pwd)
                        .send({ timeSlots: timeSlotsSample })
                        .end((err, res) => {

                            if (log) { console.log("update project time slots res.body: ", res.body) };
                            res.should.have.status(200);
                            res.body.should.be.a('object');

                            chai.request(server)
                                .get('/projects/' + savedProject._id + '/isopen?timeSlot=819559cc')
                                .auth(email, pwd)
                                .end((err, res) => {

                                    if (err) { console.error("err: ", err) };
                                    if (log) { console.log("res.body isopen: ", res.body) };

                                    // Unable to do other checks due to currentTime change.
                                    res.should.have.status(200);

                                    done();

                                })
                        })


                })
            })
        }).timeout(10000)

    });

});


