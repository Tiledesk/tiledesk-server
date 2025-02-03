'use strict';

const { FlowLogs } = require("../models/flowLogs");

class LogsService {

    async getLastRows(request_id, limit) {

        return FlowLogs.aggregate([
            { $match: { request_id: request_id } },
            { $unwind: "$rows" },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getOlderRows(request_id, limit, timestamp) {

        return FlowLogs.aggregate([
            { $match: { request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.timestamp": { $lt: timestamp } } },
            { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
            { $limit: limit }
        ]).then(rows => rows.reverse())
    }

    async getNewerRows(request_id, limit, timestamp) {

        return FlowLogs.aggregate([
            { $match: { request_id } },
            { $unwind: "$rows" },
            { $match: { "rows.timestamp": { $gt: timestamp } } },
            { $sort: { "rows.timestamp": 1, "rows._id": 1 } },
            { $limit: limit }
        ])
    }
}

let logsService = new LogsService();

module.exports = logsService;