const { ceil, floor } = require('lodash');
let winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const emailEvent = require('../event/emailEvent');

const PLANS_LIST = {
    FREE_TRIAL: { users: 2, requests: 3000, chatbots: 20, kbs: 3, kb_pages: 500, ai_tokens: 250000 }, // same as PREMIUM
    SANDBOX: { users: 1, requests: 200, chatbots: 2, kbs: 1, kb_pages: 50, ai_tokens: 10000 },
    BASIC: { users: 1, requests: 810, chatbots: 5, kbs: 2, kb_pages: 250, ai_tokens: 50000 },
    PREMIUM: { users: 2, requests: 3000, chatbots: 20, kbs: 3, kb_pages: 500, ai_tokens: 250000 },
    CUSTOM: { users: 100, conversations: 10000, chatbots: 100, kbs: 100, kb_pages: 1000, ai_tokens: 100000 } // manage it --> get limit directly from project info
}

const typesList = ['requests', 'messages', 'email', 'tokens']

class QuoteManager {

    constructor(config) {

        if (!config) {
            throw new Error('config is mandatory')
        }

        if (!config.project) {
            throw new Error('config.project is mandatory')
        }

        if (!config.tdCache) {
            throw new Error('config.tdCache is mandatory')
        }

        this.project = config.project;
        this.tdCache = config.tdCache;

    }

    async incrementRequestsCount(request) {

        let key = await this.generateKey(request, 'requests');
        winston.info("[QuoteManager] incrementRequestsCount key: " + key);

        await this.tdCache.incr(key)
        return key;
    }

    async incrementMessagesCount(message) {

        let key = await this.generateKey(message, 'messages');
        winston.info("[QuoteManager] incrementMessagesCount key: " + key);

        await this.tdCache.incr(key)
        return key;
    }

    async incrementEmailCount(email) {
        let key = await this.generateKey(email, 'email');
        winston.info("[QuoteManager] incrementEmailCount key: " + key);

        await this.tdCache.incr(key)
        return key;
    }

    async incrementTokenCount(data) { // ?? cosa passo? il messaggio per vedere la data?

        let key = await this.generateKey(data, 'tokens');
        winston.info("[QuoteManager] incrementTokenCount key: " + key);

        await this.tdCache.incrby(key, data.tokens);
        return key;
    }


    async generateKey(object, type) {

        let subscriptionDate;
        if (this.project.profile.subStart) {
            subscriptionDate = this.project.profile.subStart;
        } else {
            subscriptionDate = this.project.createdAt;
        }
        let objectDate = object.createdAt;

        // trial_expired per quelli free
        // subscription_is_active per quelly payment
        

        // converts date in timestamps and transform from ms to s
        const objectDateTimestamp = ceil(objectDate.getTime() / 1000);
        const subscriptionDateTimestamp = ceil(subscriptionDate.getTime() / 1000);

        let ndays = (objectDateTimestamp - subscriptionDateTimestamp) / 86400;  // 86400 is the number of seconds in 1 day
        let nmonths = floor(ndays / 30); //number of month to add to the initial subscription date;

        let date = new Date(subscriptionDate);
        date.setMonth(date.getMonth() + nmonths);

        return "quotes:" + type + ":" + this.project._id + ":" + date.toLocaleDateString();
    }

    async getCurrentQuote(object, type) {

        let key = await this.generateKey(object, type);
        winston.info("[QuoteManager] getCurrentQuote key: " + key);

        // await this.tdCache.incrby(key, data.tokens);

        // this.tdCache.get(key, (err, quote) => {
        //     console.log("quote: ", quote);
        //     return Number(quote);
        // })
        let quote = await this.tdCache.get(key);
        return Number(quote);
    }

    async getAllQuotes(obj) {

        let quotes = {}
        console.log("getAllQuotes called...")
        for (let type of typesList) {
            let key = await this.generateKey(obj, type);
            let quote = await this.tdCache.get(key);

            quotes[type] = {
                quote: quote
            };

            console.log("quotes: ", quotes);

        }

        return quotes;
        
    }

    async checkQuote(object, type) {

        let limits = await this.getPlanLimits();
        let quote = await this.getCurrentQuote(object, type)

        if (quote == null) {
            return true;
        }

        if (quote <= limits[type]) {
            return true;
        } else {
            return false;
        }
    }

    async getPlanLimits() {

        let limits;
        if (this.project.profile.type === 'payment') {

            const plan = this.project.profile.name;
            switch (plan) {
                case 'Sandbox':
                    limits = PLANS_LIST.SANDBOX;
                    break;
                case 'Basic':
                    limits = PLANS_LIST.BASIC;
                    break;
                case 'Premium':
                    limits = PLANS_LIST.PREMIUM;
                    break;
                case 'Custom':
                    winston.info("get limits from project info")
                    limits = PLANS_LIST.CUSTOM;
            }
        } else {
            limits = PLANS_LIST.FREE_TRIAL;
        }
        return limits;
    }



    start() {
        winston.info('QuoteManager start');

        // TODO - Try to generalize
        let incrementEventHandler = (object) => { }
        let checkEventHandler = (object) => { }


        // // REQUESTS EVENTS
        // requestEvent.on('request.create.before', async (request) => {
        //     let result = await this.checkQuote(request, 'requests');
        //     if (result == true) {
        //         winston.info("Limit not reached - a request can be created")
        //     } else {
        //         winston.info("Requests limit reached for the current plan!")
        //     }
        //     return result;
        // });

        // requestEvent.on('request.create.simple', async (request) => {

        //     winston.info("request.create.simple event catched"); 
        //     let result = await this.incrementRequestsCount(request);
        //     //console.log("request.create.simple event result: ", result);
        //     return result;
        // })


        // // MESSAGES EVENTS
        // messageEvent.on('message.create.before', async (message) => {
        //     let result = await this.checkQuote(message, 'messages');
        //     if (result == true) {
        //         winston.info("Limit not reached - a message can be created")
        //     } else {
        //         winston.info("Messages limit reached for the current plan!")
        //     }
        //     return result;
        // })

        // messageEvent.on('message.create.simple', async (message) => {
        //     winston.info("message.create.simple event catched");
        //     let result = await this.incrementMessagesCount(message);
        //     //console.log("message.create.simple event result: ", result);
        //     return result;
        // })


        // // EMAIL EVENTS
        // emailEvent.on('email.send.before', async (email) => {
        //     let result = await this.checkQuote(email, 'email');
        //     if (result == true) {
        //         winston.info("Limit not reached - a message can be created")
        //     } else {
        //         winston.info("Email limit reached for the current plan!")
        //     }
        //     return result;
        // })

        // emailEvent.on('email.send', async (email) => {
        //     winston.info("email.send event catched");
        //     let result = await this.incrementEmailCount(email);
        //     //console.log("email.send event result: ", result);
        //     return result;
        // })
    }


}
// EVENTS
// REQUESTS EVENTS
requestEvent.on('request.create.before', async (request) => {
    let result = await this.checkQuote(request, 'requests');
    if (result == true) {
        winston.info("Limit not reached - a request can be created")
    } else {
        winston.info("Requests limit reached for the current plan!")
    }
    return result;
});

requestEvent.on('request.create.simple', async (request) => {

    winston.info("request.create.simple event catched"); 
    let result = await this.incrementRequestsCount(request);
    //console.log("request.create.simple event result: ", result);
    return result;
})


// MESSAGES EVENTS
messageEvent.on('message.create.before', async (message) => {
    let result = await this.checkQuote(message, 'messages');
    if (result == true) {
        winston.info("Limit not reached - a message can be created")
    } else {
        winston.info("Messages limit reached for the current plan!")
    }
    return result;
})

messageEvent.on('message.create.simple', async (message) => {
    winston.info("message.create.simple event catched");
    let result = await this.incrementMessagesCount(message);
    //console.log("message.create.simple event result: ", result);
    return result;
})


// EMAIL EVENTS
emailEvent.on('email.send.before', async (email) => {
    let result = await this.checkQuote(email, 'email');
    if (result == true) {
        winston.info("Limit not reached - a message can be created")
    } else {
        winston.info("Email limit reached for the current plan!")
    }
    return result;
})

emailEvent.on('email.send', async (email) => {
    winston.info("email.send event catched");
    let result = await this.incrementEmailCount(email);
    //console.log("email.send event result: ", result);
    return result;
})
// var requestCreateBeforeEvent = async (request) => {
//     console.log('Event catched - REQUEST CREATE BEFORE');
//     let result = await this.incrementRequestCount(request);
//     console.log("increment conversation result: ", result);
//     return true;
// }

// // requestEvent.on('request.create.before', requestCreateBeforeEvent);
// // requestEvent.on('request.create.before', (request) => {
// //     console.log('Event catched - REQUEST CREATE BEFORE');
// // });

// requestEvent.on('request.create.before', requestCreateBeforeEvent);



module.exports = { QuoteManager };