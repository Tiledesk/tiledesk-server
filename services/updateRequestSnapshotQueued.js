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
    console.log("non dovrei fare niente quiiii")
    return;
    // let snapshotUpdateKey = 'request.snapshot.update';
    // if (requestEvent.queueEnabled) {
    //   snapshotUpdateKey = 'request.snapshot.update.queue';
    // }
    // winston.debug("snapshotUpdateKey: " + snapshotUpdateKey);

    // requestEvent.on(snapshotUpdateKey, function (data) {
    //   setImmediate(() => {
    //     winston.debug("updateRequestSnapshot on request.snapshot.update ", data);
    //     console.log("updateRequestSnapshot on request.snapshot.update ", data);

    //     const request = data.request;
    //     const snapshot = data.snapshot;
    //     console.log("(queue) snapshot.requester", snapshot.requester);

    //     if (!request || !request.request_id || !request.id_project) {
    //       winston.error("updateRequestSnapshot: Invalid request data", data);
    //       return;
    //     }

    //     if (!snapshot || Object.keys(snapshot).length === 0) {
    //       winston.debug("updateRequestSnapshot: Empty snapshot, skipping update");
    //       return;
    //     }

    //     const query = { request_id: request.request_id, id_project: request.id_project };
    //     winston.debug("updateRequestSnapshot query ", query);

    //     Request.findOneAndUpdate(
    //       query, 
    //       { "$set": { "snapshot": snapshot } }, 
    //       { new: true },
    //       function (err, updatedRequest) {
    //         if (err) {
    //           winston.error("Error updating request snapshot updateRequestSnapshot", err);
    //           return;
    //         }
    //         if (updatedRequest) {
    //           winston.debug("updateRequestSnapshot updated request " + updatedRequest.request_id);
    //           requestEvent.emit('request.update.snapshot', { request: updatedRequest, snapshot: snapshot });
    //         } else {
    //           winston.warn("updateRequestSnapshot: Request not found for " + request.request_id);
    //         }
    //         return;
    //       }
    //     );
    //   });
    // });
  }
}

var updateRequestSnapshotQueued = new UpdateRequestSnapshotQueued();

module.exports = updateRequestSnapshotQueued;

