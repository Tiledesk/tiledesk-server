const project = require("../models/project");


class RateManager {

    constructor(config) {

        if (!config) {
            throw new Error('config is mandatory')
        }

        if (!config.tdCache) {
            throw new Error('config.tdCache is mandatory')
        }

        this.tdCache = config.tdCache;

    
        // Default rates 
        this.defaultRates = {
            webhook: {
                capacity: parseInt(process.env.BUCKET_WH_CAPACITY) || 10,
                refill_rate: (parseInt(process.env.BUCKET_WH_REFILL_RATE_PER_MIN) || 10) / 60
            },
            message: {
                capacity: parseInt(process.env.BUCKET_MSG_CAPACITY) || 100,
                refill_rate: (parseInt(process.env.BUCKET_MSG_REFILL_RATE_PER_MIN) || 100) / 60
            },
            block: {
                capacity: parseInt(process.env.BUCKET_BLK_CAPACITY) || 100,
                refill_rate: (parseInt(process.env.BUCKET_BLK_REFILL_RATE_PER_MIN) || 100) / 60
            }
        }
    }

    async canExecute(projectOrId, id, type) {
        
        let project = projectOrId;
        if (typeof projectOrId === 'string') {
            project = await this.loadProject(projectOrId);
            id = projectOrId;
        }
        
        const config = await this.getRateConfig(project, type);
        const key = `bucket:${type}:${id}`

        let bucket = await this.getBucket(key, type, project);
        let current_tokens = bucket.tokens;
        let elapsed = (new Date() - new Date(bucket.timestamp)) / 1000;
        let tokens = Math.min(config.capacity, current_tokens + (elapsed * config.refill_rate));

        if (tokens > 0) {
            tokens -= 1;
            bucket.tokens = tokens;
            bucket.timestamp = new Date();
            this.setBucket(key, bucket)
            return true;
        } else {
            bucket.timestamp = new Date();
            return false;
        }
    }

    async getRateConfig(project, type) {

        const baseConfig = this.defaultRates[type];
        if (!project) {
            return baseConfig;
        }

        const custom = project?.profile?.customization?.rates?.[type];
        if (!custom) {
            return baseConfig;
        }

        return {
            ...baseConfig,
            ...custom
        }
    }

    async setBucket(key, bucket) {
        const bucket_string = JSON.stringify(bucket);
        await this.tdCache.set(key, bucket_string, { EX: 600 });
    }

    async getBucket(key, type, project) {
        let bucket = await this.tdCache.get(key);
        if (bucket) {
            return JSON.parse(bucket);
        }
        bucket = await this.createBucket(type, project);
        return bucket;
    }

    async createBucket(type, project) {
        const config = await this.getRateConfig(project, type)
        return {
            tokens: config.capacity,
            timestamp: new Date()
        }
    }

    async loadProject(id_project) {
        // Hint: implement redis cache also for project
        try {
            return project.findById(id_project);
        } catch (err) {
            winston.error("(RateManager)Error getting project ", err);
            return null;
        }
    }

}

module.exports = RateManager;