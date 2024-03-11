let JobManager = require("jobs-worker-queued");
let winston = require('../config/winston');

let jobManager;

class Scheduler {

    constructor(config) {

        if (!config) {
            throw new Error('(Scheduler) config is mandatory');
        }

        if (!config.jobManager) {
            throw new Error('(Scheduler) config.jobManager is mandatory');
        }

        this.jobManager = config.jobManager;
    }

    trainSchedule(data, callback) {

        winston.debug("(trainScheduler) data: ", data);
        this.jobManager.publish(data, (err, ok) => {
            let response_data = { success: true, message: "Scheduled" };
            if (callback) {
                callback(err, response_data);
            }
        });
    }
}

module.exports = { Scheduler };