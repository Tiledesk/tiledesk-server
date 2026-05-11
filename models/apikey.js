"use strict";

/**
 * ApiKey model.
 *
 * Manages per-project API keys used to authenticate REST calls via the
 * `x-api-key` header. Each key:
 *   - belongs to a single project (`id_project`);
 *   - acts on behalf of a specific `project_user` (`id_project_user`), so the
 *     effective permissions are exactly those of that project_user;
 *   - is created by a real user (`createdBy`) for audit;
 *   - can be invalidated (soft revocation: `enabled = false`) or hard-deleted;
 *   - can have an optional expiration date (`expires_at = null` => never expires).
 *
 * The raw key value is NEVER persisted. Only:
 *   - `key_prefix` (first chars, used as a public, human-readable identifier)
 *   - `key_last4`  (last 4 chars, used in the UI to recognize a key)
 *   - `key_hash`   (SHA-256 of the full key, used for lookup at auth time)
 * are saved. The full plaintext key is returned to the caller exactly once,
 * at creation time, and cannot be recovered afterwards.
 */

var mongoose = require("mongoose");
var crypto = require("crypto");
var Schema = mongoose.Schema;
var winston = require("../config/winston");

var KEY_PUBLIC_PREFIX = "tdk-live-";
var KEY_RANDOM_BYTES = 32;
var KEY_PREFIX_LENGTH = 8;

/**
 * `usage_type` distinguishes how a key is intended to be used:
 *   - "service": machine-to-machine integration (default).
 *   - "user":    issued for a human end-user, e.g. a personal API token.
 *
 * The runtime can selectively reject "user" keys via the
 * API_KEY_ALLOW_USER_KEYS=false env var, forcing humans onto JWT/Basic.
 */
var USAGE_TYPES = ["user", "service"];
var DEFAULT_USAGE_TYPE = "service";

var ApiKeySchema = new Schema(
  {
    id_project: {
      type: Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },
    id_project_user: {
      type: Schema.Types.ObjectId,
      ref: "project_user",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    usage_type: {
      type: String,
      enum: USAGE_TYPES,
      default: DEFAULT_USAGE_TYPE,
      required: true,
      index: true,
    },
    key_prefix: {
      type: String,
      required: true,
      index: true,
    },
    key_last4: {
      type: String,
      required: true,
    },
    key_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },
    expires_at: {
      type: Date,
      default: null,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    revoked_at: {
      type: Date,
      default: null,
    },
    revoked_by: {
      type: Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    last_used_at: {
      type: Date,
      default: null,
    },
    last_used_ip: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.key_hash;
        return ret;
      },
    },
  }
);

ApiKeySchema.index({ id_project: 1, enabled: 1 });
ApiKeySchema.index({ id_project: 1, createdAt: -1 });

ApiKeySchema.statics.KEY_PUBLIC_PREFIX = KEY_PUBLIC_PREFIX;
ApiKeySchema.statics.USAGE_TYPES = USAGE_TYPES;
ApiKeySchema.statics.DEFAULT_USAGE_TYPE = DEFAULT_USAGE_TYPE;

/**
 * Reads API_KEY_ALLOW_USER_KEYS (default: true) and returns true when keys
 * with usage_type === "user" are accepted both at creation and at auth time.
 */
ApiKeySchema.statics.isUserUsageAllowed = function () {
  var v = process.env.API_KEY_ALLOW_USER_KEYS;
  if (v === undefined || v === null || v === "") {
    return true;
  }
  return !(v === "false" || v === false || v === "0");
};

/**
 * Generate a new random raw key of the form `<KEY_PUBLIC_PREFIX><base64url>`,
 * e.g. `tdk-live-AbCdEf...`. High entropy (32 random bytes => 256 bit),
 * safe to hash with SHA-256.
 *
 * The prefix is stored verbatim (separator included), so the produced raw
 * value is `KEY_PUBLIC_PREFIX + randomPart` with no extra glue character.
 */
ApiKeySchema.statics.generateRawKey = function () {
  var randomPart = crypto
    .randomBytes(KEY_RANDOM_BYTES)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return KEY_PUBLIC_PREFIX + randomPart;
};

/**
 * SHA-256 of the raw key. Used both at creation (to persist) and at auth
 * time (to look up). Constant work, no salt: the raw key already has 256 bit
 * of entropy, brute force is not a meaningful threat.
 */
ApiKeySchema.statics.hashRawKey = function (rawKey) {
  return crypto.createHash("sha256").update(rawKey, "utf8").digest("hex");
};

/**
 * Public prefix shown in lists / logs to let the user recognize a key
 * without exposing the secret material. Includes `KEY_PUBLIC_PREFIX` plus
 * the first few random characters.
 */
ApiKeySchema.statics.computePrefix = function (rawKey) {
  return rawKey.slice(0, KEY_PUBLIC_PREFIX.length + KEY_PREFIX_LENGTH);
};

ApiKeySchema.statics.computeLast4 = function (rawKey) {
  return rawKey.slice(-4);
};

/**
 * Returns true when the key cannot be used for authentication right now.
 */
ApiKeySchema.methods.isUsable = function () {
  if (!this.enabled) {
    return false;
  }
  if (this.expires_at && this.expires_at.getTime() <= Date.now()) {
    return false;
  }
  return true;
};

var ApiKey = mongoose.model("apikey", ApiKeySchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  ApiKey.syncIndexes();
  winston.verbose("ApiKey syncIndexes");
}

module.exports = ApiKey;
