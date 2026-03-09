'use strict';

/**
 * Tipi JSDoc per il client dello scheduler-service.
 * Per jobKind "http_request" l'action deve avere almeno url; method, headers, auth, body opzionali.
 *
 * @typedef {Object} HttpRequestAction
 * @property {string} url - URL da chiamare (obbligatorio)
 * @property {string} [method='POST'] - GET | POST | PUT | PATCH | DELETE
 * @property {Object} [headers] - Headers HTTP
 * @property {Object} [auth] - { type: 'none'|'bearer'|'basic', token?, username?, password? }
 * @property {Object} [body] - Body per POST/PUT/PATCH
 *
 * @typedef {Object} SchedulerClient
 * @property {(params: { flowId: string, jobKind: string, action: object, runAt: Date | string, id_project?: string, metadata?: object }) => Promise<{ job: object, created: boolean }>} createOnceJob
 * @property {(params: { flowId: string, jobKind: string, action: object, cron: string, id_project?: string, metadata?: object }) => Promise<{ job: object, created: boolean }>} createCronJob
 * @property {(id: string) => Promise<{ job: object } | null>} getJob
 * @property {(params?: { status?: string, type?: string, flowId?: string, jobKind?: string, limit?: number, skip?: number }) => Promise<{ jobs: object[] }>} listJobs
 * @property {(id: string) => Promise<void>} deleteJob
 * @property {(params: { url: string, method?: string, headers?: object, auth?: object, body?: object }) => object} httpRequestAction
 */

module.exports = {};
