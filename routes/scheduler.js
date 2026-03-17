const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const schedulerService = require('../services/schedulerService');

const ALLOWED_JOB_KINDS = ['http_request', 'db_ttl_delete'];
const ALLOWED_TYPES = ['once', 'cron'];

router.get('/',
    [
        query('status').optional().trim(),
        query('type').optional().trim(),
        query('flowId').optional().trim(),
        query('jobKind').optional().trim(),
        query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
        query('skip').optional().isInt({ min: 0 }).toInt(),
    ], 
    async (req, res) => {

        req.query.projectId = req.projectid;

        schedulerService.listJobs(req.query).then((data) => {
            res.status(200).send({ success: true, ...data });
        }).catch((err) => {
            res.status(500).send({ success: false, error: err.message });
        });

        return;
    }
);

router.get('/:id', async (req, res) => {

    req.query.projectId = req.projectid;

    schedulerService.getJob(req.params.id, req.query).then((data) => {
        res.status(200).send({ success: true, ...data });
    }).catch((err) => {
        res.status(500).send({ success: false, error: err.message });
    });

    return;
});

router.post('/', async (req, res) => {

    const id_project = req.projectid;
    let job = req.body;

    job.projectId = id_project;

    if (!ALLOWED_JOB_KINDS.includes(job.jobKind)) {
        return res.status(400).send({ success: false, error: `jobKind must be one of ${ALLOWED_JOB_KINDS.join(', ')}`});
    }
    
    if (!ALLOWED_TYPES.includes(job.type)) {
        return res.status(400).send({ success: false, error: `type must be one of ${ALLOWED_TYPES.join(', ')}`});
    }

    if (job.type === 'once') {
        if (!job.runAt) {
            return res.status(400).send({ success: false, error: 'runAt is required when type is "once"' });
        }
    } else {
        if (!job.cron) {
            return res.status(400).send({ success: false, error: 'cron is required when type is "cron"' });
        }
    }

    const metadata = { userId: req.user && req.user._id ? String(req.user._id) : undefined };
    if (!metadata.userId) {
        return res.status(401).send({ success: false, error: 'User not authenticated' });
    }

    job.metadata = metadata;

    if (job.type === 'once') {
        try {
            const result = await schedulerService.createOnceJob(job);
            res.status(200).send({ success: true, ...result });
        } catch (err) {
            return handleSchedulerError(err, res);
        }
    } else {
        try {
            const result = await schedulerService.createCronJob(job);
            res.status(200).send({ success: true, ...result });
        } catch (err) {
            return handleSchedulerError(err, res);
        }
    }
    
    return;

});

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

