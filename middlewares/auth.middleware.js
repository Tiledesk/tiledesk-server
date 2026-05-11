"use strict";

var passport = require("passport");
require("../middleware/passport")(passport);
var Project = require("../models/project");
var Project_user = require("../models/project_user");
var User = require("../models/user");
var ApiKey = require("../models/apikey");
var winston = require("../config/winston");

/**
 * Extract an API key from the request headers.
 *
 * Two transports are accepted:
 *   - `x-api-key: <rawKey>`           (legacy + new)
 *   - `Authorization: Bearer <rawKey>` (OpenAI-style, only for new keys)
 *
 * The Bearer scheme is recognised here because in this server JWT tokens use
 * `Authorization: JWT <token>` (see middleware/passport.js,
 * ExtractJwt.fromAuthHeaderWithScheme("jwt")) and Basic auth uses
 * `Authorization: Basic <token>`. So `Bearer` is dedicated to API keys and
 * does not conflict with any existing strategy.
 *
 * The Bearer transport is restricted to keys that start with the well-known
 * public prefix (`ApiKey.KEY_PUBLIC_PREFIX`, e.g. `tdk-live-`) so we don't
 * accidentally hand the legacy `project.jwtSecret` (a UUID) over a Bearer
 * header, which would also collide with arbitrary opaque tokens used by
 * other integrations.
 */
function extractApiKey(req) {
  var headerKey = req.headers["x-api-key"];
  if (headerKey) {
    return headerKey;
  }
  var auth = req.headers.authorization;
  if (!auth) {
    return null;
  }
  var match = /^bearer\s+(.+)$/i.exec(auth);
  if (!match) {
    return null;
  }
  var token = match[1].trim();
  if (token.indexOf(ApiKey.KEY_PUBLIC_PREFIX) !== 0) {
    return null;
  }
  return token;
}

function authenticateRequired(req, res, next) {
  var apiKey = extractApiKey(req);
  if (apiKey) {
    return authenticateApiKey(apiKey, req, res, next);
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
  var apiKey = extractApiKey(req);
  if (apiKey) {
    return authenticateApiKey(apiKey, req, res, next);
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

/**
 * Resolves the User document the request will run as, given a project_user.
 * Falls back to an active admin of the project if the original project_user
 * is not usable (e.g. disabled, deleted, no associated user).
 */
function resolveUserForProjectUser(projectUser, projectId, callback) {
  if (projectUser && projectUser.id_user && projectUser.status === "active") {
    return User.findOne({ _id: projectUser.id_user, status: 100 }).exec(
      function (errU, userDoc) {
        if (errU) {
          return callback(errU);
        }
        if (userDoc) {
          return callback(null, userDoc);
        }
        return callback(null, null);
      }
    );
  }

  Project_user.findOne({
    id_project: projectId,
    role: { $in: ["owner", "admin"] },
    status: "active",
  })
    .sort({ role: 1 })
    .exec(function (errFallback, fallbackPu) {
      if (errFallback) {
        return callback(errFallback);
      }
      if (!fallbackPu || !fallbackPu.id_user) {
        return callback(null, null);
      }
      User.findOne({ _id: fallbackPu.id_user, status: 100 }).exec(function (
        errU,
        userDoc
      ) {
        if (errU) {
          return callback(errU);
        }
        callback(null, userDoc);
      });
    });
}

/**
 * New API key path: looks up the key in the `apikey` collection by SHA-256
 * hash, validates `enabled` and `expires_at`, then attaches the project_user
 * the key was issued for.
 *
 * Returns true via the callback if the key was matched (success or failure
 * already sent on the response); false if no document matched the hash, so
 * the caller can fall back to the legacy `project.jwtSecret` lookup.
 */
function tryAuthenticateNewApiKey(rawKey, req, res, next, callback) {
  var hash = ApiKey.hashRawKey(rawKey);
  ApiKey.findOne({ key_hash: hash })
    .select("+key_hash")
    .exec(function (err, apiKey) {
      if (err) {
        winston.error("authenticateApiKey ApiKey lookup err", err);
        return callback(err, true);
      }
      if (!apiKey) {
        return callback(null, false);
      }

      if (!apiKey.isUsable()) {
        res
          .status(401)
          .json({ success: false, msg: "API key revoked or expired." });
        return callback(null, true);
      }

      if (apiKey.usage_type === "user" && !ApiKey.isUserUsageAllowed()) {
        res.status(401).json({
          success: false,
          msg: "User API keys are disabled on this server. Use a service API key or login with JWT/Basic.",
        });
        return callback(null, true);
      }

      Project_user.findOne({ _id: apiKey.id_project_user }).exec(function (
        errPu,
        pu
      ) {
        if (errPu) {
          winston.error("authenticateApiKey Project_user err", errPu);
          return callback(errPu, true);
        }

        resolveUserForProjectUser(pu, apiKey.id_project, function (
          errU,
          userDoc
        ) {
          if (errU) {
            return callback(errU, true);
          }
          if (!userDoc) {
            res
              .status(401)
              .json({ success: false, msg: "Unauthorized." });
            return callback(null, true);
          }

          req.user = userDoc;
          req.authType = "apiKey";
          req.apiKeyId = String(apiKey._id);
          req.apiKeyMatchedProjectId = String(apiKey.id_project);

          ApiKey.updateOne(
            { _id: apiKey._id },
            {
              last_used_at: new Date(),
              last_used_ip:
                req.headers["x-forwarded-for"] || req.ip || null,
            }
          ).exec(function (errU2) {
            if (errU2) {
              winston.warn(
                "authenticateApiKey last_used_at update failed",
                errU2
              );
            }
          });

          next();
          callback(null, true);
        });
      });
    });
}

function authenticateApiKey(apiKey, req, res, next) {
  if (!apiKey) {
    return res
      .status(401)
      .json({ success: false, msg: "Unauthorized." });
  }

  tryAuthenticateNewApiKey(apiKey, req, res, next, function (err, handled) {
    if (err) {
      return next(err);
    }
    if (handled) {
      return;
    }

    Project.findOne({ status: 100, jwtSecret: apiKey })
      .select("+jwtSecret")
      .exec(function (errProj, project) {
        if (errProj) {
          winston.error("authenticateApiKey Project err", errProj);
          return next(errProj);
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
  });
}

module.exports = {
  authenticateRequired: authenticateRequired,
  optionalAuthenticate: optionalAuthenticate,
};
