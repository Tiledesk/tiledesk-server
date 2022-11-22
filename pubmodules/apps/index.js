const listener = require("./listener");

const apps = require("@tiledesk/tiledesk-apps");
const appsRoute = apps.router;


module.exports = { listener: listener, appsRoute: appsRoute }

