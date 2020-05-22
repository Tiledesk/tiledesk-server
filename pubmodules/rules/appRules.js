const conciergeBot = require('./conciergeBot');

var winston = require('../../config/winston');

class AppRules {

    start() {
    
        //DEPRECATED
        // roundRobinOperator.start();
           conciergeBot.listen();
    }
}

var appRules = new AppRules();
module.exports = appRules;