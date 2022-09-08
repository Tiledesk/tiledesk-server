const listener = require("./listener");

const tilebot = require("@tiledesk/tiledesk-tybot-connector");
const tilebotRoute = tilebot.router;





module.exports = { listener: listener, tilebotRoute: tilebotRoute };

