const { ceil, floor } = require('lodash');
let winston = require('../config/winston');
const requestEvent = require('../event/requestEvent');
const messageEvent = require('../event/messageEvent');
const emailEvent = require('../event/emailEvent');

let Project = require("../models/project");

const PLANS_LIST = {
    FREE_TRIAL: { users: 2, requests: 3000, messages: 100000, chatbots: 20, kbs: 3, kb_pages: 500, ai_tokens: 250000 }, // same as PREMIUM
    SANDBOX: { users: 1, requests: 200, messages: 100000, chatbots: 2, kbs: 1, kb_pages: 50, ai_tokens: 10000 },
    BASIC: { users: 1, requests: 810, messages: 100000, chatbots: 5, kbs: 2, kb_pages: 250, ai_tokens: 50000 },
    PREMIUM: { users: 2, requests: 3000, messages: 100000, chatbots: 20, kbs: 3, kb_pages: 500, ai_tokens: 250000 },
    CUSTOM: { users: 100, requests: 10000, messages: 100000, chatbots: 100, kbs: 100, kb_pages: 1000, ai_tokens: 100000 } // manage it --> get limit directly from project info
}

const typesList = ['requests', 'messages', 'email', 'tokens']

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

    async incrementRequestsCount(project, request) {

        this.project = project;
        let key = await this.generateKey(request, 'requests');
        winston.verbose("[QuoteManager] incrementRequestsCount key: " + key);

        await this.tdCache.incr(key)
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
        winston.info("[QuoteManager] incrementEmailCount key: " + key);

        await this.tdCache.incr(key)
        return key;
    }

    async incrementTokenCount(project, data) { // ?? cosa passo? il messaggio per vedere la data?

        this.project = project;
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

    async getCurrentQuote(project, object, type) {

        this.project = project;
        let key = await this.generateKey(object, type);
        winston.verbose("[QuoteManager] getCurrentQuote key: " + key);

        // await this.tdCache.incrby(key, data.tokens);

        // this.tdCache.get(key, (err, quote) => {
        //     console.log("quote: ", quote);
        //     return Number(quote);
        // })
        let quote = await this.tdCache.get(key);
        return Number(quote);
    }

    async getAllQuotes(project, obj) {

        console.log("*** get all quotes")
        console.log("*** get all quotes project: ", project)
        console.log("*** get all quotes obj: ", obj);
        this.project = project;

        let quotes = {}
        for (let type of typesList) {
            console.log("*** get all quotes --> search for type: ", type);
            let key = await this.generateKey(obj, type);
            console.log("*** get all quotes --> key generated: ", key);
            let quote = await this.tdCache.get(key);
            console.log("*** get all quotes --> quote retrieved: ", quote);

            quotes[type] = {
                quote: quote
            };
            console.log("*** get all quotes --> quotes: ", quotes);
        }

        return quotes;
        
    }

    async checkQuote(project, object, type) {

        this.project = project;
        let limits = await this.getPlanLimits();
        // console.log("\n\n---->limits: ", limits)
        let quote = await this.getCurrentQuote(project, object, type);
        // console.log("\n\n***** quote: ", quote)

        if (quote == null) {
            return true;
        }

        // console.log("limits[type]: ", type)
        // console.log("limits[type]: ", limits[type])
        if (quote <= limits[type]) {
            return true;
        } else {
            // console.log("return false??")
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
        winston.verbose('QuoteManager start');

        // TODO - Try to generalize to avoid repetition
        let incrementEventHandler = (object) => { }
        let checkEventHandler = (object) => { }

        // REQUESTS EVENTS
        requestEvent.on('request.create.quote.before', async (payload) => {
            let result = await this.checkQuote(payload.project, payload.request, 'requests');
            if (result == true) {
                winston.info("Limit not reached - a request can be created")
            } else {
                winston.info("Requests limit reached for the current plan!")
            }
            return result;
        });

        requestEvent.on('request.create.quote', async (payload) => {
            winston.verbose("request.create.quote event catched"); 
            let result = await this.incrementRequestsCount(payload.project, payload.request);
            //console.log("request.create.simple event result: ", result);
            return result;
        })


        // MESSAGES EVENTS
        messageEvent.on('message.create.quote.before', async (payload) => {
            console.log("message.create.quote.before event fired");
            let result = await this.checkQuote(payload.project, payload.message, 'messages');
            if (result == true) {
                winston.info("Limit not reached - a message can be created")
            } else {
                winston.info("Messages limit reached for the current plan!")
            }
            return result;
        })

        messageEvent.on('message.create.quote', async (payload) => {
            console.log("message.create.quote event fired");
            winston.verbose("message.create.quote event catched");
            let result = await this.incrementMessagesCount(payload.project, payload.message);
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

        emailEvent.on('email.send.quote', async (payload) => {
            winston.info("email.send event catched");
            let result = await this.incrementEmailCount(payload.project, payload.email);
            //console.log("email.send event result: ", result);
            return result;
        })
    }


}


module.exports = { QuoteManager };