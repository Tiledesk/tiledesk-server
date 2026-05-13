const RequestRetention = require("./requestRetention");
const ProjectRequestsExpiresRecalc = require("./projectRequestsExpiresRecalc");

const requestRetention = new RequestRetention();
const projectRequestsExpiresRecalc = new ProjectRequestsExpiresRecalc();

module.exports = { requestRetention, projectRequestsExpiresRecalc };