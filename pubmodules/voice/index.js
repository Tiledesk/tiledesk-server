const listener = require("./listener");

const voice = require("@tiledesk/tiledesk-vxml-connector");
const voiceRoute = voice.router;


module.exports = { listener: listener, voiceRoute: voiceRoute }