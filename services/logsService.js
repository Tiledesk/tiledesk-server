'use strict';

const { FlowLogs } = require("../models/flowLogs");

class LogsService {

    async getLastRows(request_id, limit) {

        return new Promise((resolve, reject) => {
            FlowLogs.aggregate([
                { $match: { request_id: request_id } },
                { $unwind: "$rows" },
                { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
                { $limit: limit }
            ]).then((rows) => {
                resolve(rows);
            }).catch((err) => {
                reject(err);
            })
        })

    }

    async getOlderLogs(request_id, limit, timestamp) {
        return new Promise((resolve, reject) => {
            FlowLogs.aggregate([
                { $match: { request_id } },
                { $unwind: "$rows" },
                { $match: { "rows.timestamp": { $lt: timestamp } } },
                { $sort: { "rows.timestamp": -1, "rows._id": -1 } },
                { $limit: limit }
            ]).then((rows) => {
                resolve(rows);
            }).catch((err) => {
                reject(err);
            })
        })
    }

    async getNewerLogs(request_id, limit, timestamp) {
        return new Promise((resolve, reject) => {
            FlowLogs.aggregate([
                { $match: { request_id } },
                { $unwind: "$rows" },
                { $match: { "rows.timestamp": { $lt: timestamp } } },
                { $sort: { "rows.timestamp": 1, "rows._id": 1 } },
                { $limit: limit }
            ]).then((rows) => {
                resolve(rows);
            }).catch((err) => {
                reject(err);
            })
        })
    }
}

let logsService = new LogsService();

module.exports = logsService;