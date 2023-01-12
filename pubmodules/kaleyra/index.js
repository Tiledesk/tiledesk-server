const listener = require('./listener');

const kaleyra = require('@tiledesk/tiledesk-kaleyra-proxy');
const kaleyraRoute = kaleyra.router;

module.exports = { listener: listener, kaleyraRoute: kaleyraRoute }