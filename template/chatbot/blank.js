const uuidv4 = require('uuid/v4');

module.exports = function generateTemplate(options) {
    
    const custom_intent_id = uuidv4();

    return [
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "reply",
                "text": "I didn't understand. Can you rephrase your question?",
                "attributes": {
                    "commands": [{
                        "type": "wait",
                        "time": 500
                    }, {
                        "type": "message",
                        "message": {
                            "type": "text",
                            "text": "I didn't understand. Can you rephrase your question?"
                        }
                    }]
                }
            }],
            "intent_display_name": "defaultFallback",
            "attributes": {
                "position": {
                    "x": 714,
                    "y": 528
                }
            }
        }, {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "intent",
                "intentName": "#" + custom_intent_id
            }],
            "question": "\\start",
            "intent_display_name": "start",
            "attributes": {
                "position": {
                    "x": 172,
                    "y": 384
                }
            }
        }, {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "reply",
                "attributes": {
                    "disableInputMessage": false,
                    "commands": [{
                        "type": "wait",
                        "time": 500
                    }, {
                        "type": "message",
                        "message": {
                            "type": "text",
                            "text": "Hi, how can I help you?"
                        }
                    }]
                },
                "text": "Hi, how can I help you?\r\n"
            }],
            "intent_display_name": "welcome",
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