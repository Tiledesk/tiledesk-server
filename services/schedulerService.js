const axios = require("axios").default;

class SchedulerService {

    constructor() {}

    async listJobs(params = {}) {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== '') {
                q.set(k, String(v))
            }
        })

        const query = q.toString();
        return this.request('GET', '/jobs' + (query ? `?${query}` : ''));

    }

    async getJob(id) {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== '') {
                q.set(k, String(v))
            }
        })

        const query = q.toString();
        return this.request('GET', '/jobs/' + id + (query ? `?${query}` : ''));
    }

    async createCronJob(job) {
        return this.request('POST', '/jobs/cron', job);
    }

    async createOnceJob(job) {
        return this.request('POST', '/jobs/once', job);
    }

    async request(method, path, body = null) {

        if (!process.env.SCHEDULER_SERVICE_URL) {
            throw new Error('SCHEDULER_SERVICE_URL is not set');
        }

        try {
            return await axios.request({
                method,
                url: process.env.SCHEDULER_SERVICE_URL + path,
                data: body,
            })
        } catch (error) {
            throw new Error('Failed to request scheduler service: ' + error.message);
        }
    }
}

const schedulerService = new SchedulerService();
module.exports = schedulerService;