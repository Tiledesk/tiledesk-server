'use strict';

const activityActorUtil = require('../../utils/activityActorUtil');

function toPlain(doc) {
  if (!doc) {
    return doc;
  }
  if (doc.toObject) {
    return doc.toObject();
  }
  return doc;
}

function resolveUserFromRequest(request, userId) {
  const req = toPlain(request);
  const agents = req && req.participatingAgents;
  if (!Array.isArray(agents) || !userId) {
    return null;
  }

  for (const agent of agents) {
    const id = agent._id || agent.id;
    if (id && String(id) === String(userId)) {
      return toPlain(agent);
    }
  }

  return null;
}

function buildUserStub(userId, request, assigneeName) {
  const id = String(userId);
  const user = resolveUserFromRequest(request, id);
  const id_user = { _id: id };

  if (user) {
    if (user.firstname) {
      id_user.firstname = user.firstname;
    }
    if (user.lastname) {
      id_user.lastname = user.lastname;
    }
    if (user.email) {
      id_user.email = user.email;
    }
  } else if (assigneeName) {
    const parts = String(assigneeName).trim().split(/\s+/);
    if (parts.length === 1) {
      id_user.firstname = parts[0];
    } else {
      id_user.firstname = parts[0];
      id_user.lastname = parts.slice(1).join(' ');
    }
  }

  return {
    type: 'user',
    id: id,
    object: { id_user: id_user }
  };
}

function buildRequestTarget(request) {
  const req = toPlain(request);
  return {
    type: 'request',
    id: activityActorUtil.resolveId(req && req._id),
    object: req
  };
}

function buildConversationActionObj(request) {
  const req = toPlain(request);
  if (!req) {
    return {};
  }

  const conversation = {
    _id: activityActorUtil.resolveId(req._id),
    request_id: req.request_id,
    subject: req.subject,
    first_text: req.first_text
  };

  if (Array.isArray(req.participatingAgents) && req.participatingAgents.length > 0) {
    conversation.participatingAgents = req.participatingAgents.map(function (agent) {
      return toPlain(agent);
    });
  }

  return { conversation: conversation };
}

function isHumanAssigneeTarget(data, verb) {
  const assigneeType = (data && data.assigneeType) || 'user';
  if (assigneeType !== 'user') {
    return false;
  }
  if (verb === 'REQUEST_ASSIGNED_SELF') {
    return false;
  }
  if (!data || !data.assigneeId) {
    return false;
  }
  return true;
}

function buildAssignmentActionObj(data, reconciled) {
  const actionObj = Object.assign(
    { source: reconciled.source },
    buildConversationActionObj(data.request)
  );

  const assigneeType = data.assigneeType || 'user';
  if (assigneeType !== 'user') {
    actionObj.assigneeId = data.assigneeId;
    actionObj.assigneeType = assigneeType;
    if (data.assigneeName) {
      actionObj.assigneeName = data.assigneeName;
    }
  }

  if (data.previousAssigneeId) {
    actionObj.previousAssigneeId = data.previousAssigneeId;
  }

  const removed = data.removedParticipants;
  if (Array.isArray(removed) && removed.length > 0) {
    actionObj.removedParticipants = removed;
  }

  return actionObj;
}

function buildAssignmentTarget(data, verb) {
  const assigneeType = (data && data.assigneeType) || 'user';

  if (isHumanAssigneeTarget(data, verb)) {
    return buildUserStub(data.assigneeId, data.request, data.assigneeName);
  }

  if (assigneeType === 'bot') {
    return {
      type: 'bot',
      id: String(data.assigneeId),
      object: {
        _id: data.assigneeId,
        name: data.assigneeName
      }
    };
  }

  if (assigneeType === 'department') {
    return {
      type: 'department',
      id: String(data.assigneeId),
      object: {
        _id: data.assigneeId,
        name: data.assigneeName
      }
    };
  }

  return buildRequestTarget(data.request);
}

module.exports = {
  buildUserStub,
  buildRequestTarget,
  buildConversationActionObj,
  buildAssignmentActionObj,
  buildAssignmentTarget,
  isHumanAssigneeTarget
};
