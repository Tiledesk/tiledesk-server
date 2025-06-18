'use strict';

const { FlowLogs } = require("../models/flowLogs");
const default_log_level = 'info';

const levels = { error: 0, warn: 1, info: 2, debug: 3, native: 4 };

class LogsService {

    async getLastRows(id, limit, logLevel, queryField = 'request_id') {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { [queryField]: id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getOlderRows(id, limit, logLevel, timestamp, queryField = 'request_id') {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { [queryField]: id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel }, "rows.timestamp": { $lt: timestamp } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getNewerRows(id, limit, logLevel, timestamp, queryField = 'request_id') {
        let level = logLevel || default_log_level;
        if (level === 'default') {
            level = default_log_level
        }
        let nlevel = levels[level];
        return FlowLogs.aggregate([
            { $match: { [queryField]: id } },
            { $unwind: "$rows" },
            { $match: { "rows.nlevel": { $lte: nlevel }, "rows.timestamp": { $gt: timestamp } } },
            { $sort: { "rows.timestamp": 1, "rows._id": 1 } },
            { $limit: limit }
        ])
    }
    
}

let logsService = new LogsService();

module.exports = logsService;