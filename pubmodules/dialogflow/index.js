const listener = require("./listener");

const dialogflow = require("@tiledesk/tiledesk-dialogflow-connector");
const dialogflowRoute = dialogflow.router;





module.exports = { listener: listener, dialogflowRoute: dialogflowRoute };