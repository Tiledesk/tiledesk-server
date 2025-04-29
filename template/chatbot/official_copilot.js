const uuidv4 = require('uuid/v4');

module.exports = function generateTemplate(options) {

    let namespace_id = options.namespace_id;

    const get_message_intent = uuidv4();
    const get_request_intent = uuidv4();
    const no_msg_or_req_intent = uuidv4();
    const check_message_intent = uuidv4();
    const check_no_issue_intent = uuidv4();
    const check_question_intent = uuidv4();
    const extract_issue_ai_intent = uuidv4();
    const check_request_id_intent = uuidv4();
    const extract_question_intent = uuidv4();
    const create_transcript_intent = uuidv4();
    const ask_kb_from_request_intent = uuidv4();
    const ask_kb_from_message_intent = uuidv4();
    const return_no_content_1_intent = uuidv4();
    const return_no_content_2_intent = uuidv4();
    const return_no_content_3_intent = uuidv4();
    const return_no_content_4_intent = uuidv4();
    const return_response_message_intent = uuidv4();
    const return_response_request_intent = uuidv4();

    return [
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "intent",
                "intentName": "#" + get_message_intent
            }],
            "intent_display_name": "webhook",
            "question": "",
            "attributes": {
                "position": {
                    "x": 172,
                    "y": 384
                },
                "readonly": true,
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "jsoncondition",
                "groups": [
                    {
                        "type": "expression",
                        "conditions": [
                            {
                                "type": "condition",
                                "operand1": "message",
                                "operator": "isEmpty",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            },
                            {
                                "type": "operator",
                                "operator": "OR"
                            },
                            {
                                "type": "condition",
                                "operand1": "message",
                                "operator": "isNull",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            },
                            {
                                "type": "operator",
                                "operator": "OR"
                            },
                            {
                                "type": "condition",
                                "operand1": "message",
                                "operator": "isUndefined",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            }
                        ]
                    }
                ],
                "stopOnConditionMet": true,
                "noelse": true,
                "trueIntent": "#" + check_request_id_intent
            }],
            "intent_display_name": "check_message",
            "intent_id": check_message_intent,
            "attributes": {
                "position": {
                    "x": 960,
                    "y": 245
                },
                "nextBlockAction": {
                    "_tdActionId": "e459225f-0a01-4786-b987-7fa3d4421877",
                    "_tdActionType": "intent",
                    "intentName": "#" + extract_issue_ai_intent
                },
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "askgptv2",
                "question": "{{gpt_reply}}",
                "assignReplyTo": "kb_reply",
                "assignSourceTo": "kb_source",
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_k": 10,
                "model": "gpt-4o",
                "preview": [],
                "history": false,
                "citations": true,
                "namespace": namespace_id,
                "context": "",
                "trueIntent": "#" + return_response_message_intent,
                "falseIntent": "#" + return_no_content_4_intent
            }],
            "intent_display_name": "ask_kb_from_message",
            "intent_id": ask_kb_from_message_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2477,
                    "y": 801
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "gpt_task",
                "max_tokens": 256,
                "temperature": 0.7,
                "model": "gpt-4o",
                "assignReplyTo": "gpt_reply",
                "preview": [],
                "formatType": "none",
                "question": "This is a user message taken from support conversation.\n\n{{message}}\n\nCheck that the message contains a question or poses a problem. If there is, make it clear and concise as if the user were writing, otherwise reply with \"NULL\".",
                "context": "",
                "trueIntent": "#" + check_no_issue_intent
            }],
            "intent_display_name": "extract_issue_ai",
            "intent_id": extract_issue_ai_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 1510,
                    "y": 473
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "jsoncondition",
                "groups": [
                    {
                        "type": "expression",
                        "conditions": [
                            {
                                "type": "condition",
                                "operand1": "gpt_reply",
                                "operator": "equalAsStrings",
                                "operand2": {
                                    "type": "const",
                                    "value": "NULL",
                                    "name": ""
                                }
                            }
                        ]
                    }
                ],
                "stopOnConditionMet": true,
                "noelse": true,
                "trueIntent": "#" + return_no_content_3_intent
            }],
            "intent_display_name": "check_no_issue",
            "intent_id": check_no_issue_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 1978,
                    "y": 557
                },
                "nextBlockAction": {
                    "_tdActionId": "37185650-df70-4b90-9784-bcff646e37ce",
                    "_tdActionType": "intent",
                    "intentName": "#" + ask_kb_from_message_intent
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{}",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "400"
            }],
            "intent_display_name": "return_no_content_3",
            "intent_id": return_no_content_3_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2465,
                    "y": 461
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "jsoncondition",
                "groups": [
                    {
                        "type": "expression",
                        "conditions": [
                            {
                                "type": "condition",
                                "operand1": "request_id",
                                "operator": "isEmpty",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            },
                            {
                                "type": "operator",
                                "operator": "OR"
                            },
                            {
                                "type": "condition",
                                "operand1": "request_id",
                                "operator": "isNull",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            },
                            {
                                "type": "operator",
                                "operator": "OR"
                            },
                            {
                                "type": "condition",
                                "operand1": "request_id",
                                "operator": "isUndefined",
                                "operand2": {
                                    "type": "const",
                                    "value": "",
                                    "name": ""
                                }
                            }
                        ]
                    }
                ],
                "stopOnConditionMet": true,
                "noelse": true,
                "trueIntent": "#" + no_msg_or_req_intent
            }],
            "intent_display_name": "check_request_id",
            "intent_id": check_request_id_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 1505,
                    "y": 52
                },
                "nextBlockAction": {
                    "_tdActionId": "a32cc3aa-8fd2-4ef4-8129-06ec8de6de32",
                    "_tdActionType": "intent",
                    "intentName": "#" + get_request_intent
                },
                "color": "80,100,147",
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "setattribute-v2",
                "operation": {
                    "operands": [
                        {
                            "value": "{{result | json}}",
                            "isVariable": false
                        }
                    ],
                    "operators": []
                },
                "destination": "messages"
            },
            {
                "_tdActionTitle": "",
                "_tdActionType": "code",
                "source": "let messages = context.attributes[\"messages\"]\nmessages = JSON.parse(messages);\n\nlet transcript = \"\";\nmessages?.forEach(message => {\n    // only unuseful messages have subtype\n    const subtype = message?.attributes?.subtype;\n\n    // only chatbots\n    const intentName = message?.attributes?.intentName;\n\n    // only end-users\n    // const requester_id = message?.attributes?.requester_id;\n\n    // only service messages\n    const messagelabel = message?.attributes?.messagelabel;\n\n    // human only messages\n    if (!subtype && !messagelabel && !intentName) {\n      //console.log(\"message:\", message);\n      let text = message.senderFullname + \": \" + message.text;\n      transcript += text + \"\\n\";\n    }\n  });\n\ncontext.setAttribute(\"transcript\", transcript);"
            }],
            "intent_display_name": "create_transcript",
            "intent_id": create_transcript_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2724,
                    "y": -217
                },
                "nextBlockAction": {
                    "_tdActionId": "dbe26ec5-5c96-47b4-a885-294289a45f00",
                    "_tdActionType": "intent",
                    "intentName": "#" + extract_question_intent
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "setattribute-v2",
                "operation": {
                    "operands": [
                        {
                            "value": "{{payload.text}}",
                            "isVariable": false
                        }
                    ],
                    "operators": []
                },
                "destination": "message"
            },
            {
                "_tdActionTitle": "",
                "_tdActionType": "setattribute-v2",
                "operation": {
                    "operands": [
                        {
                            "value": "{{payload.request_id}}",
                            "isVariable": false
                        }
                    ],
                    "operators": []
                },
                "destination": "request_id"
            }],
            "intent_display_name": "get_message",
            "intent_id": get_message_intent,
            "attributes": {
                "position": {
                    "x": 527,
                    "y": 247
                },
                "nextBlockAction": {
                    "_tdActionId": "282fc8fd-c315-4c66-ae5e-82513595e718",
                    "_tdActionType": "intent",
                    "intentName": "#" + check_message_intent
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionType": "web_response",
                "status": "400",
                "bodyType": "json",
                "payload": "{}"
            }],
            "intent_display_name": "no_msg_or_req",
            "intent_id": no_msg_or_req_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2019,
                    "y": -183
                },
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{}",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "404"
            }],
            "intent_display_name": "return_no_content_1",
            "intent_id": return_no_content_1_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 4170,
                    "y": -251
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "url": "https://api.tiledesk.com/v3/public/requests/{{request_id}}/messages",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "settings": {
                    "timeout": 20000
                },
                "jsonBody": null,
                "bodyType": "none",
                "formData": [],
                "assignStatusTo": "status",
                "assignErrorTo": "error",
                "method": "GET",
                "_tdActionType": "webrequestv2",
                "assignResultTo": "result",
                "trueIntent": "#" + create_transcript_intent
            }],
            "intent_display_name": "get_request",
            "intent_id": get_request_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2110,
                    "y": 88
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{}",
                "headersString": {
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*",
                    "Content-Type": "application/json"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "404"
            }],
            "intent_display_name": "return_no_content_4",
            "intent_id": return_no_content_4_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2971,
                    "y": 1064
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "gpt_task",
                "max_tokens": 256,
                "temperature": 0.7,
                "model": "gpt-4o",
                "assignReplyTo": "gpt_reply",
                "preview": [],
                "formatType": "none",
                "question": "This is a support conversation.\n\n{{transcript}}\n\nAnalyze the conversation, summarize the question that was asked or the problem that was posed. If there are multiple problems or questions, try to consider the last unsolved problem.\nIf there is no question or unsolved problem, respond with \"NULL\".",
                "context": "",
                "trueIntent": "#" + check_question_intent
            }],
            "intent_display_name": "extract_question",
            "intent_id": extract_question_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 3194,
                    "y": -223
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{}",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "404"
            }],
            "intent_display_name": "return_no_content_2",
            "intent_id": return_no_content_2_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 4699,
                    "y": 272
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{\n\"title\": \"Copilot Official\",\n\"question\": {{gpt_reply | json}},\n\"text\": {{kb_reply | json}}\n}",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "200"
            }],
            "intent_display_name": "return_response_request",
            "intent_id": return_response_request_intent,
            "attributes": {
                "position": {
                    "x": 4690,
                    "y": 16
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "askgptv2",
                "question": "{{gpt_reply}}",
                "assignReplyTo": "kb_reply",
                "assignSourceTo": "kb_source",
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_k": 10,
                "model": "gpt-4o",
                "preview": [],
                "history": false,
                "citations": true,
                "namespace": namespace_id,
                "context": "",
                "trueIntent": "#" + return_response_request_intent,
                "falseIntent": "#" + return_no_content_2_intent
            }],
            "intent_display_name": "ask_kb_from_request",
            "intent_id": ask_kb_from_request_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 4179,
                    "y": 22
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "_tdActionType": "jsoncondition",
                "groups": [
                    {
                        "type": "expression",
                        "conditions": [
                            {
                                "type": "condition",
                                "operand1": "gpt_reply",
                                "operator": "equalAsStrings",
                                "operand2": {
                                    "type": "const",
                                    "value": "NIENTE",
                                    "name": ""
                                }
                            }
                        ]
                    }
                ],
                "stopOnConditionMet": true,
                "noelse": true,
                "trueIntent": "#" + return_no_content_1_intent
            }],
            "intent_display_name": "check_question",
            "intent_id": check_question_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 3653,
                    "y": -127
                },
                "nextBlockAction": {
                    "_tdActionId": "11879363-4439-4723-82bc-efeb1e7c62ef",
                    "_tdActionType": "intent",
                    "intentName": "#" + ask_kb_from_request_intent
                },
                "readonly": false
            },
            "agents_available": false
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "actions": [{
                "_tdActionTitle": "",
                "payload": "{\n\"title\": \"Copilot Official\",\n\"question\": {{gpt_reply | json}},\n\"text\": {{kb_reply | json}}\n}",
                "headersString": {
                    "Content-Type": "*/*",
                    "Cache-Control": "no-cache",
                    "User-Agent": "TiledeskBotRuntime",
                    "Accept": "*/*"
                },
                "bodyType": "json",
                "assignTo": "",
                "_tdActionType": "web_response",
                "status": "200"
            }],
            "intent_display_name": "return_response_message",
            "intent_id": return_response_message_intent,
            "language": "en",
            "attributes": {
                "position": {
                    "x": 2969,
                    "y": 841
                },
                "readonly": false
            },
            "agents_available": false
        }
    ]
}


