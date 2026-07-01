'use strict';

const User = require('../models/user');
const projectUserUpdateContextUtil = require('./projectUserUpdateContextUtil');

function actorFromReq(req) {
  if (!req || !req.user) {
    return { type: 'system', id: 'system', name: 'System' };
  }
  return projectUserUpdateContextUtil.actorFromPrincipal(req.user);
}

function actorFromUserId(userId) {
  if (!userId) {
    return { type: 'system', id: 'system', name: 'System' };
  }
  const id = String(userId);
  return { type: 'user', id: id, name: id };
}

function resolveId(value) {
  if (!value) {
    return null;
  }
  if (value._id) {
    return String(value._id);
  }
  return String(value);
}

function resolveUserFromParticipatingAgents(agents, userId) {
  if (!Array.isArray(agents) || !userId) {
    return null;
  }

  for (const agent of agents) {
    const id = agent._id || agent.id;
    if (id && String(id) === String(userId)) {
      return agent;
    }
  }

  return null;
}

function resolveUserFromSnapshotAgents(agents, userId) {
  if (!Array.isArray(agents) || !userId) {
    return null;
  }

  for (const projectUser of agents) {
    const user = projectUser.id_user || projectUser;
    const id = (user && (user._id || user.id)) || projectUser._id;
    if (id && String(id) === String(userId)) {
      return user;
    }
  }

  return null;
}

function isSystemClosedBy(closedBy) {
  if (!closedBy) {
    return true;
  }
  const value = String(closedBy).toLowerCase();
  return value === 'system' || value === '_trigger';
}

function actorFromClosedBy(request) {
  if (!request) {
    return { type: 'system', id: 'system', name: 'System' };
  }

  const closedBy = request.closed_by;
  if (isSystemClosedBy(closedBy)) {
    return { type: 'system', id: 'system', name: 'System' };
  }

  const userId = String(closedBy);
  let user = resolveUserFromParticipatingAgents(request.participatingAgents, userId);
  if (!user && request.snapshot) {
    user = resolveUserFromSnapshotAgents(request.snapshot.agents, userId);
  }

  const name = (user && projectUserUpdateContextUtil.userDisplayName(user)) ||
    request.closed_by_name ||
    userId;

  return {
    type: 'user',
    id: userId,
    name: name
  };
}

async function resolveActorFromClosedBy(request) {
  const actor = actorFromClosedBy(request);

  if (actor.type !== 'user' || actor.name !== actor.id) {
    return actor;
  }

  try {
    const user = await User.findById(actor.id).select('firstname lastname email').lean().exec();
    const displayName = user && projectUserUpdateContextUtil.userDisplayName(user);
    if (displayName) {
      return Object.assign({}, actor, { name: displayName });
    }
  } catch (err) {
    // keep id fallback
  }

  return actor;
}

module.exports = {
  actorFromReq,
  actorFromUserId,
  actorFromClosedBy,
  resolveActorFromClosedBy,
  resolveId
};
