const uuidv4 = require('uuid/v4');

module.exports = function generateTemplate(options) {

    const custom_intent_id = uuidv4();

    return [
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [
                {
                    "_tdActionType": "intent",
                    "intentName": "#" + custom_intent_id
                }
            ],
            "question": "\\start",
            "intent_display_name": "start",
            "agents_available": false,
            "attributes": {
                "readonly": true,
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
                            "text": "I didn't understand. Can you rephrase your question?",
                        }
                    }]
                }
            }],
            "intent_display_name": "defaultFallback",
            "agents_available": false,
            "attributes": {
                "readonly": true,
                "position": {
                    "x": 714,
                    "y": 528
                }
            }
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [
                {
                    "_tdActionType": "play_prompt",
                    "attributes": {
                        "disableInputMessage": false,
                        "commands": [{
                            "type": "wait",
                            "time": 0
                        }, {
                            "type": "message",
                            "message": {
                                "type": "text",
                                "text": "Hi, how can I help you?",
                            }
                        }, {
                            "type": "wait",
                            "time": 0
                        }, {
                            "type": "settings",
                            "settings": {
                                "bargein": true
                            },
                            "subType": "play_prompt"
                        }]
                    }
                }
            ],
            "intent_id": custom_intent_id,
            "intent_display_name": "welcome",
            "agents_available": false,
            "attributes": {
                "position": {
                    "x": 714,
                    "y": 113
                }
            },
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "close"
            }],
            "intent_display_name": "close",
            "agents_available": false,
            "attributes": {
                "readonly": true,
                "color": "204,68,75",
                "position": {
                    "x": 399,
                    "y": 531
                }
            }
        }
    ]
}