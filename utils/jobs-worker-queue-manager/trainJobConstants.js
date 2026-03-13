/**
 * Routing keys per le code del train-jobworker (RabbitMQ).
 * Allineati al consumer tiledesk-train-jobworker.
 *
 * Job "update" (ROUTING_KEY_UPDATE): un solo messaggio; il worker deve in sequenza:
 *   1) chiamare l'API delete con payload.delete (rimuove il vecchio indice per id)
 *   2) al termine con successo, chiamare scrape/single (o equivalente) con payload.train
 *
 * Body publish: { payload: { delete: {...}, train: {...} } }
 *   - delete: stesso formato del job delete ({ id, namespace, engine, ... })
 *   - train: stesso formato del job index ({ id, source, type, webhook, embedding, engine, ... })
 */
const ROUTING_KEY_INDEX = 'functions';   // job index/train (indicizzazione)
const ROUTING_KEY_DELETE = 'delete';     // job delete (rimozione dall'indice)
const ROUTING_KEY_UPDATE = 'update';     // job update (delete poi train nello stesso handler)

module.exports = {
  ROUTING_KEY_INDEX,
  ROUTING_KEY_DELETE,
  ROUTING_KEY_UPDATE
};
