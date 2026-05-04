'use strict';

const schedule = require('node-schedule');
const winston = require('../../../config/winston');
const Request = require("../../../models/request");
const Message = require("../../../models/message");
const requestEvent = require("../../../event/requestEvent");
const requestService = require("../../../services/requestService");
const RequestConstants = require('../../../models/requestConstants');
const secondaryMongoRetention = require("../../retention/secondaryMongoRetention");

class RequestRetentionScheduler {

    constructor() {
        this.enabled = process.env.REQUEST_RETENTION_ENABLED || "true";
        this.cronExp = process.env.REQUEST_RETENTION_CRON_EXPRESSION || '*/10 * * * * *';
        this.queryLimit = parseInt(process.env.REQUEST_RETENTION_QUERY_LIMIT) || 20;
        this.delayBeforeRetaining = parseInt(process.env.REQUEST_RETENTION_DELAY) || 1000;
    }

    run() {
        if (this.enabled === "true") {
            winston.info("RequestRetentionScheduler started");
            this.scheduleRequestRetention();
        } else {
            winston.info("RequestRetentionScheduler disabled");
        }
    }

    scheduleRequestRetention() {

        schedule.scheduleJob(this.cronExp, (fireDate) => {
            const randomDelay = Math.random() * 1000;

            setTimeout(() => {
                this.findRequestsToRetain();
            }, randomDelay);
        });
    }

    findRequestsToRetain() {
        const cutoffDate = new Date();
        const query = {
            expiresAt: { $lte: cutoffDate }
        }

        Request.find(query)
            .sort({ expiresAt: 'asc' })
            .limit(this.queryLimit)
            .exec((err, requests) => {

                if (err) {
                    winston.error("RequestRetentionScheduler error getting requests to retain", err);
                    return;
                }

                if (!requests || requests.length === 0) {
                    winston.verbose("RequestRetentionScheduler no requests to retain found");
                    return;
                }

                winston.info("RequestRetentionScheduler found " + requests.length + " requests to retain");
                winston.debug("RequestRetentionScheduler requests to retain", requests);

                this.scheduleRequestRetentions(requests);

            })
    }

    async scheduleRequestRetentions(requests) {
        for (let i = 0; i < requests.length; i++) {
            const delay = 2 * this.delayBeforeRetaining;
    
            await new Promise(resolve => setTimeout(resolve, delay));
    
            try {
                await this.retainRequest(requests[i]);
            } catch (err) {
                winston.error(`Error retaining request ${requests[i].request_id}`, err);
            }
        }
    }

    /**
     * Retains a request.
     * @param {Object} request - The request object to retain
     */
    async retainRequest(request) {

        const request_id = request.request_id;
        const id_project = request.id_project;

        if (request.status !== RequestConstants.CLOSED) {
            winston.verbose(`RequestRetentionScheduler: Retaining request ${request_id} but is not closed, closing it`);
            try {
                await this.closeRequest(request);
                // Let close-side events/cache settle before delete (orchestration belongs here, not in closeRequest).
                await new Promise((resolve) => setTimeout(resolve, 1000));
            } catch (err) {
                winston.error(`RequestRetentionScheduler: Error closing request to retain: ${request_id}`, err);
                winston.error('Continue anyway');
            }
        }

        try {
            const msgRes = await Message.deleteMany({ recipient: request_id, id_project: id_project });
            winston.verbose(`RequestRetentionScheduler: deleted ${msgRes.deletedCount} messages for request_id=${request_id}`);

            await secondaryMongoRetention.deleteByRequestId(request_id, id_project);

            const deletedRequest = await Request.findOneAndDelete({ request_id: request_id, id_project: id_project });
            if (deletedRequest) {
                winston.info(`RequestRetentionScheduler: Request deleted with request_id: ${request_id}`);
                requestEvent.emit('request.delete', deletedRequest);
            } else {
                winston.warn(`RequestRetentionScheduler: Request not found with request_id: ${request_id}`);
            }
        } catch (err) {
            winston.error(`RequestRetentionScheduler: Error during retain delete for request_id: ${request_id}`, err);
            throw err;
        }
    }


    /**
   * Closes a request to retain.
   * @param {Object} request - The request object to close
   */
    async closeRequest(request) {
        winston.debug(`RequestRetentionScheduler: closing request to retain: ${request.first_text}`);

        const closedBy = "_request_retention";
        const shouldSkipStatsUpdate = false;
        const shouldNotify = false;

        winston.verbose("RequestRetentionScheduler: closing before retain", {
            request_id: request.request_id,
            id_project: request.id_project
        });

        // Must await: retainRequest runs findOneAndDelete after this; if delete wins the race,
        // changeStatusByRequestId gets no document and emits request.update(null) → cache crash.
        try {
            await requestService.closeRequestByRequestId(
                request.request_id,
                request.id_project,
                shouldSkipStatsUpdate,
                shouldNotify,
                closedBy
            );
            winston.info(`RequestRetentionScheduler: Request closed with request_id: ${request.request_id}`);
        } catch (err) {
            const hideErrors = process.env.HIDE_CLOSE_REQUEST_ERRORS === true || process.env.HIDE_CLOSE_REQUEST_ERRORS === "true";
            if (!hideErrors) {
                winston.error(`RequestRetentionScheduler: Error closing the request with request_id: ${request.request_id}`, err);
            }
            throw err;
        }
    }

}

const requestRetentionScheduler = new RequestRetentionScheduler();

module.exports = requestRetentionScheduler;