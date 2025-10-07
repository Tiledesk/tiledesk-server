const conciergeBot = require('./conciergeBot');

let winston = require('../../config/winston');

class AppRules {

    start() {
    
        //DEPRECATED
        // roundRobinOperator.start();
           conciergeBot.listen();
    }
}

let appRules = new AppRules();
module.exports = appRules;