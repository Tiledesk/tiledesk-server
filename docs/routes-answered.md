# Route `kb/answered` — domande con risposta (Knowledge Base)

Documentazione per [`routes/answered.js`](../routes/answered.js).

## Scopo

API REST per gestire le **domande già risposte** associate a un **namespace** della Knowledge Base del progetto. I documenti sono persistiti nel modello Mongoose `AnsweredQuestion` (vedi [`models/kb_setting.js`](../models/kb_setting.js)).

Ogni operazione è vincolata al **progetto corrente** (`req.projectid`, derivato dal segmento `:projectid` nell’URL) e alla validità del **namespace** (deve esistere un `Namespace` con `id` uguale al `namespace` richiesto e `id_project` uguale al progetto).

## Montaggio e autenticazione

In [`app.js`](../app.js) il router è montato così:

- **Path base:** `/:projectid/kb/answered`
- **Middleware:** `passport.authenticate(['basic', 'jwt'])`, `validtoken`, `roleChecker.hasRoleOrTypes('admin', ['bot','subscription'])`

Sono quindi richiesti autenticazione (Basic o JWT), token valido e ruolo **admin** oppure tipi **bot** / **subscription**.

Esempio di URL completo (sviluppo locale):

```http
GET http://localhost:3000/{projectId}/kb/answered/{namespace}
```

Sostituire `{projectId}` con l’ID MongoDB del progetto.

## Modello dati (`AnsweredQuestion`)

| Campo         | Tipo     | Note                                      |
|---------------|----------|-------------------------------------------|
| `id_project`  | string   | Impostato dal server dal contesto progetto |
| `namespace`   | string   | ID del namespace (validato contro `Namespace`) |
| `question`    | string   | Obbligatorio                              |
| `answer`      | string   | Obbligatorio                              |
| `tokens`      | number   | Opzionale                                 |
| `request_id`  | string   | Opzionale                                 |
| `created_at` / `updated_at` | date | Da `timestamps: true`              |

Indici rilevanti: TTL su `created_at`, indice composto `(id_project, namespace, created_at)`, indice **testo** su `question` e `answer` (pesi question 5, answer 1) per la ricerca full-text.

---

## Endpoint

Tutti i path qui sotto sono relativi a `/:projectid/kb/answered`.

### `POST /`

Aggiunge una nuova domanda risposta.

**Body JSON**

| Campo        | Obbligatorio | Descrizione        |
|-------------|--------------|--------------------|
| `namespace` | sì           | ID namespace       |
| `question`  | sì           | Testo domanda      |
| `answer`    | sì           | Testo risposta     |
| `tokens`    | no           | Numero opzionale   |
| `request_id`| no           | Riferimento richiesta |

**Risposte**

| HTTP | Significato |
|------|-------------|
| 200  | Documento salvato (corpo = documento MongoDB creato) |
| 400  | Parametri mancanti (`namespace`, `question`, `answer`) |
| 403  | Namespace non appartenente al progetto |
| 500  | Errore server |

---

### `GET /:namespace`

Elenco paginato delle domande risposte per il namespace.

**Query**

| Parametro    | Default | Descrizione |
|--------------|---------|-------------|
| `page`       | `0`     | Pagina (0-based) |
| `limit`      | `20`    | Elementi per pagina |
| `sortField`  | `created_at` | Campo ordinamento |
| `direction`  | `-1`    | `1` crescente, `-1` decrescente |
| `search`     | —       | Se presente, attiva ricerca **full-text** (`$text`); l’ordinamento usa lo score di testo |

**Risposta 200**

```json
{
  "count": 0,
  "questions": [],
  "query": {
    "page": 0,
    "limit": 20,
    "sortField": "created_at",
    "direction": -1,
    "search": "..."
  }
}
```

**Altri codici:** `400` (namespace mancante), `403` (namespace non valido per il progetto), `500`.

---

### `DELETE /:id`

Elimina una singola domanda per `_id` MongoDB.

**Risposte:** `200` con `{ success, message }`, `404` se non trovata (o non del progetto), `500`.

---

### `DELETE /namespace/:namespace`

Elimina **tutte** le domande risposte per `namespace` nel progetto corrente.

**Risposta 200:** `{ success, count: <deletedCount>, message }`.

**403** se il namespace non appartiene al progetto. **500** in errore.

---

### `GET /count/:namespace`

Restituisce il conteggio documenti per `id_project` + `namespace`.

**Risposta 200:** `{ count: <number> }`.

**400** / **403** / **500** come negli altri endpoint con validazione namespace.

---

## Funzione interna `validateNamespace(id_project, namespace_id)`

Verifica che esista un documento `Namespace` con `id_project` e `id: namespace_id`. Usata in creazione, lettura elenco, cancellazione bulk e conteggio.

---

## Nota sull’ordine delle route Express

Nel file è definito `GET /:namespace` **prima** di `GET /count/:namespace`. In Express la prima route che corrisponde vince: una richiesta del tipo `GET .../kb/answered/count/<namespace>` può essere interpretata come `GET /:namespace` con `namespace` uguale alla stringa letterale `count`, invece che come endpoint di conteggio.

Per far funzionare l’URL `GET /count/:namespace` come previsto dal codice, in genere occorre registrare **`GET /count/:namespace` prima di `GET /:namespace`**, oppure usare un prefisso path diverso per uno dei due. Verificare il comportamento in ambiente reale o adeguare l’ordine delle route se il conteggio non risponde come atteso.

---

## Riferimenti

- Router: [`routes/answered.js`](../routes/answered.js)
- Modello e indici: [`models/kb_setting.js`](../models/kb_setting.js) (`AnsweredQuestionSchema`)
- Montaggio app: [`app.js`](../app.js) (`/:projectid/kb/answered`)
