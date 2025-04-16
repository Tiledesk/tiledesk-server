const uuidv4 = require('uuid/v4');

module.exports = function generateTemplate() {

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
            "intent_display_name": "webhook",
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
                "_tdActionType": "web_response",
                "status": 200,
                "bodyType": "json",
                "payload": '{"title": "Official Copilot", "text": "This is a suggestion!"}'
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