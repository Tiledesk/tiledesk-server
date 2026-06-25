'use strict';

const projectUserUpdateContextUtil = require('./projectUserUpdateContextUtil');

function actorFromReq(req) {
  if (!req || !req.user) {
    return { type: 'system', id: 'system', name: 'System' };
  }
  if (projectUserUpdateContextUtil.isSubscriptionActor(req.user)) {
    return { type: 'system', id: 'system', name: 'System' };
  }
  return {
    type: 'user',
    id: req.user.id || req.user._id,
    name: projectUserUpdateContextUtil.userDisplayName(req.user)
  };
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

module.exports = {
  actorFromReq,
  actorFromUserId,
  resolveId
};
