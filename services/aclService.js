
var winston = require('../config/winston');
var Request = require('../models/request');
var cacheUtil = require("../utils/cacheUtil");
var cacheEnabler = require("../services/cacheEnabler");



let ACL_CONTROL_ENABLED = false;
if (process.env.ACL_CONTROL_ENABLED == true || process.env.ACL_CONTROL_ENABLED == "true") {
  ACL_CONTROL_ENABLED = true;
}
winston.info("Access control list (ACL) control enabled : " + ACL_CONTROL_ENABLED);



class ACLService {

    constructor() {
    }

    addACLQuery(query, currentUser, minPermission) {
        if (ACL_CONTROL_ENABLED === false) {
        return;
        }
        query["$or"] = [{"acl.other": {"$gte": minPermission}}, { "snapshot.agents.id_user": currentUser.id, "acl.group": {"$gte": minPermission}}, { "participants": currentUser.id, "acl.user": {"$gte": minPermission} }];
    }

    async can(user_id, minPermission, request_id, project_id) {
         if (ACL_CONTROL_ENABLED === false) {
            return true;
        }

        var query = {request_id: request_id, id_project: project_id};
        winston.debug("can query",query);

        var q =  Request.findOne(query).select("+snapshot.agents");

        winston.debug("cacheUtil.defaultTTL", cacheUtil.defaultTTL)
        if (cacheEnabler.request) {
            q.cache(cacheUtil.defaultTTL, project_id + ":requests:request_id:" + request_id + ":simple")      //request_cache
            winston.debug('request cache enabled');
        }

        var request = await q.exec();
        winston.debug('can request', request);

        return this.canWithRequest(user_id, minPermission, request);
    }
    async canWithRequest(user_id, minPermission, request) {
        if (ACL_CONTROL_ENABLED === false) {
            return true;
        }

        winston.debug("acl: user_id: " + user_id);
        winston.debug("acl: request: ", request);
        winston.debug("acl: minPermission: " + minPermission);
        winston.debug("acl: " + request.acl.user + request.acl.group + request.acl.other);

        // delete request.snapshot;
        var snapshotAgents = request.snapshot.agents;
        winston.debug("acl: snapshotAgents before ", snapshotAgents);

        if (snapshotAgents == undefined) {
            winston.info("acl: snapshotAgents is empty. Load it from db");
            // snapshotAgents = await request.populate("+snapshot.agents");
             var requestWithSelect = await Request.findById(request.id).select("+snapshot.agents").exec();
            //TODO add cache hereeeee      
            winston.debug("acl: requestWithSelect",requestWithSelect);
            snapshotAgents = requestWithSelect.snapshot.agents
        }
        winston.debug("acl: snapshotAgents: ", snapshotAgents);

        var agentFound = snapshotAgents.filter((a) => {
            winston.debug("typeof agent.id_user", typeof a.id_user.toString())
            if (a.id_user.toString() === user_id) {
                return true;
            } else {
                return false;
            }
         });
        winston.debug("acl: agentFound: ", agentFound);
//  if (agentFound) {
// console.log("found ")
//  }else {
// console.log("not found ")
//  }
// console.log("request.acl.other ",request.acl.other )

// if (request.acl.other >= minPermission) {
// console.log("acl max equ ")
// } else {
// console.log("acl min ")
// }
        if(request.participants && request.participants.indexOf(user_id)>-1 && request.acl.user >= minPermission) {
            winston.verbose("acl: User " + user_id + " can handle with permission " + minPermission + " request with id " + request.request_id + ".It is a user participant  ", request.participants );
            return true;
        } else if (agentFound.length>0 && request.acl.group >= minPermission) {
            winston.verbose("acl: User " + user_id + " can handle with permission " + minPermission + " request with id " + request.request_id + ". It is a group member");
            return true;
        } else if (request.acl.other >= minPermission) {
            winston.verbose("acl: User " + user_id + " can handle with permission " + minPermission + " request with id " + request.request_id + ".It is other ");
            return true;
        } else {
            winston.verbose("acl: User " + user_id + " can't handle with permission " + minPermission + " request with id " + request.request_id);
            return false;
        }
    }
}

var aclService = new ACLService();

// setTimeout(function() {
// if (aclService.can("6821fc203ce0764c1b23a76a", 4,"req123456", "68d4135a10e71f7bfa4dcf2f")) {

// }
// }, 20000);
// (user_id, minPermission, request_id, project_id) {


module.exports = aclService;