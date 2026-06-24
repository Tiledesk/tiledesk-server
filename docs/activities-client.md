# Activity History — Guida per il client (dashboard)

Documentazione per integrare e visualizzare le **activity** del progetto nella dashboard.
Copre la struttura dati, tutti i `verb` disponibili (legacy e nuovi) e come costruire le frasi da mostrare all'utente.

---

## Prerequisiti

Le activity vengono archiviate solo se sul server è attivo:

```env
ACTIVITY_HISTORY_ENABLED=true
```

Con `QUEUE_ENABLED=true`, gli eventi chatbot e KB passano dalla coda AMQP (come `request.assigned` e `project_user.update`): l'archiver ascolta le versioni `.queue` (`faqbot.created.queue`, `kb.namespace.create.queue`, ecc.) e il payload include `req.user` serializzato per ricostruire l'attore.

---

## API

### Lista activity

```
GET /{project_id}/activities
```

**Query params utili**

| Parametro | Descrizione |
|---|---|
| `page` | Pagina (default `0`) |
| `direction` | Ordinamento su `createdAt`: `-1` desc (default), `1` asc |
| `agent_id` | Filtra per agente coinvolto (`actor.id` o `target.object.id_user._id`) |
| `activities` | Lista verb separati da virgola, es. `REQUEST_ASSIGNED_AUTO,REQUEST_ASSIGNED_SELF` |
| `start_date` / `end_date` | Filtro data (`DD/MM/YYYY`) |

**Risposta**

```json
{
  "perPage": 40,
  "count": 120,
  "activities": [
    {
      "_id": "...",
      "id_project": "...",
      "createdAt": "2026-06-22T10:00:00.000Z",
      "updatedAt": "2026-06-22T10:00:00.000Z",
      "actor": {
        "type": "user",
        "id": "64a1b2c3...",
        "name": "Mario Rossi"
      },
      "verb": "REQUEST_ASSIGNED_SELF",
      "actionObj": { ... },
      "target": {
        "type": "request",
        "id": "...",
        "object": { ... }
      },
      "message": "Mario Rossi joined conversation support-group-abc (source: api)"
    }
  ]
}
```

> **Nota:** il campo `message` è un **fallback in inglese** generato dal server. È utile per debug e come testo di riserva se manca la traduzione i18n lato client. In produzione la dashboard dovrebbe preferire le proprie traduzioni basate su `verb` + dati strutturati.

### Export CSV

```
GET /{project_id}/activities/csv
```

Stessi filtri della lista. La colonna `message` segue la stessa logica di fallback.

---

## Modello dati Activity

Ogni activity segue il pattern **actor → verb → target** (Activity Streams).

```ts
interface Activity {
  _id: string;
  id_project: string;
  createdAt: string;
  updatedAt: string;

  /** Chi ha eseguito l'azione */
  actor: {
    type: 'user' | 'system';
    id: string;
    name?: string;
  };

  /** Tipo di evento — chiave per i18n */
  verb: ActivityVerb;

  /** Dettagli specifici dell'azione (varia per verb) */
  actionObj?: Record<string, unknown>;

  /** Oggetto su cui è stata eseguita l'azione */
  target: {
    type: string;
    id: string;
    object: Record<string, unknown>;
  };

  /** Fallback inglese (solo per alcuni verb, vedi sotto) */
  message?: string;
}
```

### Ruoli dei campi

| Campo | Significato |
|---|---|
| `actor` | Chi ha **fatto** l'azione (utente loggato, o `system` per azioni automatiche) |
| `verb` | **Cosa** è successo — usare come chiave i18n principale |
| `target` | **Su cosa** — conversazione, project user, invito, ecc. |
| `actionObj` | Metadati aggiuntivi per costruire la frase (assignee, source, role, …) |

---

## Catalogo verb

### Conversazioni — legacy

| Verb | Quando viene emesso |
|---|---|
| `REQUEST_CREATE` | Nuova conversazione creata dal visitatore |
| `REQUEST_CLOSE` | Conversazione chiusa da un agente |

### Conversazioni — assegnazione (nuovi)

| Verb | Significato | Esempio frase (IT) |
|---|---|---|
| `REQUEST_ASSIGNED_AUTO` | Il **sistema** ha assegnato la conversazione a un agente (round robin, queue, chatbot, creazione) | *All'utente **X** è stata assegnata la conversazione **Y** dal sistema* |
| `REQUEST_ASSIGNED_SELF` | Un agente ha fatto **join/pick** manuale sulla conversazione | *L'utente **X** ha fatto join sulla conversazione **Y*** |
| `REQUEST_ASSIGNED_MANUAL` | Un operatore ha **riassegnato** la conversazione a un altro agente, a un chatbot o a un dipartimento (`assigneeType`: `user` \| `bot` \| `department`) | *Vedi template per tipo in `REQUEST_ASSIGNED_MANUAL`* |
| `REQUEST_UNASSIGNED` | Un agente è stato rimosso dalla conversazione | *L'utente **X** è stato rimosso dalla conversazione **Y*** |

### Team / progetto — legacy

| Verb | Quando viene emesso |
|---|---|
| `PROJECT_USER_INVITE` | Invito di un utente al progetto |
| `PROJECT_USER_UPDATE` | Modifica ruolo, impostazioni o disponibilità di un altro utente (admin → agente) |
| `PROJECT_USER_DELETE` | Rimozione di un utente dal progetto |

### Team — disponibilità (nuovi)

| Verb | Significato | Esempio frase (IT) |
|---|---|---|
| `PROJECT_USER_AVAILABILITY_SELF` | L'agente ha cambiato **il proprio** stato di disponibilità | *L'utente **X** ha modificato il suo stato in **inattivo*** |
| `PROJECT_USER_AVAILABILITY_SYSTEM` | Lo stato è stato cambiato **automaticamente dal sistema** (es. disconnessione via subscription) | *Lo stato dell'utente **X** è stato modificato in **inattivo** dal sistema* |

> `PROJECT_USER_UPDATE` resta in uso per le modifiche fatte da un admin sul profilo di un altro utente (ruolo, disponibilità altrui, impostazioni, ecc.).

### Chatbot (FAQ_KB)

| Verb | Significato | Esempio frase (IT) |
|---|---|---|
| `FAQ_KB_CREATE` | Creazione di un chatbot | *L'utente **X** ha creato il chatbot **Y*** |
| `FAQ_KB_DELETE` | Eliminazione di un chatbot | *L'utente **X** ha eliminato il chatbot **Y*** |
| `FAQ_KB_PUBLISH` | Pubblicazione di un chatbot | *L'utente **X** ha pubblicato il chatbot **Y*** |

`target.type` = `faq_kb` — nome in `target.object.name` o `actionObj.name`.

### Knowledge Base — namespace e contenuti

| Verb | Significato | Esempio frase (IT) |
|---|---|---|
| `KB_NAMESPACE_CREATE` | Creazione di un nuovo namespace | *L'utente **X** ha creato il namespace **Y*** |
| `KB_NAMESPACE_DELETE` | Eliminazione completa di un namespace (namespace + contenuti) | *L'utente **X** ha eliminato il namespace **Y*** |
| `KB_CONTENTS_ADD` | Aggiunta di contenuti a un namespace | *L'utente **X** ha aggiunto … al namespace **Y*** |
| `KB_CONTENTS_DELETE` | Eliminazione di tutti i contenuti di un namespace (il namespace resta) | *L'utente **X** ha eliminato tutti i contenuti dal namespace **Y*** |

`target.type` = `kb_namespace` — nome in `target.object.name` o `actionObj.namespaceName`.

Per `KB_CONTENTS_ADD`, il tipo di aggiunta è in `actionObj.contentAddType`:

| `contentAddType` | Endpoint API | Descrizione |
|---|---|---|
| `content` | `POST /kb/` | Singolo contenuto (testo, URL, ecc.) |
| `url_list` | `POST /kb/multi` | Lista di URL |
| `csv` | `POST /kb/csv` | Import da file CSV |
| `sitemap` | `POST /kb/sitemap/import` | Import da sitemap |

---

## `actionObj` per i verb di disponibilità

Per `PROJECT_USER_AVAILABILITY_SELF` e `PROJECT_USER_AVAILABILITY_SYSTEM`:

```ts
interface AvailabilityActionObj {
  /** Valore inviato nel body della PUT */
  user_available?: boolean;
  profileStatus?: string;

  /** Etichetta normalizzata del nuovo stato — usare per i18n */
  newStatus?: string;   // es. "available", "unavailable", "inactive"

  /** Tipo semantico (ridondante con verb) */
  updateType: 'self' | 'system' | 'admin';
  source: 'api' | 'subscription' | 'system';
}
```

> **Nota:** lo stato precedente non è incluso nell'activity. Il server legge i valori `previous` prima dell'update ma, soprattutto con job worker/queue attivo, questa informazione non era affidabilmente disponibile nell'archiver. Le frasi UI usano solo il **nuovo stato** (`newStatus`).

### Come distinguere self vs system

| Campo | Self | System |
|---|---|---|
| `verb` | `PROJECT_USER_AVAILABILITY_SELF` | `PROJECT_USER_AVAILABILITY_SYSTEM` |
| `actor.type` | `user` | `system` |
| `actor.id` | `id_user` di chi ha cambiato stato | `system` |
| `target.id` | `project_user_id` dell'agente | `project_user_id` dell'agente |
| `actionObj.updateType` | `self` | `system` |
| `actionObj.source` | `api` | `subscription` |

**Logica server (dopo la correzione):**

1. **System** se `req.user` è una **Subscription** (JWT `sub: subscription`, oppure documento con `event` + `target` + `id_project`)
2. **System** se il body contiene `"availabilityInitiator": "system"` (vedi sotto)
3. **Self** se l'utente chiama `PUT /project_users/` (aggiornamento del proprio profilo)
4. **Self** se `actor.id` coincide con `target.object.id_user._id` (confronto normalizzato)
5. **Safety net in archiver:** se `verb` è `SELF` ma `actor.id ≠ target.id_user` → riclassificato come `PROJECT_USER_UPDATE` o `SYSTEM` (se subscription)

> **Caso tipico di errore (evento 1):** la subscription chiama l'API con JWT utente su `PUT /project_users/` oppure `req.user` è il documento Subscription ma non viene riconosciuto (`instanceof` fallito). In entrambi i casi il vecchio codice marcava `SELF` in modo errato.

### Disconnessione da dashboard (subscription client)

Se il client di disconnessione usa il **token utente** (non JWT subscription) su `PUT /project_users/`, passare esplicitamente:

```json
{
  "user_available": false,
  "profileStatus": "inactive",
  "availabilityInitiator": "system"
}
```

In alternativa usare JWT **subscription** su `PUT /project_users/:project_userid` — viene classificato automaticamente come system.

> **Nota legacy:** nelle activity archiviate prima di questa correzione, `actor.id` poteva contenere l'id della subscription con `actor.type: "user"`. Per i record legacy: se `actor.id` non corrisponde a `target.object.id_user._id` e il `verb` è `SELF`, trattare come system.

### Template frasi — disponibilità

**`PROJECT_USER_AVAILABILITY_SELF`**

| Lingua | Template |
|---|---|
| **IT** | `{{targetUser}} ha modificato il suo stato in {{newStatus}}` |
| **EN** | `{{targetUser}} changed availability status to {{newStatus}}` |

**`PROJECT_USER_AVAILABILITY_SYSTEM`**

| Lingua | Template |
|---|---|
| **IT** | `Lo stato di {{targetUser}} è stato modificato in {{newStatus}} dal sistema` |
| **EN** | `{{targetUser}} availability status was changed to {{newStatus}} by the system` |

`targetUser` si ricava da `target.object.id_user` (firstname + lastname).

### Valori di `newStatus`

| Valore | Significato |
|---|---|
| `available` | `user_available: true` |
| `unavailable` | `user_available: false` |
| valore di `profileStatus` | es. `inactive`, `away`, … (se presente ha priorità su `user_available` nel label server) |

---

## `actionObj` per chatbot e Knowledge Base

### Chatbot (`FAQ_KB_*`)

```ts
interface FaqKbActionObj {
  name?: string;
  type?: string;
  subtype?: string;
  publishedBotId?: string;   // solo FAQ_KB_PUBLISH
  release_note?: string;     // solo FAQ_KB_PUBLISH
}
```

### Namespace e contenuti (`KB_*`)

```ts
interface KbNamespaceActionObj {
  namespaceName?: string;
  hybrid?: boolean;
  default?: boolean;           // KB_NAMESPACE_CREATE
  deletedCount?: number;       // KB_NAMESPACE_DELETE, KB_CONTENTS_DELETE
}

interface KbContentsAddActionObj {
  contentAddType: 'content' | 'url_list' | 'csv' | 'sitemap';
  namespaceName?: string;
  count?: number;
  type?: string;               // tipo KB (txt, url, sitemap, …) — solo content/sitemap
  source?: string;             // URL o nome sorgente
}

interface KbContentsDeleteActionObj {
  namespaceName?: string;
  deletedCount?: number;
  deleteMode: 'contents_only';
}
```

### Template frasi — chatbot e KB

| Verb | IT | EN |
|---|---|---|
| `FAQ_KB_CREATE` | `{{actor}} ha creato il chatbot {{chatbot}}` | `{{actor}} created chatbot {{chatbot}}` |
| `FAQ_KB_DELETE` | `{{actor}} ha eliminato il chatbot {{chatbot}}` | `{{actor}} deleted chatbot {{chatbot}}` |
| `FAQ_KB_PUBLISH` | `{{actor}} ha pubblicato il chatbot {{chatbot}}` | `{{actor}} published chatbot {{chatbot}}` |
| `KB_NAMESPACE_CREATE` | `{{actor}} ha creato il namespace {{namespace}}` | `{{actor}} created namespace {{namespace}}` |
| `KB_NAMESPACE_DELETE` | `{{actor}} ha eliminato il namespace {{namespace}}` | `{{actor}} deleted namespace {{namespace}}` |
| `KB_CONTENTS_ADD` (singolo) | `{{actor}} ha aggiunto un contenuto al namespace {{namespace}}` | `{{actor}} added content to namespace {{namespace}}` |
| `KB_CONTENTS_ADD` (multi) | `{{actor}} ha aggiunto {{count}} elementi ({{addType}}) al namespace {{namespace}}` | `{{actor}} added {{count}} items ({{addType}}) to namespace {{namespace}}` |
| `KB_CONTENTS_DELETE` | `{{actor}} ha eliminato tutti i contenuti dal namespace {{namespace}}` | `{{actor}} deleted all contents from namespace {{namespace}}` |

Per `KB_CONTENTS_ADD` con `contentAddType: 'sitemap'`, includere opzionalmente `{{source}}` (URL della sitemap).

---

## `actionObj` per i verb di assegnazione

Per i verb `REQUEST_ASSIGNED_*` e `REQUEST_UNASSIGNED`, `actionObj` ha questa forma:

```ts
interface AssignmentActionObj {
  /** id dell'assegnatario: id_user (agente), id chatbot o id dipartimento */
  assigneeId: string;

  /** Nome leggibile dell'assegnatario (agente, chatbot o dipartimento) */
  assigneeName?: string;

  /** Tipo di assegnatario */
  assigneeType?: 'user' | 'bot' | 'department';

  /** Tipo semantico (ridondante con verb, utile per debug) */
  assignmentType: 'auto' | 'self_join' | 'manual_reassign' | 'manual_reassign_bot' | 'manual_reassign_department' | 'unassign';

  /** Origine tecnica dell'evento */
  source: 'api' | 'chatbot' | 'queue' | 'webhook' | 'rules' | 'create' | 'system';

  /** id_user dell'agente precedente (solo su reassign) */
  previousAssigneeId?: string | null;

  /** Partecipanti rimossi (solo su reassign/unassign) */
  removedParticipants?: string[];
}
```

### Valori di `source`

| Source | Descrizione |
|---|---|
| `api` | Chiamata API dalla dashboard |
| `chatbot` | Handover dal chatbot (`PUT /agent`) |
| `queue` | Smart assignment / reroute automatico in coda |
| `webhook` | Sincronizzazione Chat21 (`join-member`) |
| `rules` | Trigger / regole automatiche |
| `create` | Assegnazione alla creazione della conversazione |
| `system` | Altri processi interni |

### `actor` vs `assigneeId`

| Scenario | `actor` | `assigneeId` |
|---|---|---|
| Join manuale | L'agente che fa join (`actor.id === assigneeId`) | Stesso agente |
| Assegnazione automatica | `system` oppure l'utente che ha **scatenato** il routing | L'agente scelto dal round robin |
| Reassign manuale | Il supervisore/agente che riassegna | Il nuovo agente assegnato |
| Unassign | Chi ha rimosso il partecipante | L'agente rimosso |

> **Importante:** `assigneeId` è sempre un **`id_user`** (ID utente Tiledesk), non un `project_user._id`.

---

## Come costruire le frasi (i18n)

### Strategia consigliata

```
1. Leggi activity.verb
2. Risolvi i nomi da actor, actionObj, target
3. Applica il template i18n corrispondente
4. Se il template non esiste → usa activity.message (fallback inglese)
```

### Risoluzione nomi

```ts
function actorName(activity: Activity): string {
  if (activity.actor?.type === 'system') return t('ACTIVITY.SYSTEM'); // es. "Sistema"
  return activity.actor?.name || activity.actor?.id || t('ACTIVITY.SOMEONE');
}

function conversationLabel(activity: Activity): string {
  const request = activity.target?.object;
  // Preferire un titolo leggibile se disponibile in futuro; oggi:
  return request?.request_id || activity.target?.id || t('ACTIVITY.CONVERSATION');
}

function resolveAgentName(activity: Activity, userId?: string | null): string {
  if (!userId) return t('ACTIVITY.UNKNOWN_AGENT');

  const agents = activity.target?.object?.participatingAgents;
  if (Array.isArray(agents)) {
    for (const agent of agents) {
      const user = agent.id_user || agent;
      const id = String(user._id || user.id || user);
      if (id === String(userId)) {
        const name = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
        if (name) return name;
      }
    }
  }

  // Fallback: cercare nel team del progetto se già in cache
  return userId;
}
```

---

## Template frasi — assegnazione conversazioni

### `REQUEST_ASSIGNED_SELF`

L'utente ha fatto join sulla conversazione.

| Lingua | Template |
|---|---|
| **IT** | `{{actor}} ha fatto join sulla conversazione {{conversation}}` |
| **EN** | `{{actor}} joined conversation {{conversation}}` |

```ts
// actor === assignee
const actor = actorName(activity);
const conversation = conversationLabel(activity);
// IT: "Mario Rossi ha fatto join sulla conversazione support-group-abc"
```

---

### `REQUEST_ASSIGNED_AUTO`

La conversazione è stata assegnata automaticamente dal sistema.

Due varianti in base a `actor.type`:

| Condizione | IT | EN |
|---|---|---|
| `actor.type === 'system'` | `All'utente **{{assignee}}** è stata assegnata la conversazione **{{conversation}}** dal sistema` | `Conversation **{{conversation}}** was automatically assigned to **{{assignee}}** by the system` |
| `actor.type === 'user'` | `All'utente **{{assignee}}** è stata assegnata la conversazione **{{conversation}}** (assegnazione automatica avviata da **{{actor}}**)` | `Conversation **{{conversation}}** was automatically assigned to **{{assignee}}** (triggered by **{{actor}}**)` |

```ts
const assignee = resolveAgentName(activity, activity.actionObj?.assigneeId);
const conversation = conversationLabel(activity);
const actor = actorName(activity);

if (activity.actor?.type === 'system') {
  // "All'utente Mario Rossi è stata assegnata la conversazione support-group-abc dal sistema"
} else {
  // "All'utente Mario Rossi è stata assegnata la conversazione support-group-abc (assegnazione automatica avviata da Laura Bianchi)"
}
```

---

### `REQUEST_ASSIGNED_MANUAL`

Un operatore ha assegnato la conversazione a un altro agente, a un chatbot o a un dipartimento.

Usare `actionObj.assigneeType` per distinguere i tre casi. Se presente, preferire `actionObj.assigneeName` al posto della risoluzione da `assigneeId`.

| `assigneeType` | IT | EN |
|---|---|---|
| `user` (default) | `All'utente **{{assignee}}** è stata assegnata la conversazione **{{conversation}}** da **{{actor}}**` | `**{{actor}}** assigned conversation **{{conversation}}** to **{{assignee}}**` |
| `bot` | `**{{actor}}** ha riassegnato la conversazione **{{conversation}}** al chatbot **{{assignee}}**` | `**{{actor}}** reassigned conversation **{{conversation}}** to chatbot **{{assignee}}**` |
| `department` | `**{{actor}}** ha riassegnato la conversazione **{{conversation}}** al dipartimento **{{assignee}}**` | `**{{actor}}** reassigned conversation **{{conversation}}** to department **{{assignee}}**` |

**Con agente precedente** (`previousAssigneeId` presente, tipico su reassign):

| `assigneeType` | IT | EN |
|---|---|---|
| `user` | `All'utente **{{assignee}}** è stata assegnata la conversazione **{{conversation}}** da **{{actor}}** (sostituisce **{{previous}}**)` | `**{{actor}}** reassigned conversation **{{conversation}}** to **{{assignee}}** (replacing **{{previous}}**)` |
| `bot` / `department` | Aggiungere `(sostituisce **{{previous}}**)` / `(replacing **{{previous}}**)` | stesso pattern |

```ts
const actor = actorName(activity);
const assignee = activity.actionObj?.assigneeName || resolveAssigneeName(activity);
const assigneeType = activity.actionObj?.assigneeType || 'user';
const previous = resolveAgentName(activity, activity.actionObj?.previousAssigneeId);
const conversation = conversationLabel(activity);
// IT bot: "Laura Bianchi ha riassegnato la conversazione support-group-abc al chatbot Support Bot"
// IT department: "Laura Bianchi ha riassegnato la conversazione support-group-abc al dipartimento Vendite"
```

---

### `REQUEST_UNASSIGNED`

| Lingua | Template |
|---|---|
| **IT** | `**{{actor}}** ha rimosso **{{assignee}}** dalla conversazione **{{conversation}}**` |
| **EN** | `**{{actor}}** unassigned **{{assignee}}** from conversation **{{conversation}}**` |

---

## Template frasi — conversazioni legacy

### `REQUEST_CREATE`

| Lingua | Template |
|---|---|
| **IT** | `**{{actor}}** ha avviato una nuova conversazione` |
| **EN** | `**{{actor}}** started a new conversation` |

`actor` = visitatore (`requester_id` / `requester_name`).
`target.object` contiene la request completa (`first_text`, `request_id`, …).

### `REQUEST_CLOSE`

| Lingua | Template |
|---|---|
| **IT** | `**{{actor}}** ha chiuso la conversazione **{{conversation}}**` |
| **EN** | `**{{actor}}** closed conversation **{{conversation}}**` |

`actor.id` = `closed_by`, `actor.name` = `closed_by_name`.

---

## Template frasi — team legacy

### `PROJECT_USER_INVITE`

| Lingua | Template |
|---|---|
| **IT** | `**{{actor}}** ha invitato **{{target}}** ({{email}}) ad assumere il ruolo di **{{role}}**` |
| **EN** | `**{{actor}}** invited **{{target}}** ({{email}}) to take on the role of **{{role}}**` |

Dati da usare:
- `actor.name`
- `target.object.id_user.firstname/lastname` oppure `actionObj.email`
- `actionObj.role`
- `target.type`: `pendinginvitation` vs `project_user`

### `PROJECT_USER_DELETE`

| Lingua | Template |
|---|---|
| **IT** | `**{{actor}}** ha rimosso **{{target}}** dal progetto` |
| **EN** | `**{{actor}}** removed **{{target}}** from the project` |

### `PROJECT_USER_UPDATE`

Due sotto-casi:

**A) L'utente modifica se stesso** (`actor.id === target.object.id_user._id`)

| Campo cambiato | IT | EN |
|---|---|---|
| `actionObj.user_available === true` | `{{actor}} ha cambiato il suo stato in disponibile` | `{{actor}} changed his status to available` |
| `actionObj.user_available === false` | `{{actor}} ha cambiato il suo stato in non disponibile` | `{{actor}} changed his status to unavailable` |

**B) Un admin modifica un altro utente**

| Campo cambiato | IT | EN |
|---|---|---|
| `actionObj.user_available` | `{{actor}} ha cambiato lo stato di disponibilità di {{target}} in disponibile/non disponibile` | `{{actor}} changed the availability status of {{target}} to available/unavailable` |
| `actionObj.role === 'admin'` | `{{actor}} ha cambiato il ruolo di {{target}} in Amministratore` | `{{actor}} changed the role of {{target}} to Administrator` |
| `actionObj.role === 'agent'` | `{{actor}} ha cambiato il ruolo di {{target}} in Agente` | `{{actor}} changed the role of {{target}} to Agent` |

---

## Chiavi i18n suggerite

```json
{
  "ACTIVITY": {
    "SYSTEM": "Sistema",
    "SOMEONE": "Qualcuno",
    "CONVERSATION": "conversazione",
    "UNKNOWN_AGENT": "agente sconosciuto",

    "REQUEST_ASSIGNED_SELF": "{{actor}} ha fatto join sulla conversazione {{conversation}}",
    "REQUEST_ASSIGNED_AUTO_SYSTEM": "All'utente {{assignee}} è stata assegnata la conversazione {{conversation}} dal sistema",
    "REQUEST_ASSIGNED_AUTO_TRIGGERED": "All'utente {{assignee}} è stata assegnata la conversazione {{conversation}} (assegnazione automatica avviata da {{actor}})",
    "REQUEST_ASSIGNED_MANUAL": "All'utente {{assignee}} è stata assegnata la conversazione {{conversation}} da {{actor}}",
    "REQUEST_ASSIGNED_MANUAL_REPLACED": "All'utente {{assignee}} è stata assegnata la conversazione {{conversation}} da {{actor}} (sostituisce {{previous}})",
    "REQUEST_ASSIGNED_MANUAL_BOT": "{{actor}} ha riassegnato la conversazione {{conversation}} al chatbot {{assignee}}",
    "REQUEST_ASSIGNED_MANUAL_BOT_REPLACED": "{{actor}} ha riassegnato la conversazione {{conversation}} al chatbot {{assignee}} (sostituisce {{previous}})",
    "REQUEST_ASSIGNED_MANUAL_DEPARTMENT": "{{actor}} ha riassegnato la conversazione {{conversation}} al dipartimento {{assignee}}",
    "REQUEST_ASSIGNED_MANUAL_DEPARTMENT_REPLACED": "{{actor}} ha riassegnato la conversazione {{conversation}} al dipartimento {{assignee}} (sostituisce {{previous}})",
    "REQUEST_UNASSIGNED": "{{actor}} ha rimosso {{assignee}} dalla conversazione {{conversation}}",

    "PROJECT_USER_AVAILABILITY_SELF": "{{targetUser}} ha modificato il suo stato in {{newStatus}}",
    "PROJECT_USER_AVAILABILITY_SYSTEM": "Lo stato di {{targetUser}} è stato modificato in {{newStatus}} dal sistema",

    "FAQ_KB_CREATE": "{{actor}} ha creato il chatbot {{chatbot}}",
    "FAQ_KB_DELETE": "{{actor}} ha eliminato il chatbot {{chatbot}}",
    "FAQ_KB_PUBLISH": "{{actor}} ha pubblicato il chatbot {{chatbot}}",
    "KB_NAMESPACE_CREATE": "{{actor}} ha creato il namespace {{namespace}}",
    "KB_NAMESPACE_DELETE": "{{actor}} ha eliminato il namespace {{namespace}}",
    "KB_CONTENTS_ADD": "{{actor}} ha aggiunto contenuti al namespace {{namespace}}",
    "KB_CONTENTS_ADD_MULTI": "{{actor}} ha aggiunto {{count}} elementi ({{addType}}) al namespace {{namespace}}",
    "KB_CONTENTS_DELETE": "{{actor}} ha eliminato tutti i contenuti dal namespace {{namespace}}",

    "REQUEST_CREATE": "{{actor}} ha avviato una nuova conversazione",
    "REQUEST_CLOSE": "{{actor}} ha chiuso la conversazione {{conversation}}",

    "PROJECT_USER_INVITE": "{{actor}} ha invitato {{target}} ({{email}}) ad assumere il ruolo di {{role}}",
    "PROJECT_USER_DELETE": "{{actor}} ha rimosso {{target}} dal progetto",
    "PROJECT_USER_UPDATE_SELF_AVAILABLE": "{{actor}} ha cambiato il suo stato in disponibile",
    "PROJECT_USER_UPDATE_SELF_UNAVAILABLE": "{{actor}} ha cambiato il suo stato in non disponibile",
    "PROJECT_USER_UPDATE_AVAILABILITY": "{{actor}} ha cambiato lo stato di disponibilità di {{target}}",
    "PROJECT_USER_UPDATE_ROLE_ADMIN": "{{actor}} ha cambiato il ruolo di {{target}} in Amministratore",
    "PROJECT_USER_UPDATE_ROLE_AGENT": "{{actor}} ha cambiato il ruolo di {{target}} in Agente"
  }
}
```

---

## Funzione di rendering consigliata (pseudocodice)

```ts
function renderActivity(activity: Activity, t: TranslateFn): string {
  // 1. Fallback server
  if (!hasTranslation(activity.verb)) {
    return activity.message || activity.verb;
  }

  const actor = actorName(activity);
  const conversation = conversationLabel(activity);
  const assignee = resolveAgentName(activity, activity.actionObj?.assigneeId);
  const previous = resolveAgentName(activity, activity.actionObj?.previousAssigneeId);

  switch (activity.verb) {

    case 'REQUEST_ASSIGNED_SELF':
      return t('ACTIVITY.REQUEST_ASSIGNED_SELF', { actor, conversation });

    case 'REQUEST_ASSIGNED_AUTO':
      return activity.actor?.type === 'system'
        ? t('ACTIVITY.REQUEST_ASSIGNED_AUTO_SYSTEM', { assignee, conversation })
        : t('ACTIVITY.REQUEST_ASSIGNED_AUTO_TRIGGERED', { assignee, conversation, actor });

    case 'REQUEST_ASSIGNED_MANUAL': {
      const assigneeType = activity.actionObj?.assigneeType || 'user';
      const resolvedAssignee = activity.actionObj?.assigneeName || assignee;
      if (assigneeType === 'bot') {
        return activity.actionObj?.previousAssigneeId
          ? t('ACTIVITY.REQUEST_ASSIGNED_MANUAL_BOT_REPLACED', { assignee: resolvedAssignee, conversation, actor, previous })
          : t('ACTIVITY.REQUEST_ASSIGNED_MANUAL_BOT', { assignee: resolvedAssignee, conversation, actor });
      }
      if (assigneeType === 'department') {
        return activity.actionObj?.previousAssigneeId
          ? t('ACTIVITY.REQUEST_ASSIGNED_MANUAL_DEPARTMENT_REPLACED', { assignee: resolvedAssignee, conversation, actor, previous })
          : t('ACTIVITY.REQUEST_ASSIGNED_MANUAL_DEPARTMENT', { assignee: resolvedAssignee, conversation, actor });
      }
      return activity.actionObj?.previousAssigneeId
        ? t('ACTIVITY.REQUEST_ASSIGNED_MANUAL_REPLACED', { assignee: resolvedAssignee, conversation, actor, previous })
        : t('ACTIVITY.REQUEST_ASSIGNED_MANUAL', { assignee: resolvedAssignee, conversation, actor });
    }

    case 'REQUEST_UNASSIGNED':
      return t('ACTIVITY.REQUEST_UNASSIGNED', { actor, assignee, conversation });

    case 'REQUEST_CREATE':
      return t('ACTIVITY.REQUEST_CREATE', { actor });

    case 'REQUEST_CLOSE':
      return t('ACTIVITY.REQUEST_CLOSE', { actor, conversation });

    // ... PROJECT_USER_* come da tabella sopra

    default:
      return activity.message || activity.verb;
  }
}
```

---

## Esempi completi

### Join manuale

```json
{
  "verb": "REQUEST_ASSIGNED_SELF",
  "actor": { "type": "user", "id": "user_abc", "name": "Mario Rossi" },
  "actionObj": {
    "assigneeId": "user_abc",
    "assignmentType": "self_join",
    "source": "api"
  },
  "target": {
    "type": "request",
    "object": { "request_id": "support-group-xyz" }
  }
}
```

→ **IT:** `Mario Rossi ha fatto join sulla conversazione support-group-xyz`

---

### Assegnazione automatica (sistema)

```json
{
  "verb": "REQUEST_ASSIGNED_AUTO",
  "actor": { "type": "system", "id": "system", "name": "System" },
  "actionObj": {
    "assigneeId": "user_abc",
    "assignmentType": "auto",
    "source": "queue"
  },
  "target": {
    "type": "request",
    "object": {
      "request_id": "support-group-xyz",
      "participatingAgents": [
        { "id_user": { "_id": "user_abc", "firstname": "Mario", "lastname": "Rossi" } }
      ]
    }
  }
}
```

→ **IT:** `All'utente Mario Rossi è stata assegnata la conversazione support-group-xyz dal sistema`

---

### Reassign manuale

```json
{
  "verb": "REQUEST_ASSIGNED_MANUAL",
  "actor": { "type": "user", "id": "user_supervisor", "name": "Laura Bianchi" },
  "actionObj": {
    "assigneeId": "user_abc",
    "assignmentType": "manual_reassign",
    "source": "api",
    "previousAssigneeId": "user_old"
  },
  "target": {
    "type": "request",
    "object": { "request_id": "support-group-xyz" }
  }
}
```

→ **IT:** `All'utente Mario Rossi è stata assegnata la conversazione support-group-xyz da Laura Bianchi`

---

## Filtri dashboard consigliati

Per una vista "Assegnazioni conversazioni":

```
GET /{project_id}/activities?activities=REQUEST_ASSIGNED_AUTO,REQUEST_ASSIGNED_SELF,REQUEST_ASSIGNED_MANUAL,REQUEST_UNASSIGNED
```

Per storico completo includere anche `REQUEST_CREATE` e `REQUEST_CLOSE`.

Per attività chatbot e Knowledge Base:

```
GET /{project_id}/activities?activities=FAQ_KB_CREATE,FAQ_KB_DELETE,FAQ_KB_PUBLISH,KB_NAMESPACE_CREATE,KB_NAMESPACE_DELETE,KB_CONTENTS_ADD,KB_CONTENTS_DELETE
```

Per attività di un singolo agente:

```
GET /{project_id}/activities?agent_id={user_id}
```

---

## Note implementative

1. **`target.object` può essere grande** — contiene la request snapshot al momento dell'evento. Per la UI usare solo i campi necessari (`request_id`, `participatingAgents`, `first_text`).
2. **Non usare l'endpoint HTTP** per capire il tipo di assegnazione — usare sempre `verb` e `actionObj.assignmentType`.
3. **`actor.id` su `PROJECT_USER_UPDATE`** può essere `_id` MongoDB, mentre su altri eventi è `user.id` — confrontare sempre come stringa.
4. **Preflight** — le request con `preflight: true` non generano activity di creazione.
5. Il campo `message` dalla API è **solo inglese** e copre i verb di assegnazione, disponibilità, chatbot e Knowledge Base; per gli altri verb legacy il client deve costruire la frase localmente.
