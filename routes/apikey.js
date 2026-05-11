"use strict";

/**
 * REST routes to manage API keys for a project.
 *
 * Mounted at: /:projectid/apikeys
 *
 * The full secret value of a key (`raw_key`) is returned ONLY by the create
 * endpoint, exactly once. All list / get endpoints expose only the public
 * metadata (prefix, last 4 chars, name, dates, status), never the hash.
 *
 * Operations:
 *   POST   /                    create a new API key (returns raw_key once)
 *   GET    /                    list all API keys of the project
 *   GET    /:id                 get a single API key (metadata only)
 *   PUT    /:id                 update name / description / expires_at
 *   PUT    /:id/revoke          soft-revoke (enabled = false, key stays in DB)
 *   DELETE /:id                 hard-delete the API key
 */

var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var winston = require("../config/winston");
var ApiKey = require("../models/apikey");
var Project_user = require("../models/project_user");
var PERMS = require("../config/permissions");
var requirePermission =
  require("../middlewares/permission.middleware").requirePermission;

var ObjectId = mongoose.Types.ObjectId;

function isValidObjectId(id) {
  return id && ObjectId.isValid(id) && String(new ObjectId(id)) === String(id);
}

/**
 * Resolves the project_user document the new API key will act on behalf of.
 * Defaults to the current caller's project_user (req.projectuser).
 * Owners/admins can target a different member by passing `id_project_user` in
 * the body; in that case the target must belong to the same project.
 */
function resolveTargetProjectUser(req, callback) {
  var requestedId = req.body && req.body.id_project_user;
  if (!requestedId) {
    if (!req.projectuser) {
      return callback(
        new Error("Missing project user for the current caller.")
      );
    }
    return callback(null, req.projectuser);
  }

  if (!isValidObjectId(requestedId)) {
    var err = new Error("Invalid id_project_user.");
    err.status = 400;
    return callback(err);
  }

  Project_user.findOne({
    _id: requestedId,
    id_project: req.projectid,
    status: "active",
  }).exec(function (err, pu) {
    if (err) {
      return callback(err);
    }
    if (!pu) {
      var notFound = new Error(
        "Target project_user not found or not active in this project."
      );
      notFound.status = 404;
      return callback(notFound);
    }
    callback(null, pu);
  });
}

function parseExpiration(body) {
  if (!body) {
    return { expires_at: null };
  }

  if (
    body.expires_at === null ||
    body.expires_at === "" ||
    body.expires_in_days === null ||
    body.expires_in_days === 0
  ) {
    return { expires_at: null };
  }

  if (body.expires_at) {
    var d = new Date(body.expires_at);
    if (Number.isNaN(d.getTime())) {
      return { error: "Invalid expires_at: must be an ISO date string." };
    }
    if (d.getTime() <= Date.now()) {
      return { error: "Invalid expires_at: must be in the future." };
    }
    return { expires_at: d };
  }

  if (body.expires_in_days != null) {
    var days = Number(body.expires_in_days);
    if (!Number.isFinite(days) || days <= 0) {
      return {
        error: "Invalid expires_in_days: must be a positive number.",
      };
    }
    var future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return { expires_at: future };
  }

  return { expires_at: null };
}

//requirePermission(PERMS.APIKEY_CREATE)
router.post("/", function (req, res) {
  if (!req.body || !req.body.name || !String(req.body.name).trim()) {
    return res
      .status(400)
      .send({ success: false, msg: "Field 'name' is required." });
  }

  var expiration = parseExpiration(req.body);
  if (expiration.error) {
    return res.status(400).send({ success: false, msg: expiration.error });
  }

  var usageType = req.body.usage_type
    ? String(req.body.usage_type).trim().toLowerCase()
    : ApiKey.DEFAULT_USAGE_TYPE;
  if (ApiKey.USAGE_TYPES.indexOf(usageType) === -1) {
    return res.status(400).send({
      success: false,
      msg:
        "Invalid usage_type. Allowed values: " +
        ApiKey.USAGE_TYPES.join(", ") +
        ".",
    });
  }
  if (usageType === "user" && !ApiKey.isUserUsageAllowed()) {
    return res.status(403).send({
      success: false,
      msg: "User API keys are disabled on this server (API_KEY_ALLOW_USER_KEYS=false).",
    });
  }

  resolveTargetProjectUser(req, function (errPu, projectUser) {
    if (errPu) {
      var status = errPu.status || 500;
      return res.status(status).send({ success: false, msg: errPu.message });
    }

    var rawKey = ApiKey.generateRawKey();
    var apiKey = new ApiKey({
      id_project: req.projectid,
      id_project_user: projectUser._id,
      name: String(req.body.name).trim(),
      description: req.body.description
        ? String(req.body.description).trim()
        : undefined,
      usage_type: usageType,
      key_prefix: ApiKey.computePrefix(rawKey),
      key_last4: ApiKey.computeLast4(rawKey),
      key_hash: ApiKey.hashRawKey(rawKey),
      expires_at: expiration.expires_at,
      enabled: true,
      createdBy: req.user._id,
    });

    apiKey.save(function (err, saved) {
      if (err) {
        winston.error("ApiKey save error", err);
        return res
          .status(500)
          .send({ success: false, msg: "Error creating the API key." });
      }
      var json = saved.toJSON();
      json.raw_key = rawKey;
      json._warning =
        "Store this raw_key now: it will never be shown again.";
      return res.status(201).json(json);
    });
  });
});

router.get("/", requirePermission(PERMS.APIKEY_READ), function (req, res) {
  ApiKey.find({ id_project: req.projectid })
    .sort({ createdAt: -1 })
    .exec(function (err, keys) {
      if (err) {
        winston.error("ApiKey list error", err);
        return res
          .status(500)
          .send({ success: false, msg: "Error listing API keys." });
      }
      return res.json(keys);
    });
});

router.get("/:id", requirePermission(PERMS.APIKEY_READ), function (req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res
      .status(400)
      .send({ success: false, msg: "Invalid id." });
  }
  ApiKey.findOne({ _id: req.params.id, id_project: req.projectid }).exec(
    function (err, apiKey) {
      if (err) {
        winston.error("ApiKey get error", err);
        return res
          .status(500)
          .send({ success: false, msg: "Error reading API key." });
      }
      if (!apiKey) {
        return res
          .status(404)
          .send({ success: false, msg: "API key not found." });
      }
      return res.json(apiKey);
    }
  );
});

router.put("/:id", requirePermission(PERMS.APIKEY_UPDATE), function (req, res) {
  if (!isValidObjectId(req.params.id)) {
    return res
      .status(400)
      .send({ success: false, msg: "Invalid id." });
  }

  var update = {};
  if (req.body.name !== undefined) {
    var name = String(req.body.name).trim();
    if (!name) {
      return res
        .status(400)
        .send({ success: false, msg: "Field 'name' cannot be empty." });
    }
    update.name = name;
  }
  if (req.body.description !== undefined) {
    update.description = req.body.description
      ? String(req.body.description).trim()
      : null;
  }
  if (
    Object.prototype.hasOwnProperty.call(req.body, "expires_at") ||
    Object.prototype.hasOwnProperty.call(req.body, "expires_in_days")
  ) {
    var expiration = parseExpiration(req.body);
    if (expiration.error) {
      return res.status(400).send({ success: false, msg: expiration.error });
    }
    update.expires_at = expiration.expires_at;
  }

  if (Object.keys(update).length === 0) {
    return res
      .status(400)
      .send({ success: false, msg: "No editable field provided." });
  }

  ApiKey.findOneAndUpdate(
    { _id: req.params.id, id_project: req.projectid },
    update,
    { new: true }
  ).exec(function (err, updated) {
    if (err) {
      winston.error("ApiKey update error", err);
      return res
        .status(500)
        .send({ success: false, msg: "Error updating API key." });
    }
    if (!updated) {
      return res
        .status(404)
        .send({ success: false, msg: "API key not found." });
    }
    return res.json(updated);
  });
});

/**
 * Soft-revoke. The DB document is kept (audit / future re-enable) but the key
 * is no longer accepted at auth time because `enabled = false`.
 */
router.put(
  "/:id/revoke",
  requirePermission(PERMS.APIKEY_UPDATE),
  function (req, res) {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .send({ success: false, msg: "Invalid id." });
    }
    ApiKey.findOneAndUpdate(
      { _id: req.params.id, id_project: req.projectid, enabled: true },
      {
        enabled: false,
        revoked_at: new Date(),
        revoked_by: req.user._id,
      },
      { new: true }
    ).exec(function (err, updated) {
      if (err) {
        winston.error("ApiKey revoke error", err);
        return res
          .status(500)
          .send({ success: false, msg: "Error revoking API key." });
      }
      if (!updated) {
        return res.status(404).send({
          success: false,
          msg: "API key not found or already revoked.",
        });
      }
      return res.json(updated);
    });
  }
);

router.delete(
  "/:id",
  requirePermission(PERMS.APIKEY_DELETE),
  function (req, res) {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .send({ success: false, msg: "Invalid id." });
    }
    ApiKey.findOneAndDelete({
      _id: req.params.id,
      id_project: req.projectid,
    }).exec(function (err, deleted) {
      if (err) {
        winston.error("ApiKey delete error", err);
        return res
          .status(500)
          .send({ success: false, msg: "Error deleting API key." });
      }
      if (!deleted) {
        return res
          .status(404)
          .send({ success: false, msg: "API key not found." });
      }
      return res.json({ success: true, deleted: deleted });
    });
  }
);

module.exports = router;
