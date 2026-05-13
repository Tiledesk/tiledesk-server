'use strict';

var moment = require('moment-timezone');
var Project = require('../models/project');

/**
 * @param {string} tz
 * @returns {string|null}
 */
function normalizeIanaTimezone(tz) {
  if (!tz || typeof tz !== 'string') {
    return null;
  }
  var trimmed = tz.trim();
  if (!trimmed || !moment.tz.zone(trimmed)) {
    return null;
  }
  return trimmed;
}

function timezoneFromOperatingHours(operatingHours) {
  if (operatingHours == null || operatingHours === '') {
    return null;
  }
  var parsed = operatingHours;
  if (typeof operatingHours === 'string') {
    try {
      parsed = JSON.parse(operatingHours);
    } catch (e) {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  return normalizeIanaTimezone(parsed.tzname);
}

/**
 * Resolves IANA timezone for transcript exports (CSV, HTML, PDF, TXT).
 * Priority: query ?tz= or ?timezone= → TRANSCRIPT_DISPLAY_TIMEZONE → project operatingHours.tzname → UTC.
 *
 * @param {import('express').Request} req
 * @param {string} [idProject] — from message.id_project
 * @returns {Promise<string>}
 */
function resolveTranscriptTimezone(req, idProject) {
  var fromQuery = normalizeIanaTimezone((req.query && (req.query.tz || req.query.timezone)) || '');
  if (fromQuery) {
    return Promise.resolve(fromQuery);
  }

  var fromEnv = normalizeIanaTimezone(process.env.TRANSCRIPT_DISPLAY_TIMEZONE || '');
  if (fromEnv) {
    return Promise.resolve(fromEnv);
  }

  if (!idProject) {
    return Promise.resolve('UTC');
  }

  return Project.findOne({ _id: idProject })
    .select('operatingHours activeOperatingHours')
    .lean()
    .exec()
    .then(function (project) {
      if (!project) {
        return 'UTC';
      }
      var tz = timezoneFromOperatingHours(project.operatingHours);
      return tz || 'UTC';
    })
    .catch(function () {
      return 'UTC';
    });
}

/**
 * @param {Date|string|number} createdAt — instant in UTC (Mongo / JS Date)
 * @param {string} timeZone — IANA, e.g. Europe/Rome, or UTC
 * @returns {string}
 */
function formatTranscriptInstant(createdAt, timeZone) {
  if (createdAt == null) {
    return '';
  }
  var mUtc = moment.utc(createdAt);
  if (!mUtc.isValid()) {
    return '';
  }
  if (!timeZone || timeZone === 'UTC') {
    return mUtc.format('YYYY-MM-DD HH:mm:ss') + ' UTC';
  }
  return mUtc.tz(timeZone).format('YYYY-MM-DD HH:mm:ss z');
}

module.exports = {
  resolveTranscriptTimezone: resolveTranscriptTimezone,
  formatTranscriptInstant: formatTranscriptInstant,
  normalizeIanaTimezone: normalizeIanaTimezone
};
