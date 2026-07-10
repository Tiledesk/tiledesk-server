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

function inviteTargetLabel(activity) {
  const target = activity && activity.target;
  if (!target) {
    return 'unknown user';
  }

  if (target.type === 'pendinginvitation') {
    const pending = target.object || {};
    return pending.email || (activity.actionObj && activity.actionObj.email) || 'unknown user';
  }

  const user = target.object && target.object.id_user;
  if (user) {
    const firstname = user.firstname || '';
    const lastname = user.lastname || '';
    const fullname = (firstname + ' ' + lastname).trim();
    if (fullname) {
      return fullname;
    }
    return user.email || 'unknown user';
  }

  return (activity.actionObj && activity.actionObj.email) || 'unknown user';
}

function inviteEmailLabel(activity) {
  const actionObj = activity && activity.actionObj || {};
  if (actionObj.email) {
    return actionObj.email;
  }

  const target = activity && activity.target;
  if (target && target.type === 'pendinginvitation' && target.object && target.object.email) {
    return target.object.email;
  }

  const user = target && target.object && target.object.id_user;
  if (user && user.email) {
    return user.email;
  }

  return '';
}

function resolveAssigneeLabel(activity) {
  const actionObj = activity && activity.actionObj || {};
  if (actionObj.assigneeName) {
    return actionObj.assigneeName;
  }
  if (actionObj.assigneeType === 'department') {
    return actionObj.assigneeId || 'department';
  }
  if (actionObj.assigneeType === 'bot') {
    return actionObj.assigneeId || 'chatbot';
  }
  return resolveParticipantLabel(activity, actionObj.assigneeId);
}

function namespaceLabel(activity) {
  const object = activity && activity.target && activity.target.object;
  if (object && object.name) {
    return object.name;
  }
  if (activity && activity.actionObj && activity.actionObj.namespaceName) {
    return activity.actionObj.namespaceName;
  }
  if (activity && activity.target && activity.target.id) {
    return String(activity.target.id);
  }
  return 'namespace';
}

function chatbotLabel(activity) {
  const object = activity && activity.target && activity.target.object;
  if (object && object.name) {
    return object.name;
  }
  if (activity && activity.actionObj && activity.actionObj.name) {
    return activity.actionObj.name;
  }
  return 'chatbot';
}

function contentAddTypeLabel(contentAddType) {
  switch (contentAddType) {
    case 'content':
      return 'content';
    case 'url_list':
      return 'URL list';
    case 'csv':
      return 'CSV file';
    case 'sitemap':
      return 'sitemap';
    default:
      return contentAddType || 'content';
  }
}

function kbContentLabel(activity) {
  const actionObj = (activity && activity.actionObj) || {};
  const object = activity && activity.target && activity.target.object;
  if (actionObj.source) {
    return actionObj.source;
  }
  if (actionObj.name) {
    return actionObj.name;
  }
  if (object && object.source) {
    return object.source;
  }
  if (object && object.name) {
    return object.name;
  }
  if (activity && activity.target && activity.target.id) {
    return String(activity.target.id);
  }
  return 'content';
}

function buildDefaultActivityMessage(activity) {
  if (!activity || !activity.verb) {
    return null;
  }

  const actionObj = activity.actionObj || {};
  const actor = actorLabel(activity);
  const conversation = requestLabel(activity);
  const assignee = resolveAssigneeLabel(activity);
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
      const assigneeType = actionObj.assigneeType || 'user';
      if (assigneeType === 'bot') {
        let message = actor + ' reassigned conversation ' + conversation +
          ' to chatbot ' + assignee + ' (source: ' + source + ')';
        if (actionObj.previousAssigneeId) {
          const previous = resolveParticipantLabel(activity, actionObj.previousAssigneeId);
          message += ' (replaced ' + previous + ')';
        }
        return message;
      }
      if (assigneeType === 'department') {
        let message = actor + ' reassigned conversation ' + conversation +
          ' to department ' + assignee + ' (source: ' + source + ')';
        if (actionObj.previousAssigneeId) {
          const previous = resolveParticipantLabel(activity, actionObj.previousAssigneeId);
          message += ' (replaced ' + previous + ')';
        }
        return message;
      }
      let message = actor + ' manually assigned conversation ' + conversation +
        ' to ' + assignee + ' (source: ' + source + ')';
      if (actionObj.previousAssigneeId) {
        const previous = resolveParticipantLabel(activity, actionObj.previousAssigneeId);
        message += ' (replaced ' + previous + ')';
      }
      return message;
    }

    case 'REQUEST_UNASSIGNED':
      if (actionObj.source === 'subscription') {
        return 'System unassigned ' + assignee + ' from conversation ' + conversation +
          ' (source: subscription)';
      }
      return actor + ' unassigned ' + assignee + ' from conversation ' + conversation +
        ' (source: ' + source + ')';

    case 'LEAVE_CONVERSATION':
      return actor + ' left conversation ' + conversation + ' (source: ' + source + ')';

    case 'PROJECT_USER_AVAILABILITY_SELF': {
      const targetUser = targetUserLabel(activity);
      const newStatus = actionObj.newStatus || 'unknown';
      return targetUser + ' changed availability status to ' + newStatus;
    }

    case 'PROJECT_USER_AVAILABILITY_SYSTEM': {
      const targetUser = targetUserLabel(activity);
      const newStatus = actionObj.newStatus || 'unknown';
      return targetUser + ' availability status was changed to ' + newStatus + ' by the system';
    }

    case 'PROJECT_USER_INVITE': {
      const target = inviteTargetLabel(activity);
      const email = inviteEmailLabel(activity);
      const role = actionObj.role || 'agent';
      const emailPart = email && target !== email ? ' (' + email + ')' : '';
      return actor + ' invited ' + target + emailPart + ' to take on the role of ' + role;
    }

    case 'PROJECT_USER_DELETE':
      return actor + ' removed ' + targetUserLabel(activity) + ' from the project';

    case 'FAQ_KB_CREATE':
      return actor + ' created chatbot ' + chatbotLabel(activity);

    case 'FAQ_KB_DELETE':
      return actor + ' deleted chatbot ' + chatbotLabel(activity);

    case 'FAQ_KB_PUBLISH':
      return actor + ' published chatbot ' + chatbotLabel(activity);

    case 'KB_NAMESPACE_CREATE':
      return actor + ' created namespace ' + namespaceLabel(activity);

    case 'KB_NAMESPACE_DELETE':
      return actor + ' deleted namespace ' + namespaceLabel(activity);

    case 'KB_CONTENTS_ADD': {
      const namespace = namespaceLabel(activity);
      const addType = contentAddTypeLabel(actionObj.contentAddType);
      const count = actionObj.count;
      if (count && count > 1) {
        return actor + ' added ' + count + ' items (' + addType + ') to namespace ' + namespace;
      }
      if (actionObj.source) {
        return actor + ' added ' + addType + ' to namespace ' + namespace + ' (' + actionObj.source + ')';
      }
      return actor + ' added ' + addType + ' to namespace ' + namespace;
    }

    case 'KB_CONTENTS_DELETE':
      return actor + ' deleted all contents from namespace ' + namespaceLabel(activity);

    case 'KB_CONTENT_DELETE':
      return actor + ' deleted content ' + kbContentLabel(activity) +
        ' from namespace ' + namespaceLabel(activity);

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
  namespaceLabel,
  chatbotLabel,
  kbContentLabel,
  resolveParticipantLabel,
  buildDefaultActivityMessage,
  enrichActivityWithMessage
};
