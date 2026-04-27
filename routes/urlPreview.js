const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const urlPreviewService = require('../services/urlPreviewService');

// POST /:projectid/url-preview
// Body: { "urls": ["https://example.com", "https://another.com"] }
router.post('/', async (req, res) => {
  const urls = req.body.urls;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(422).send({ success: false, error: 'urls must be a non-empty array' });
  }

  try {
    const previews = await urlPreviewService.fetchPagesPreviews(urls);
    res.status(200).send(previews);
  } catch (err) {
    winston.error('[urlPreview] error', err);
    res.status(500).send({ success: false, error: err.message || 'Internal error' });
  }
});

module.exports = router;
