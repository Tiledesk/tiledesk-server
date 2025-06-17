const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const Integration = require('../models/integration');
const voiceService = require('../services/voiceService');

// Get voices settings
router.get('/voices', async (req, res) => {
    try {
        const id_project = req.projectid;

        let integration = await Integration.findOne({ id_project: id_project, type: 'elevenlabs' }).catch((err) => {
            winston.error("find integration error: ", err)
            res.status(500).send({ success: false, error: "Error getting ElevenLabs integration" })
        })

        if (!integration) {
            return res.status(404).send({ success: false, error: "Integration not found" })
        }
        if (!integration.value.apikey) {
            return res.status(400).send({ success: false, error: "ElevenLabs Integration's apikey is null or invalid" })
        }

        let key = integration.value.apikey;

        let allVoices = [];
        let hasMore = true;
        let nextPageToken = null;

        while (hasMore) {
            let response = await voiceService.getVoices(key, nextPageToken);

            if (!response || !response.voices) {
                break;
            }

            allVoices = allVoices.concat(response.voices);

            hasMore = response.has_more || false;
            nextPageToken = response.next_page_token;

            if (!hasMore) {
                break;
            }
        }

        res.status(200).json(allVoices);

    } catch (error) {
        winston.error('Error getting voices:', error);
        res.status(500).json({
            success: false,
            error: "Error getting voices"
        });
    }
});

// Get available voices
router.get('/models', async (req, res) => {
    try {
        const id_project = req.projectid;

        let integration = await Integration.findOne({ id_project: id_project, type: 'elevenlabs' }).catch((err) => {
            winston.error("find integration error: ", err)
            res.status(500).send({ success: false, error: "Error getting ElevenLabs integration" })
        })

        if (!integration) {
            return res.status(404).send({ success: false, error: "Integration not found" })
        }
        if (!integration.value.apikey) {
            return res.status(400).send({ success: false, error: "ElevenLabs Integration's apikey is null or invalid" })
        }

        let key = integration.value.apikey;

        let models = await voiceService.getModels(key).catch((err) => {
            winston.error("get models error: ", err)
            res.status(500).send({ success: false, error: "Error getting models" })
        })

        res.status(200).json(models);

    } catch (error) {
        winston.error('Error getting models:', error);
        res.status(500).json({
            success: false,
            error: "Error getting models"
        });
    }
});

module.exports = router;
