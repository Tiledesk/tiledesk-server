# Authorization System

Documento di riferimento sullo stato attuale del livello di sicurezza del server: autenticazione, ruoli, permessi, gestione di bot e subscription, supporto API key.

> File coinvolti
>
> - `middlewares/auth.middleware.js`
> - `middlewares/project.middleware.js`
> - `middlewares/permission.middleware.js`
> - `config/permissions.js`
> - `config/roles.js`
> - `middleware/has-role.js` (legacy, ancora usato dai middleware nuovi)
> - `middleware/valid-token.js`
> - `app.js` (route mounting + ordine middleware)

---

## 1. Pipeline su una rotta `/:projectid/...`

Per ogni mount protetto sotto `/:projectid/...` l'ordine dei middleware in `app.js` è:

1. `projectMw.projectIdSetter` → setta `req.projectid`
2. `projectMw.projectSetter` → carica `req.project` da DB (con cache)
3. `IPFilter.projectIpFilter` / `projectIpFilterDeny` / `decodeJwt` / `projectBanUserFilter`
4. `authMw.authenticateRequired` → JWT/Basic **oppure** API key, popola `req.user` e `req.authType`
5. `projectMw.injectProjectUser` → popola `req.projectuser` / `req.projectUser` (con bypass per bot/subscription e superadmin)
6. `validtoken` → verifica presenza del token o di `x-api-key`
7. router applicativo

`app.js` non deve contenere controlli di permesso specifici: il suo compito è solo costruire il contesto autenticato del progetto. I permessi vanno dichiarati dentro i singoli endpoint del router, esempio:

```js
app.use(
  "/:projectid/faq_kb",
  [
    authMw.authenticateRequired,
    projectMw.injectProjectUser,
    validtoken,
  ],
  faq_kb
);
```

Nel router:

```js
router.get('/', requirePermission(PERMS.FLOWS_READ), function (req, res) {
  // handler
});
```

Questa separazione evita pseudo-permessi a livello di mount (ad esempio controlli che in realtà rappresentano un ruolo come `TEAM_AGENT`) e rende i ruoli standard equivalenti ai ruoli custom: entrambi passano da un set di permessi effettivi.

---

## 2. Autenticazione (`auth.middleware.js`)

`authenticateRequired(req, res, next)`:

- Se è presente l'header **`x-api-key`** → `authenticateApiKey` (vedi sezione API Key).
- Altrimenti → `passport.authenticate(['basic', 'jwt'], { session: false })`.

Risultato:

- `req.user` = utente autenticato (può essere `User`, `Faq_kb`, `Subscription`, ecc., a seconda della strategia Passport o del flusso API key).
- `req.authType` ∈ `"jwt" | "basic" | "apiKey"`.
- Se mancano credenziali valide → `401 Unauthorized`.

Esiste anche `optionalAuthenticate` (utile dove `auth` non è strettamente obbligatoria), ma in `app.js` per le rotte di progetto si usa la variante required.

---

## 3. Iniezione del project user (`project.middleware.js`)

`injectProjectUser(req, res, next)` esegue, **dopo** `authenticateRequired`:

1. Se `req.user` non c’è → `403 Unauthorized`.
2. Se `req.authType === "apiKey"`, controlla che `req.apiKeyMatchedProjectId === req.projectid`. In caso contrario → `403 "API key not valid for this project."`. Questo impedisce l’uso “cross project” della stessa key.
3. Se `req.user` è un **bot** (`Faq_kb`) o una **subscription** (`Subscription`):
   - **non** carica `project_user`,
   - chiama `next()`. Il controllo definitivo passa al permission middleware (vedi sezione 5).
4. Altrimenti carica `project_user` via `projectUserService.getWithPermissions(req.user._id, projectid, req.user.sub)`:
   - Se trovato → `req.projectuser = req.projectUser = project_user` e `next()`.
   - Se non trovato e `req.user.email === process.env.ADMIN_EMAIL` → `req.user.attributes = { isSuperadmin: true }` e `next()`.
   - Altrimenti → `403 "you dont belong to the project."`.

`req.projectuser` (o `req.projectUser`) contiene anche `rolePermissions` calcolati lato `projectUserService` (vedi `services/projectUserService.js → getWithPermissions`).

---

## 4. Modello dati di ruoli e permessi

### 4.1 `config/permissions.js`

Catalogo centralizzato di tutti i permessi disponibili. Ogni voce è una stringa stabile usata in DB e nel codice. Esempi:

```js
FLOWS_READ: "flows_read",
KB_READ: "kb_read",
WEBHOOK_MANAGE: "webhook.manage",
PROJECTSETTINGS_GENERAL_READ: "projectsettings_general_read",
```

### 4.2 `config/roles.js`

Definisce gli insiemi di permessi associati ai ruoli **standard** e ai callers non umani:

- `OWNER`: tutti i permessi (`Object.values(P)`).
- `ADMIN`, `AGENT`, `GUEST`: insiemi espliciti, vedi file.
- Mapping disponibili:
  - `ROLE_PERMISSIONS = { owner, admin, agent, guest, teammate: AGENT, user: GUEST, supervisor: AGENT }`
  - `GUEST_ROLETYPE_PERMISSIONS = GUEST` → usato come override per utenti con `roleType === 2`.
  - `BOT_PERMISSIONS` → set minimo per i bot (`Faq_kb`). Si parte da pochi permessi (es. `FLOWS_READ`) e si estende solo quando un endpoint migrato deve restare accessibile ai bot.
  - `SUBSCRIPTION_PERMISSIONS` → analogo per le subscription.

### 4.3 `project_user` e `role` (collection `roles`)

`project_user` lega un utente a un progetto. Campi rilevanti per la sicurezza:

- `role`: nome del ruolo (`owner`, `admin`, `agent`, `guest`, `teammate`, `user`, `supervisor`, oppure il nome di un **ruolo custom**).
- `roleType`:
  - `1` = platform user (operatore, agente).
  - `2` = guest end-user. In questo caso i permessi vengono **forzati** a `GUEST_ROLETYPE_PERMISSIONS`, indipendentemente dal nome del ruolo.

I permessi di un **ruolo custom** vivono nella collection `roles` (`models/role.js`):

```js
{
  name: "supportLead",       // = project_user.role
  id_project: "<projectId>",
  permissions: ["request_read_all", "history_read"],
}
```

Pre-caricamento: `projectUserService.getWithPermissions(id_user, id_project)` carica il `project_user` e poi cerca il `Role` con `(name = project_user.role, id_project)`, salvando l'array in `project_user._doc.rolePermissions`. `injectProjectUser` usa già questo metodo, quindi il middleware `requirePermission` legge `_doc.rolePermissions` senza fare nuove query.

Il campo `project_user.permissions` esiste a livello di schema per ragioni storiche, ma **non viene più usato** dal nuovo sistema di permessi: i permessi dei ruoli custom stanno solo nella collection `roles`.

### 4.4 Calcolo dei permessi effettivi (`computeEffectivePermissions`)

In `permission.middleware.js`:

```js
if (req.user instanceof Faq_kb) {
  return new Set(BOT_PERMISSIONS);
}
if (req.user instanceof Subscription) {
  return new Set(SUBSCRIPTION_PERMISSIONS);
}

if (!project_user) {
  return null; // 403 "you dont belong to the project."
}

if (project_user.roleType === 2) {
  return new Set(GUEST_ROLETYPE_PERMISSIONS);
}

const standard = ROLE_PERMISSIONS[project_user.role];
if (standard) {
  return new Set(standard);
}

return new Set(project_user._doc.rolePermissions || []);
```

Quindi:

- **Bot** (`req.user instanceof Faq_kb`) → solo `BOT_PERMISSIONS`. Nessun `project_user` richiesto.
- **Subscription** (`req.user instanceof Subscription`) → solo `SUBSCRIPTION_PERMISSIONS`. Nessun `project_user` richiesto.
- **`roleType === 2`** (guest end-user) → solo `GUEST_ROLETYPE_PERMISSIONS`. Immutabili.
- **Ruolo standard** (`owner`, `admin`, `agent`, `guest`, `teammate`, `user`, `supervisor`) → solo i permessi predefiniti del ruolo. Immutabili.
- **Ruolo custom** (nome non in `ROLE_PERMISSIONS`) → parte da insieme **vuoto** e usa esclusivamente i permessi del documento corrispondente nella collection `roles` (pre-caricati in `_doc.rolePermissions`). Nessun fallback su `agent`. Se il documento `Role` non esiste, l'insieme è vuoto e ogni `requirePermission` restituisce 403.

Invariante: i ruoli standard non sono modificabili. Per dare un set di permessi diverso a un membro va creato un ruolo custom in `roles` e impostato `project_user.role = "<nome ruolo custom>"`.

---

## 5. Permission middleware (`requirePermission`)

API:

```js
requirePermission(PERMS.X) // ritorna un middleware Express
```

Comportamento:

1. Se `req.user.attributes.isSuperadmin` → `next()`.
2. Calcola `effective = computeEffectivePermissions(req)`.
   - Se `null` (utente standard senza `project_user`, e non superadmin) → `403 "you dont belong to the project."`.
   - Se `effective.has(permission)` → `next()`, altrimenti `403 FORBIDDEN`.

Non esiste più alcun mapping `legacy`: tutto passa dal percorso RBAC puro descritto in 4.4.

---

## 6. Gestione bot e subscription

Il “tipo” dell’utente è dedotto dall'istanza Mongoose collegata alla strategia di autenticazione:

- **Bot** → `req.user instanceof Faq_kb`
- **Subscription** → `req.user instanceof Subscription`

Bot e subscription **non** hanno un `project_user`: i loro permessi vivono nei due set dedicati in `config/roles.js`:

- `BOT_PERMISSIONS`
- `SUBSCRIPTION_PERMISSIONS`

Default: entrambi minimali (es. `FLOWS_READ`). Per abilitare un bot o una subscription a un nuovo endpoint, aggiungere il permesso al rispettivo set.

Riepilogo pratico:

| Utente                                       | Comportamento                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Utente standard (con `project_user`)         | accesso dipende dai permessi del ruolo standard / custom                                                                  |
| Bot (`Faq_kb`)                               | accesso solo se il permesso è in `BOT_PERMISSIONS`                                                                        |
| Subscription                                 | accesso solo se il permesso è in `SUBSCRIPTION_PERMISSIONS`                                                               |
| Superadmin (`req.user.email === ADMIN_EMAIL`)| accesso totale (`isSuperadmin = true`)                                                                                    |

---

## 7. Superadmin

Il superadmin è identificato da:

```env
ADMIN_EMAIL=admin@tiledesk.com
```

(default: `admin@tiledesk.com` se non impostato).

Quando l'utente autenticato ha `email === process.env.ADMIN_EMAIL`:

- In `injectProjectUser`, se non esiste un `project_user` per quel progetto, viene impostato `req.user.attributes = { isSuperadmin: true }` e si chiama `next()`.
- In `requirePermission` (RBAC path), `req.user.attributes.isSuperadmin === true` consente di passare ogni controllo.
- Nel codice legacy (`middleware/has-role.js`) lo stesso controllo è gestito da `isTypeAsFunction`.

---

## 8. API Key (`x-api-key` / `Authorization: Bearer`)

### 8.1 Flusso

`authenticateApiKey` (in `auth.middleware.js`) è chiamato quando la request contiene una API key. La key può arrivare attraverso **due transport** equivalenti:

- `x-api-key: <rawKey>` (header storico, supportato anche per le key legacy basate su `project.jwtSecret`).
- `Authorization: Bearer <rawKey>` (stile OpenAI). Riconosciuto solo per le key generate dal nuovo sistema, ovvero quelle che iniziano con `ApiKey.KEY_PUBLIC_PREFIX` (default `tdk-live-`). Questo evita collisioni con altri token opachi e con il `project.jwtSecret` legacy (un UUID senza prefix).

Il discriminatore tra Bearer/JWT/Basic è lo *scheme*: nel server JWT viaggia come `Authorization: JWT <token>` (vedi `ExtractJwt.fromAuthHeaderWithScheme("jwt")` in `middleware/passport.js`) e Basic come `Authorization: Basic <token>`, quindi `Bearer` è dedicato alle API key e non collide con le altre strategie.

Una volta estratta la key, vengono provati **due** meccanismi di lookup, in ordine:

1. **Nuova collection `apikey`** (`models/apikey.js`):
   - Calcola `hash = SHA-256(rawKey)`.
   - Cerca un documento `ApiKey` con `key_hash === hash`.
   - Se esiste e `enabled === true` e (`expires_at == null` o `expires_at > now`) → key valida.
   - Recupera il `project_user` referenziato dalla key (`id_project_user`); se non è più attivo, fallback su un owner/admin attivo del progetto.
   - Aggiorna `last_used_at` e `last_used_ip`.
2. **Legacy `project.jwtSecret`** (per retrocompatibilità):
   - Cerca un `Project` con `status: 100` e `jwtSecret === apiKey`.
   - Recupera il project_user owner (fallback admin) e il relativo User.

In entrambi i casi viene impostato:

- `req.user = userDoc`
- `req.authType = "apiKey"`
- `req.apiKeyMatchedProjectId = String(project._id)`
- `req.apiKeyId = String(apiKey._id)` (solo path nuovo)

Errori:

- Key non trovata in nessuno dei due path → `401 Unauthorized`.
- Key trovata ma non utilizzabile (revocata o scaduta) → `401 "API key revoked or expired."`.
- Nessun project_user/User attivo associato → `401 Unauthorized`.

### 8.2 Sicurezza per progetto

`injectProjectUser` confronta `req.apiKeyMatchedProjectId` con `req.projectid`. Se sono diversi → `403 "API key not valid for this project."`. Questo impedisce di usare la API key di un progetto per accedere a un altro.

### 8.3 valid-token

`middleware/valid-token.js` accetta come token valido **anche** la presenza dell’header `x-api-key`, così le rotte che storicamente passavano da `validtoken` continuano a funzionare con la API key.

### 8.4 Permessi

Una request autenticata via API key viene mappata su uno **User reale** con un `project_user`. Quindi:

- `requirePermission` calcola i permessi su quel `project_user` come per qualsiasi altro utente.
- Per il path nuovo: la key eredita esattamente i permessi del `project_user` indicato in `id_project_user` (di default il creatore della key). Per restringere i privilegi della key è sufficiente assegnarle un `project_user` con un ruolo custom più limitato.
- Per il path legacy: la key dà l'accesso che avrebbe l'owner (o, in fallback, l'admin) del progetto.

### 8.5 CORS

Su `app.js`, quando `ENABLE_ALTERNATIVE_CORS_MIDDLEWARE === "true"`, l'header `x-api-key` è incluso negli `Access-Control-Allow-Headers`.

### 8.6 Storage e ciclo di vita (collection `apikey`)

Schema (`models/apikey.js`):

| Campo                | Tipo                | Note                                                                 |
| -------------------- | ------------------- | -------------------------------------------------------------------- |
| `id_project`         | ObjectId(`project`) | progetto a cui la key appartiene                                     |
| `id_project_user`    | ObjectId(`project_user`) | identità con cui la key opera (di default il creatore)         |
| `name`               | String              | nome leggibile (obbligatorio)                                        |
| `description`        | String              | opzionale                                                            |
| `usage_type`         | String enum         | `"user"` (key personale di un umano) o `"service"` (M2M, default)    |
| `key_prefix`         | String              | primi caratteri (es. `tdk-live-AbCd1234`), mostrati in UI            |
| `key_last4`          | String              | ultimi 4 caratteri, per riconoscere la key in lista                  |
| `key_hash`           | String              | **SHA-256** del raw key (`select: false`, mai serializzato)          |
| `expires_at`         | Date                | `null` ⇒ key infinita; altrimenti scadenza assoluta                  |
| `enabled`            | Boolean             | `false` ⇒ revocata (non utilizzabile)                                |
| `revoked_at`         | Date                | timestamp della revoca soft                                          |
| `revoked_by`         | ObjectId(`user`)    | autore della revoca                                                  |
| `last_used_at`       | Date                | aggiornato a ogni uso valido                                         |
| `last_used_ip`       | String              | ultimo IP che ha usato la key                                        |
| `createdBy`          | ObjectId(`user`)    | autore della creazione                                               |
| `createdAt/updatedAt`| timestamps          | gestiti da mongoose                                                  |

Formato del valore raw: `tdk-live-<32 byte random base64url>` (configurabile via `KEY_PUBLIC_PREFIX` nel modello). Il valore in chiaro **non viene mai persistito**: lo si vede una sola volta nella response del POST di creazione.

REST endpoints (`routes/apikey.js`, montati in `app.js` come `/:projectid/apikeys`):

| Metodo | Path                  | Permesso        | Descrizione                                                                                       |
| ------ | --------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| POST   | `/`                   | `apikey_create` | Crea una nuova key. Body: `name`, `description?`, `usage_type?` (`"user"` \| `"service"`, default `"service"`), `id_project_user?`, `expires_at?` o `expires_in_days?`. Ritorna `raw_key` una sola volta. |
| GET    | `/`                   | `apikey_read`   | Lista delle key del progetto (solo metadata).                                                     |
| GET    | `/:id`                | `apikey_read`   | Dettaglio di una key.                                                                             |
| PUT    | `/:id`                | `apikey_update` | Aggiorna `name`, `description`, `expires_at` / `expires_in_days`.                                 |
| PUT    | `/:id/revoke`         | `apikey_update` | Revoca soft: setta `enabled=false`, `revoked_at`, `revoked_by`. La key resta in DB.               |
| DELETE | `/:id`                | `apikey_delete` | Hard delete: rimuove il documento.                                                                |

I permessi sono dichiarati in `config/permissions.js` (`APIKEY_READ/CREATE/UPDATE/DELETE`) e assegnati a **owner** (via `OWNER = ALL`) e **admin**. Per altri ruoli vanno aggiunti esplicitamente o gestiti via ruolo custom.

### 8.7 `usage_type` e gating tramite env var

Ogni `ApiKey` dichiara, al momento della creazione, il suo `usage_type`:

- `"service"` (default): key destinata a integrazioni machine-to-machine (CI, webhook in ingresso, integrazioni server-side). Pensata per essere conservata in un secret manager e usata da un processo non interattivo.
- `"user"`: key emessa per un utente umano (es. token personale per uno script ad-hoc).

L'env var **`API_KEY_ALLOW_USER_KEYS`** (default `true`) controlla se le key di tipo `"user"` sono accettate dal sistema:

| `API_KEY_ALLOW_USER_KEYS`        | Creazione `usage_type=user`                                       | Auth con key `usage_type=user`                                                                |
| -------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| non impostata o `true` (default) | permessa                                                          | accettata                                                                                     |
| `false`                          | `403 "User API keys are disabled on this server (...)"`           | `401 "User API keys are disabled on this server. Use a service API key or login with JWT/Basic."` |

Il gating viene applicato sia al **momento della creazione** (`routes/apikey.js`) sia ad **ogni richiesta autenticata** (`tryAuthenticateNewApiKey` in `auth.middleware.js`), così settare l'env var blocca anche l'uso di key "user" già esistenti senza doverle revocare manualmente. Le key con `usage_type === "service"` non sono mai influenzate da questa flag.

Use-case tipico: ambienti enterprise dove si vuole vietare i token personali (gli umani devono passare da JWT/Basic con eventuale MFA) e consentire solo integrazioni di servizio esplicitamente censite.

---

## 9. Esempi pratici

### 9.1 Aggiungere un nuovo permesso a una rotta esistente

In `routes/foo.js`:

```js
var requirePermission = require('../middlewares/permission.middleware').requirePermission;
var PERMS = require('../config/permissions');

router.get('/', requirePermission(PERMS.LEADS_READ), function (req, res) {
  // ...
});
```

Bot/subscription non passeranno a meno che il permesso non sia nei rispettivi set in `config/roles.js`.

### 9.2 Abilitare bot o subscription a un nuovo permesso

In `config/roles.js`, aggiungere il permesso al set corrispondente:

```js
const BOT_PERMISSIONS = new Set([
  P.FLOWS_READ,
  P.MIO_PERMESSO,
]);

const SUBSCRIPTION_PERMISSIONS = new Set([
  P.FLOWS_READ,
  P.MIO_PERMESSO,
]);
```

Mantenere i set minimali: aggiungere solo i permessi strettamente necessari.

### 9.3 Aggiungere un permesso a un ruolo standard

In `config/roles.js`:

```js
const AGENT = new Set([
  // ...
  P.MIO_NUOVO_PERMESSO,
]);
```

### 9.4 Permessi custom su un singolo `project_user`

I ruoli standard sono **immutabili**. Per assegnare un set di permessi diverso a un membro va usato un ruolo custom (vedi 9.5).

### 9.5 Ruolo custom

I permessi vivono in due collection diverse:

1. Documento nella collection `roles` (definisce il ruolo a livello di progetto):

```json
{
  "name": "supportLead",
  "id_project": "<projectId>",
  "permissions": ["request_read_all", "history_read"]
}
```

2. Documento `project_user` (assegna il ruolo all'utente):

```json
{
  "id_user": "<userId>",
  "id_project": "<projectId>",
  "role": "supportLead",
  "roleType": 1
}
```

`supportLead` non è in `ROLE_PERMISSIONS`, quindi `requirePermission` cerca i permessi nella collection `roles` (pre-caricati in `_doc.rolePermissions` da `getWithPermissions`). I permessi effettivi sono **esattamente** quelli dichiarati nell'array del documento `Role`. Nessun fallback su `agent`. Se il documento `Role` non esiste in quel progetto, l'utente non ha alcun permesso.

### 9.6 Guest end-user (`roleType = 2`)

Indipendentemente dal valore di `role`, con `roleType === 2` i permessi sono forzati a `GUEST_ROLETYPE_PERMISSIONS`.

---

## 10. Errori possibili

| Causa                                                | Status | Body                                                |
| ---------------------------------------------------- | ------ | --------------------------------------------------- |
| Auth mancante o invalida                             | 401    | `{ success: false, msg: "Unauthorized." }`          |
| Project id invalido o non trovato                    | 400    | `{ error: "Invalid project id" / "Project not found" }` |
| API key valida ma per un altro progetto              | 403    | `{ success: false, msg: "API key not valid for this project." }` |
| Utente autenticato ma non membro del progetto        | 403    | `{ success: false, msg: "you dont belong to the project." }` |
| Membro del progetto ma senza il permesso richiesto   | 403    | `{ success: false, error: "403 FORBIDDEN", message: "You don't have the required permission." }` |
| IP filter del progetto bloccante                     | 401    | `{ err: "error project ip filter" / ... }`          |

---

## 11. Note operative

- I cambi a `config/roles.js` o `config/permissions.js` richiedono restart del processo.
- Le modifiche al `project_user` (custom permissions) sono soggette alla cache di Mongoose se `cacheEnabler.project_user` è attivo (`projectUserService.get`).
- `roleChecker` (`middleware/has-role.js`) non è più usato da `permission.middleware.js`. Resta in uso solo dai vecchi route file non ancora migrati: rimuoverlo del tutto richiede di migrare ogni rotta a `requirePermission(...)` e di esprimere eventuali bypass per bot/subscription estendendo `BOT_PERMISSIONS` / `SUBSCRIPTION_PERMISSIONS`.
