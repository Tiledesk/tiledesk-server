'use strict';

/**
 * Endpoints per creare, leggere ed eliminare job schedulati.
 * Il client (frontend) chiama questi endpoint; il server valida il payload e
 * delega allo scheduler-service tramite la libreria services/scheduler/schedulerClient.
 */

var express = require('express');
var router = express.Router();
var winston = require('../config/winston');
const { body, param, query, validationResult } = require('express-validator');
const { getSchedulerClient } = require('../services/scheduler/schedulerClient');

const JOB_KIND_HTTP_REQUEST = 'http_request';
/** Lista di jobKind consentiti (attualmente solo http_request; estendibile). */
const ALLOWED_JOB_KINDS = [JOB_KIND_HTTP_REQUEST];
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES = ['none', 'bearer', 'basic'];

/**
 * Valida l'action per jobKind "http_request".
 * @param {object} action
 * @returns {{ valid: boolean, error?: string }}
 */
function validateHttpRequestAction(action) {
  if (!action || typeof action !== 'object') {
    return { valid: false, error: 'action is required and must be an object' };
  }
  if (!action.url || typeof action.url !== 'string' || !action.url.trim()) {
    return { valid: false, error: 'action.url is required and must be a non-empty string' };
  }
  if (action.method != null && !ALLOWED_METHODS.includes(action.method)) {
    return { valid: false, error: `action.method must be one of: ${ALLOWED_METHODS.join(', ')}` };
  }
  if (action.headers != null && (typeof action.headers !== 'object' || Array.isArray(action.headers))) {
    return { valid: false, error: 'action.headers must be an object' };
  }
  if (action.auth != null) {
    if (typeof action.auth !== 'object' || Array.isArray(action.auth)) {
      return { valid: false, error: 'action.auth must be an object' };
    }
    if (action.auth.type != null && !AUTH_TYPES.includes(action.auth.type)) {
      return { valid: false, error: `action.auth.type must be one of: ${AUTH_TYPES.join(', ')}` };
    }
  }
  return { valid: true };
}

/**
 * Restituisce il client scheduler o null se non configurato; in quel caso risponde 503.
 */
function getSchedulerOrFail(res) {
  try {
    return getSchedulerClient();
  } catch (e) {
    winston.warn('Scheduled jobs: scheduler service not configured', e.message);
    res.status(503).json({ success: false, error: 'Scheduler service not available.' });
    return null;
  }
}

/**
 * Gestisce errori dalla libreria scheduler (4xx/5xx o timeout/rete).
 */
function handleSchedulerError(err, res) {
  if (err.status >= 400) {
    const message = err.body && err.body.error ? err.body.error : err.message;
    return res.status(err.status).json({ success: false, error: message });
  }
  if (err.code === 'TIMEOUT') {
    return res.status(504).json({ success: false, error: err.message });
  }
  winston.error('Scheduled jobs scheduler error', err);
  return res.status(500).json({ success: false, error: err.message || 'Scheduler request failed' });
}

// --- POST / - Crea job (once o cron): body type, flowId, jobKind, action, runAt|cron
router.post(
  '/',
  [
    body('type').isIn(['once', 'cron']).withMessage('type must be "once" or "cron"'),
    body('flowId').notEmpty().trim().withMessage('flowId is required'),
    body('jobKind').notEmpty().trim().withMessage('jobKind is required'),
    body('action').isObject().withMessage('action is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array().map(e => e.msg).join('; ') });
    }

    const { type, flowId, jobKind, action, runAt, cron } = req.body;

    if (!ALLOWED_JOB_KINDS.includes(jobKind)) {
      return res.status(400).json({
        success: false,
        error: `jobKind must be one of: ${ALLOWED_JOB_KINDS.join(', ')}`,
      });
    }
    if (jobKind === JOB_KIND_HTTP_REQUEST) {
      const actionCheck = validateHttpRequestAction(action);
      if (!actionCheck.valid) {
        return res.status(400).json({ success: false, error: actionCheck.error });
      }
    }

    if (type === 'once') {
      if (runAt == null || (typeof runAt === 'string' && !runAt.trim())) {
        return res.status(400).json({ success: false, error: 'runAt is required when type is "once"' });
      }
      const runAtDate = runAt instanceof Date ? runAt : new Date(runAt);
      if (isNaN(runAtDate.getTime())) {
        return res.status(400).json({ success: false, error: 'runAt must be a valid ISO date string or Date' });
      }
    } else {
      if (!cron || typeof cron !== 'string' || !cron.trim()) {
        return res.status(400).json({ success: false, error: 'cron is required when type is "cron"' });
      }
    }

    const scheduler = getSchedulerOrFail(res);
    if (!scheduler) return;

    const id_project = req.projectid;
    const metadata = { userId: req.user && req.user._id ? String(req.user._id) : undefined };
    if (!metadata.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    try {
      let result;
      if (type === 'once') {
        const runAtDate = runAt instanceof Date ? runAt : new Date(runAt);
        result = await scheduler.createOnceJob({
          flowId,
          jobKind,
          action,
          runAt: runAtDate,
          id_project,
          metadata,
        });
      } else {
        result = await scheduler.createCronJob({
          flowId,
          jobKind,
          action,
          cron: cron.trim(),
          id_project,
          metadata,
        });
      }
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      return handleSchedulerError(err, res);
    }
  }
);

// --- GET / - Lista job (query: status, type, flowId, jobKind, limit, skip)
router.get(
  '/',
  [
    query('status').optional().trim(),
    query('type').optional().trim(),
    query('flowId').optional().trim(),
    query('jobKind').optional().trim(),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res) => {
    const scheduler = getSchedulerOrFail(res);
    if (!scheduler) return;

    const params = {};
    if (req.query.status != null && req.query.status !== '') params.status = req.query.status;
    if (req.query.type != null && req.query.type !== '') params.type = req.query.type;
    if (req.query.flowId != null && req.query.flowId !== '') params.flowId = req.query.flowId;
    if (req.query.jobKind != null && req.query.jobKind !== '') params.jobKind = req.query.jobKind;
    if (req.query.limit != null) params.limit = req.query.limit;
    if (req.query.skip != null) params.skip = req.query.skip;

    try {
      const result = await scheduler.listJobs(params);
      return res.json({ success: true, ...result });
    } catch (err) {
      return handleSchedulerError(err, res);
    }
  }
);

// --- GET /:id - Dettaglio job
router.get(
  '/:id',
  [param('id').notEmpty().trim().withMessage('id is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array().map(e => e.msg).join('; ') });
    }

    const scheduler = getSchedulerOrFail(res);
    if (!scheduler) return;

    try {
      const result = await scheduler.getJob(req.params.id);
      if (result == null) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      return res.json({ success: true, ...result });
    } catch (err) {
      return handleSchedulerError(err, res);
    }
  }
);

// --- DELETE /:id - Elimina job
router.delete(
  '/:id',
  [param('id').notEmpty().trim().withMessage('id is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array().map(e => e.msg).join('; ') });
    }

    const scheduler = getSchedulerOrFail(res);
    if (!scheduler) return;

    try {
      await scheduler.deleteJob(req.params.id);
      return res.status(200).json({ success: true, message: "Job successfully deleted" });
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      return handleSchedulerError(err, res);
    }
  }
);

module.exports = router;
