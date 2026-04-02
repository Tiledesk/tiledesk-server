/**
 * Calcolo retention da project.settings.retentionDays, allineato tra requestService, RequestRetention
 * e ricalcolo massimo (projectRequestsExpiresRecalc).
 *
 * Retention infinita (nessuna scadenza TTL sulle request):
 *   - Valore consigliato: **-1** (number).
 *   - Equivalenti accettati: stringhe **'never'**, **'-1'** (client che serializzano tutto come stringa).
 *   In questi casi non si imposta expiresAt (o si rimuove).
 *
 * Default piattaforma:
 *   - **null** / **undefined** su settings.retentionDays → si usa DEFAULT_RETENTION_DAYS (o secondi di test).
 */

const defaultRetentionDays = parseInt(process.env.DEFAULT_RETENTION_DAYS, 10) || 90;
/** Solo test: se > 0, il default non da progetto usa secondi invece di giorni. */
const defaultRetentionSeconds = parseInt(process.env.DEFAULT_RETENTION_SECONDS, 10);
const useDefaultRetentionSeconds = !isNaN(defaultRetentionSeconds) && defaultRetentionSeconds > 0;

/**
 * @param {object} [settings] - project.settings
 * @returns {boolean}
 */
function isInfiniteRetentionSetting(settings) {
  if (!settings || settings.retentionDays === undefined || settings.retentionDays === null) {
    return false;
  }
  const v = settings.retentionDays;
  if (v === -1) {
    return true;
  }
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "-1" || t === "never";
  }
  return false;
}

/**
 * @param {object} projectLike - es. { settings: {...} }
 * @returns {{ infinite: true, retentionFromProject: true } | { retentionMs: number, retentionFromProject: boolean } | null}
 *   null = stesso early-return storico (nessun ms valido per il default globale).
 */
function getRetentionMsFromProjectLike(projectLike) {
  const settings = projectLike && projectLike.settings;

  if (isInfiniteRetentionSetting(settings)) {
    return { infinite: true, retentionFromProject: true };
  }

  const retentionFromProject =
    settings &&
    typeof settings.retentionDays === "number" &&
    !isNaN(settings.retentionDays) &&
    settings.retentionDays > 0;
  const retentionDays = retentionFromProject ? settings.retentionDays : defaultRetentionDays;

  if (!retentionFromProject && !useDefaultRetentionSeconds && (retentionDays == null || retentionDays <= 0)) {
    return null;
  }

  const retentionMs = !retentionFromProject && useDefaultRetentionSeconds
    ? defaultRetentionSeconds * 1000
    : retentionDays * 24 * 60 * 60 * 1000;

  return { retentionMs, retentionFromProject };
}

/**
 * Firma della policy per confronti prima/dopo su PUT progetto (scheduling ricalcolo batch).
 */
function retentionPolicySignature(settings) {
  const r = getRetentionMsFromProjectLike({ settings });
  if (!r) {
    return "skip";
  }
  if (r.infinite) {
    return "infinite";
  }
  return `${r.retentionMs}:${r.retentionFromProject}`;
}

module.exports = {
  getRetentionMsFromProjectLike,
  retentionPolicySignature,
  isInfiniteRetentionSetting,
  defaultRetentionDays,
  useDefaultRetentionSeconds,
  defaultRetentionSeconds,
};
