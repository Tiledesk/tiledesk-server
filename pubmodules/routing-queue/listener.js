const departmentEvent = require('../../event/departmentEvent');
var Request = require('../../models/request');
var winston = require('../../config/winston');

const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 1;


class Listener {

  constructor() {
    this.enabled = true;
    if (process.env.ROUTE_QUEUE_ENABLED == "false" || process.env.ROUTE_QUEUE_ENABLED == false) {
      this.enabled = false;
    }
    winston.debug("Listener Enabled: ", this.enabled);

  }

  nextOperator(array = [], index = 0) {
    if (!Array.isArray(array)) {
        throw new TypeError('Expected an array');
    }
    if (array.length === 0) {
        return undefined;
    }
    return array[(index + 1) % array.length];
  }

  isSmartAssignmentActive(project) {
    if (project.settings?.chat_limit_on && project.settings?.max_agent_assigned_chat) {
      return true;
    } else {
      return false;
    }
  }


  listen() {

    if (!this.enabled) {
      return winston.info("Route queue Listener disabled");
    }

    departmentEvent.on('operator.select.base2', async (res) => {

      const operatorsResult = res.result;
      winston.debug('(Listener) operator.select.base2 operatorsResult', operatorsResult);

      if (res.disableWebHookCall === true) {
        winston.debug("(Listener) operator.select.base2 disableWebHookCall: ", res.disableWebHookCall);
        return res.resolve(operatorsResult);
      }

      const project = operatorsResult.project;

      if (!this.isSmartAssignmentActive(project)) {
        winston.debug("Listener) Smart Assignment not active, calling next event");
        return departmentEvent.callNextEvent('operator.select', res);
      }

      const max_agent_assigned_chat = project.settings.max_agent_assigned_chat;

      if (operatorsResult?.available_agents && operatorsResult.available_agents.length > 0) {
        operatorsResult.available_agents_request = operatorsResult.available_agents
          .map(agent => ({
            project_user: agent,
            openRequestsCount: agent.number_assigned_requests ?? 0
          })) ?? [];
      }

      
      let available_agents_not_busy = [];
      if (operatorsResult?.available_agents_request?.length > 0) {
        for (const agent of operatorsResult.available_agents_request) {

          const maxAssignedchatForUser =
            agent.project_user.max_assigned_chat !== -1
              ? agent.project_user.max_assigned_chat
              : max_agent_assigned_chat;

          winston.debug("(Listener) maxAssignedchatForUser: " + maxAssignedchatForUser);

          if (agent.openRequestsCount < maxAssignedchatForUser) {
            available_agents_not_busy.push(agent.project_user);
          }
        }
      } else {
        winston.debug("(Listener) available_agents_request not defined");
      }
      
      // Logic to avoid reassigning to the same user that already abandoned the request
      const requestAttributes = res.context?.request?.attributes;
      winston.debug("(Listener) Request Attributes: ", requestAttributes);
      
      if (requestAttributes && requestAttributes.abandoned_by_project_users) {

        let abandoned_by_project_users_array = Object.keys(requestAttributes.abandoned_by_project_users);
        if (abandoned_by_project_users_array.length > 0) {
          winston.debug("(Listener) Request abandoned by project users array: ", abandoned_by_project_users_array);

          const underCapacityAgents = available_agents_not_busy.slice();

          available_agents_not_busy = available_agents_not_busy.filter(agent => !abandoned_by_project_users_array.includes(agent._id.toString()))

          if (available_agents_not_busy.length === 0 && underCapacityAgents.length > 0) {
            // Agents with free capacity have all abandoned this request — exhausted round.
            winston.debug("(Listener) All under-capacity agents have abandoned; retries:", res.context.request.attributes.retries);
            res.context.request.attributes.retries = res.context.request.attributes.retries ?? 0;

            if (res.context.request.attributes.retries < MAX_RETRIES) {
              res.context.request.attributes.retries++;
            } else {
              res.context.request.attributes.fully_abandoned = true;
            }
          } else if (available_agents_not_busy.length === 0 && underCapacityAgents.length === 0) {
            // Remaining agents are at capacity — wait for the next poll, do not count as exhausted.
            winston.debug("(Listener) All agents at capacity; skipping retries increment");
          }
        }
      }

      winston.debug("(Listener) available_agents_not_busy: ", available_agents_not_busy);

      const lastOperatorId = operatorsResult.lastOperatorId;
      const lastOperatorIndex = available_agents_not_busy.findIndex(projectUser => projectUser.id_user.toString() === lastOperatorId);
      winston.debug("(Listener) lastOperatorIndex: " + lastOperatorIndex);

      const nextOperator = this.nextOperator(available_agents_not_busy, lastOperatorIndex);
      
      let nextOperatorId;
      if (nextOperator && nextOperator.id_user) {
        nextOperatorId = nextOperator.id_user;
        winston.verbose("(Listener) nextOperatorId: " + nextOperatorId);
        operatorsResult.operators = [{ id_user: nextOperatorId }];
      } else {
        winston.debug("(Listener) nextOperator is not defined");
        operatorsResult.operators = [];
      }

      return departmentEvent.callNextEvent('operator.select', res);
    });
  }

}

var listener = new Listener();
module.exports = listener;