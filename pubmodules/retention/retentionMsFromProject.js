/**
 * Calcolo dei millisecondi di retention da applicare alle request, allineato a
 * requestRetention.js / requestService (stessa logica di default e settings.retentionDays).
 * Centralizzato così il ricalcolo massivo dopo cambio progetto usa identiche regole.
 */

const defaultRetentionDays = parseInt(process.env.DEFAULT_RETENTION_DAYS, 10) || 90;
/** Solo test: se > 0, il default non da progetto usa secondi invece di giorni. */
const defaultRetentionSeconds = parseInt(process.env.DEFAULT_RETENTION_SECONDS, 10);
const useDefaultRetentionSeconds = !isNaN(defaultRetentionSeconds) && defaultRetentionSeconds > 0;

/**
 * @param {object} projectLike - es. { settings: {...} }
 * @returns {{ retentionMs: number, retentionFromProject: boolean } | null} null = non aggiornare expiresAt (stessa condizione di early-return in RequestRetention)
 */
function getRetentionMsFromProjectLike(projectLike) {
  const settings = projectLike && projectLike.settings;
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
 * Firma della "policy" di retention per rilevare se un aggiornamento progetto la modifica
 * (confronto prima/dopo senza simulare il merge dei settings).
 */
function retentionPolicySignature(settings) {
  const r = getRetentionMsFromProjectLike({ settings });
  if (!r) {
    return "skip";
  }
  return `${r.retentionMs}:${r.retentionFromProject}`;
}

module.exports = {
  getRetentionMsFromProjectLike,
  retentionPolicySignature,
  defaultRetentionDays,
  useDefaultRetentionSeconds,
  defaultRetentionSeconds,
};
