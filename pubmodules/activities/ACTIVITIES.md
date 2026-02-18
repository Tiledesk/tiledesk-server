# Lista delle Activity

Questo documento elenca tutte le **activity** create tramite il modello `Activity` definito in [`models/activity.js`](models/activity.js).

Il modello segue il contesto [Activity Streams (W3C)](https://getstream.io/blog/designing-activity-stream-newsfeed-w3c-spec/) e ogni activity ha:
- **actor**: chi compie l’azione (tipo, id, name)
- **verb**: tipo di azione (campo indicizzato)
- **actionObj**: oggetto opzionale con dati dell’azione
- **target**: destinatario/contesto (tipo, id, object)
- **id_project**: progetto di riferimento (indicizzato)

Le activity vengono create dall’**ActivityArchiver** in [`activityArchiver.js`](activityArchiver.js), in ascolto su eventi di `authEvent`, `requestEvent`, `botEvent` e `kbEvent`.  
L’archiviazione è attiva solo se `ACTIVITY_HISTORY_ENABLED=true`.

---

## Activity attive (create dal sistema)

### Da ActivityArchiver (eventi)

| Verb | Evento | Descrizione | Target |
|------|--------|-------------|--------|
| **PROJECT_USER_INVITE** | `project_user.invite.pending` | Invito a un progetto in stato “pending” (in attesa di accettazione) | `pendinginvitation` |
| **PROJECT_USER_INVITE** | `project_user.invite` | Utente invitato e aggiunto al progetto | `project_user` |
| **PROJECT_USER_UPDATE** | `project_user.update` | Aggiornamento di un utente del progetto (ruolo, dati, ecc.) | `project_user` |
| **PROJECT_USER_DELETE** | `project_user.delete` | Rimozione di un utente dal progetto | `project_user` |
| **REQUEST_CREATE** | `request.create` | Creazione di una nuova richiesta/conversazione | `request` |
| **REQUEST_CREATE** | `request.update.preflight` | Creazione/aggiornamento “preflight” di una richiesta | `request` |
| **REQUEST_CLOSE** | `request.close` | Chiusura di una richiesta/conversazione | `request` |

### Da botEvent ([`routes/faq_kb.js`](../../routes/faq_kb.js) → [`activityArchiver.js`](activityArchiver.js))

| Verb | Evento | Route / azione | Descrizione | Target |
|------|--------|----------------|-------------|--------|
| **CHATBOT_DELETE** | `faqbot.delete.activity` | `DELETE /:faq_kbid` | Eliminazione di un chatbot | `chatbot` |
| **CHATBOT_PUBLISH** | `faqbot.publish.activity` | `PUT /:faq_kbid/publish` | Pubblicazione di un chatbot (fork + release) | `chatbot` |

### Da kbEvent ([`routes/kb.js`](../../routes/kb.js) → [`activityArchiver.js`](activityArchiver.js))

| Verb | Evento | Route / azione | Descrizione | Target |
|------|--------|----------------|-------------|--------|
| **KB_NAMESPACE_CREATE** | `kb.namespace.create` | `POST /namespace` | Creazione di un nuovo namespace (KB) | `kb_namespace` |
| **KB_NAMESPACE_DELETE** | `kb.namespace.delete` | `DELETE /namespace/:id` (senza `contents_only`) | Eliminazione di un namespace (e relativi contenuti) | `kb_namespace` |
| **KB_CONTENTS_DELETE** | `kb.contents.delete` | `DELETE /namespace/:id?contents_only=true` o `DELETE /deleteall` | Eliminazione di tutti i contenuti di un namespace | `kb_namespace` |
| **KB_CONTENT_DELETE** | `kb.content.delete` | `DELETE /:kb_id` | Eliminazione di un singolo contenuto della KB | `kb_content` |

---

## Activity disabilitate (commentate nel codice)

Queste activity sono definite in `activityArchiver.js` ma il relativo listener è commentato (non vengono quindi create).

| Verb | Evento (commentato) | Descrizione |
|------|---------------------|-------------|
| **USER_SIGNIN** | `user.signin` | Accesso utente (disabilitato per sicurezza: evitare di salvare dati sensibili) |
| **USER_SIGNIN_ERROR** | `user.login.error` | Errore di login |
| **USER_REQUEST_RESETPASSWORD** | `user.requestresetpassword` | Richiesta di reset password |
| **USER_RESETPASSWORD** | `user.resetpassword` | Reset password completato |
| **USER_SIGNUP** | `user.signup` | Registrazione nuovo utente |
| **USER_SIGNUP_ERROR** | `user.signup.error` | Errore in fase di registrazione |

---

## Riepilogo verb utilizzati nelle API

Le route in [`routes/activity.js`](routes/activity.js) filtrano le activity per `verb` (es. query `activities=PROJECT_USER_UPDATE,PROJECT_USER_DELETE`) e gestiscono in modo specifico:

- `PROJECT_USER_UPDATE`
- `PROJECT_USER_DELETE`
- `PROJECT_USER_INVITE`
- `REQUEST_CREATE`

---

*Ultimo aggiornamento in base a `activityArchiver.js`, `models/activity.js`, `routes/faq_kb.js` e `routes/kb.js`.*
