const mqttTest = require("@tiledesk/tiledesk-client/mqtt-route");
let winston = require('../../config/winston');
let configGlobal = require('../../config/global');

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

let listener = new Listener();

module.exports = listener;