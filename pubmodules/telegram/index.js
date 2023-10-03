const listener = require('./listener');

const telegram = require("@tiledesk/tiledesk-telegram-connector");
const telegramRoute = telegram.router;

module.exports = { listener: listener, telegramRoute: telegramRoute }