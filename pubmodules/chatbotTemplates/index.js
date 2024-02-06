const listener = require("./listener");

const templates = require("@tiledesk/tiledesk-chatbot-templates");
const templatesRoute = templates.router;


module.exports = { listener: listener, templatesRoute: templatesRoute }