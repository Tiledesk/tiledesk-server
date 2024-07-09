const listener = require("./listener");

const sms = require("@tiledesk/tiledesk-sms-connector");
const smsRoute = sms.router;


module.exports = { listener: listener, smsRoute: smsRoute }