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

Definisce gli insiemi di permessi associati ai ruoli **standard**:

- `OWNER`: tutti i permessi (`Object.values(P)`).
- `ADMIN`, `AGENT`, `GUEST`: insiemi espliciti, vedi file.
- Mapping disponibili:
  - `ROLE_PERMISSIONS = { owner, admin, agent, guest, teammate: AGENT, user: GUEST, supervisor: AGENT }`
  - `GUEST_ROLETYPE_PERMISSIONS = GUEST` → usato come override per utenti con `roleType === 2`.

### 4.3 `project_user`

Documento che lega un utente a un progetto. Campi rilevanti per la sicurezza:

- `role`: nome del ruolo (`owner`, `admin`, `agent`, `guest`, `teammate`, `user`, `supervisor`, oppure il nome di un **ruolo custom**).
- `roleType`:
  - `1` = platform user (operatore, agente).
  - `2` = guest end-user. In questo caso i permessi vengono **forzati** a `GUEST_ROLETYPE_PERMISSIONS`, indipendentemente dal nome del ruolo.
- `permissions`: array opzionale di permessi extra (override per ruoli custom o aggiunte ad hoc).

### 4.4 Calcolo dei permessi effettivi (`computeRbacPermissions`)

In `permission.middleware.js`:

```js
base = roleType === 2
  ? new Set(GUEST_ROLETYPE_PERMISSIONS)
  : new Set(ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS.agent || []);

base = base ∪ project_user.permissions  // unione con i permessi custom
```

Quindi:

- **Ruolo standard** → permessi predefiniti del ruolo + eventuali permessi custom dichiarati nel `project_user`.
- **Ruolo custom** (nome non in `ROLE_PERMISSIONS`) → fallback a `agent` come baseline + array `permissions` del documento.
- **`roleType === 2`** → solo `GUEST_ROLETYPE_PERMISSIONS` + array `permissions`.

---

## 5. Permission middleware (`requirePermission`)

API:

```js
requirePermission(PERMS.X) // ritorna un middleware Express
```

Comportamento:

1. **Legacy mapping**: se `legacy[permission]` è definito, ritorna direttamente quel middleware. Le voci legacy delegano a `roleChecker.hasRole(...)` o `roleChecker.hasRoleOrTypes(role, ['bot','subscription'])` per replicare esattamente il comportamento storico (incluso il bypass per bot/subscription **solo** dove era previsto).
2. **RBAC path** (permessi non in `legacy`):
   - Se `req.user.attributes.isSuperadmin` → `next()`.
   - Recupera `pu = req.projectuser || req.projectUser`. Se assente → `403 "you dont belong to the project."`.
   - Calcola `effective = computeRbacPermissions(pu)`.
   - Se `effective.has(permission)` → `next()`, altrimenti `403 FORBIDDEN`.

### 5.1 Tabella delegazioni `legacy`

Le delegazioni `legacy` vanno usate solo durante la migrazione da `roleChecker` a `requirePermission`, quando è necessario replicare esattamente una regola storica basata sui tipi.

Permessi che **mantengono** il comportamento `hasRoleOrTypes(..., ['bot','subscription'])` (cioè dove bot e subscription passano automaticamente):

| Permesso              | Vecchia regola                                           |
| --------------------- | -------------------------------------------------------- |
| `FLOWS_READ`          | `hasRoleOrTypes('agent', ['bot','subscription'])`        |

Tutti gli **altri** permessi definiti in `config/permissions.js` passano dal **percorso RBAC puro**.

---

## 6. Gestione bot e subscription

Il “tipo” dell’utente è dedotto dall'istanza Mongoose collegata alla strategia di autenticazione:

- **Bot** → `req.user instanceof Faq_kb`
- **Subscription** → `req.user instanceof Subscription`

Comportamento attuale:

1. **`injectProjectUser`** non carica `project_user` per bot e subscription (non avrebbe senso). Fa `next()` direttamente.
2. **`requirePermission`**:
   - Se il permesso ha una voce `legacy[permission]` con `hasRoleOrTypes(role, ['bot','subscription'])` → bot/subscription passano (replica il vecchio comportamento).
   - Se il permesso ha una voce `legacy` con solo `hasRole(...)` → bot/subscription **non** passano automaticamente: ricadono nei controlli del legacy che richiede un `project_user`. In pratica, per bot/subscription queste rotte rispondono `403`.
   - Se il permesso passa dal **percorso RBAC** (no legacy):
     - Manca `project_user` → `403 "you dont belong to the project."`.
     - Bot/subscription quindi **non** hanno accesso a meno di non aggiungere una voce legacy ad hoc.

Riepilogo pratico:

| Utente                                | Accesso a permesso `legacy[..., types=['bot','subscription']]` | Accesso a `legacy hasRole(...)` puro | Accesso a permesso RBAC nuovo (no legacy)                 |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Utente standard (con `project_user`)  | dipende dal ruolo                                              | dipende dal ruolo                    | dipende da `effective.has(permission)`                    |
| Bot (`Faq_kb`)                        | sì                                                             | no                                   | no (nessun `project_user`, nessun bypass)                 |
| Subscription                          | sì                                                             | no                                   | no                                                        |
| Superadmin (`req.user.email === ADMIN_EMAIL`) | gestito da `has-role` (skip)                          | gestito da `has-role` (skip)         | sì (`req.user.attributes.isSuperadmin` setta `next()`)    |

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

## 8. API Key (`x-api-key`)

### 8.1 Flusso

`authenticateApiKey` (in `auth.middleware.js`) è chiamato quando la request contiene l'header `x-api-key`.

1. Cerca un `Project` con `status: 100` e `jwtSecret === apiKey`.
2. Se trovato:
   - Recupera il `project_user` con `role: "owner"` attivo.
   - Se non c’è owner, fallback su `role: "admin"` attivo.
   - Carica lo `User` corrispondente (`status: 100`).
3. Imposta:
   - `req.user = userDoc`
   - `req.authType = "apiKey"`
   - `req.apiKeyMatchedProjectId = String(project._id)`
4. Errori:
   - Project non trovato → `401`.
   - Nessun owner/admin attivo o user non trovato → `401`.

### 8.2 Sicurezza per progetto

`injectProjectUser` confronta `req.apiKeyMatchedProjectId` con `req.projectid`. Se sono diversi → `403 "API key not valid for this project."`. Questo impedisce di usare la API key di un progetto per accedere a un altro.

### 8.3 valid-token

`middleware/valid-token.js` accetta come token valido **anche** la presenza dell’header `x-api-key`, così le rotte che storicamente passavano da `validtoken` continuano a funzionare con la API key.

### 8.4 Permessi

Una request autenticata via API key viene mappata su uno **User reale** con un `project_user` (owner o admin). Quindi:

- `requirePermission` calcola i permessi su quel `project_user` come per qualsiasi altro utente.
- Concretamente: le API key danno l'accesso che avrebbe l'owner (o, in fallback, l'admin) del progetto.

### 8.5 CORS

Su `app.js`, quando `ENABLE_ALTERNATIVE_CORS_MIDDLEWARE === "true"`, l'header `x-api-key` è incluso negli `Access-Control-Allow-Headers`.

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

Bot/subscription non passeranno (a meno che non si aggiunga una voce in `legacy`).

### 9.2 Mantenere il comportamento storico per bot/subscription

In `middlewares/permission.middleware.js`, mappare il nuovo permesso in `legacy`:

```js
legacy[P.MIO_PERMESSO] = roleChecker.hasRoleOrTypes("agent", ["bot", "subscription"]);
```

### 9.3 Aggiungere un permesso a un ruolo standard

In `config/roles.js`:

```js
const AGENT = new Set([
  // ...
  P.MIO_NUOVO_PERMESSO,
]);
```

### 9.4 Permessi custom su un singolo `project_user`

Salvare nel documento Mongo:

```json
{
  "role": "agent",
  "roleType": 1,
  "permissions": ["mio_permesso_extra"]
}
```

`computeRbacPermissions` farà l’unione tra i permessi del ruolo e l’array.

### 9.5 Ruolo custom

Salvare nel documento Mongo:

```json
{
  "role": "supportLead",
  "roleType": 1,
  "permissions": ["request_read_all", "history_read"]
}
```

Non essendo `supportLead` mappato in `ROLE_PERMISSIONS`, il calcolo userà come baseline `AGENT` (fallback) e aggiungerà i permessi custom dell’array.

### 9.6 Guest end-user (`roleType = 2`)

Anche se il documento ha `role: "agent"`, con `roleType === 2` i permessi base sono forzati al set di `GUEST_ROLETYPE_PERMISSIONS`. Eventuali `permissions` extra del documento vengono comunque uniti.

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
- `roleChecker` (legacy) resta usato dai mapping `legacy` e dai vecchi route file: rimuoverlo richiede di migrare ogni rotta a `requirePermission(...)` e aggiungere la voce `legacy` per i casi bot/subscription dove serve.
