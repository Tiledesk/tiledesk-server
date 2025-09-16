const existing_chatbot_mock = {
    _id: "63234fd6c69f188814749e1b",
    webhook_enabled: false,
    type: "tilebot",
    secret: "a3577185-a8bf-4547-a000-6ba81ccb0460",
    language: "en",
    description: "A Tiledesk bot",
    id_project: "63234fd6c69f188814749e15",
    trashed: false,
    createdBy: "system",
    createdAt: "2022-09-15T15:32:06.491Z",
    updatedAt: "2022-09-15T15:32:06.491Z",
    name: "Bot",
    attributes: {
        globals: {
            "mykey1": "myvalue1",
            "mykey2": "myvalue2"
        }
    },
    intents: [
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "👨🏻‍🦰 I want an agent",
            "answer": "We are looking for an operator.. \\agent",
            "intent_display_name": "agent_handoff",
            "language": "en",
            "form": {
                "cancelCommands": [
                    "Cancel"
                ],
                "cancelReply": "Form canceled",
                "id": 1,
                "name": "Base",
                "fields": [
                    {
                        "name": "userFullname",
                        "type": "text",
                        "label": "What is your name?",
                        "regex": "/^.{1,}$/"
                    },
                    {
                        "name": "userEmail",
                        "type": "text",
                        "regex": "/^.{1,}$/",
                        "label": "Hi ${userFullname}. Just one last question. What's your business email? 🙂",
                        "errorLabel": "${userFullname} this email address is invalid\n\nCan you insert a correct email address?"
                    }
                ]
            }
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "Close\nResolved",
            "answer": "\\close",
            "intent_display_name": "2SN1EO",
            "language": "en"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "defaultFallback",
            "answer": "Could you please rephrase the question? Use short sentences and send it in just one message.\n\nAs an alternative you can go back to the Main Menu👇🏼\n* ↩︎ Main Menu tdAction:start",
            "intent_display_name": "defaultFallback",
            "language": "en"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "\\start",
            "answer": "Hello 👋. My name is Dean. Lovely of you to get in touch!\nMy only purpose in life is to help you navigate the frustrating waters of having to decide what to have for dinner.\n\nYet again. \n\nAs a proud gourmet and wine connoisseur, I'll take the freedom to give you some interesting suggestions.\n\nChoose one of the below for a juicy description.\n* 🍕The most ordered type of pizza\n* 👌Chef's favourite\n* 🍣The most highly rated sushi \n* 🍹Cocktail of the month\n* 🍻Oktoberfest specials\n* 🕹️ Or play a game while waiting",
            "intent_display_name": "start",
            "language": "en"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "What can you do?\nWho are you?",
            "answer": "Hi, I'm Dean 🤖\n\nYou can find more about me [here](https://tiledesk.com/chatbot-for-customer-service)\ntdImage:https://console.tiledesk.com/assets/images/tily-welcomebot.gif\n* ↩︎ Start over tdAction:start",
            "intent_display_name": "7jLAZf",
            "language": "en"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "Sample Action",
            "answer": "Hello 👋 Would you like to take a closer look at our offer?\n* Yes, please tdAction:yes_action\n* No tdAction:no_action",
            "intent_display_name": "action1",
            "language": "en"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "Back to start",
            "answer": "Choose one of the below for a juicy description.\n* 🍕The most ordered type of pizza\n* 👌Chef's favourite\n* 🍣The most highly rated sushi\n* 🍹Cocktail of the month\n* 🍻Oktoberfest specials",
            "language": "en",
            "intent_display_name": "back"
        },
        {
            "webhook_enabled": false,
            "enabled": true,
            "question": "🍹Cocktail of the month",
            "answer": "Looks like you may need a designated driver with this one...\ntdImage:https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/cosmopolitan-1592951320.jpg\n* Back to start",
            "language": "en",
            "intent_display_name": "booze"
        }
    ]
}

const empty_chatbot_mock = {
    webhook_enabled: false,
    type: 'tilebot',
    secret: '0896478d-8eb3-4240-a6eb-cf2ea27b1a8e',
    language: 'en',
    public: false,
    _id: '638db4d551144cfc72231bfd',
    name: 'Dean for Quick Replies',
    description: "This chatbot can recognize customers' purpose, context, and content. Then Providing some buttons as quick replies",
    id_project: '6321b12a30e19d61d65ff080',
    trashed: false,
    createdBy: '6321b12930e19d61d65ff045',
    createdAt: '2022-12-05T09:07:33.722Z',
    updatedAt: '2022-12-05T09:07:33.722Z',
    __v: 0
}

const import_faqs_res_mock = {
    success: true,
    msg: "Intents imported successfully"
}

module.exports = { existing_chatbot_mock, empty_chatbot_mock, import_faqs_res_mock };