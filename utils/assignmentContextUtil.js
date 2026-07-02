'use strict';

const projectUserUpdateContextUtil = require('./projectUserUpdateContextUtil');

function systemActor() {
  return { type: 'system', id: 'system', name: 'System' };
}

function actorFromUser(user) {
  if (!user) {
    return systemActor();
  }
  if (projectUserUpdateContextUtil.isSubscriptionActor(user)) {
    return systemActor();
  }
  return {
    type: 'user',
    id: String(user.id || user._id),
    name: user.fullName || user.fullname || projectUserUpdateContextUtil.userDisplayName(user) || undefined
  };
}

function assignmentActorContext(req, defaultSource) {
  const source = defaultSource || 'api';

  if (!req || !req.user) {
    return { actor: systemActor(), source: 'system' };
  }

  if (projectUserUpdateContextUtil.isSubscriptionActor(req.user)) {
    return { actor: systemActor(), source: 'subscription' };
  }

  return { actor: actorFromUser(req.user), source: source };
}

function reconcileAssignmentPayload(data) {
  const source = (data && data.source) || 'system';
  let actor = (data && data.actor) || systemActor();

  if (source === 'subscription' || actor.type === 'system') {
    return {
      actor: systemActor(),
      source: source === 'subscription' ? 'subscription' : source
    };
  }

  return { actor: actor, source: source };
}

function isHumanParticipant(participantId) {
  return participantId && !String(participantId).startsWith('bot_');
}

function filterHumanParticipants(participantIds) {
  return (participantIds || []).filter(isHumanParticipant);
}

function isBotParticipant(participantId) {
  return participantId && String(participantId).startsWith('bot_');
}

function filterBotParticipants(participantIds) {
  return (participantIds || []).filter(isBotParticipant);
}

function botIdFromParticipant(participantId) {
  return String(participantId).replace('bot_', '');
}

function resolveBotName(requestComplete, botParticipantOrId) {
  const botId = isBotParticipant(botParticipantOrId)
    ? botIdFromParticipant(botParticipantOrId)
    : String(botParticipantOrId);
  const bots = requestComplete && requestComplete.participatingBots;
  if (Array.isArray(bots)) {
    for (const bot of bots) {
      const id = String(bot._id || bot.id);
      if (id === botId) {
        return bot.name || id;
      }
    }
  }
  return botId;
}

function resolveDepartmentName(requestComplete) {
  const dep = requestComplete && requestComplete.department;
  if (!dep) {
    return undefined;
  }
  if (dep.name) {
    return dep.name;
  }
  return dep._id ? String(dep._id) : undefined;
}

function deriveAssignmentType({ actor, assigneeIds, isUnassign }) {
  if (isUnassign) {
    return 'unassign';
  }

  const humanAssignees = filterHumanParticipants(assigneeIds);
  if (humanAssignees.length === 0) {
    return null;
  }

  if (!actor || actor.type === 'system') {
    return 'auto';
  }

  const assigneeId = String(humanAssignees[0]);
  if (String(actor.id) === assigneeId) {
    return 'self_join';
  }

  return 'manual_reassign';
}

function verbFromAssignmentType(assignmentType) {
  switch (assignmentType) {
    case 'auto':
      return 'REQUEST_ASSIGNED_AUTO';
    case 'self_join':
      return 'REQUEST_ASSIGNED_SELF';
    case 'manual_reassign':
    case 'manual_reassign_bot':
    case 'manual_reassign_department':
      return 'REQUEST_ASSIGNED_MANUAL';
    case 'unassign':
      return 'REQUEST_UNASSIGNED';
    default:
      return null;
  }
}

function buildSetParticipantsOptions(req, participants) {
  const { actor, source } = assignmentActorContext(req, 'api');

  if (!participants || participants.length === 0) {
    return {
      actor,
      source,
      assignmentType: 'unassign'
    };
  }

  const botParticipants = filterBotParticipants(participants);
  const humanParticipants = filterHumanParticipants(participants);

  if (botParticipants.length > 0 && humanParticipants.length === 0) {
    return {
      actor,
      source,
      assignmentType: 'manual_reassign_bot'
    };
  }

  return {
    actor,
    source,
    assignmentType: deriveAssignmentType({
      actor,
      assigneeIds: participants,
      isUnassign: false
    })
  };
}

function buildAddParticipantOptions(req, member) {
  const { actor, source } = assignmentActorContext(req, 'api');

  return {
    actor,
    source,
    assignmentType: deriveAssignmentType({
      actor,
      assigneeIds: [member],
      isUnassign: false
    })
  };
}

function buildRemoveParticipantOptions(req, member) {
  if (!isHumanParticipant(member)) {
    return { trackLeave: false };
  }

  const { actor: reqActor, source } = assignmentActorContext(req, 'api');
  const actor = req && req.user && String(reqActor.id) === String(member)
    ? reqActor
    : { type: 'user', id: String(member), name: String(member) };

  return {
    actor,
    source,
    member,
    trackLeave: true
  };
}

function buildLeaveParticipantOptions(source, member) {
  if (!isHumanParticipant(member)) {
    return { trackLeave: false };
  }

  return {
    actor: { type: 'user', id: String(member), name: String(member) },
    source: source || 'webhook',
    member,
    trackLeave: true
  };
}

function buildAutoRouteOptions(req, source) {
  const ctx = assignmentActorContext(req, source || 'api');
  return {
    actor: ctx.actor,
    source: ctx.source,
    assignmentType: 'auto'
  };
}

function buildDepartmentRouteOptions(req, source) {
  const ctx = assignmentActorContext(req, source || 'api');
  return {
    actor: ctx.actor,
    source: ctx.source,
    assignmentType: 'manual_reassign_department'
  };
}

function buildInternalOptions(source, assignmentType) {
  return {
    actor: systemActor(),
    source: source || 'system',
    assignmentType: assignmentType || 'auto'
  };
}

module.exports = {
  systemActor,
  actorFromUser,
  assignmentActorContext,
  reconcileAssignmentPayload,
  isHumanParticipant,
  filterHumanParticipants,
  isBotParticipant,
  filterBotParticipants,
  botIdFromParticipant,
  resolveBotName,
  resolveDepartmentName,
  deriveAssignmentType,
  verbFromAssignmentType,
  buildSetParticipantsOptions,
  buildAddParticipantOptions,
  buildRemoveParticipantOptions,
  buildLeaveParticipantOptions,
  buildAutoRouteOptions,
  buildDepartmentRouteOptions,
  buildInternalOptions
};
