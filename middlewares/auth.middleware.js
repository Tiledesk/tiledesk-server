"use strict";

var passport = require("passport");
require("../middleware/passport")(passport);
var Project = require("../models/project");
var Project_user = require("../models/project_user");
var User = require("../models/user");
var winston = require("../config/winston");

function authenticateRequired(req, res, next) {
  var apiKey = req.headers["x-api-key"];
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }

  return passport.authenticate(
    ["basic", "jwt"],
    { session: false },
    function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: "Unauthorized." });
      }
      req.user = user;
      req.authType =
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().indexOf("basic ") === 0
          ? "basic"
          : "jwt";
      next();
    }
  )(req, res, next);
}

/**
 * Optional auth: attaches req.user when credentials are present; does not fail when absent.
 * Used on /:projectid/* prefix so IP filters and public subpaths still work.
 */
function optionalAuthenticate(req, res, next) {
  if (req.headers["x-api-key"]) {
    return authenticateApiKey(req, res, next);
  }
  if (!req.headers.authorization) {
    return next();
  }
  return passport.authenticate(
    ["basic", "jwt"],
    { session: false },
    function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: "Unauthorized." });
      }
      req.user = user;
      req.authType =
        req.headers.authorization &&
        req.headers.authorization.toLowerCase().indexOf("basic ") === 0
          ? "basic"
          : "jwt";
      next();
    }
  )(req, res, next);
}

function authenticateApiKey(req, res, next) {
  var apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res
      .status(401)
      .json({ success: false, msg: "Unauthorized." });
  }

  Project.findOne({ status: 100, jwtSecret: apiKey })
    .select("+jwtSecret")
    .exec(function (err, project) {
      if (err) {
        winston.error("authenticateApiKey Project err", err);
        return next(err);
      }
      if (!project) {
        return res
          .status(401)
          .json({ success: false, msg: "Unauthorized." });
      }

      Project_user.findOne({
        id_project: project._id,
        role: "owner",
        status: "active",
      }).exec(function (errPu, pu) {
        if (errPu) {
          winston.error("authenticateApiKey Project_user err", errPu);
          return next(errPu);
        }

        var attachUser = function (userDoc) {
          if (!userDoc) {
            return res
              .status(401)
              .json({ success: false, msg: "Unauthorized." });
          }
          req.user = userDoc;
          req.authType = "apiKey";
          req.apiKeyMatchedProjectId = String(project._id);
          next();
        };

        if (pu && pu.id_user) {
          User.findOne({ _id: pu.id_user, status: 100 }).exec(function (
            errU,
            userDoc
          ) {
            if (errU) {
              return next(errU);
            }
            return attachUser(userDoc);
          });
        } else {
          Project_user.findOne({
            id_project: project._id,
            role: "admin",
            status: "active",
          }).exec(function (errAd, puAd) {
            if (errAd) {
              return next(errAd);
            }
            if (!puAd || !puAd.id_user) {
              return res
                .status(401)
                .json({ success: false, msg: "Unauthorized." });
            }
            User.findOne({ _id: puAd.id_user, status: 100 }).exec(function (
              errU,
              userDoc
            ) {
              if (errU) {
                return next(errU);
              }
              return attachUser(userDoc);
            });
          });
        }
      });
    });
}

module.exports = {
  authenticateRequired: authenticateRequired,
  optionalAuthenticate: optionalAuthenticate,
};
