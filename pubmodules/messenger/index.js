const listener = require("./listener");

const messenger = require("@tiledesk/tiledesk-messenger-connector");
const messengerRoute = messenger.router;


module.exports = { listener: listener, messengerRoute: messengerRoute }