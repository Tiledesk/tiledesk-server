'use strict';

var Request = require("../models/request");
var messageService = require('../services/messageService');
const requestEvent = require('../event/requestEvent');
const leadEvent = require('../event/leadEvent');
var winston = require('../config/winston');

class UpdateLeadQueued {

  constructor() {
    // this.listen();
  }

  listen() {
    // 12 marzo 2024 I disabled these two functions due to performance problems for a chatbot created by Sponziello "Community bots Sendinblue Hubspot Qapla)"
    this.updateSnapshotLead();
    this.sendMessageUpdateLead();
    winston.info("Listening UpdateLeadQueued started")

  }


  updateSnapshotLead() {

    var leadUpdateKey = 'lead.update';
    if (leadEvent.queueEnabled) {
      leadUpdateKey = 'lead.update.queue';
    }
    winston.debug("leadUpdateKey: " + leadUpdateKey);

    leadEvent.on(leadUpdateKey, function (lead) {
      setImmediate(() => {
        winston.debug("updateSnapshotLead on lead.update ", lead);

        var query = { lead: lead._id, id_project: lead.id_project };
        winston.debug("query ", query);

        Request.updateMany(query, { "$set": { "snapshot.lead": lead } }, function (err, updates) {
          if (err) {
            winston.error("Error updating requests updateSnapshotLead", err);
            return 0;
          }
          winston.debug("updateSnapshotLead updated for " + updates.nModified + " request")
          requestEvent.emit('request.update.snapshot.lead', { lead: lead, updates: updates });
          return;
        });
        // Request.find({lead: lead._id, id_project: lead.id_project}, function(err, requests) {

        //     if (err) {
        //         winston.error("Error getting request by lead", err);
        //         return 0;
        //     }
        //     if (!requests || (requests && requests.length==0)) {
        //         winston.warn("No request found for lead id " +lead._id );
        //         return 0;
        //     }

        //     requests.forEach(function(request) {


        //     });

        // });


      });
    });
  }


  sendMessageUpdateLead() {

    var leadUpdateEmailKey = 'lead.fullname.email.update';
    if (leadEvent.queueEnabled) {
      leadUpdateEmailKey = 'lead.fullname.email.update.queue';
    }
    winston.debug("leadUpdateEmailKey: " + leadUpdateEmailKey);


    leadEvent.on(leadUpdateEmailKey, function (lead) {
      winston.debug("lead.fullname.email.update ");
      // leadEvent.on('lead.update', function(lead) {

      setImmediate(() => {
        winston.debug("sendMessageUpdateLead on lead.update ", lead);

        // .find({"channel.name":"chat21"}).sort({"createdAt": -1}).limit(2)
        Request.find({ lead: lead._id, id_project: lead.id_project, "channel.name":"chat21" }).limit(1).sort({"createdAt": -1}).
        exec(function (err, requests) {

          if (err) {
            winston.error("Error getting sendMessageUpdateLead request by lead", err);
            return 0;
          }
          if (!requests || (requests && requests.length == 0)) {
            winston.warn("sendMessageUpdateLead No request found for lead id " + lead._id);
            return 0;
          }

          // winston.info("sendMessageUpdateLead requests ", requests);

          // requests.forEach(function (request) {

          var request = requests[0];

          winston.debug("sendMessageUpdateLead request ", request);

            // send(sender, senderFullname, recipient, text, id_project, createdBy, attributes, type, metadata, language)
          messageService.send(
              'system',
              'Bot',
              // lead.fullname,                                
              request.request_id,
              "Lead updated",
              request.id_project,
              'system',
              {
                subtype: "info/support",
                "updateconversation": false,
                messagelabel: { key: "LEAD_UPDATED" },
                updateUserEmail: lead.email,
                updateUserFullname: lead.fullname
              },
              undefined,
              request.language

            );

          // });

        });

      });
    });
  }





}


var updateLeadQueued = new UpdateLeadQueued();


module.exports = updateLeadQueued;

