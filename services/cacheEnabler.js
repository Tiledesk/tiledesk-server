
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

        this.lead = true;
        if (process.env.CACHE_LEAD_ENABLED=="false" || process.env.CACHE_LEAD_ENABLED==false) {
            this.lead = false;
        }

        this.department = true;
        if (process.env.CACHE_DEPARTMENT_ENABLED=="false" || process.env.CACHE_DEPARTMENT_ENABLED==false) {
            this.department = false;
        }

        this.label = true;
       if (process.env.CACHE_LABEL_ENABLED=="false" || process.env.CACHE_LABEL_ENABLED==false) {
            this.label = false;
        }

        this.user = true; //user_cache_here
        if (process.env.CACHE_USER_ENABLED=="false" || process.env.CACHE_USER_ENABLED==false) {
            this.user = false;
        }
        
        this.role = true;
        if (process.env.CACHE_ROLE_ENABLED=="false" || process.env.CACHE_ROLE_ENABLED==false) {
            this.role = false;
        }

       
    }
}


var cacheEnabler = new CacheEnabler();


module.exports = cacheEnabler;