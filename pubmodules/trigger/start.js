var faqService = require('../../services/faqService');
var Trigger = require('./models/trigger');
var DefaultTrigger = require('./default');
var projectEvent = require('../../event/projectEvent');
var winston = require('../../config/winston');

var rulesTrigger = require('./rulesTrigger');


function saveTrigger(trigger) {
    trigger.save(function (err, savedTrigger) { 
        if (err) {
           return winston.error("Error saving trigger for project with id "+trigger.id_project , err);
        }
        return winston.debug("Trigger saved for project with id "+trigger.id_project, saveTrigger);
    }); 
}
projectEvent.on('project.create', async (project) => {
    setImmediate( async () => {


        
        var botIdentity = await faqService.create("Bot", undefined, project._id, "system", "identity", "An identity bot");
        var botIdentityId = "bot_"+botIdentity.id;
        winston.debug("botIdentityId:"+botIdentityId);


        winston.debug("DefaultTrigger.defTriggerObj.s_new_conversation_01",DefaultTrigger.defTriggerObj.s_new_conversation_01._id);

        let s_new_conversation_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_new_conversation_01);
        s_new_conversation_01.id_project = project._id;
        winston.debug("s_new_conversation_01",s_new_conversation_01);
        let s_new_conversation_01Trigger = new Trigger(s_new_conversation_01);
        saveTrigger(s_new_conversation_01Trigger);



        // let s_proactive_greeting_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_proactive_greeting_01);
        // s_proactive_greeting_01.id_project = project._id;
        // let s_proactive_greeting_01Trigger = new Trigger(s_proactive_greeting_01);
        // saveTrigger(s_proactive_greeting_01Trigger);


        let s_online_welcome_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_online_welcome_01);
        s_online_welcome_01.id_project = project._id;
        s_online_welcome_01.actions[0].parameters.sender = botIdentityId;
        let s_online_welcome_01Trigger = new Trigger(s_online_welcome_01);
        saveTrigger(s_online_welcome_01Trigger);

        let s_offline_welcome_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_offline_welcome_01);
        s_offline_welcome_01.id_project = project._id;
        s_offline_welcome_01.actions[0].parameters.sender = botIdentityId;
        let s_offline_welcome_01Trigger = new Trigger(s_offline_welcome_01);
        saveTrigger(s_offline_welcome_01Trigger);


        let s_closed_operating_hours_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_closed_operating_hours_01);
        s_closed_operating_hours_01.id_project = project._id;
        s_closed_operating_hours_01.actions[0].parameters.sender = botIdentityId;
        let s_closed_operating_hours_01Trigger = new Trigger(s_closed_operating_hours_01);
        saveTrigger(s_closed_operating_hours_01Trigger);


        let s_invite_bot_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_invite_bot_01);
        s_invite_bot_01.id_project = project._id;
        let s_invite_bot_01Trigger = new Trigger(s_invite_bot_01);
        saveTrigger(s_invite_bot_01Trigger);


        let s_checkout_page_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_checkout_page_01);
        s_checkout_page_01.id_project = project._id;
        s_checkout_page_01.actions[0].parameters.sender = botIdentityId;
        let s_checkout_page_01Trigger = new Trigger(s_checkout_page_01);
        saveTrigger(s_checkout_page_01Trigger);


        let s_ticketing_taking_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_ticketing_taking_01);
        s_ticketing_taking_01.id_project = project._id;
        s_ticketing_taking_01.actions[0].parameters.sender = botIdentityId;
        let s_ticketing_taking_01Trigger = new Trigger(s_ticketing_taking_01);
        saveTrigger(s_ticketing_taking_01Trigger);



//DIABLED
/*
        let s_new_login_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_new_login_01);
        s_new_login_01.id_project = project._id;
        let s_new_login_01Trigger = new Trigger(s_new_login_01);
        saveTrigger(s_new_login_01Trigger);

        let s_invite_proactive_greeting_bot_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_invite_proactive_greeting_bot_01);
        s_invite_proactive_greeting_bot_01.id_project = project._id;
        let s_invite_proactive_greeting_bot_01Trigger = new Trigger(s_invite_proactive_greeting_bot_01);
        saveTrigger(s_invite_proactive_greeting_bot_01Trigger);
        
        let s_proactivegreeting_message_01 = Object.assign({}, DefaultTrigger.defTriggerObj.s_proactivegreeting_message_01);
        s_proactivegreeting_message_01.id_project = project._id;
        s_proactivegreeting_message_01.actions[0].parameters.sender = botIdentityId;
        let s_proactivegreeting_message_01Trigger = new Trigger(s_proactivegreeting_message_01);
        saveTrigger(s_proactivegreeting_message_01Trigger);
*/

        
        winston.debug("triggers created for new project");




        // cc

    });
});

rulesTrigger.listen();



