const requestEvent = require("../../event/requestEvent");
const projectService = require("../../services/projectService");
const Request = require("../../models/request");
const winston = require("../../config/winston");

const EVENTS = [
    'request.create',
    'request.update'
];

const QUEUED_EVENTS = [
    'request.create.queue',
    'request.update.queue'
]

const defaultRetentionDays = parseInt(process.env.DEFAULT_RETENTION_DAYS) || 90;

class RequestRetention {

    constructor() {
        console.log("\n\n\n--------------------------------\n\n\n");
        console.log("RequestRetention constructor");
        console.log("requestEvent.queueEnabled: ", requestEvent.queueEnabled);
        console.log("EVENTS: ", EVENTS);
        console.log("QUEUED_EVENTS: ", QUEUED_EVENTS);
        console.log("\n\n\n--------------------------------\n\n\n");
        this.enabled = true;
        const retentionEnv = process.env.REQUEST_RETENTION_ENABLED;
        if (retentionEnv === "false" || retentionEnv === false) {
            this.enabled = false;
        }
        winston.debug("RequestRetention this.enabled: " + this.enabled);

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
            winston.debug("RequestRetention request.create", request);
        });

        requestEvent.on(this.eventKeys.requestUpdate, (request) => {
            winston.debug("RequestRetention request.update", request);

            setImmediate(async () => {
                await this.updateExpiresAt(request);
            });
        });

    }

    /**
     * Updates request.expiresAt based on project.settings.retentionDays.
     * Uses the project already populated on the request if available, otherwise uses getCachedProject (via cachegoose).
     */
    async updateExpiresAt(request) {
        if (!request || !request.id_project) {
            return;
        }
        let project = request.project || (request.id_project && typeof request.id_project.settings === 'object' ? request.id_project : null);
        console.log("(updateExpiresAt) project from request: ", project);
        if (!project) {
            try {
                project = await projectService.getCachedProject(request.id_project);
                console.log("(updateExpiresAt) project from getCachedProject: ", project);
            } catch (err) {
                winston.warn("RequestRetention getCachedProject error", { id_project: request.id_project, err });
                return;
            }
        }
        const retentionDays = project.settings && typeof project.settings.retentionDays === 'number'
            ? project.settings.retentionDays
            : defaultRetentionDays;

        console.log("(updateExpiresAt) retentionDays: ", retentionDays);
            
        if (retentionDays == null || retentionDays <= 0) {
            return;
        }
        const updatedAt = request.updatedAt;
        if (!updatedAt) {
            return;
        }
        const updatedAtMs = typeof updatedAt.getTime === 'function' ? updatedAt.getTime() : new Date(updatedAt).getTime();
        const expiresAt = new Date(updatedAtMs + retentionDays * 86400000);
        const requestId = request.request_id || request._id;
        console.log("(updateExpiresAt) request.preflight: ", request.preflight);
        try {
            const updatedRequest = await Request.findOneAndUpdate(
                { request_id: requestId, id_project: request.id_project },
                { $set: { expiresAt } }
            );
            console.log("(updateExpiresAt) updatedRequest.preflight: ", updatedRequest.preflight);
            console.log("(updateExpiresAt) updated expiresAt to: ", expiresAt);
            winston.debug("RequestRetention updated expiresAt", { request_id: requestId, expiresAt });
        } catch (err) {
            winston.error("RequestRetention updateExpiresAt error", { request_id: requestId, err });
        }
    }
}

module.exports = RequestRetention;