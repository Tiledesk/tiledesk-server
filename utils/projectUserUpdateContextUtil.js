'use strict';

const Subscription = require('../models/subscription');

function systemActor() {
  return { type: 'system', id: 'system', name: 'System' };
}

function userDisplayName(user) {
  if (!user) {
    return undefined;
  }

  const fullName = user.fullName || user.fullname;
  if (fullName && String(fullName).trim()) {
    return String(fullName).trim();
  }

  const name = ((user.firstname || '') + ' ' + (user.lastname || '')).trim();
  if (name) {
    return name;
  }

  return undefined;
}

function resolveUserId(userRef) {
  if (userRef === undefined || userRef === null) {
    return '';
  }

  if (typeof userRef === 'string' || typeof userRef === 'number') {
    return String(userRef);
  }

  if (userRef._id) {
    return String(userRef._id);
  }

  if (userRef.id) {
    return String(userRef.id);
  }

  return String(userRef);
}

function isSubscriptionActor(user) {
  if (!user) {
    return false;
  }

  if (user instanceof Subscription) {
    return true;
  }

  if (user.constructor && user.constructor.modelName === 'subscription') {
    return true;
  }

  // Webhook subscription document (no user profile fields)
  return Boolean(
    user.event &&
    user.target &&
    user.id_project &&
    user.createdBy &&
    !user.email &&
    !user.firstname &&
    !user.lastname
  );
}

function isSystemAvailabilityInitiator(req) {
  if (!req || !req.body) {
    return false;
  }

  return req.body.availabilityInitiator === 'system';
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

  if (isSubscriptionActor(req.user) || isSystemAvailabilityInitiator(req)) {
    context.source = isSubscriptionActor(req.user) ? 'subscription' : 'api';
    context.updateType = 'system';
    return context;
  }

  const actorUserId = resolveUserId(req.user);
  const targetId = resolveUserId(targetUserId);
  const isSelfRoute = !req.params || !req.params.project_userid;

  if (isSelfRoute) {
    context.updateType = 'self';
    return context;
  }

  if (actorUserId && targetId && actorUserId === targetId) {
    context.updateType = 'self';
  }

  return context;
}

function actorFromUpdateContext(req, updateContext) {
  if (
    !req ||
    !req.user ||
    (updateContext && updateContext.updateType === 'system') ||
    isSubscriptionActor(req.user) ||
    isSystemAvailabilityInitiator(req)
  ) {
    return systemActor();
  }

  return {
    type: 'user',
    id: resolveUserId(req.user),
    name: userDisplayName(req.user)
  };
}

function actorFromProjectUserUpdate(event, verb, updateContext) {
  const actor = actorFromUpdateContext(event.req, updateContext);

  if (actor.name) {
    return actor;
  }

  const project_user = event.updatedProject_userPopulated;
  const targetUser = project_user && project_user.id_user;
  const targetName = userDisplayName(targetUser);

  if (
    targetName &&
    (verb === 'PROJECT_USER_AVAILABILITY_SELF' ||
      resolveUserId(targetUser) === actor.id)
  ) {
    return Object.assign({}, actor, { name: targetName });
  }

  return actor;
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

function reconcileAvailabilityVerb(event, project_user, verb, updateContext) {
  if (!isAvailabilityUpdate(event.req && event.req.body)) {
    return { verb: verb, updateContext: updateContext, actor: null };
  }

  const context = Object.assign({}, updateContext);
  let resolvedVerb = verb;
  const targetUserId = resolveUserId(project_user && project_user.id_user);
  const actorUserId = resolveUserId(event.req && event.req.user);

  if (isSubscriptionActor(event.req && event.req.user) || isSystemAvailabilityInitiator(event.req)) {
    context.updateType = 'system';
    context.source = isSubscriptionActor(event.req.user) ? 'subscription' : (context.source || 'api');
    resolvedVerb = 'PROJECT_USER_AVAILABILITY_SYSTEM';
    return {
      verb: resolvedVerb,
      updateContext: context,
      actor: systemActor()
    };
  }

  if (resolvedVerb === 'PROJECT_USER_AVAILABILITY_SELF' && targetUserId && actorUserId && actorUserId !== targetUserId) {
    context.updateType = 'admin';
    resolvedVerb = 'PROJECT_USER_UPDATE';
    return { verb: resolvedVerb, updateContext: context, actor: null };
  }

  return { verb: resolvedVerb, updateContext: context, actor: null };
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
  userDisplayName,
  resolveUserId,
  isSubscriptionActor,
  isSystemAvailabilityInitiator,
  isAvailabilityUpdate,
  buildProjectUserUpdateContext,
  actorFromUpdateContext,
  actorFromProjectUserUpdate,
  verbForProjectUserUpdate,
  availabilityStatusLabel,
  reconcileAvailabilityVerb,
  verbFromAvailabilityUpdateType
};
