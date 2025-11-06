const EventEmitter = require('events');
var RoleConstants = require("../models/roleConstants");

class AuthEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
      }
}

const authEvent = new AuthEvent();

 var projectuserUpdateKey = 'project_user.update';
if (process.env.QUEUE_ENABLED === "true") {
  projectuserUpdateKey = 'project_user.update.queue';
}

authEvent.on(projectuserUpdateKey,  function(event) { 
      if (event.updatedProject_userPopulated) {
        var pu = event.updatedProject_userPopulated;
        if (pu.roleType === RoleConstants.TYPE_AGENTS) {          
          authEvent.emit("project_user.update.agent", event);
        } else {
          authEvent.emit("project_user.update.user", event);
        }
      }
});

//listen for sigin and signup event

module.exports = authEvent;
