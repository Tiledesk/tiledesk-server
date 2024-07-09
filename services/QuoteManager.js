const { ceil, floor } = require('lodash');
let winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const emailEvent = require('../event/emailEvent');

// NEW
// const PLANS_LIST = {
//     FREE_TRIAL: { requests: 3000,   messages: 0,    tokens: 250000,     email: 200,    chatbots: 20,       kbs: 50 }, // same as PREMIUM
//     SANDBOX:    { requests: 200,    messages: 0,    tokens: 100000,     email: 200,    chatbots: 2,        kbs: 50 },
//     BASIC:      { requests: 1000,   messages: 0,    tokens: 2000000,    email: 200,    chatbots: 10,       kbs: 200},
//     PREMIUM:    { requests: 3000,   messages: 0,    tokens: 5000000,    email: 200,    chatbots: 20,       kbs: 500},
//     CUSTOM:     { requests: 3000,   messages: 0,    tokens: 5000000,    email: 200,    chatbots: 20,       kbs: 500}
// }

const PLANS_LIST = {
    FREE_TRIAL: { requests: 200,    messages: 0,    tokens: 100000,      email: 200,     chatbots: 20,      namespace: 3,   kbs: 50     }, // same as PREMIUM
    SANDBOX:    { requests: 200,    messages: 0,    tokens: 100000,      email: 200,     chatbots: 2,       namespace: 1,   kbs: 50     },
    BASIC:      { requests: 800,    messages: 0,    tokens: 2000000,     email: 200,     chatbots: 5,       namespace: 1,   kbs: 150    },
    PREMIUM:    { requests: 3000,   messages: 0,    tokens: 5000000,     email: 200,     chatbots: 20,      namespace: 3,   kbs: 300    },
    CUSTOM:     { requests: 3000,   messages: 0,    tokens: 5000000,     email: 200,     chatbots: 20,      namespace: 3,   kbs: 1000   }
}

const typesList = ['requests', 'messages', 'email', 'tokens', 'chatbots', 'kbs']

let quotes_enabled = true;

class QuoteManager {

    constructor(config) {

        if (!config) {
            throw new Error('config is mandatory')
        }

        if (!config.tdCache) {
            throw new Error('config.tdCache is mandatory')
        }

        this.tdCache = config.tdCache;
        this.project;

    }

    // INCREMENT KEY SECTION - START
    async incrementRequestsCount(project, request) {

        this.project = project;
        let key = await this.generateKey(request, 'requests');
        winston.verbose("[QuoteManager] incrementRequestsCount key: " + key);

        await this.tdCache.incr(key)
        this.sendEmailIfQuotaExceeded(project, request, 'requests', key);
        return key;
    }

    async incrementMessagesCount(project, message) {

        this.project = project;
        let key = await this.generateKey(message, 'messages');
        winston.verbose("[QuoteManager] incrementMessagesCount key: " + key);

        await this.tdCache.incr(key)
        return key;
    }

    async incrementEmailCount(project, email) {

        this.project = project;
        let key = await this.generateKey(email, 'email');
        winston.verbose("[QuoteManager] incrementEmailCount key: " + key);

        await this.tdCache.incr(key)
        this.sendEmailIfQuotaExceeded(project, email, 'email', key);
        return key;
    }

    async incrementTokenCount(project, data) { // ?? cosa passo? il messaggio per vedere la data?

        this.project = project;
        let key = await this.generateKey(data, 'tokens');
        winston.verbose("[QuoteManager] incrementTokenCount key: " + key);

        if (quotes_enabled === false) {
            winston.debug("QUOTES DISABLED - incrementTokenCount")
            return key;
        }
        
        let tokens = data.tokens * data.multiplier;
        await this.tdCache.incrbyfloat(key, tokens);
        // await this.tdCache.incrby(key, tokens);
        this.sendEmailIfQuotaExceeded(project, data, 'tokens', key);
        return key;
    }
    // INCREMENT KEY SECTION - END


    async generateKey(object, type) {

        winston.debug("generateKey object ", object)
        winston.debug("generateKey type " + type)
        let subscriptionDate;

        if (this.project.isActiveSubscription === true) {
            if (this.project.profile.subStart) {
                subscriptionDate = this.project.profile.subStart;
            } else {
                // it should never happen
                winston.error("Error: quote manager - isActiveSubscription is true but subStart does not exists.")
            }
        } else {
            if (this.project.profile.subEnd) {
                subscriptionDate = this.project.profile.subEnd;
            } else {
                subscriptionDate = this.project.createdAt;
            }
        }

        let objectDate = object.createdAt;
        winston.debug("objectDate " + objectDate);

        // converts date in timestamps and transform from ms to s
        const objectDateTimestamp = ceil(objectDate.getTime() / 1000);
        const subscriptionDateTimestamp = ceil(subscriptionDate.getTime() / 1000);

        let ndays = (objectDateTimestamp - subscriptionDateTimestamp) / 86400;  // 86400 is the number of seconds in 1 day
        let nmonths = floor(ndays / 30); // number of month to add to the initial subscription date;

        let date = new Date(subscriptionDate);
        date.setMonth(date.getMonth() + nmonths);

        return "quotes:" + type + ":" + this.project._id + ":" + date.toLocaleDateString();
    }

    /**
     * Get current quote for a single type (tokens or request or ...)
     */
    async getCurrentQuote(project, object, type) {

        this.project = project;
        let key = await this.generateKey(object, type);
        winston.verbose("[QuoteManager] getCurrentQuote key: " + key);

        let quote = await this.tdCache.get(key);
        return Number(quote);
    }

    /**
     * Get quotes for all types (tokens and request and ...)
     */
    async getAllQuotes(project, obj) {

        this.project = project;

        let quotes = {}
        for (let type of typesList) {

            let key = await this.generateKey(obj, type);
            let quote = await this.tdCache.get(key);

            quotes[type] = {
                quote: Number(quote)
            };
        }
        return quotes;
    }

    /**
     * Perform a check on a single type.
     * Returns TRUE if the limit is not reached --> operation can be performed
     * Returns FALSE if the limit is reached --> operation can't be performed
     */
    async checkQuote(project, object, type) {

        winston.verbose("checkQuote type " + type);
        if (quotes_enabled === false) {
            winston.verbose("QUOTES DISABLED - checkQuote for type " + type);
            return true;
        }

        this.project = project;
        let limits = await this.getPlanLimits();
        winston.verbose("limits for current plan: ", limits)

        let quote = await this.getCurrentQuote(project, object, type);
        winston.verbose("getCurrentQuote resp: ", quote)

        if (quote == null) {
            return true;
        }

        if (quote < limits[type]) {
            return true;
        } else {
            return false;
        }
    }

    async checkQuoteForAlert(project, object, type) {
        
        if (quotes_enabled === false) {
            winston.verbose("QUOTES DISABLED - checkQuote for type " + type);
            return (null, null);
        }

        this.project = project;
        let limits = await this.getPlanLimits();
        winston.verbose("limits for current plan: ", limits)

        let quote = await this.getCurrentQuote(project, object, type);
        winston.verbose("getCurrentQuote resp: ", quote)

        let data = {
            limits: limits,
            quote: quote
        }

        return data;
    }

    async sendEmailIfQuotaExceeded(project, object, type, key) {
        
        let data = await this.checkQuoteForAlert(project, object, type);
        let limits = data.limits;
        let limit = data.limits[type];
        let quote = data.quote;

        const checkpoint = await this.percentageCalculator(limit, quote);
        if (checkpoint == 0) {
            return;
        }
        winston.verbose("checkpoint perc: ", checkpoint);

        // Generate redis key
        let nKey = key + ":notify:" + checkpoint;
        let result = await this.tdCache.get(nKey);
        if (!result) {

            let allQuotes = await this.getAllQuotes(project, object);
            let quotes = await this.generateQuotesObject(allQuotes, limits);

            let data = {
                id_project: project._id,
                project_name: project.name,
                type: type,
                checkpoint: checkpoint,
                quotes: quotes
            }

            emailEvent.emit('email.send.quote.checkpoint', data);
            await this.tdCache.set(nKey, 'true', {EX: 2592000}); //seconds in one month = 2592000
        } else {
            winston.verbose("Quota checkpoint reached email already sent.")
        }

    }

    async percentageCalculator(limit, quote) {
        
        let p = (quote / limit) * 100;

        if (p >= 100) { return 100; }
        if (p >= 95) { return 95; }
        if (p >= 75) { return 75; }
        if (p >= 50) { return 50; }

        return 0;

    }

    async invalidateCheckpointKeys(project, obj) {

        this.project = project;
        winston.verbose("invalidateCheckpointKeys project " + project._id);
        let requests_key = await this.generateKey(obj, 'requests');
        let tokens_key = await this.generateKey(obj, 'tokens');
        let email_key = await this.generateKey(obj, 'email');
        
        let checkpoints = ['50', '75', '95', '100']

        checkpoints.forEach( async (checkpoint) => {
            let nrequests_key = requests_key + ":notify:" + checkpoint;
            let ntokens_key = tokens_key + ":notify:" + checkpoint;
            let nemail_key = email_key + ":notify:" + checkpoint;

            winston.verbose("invalidateCheckpointKeys nrequests_key: " + nrequests_key);
            winston.verbose("invalidateCheckpointKeys ntokens_key: " + ntokens_key);
            winston.verbose("invalidateCheckpointKeys nemail_key: " + nemail_key);

            this.tdCache.del(nrequests_key);
            this.tdCache.del(ntokens_key);
            this.tdCache.del(nemail_key);

            return true;
        })

    }

    async generateQuotesObject(quotes, limits) {
        let quotes_obj = {
            requests: {
                quote: quotes.requests.quote,
                perc: ((quotes.requests.quote / limits['requests']) * 100).toFixed(1)
            },
            tokens: {
                quote: quotes.tokens.quote,
                perc: ((quotes.tokens.quote / limits['tokens']) * 100).toFixed(1)
            },
            email: {
                quote: quotes.email.quote,
                perc: ((quotes.email.quote / limits['email']) * 100).toFixed(1)
            }
        }
        return quotes_obj
    }


    async getPlanLimits(project) {

        if (project) {
            this.project = project
        };

        let limits;
        const plan = this.project.profile.name;

        if (this.project.profile.type === 'payment') {

            switch (plan) {
                case 'Basic':
                    limits = PLANS_LIST.BASIC;
                    break;
                case 'Premium':
                    limits = PLANS_LIST.PREMIUM;
                    break;
                case 'Custom':
                    limits = PLANS_LIST.CUSTOM;
                    break;
                case 'Growth':  // OLD PLAN
                    limits = PLANS_LIST.BASIC
                    break;
                case 'Scale':   // OLD PLAN
                    limits = PLANS_LIST.PREMIUM
                    break;
                case 'Plus':    // OLD PLAN
                    limits = PLANS_LIST.CUSTOM
                    break;
                default:
                    limits = PLANS_LIST.FREE_TRIAL;
            }
        } else {

            if (this.project.trialExpired === false) {
                limits = PLANS_LIST.FREE_TRIAL
            } else {
                limits = PLANS_LIST.SANDBOX;
            }

        }
        if (this.project?.profile?.quotes) {
            let profile_quotes = this.project?.profile?.quotes;
            const merged_quotes = Object.assign({}, limits, profile_quotes);
            winston.verbose("Custom Limits: ", limits)
            return merged_quotes;
        } else {
            winston.verbose("Default Limits: ", limits)
            return limits;
        }
    }



    start() {
        winston.verbose('QuoteManager start');

        if (process.env.QUOTES_ENABLED !== undefined) {
            if (process.env.QUOTES_ENABLED === false || process.env.QUOTES_ENABLED === 'false') {
                quotes_enabled = false;
            }
        }

        winston.info("QUOTES ENABLED: " + quotes_enabled);

        // TODO - Try to generalize to avoid repetition
        let incrementEventHandler = (object) => { }
        let checkEventHandler = (object) => { }


        // REQUESTS EVENTS - START
        // requestEvent.on('request.create.quote.before', async (payload) => {
        //     let result = await this.checkQuote(payload.project, payload.request, 'requests');
        //     if (result == true) {
        //         winston.info("Limit not reached - a request can be created")
        //     } else {
        //         winston.info("Requests limit reached for the current plan!")
        //     }
        //     return result;
        // });

        requestEvent.on('request.create.quote', async (payload) => {
            if (quotes_enabled === true) {
                winston.verbose("request.create.quote event catched");
                let result = await this.incrementRequestsCount(payload.project, payload.request);

                
                return result;
            } else {
                winston.verbose("QUOTES DISABLED - request.create.quote event")
            }
        })
        // REQUESTS EVENTS - END


        // MESSAGES EVENTS - START
        // messageEvent.on('message.create.quote.before', async (payload) => {
        //     let result = await this.checkQuote(payload.project, payload.message, 'messages');
        //     if (result == true) {
        //         winston.info("Limit not reached - a message can be created")
        //     } else {
        //         winston.info("Messages limit reached for the current plan!")
        //     }
        //     return result;
        // })

        messageEvent.on('message.create.quote', async (payload) => {
            if (quotes_enabled === true) {
                winston.verbose("message.create.quote event catched");
                let result = await this.incrementMessagesCount(payload.project, payload.message);
                return result;
            } else {
                winston.verbose("QUOTES DISABLED - message.create.quote event")
            }
        })
        // MESSAGES EVENTS - END


        // EMAIL EVENTS - START - Warning! Can't be used for check quote
        // emailEvent.on('email.send.before', async (payload) => {
        //     let result = await this.checkQuote(payload.project, payload.email, 'email');
        //     if (result == true) {
        //         winston.info("Limit not reached - a message can be created")
        //     } else {
        //         winston.info("Email limit reached for the current plan!")
        //     }
        //     return result;
        // })

        emailEvent.on('email.send.quote', async (payload) => {
            if (quotes_enabled === true) {
                winston.verbose("email.send event catched");
                let result = await this.incrementEmailCount(payload.project, payload.email);
                return result;
            } else {
                winston.verbose("QUOTES DISABLED - email.send event")
            }
        })
        // EMAIL EVENTS - END
    }


}

module.exports = { QuoteManager };