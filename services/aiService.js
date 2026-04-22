var winston = require('../config/winston');
const axios = require("axios").default;
require('dotenv').config();
const jwt = require("jsonwebtoken")
const FormData = require('form-data');

let openai_endpoint = process.env.OPENAI_ENDPOINT;
let gemini_api_base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
let elevenlabs_api_base = process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io';
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

  /**
   * Transcribe audio. Second argument may be an API key string (OpenAI) or options object.
   * Resolves to an axios-like shape: { data: { text } } for compatibility with existing callers.
   */
  async transcription(buffer, options = {}) {

    const provider = (options.provider || 'openai').toLowerCase();
  
    switch (provider) {
      case 'openai':
        return this.transcriptionOpenai(buffer, options);
      case 'google':
        return this.transcriptionGoogle(buffer, options);
      case 'elevenlabs':
        return this.transcriptionElevenLabs(buffer, options);
      default:
        return Promise.reject(new Error('Unsupported transcription provider: ' + provider));
    }
  }

  async transcriptionOpenai(buffer, options = {}) {
    const model = options.model || 'whisper-1';
    const language = options.language || 'en';
    const filename = options.filename || 'audiofile';
    const contentType = options.contentType || 'audio/mpeg';

    const formData = new FormData();
    formData.append('file', buffer, { filename, contentType });
    formData.append('model', model);
    //formData.append('language', language);

    const res = await axios.post(
      openai_endpoint + "/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': "Bearer " + options.key
        }
      }
    );
    return { data: res.data };
  }

  async transcriptionGoogle(buffer, options = {}) {
    
    const apiKey = options.key;
    const model = options.model || 'gemini-2.0-flash';
    const contentType = options.contentType || 'audio/mpeg';
    const language = options.language !== undefined && options.language !== null
      ? options.language
      : 'en';
    const langHint = language && String(language).trim() !== ''
      ? ` The speech is primarily in language with ISO-639-1 code: ${language}.`
      : '';

    const prompt = `Transcribe the speech in this audio verbatim. Reply with only the transcript text, no labels or commentary.${langHint}`;

    const url = `${gemini_api_base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: contentType,
              data: buffer.toString('base64')
            }
          }
        ]
      }]
    };

    const res = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' }
    });

    const parts = res.data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text).filter(Boolean).join('').trim();
    const blockReason = res.data?.promptFeedback?.blockReason;
    if (!text && blockReason) {
      return Promise.reject(new Error('Gemini blocked the request: ' + blockReason));
    }

    return { data: { text: text || '' } };
  }

  async transcriptionElevenLabs(buffer, options = {}) {
    
    const apiKey = options.key;
    const modelId = options.model || 'scribe_v2';
    const filename = options.filename || 'audiofile';
    const contentType = options.contentType || 'audio/mpeg';
    const language = options.language !== undefined && options.language !== null
      ? options.language
      : 'en';

    const formData = new FormData();
    formData.append('model_id', modelId);
    formData.append('file', buffer, { filename, contentType });
    if (language && String(language).trim() !== '') {
      formData.append('language_code', language);
    }

    const res = await axios.post(
      `${elevenlabs_api_base}/v1/speech-to-text`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'xi-api-key': apiKey
        }
      }
    );

    const data = res.data;
    let text = '';
    if (data && typeof data.text === 'string') {
      text = data.text;
    } else if (data && Array.isArray(data.transcripts)) {
      text = data.transcripts.map((t) => t.text).filter(Boolean).join('\n');
    }

    return { data: { text: text || '' } };
  }

  async speech(text, options = {}) {
    const provider = (options.provider || 'openai').toLowerCase();
  
    switch (provider) {
      case 'openai':
        if (options.stream) {
          return this.speechOpenaiStream(text, options);
        }
        return this.speechOpenai(text, options);
  
      default:
        return Promise.reject(new Error('Unsupported speech provider: ' + provider));
    }
  }

  async speechOpenai(text, options = {}) {
    const model = options.model || 'gpt-4o-mini-tts';
    const voice = options.voice || 'marin';
    const instructions = options.instructions;
    const response_format = options.response_format || 'mp3';
    const formatMeta = {
      mp3: { contentType: 'audio/mpeg', extension: 'mp3' },
      opus: { contentType: 'audio/opus', extension: 'opus' },
      aac: { contentType: 'audio/aac', extension: 'aac' },
      flac: { contentType: 'audio/flac', extension: 'flac' },
      wav: { contentType: 'audio/wav', extension: 'wav' },
      pcm: { contentType: 'audio/pcm', extension: 'pcm' }
    };
    const meta = formatMeta[response_format] || formatMeta.mp3;



    const payload = { input: text, model, voice, response_format };
    if (instructions) {
      payload.instructions = instructions;
    }
    const res = await axios.post(
      openai_endpoint + "/audio/speech",
      payload,
      {
 
        responseType: 'arraybuffer',
        headers: {
          'Authorization': "Bearer " + options.key
        }
      }
    );
    const buffer = Buffer.isBuffer(res.data) ? res.data : Buffer.from(res.data);
    return { data: buffer, contentType: meta.contentType, extension: meta.extension };
  }

  async speechOpenaiStream(text, options = {}) {
    const model = options.model || 'tts-1';
    const voice = options.voice || 'alloy';
    const instructions = options.instructions;
    const response_format = options.response_format || 'mp3';
  
    const formatMeta = {
      mp3: { contentType: 'audio/mpeg', extension: 'mp3' },
      opus: { contentType: 'audio/opus', extension: 'opus' },
      aac: { contentType: 'audio/aac', extension: 'aac' },
      flac: { contentType: 'audio/flac', extension: 'flac' },
      wav: { contentType: 'audio/wav', extension: 'wav' },
      pcm: { contentType: 'audio/pcm', extension: 'pcm' }
    };
  
    const meta = formatMeta[response_format] || formatMeta.mp3;
  
    const payload = {
      input: text,
      model,
      voice,
      response_format
    };
  
    if (instructions) {
      payload.instructions = instructions;
    }
  
    const res = await axios.post(
      openai_endpoint + "/audio/speech",
      payload,
      {
        responseType: 'stream', // 👈 fondamentale
        headers: {
          Authorization: "Bearer " + options.key
        }
      }
    );
  
    return {
      data: res.data, // Readable stream
      contentType: meta.contentType,
      extension: meta.extension
    };
  }

  async speechGoogle(text, options = {}) {
    const apiKey = options.key;
    const model = options.model || 'gemini-2.0-flash';
    const voice = options.voice || 'alloy';
    const language = options.language || 'en';

    const res = await axios.post(
      `${gemini_api_base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      { text, voice, language },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return { data: res.data };
  }

  async speechElevenLabs(text, options = {}) {
    const apiKey = options.key;
    const modelId = options.model || 'eleven_multilingual_v2';
    const voice = options.voice || 'alloy';
    const language = options.language || 'en';

    const res = await axios.post(
      `${elevenlabs_api_base}/v1/text-to-speech`,
      { text, model_id: modelId, voice, language },
      {
        headers: {
          'xi-api-key': apiKey
        }
      }
    );
    return { data: res.data };
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

    const config = {
      url: base_url + "/qa",
      headers: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: 'POST'
    };

    return new Promise((resolve, reject) => {

      axios(config).then((resbody) => {
        resolve(resbody);
      }).catch((err) => {
        reject(err);
      })

    })
  }

  /**
   * Stream /qa from KB service. Uses Axios with responseType: 'stream'.
   * Returns the raw Axios response (resp.data is the Node.js Readable stream).
   */
  askStream(data) {
    winston.debug("askStream data: ", data);
    let base_url = kb_endpoint_qa;
    if (data.hybrid || data.search_type === 'hybrid') {
      base_url = kb_endpoint_qa_gpu;
    }
    winston.debug("[OPENAI SERVICE] kb stream endpoint: " + base_url);

    return axios({
      url: base_url + "/qa",
      headers: {
        'Content-Type': 'application/json'
      },
      data: data,
      method: 'POST',
      responseType: 'stream'
    });
  }

  getContentChunks(namespace_id, content_id, engine, hybrid) {
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