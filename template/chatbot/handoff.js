const ActionsConstants = require('../../models/actionsConstants');

module.exports = function generateTemplate(options) {

    return [
        {
            'question': '\\start',
            'answer': 'Hello',
            'intent_display_name': 'start',
            'topic': 'internal'
        },
        {
            'question': '👨🏻‍🦰 I want an agent',
            'answer': 'We are looking for an operator.. ' + ActionsConstants.CHAT_ACTION_MESSAGE.AGENT,
            'intent_display_name': 'agent_handoff',
            'topic': 'internal'
        },
        {
            'question': 'defaultFallback',
            'answer': 'I can not provide an adequate answer. Write a new question or talk to a human agent.\n* Back to start tdAction:start\n* See the docs https://docs.tiledesk.com/\n* 👨🏻‍🦰 I want an agent', 
            'intent_display_name': 'defaultFallback', 
            'topic': 'internal'
        }
    ]
}