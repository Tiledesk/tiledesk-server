'use strict';

const { FlowLogs } = require("../models/flowLogs");
const default_log_level = 'info';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };

class LogsService {

    async getLastRows(request_id, limit, logLevel) {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getOlderRows(request_id, limit, logLevel, timestamp) {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel }, "rows.timestamp": { $lt: timestamp } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getNewerRows(request_id, limit, logLevel, timestamp) {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel }, "rows.timestamp": { $gt: timestamp } } },
            { $sort: { "rows.timestamp": 1, "rows._id": 1 } },
            { $limit: limit }
        ])
    }
    
}

let logsService = new LogsService();

module.exports = logsService;