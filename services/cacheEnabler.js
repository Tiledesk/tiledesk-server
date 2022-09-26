
class CacheEnabler {
    constructor() {
        this.trigger = true;
        if (process.env.CACHE_TRIGGER_ENABLED=="false" || process.env.CACHE_TRIGGER_ENABLED==false) {
            this.trigger = false;
        }

        this.subscription = true;
        if (process.env.CACHE_SUBSCRIPTION_ENABLED=="false" || process.env.CACHE_SUBSCRIPTION_ENABLED==false) {
            this.subscription = false;
        }

        this.project = true;
        if (process.env.CACHE_PROJECT_ENABLED=="false" || process.env.CACHE_PROJECT_ENABLED==false) {
            this.project = false;
        }

        this.request = true;
        if (process.env.CACHE_REQUEST_ENABLED=="false" || process.env.CACHE_REQUEST_ENABLED==false) {
            this.request = false;
        }

        this.project_user = true;
        if (process.env.CACHE_PROJECT_USER_ENABLED=="false" || process.env.CACHE_PROJECT_USER_ENABLED==false) {
            this.project_user = false;
        }

        this.user = true;
        if (process.env.CACHE_USER_ENABLED=="false" || process.env.CACHE_USER_ENABLED==false) {
            this.user = false;
        }

        this.message = true;
        if (process.env.CACHE_MESSAGE_ENABLED=="false" || process.env.CACHE_MESSAGE_ENABLED==false) {
            this.message = false;
        }
    }
}


var cacheEnabler = new CacheEnabler();


module.exports = cacheEnabler;