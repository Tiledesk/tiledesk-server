'use strict';

const axios  = require('axios');
const crypto = require('crypto');

const INGEST_BASE_URL = process.env.ANALYTICS_INGEST_URL;
const INGEST_API_KEY  = process.env.ANALYTICS_INGEST_API_KEY;
const SOURCE_SERVICE  = 'tiledesk-server';
const EVENT_VERSION   = '1.0';

const client = axios.create({
  baseURL: INGEST_BASE_URL || 'http://localhost:3099', // placeholder; disabled when INGEST_BASE_URL unset
  timeout: 5000,
  headers: INGEST_API_KEY ? { 'X-Api-Key': INGEST_API_KEY } : {},
});

/**
 * Build a full analytics event envelope.
 * Mirrors the tiledesk-llm _build_envelope() pattern so both services
 * produce identical envelope shapes, enabling event_id-based deduplication
 * in the consumer.
 */
function _buildEnvelope(eventType, idProject, payload) {
  return {
    event_id:       crypto.randomUUID(),
    event_type:     eventType,
    timestamp:      new Date().toISOString(),
    id_project:     idProject,
    source_service: SOURCE_SERVICE,
    event_version:  EVENT_VERSION,
    payload:        payload,
  };
}

/**
 * Fire-and-forget analytics event. No-op when ANALYTICS_INGEST_URL is unset.
 *
 * @param {string} eventType   - e.g. 'conversation.created'
 * @param {string} idProject   - Tiledesk project ID
 * @param {object} payload     - event-specific fields
 */
function track(eventType, idProject, payload) {
  if (!INGEST_BASE_URL) return;
  if (!idProject)       return;

  var body = _buildEnvelope(eventType, idProject, payload);

  client.post('/events', body).catch(function(err) {
    var status = err.response && err.response.status;
    var detail = (err.response && err.response.data && err.response.data.error) || err.message;
    console.warn('[analytics] Failed to track ' + eventType + ': ' + status + ' ' + detail);
  });
}

module.exports = { track: track };
