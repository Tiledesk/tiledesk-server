const EventEmitter = require('events');
var RoleConstants = require("../models/roleConstants");

class AuthEvent extends EventEmitter {
    constructor() {
        super();
        this.queueEnabled = false;
      }
}

const authEvent = new AuthEvent();

authEvent.on("project_user.update",  function(event) { 
      console.log("AuthEvent event ", event)
      if (event.updatedProject_userPopulated) {
        var pu = event.updatedProject_userPopulated;
        console.log("AuthEvent pu.roleType: ", pu.roleType)
        if (pu.roleType === RoleConstants.TYPE_AGENTS) {          
          authEvent.emit("project_user.update.agent", event);
        } else {
          authEvent.emit("project_user.update.user", event);
        }
      }
});

//listen for sigin and signup event

module.exports = authEvent;
