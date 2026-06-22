'use strict';

const Subscription = require('../models/subscription');

function systemActor() {
  return { type: 'system', id: 'system', name: 'System' };
}

function isAvailabilityUpdate(body) {
  if (!body) {
    return false;
  }
  return body.user_available !== undefined || body.profileStatus !== undefined;
}

function buildProjectUserUpdateContext(req, previousUserAvailable, previousProfileStatus, targetUserId) {
  const context = {
    previousUserAvailable,
    previousProfileStatus,
    source: 'api',
    updateType: 'admin'
  };

  if (!req || !req.user) {
    context.source = 'system';
    context.updateType = 'system';
    return context;
  }

  if (req.user instanceof Subscription) {
    context.source = 'subscription';
    context.updateType = 'system';
    return context;
  }

  const actorUserId = String(req.user.id || req.user._id || '');
  const resolvedTargetUserId = String(
    targetUserId ||
    (req.projectuser && req.projectuser.id_user) ||
    ''
  );

  const isSelfRoute = !req.params || !req.params.project_userid;

  if (isSelfRoute || (actorUserId && resolvedTargetUserId && actorUserId === resolvedTargetUserId)) {
    context.updateType = 'self';
  }

  return context;
}

function actorFromUpdateContext(req, updateContext) {
  if (!req || !req.user || (updateContext && updateContext.updateType === 'system')) {
    return systemActor();
  }

  return {
    type: 'user',
    id: String(req.user.id || req.user._id),
    name: req.user.fullName || req.user.fullname || undefined
  };
}

function verbForProjectUserUpdate(body, updateContext) {
  if (!isAvailabilityUpdate(body)) {
    return 'PROJECT_USER_UPDATE';
  }

  if (updateContext && updateContext.updateType === 'system') {
    return 'PROJECT_USER_AVAILABILITY_SYSTEM';
  }

  if (updateContext && updateContext.updateType === 'self') {
    return 'PROJECT_USER_AVAILABILITY_SELF';
  }

  return 'PROJECT_USER_UPDATE';
}

function availabilityStatusLabel({ user_available, profileStatus }) {
  if (profileStatus !== undefined && profileStatus !== null && profileStatus !== '') {
    return String(profileStatus);
  }
  if (user_available === true) {
    return 'available';
  }
  if (user_available === false) {
    return 'unavailable';
  }
  return 'unknown';
}

function verbFromAvailabilityUpdateType(updateType) {
  switch (updateType) {
    case 'system':
      return 'PROJECT_USER_AVAILABILITY_SYSTEM';
    case 'self':
      return 'PROJECT_USER_AVAILABILITY_SELF';
    default:
      return 'PROJECT_USER_UPDATE';
  }
}

module.exports = {
  systemActor,
  isAvailabilityUpdate,
  buildProjectUserUpdateContext,
  actorFromUpdateContext,
  verbForProjectUserUpdate,
  availabilityStatusLabel,
  verbFromAvailabilityUpdateType
};
