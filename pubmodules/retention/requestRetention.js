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
];

const defaultRetentionDays = parseInt(process.env.DEFAULT_RETENTION_DAYS, 10) || 90;

class RequestRetention {

    constructor() {
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
     *
     * IMPORTANT: skip while preflight === true. During preflight, other handlers emit request.update
     * (e.g. message.create.from.requester → workingStatus) before ConciergeBot runs
     * changeFirstTextAndPreflightByRequestId. Running findOneAndUpdate here races with cachegoose:
     * request.update listeners may refresh Redis with a stale snapshot (preflight still true) after
     * the DB already has preflight false. expiresAt is already set on create in requestService.
     */
    async updateExpiresAt(request) {
        if (!request || !request.id_project) {
            return;
        }
        if (request.preflight === true) {
            return;
        }
        let project = request.project || (request.id_project && typeof request.id_project.settings === 'object' ? request.id_project : null);
        if (!project) {
            try {
                project = await projectService.getCachedProject(request.id_project);
            } catch (err) {
                winston.warn("RequestRetention getCachedProject error", { id_project: request.id_project, err });
                return;
            }
        }
        const retentionDays = project.settings && typeof project.settings.retentionDays === 'number'
            ? project.settings.retentionDays
            : defaultRetentionDays;

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
        try {
            await Request.findOneAndUpdate(
                { request_id: requestId, id_project: request.id_project },
                { $set: { expiresAt } },
                { new: true }
            );
            winston.debug("RequestRetention updated expiresAt", { request_id: requestId, expiresAt });
        } catch (err) {
            winston.error("RequestRetention updateExpiresAt error", { request_id: requestId, err });
        }
    }
}

module.exports = RequestRetention;
