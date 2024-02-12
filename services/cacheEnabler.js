
class CacheEnabler {
    constructor() {

        // long TTL
        this.trigger = true;
        if (process.env.CACHE_TRIGGER_ENABLED=="false" || process.env.CACHE_TRIGGER_ENABLED==false) {
            this.trigger = false;
        }

        // long TTL
        this.subscription = true;
        if (process.env.CACHE_SUBSCRIPTION_ENABLED=="false" || process.env.CACHE_SUBSCRIPTION_ENABLED==false) {
            this.subscription = false;
        }

        //default TTL
        this.project = true;
        if (process.env.CACHE_PROJECT_ENABLED=="false" || process.env.CACHE_PROJECT_ENABLED==false) {
            this.project = false;
        }

        //default TTL
        this.request = true;
        if (process.env.CACHE_REQUEST_ENABLED=="false" || process.env.CACHE_REQUEST_ENABLED==false) {
            this.request = false;
        }

        this.faq_kb = true;
        if (process.env.CACHE_FAQ_KB_ENABLED=="false" || process.env.CACHE_FAQ_KB_ENABLED==false) {
            this.faq_kb = false;
        }

        
        this.project_user = true;
        if (process.env.CACHE_PROJECT_USER_ENABLED=="false" || process.env.CACHE_PROJECT_USER_ENABLED==false) {
            this.project_user = false;
        }

        this.widgets = true;
        if (process.env.CACHE_WIDGETS_ENABLED=="false" || process.env.CACHE_WIDGETS_ENABLED==false) {
            this.widgets = false;
        }

        this.integrations = true;
        if (process.env.CACHE_INTEGRATIONS_ENABLED=="false" || process.env.CACHE_INTEGRATIONS_ENABLED==false) {
            this.integrations = false;
        }

        // this.user = true;
        // if (process.env.CACHE_USER_ENABLED=="false" || process.env.CACHE_USER_ENABLED==false) {
        //     this.user = false;
        // }

        // this.message = true;
        // if (process.env.CACHE_MESSAGE_ENABLED=="false" || process.env.CACHE_MESSAGE_ENABLED==false) {
        //     this.message = false;
        // }
    }
}


var cacheEnabler = new CacheEnabler();


module.exports = cacheEnabler;