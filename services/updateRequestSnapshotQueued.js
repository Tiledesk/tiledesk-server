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

        const request = data.request;
        const agents = data.snapshot?.agents;

        if (!request || !request.request_id || !request.id_project) {
          winston.error("updateRequestSnapshot: Invalid request data", data);
          return;
        }

        if (!agents) {
          winston.debug("updateRequestSnapshot: No agents array provided, skipping update");
          return;
        }

        const query = { request_id: request.request_id, id_project: request.id_project };
        winston.debug("updateRequestSnapshot query ", query);

        Request.findOne(query, function (err, foundRequest) {
          if (err) {
            winston.error("Error finding request in updateRequestSnapshot", err);
            return;
          }
          if (!foundRequest) {
            winston.warn("updateRequestSnapshot: Request not found for " + request.request_id);
            return;
          }

          // Merge existing snapshot with the new agents
          let existingSnapshot = foundRequest.snapshot || {};
          existingSnapshot.agents = agents;

          Request.findOneAndUpdate(
            query,
            { "$set": { "snapshot": existingSnapshot } },
            { new: true },
            function (err, updatedRequest) {
              if (err) {
                winston.error("Error updating request snapshot updateRequestSnapshot", err);
                return;
              }
              if (updatedRequest) {
                console.log("Snapshot agents Updated from UpdateRequestSnapshotQueued on ", new Date());
                winston.debug("updateRequestSnapshot updated request " + updatedRequest.request_id);
              } else {
                winston.warn("updateRequestSnapshot: Request not found for " + request.request_id);
              }
              return;
            }
          );
        });
      });
    });
  }
}

var updateRequestSnapshotQueued = new UpdateRequestSnapshotQueued();

module.exports = updateRequestSnapshotQueued;

