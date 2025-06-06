var winston = require('../config/winston');
const axios = require("axios").default;
require('dotenv').config();
const jwt = require("jsonwebtoken")
const FormData = require('form-data');

let openai_endpoint = process.env.OPENAI_ENDPOINT;
let kb_endpoint = process.env.KB_ENDPOINT;
let kb_endpoint_train = process.env.KB_ENDPOINT_TRAIN;
let kb_endpoint_qa = process.env.KB_ENDPOINT_QA;
let secret = process.env.JWT_SECRET_KEY;

class AiService {

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

  transcription(buffer, gptkey) {

    winston.debug("[OPENAI SERVICE] openai endpoint: " + openai_endpoint);

    return new Promise((resolve, reject) => {

      const formData = new FormData();
      formData.append('file', buffer, { filename: 'audiofile', contentType: 'audio/mpeg' });
      formData.append('model', 'whisper-1');

      axios({
        url: openai_endpoint + "/audio/transcriptions",
        headers: {
          ...formData.getHeaders(),
          'Authorization': "Bearer " + gptkey
        },
        data: formData,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  // LLM
  askllm(data) {
    winston.debug("[OPENAI SERVICE] llm endpoint: " + kb_endpoint_qa);

    return new Promise((resolve, reject) => {

      axios({
        url: kb_endpoint_qa + "/ask",
        headers: {
          'Content-Type': 'application/json'
        },
        data: data,
        method: 'POST'
      }).then((resbody) => {
        resolve(resbody)
      }).catch((err) => {
        reject(err)
      })
    })
  }


  // KB
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

  getContentChunks(namespace_id, content_id, engine) {
    winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint_train);

    return new Promise((resolve, reject) => {

      let payload = { engine: engine };
      let token = jwt.sign(payload, secret);
      axios({
        url: kb_endpoint_train + "/id/" + content_id + "/namespace/" + namespace_id + "/" + token,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }).then((resbody) => {
        resolve(resbody)
      }).catch((err) => {
        reject(err)
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

var aiService = new AiService();

module.exports = aiService;