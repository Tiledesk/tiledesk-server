"use strict";

var roleChecker = require("../middleware/has-role");
var winston = require("../config/winston");
var P = require("../config/permissions");
var ROLES = require("../config/roles");

var legacy = {};

legacy[P.FLOWS_READ] = roleChecker.hasRoleOrTypes("agent", [
  "bot",
  "subscription",
]);

var cache = {};

function computeRbacPermissions(projectUserDoc) {
  if (!projectUserDoc) {
    return new Set();
  }
  var roleName = projectUserDoc.role;
  var roleType = projectUserDoc.roleType;
  var custom = projectUserDoc.permissions || [];

  var base =
    roleType === 2
      ? new Set(ROLES.GUEST_ROLETYPE_PERMISSIONS)
      : new Set(
          ROLES.ROLE_PERMISSIONS[roleName] ||
            ROLES.ROLE_PERMISSIONS.agent ||
            []
        );

  if (Array.isArray(custom)) {
    custom.forEach(function (c) {
      base.add(c);
    });
  }
  return base;
}

function requirePermission(permission) {
  if (!permission) {
    throw new Error("requirePermission requires a valid permission");
  }
  if (legacy[permission]) {
    return legacy[permission];
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
      var pu = req.projectuser || req.projectUser;
      if (!pu) {
        winston.warn("requirePermission: missing project user", permission);
        return res.status(403).send({
          success: false,
          msg: "you dont belong to the project.",
        });
      }
      var effective = computeRbacPermissions(pu);
      if (effective.has(permission)) {
        return next();
      }
      return res.status(403).send({
        success: false,
        error: "403 FORBIDDEN",
        message: "You don't have the required permission."
      });
    };
  }
  return cache[permission];
}

module.exports = {
  requirePermission: requirePermission,
};
