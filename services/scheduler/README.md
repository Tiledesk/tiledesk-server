# Scheduler client e endpoint

**Libreria** in `services/scheduler/schedulerClient.js`: usata dal server per parlare con lo **scheduler-service** (creare/leggere/eliminare job). Non usare axios/fetch nel codice applicativo: solo i metodi di questa libreria.

**Endpoint REST** in `routes/scheduledJobs.js`: il **client (frontend)** chiama il server Tiledesk; il server valida il payload e delega allo scheduler-service tramite la libreria.

## Configurazione

Variabile d’ambiente (es. in `.env`):

```bash
SCHEDULER_SERVICE_URL=http://localhost:3000
```

Se non impostata, le chiamate agli endpoint restituiscono 503.

## Endpoint (chiamati dal frontend)

Base path: **`/:projectid/scheduled_jobs`** (con auth JWT/basic e ruolo agent/bot/subscription).

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | `/once` | Job una tantum (body: flowId, jobKind, action, runAt) |
| POST | `/cron` | Job ricorrente (body: flowId, jobKind, action, cron) |
| GET | `/` | Lista job (query: status, type, flowId, jobKind, limit, skip) |
| GET | `/:id` | Dettaglio job |
| DELETE | `/:id` | Elimina job |

Validazione: `jobKind` deve essere `"http_request"`. Per l’`action` sono obbligatorie le proprietà previste (es. `url` per http_request).

## Uso della libreria nel server (es. altri route o servizi)

```js
const { getSchedulerClient } = require('../services/scheduler/schedulerClient');

const scheduler = getSchedulerClient();

// Job una tantum
const { job, created } = await scheduler.createOnceJob({
  flowId: 'notify-user-123',
  jobKind: 'http_request',
  action: scheduler.httpRequestAction({
    url: 'https://api.example.com/notify',
    method: 'POST',
    body: { userId: '123', event: 'reminder' },
  }),
  runAt: new Date(Date.now() + 60 * 60 * 1000),
});

// Job ricorrente (cron)
await scheduler.createCronJob({
  flowId: 'daily-report',
  jobKind: 'http_request',
  action: scheduler.httpRequestAction({ url: 'https://api.example.com/daily', body: {} }),
  cron: '0 9 * * *',
});

// Lista e delete
const list = await scheduler.listJobs({ flowId: 'notify-user-123' });
await scheduler.deleteJob(job._id);
```

Oppure istanza con opzioni esplicite:

```js
const { createSchedulerClient } = require('../services/scheduler/schedulerClient');

const scheduler = createSchedulerClient({
  baseUrl: process.env.SCHEDULER_SERVICE_URL,
  timeoutMs: 15000,
});
```

## API della libreria

- **createOnceJob({ flowId, jobKind, action, runAt })** – POST /jobs/once  
- **createCronJob({ flowId, jobKind, action, cron })** – POST /jobs/cron  
- **getJob(id)** – GET /jobs/:id (ritorna `null` se 404)  
- **listJobs({ status, type, flowId, jobKind, limit, skip })** – GET /jobs  
- **deleteJob(id)** – DELETE /jobs/:id (lancia errore se 404)  
- **httpRequestAction({ url, method, headers, auth, body })** – helper per l’action con jobKind `http_request`

## Errori

Risposte 4xx/5xx e timeout/errore di rete vengono propagati come `Error` con messaggio leggibile; sugli errori API è disponibile `err.status` e `err.body`.
