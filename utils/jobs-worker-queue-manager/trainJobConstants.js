/**
 * Routing keys per le code del train-jobworker (RabbitMQ).
 * Allineati al consumer tiledesk-train-jobworker.
 */
const ROUTING_KEY_INDEX = 'functions';   // job index/train (indicizzazione)
const ROUTING_KEY_DELETE = 'delete';     // job delete (rimozione dall'indice)

module.exports = {
  ROUTING_KEY_INDEX,
  ROUTING_KEY_DELETE
};
