var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
let Integration = require('../models/integrations');
const aiService = require('../services/aiService');
const multer = require('multer');
const fileUtils = require('../utils/fileUtils');
const { MODELS_MULTIPLIER } = require('../utils/aiUtils');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const FileGridFsService = require('../services/fileGridFsService');

const fileService = new FileGridFsService('files');
const chatFileExpirationTime = parseInt(process.env.CHAT_FILE_EXPIRATION_TIME || '2592000', 10);

let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.debug("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.debug("Max upload file size is infinity");
}
var upload = multer({limits: uploadlimits});

const TRANSCRIPTION_DEFAULTS = {
    provider: 'openai',
    model: 'whisper-1',
    voice: 'alloy',
    language: 'en'
};

const SPEECH_DEFAULTS = {
    provider: 'openai',
    model: 'tts-1',
    voice: 'coral',
    language: 'en'
};

router.post('/preview', async (req, res) => {

    let id_project = req.projectid;
    let body = req.body;
    let key;
    let publicKey = false;

    if (!body.llm) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'llm'" });
    }

    let integration = await Integration.findOne({ id_project: id_project, name: body.llm }).catch((err) => {
        winston.error("Error finding integration with name: ", body.llm);
        return res.status(500).send({ success: false, error: "Error finding integration for " + body.llm});
    })

    if (!integration) {
        winston.verbose("Integration not found for " + body.llm)
        if (body.llm === "openai") {
            winston.verbose("Try to retrieve shared OpenAI key")
            if (!process.env.GPTKEY) {
                winston.error("Shared key for OpenAI not configured.");
                return res.status(404).send({ success: false, error: "No key found for " + body.llm });
            }
            key = process.env.GPTKEY;
            publicKey = true;
            winston.verbose("Using shared OpenAI key as fallback.");
        } else {
            winston.verbose("Integration for " + body.llm + " not found.")
            return res.status(404).send({ success: false, error: "Integration for " + body.llm + " not found." })
        }
    } else {
        if (!integration?.value?.apikey && body.llm !== "ollama") {
            return res.status(422).send({ success: false, error: "The key provided for " + body.llm + " is not valid or undefined." });
        }
        key = integration.value.apikey;
    }

    let obj = { createdAt: new Date() };

    let quoteManager = req.app.get('quote_manager');
    if (publicKey === true) {
        let isAvailable = await quoteManager.checkQuote(req.project, obj, 'tokens');
        if (isAvailable === false) {
            return res.status(403).send({ success: false, message: "Tokens quota exceeded", error_code: 13001})
        }
    }

    let json = {
        question: body.question,
        llm: body.llm,
        model: body.model,
        llm_key: key,
        temperature: body.temperature,
        max_tokens: body.max_tokens
    }

    if (body.context) {
        json.system_context = body.context;
    }

    if (body.llm === 'ollama') {
        json.llm_key = "";
        json.model = {
            name: body.model,
            url: integration.value.url,
            token: integration.value.token
        },
        json.stream = false;
    }

    winston.debug("Preview LLM json: ", json);

    aiService.askllm(json).then((response) => {
        winston.verbose("Askllm response: ", response);
        if (publicKey === true) {
            let multiplier = MODELS_MULTIPLIER[json.model];
            if (!multiplier) {
                multiplier = 1;
                winston.info("No multiplier found for AI model (llm) " + json.model)
            }
            obj.multiplier = multiplier;
            obj.tokens = response.data?.prompt_token_info?.total_tokens || 0;
            quoteManager.incrementTokenCount(req.project, obj);
        }
        res.status(200).send(response.data)
    }).catch((err) => {
        if (err.response?.data?.detail?.[0]) {
            res.status(400).send({ success: false, error: err.response.data.detail[0]?.msg, detail: err.response.data.detail });
        } else if (err.response?.data?.detail?.answer) {
            res.status(400).send({ success: false, error: err.response.data.detail.answer, detail: err.response.data.detail });
        } else if (err.response?.data) {
            res.status(500).send({ success: false, error: err.response.data });
        } else {
            res.status(500).send({ success: false, error: err });
        }
    })

})

router.post('/transcription', upload.single('uploadFile'), async (req, res) => {

    let id_project = req.projectid;

    const provider = (req.body.provider || TRANSCRIPTION_DEFAULTS.provider).toLowerCase();
    const model = req.body.model || TRANSCRIPTION_DEFAULTS.model;
    const voice = req.body.voice || TRANSCRIPTION_DEFAULTS.voice;
    const language = req.body.language !== undefined && req.body.language !== null
        ? req.body.language
        : TRANSCRIPTION_DEFAULTS.language;

    let file;
    let contentType = 'audio/mpeg';
    let filename = 'audiofile';
    if (req.body.url) {
        file = await fileUtils.downloadFromUrl(req.body.url);
    } else if (req.file) {
        file = req.file.buffer;
        contentType = req.file.mimetype || contentType;
        filename = req.file.originalname || filename;
    } else {
        return res.status(400).send({ success: false, error: "No audio file or URL provided"})
    }

    let key;

    let integration;
    try {
        integration = await Integration.findOne({ id_project: id_project, name: provider });
    } catch (err) {
        winston.error("Error finding integration for " + provider);
        return res.status(500).send({ success: false, error: "Error finding integration for " + provider});
    }
    if (!integration) {
        winston.verbose("Integration for " + provider + " not found.")
        if (provider === 'openai') {
            winston.verbose("Try to retrieve shared OpenAI key for transcription")
            if (!process.env.GPTKEY) {
                winston.error("Shared key for OpenAI not configured.");
                return res.status(404).send({ success: false, error: "No key found for " + provider });
            }
            key = process.env.GPTKEY;
            winston.verbose("Using shared OpenAI key as fallback for transcription.");
        } else {
            return res.status(404).send({ success: false, error: "Integration for " + provider + " not found." })
        }
    } else if (!integration?.value?.apikey) {
        if (provider === 'openai' && process.env.GPTKEY) {
            key = process.env.GPTKEY;
            winston.verbose("Using shared OpenAI key (integration key missing) for transcription.");
        } else {
            return res.status(422).send({ success: false, error: "The key provided for " + provider + " is not valid or undefined." })
        }
    } else {
        key = integration.value.apikey;
    }

    aiService.transcription(file, {
        key,
        provider,
        model,
        voice,
        language,
        filename,
        contentType
    }).then((response) => {
        winston.verbose("Transcript response: ", response.data);
        res.status(200).send({ text: response.data.text});
    }).catch((err) => {
        winston.error("err: ", err.response?.data)
        res.status(500).send({ success: false, error: err });
    })

})

router.post('/speech', async (req, res) => {

    let id_project = req.projectid;

    const provider = (req.body.provider || SPEECH_DEFAULTS.provider).toLowerCase();
    const model = req.body.model || SPEECH_DEFAULTS.model;
    const voice = req.body.voice || SPEECH_DEFAULTS.voice;
    const language = req.body.language !== undefined && req.body.language !== null
        ? req.body.language
        : SPEECH_DEFAULTS.language;
    const instructions = req.body.instructions;

    let text = req.body.text;

    if (!text) {
        return res.status(400).send({ success: false, error: "No text provided"})
    }
    
    let key;

    let integration;
    try {
        integration = await Integration.findOne({ id_project: id_project, name: provider });
    } catch (err) {
        winston.error("Error finding integration for " + provider);
        return res.status(500).send({ success: false, error: "Error finding integration for " + provider});
    }
    if (!integration) {
        winston.verbose("Integration for " + provider + " not found.")
        if (provider === 'openai') {
            winston.verbose("Try to retrieve shared OpenAI key for speech")
            if (!process.env.GPTKEY) {
                winston.error("Shared key for OpenAI not configured.");
                return res.status(404).send({ success: false, error: "No key found for " + provider });
            }
            key = process.env.GPTKEY;
    
        }
    } else if (!integration?.value?.apikey) {
        if (provider === 'openai' && process.env.GPTKEY) {
            key = process.env.GPTKEY;
            winston.verbose("Using shared OpenAI key (integration key missing) for speech.");
        } else {
            return res.status(422).send({ success: false, error: "The key provided for " + provider + " is not valid or undefined." })
        }
    } else {
        key = integration.value.apikey;
    }

    try {
        const response = await aiService.speech(text, {
            key,
            provider,
            model,
            voice,
            language,
            instructions,
            response_format: req.body.response_format
        });
        const audioBuffer = response.data;
        const contentType = response.contentType || 'audio/mpeg';
        const ext = (response.extension || 'mp3').replace(/^\./, '');

        const expireAt = new Date(Date.now() + chatFileExpirationTime * 1000);
        var subfolder = '/public';
        if (req.user && req.user.id) {
            subfolder = '/users/' + req.user.id;
        }
        const folder = uuidv4();
        const filePath = `uploads${subfolder}/files/${folder}/speech.${ext}`;

        await fileService.createFile(filePath, audioBuffer, undefined, contentType, {
            metadata: { expireAt }
        });
        const fileRecord = await fileService.find(filePath);
        await mongoose.connection.db.collection('files.chunks').updateMany(
            { files_id: fileRecord._id },
            { $set: { 'metadata.expireAt': expireAt } }
        );

        winston.verbose('Speech audio stored at:', filePath);
        return res.status(201).send({
            message: 'Speech audio saved successfully',
            filename: encodeURIComponent(filePath),
            contentType
        });
    } catch (err) {
        winston.error('Speech error: ', err.response?.data || err);
        return res.status(500).send({ success: false, error: err.response?.data || err.message || err });
    }
})

  
module.exports = router;
