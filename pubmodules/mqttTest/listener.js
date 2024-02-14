const mqttTest = require("@tiledesk/tiledesk-client/mqtt-route");
var winston = require('../../config/winston');
var configGlobal = require('../../config/global');

const apiUrl = process.env.API_URL || configGlobal.apiUrl;
winston.info('MqttTest apiUrl: ' + apiUrl);

class Listener {

    listen(config) {
        winston.info("MqttTest Listener listen");
    
        let log = process.env.MQTT_TEST_LOG || false;
        winston.info("mqtt log: " + log);

        mqttTest.startApp({
            LOG_STATUS: log
        }, (err) => {
            if (!err) {
                winston.info("Tiledesk mqtt-test succesfully started.");
            } else {
                winston.info("unable to start Tiledesk mqtt-test. " + err);
            }
        })

    }
}

var listener = new Listener();

module.exports = listener;