"use strict";

var winston = require("../config/winston");
var ROLES = require("../config/roles");
var Faq_kb = require("../models/faq_kb");
var Subscription = require("../models/subscription");

var cache = {};

/**
 * Compute the effective permissions of the current request user.
 *
 * Rules:
 * - Bot user (req.user instanceof Faq_kb) -> BOT_PERMISSIONS.
 * - Subscription user (req.user instanceof Subscription) -> SUBSCRIPTION_PERMISSIONS.
 * - roleType === 2 (guest end-user) -> only GUEST_ROLETYPE_PERMISSIONS, immutable.
 * - Standard role (owner, admin, agent, guest, teammate, user, supervisor)
 *   -> only the predefined permissions of that role, immutable.
 * - Custom role (role name not in ROLE_PERMISSIONS)
 *   -> starts from an empty set and uses the permissions of the matching Role
 *      document in the `roles` collection (looked up by name + id_project).
 *      Pre-loaded by projectUserService.getWithPermissions into
 *      project_user._doc.rolePermissions, so no extra DB hit here.
 */
function computeEffectivePermissions(req) {
  if (req.user instanceof Faq_kb) {
    return new Set(ROLES.BOT_PERMISSIONS);
  }
  if (req.user instanceof Subscription) {
    return new Set(ROLES.SUBSCRIPTION_PERMISSIONS);
  }

  var pu = req.projectuser || req.projectUser;
  if (!pu) {
    return null;
  }

  if (pu.roleType === 2) {
    return new Set(ROLES.GUEST_ROLETYPE_PERMISSIONS);
  }

  var standard = ROLES.ROLE_PERMISSIONS[pu.role];
  if (standard) {
    return new Set(standard);
  }

  var rolePermissions =
    pu._doc && Array.isArray(pu._doc.rolePermissions)
      ? pu._doc.rolePermissions
      : [];
  return new Set(rolePermissions);
}

function requirePermission(permission) {
  console.log("requirePermission", permission);
  if (!permission) {
    throw new Error("requirePermission requires a valid permission");
  }
  if (!cache[permission]) {
    cache[permission] = function (req, res, next) {
      if (
        req.user &&
        req.user.attributes &&
        req.user.attributes.isSuperadmin
      ) {
        return next();
      }

      var effective = computeEffectivePermissions(req);
      console.log("effective", effective);
      if (effective === null) {
        winston.warn("requirePermission: missing project user", permission);
        return res.status(403).send({
          success: false,
          error: "401 UNAUTHORIZED",
          message: "You dont belong to the project.",
        });
      }
      if (effective.has(permission)) {
        return next();
      }
      return res.status(403).send({
        success: false,
        error: "403 FORBIDDEN",
        message: "You don't have the required permission.",
      });
    };
  }
  return cache[permission];
}

module.exports = {
  requirePermission: requirePermission,
};
