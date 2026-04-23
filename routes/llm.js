var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const fs = require('fs');
const path = require('path');
const os = require('os');
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
    model: 'gpt-4o-mini-tts',
    voice: 'marin',
    speed: 1.2,
    instructions: "Speak in a cheerful and positive tone.",
    response_format: 'mp3'
};

const SPEECH_PRELOAD_DIR = process.env.SPEECH_PRELOAD_DIR || os.tmpdir();
const SPEECH_PRELOAD_TTL_MS = parseInt(process.env.SPEECH_PRELOAD_TTL_MS || String(30 * 60 * 1000), 10);
const SPEECH_PRELOAD_MAX_BUFFER_BYTES = parseInt(process.env.SPEECH_PRELOAD_MAX_BUFFER_BYTES || String(512 * 1024), 10);

const FORMAT_CONTENT_TYPES = {
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    flac: 'audio/flac',
    wav: 'audio/wav',
    pcm: 'audio/pcm'
};

/**
 * Preload/stream fan-out store: id -> { status, path, listeners, buffer, ... }
 * @type {Map<string, object>}
 */
const speechStore = new Map();

function safePreloadId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,256}$/.test(id);
}

function contentTypeForFormat(responseFormat) {
    return FORMAT_CONTENT_TYPES[responseFormat] || FORMAT_CONTENT_TYPES.mp3;
}

function speechOptionsFromBody(body) {
    return {
        provider: (body.provider || SPEECH_DEFAULTS.provider).toLowerCase(),
        model: body.model || SPEECH_DEFAULTS.model,
        voice: body.voice || SPEECH_DEFAULTS.voice,
        speed: body.speed || SPEECH_DEFAULTS.speed,
        instructions: body.instructions || SPEECH_DEFAULTS.instructions,
        response_format: body.response_format || SPEECH_DEFAULTS.response_format
    };
}

async function resolveSpeechKey(id_project, provider) {
    let key;
    let integration;
    try {
        integration = await Integration.findOne({ id_project, name: provider });
    } catch (err) {
        winston.error('Error finding integration for ' + provider);
        return { error: 'Error finding integration for ' + provider, status: 500 };
    }
    if (!integration) {
        if (provider === 'openai') {
            if (!process.env.GPTKEY) {
                return { error: 'No key found for ' + provider, status: 404 };
            }
            key = process.env.GPTKEY;
        } else {
            return { error: 'Integration for ' + provider + ' not found.', status: 404 };
        }
    } else if (!integration?.value?.apikey) {
        if (provider === 'openai' && process.env.GPTKEY) {
            key = process.env.GPTKEY;
        } else {
            return {
                error: 'The key provided for ' + provider + ' is not valid or undefined.',
                status: 422
            };
        }
    } else {
        key = integration.value.apikey;
    }
    return { key };
}

function extensionForSpeechFormat(response_format) {
    const fmt = (response_format || 'mp3').replace(/^\./, '');
    const allowed = ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'];
    return allowed.includes(fmt) ? fmt : 'mp3';
}

function schedulePreloadTtl(id, entry) {
    if (SPEECH_PRELOAD_TTL_MS <= 0) {
        return;
    }
    entry.ttlTimer = setTimeout(() => {
        fs.unlink(entry.path, (err) => {
            if (err && err.code !== 'ENOENT') {
                winston.warn('Speech preload TTL unlink:', err.message);
            }
        });
        speechStore.delete(id);
    }, SPEECH_PRELOAD_TTL_MS);
}

function finalizePreloadCompleted(entry) {
    entry.status = 'completed';
    for (const client of entry.listeners) {
        try {
            if (!client.writableEnded) {
                client.end();
            }
        } catch (e) {
            winston.verbose('Speech preload listener end:', e.message);
        }
    }
    entry.listeners.clear();
}

function destroyPreloadListeners(entry, err) {
    for (const client of entry.listeners) {
        try {
            if (typeof client.destroy === 'function') {
                client.destroy(err);
            } else if (!client.writableEnded) {
                client.end();
            }
        } catch (e) {
            winston.verbose('Speech preload listener destroy:', e.message);
        }
    }
    entry.listeners.clear();
}

function removePreloadEntry(id) {
    const entry = speechStore.get(id);
    if (!entry) {
        return;
    }
    if (entry.ttlTimer) {
        clearTimeout(entry.ttlTimer);
    }
    if (entry.writeStream && !entry.writeStream.destroyed) {
        entry.writeStream.destroy();
    }
    speechStore.delete(id);
    fs.unlink(entry.path, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            winston.warn('Speech preload cleanup unlink:', unlinkErr.message);
        }
    });
}

async function runPreloadStream(id, text, aiOpts, entry) {
    const streamResponse = await aiService.speech(text, aiOpts);
    const contentType = streamResponse.contentType || 'audio/mpeg';
    entry.contentType = contentType;

    const ws = fs.createWriteStream(entry.path);
    entry.writeStream = ws;

    const src = streamResponse.data;

    src.on('data', (chunk) => {
        if (!Buffer.isBuffer(chunk)) {
            chunk = Buffer.from(chunk);
        }
        const ok = ws.write(chunk);
        for (const client of entry.listeners) {
            try {
                client.write(chunk);
            } catch (e) {
                winston.verbose('Speech preload fan-out write:', e.message);
            }
        }
        if (entry.bufferedBytes < SPEECH_PRELOAD_MAX_BUFFER_BYTES) {
            const room = SPEECH_PRELOAD_MAX_BUFFER_BYTES - entry.bufferedBytes;
            if (room > 0) {
                const slice = chunk.length <= room ? chunk : chunk.subarray(0, room);
                entry.buffer.push(slice);
                entry.bufferedBytes += slice.length;
            }
        }
        if (!ok) {
            src.pause();
        }
    });

    ws.on('drain', () => {
        src.resume();
    });

    src.on('error', (err) => {
        winston.error('Speech preload upstream error:', err);
        destroyPreloadListeners(entry, err);
        try {
            ws.destroy();
        } catch (e) {}
        removePreloadEntry(id);
    });

    ws.on('error', (err) => {
        winston.error('Speech preload file write error:', err);
        destroyPreloadListeners(entry, err);
        try {
            src.destroy();
        } catch (e) {}
        removePreloadEntry(id);
    });

    src.on('end', () => {
        ws.end();
    });

    ws.on('finish', () => {
        if (!speechStore.has(id)) {
            return;
        }
        finalizePreloadCompleted(entry);
        schedulePreloadTtl(id, entry);
    });
}

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

router.post('/preload/speech', async (req, res) => {
    const id = req.body.id;
    const text = req.body.text;

    if (!text) {
        return res.status(400).send({ success: false, error: 'No text provided' });
    }
    if (!id) {
        return res.status(400).send({ success: false, error: "Missing required parameter 'id'" });
    }
    if (!safePreloadId(id)) {
        return res.status(400).send({
            success: false,
            error: 'Invalid id (use alphanumeric, underscore, hyphen; max 256 chars)'
        });
    }

    if (speechStore.has(id)) {
        return res.status(409).send({
            success: false,
            error: 'Preload already exists for this id'
        });
    }

    const opts = speechOptionsFromBody(req.body);
    const keyResult = await resolveSpeechKey(req.projectid, opts.provider);
    if (keyResult.error) {
        return res.status(keyResult.status).send({ success: false, error: keyResult.error });
    }

    const ext = extensionForSpeechFormat(opts.response_format);
    const audioPath = path.join(SPEECH_PRELOAD_DIR, `${id}.${ext}`);
    const contentTypeGuess = contentTypeForFormat(ext);

    const entry = {
        status: 'streaming',
        path: audioPath,
        listeners: new Set(),
        buffer: [],
        bufferedBytes: 0,
        contentType: contentTypeGuess,
        ttlTimer: null,
        writeStream: null
    };
    speechStore.set(id, entry);

    res.status(202).json({ status: 'started' });

    const aiOpts = {
        key: keyResult.key,
        provider: opts.provider,
        model: opts.model,
        voice: opts.voice,
        speed: opts.speed,
        instructions: opts.instructions,
        response_format: opts.response_format,
        stream: true
    };

    try {
        await runPreloadStream(id, text, aiOpts, entry);
    } catch (err) {
        winston.error('Preload speech error:', err.response?.data || err);
        destroyPreloadListeners(entry, err);
        removePreloadEntry(id);
    }
});

router.post('/speech/:id', async (req, res) => {
    const id = req.params.id;
    const entry = speechStore.get(id);

    if (entry) {
        const contentType = entry.contentType || 'audio/mpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Transfer-Encoding', 'chunked');

        if (entry.status === 'completed') {
            const rs = fs.createReadStream(entry.path);
            rs.on('error', (err) => {
                winston.error('Speech preload file read error:', err);
                if (!res.headersSent) {
                    return res.status(500).send({ success: false, error: err.message });
                }
                res.end();
            });
            rs.pipe(res);
            return;
        }

        for (let i = 0; i < entry.buffer.length; i++) {
            res.write(entry.buffer[i]);
        }

        entry.listeners.add(res);
        req.on('close', () => {
            entry.listeners.delete(res);
        });
        return;
    }

    const text = req.body.text;
    if (!text || String(text).trim() === '') {
        return res.status(400).send({
            success: false,
            error: 'No preloaded speech for this id; include text in the body for direct streaming'
        });
    }

    const opts = speechOptionsFromBody(req.body);
    const keyResult = await resolveSpeechKey(req.projectid, opts.provider);
    if (keyResult.error) {
        return res.status(keyResult.status).send({ success: false, error: keyResult.error });
    }

    try {
        const streamResponse = await aiService.speech(text, {
            key: keyResult.key,
            provider: opts.provider,
            model: opts.model,
            voice: opts.voice,
            speed: opts.speed,
            instructions: opts.instructions,
            response_format: opts.response_format,
            stream: true
        });

        const contentType = streamResponse.contentType || 'audio/mpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Transfer-Encoding', 'chunked');

        streamResponse.data.on('data', (chunk) => {
            res.write(chunk);
        });
        streamResponse.data.on('end', () => {
            res.end();
        });
        streamResponse.data.on('error', (err) => {
            winston.error('Speech GET stream error:', err);
            res.end();
        });
    } catch (err) {
        winston.error('Speech GET error:', err.response?.data || err);
        return res.status(500).send({
            success: false,
            error: err.response?.data || err.message || err
        });
    }
});

router.post('/speech', async (req, res) => {

    const id_project = req.projectid;
    const isPreview = req.body.streaming === true;
    const opts = speechOptionsFromBody(req.body);
    const { provider, model, voice, speed, instructions, response_format } = opts;

    const text = req.body.text;

    if (!text) {
        return res.status(400).send({ success: false, error: "No text provided" });
    }

    const keyResult = await resolveSpeechKey(id_project, provider);
    if (keyResult.error) {
        return res.status(keyResult.status).send({ success: false, error: keyResult.error });
    }
    const key = keyResult.key;

    try {

        /**
         * =========================
         * 🔥 PREVIEW = STREAMING
         * =========================
         */
        if (isPreview) {

            const streamResponse = await aiService.speech(text, {
                key,
                provider,
                model,
                voice,
                speed,
                instructions,
                response_format,
                stream: true
              });

            const contentType = streamResponse.contentType || 'audio/mpeg';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Transfer-Encoding', 'chunked');

            streamResponse.data.on('data', (chunk) => {
                res.write(chunk);
            });

            streamResponse.data.on('end', () => {
                res.end();
            });

            streamResponse.data.on('error', (err) => {
                winston.error('Streaming error:', err);
                res.end();
            });

            return;
        }

        /**
         * =========================
         * 💾 NORMAL FLOW (UPLOAD)
         * =========================
         */
        const response = await aiService.speech(text, {
            key,
            provider,
            model,
            voice,
            speed,
            instructions,
            response_format
        });

        const audioBuffer = response.data;
        const contentType = response.contentType || 'audio/mpeg';
        const ext = (response.extension || 'mp3').replace(/^\./, '');

        const expireAt = new Date(Date.now() + chatFileExpirationTime * 1000);

        let subfolder = '/public';
        if (req.user?.id) {
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

        return res.status(201).send({
            message: 'Speech audio saved successfully',
            filename: encodeURIComponent(filePath),
            contentType
        });

    } catch (err) {
        winston.error('Speech error: ', err.response?.data || err);
        return res.status(500).send({
            success: false,
            error: err.response?.data || err.message || err
        });
    }
});

  
module.exports = router;
