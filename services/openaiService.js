var winston = require('../config/winston');
const axios = require("axios").default;
require('dotenv').config();

let openai_endpoint = process.env.OPENAI_ENDPOINT;
let kb_endpoint = process.env.KB_ENDPOINT;
let kb_endpoint_train = process.env.KB_ENDPOINT_TRAIN;
let kb_endpoint_qa = process.env.KB_ENDPOINT_QA;

class OpenaiService {

  // OPEN AI
  completions(data, gptkey) {

    winston.debug("[OPENAI SERVICE] openai endpoint: " + openai_endpoint);

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
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })

  }


  // PUGLIA AI
  checkStatus(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

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
        reject(err);
      })

    })
  }

  startScrape(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint + "/scrape",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  ask(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint + "/qa",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  // PUGLIA AI V2
  singleScrape(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_train);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_train + "/scrape/single",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  scrapeStatus(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_train);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_train + "/scrape/status",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })
    })
  }

  askNamespace(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_qa);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_qa + "/qa",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  deleteIndex(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_train);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_train + "/delete/id",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })
    })
  }

  deleteNamespace(data) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_train);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_train + "/delete/namespace",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })
    })
  }


}

var openaiService = new OpenaiService();

module.exports = openaiService;