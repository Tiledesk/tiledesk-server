process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const should = chai.should();
chai.use(chaiHttp);

const userService = require("../services/userService");
const projectService = require("../services/projectService");

describe('Permissions', () => {
    
    it('default role owner: permission_test_create should return 200', async () => {
        console.log("test-permissions-1");
        const email = "test-permissions-" + Date.now() + "@email.com";
        const pwd = "pwd";

        try {
            const savedUser = await userService.signup(email, pwd, "Test Firstname", "Test Lastname");
            const savedProject = await projectService.create("test-project-create-1", savedUser._id);

            const createRes = await chai.request(server)
                .post('/' + savedProject._id + '/permissions/create')
                .auth(email, pwd)
                .send({ name: 'sample_name' });

            console.log("createRes.body", createRes.body);
            createRes.should.have.status(200);



        } catch(err) {
            console.error("err: ", err);
            throw err;
        }
    })

    it('default role owner: permission_test_create should return 200', async () => {
        console.log("test-permissions-1");
        const email = "test-permissions-" + Date.now() + "@email.com";
        const pwd = "pwd";

        const agentEmail = "test-permissions-agent-" + Date.now() + "@email.com";
        const agentPwd = "pwd";

        try {
            const savedUser = await userService.signup(email, pwd, "Test Firstname", "Test Lastname");
            const savedUserAgent = await userService.signup(agentEmail, agentPwd, "Test Agent Firstname", "Test Agent Lastname");
            const savedProject = await projectService.create("test-project-create-1", savedUser._id);

            const inviteRes = await chai.request(server)
                .post('/' + savedProject._id + '/project_users/invite')
                .auth(email, pwd)
                .send({ email: agentEmail, role: "agent" });

            inviteRes.should.have.status(200);

            const createRes = await chai.request(server)
                .post('/' + savedProject._id + '/permissions/create')
                .auth(agentEmail, agentPwd)
                .send({ name: 'sample_name' });

            console.log("createRes.body", createRes.body);
            createRes.should.have.status(403);



        } catch(err) {
            console.error("err: ", err);
            throw err;
        }
    })

    // it('default role agent: permission_test_create should return 401', async () => {
    //     console.log("test-permissions-1");
    //     const email = "test-permissions-" + Date.now() + "@email.com";
    //     const pwd = "pwd";

    //     const agentEmail = "test-permissions-agent-" + Date.now() + "@email.com";
    //     const agentPwd = "pwd";

    //     try {
    //         const savedUser = await userService.signup(email, pwd, "Test Firstname", "Test Lastname");
    //         const savedUserAgent = await userService.signup(agentEmail, agentPwd, "Test Agent Firstname", "Test Agent Lastname");
    //         const savedProject = await projectService.create("test-project-create-1", savedUser._id);

    //         const inviteRes = await chai.request(server)
    //             .post('/' + savedProject._id + '/project_users/invite')
    //             .auth(email, pwd)
    //             .send({ email: agentEmail, role: "agent" });

    //         console.log("inviteRes.body", inviteRes.body);
    //         inviteRes.should.have.status(200);

    //         const res = await chai.request(server)
    //             .get('/' + savedProject._id + '/project_users')
    //             .auth(agentEmail, agentPwd);

    //         console.log("res.body", res.body);
    //         res.should.have.status(401);

    //     } catch(err) {
    //         console.error("err: ", err);
    //         throw err;
    //     }
    // })

})