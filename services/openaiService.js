var winston = require('../config/winston');
const axios = require("axios").default;
var configGlobal = require('../config/global');
require('dotenv').config();

let openai_endpoint = process.env.OPENAI_ENDPOINT;

class OpenaiService {
    
    completions(data, gptkey) {
        
        console.log("****** Serivcesssssssss openai_endpoint: ", openai_endpoint);

        return new Promise((resolve, reject) => {

            axios({
                url: this.openai_endpoint + "/chat/completions",
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

}

var openaiService = new OpenaiService();

module.exports = openaiService;