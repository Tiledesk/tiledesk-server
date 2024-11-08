const listener = require("./listener");

const twilio_voice = require("@tiledesk/tiledesk-")
const twilioVoiceRoute = twilio_voice.router;

module.exports = { listener: listener, twilioVoiceRoute: twilioVoiceRoute }