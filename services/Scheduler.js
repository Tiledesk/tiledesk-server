let JobManager = require("jobs-worker-queued");
let winston = require('../config/winston');

let jobManager;

class Scheduler {

    constructor(config) {

        if (!config) {
            throw new Error('(Scheduler) config is mandatory');
        }

        if (!config.AMQP_MANAGER_URL) {
            throw new Error('(Scheduler) config.AMQP_MANAGER_URL is mandatory');
        }

        if (!config.JOB_TOPIC_EXCHANGE) {
            throw new Error('(Scheduler) config.JOB_TOPIC_EXCHANGE is mandatory');
        }

        this.ampq_manager_url = config.AMQP_MANAGER_URL;
        this.job_topic_exchange = config.JOB_TOPIC_EXCHANGE;

        jobManager = new JobManager(this.ampq_manager_url, {
            debug: false,
            topic: this.job_topic_exchange,
            exchange: this.job_topic_exchange
        })
    }

    trainSchedule(data) {

        console.log("trainSchedule data: ", data);
        try {
            winston.debug("(trainScheduler) data: ", data);
            jobManager.publish(data);
            return { success: true, message: "Scheduled!" };
        } catch (err) {
            winston.error("(trainScheduler) scheduling error: ", err);
            return { success: false, message: "Scheduling error" };
        }
    }
}

module.exports = { Scheduler };