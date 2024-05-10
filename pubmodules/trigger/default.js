var Trigger = require('./models/trigger');


var defTrigger = {};
var defTriggerObj = {};
       


var tNewConversationObj = {
name: 'New Conversation',
description: 'Create a temporary chat when new conversation button is pressed.',
trigger: {key:'event.emit',name:'Event emit event', description: 'Standard event emit event'},
conditions:{ all: [{key:'event.name',fact: 'json',path: 'name', operator:'equal', value: 'new_conversation'}]},
actions: [{key:'request.create', parameters: {departmentid: 'default', text:"welcome:tdk_req_status_hidden"}}], 
enabled: true,
code: 's_new_conversation_01',
type: 'internal',
version: 1,
createdBy: 'system',
updatedBy: 'system'
};

var tNewConversation = new Trigger(tNewConversationObj);          

defTrigger['s_new_conversation_01'] = tNewConversation;
defTriggerObj['s_new_conversation_01'] = tNewConversationObj;





var tWelcomeOnlineObj = 
{
    name: 'Online Welcome Greeting',
    description: 'Send a welcome message if there are online agents to the visitor that create a chat.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false},
                    {key:'request.snapshot.availableAgentsCount',fact: 'json',path: 'snapshot.availableAgentsCount', operator:'greaterThan', value: 0},
                    {key:'request.isOpen',fact: 'json',path: 'isOpen', operator:'equal', value: true},
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'welcome'},
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50}
                ]},
    actions: [{key:'message.send', parameters: {text:"${LABEL_FIRST_MSG}"}}], 
    enabled:true,
    code: 's_online_welcome_01',
    type: 'internal',
    version: 3,
    createdBy: 'system',
    updatedBy: 'system'
}

var tWelcomeOnline = new Trigger(tWelcomeOnlineObj);          

defTrigger['s_online_welcome_01'] = tWelcomeOnline;
defTriggerObj['s_online_welcome_01'] = tWelcomeOnlineObj




var tWelcomeOfflineObj = {
    name: 'Offline Welcome Greeting',
    description: 'Send a welcome message if there aren\'t online agents to the visitor that create a chat.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false},
                    {key:'request.snapshot.availableAgentsCount',fact: 'json',path: 'snapshot.availableAgentsCount', operator:'equal', value: 0},
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50},
                    {key:'request.isOpen',fact: 'json',path: 'isOpen', operator:'equal', value: true},
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'welcome'}
                ]},
    actions: [{key:'message.send', parameters: {text:"${LABEL_FIRST_MSG_NO_AGENTS}"}}], 
    enabled:true,
    code: 's_offline_welcome_01',
    type: 'internal',
    version: 3,
    createdBy: 'system',
    updatedBy: 'system'
}
var tWelcomeOffline = new Trigger(tWelcomeOfflineObj);      

defTrigger['s_offline_welcome_01'] = tWelcomeOffline;
defTriggerObj['s_offline_welcome_01'] = tWelcomeOfflineObj;



var tWelcomeClosedOperatingHoursObj = {
    name: 'Office Closed Notice',
    description: 'Send an office closed message if a visitor asks for support outside of the operating hours.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false},
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50},
                    {key:'request.isOpen',fact: 'json',path: 'isOpen', operator:'equal', value: false},
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'welcome'}
                ]},
    actions: [{key:'message.send', parameters: {text:"${LABEL_FIRST_MSG_OPERATING_HOURS_CLOSED}"}}], 
    enabled:true,
    code: 's_closed_operating_hours_01',
    type: 'internal',
    version: 2,
    createdBy: 'system',
    updatedBy: 'system'
}
var tWelcomeClosedOperatingHours = new Trigger(tWelcomeClosedOperatingHoursObj);      

defTrigger['s_closed_operating_hours_01'] = tWelcomeClosedOperatingHours;
defTriggerObj['s_closed_operating_hours_01'] = tWelcomeClosedOperatingHoursObj;






var tInviteBotObj = {
    name: 'Invite Bot',
    description: 'Invite if available the department bot to the temporary chat and start it.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50},
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: true},
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'welcome'}
                ]},
    actions: [{key:'request.department.bot.launch', parameters: {text:"/start"}}], 
    enabled:true,
    code: 's_invite_bot_01',
    type: 'internal',
    version: 2,
    createdBy: 'system',
    updatedBy: 'system'
}

var tInviteBot = new Trigger(tInviteBotObj);          

defTrigger['s_invite_bot_01'] = tInviteBot;
defTriggerObj['s_invite_bot_01'] = tInviteBotObj;





var tCheckoutPageObj = {
    name: 'Checkout Page',
    description: 'Reduce cart abandonment by engaging customer that are on the checkout page.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:"request.sourcePageUrl", fact:"json", path:"sourcePage", operator:"in", value:"/checkout.html"},
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false},
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50}
                ]},
    actions: [{key:'message.send', parameters: {text:"Hey, do you need help to complete the checkout?"}}], 
    enabled:false,
    code: 's_checkout_page_01',
    version: 1,
    createdBy: 'system',
    updatedBy: 'system'
}

var tCheckoutPage = new Trigger(tCheckoutPageObj);          

defTrigger['s_checkout_page_01'] = tCheckoutPage;
defTriggerObj['s_checkout_page_01'] = tCheckoutPageObj;


var tAuthStateChangeProactiveGreetingObj = {
    name: 'New visitor login',
    description: 'Create a temporary chat when a new visitor signin.',
    trigger: {key:'event.emit',name:'Event emit event', description: 'Standard event emit event'},
    conditions:{ all: [
                        {key:'event.name',fact: 'json',path: 'name', operator:'equal', value: 'auth_state_changed'},
                        {key: 'event.attributes.code', fact: 'json', path: 'attributes.event', operator:'equal', value : 201}
                    ]},

    actions: [{key:'request.create', parameters: {departmentid: 'default', text:"callout:tdk_req_status_hidden"}}], 
    enabled: true,
    code: 's_new_login_01',
    type: 'internal',
    version: 1,
    createdBy: 'system',
    updatedBy: 'system'
    };
    
    var tAuthStateChangeProactiveGreeting = new Trigger(tAuthStateChangeProactiveGreetingObj);          
    
    defTrigger['s_new_login_01'] = tAuthStateChangeProactiveGreeting;
    defTriggerObj['s_new_login_01'] = tAuthStateChangeProactiveGreetingObj;



var tInviteProactiveGreetingBotObj = {
    name: 'Invite Proactive Greeting Bot',
    description: 'Invite if available the department bot to proactively greet the temporary chat and start it.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50},
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: true},
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'callout'}
                ]},
    actions: [{key:'request.department.bot.launch', parameters: {text:"/start"}}], 
    enabled:true,
    code: 's_invite_proactive_greeting_bot_01',
    type: 'internal',
    version: 2,
    createdBy: 'system',
    updatedBy: 'system'
}

var tInviteProactiveGreetingBot = new Trigger(tInviteProactiveGreetingBotObj);          

defTrigger['s_invite_proactive_greeting_bot_01'] = tInviteProactiveGreetingBot;
defTriggerObj['s_invite_proactive_greeting_bot_01'] = tInviteProactiveGreetingBotObj;





var tProactiveGreetingMessageObj = 
{
    name: 'Proactive Greeting',
    description: 'Send a proactive message when a new user signin.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false},                  
                    {key:'request.first_text',fact: 'json',path: 'first_text', operator:'equal', value: 'callout'},
                    {key:'request.statusRequestStatus',fact: 'json',path: 'status', operator:'equal', value: 50}
                ]},
    actions: [{key:'message.send', parameters: {text:"${WELLCOME_MSG}"}}],  
    enabled:true,
    code: 's_proactivegreeting_message_01',
    type: 'internal',
    version: 1,
    createdBy: 'system',
    updatedBy: 'system'
}

var tProactiveGreetingMessage = new Trigger(tProactiveGreetingMessageObj);          

defTrigger['s_proactivegreeting_message_01'] = tProactiveGreetingMessage;
defTriggerObj['s_proactivegreeting_message_01'] = tProactiveGreetingMessageObj







var tTicketingTakingObj = 
{
    name: 'Ticketing Taking',
    description: 'Send a taking message when a new ticket is created.',
    trigger: {key:'request.create',name:'Request create event', description: 'Standard request create event'},
    conditions:{ all: [
                    {key:'request.channel.name',fact: 'json',path: 'channel.name', operator:'equal', value: 'email'},
                    {key:'request.departmentHasBot',fact: 'json',path: 'department.hasBot', operator:'equal', value: false}                    
                ]},
    actions: [{key:'message.send', parameters: {text:"${TICKET_TAKING}"}}],  
    enabled:true,
    code: 's_ticketing_taking_01',
    type: 'internal',
    version: 1,
    createdBy: 'system',
    updatedBy: 'system'
}

var tTicketingTaking = new Trigger(tTicketingTakingObj);          

defTrigger['s_ticketing_taking_01'] = tTicketingTaking;
defTriggerObj['s_ticketing_taking_01'] = tTicketingTakingObj


module.exports = {defTrigger:defTrigger, defTriggerObj: defTriggerObj};
