const uuidv4 = require('uuid/v4');

module.exports = function generateTemplate(options) {

    const custom_intent_id = uuidv4();

    return [
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "intent",
                "intentName": "#" + custom_intent_id
            }],
            "question": "",
            "intent_display_name": "start",
            "attributes": {
                "position": {
                    "x": 172,
                    "y": 384
                }
            }
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "Return",
                "_tdActionType": "return",
                "payload": "{\n\"data\": {{result | json}}\n}",
                "bodyType": "json",
                "status": "200"
            }],
            "intent_display_name": "response",
            "intent_id": custom_intent_id,
            "attributes": {
                "position": {
                    "x": 714,
                    "y": 113
                }
            }
        }
    ]
}