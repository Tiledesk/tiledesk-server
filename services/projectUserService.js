'use strict';

var Project_user = require("../models/project_user");
var winston = require('../config/winston');

var Role = require('../models/role');
var cacheUtil = require('../utils/cacheUtil');
var cacheEnabler = require("../services/cacheEnabler");

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

     async getWithPermissions(id_user, id_project, user_sub) {       
        var project_user = await this.get(id_user, id_project, user_sub);
        winston.debug("getWithPermissions for id_user " + id_user + " project_user ", project_user);

        if (project_user) {
            winston.debug("getWithPermissions project_user role: " + project_user.role);

            var role = await this.getPermissions(project_user.role, id_project);

            if (role) {
                project_user._doc.rolePermissions = role.permissions;   //https://github.com/Automattic/mongoose/issues/4614
                // project_user.set("rolePermissions", role);
            }
            

        }
        
        return project_user;
    }

    async getPermissions(role, id_project) {
         //               var cacheManager = require('../utils/cacheManager');
        //               cacheManager.getClient().get("find in cache")
        let q = Role.findOne({"name":role, "id_project": id_project});

        let cache_key = id_project+":roles:"+role;

        if (cacheEnabler.role) { 
            q.cache(cacheUtil.defaultTTL, cache_key);
            winston.debug("cacheEnabler.role enabled");
        }

        var role = await q.exec();

        if (role) 
            winston.debug("getWithPermissions role ", role.toJSON());

        return role;

    }

    async get(id_user, id_project, user_sub) {
        // JWT_HERE
        var query = { id_project: id_project, id_user: id_user, status: "active"};
        let cache_key = id_project+":project_users:iduser:"+id_user;

        if (user_sub && (user_sub=="userexternal" || user_sub=="guest")) {
            query = { id_project: id_project, uuid_user: id_user, status: "active"};
            cache_key = id_project+":project_users:uuid_user:"+id_user;
        }
        winston.debug("hasRoleOrType query " + JSON.stringify(query));

        let q = Project_user.findOne(query);
        if (cacheEnabler.project_user) { 
            q.cache(cacheUtil.defaultTTL, cache_key);
            winston.debug("cacheEnabler.project_user enabled");
        }
        var project_user = await q.exec();
        winston.debug("ProjectUserUtil project_user", project_user);
       
        return project_user;
    }

}
var projectUserService = new ProjectUserService();


module.exports = projectUserService;
