const listener = require("./listener");

const voice_enghouse = require('@tiledesk/tiledesk-vxml-enghouse-connector');
const voiceEnghouseRoute = voice_enghouse.router;

module.exports = { listener: listener, voiceEnghouseRoute: voiceEnghouseRoute }