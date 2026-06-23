'use strict';

function systemActor() {
  return { type: 'system', id: 'system', name: 'System' };
}

function actorFromUser(user) {
  if (!user) {
    return systemActor();
  }
  return {
    type: 'user',
    id: String(user.id || user._id),
    name: user.fullName || user.fullname || undefined
  };
}

function isHumanParticipant(participantId) {
  return participantId && !String(participantId).startsWith('bot_');
}

function filterHumanParticipants(participantIds) {
  return (participantIds || []).filter(isHumanParticipant);
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
      return 'REQUEST_ASSIGNED_MANUAL';
    case 'unassign':
      return 'REQUEST_UNASSIGNED';
    default:
      return null;
  }
}

function buildSetParticipantsOptions(req, participants) {
  const actor = actorFromUser(req && req.user);

  if (!participants || participants.length === 0) {
    return {
      actor,
      source: 'api',
      assignmentType: 'unassign'
    };
  }

  return {
    actor,
    source: 'api',
    assignmentType: deriveAssignmentType({
      actor,
      assigneeIds: participants,
      isUnassign: false
    })
  };
}

function buildAddParticipantOptions(req, member) {
  const actor = actorFromUser(req && req.user);

  return {
    actor,
    source: 'api',
    assignmentType: deriveAssignmentType({
      actor,
      assigneeIds: [member],
      isUnassign: false
    })
  };
}

function buildAutoRouteOptions(req, source) {
  return {
    actor: actorFromUser(req && req.user),
    source: source || 'api',
    assignmentType: 'auto'
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
  isHumanParticipant,
  filterHumanParticipants,
  deriveAssignmentType,
  verbFromAssignmentType,
  buildSetParticipantsOptions,
  buildAddParticipantOptions,
  buildAutoRouteOptions,
  buildInternalOptions
};
