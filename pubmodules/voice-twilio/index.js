const listener = require("./listener");

const twilio_voice = require('@tiledesk/tiledesk-voice-twilio-connector');
const voiceTwilioRoute = twilio_voice.router;

module.exports = { listener: listener, voiceTwilioRoute: voiceTwilioRoute }