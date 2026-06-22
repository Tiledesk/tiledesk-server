class CacheManager {

    constructor() {        
        this.client = undefined;
    }

    setClient(client) {
        this.client = client;
    }

    getClient() {
        return this.client;
    }
}


var cacheManager = new CacheManager();

module.exports = cacheManager;