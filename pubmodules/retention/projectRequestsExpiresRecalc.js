/**
 * Ricalcolo batch di expiresAt su tutte le request di un progetto quando cambia la retention.
 * - Base temporale (solo retention finita): attributes.last_message.createdAt se presente, altrimenti updatedAt; poi + retentionMs.
 *   Sempre $set di expiresAt anche se nel passato.
 * - Retention infinita (settings.retentionDays -1 / 'never'): in batch si fa $unset di expiresAt su tutte le request del progetto.
 * - Invalidazione job: all’inizio di ogni iterazione del while (quindi tra un batch e il successivo, incluso prima del primo batch)
 *   si rilegge dal DB project.retentionRecalcSeq e si confronta con payload.seq; se diversa, esci (è arrivato un cambio retention più recente).
 * - Evento diretto: project.retentionRecalc; con coda: project.retentionRecalc.queue (come request.update).
 */

const winston = require("../../config/winston");
const mongoose = require("mongoose");
const projectEvent = require("../../event/projectEvent");
const Project = require("../../models/project");
const Request = require("../../models/request");
const { getRetentionMsFromProjectLike } = require("./retentionMsFromProject");

const BATCH_SIZE = parseInt(process.env.REQUEST_EXPIRES_RECALC_BATCH_SIZE, 10) || 200;
const BATCH_PAUSE_MS = parseInt(process.env.REQUEST_EXPIRES_RECALC_BATCH_PAUSE_MS, 10) || 1000;

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Data da cui calcolare la scadenza: preferire last_message.createdAt (allineato all’ultimo messaggio sulla conversazione),
 * altrimenti updatedAt della request.
 */
function getRetentionBaseDate(doc) {
  const raw = doc.attributes && doc.attributes.last_message && doc.attributes.last_message.createdAt;
  if (raw != null) {
    const d = raw instanceof Date ? raw : new Date(raw);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  const u = doc.updatedAt;
  if (u != null) {
    const d = u instanceof Date ? u : new Date(u);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  return null;
}

class ProjectRequestsExpiresRecalc {
  constructor() {
    this.enabled = true;
    const retentionEnv = process.env.REQUEST_RETENTION_ENABLED;
    if (retentionEnv === "false" || retentionEnv === false) {
      this.enabled = false;
    }
    winston.info("ProjectRequestsExpiresRecalc enabled: " + this.enabled);
  }

  listen() {
    if (!this.enabled) {
      return winston.info("ProjectRequestsExpiresRecalc disabled (REQUEST_RETENTION_ENABLED)");
    }

    // Stesso criterio di RequestRetention: con QUEUE_ENABLED il consumer locale ascolta *.queue
    const eventName = projectEvent.queueEnabled ? "project.retentionRecalc.queue" : "project.retentionRecalc";
    winston.info("ProjectRequestsExpiresRecalc listening on " + eventName);

    projectEvent.on(eventName, (payload) => {
      const self = this;
      setImmediate(function () {
        self.runRecalcJob(payload).catch(function (err) {
          winston.error("ProjectRequestsExpiresRecalc job error", err);
        });
      });
    });
  }

  /**
   * payload: { projectId, seq } — seq deve coincidere con project.retentionRecalcSeq per continuare oltre il batch corrente.
   */
  async runRecalcJob(payload) {
    if (!payload || !payload.projectId) {
      winston.warn("ProjectRequestsExpiresRecalc: missing payload.projectId");
      return;
    }

    const projectId = payload.projectId;
    const expectedSeq = payload.seq;

    let idProjectFilter = projectId;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      idProjectFilter = new mongoose.Types.ObjectId(projectId);
    }

    let lastId = null;

    while (true) {
      // --- Controllo seq (supersessione) ---
      // Punto unico dove si decide se questo messaggio è ancora aggiornato: dopo ogni batch c’è delay(),
      // poi il while riparte da qui. Se nel frattempo un altro PUT ha incrementato retentionRecalcSeq,
      // currentSeq !== expectedSeq e abbandoniamo senza toccare i batch successivi (un job più nuovo in coda
      // o già eseguito avrà la seq giusta).
      const project = await Project.findById(projectId).select("settings retentionRecalcSeq").lean();
      if (!project) {
        winston.warn("ProjectRequestsExpiresRecalc: project not found " + projectId);
        return;
      }
      const currentSeq = project.retentionRecalcSeq || 0;
      if (currentSeq !== expectedSeq) {
        winston.info(
          `ProjectRequestsExpiresRecalc: abort project=${projectId} jobSeq=${expectedSeq} currentSeq=${currentSeq} (superseded)`
        );
        return;
      }

      const retentionInfo = getRetentionMsFromProjectLike(project);
      if (!retentionInfo) {
        winston.verbose("ProjectRequestsExpiresRecalc: skip project " + projectId + " (no valid retention ms)");
        return;
      }
      const infiniteRetention = !!retentionInfo.infinite;
      const retentionMs = retentionInfo.retentionMs;

      const q = { id_project: idProjectFilter };
      if (lastId) {
        q._id = { $gt: lastId };
      }

      const selectFields = infiniteRetention
        ? "_id"
        : "_id updatedAt attributes.last_message.createdAt";

      const docs = await Request.find(q)
        .select(selectFields)
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .lean();

      if (docs.length === 0) {
        winston.info(`ProjectRequestsExpiresRecalc: completed project=${projectId} seq=${expectedSeq}`);
        return;
      }

      const bulkOps = [];
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (infiniteRetention) {
          bulkOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $unset: { expiresAt: "" } },
            },
          });
          continue;
        }
        const baseAt = getRetentionBaseDate(doc);
        if (!baseAt) {
          continue;
        }
        const expiresAt = new Date(baseAt.getTime() + retentionMs);
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { expiresAt: expiresAt } },
          },
        });
      }

      if (bulkOps.length > 0) {
        try {
          await Request.bulkWrite(bulkOps, { ordered: false });
        } catch (err) {
          winston.error("ProjectRequestsExpiresRecalc bulkWrite error", err);
        }
      }

      lastId = docs[docs.length - 1]._id;
      await delay(BATCH_PAUSE_MS);
    }
  }
}

module.exports = ProjectRequestsExpiresRecalc;
