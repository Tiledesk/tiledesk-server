const listener = require("./listener");

const whatsapp = require("@tiledesk/tiledesk-whatsapp-connector");
const whatsappRoute = whatsapp.router;


module.exports = { listener: listener, whatsappRoute: whatsappRoute }