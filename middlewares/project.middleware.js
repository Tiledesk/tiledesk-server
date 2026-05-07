"use strict";

var mongoose = require("mongoose");
var Project = require("../models/project");
var cacheUtil = require("../utils/cacheUtil");
var cacheEnabler = require("../services/cacheEnabler");
var winston = require("../config/winston");
var projectUserService = require("../services/projectUserService");
var Faq_kb = require("../models/faq_kb");
var Subscription = require("../models/subscription");

function projectIdSetter(req, res, next) {
  var projectid = req.params.projectid;
  winston.debug("projectIdSetter projectid: " + projectid);

  req.projectid = projectid;

  next();
}

function projectSetter(req, res, next) {
  var projectid = req.params.projectid;
  winston.debug("projectSetter projectid:" + projectid);

  if (projectid) {
    if (!mongoose.Types.ObjectId.isValid(projectid)) {
      return res
        .status(400)
        .send({ error: "Invalid project id: " + projectid });
    }

    let q = Project.findOne({ _id: projectid, status: 100 });
    if (cacheEnabler.project) {
      q.cache(cacheUtil.longTTL, "projects:id:" + projectid);
      winston.debug("project cache enabled");
    }
    q.exec(function (err, project) {
      if (err) {
      }
      winston.debug("projectSetter project:" + project);
      if (!project) {
        return res
          .status(400)
          .send({ error: "Project not found with id: " + projectid });
      } else {
        req.project = project;
        next();
      }
    });
  } else {
    next();
  }
}

function isBotOrSubscription(user) {
  if (!user) {
    return false;
  }
  if (user instanceof Faq_kb) {
    return true;
  }
  if (user instanceof Subscription) {
    return true;
  }
  return false;
}

/**
 * Loads req.projectuser / req.projectUser after req.user is set (runs after auth).
 * Mirrors middleware/has-role membership and superadmin bypass.
 */
function injectProjectUser(req, res, next) {
  if (!req.user) {
    return res.status(403).send({ success: false, msg: "Unauthorized." });
  }

  if (req.authType === "apiKey" && req.apiKeyMatchedProjectId) {
    if (String(req.apiKeyMatchedProjectId) !== String(req.projectid)) {
      return res.status(403).send({
        success: false,
        msg: "API key not valid for this project.",
      });
    }
  }

  if (isBotOrSubscription(req.user)) {
    return next();
  }

  var projectid = req.params.projectid || req.projectid;
  if (!projectid) {
    return res
      .status(400)
      .send({ success: false, msg: "req.params.projectid is not defined." });
  }

  projectUserService
    .getWithPermissions(req.user._id, projectid, req.user.sub)
    .then(function (project_user) {
      if (project_user) {
        req.projectuser = project_user;
        req.projectUser = project_user;
        return next();
      }
      if (req.user.email === process.env.ADMIN_EMAIL) {
        req.user.attributes = { isSuperadmin: true };
        return next();
      }
      return res.status(403).send({
        success: false,
        msg: "you dont belong to the project.",
      });
    })
    .catch(function (err) {
      winston.error("injectProjectUser error", err);
      next(err);
    });
}

module.exports = {
  projectIdSetter: projectIdSetter,
  projectSetter: projectSetter,
  injectProjectUser: injectProjectUser,
};
