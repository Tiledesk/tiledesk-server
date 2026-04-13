'use strict';

var Request = require("../models/request");
const requestEvent = require('../event/requestEvent');
var winston = require('../config/winston');

class UpdateRequestSnapshotQueued {

  constructor() {
    // this.listen();
  }

  listen() {
    this.updateRequestSnapshot();
    winston.info("Listening UpdateRequestSnapshotQueued started")
  }

  updateRequestSnapshot() {
    let snapshotUpdateKey = 'request.snapshot.update';
    if (requestEvent.queueEnabled) {
      snapshotUpdateKey = 'request.snapshot.update.queue';
    }
    winston.debug("snapshotUpdateKey: " + snapshotUpdateKey);

    requestEvent.on(snapshotUpdateKey, function (data) {
      setImmediate(() => {
        winston.debug("updateRequestSnapshot on request.snapshot.update ", data);
        console.log("updateRequestSnapshot on request.snapshot.update ", data);

        const request = data.request;
        const snapshot = data.snapshot;
        const agentsArray = snapshot?.agents || [];
        console.log("(queue) updateRequestSnapshot snapshot agents length: ", agentsArray.length);

        if (!request || !request.request_id || !request.id_project) {
          winston.error("updateRequestSnapshot: Invalid request data", data);
          return;
        }

        // If there is no agents array in snapshot or it's not actually an array, skip the update
        if (!Array.isArray(agentsArray)) {
          winston.error("updateRequestSnapshot: snapshot.agents is not an array.", snapshot);
          return;
        }

        const query = { request_id: request.request_id, id_project: request.id_project };
        winston.debug("updateRequestSnapshot query ", query);

        // Update ONLY the snapshot.agents field, presupposing 'snapshot' document already exists
        Request.findOneAndUpdate(
          query, 
          { "$set": { "snapshot.agents": agentsArray } }, 
          { new: true },
          function (err, updatedRequest) {
            if (err) {
              winston.error("Error updating request snapshot.agents in updateRequestSnapshot", err);
              return;
            }
            if (updatedRequest) {
              console.log("updateRequestSnapshot updated snapshot.agents for request " + updatedRequest.request_id, new Date());
              winston.debug("updateRequestSnapshot updated snapshot.agents for request " + updatedRequest.request_id);
            } else {
              winston.warn("updateRequestSnapshot: Request not found for " + request.request_id);
            }
            return;
          }
        );
      });
    });
  }
}

var updateRequestSnapshotQueued = new UpdateRequestSnapshotQueued();

module.exports = updateRequestSnapshotQueued;

