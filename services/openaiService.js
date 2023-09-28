var winston = require('../config/winston');
const axios = require("axios").default;
var configGlobal = require('../config/global');
require('dotenv').config();

let openai_endpoint = process.env.OPENAI_ENDPOINT;
let kb_endpoint = process.env.KB_ENDPOINT;

class OpenaiService {
    
    // OPEN AI
    completions(data, gptkey) {
        
        winston.debug("[OPENAI SERVICE] openai endpoint: ", openai_endpoint);

        return new Promise((resolve, reject) => {

            axios({
                url: openai_endpoint + "/chat/completions",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer " + gptkey
                },
                data: data,
                method: 'POST'
            }).then((resbody) => {
                //winston.debug("[Openai] completions resbody: ", resbody.data);
                resolve(resbody);
            }).catch((err) => {
                console.log("err: ", err);
                // winston.error("[Openai] completions error: ", err);
                reject(err);
            })

        })

    }
    

    // PUGLIA AI
    checkStatus(data) {
        winston.debug("[OPENAI SERVICE] kb endpoint: ", kb_endpoint);

        return new Promise((resolve, reject) => {

            axios({
                url: kb_endpoint + "/scrape/status",
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data,
                method: 'POST'
            }).then((resbody) => {
                resolve(resbody);
            }).catch((err) => {
                console.log("err: ", err);
                reject(err);
            })

        })
    }

    startScrape(data) {
        winston.debug("[OPENAI SERVICE] kb endpoint: ", kb_endpoint);

        return new Promise((resolve, reject) => {

            axios({
                url: kb_endpoint + "/scrape/",
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data,
                method: 'POST'
            }).then((resbody) => {
                resolve(resbody);
            }).catch((err) => {
                console.log("err: ", err);
                reject(err);
            })

        })
    }

    ask(data) {
        winston.debug("[OPENAI SERVICE] kb endpoint: ", kb_endpoint);

        return new Promise((resolve, reject) => {

            axios({
                url: kb_endpoint + "/qa/",
                headers: {
                    'Content-Type': 'application/json'
                },
                data: data,
                method: 'POST'
            }).then((resbody) => {
                resolve(resbody);
            }).catch((err) => {
                console.log("err: ", err);
                reject(err);
            })

        })
    }
}

var openaiService = new OpenaiService();

module.exports = openaiService;