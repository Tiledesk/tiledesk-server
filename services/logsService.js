'use strict';

const { FlowLogs } = require("../models/flowLogs");
const default_log_level = 'info';

class LogsService {

    async getLastRows(request_id, limit, logLevel) {
        let level = logLevel || default_log_level;
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.level": level } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getOlderRows(request_id, limit, logLevel, timestamp) {
        let level = logLevel || default_log_level;
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.level": level, "rows.timestamp": { $lt: timestamp } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getNewerRows(request_id, limit, logLevel, timestamp) {
        let level = logLevel || default_log_level;
        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.level": level, "rows.timestamp": { $gt: timestamp } } },
            { $sort: { "rows.timestamp": 1, "rows._id": 1 } },
            { $limit: limit }
        ])
    }
    
}

let logsService = new LogsService();

module.exports = logsService;