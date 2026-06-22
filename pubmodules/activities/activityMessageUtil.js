'use strict';

function targetUserLabel(activity) {
  const user = activity &&
    activity.target &&
    activity.target.object &&
    activity.target.object.id_user;

  if (!user) {
    return 'unknown user';
  }

  const firstname = user.firstname || '';
  const lastname = user.lastname || '';
  const fullname = (firstname + ' ' + lastname).trim();
  if (fullname) {
    return fullname;
  }

  return String(user._id || user.id || 'unknown user');
}

function actorLabel(activity) {
  const actor = activity && activity.actor;
  if (!actor) {
    return 'Someone';
  }
  if (actor.type === 'system') {
    return 'System';
  }
  return actor.name || actor.id || 'Someone';
}

function requestLabel(activity) {
  const request = activity && activity.target && activity.target.object;
  if (request && request.request_id) {
    return request.request_id;
  }
  if (activity && activity.target && activity.target.id) {
    return String(activity.target.id);
  }
  return 'conversation';
}

function resolveParticipantLabel(activity, participantId) {
  if (!participantId) {
    return 'unknown agent';
  }

  const agents = activity &&
    activity.target &&
    activity.target.object &&
    activity.target.object.participatingAgents;

  if (Array.isArray(agents)) {
    for (const agent of agents) {
      const user = agent.id_user || agent;
      const userId = user._id || user.id || user;
      if (String(userId) === String(participantId)) {
        const firstname = user.firstname || '';
        const lastname = user.lastname || '';
        const fullname = (firstname + ' ' + lastname).trim();
        if (fullname) {
          return fullname;
        }
      }
    }
  }

  return String(participantId);
}

function buildDefaultActivityMessage(activity) {
  if (!activity || !activity.verb) {
    return null;
  }

  const actionObj = activity.actionObj || {};
  const actor = actorLabel(activity);
  const conversation = requestLabel(activity);
  const assignee = resolveParticipantLabel(activity, actionObj.assigneeId);
  const source = actionObj.source || 'unknown';

  switch (activity.verb) {
    case 'REQUEST_ASSIGNED_AUTO':
      if (activity.actor && activity.actor.type === 'system') {
        return 'System automatically assigned conversation ' + conversation +
          ' to ' + assignee + ' (source: ' + source + ')';
      }
      return actor + ' triggered automatic assignment of conversation ' + conversation +
        ' to ' + assignee + ' (source: ' + source + ')';

    case 'REQUEST_ASSIGNED_SELF':
      return actor + ' joined conversation ' + conversation + ' (source: ' + source + ')';

    case 'REQUEST_ASSIGNED_MANUAL': {
      let message = actor + ' manually assigned conversation ' + conversation +
        ' to ' + assignee + ' (source: ' + source + ')';
      if (actionObj.previousAssigneeId) {
        const previous = resolveParticipantLabel(activity, actionObj.previousAssigneeId);
        message += ' (replaced ' + previous + ')';
      }
      return message;
    }

    case 'REQUEST_UNASSIGNED':
      return actor + ' unassigned ' + assignee + ' from conversation ' + conversation +
        ' (source: ' + source + ')';

    case 'PROJECT_USER_AVAILABILITY_SELF': {
      const targetUser = targetUserLabel(activity);
      const previousStatus = actionObj.previousStatus || 'unknown';
      const newStatus = actionObj.newStatus || 'unknown';
      return targetUser + ' changed availability status from ' + previousStatus + ' to ' + newStatus;
    }

    case 'PROJECT_USER_AVAILABILITY_SYSTEM': {
      const targetUser = targetUserLabel(activity);
      const newStatus = actionObj.newStatus || 'unknown';
      const resolvedSource = source === 'subscription' ? 'system' : source;
      return targetUser + ' availability status was changed to ' + newStatus + ' by ' + resolvedSource;
    }

    default:
      return null;
  }
}

function enrichActivityWithMessage(activity) {
  const message = buildDefaultActivityMessage(activity);
  if (!message) {
    return activity;
  }
  return Object.assign({}, activity, { message: message });
}

module.exports = {
  actorLabel,
  targetUserLabel,
  requestLabel,
  resolveParticipantLabel,
  buildDefaultActivityMessage,
  enrichActivityWithMessage
};
