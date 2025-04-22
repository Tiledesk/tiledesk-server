const ActionsConstants = require('../../models/actionsConstants');

module.exports = function generateTemplate(options) {

    return [
        {
            'question': 'Hi',
            'answer': 'Hi',
            'topic': 'greetings'
        },
        {
            'question': 'Hello',
            'answer': 'Hello',
            'topic': 'greetings'
        },
        {
            'question': 'Who are you?',
            'answer': 'Hi, I\'m a bot 🤖. You can find more about me [here](https://tiledesk.com/chatbot-for-customer-service).\ntdImage:https://console.tiledesk.com/assets/images/tily-welcomebot.gif\n* See the website https://tiledesk.com/\n* Back to start tdAction:start',
            'topic': 'greetings'
        },
        {
            'question': '👨🏻‍🦰 I want an agent',
            'answer': 'We are looking for an operator.. ' + ActionsConstants.CHAT_ACTION_MESSAGE.AGENT,
            'intent_display_name': 'agent_handoff',
            'topic': 'internal'
        },
        {
            'question': 'Close\nResolved',
            'answer': ActionsConstants.CHAT_ACTION_MESSAGE.CLOSE,
            'topic': 'internal'
        },
        {
            'question': '\\start',
            'answer': 'Hello 👋. I\'m a bot 🤖.\n\nChoose one of the options below or write a message to reach our staff.\n* Who are you?\n* Where are you?\n* What can you do?\n* 👨🏻‍🦰 I want an agent',
            'intent_display_name': 'start',
            'topic': 'internal'
        },
        {
            'question': 'defaultFallback',
            'answer': 'I can not provide an adequate answer. Write a new question or talk to a human agent.\n* Back to start tdAction:start\n* See the docs https://docs.tiledesk.com/\n* 👨🏻‍🦰 I want an agent',
            'intent_display_name': 'defaultFallback',
            'topic': 'internal'
        },
        {
            'question': 'What can you do?',
            'answer': 'Using natural language processing, I\'m able to find the best answer for your users. I also support images, videos etc.. Let\'s try:\n* Sample Image\n* Sample Video\n* Sample Action tdAction:action1\n* Sample Frame\n* Back to start tdAction:start',
            'topic': 'sample'
        },
        {
            'question': 'Sample Image',
            'answer': 'tdImage:https://tiledesk.com/wp-content/uploads/2022/07/tiledesk_v2.png\n* What can you do?\n* Back to start tdAction:start',
            'topic': 'sample'
        },
        {
            'question': 'Sample Frame',
            'answer': 'tdFrame:https://www.emanueleferonato.com/wp-content/uploads/2019/02/runner/\n* What can you do?\n* Back to start tdAction:start',
            'topic': 'sample'
        },
        {
            'question': 'Sample Video',
            'answer': 'tdVideo:https://www.youtube.com/embed/EngW7tLk6R8\n* What can you do?\n* Back to start tdAction:start',
            'topic': 'sample'
        },
        {
            'question': 'Where are you?',
            'answer': 'We are here ❤️\ntdFrame:https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6087916.923447935!2d8.234804542117423!3d41.836572992140624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12d4fe82448dd203%3A0xe22cf55c24635e6f!2sItaly!5e0!3m2!1sen!2sit!4v1613657475377!5m2!1sen!2sit\n* Back to start tdAction:start',
            'topic': 'sample'
        },
        {
            'question': 'Sample Action',
            'answer': 'Hello 👋 Would you like to take a closer look at our offer?\n* Yes, please tdAction:yes_action\n* No tdAction:no_action',
            'intent_display_name': 'action1',
            'topic': 'sample'
        },
        {
            'question': 'Yes Action',
            'answer': 'Great! Take a look here:\n* Tiledesk Pricing https://tiledesk.com/pricing-cloud/',
            'intent_display_name': 'yes_action',
            'topic': 'sample'
        },
        {
            'question': 'No Action',
            'answer': 'All right! If you need anything, let us know.',
            'intent_display_name': 'no_action',
            'topic': 'sample'
        }
    ]
}