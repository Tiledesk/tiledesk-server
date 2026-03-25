/**
 * Dopo PUT/PATCH progetto: se la policy di retention (millisecondi effettivi) è cambiata,
 * incrementa retentionRecalcSeq sul Project ed emette project.retentionRecalc.
 * La seq permette al worker di abbandonare tra un batch e l’altro se l’utente ha di nuovo cambiato retention.
 */

const winston = require("../config/winston");
const Project = require("../models/project");
const projectEvent = require("../event/projectEvent");
const { retentionPolicySignature } = require("../pubmodules/retention/retentionMsFromProject");

function isRequestRetentionGloballyEnabled() {
  const v = process.env.REQUEST_RETENTION_ENABLED;
  return v !== "false" && v !== false;
}

/**
 * @param {string} projectId - id progetto (params)
 * @param {object|undefined} settingsBefore - settings letti prima dell’update
 * @param {object|undefined} settingsAfter - settings sul documento aggiornato
 * @param {function} done - chiamato sempre (anche se non scheduliamo nulla)
 */
function scheduleRequestExpiresRecalcIfRetentionChanged(projectId, settingsBefore, settingsAfter, done) {
  if (!isRequestRetentionGloballyEnabled()) {
    return done();
  }

  const beforeSig = retentionPolicySignature(settingsBefore);
  const afterSig = retentionPolicySignature(settingsAfter);

  // Stessa policy → nessun ricalcolo massivo (RequestRetention continua a gestire gli update singoli)
  if (beforeSig === afterSig) {
    return done();
  }

  Project.findByIdAndUpdate(
    projectId,
    { $inc: { retentionRecalcSeq: 1 } },
    { new: true, select: "retentionRecalcSeq" },
    function (err, doc) {
      if (err) {
        winston.error("projectExpiresRecalcTrigger: error incrementing retentionRecalcSeq", err);
        return done();
      }
      const seq = (doc && doc.retentionRecalcSeq) || 0;
      winston.info(
        `projectExpiresRecalcTrigger: scheduling expiresAt recalc for project ${projectId} seq=${seq} (retention policy changed)`
      );
      projectEvent.emit("project.retentionRecalc", { projectId: String(projectId), seq });
      done();
    }
  );
}

module.exports = {
  scheduleRequestExpiresRecalcIfRetentionChanged,
};
