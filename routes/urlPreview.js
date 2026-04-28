const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const urlPreviewService = require('../services/urlPreviewService');

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|::1)/;
const MAX_URLS = 10;

function isSafeUrl(rawUrl) {
  try {
    const { protocol, hostname } = new URL(rawUrl);
    if (!['http:', 'https:'].includes(protocol)) return false;
    if (PRIVATE_IP.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// POST /:projectid/url-preview — public endpoint (used by the widget without auth)
// Body: { "urls": ["https://example.com", "https://another.com"] }
router.post('/', async (req, res) => {
  const urls = req.body.urls;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(422).send({ success: false, error: 'urls must be a non-empty array' });
  }

  if (urls.length > MAX_URLS) {
    return res.status(422).send({ success: false, error: `urls must contain at most ${MAX_URLS} items` });
  }

  const safeUrls = [];
  const blocked = [];
  for (const url of urls) {
    if (isSafeUrl(url)) {
      safeUrls.push(url);
    } else {
      blocked.push({ url, success: false, error: 'URL not allowed' });
    }
  }

  try {
    const fetched = safeUrls.length > 0 ? await urlPreviewService.fetchPagesPreviews(safeUrls) : [];
    // Merge results preserving original order
    const resultMap = new Map(fetched.map(r => [r.url, r]));
    const previews = urls.map(url =>
      resultMap.get(url) || blocked.find(b => b.url === url)
    );
    res.status(200).send(previews);
  } catch (err) {
    winston.error('[urlPreview] error', err);
    res.status(500).send({ success: false, error: err.message || 'Internal error' });
  }
});

module.exports = router;
