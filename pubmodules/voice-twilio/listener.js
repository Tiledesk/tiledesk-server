var winston = require("../../config/winston");
const voice_twilio = require("@tiledesk/tiledesk-voice-twilio-connector");

const apiUrl = process.env.API_URL;
winston.info("TwilioVoice apiUrl: " + apiUrl);

class Listener {

    async listen(config) {
        winston.info("TwilioVoice Listener listen");

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: " + port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1";
        winston.debug("Redis host: " + host);

        var password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: " + password);

        let brand_name = null;
        if (process.env.BRAND_NAME) {
            brand_name = process.env.BRAND_NAME;
        }

        let openai_endpoint = process.env.OPENAI_ENDPOINT;
        winston.debug("OpenAI Endpoint: ", openai_endpoint);

        let elevenlabs_endpoint = process.env.ELEVENLABS_ENDPOINT || "https://api.elevenlabs.io";
        winston.debug("ElevenLabs Endpoint: ", elevenlabs_endpoint);

        let gpt_key = process.env.GPTKEY;

        let log = process.env.VOICE_TWILIO_LOG || 'error';
        winston.debug("Voice log: " + log);

        try {
            // startServer is async and returns a Promise (no callback)
            await voice_twilio.startServer({
                MONGODB_URI: process.env.MONGODB_URI,
                //API_URL: apiUrl, // The main API URL
                BASE_URL: apiUrl + "/tiledesk/modules/voice-twilio", // Base URL for the voice module
                BASE_FILE_URL: apiUrl, // Base URL for file uploads
                REDIS_HOST: host,
                REDIS_PORT: port,
                REDIS_PASSWORD: password,
                BRAND_NAME: brand_name,
                OPENAI_ENDPOINT: openai_endpoint,
                GPT_KEY: gpt_key,
                VOICE_TWILIO_LOG: log
            });

            winston.info("Tiledesk Twilio Voice Connector proxy server successfully started.");

        } catch (err) {
            winston.error("Unable to start Tiledesk Twilio Voice Connector. " + err);
            throw err; // Re-throw if you want to handle the error upstream
        }
    }
}

let listener = new Listener();

module.exports = listener;
