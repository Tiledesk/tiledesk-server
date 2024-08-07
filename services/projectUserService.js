'use strict';

var Project = require("../models/project");
var Project_user = require("../models/project_user");
var mongoose = require('mongoose');
var User = require('../models/user');
var winston = require('../config/winston');
var pendinginvitation = require("../services/pendingInvitationService");

class ProjectUserService {

    checkAgentsAvailablesWithSmartAssignment(project, available_agents) {

        let max_assigned_chat;
        let available_agents_request = [];

        if (project && project.settings && project.settings.chat_limit_on && project.settings.max_agent_assigned_chat) {
            max_assigned_chat = project.settings.max_agent_assigned_chat;
            winston.verbose('[ProjectUserService] max_agent_assigned_chat: ' + max_assigned_chat);
        } else {
            winston.verbose('[ProjectUserService] chat_limit_on or max_agent_assigned_chat is undefined');
            return available_agents
        }

        if (available_agents.length == 0) {
            return available_agents_request;
        }

        for (const aa of available_agents) {
            let max_assigned_chat_specific_user = max_assigned_chat;
            if (aa.max_assigned_chat && aa.max_assigned_chat != -1) {
                max_assigned_chat_specific_user = aa.max_assigned_chat;
            }
            winston.verbose("[ProjectUserService] max_assigned_chat_specific_user " + max_assigned_chat_specific_user);

            if (aa.number_assigned_requests < max_assigned_chat_specific_user) {
                available_agents_request.push(aa);
            }
        }

        return available_agents_request;

    }

}
var projectUserService = new ProjectUserService();


module.exports = projectUserService;
