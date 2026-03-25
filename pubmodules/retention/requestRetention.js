const winston = require("../../config/winston");
const requestEvent = require("../../event/requestEvent");
const projectService = require("../../services/projectService");
const Request = require("../../models/request");
const { getRetentionMsFromProjectLike } = require("./retentionMsFromProject");

const EVENTS = [
    'request.create',
    'request.update'
];

const QUEUED_EVENTS = [
    'request.create.queue',
    'request.update.queue'
]

class RequestRetention {

    constructor() {
        this.enabled = true;
        const retentionEnv = process.env.REQUEST_RETENTION_ENABLED;
        if (retentionEnv === "false" || retentionEnv === false) {
            this.enabled = false;
        }
        winston.info("RequestRetention enabled: " + this.enabled);

        this.eventKeys = {};
        if (requestEvent.queueEnabled) {
            this.eventKeys.requestCreate = QUEUED_EVENTS[0];
            this.eventKeys.requestUpdate = QUEUED_EVENTS[1];
        } else {
            this.eventKeys.requestCreate = EVENTS[0];
            this.eventKeys.requestUpdate = EVENTS[1];
        }

    }

    listen() {
        if (this.enabled) {
            winston.info("RequestRetention started");
        } else {
            return winston.info("RequestRetention disabled");
        }

        requestEvent.on(this.eventKeys.requestCreate, (request) => {
            winston.info("\nRequestRetention request.create", request);
        });

        requestEvent.on(this.eventKeys.requestUpdate, (request) => {
            winston.debug("\nRequestRetention request.update", request);
            setImmediate(async () => {
                await this.updateExpiresAt(request);
            });
        });
    }

    async updateExpiresAt(request) {

        let project;

        try {
            project = await projectService.getCachedProject(request.id_project);
        } catch(err) {
            winston.error("RequestRetention error getting project", err);
            return;
        }

        const retentionInfo = getRetentionMsFromProjectLike(project);
        if (!retentionInfo) {
            return;
        }
        const retentionMs = retentionInfo.retentionMs;

        const updatedAt = request.updatedAt;
        if (!updatedAt) {
            winston.warn("RequestRetention request.update without updatedAt. Skip updateExpiresAt");
            return;
        }

        let expiresAt = new Date(updatedAt.getTime() + retentionMs);
        if (expiresAt.getTime() < Date.now()) {
            expiresAt = undefined;
        }

        try {
            await Request.findOneAndUpdate(
                { request_id: request.request_id, id_project: request.id_project }, 
                { expiresAt: expiresAt }, 
                { new: true });
        } catch(err) {
            winston.error("RequestRetention error updating expiresAt", err);
        }

        
    }
}

module.exports = RequestRetention;