const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const urlPreviewService = require('../services/urlPreviewService');

// POST /:projectid/url-preview
// Body: { "url": "https://example.com" }
router.post('/', async (req, res) => {
  const id_project = req.projectid;
  const url = req.body.url;

  if (!url) {
    return res.status(422).send({ success: false, error: 'url field is required in request body' });
  }

  try {
    const preview = await urlPreviewService.fetchPagePreview(id_project, url);
    res.status(200).send(preview);
  } catch (err) {
    winston.error('[urlPreview] error fetching preview', err);
    const status = err.code || 500;
    res.status(status).send({ success: false, error: err.error || err.message || 'Internal error' });
  }
});

module.exports = router;
