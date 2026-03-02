'use strict';

/**
 * Scheduler service client – usare questa libreria nel server per creare/gestire
 * job senza chiamare axios o fetch direttamente nel codice applicativo.
 *
 * Uso:
 *   const { getSchedulerClient } = require('./services/scheduler/schedulerClient');
 *   const scheduler = getSchedulerClient();
 *   await scheduler.createOnceJob({ flowId, jobKind: 'http_request', action, runAt });
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * @param {Object} opts
 * @param {string} opts.baseUrl - Base URL del scheduler-service (es. http://localhost:3000)
 * @param {number} [opts.timeoutMs=30000]
 * @returns {import('./schedulerClient.types').SchedulerClient}
 */
function createSchedulerClient({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const base = baseUrl.replace(/\/$/, '');
  const defaultHeaders = { 'Content-Type': 'application/json', Accept: 'application/json' };

  /**
   * @param {string} method
   * @param {string} path
   * @param {Object|null} [body]
   * @returns {Promise<Object|{ ok: true }>}
   */
  function request(method, path, body = null) {
    const url = path.startsWith('http') ? path : `${base}${path}`;
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        ...defaultHeaders,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr, 'utf8') } : {}),
      },
      timeout: timeoutMs,
    };

    return new Promise((resolve, reject) => {
      const req = lib.request(options, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = chunks.length ? Buffer.concat(chunks).toString('utf8') : '';
          let data = {};
          try {
            if (raw) data = JSON.parse(raw);
          } catch (_) {}

          if (res.statusCode === 204) {
            return resolve({ ok: true });
          }
          if (res.statusCode >= 400) {
            const err = new Error(data.error || res.statusMessage || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = data;
            return reject(err);
          }
          resolve(data);
        });
      });

      req.on('error', (err) => {
        const msg = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
          ? `Scheduler request timeout after ${timeoutMs}ms`
          : (err.message || 'Scheduler request failed');
        const e = new Error(msg);
        e.code = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' ? 'TIMEOUT' : err.code;
        e.cause = err;
        reject(e);
      });

      req.on('timeout', () => {
        req.destroy();
        const e = new Error(`Scheduler request timeout after ${timeoutMs}ms`);
        e.code = 'TIMEOUT';
        reject(e);
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  return {
    /**
     * Job una tantum a una data/ora.
     * @param {{ flowId: string, jobKind: string, action: object, runAt: Date | string, id_project?: string, metadata?: object }} params
     * @returns {Promise<{ job: object, created: boolean }>}
     */
    async createOnceJob({ flowId, jobKind, action, runAt, id_project, metadata }) {
      const runAtVal = runAt instanceof Date ? runAt.toISOString() : runAt;
      const payload = { flowId, jobKind, action, runAt: runAtVal };
      if (id_project != null) payload.id_project = id_project;
      if (metadata != null && typeof metadata === 'object') payload.metadata = metadata;
      return request('POST', '/jobs/once', payload);
    },

    /**
     * Job ricorrente con espressione cron.
     * @param {{ flowId: string, jobKind: string, action: object, cron: string, id_project?: string, metadata?: object }} params
     * @returns {Promise<{ job: object, created: boolean }>}
     */
    async createCronJob({ flowId, jobKind, action, cron, id_project, metadata }) {
      const payload = { flowId, jobKind, action, cron };
      if (id_project != null) payload.id_project = id_project;
      if (metadata != null && typeof metadata === 'object') payload.metadata = metadata;
      return request('POST', '/jobs/cron', payload);
    },

    /**
     * Dettaglio job per id.
     * @param {string} id - MongoDB ObjectId
     * @returns {Promise<{ job: object } | null>}
     */
    async getJob(id) {
      try {
        return await request('GET', `/jobs/${id}`);
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },

    /**
     * Elenco job con filtri opzionali.
     * @param {{ status?: string, type?: string, flowId?: string, jobKind?: string, limit?: number, skip?: number }} [params]
     * @returns {Promise<{ jobs: object[] }>}
     */
    async listJobs(params = {}) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') q.set(k, String(v));
      });
      const query = q.toString();
      return request('GET', '/jobs' + (query ? `?${query}` : ''));
    },

    /**
     * Elimina un job e annulla la schedulazione. Lancia errore se il job non esiste (404).
     * @param {string} id - MongoDB ObjectId
     * @returns {Promise<void>}
     */
    async deleteJob(id) {
      const res = await request('DELETE', `/jobs/${id}`);
      if (res && res.ok) return;
    },

    /**
     * Helper per costruire l'action di tipo http_request (jobKind "http_request").
     * @param {{ url: string, method?: string, headers?: object, auth?: object, body?: object }} params
     * @param {string} [params.method='POST'] - GET | POST | PUT | PATCH | DELETE
     * @param {object} [params.auth] - { type: 'none'|'bearer'|'basic', token?, username?, password? }
     * @returns {object} action da passare a createOnceJob/createCronJob
     */
    httpRequestAction({ url, method = 'POST', headers = {}, auth = { type: 'none' }, body = {} }) {
      return { url, method, headers, auth, body };
    },
  };
}

let defaultClient = null;

/**
 * Singleton che legge baseUrl da env (SCHEDULER_SERVICE_URL).
 * @param {string} [baseUrl] - Se non passato, usa process.env.SCHEDULER_SERVICE_URL
 * @returns {import('./schedulerClient.types').SchedulerClient}
 */
function getSchedulerClient(baseUrl) {
  const url = baseUrl ?? (typeof process !== 'undefined' && process.env && process.env.SCHEDULER_SERVICE_URL);
  if (!url) {
    throw new Error('Scheduler base URL missing: set SCHEDULER_SERVICE_URL or pass baseUrl');
  }
  if (!defaultClient) {
    defaultClient = createSchedulerClient({ baseUrl: url });
  }
  return defaultClient;
}

module.exports = {
  createSchedulerClient,
  getSchedulerClient,
};
