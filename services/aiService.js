var winston = require('../config/winston');
const axios = require("axios").default;
require('dotenv').config();
const jwt = require("jsonwebtoken")
const FormData = require('form-data');

let openai_endpoint = process.env.OPENAI_ENDPOINT;
let kb_endpoint_train = process.env.KB_ENDPOINT_TRAIN;
let kb_endpoint_qa = process.env.KB_ENDPOINT_QA;
let kb_endpoint_train_gpu = process.env.KB_ENDPOINT_TRAIN_GPU;
let kb_endpoint_qa_gpu = process.env.KB_ENDPOINT_QA_GPU;
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

  // KB - Deprecated?
  // checkStatus(data) {
  //   winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

  //   return new Promise((resolve, reject) => {

  //     axios({
  //       url: kb_endpoint + "/scrape/status",
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       data: data,
  //       method: 'POST'
  //     }).then((resbody) => {
  //       resolve(resbody);
  //     }).catch((err) => {
  //       reject(err);
  //     })

  //   })
  // }

  // Deprecated? 
  // startScrape(data) {
  //   winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

  //   return new Promise((resolve, reject) => {

  //     axios({
  //       url: kb_endpoint + "/scrape",
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       data: data,
  //       method: 'POST'
  //     }).then((resbody) => {
  //       resolve(resbody);
  //     }).catch((err) => {
  //       reject(err);
  //     })

  //   })
  // }

  // Deprecated?  
  // ask(data) {
  //   winston.debug("[OPENAI SERVICE] kb endpoint: " + kb_endpoint);

  //   return new Promise((resolve, reject) => {

  //     axios({
  //       url: kb_endpoint + "/qa",
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       data: data,
  //       method: 'POST'
  //     }).then((resbody) => {
  //       resolve(resbody);
  //     }).catch((err) => {
  //       reject(err);
  //     })

  //   })
  // }

  singleScrape(data) {
    let base_url = kb_endpoint_train;
    if (data.hybrid) {
      base_url = kb_endpoint_train_gpu;
    }
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      axios({
        url: base_url + "/scrape/single",
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
    let base_url = kb_endpoint_train;
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      axios({
        url: base_url + "/scrape/status",
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
    winston.debug("askNamespace data: ", data);
    let base_url = kb_endpoint_qa;
    if (data.hybrid || data.search_type === 'hybrid') {
      base_url = kb_endpoint_qa_gpu;
    }
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      axios({
        url: base_url + "/qa",
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
    let base_url = kb_endpoint_train;
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      let payload = { engine: engine };
      let token = jwt.sign(payload, secret);
      console.log("token: ", token)
      axios({
        url: base_url + "/id/" + content_id + "/namespace/" + namespace_id + "/" + token,
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
    let base_url = kb_endpoint_train;
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      axios({
        url: base_url + "/delete/id",
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
    let base_url = kb_endpoint_train;
    winston.debug("[OPENAI SERVICE] kb endpoint: " + base_url);

    return new Promise((resolve, reject) => {

      axios({
        url: base_url + "/delete/namespace",
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

const aiService = new AiService();

module.exports = aiService;