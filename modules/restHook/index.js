console.log("10")
const resthookRoute = require("./route/subscription");
console.log("101")
const subscriptionNotifier = require("./SubscriptionNotifier");
console.log("102")
module.exports = {subscriptionNotifier:subscriptionNotifier, resthookRoute:resthookRoute};