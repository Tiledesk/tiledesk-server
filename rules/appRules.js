const roundRobinOperator = require('../rules/roundRobinOperator');

var winston = require('../config/winston');

class AppRules {

    start() {
    
        // roundRobinOperator.start();

    }
}

var appRules = new AppRules();
module.exports = appRules;