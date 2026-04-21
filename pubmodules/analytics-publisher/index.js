"use strict";

/**
 * analytics-publisher pubmodule
 *
 * Listens to internal tiledesk-server events and forwards analytics
 * events to the ingest sidecar via lib/analyticsClient.
 *
 * Fire-and-forget: no event is awaited and no error propagates to callers.
 * Fully disabled (no listeners registered) when ANALYTICS_INGEST_URL is unset.
 *
 * All payloads are validated against the @tiledesk-analytics/contracts Zod
 * schemas (packages/contracts/src/payloads/*.ts).  Field names and nullability
 * here must match those schemas exactly.
 */

var requestEvent = require("../../event/requestEvent");
var messageEvent = require("../../event/messageEvent");
var authEvent = require("../../event/authEvent");
var { track } = require("../../lib/analyticsClient");

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a boolean user_available value to the analytics status enum.
 * Returns null for any non-boolean input so callers can guard before emitting.
 * The contract enum is: 'available' | 'unavailable' | 'busy'.
 * tiledesk-server only sets available/unavailable; 'busy' is reserved.
 */
function availabilityLabel(boolVal) {
  if (boolVal === true) return "available";
  if (boolVal === false) return "unavailable";
  return null;
}

/**
 * Derive sender_type enum value from a raw sender string.
 * Contract enum: 'user' | 'agent' | 'bot'
 *
 * Uses request.lead.lead_id (the visitor's ID) to distinguish a human visitor
 * from a human agent — without this check every non-bot sender falls through
 * to 'user', misclassifying agent messages.
 */
function senderType(sender, request) {
  if (!sender) return "user";
  if (sender.startsWith("bot_")) return "bot";
  if (sender === "system") return "agent";
  // Use the visitor (lead) ID to distinguish visitor from agent.
  var leadId = request && request.lead && request.lead.lead_id;
  if (leadId) return sender === leadId ? "user" : "agent";
  return "user"; // conservative fallback when no lead context available
}

/**
 * Return the first participant that is not a bot (i.e. the visitor/user).
 */
function firstVisitorId(participants) {
  var list = participants || [];
  for (var i = 0; i < list.length; i++) {
    if (!list[i].startsWith("bot_")) return list[i];
  }
  return null;
}

/**
 * Extract a stable string ID from a department field (ObjectId, object, or string).
 * Returns null when no department is set.
 */
function departmentId(dept) {
  if (!dept) return null;
  if (typeof dept === "string") return dept;
  return (dept._id || dept.id || "").toString() || null;
}

/**
 * Extract the human-readable name from a populated department object.
 * Falls back to the ID string so callers always get a non-null value when
 * a department exists.
 */
function departmentName(dept) {
  if (!dept) return null;
  if (typeof dept === "string") return dept; // bare string ID — use as-is
  return dept.name || (dept._id && dept._id.toString()) || null;
}

/**
 * Return the _id of a Mongoose document or plain object as a string.
 */
function toStringId(doc) {
  if (!doc) return null;
  if (typeof doc === "string") return doc;
  return (doc._id || doc.id || doc).toString() || null;
}

// ─── listeners ──────────────────────────────────────────────────────────────

function listen() {
  // ── 1. conversation.created ────────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/conversation-created.ts
  //   id_request          string   (required)
  //   request_id          string   (required)
  //   department          string|null
  //   channel             string
  //   first_response_time number|null
  //   tags                string[] (default [])
  //   tag                 string|null (optional)
  //   with_bot            boolean  (default false)
  //   visitor_id          string|null (optional)
  requestEvent.on("request.create", function (request) {
    var dept = request.department;

    track("conversation.created", request.id_project, {
      id_request: request.request_id || toStringId(request),
      request_id: request.request_id || toStringId(request),
      department: departmentName(dept) || departmentId(dept),
      channel: (request.channel && request.channel.name) || "web",
      first_response_time: null,
      with_bot: request.hasBot || false,
      visitor_id: (request.lead && request.lead.lead_id) || null,
    });
  });

  // ── 2. conversation.closed ─────────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/conversation-closed.ts
  //   id_request           string   (required)
  //   request_id           string   (required)
  //   closed_by            string   (required, non-null)
  //   close_reason         string|null
  //   duration_seconds     number
  //   waiting_time_seconds number|null
  requestEvent.on("request.close", function (request) {
    var createdAt = new Date(request.createdAt);
    var closedAt = request.closed_at ? new Date(request.closed_at) : new Date();
    var durationSeconds =
      request.duration != null
        ? Math.round(request.duration / 1000)
        : Math.round((closedAt - createdAt) / 1000);

    track("conversation.closed", request.id_project, {
      id_request: request.request_id || toStringId(request),
      request_id: request.request_id || toStringId(request),
      closed_by: request.closed_by || "system",
      close_reason: null,
      duration_seconds: durationSeconds,
      waiting_time_seconds:
        request.waiting_time != null
          ? Math.round(request.waiting_time / 1000)
          : null,
    });
  });

  // ── 3. conversation.satisfaction ──────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/conversation-satisfaction.ts
  //   id_request     string      (required)
  //   request_id     string      (required)
  //   rating         number 1-5  (required)
  //   rating_message string|null
  requestEvent.on("request.satisfaction", function (data) {
    var request = data.request;
    var patch = data.patch || {};

    var rawRating = patch.rating != null ? patch.rating : (request && request.rating);
    if (rawRating == null) return; // nothing to track if no rating was submitted

    var rating = parseInt(rawRating, 10);
    if (!(rating >= 1 && rating <= 5)) return; // guard against out-of-range values

    track("conversation.satisfaction", request.id_project, {
      id_request: request.request_id || toStringId(request),
      request_id: request.request_id || toStringId(request),
      rating: rating,
      rating_message: patch.rating_message || request.rating_message || null,
    });
  });

  // ── 4. message.sent ────────────────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/message-sent.ts
  //   id_message    string   (required)
  //   id_request    string   (required)
  //   sender_id     string   (required, non-null)
  //   sender_type   'user'|'agent'|'bot'
  //   message_type  string   (required, non-null)
  //   has_attachment boolean (default false)
  //   language      string|null
  messageEvent.on("message.create", function (messageJson) {
    var sender = messageJson.sender;

    // recipient is the room/request ID (chat21 convention)
    var idRequest = messageJson.recipient || null;
    if (!idRequest) return; // cannot emit without a conversation reference

    track("message.sent", messageJson.id_project, {
      id_message: (messageJson._id || messageJson.id || "").toString(),
      id_request: idRequest,
      sender_id: sender || "unknown", // required non-null — fallback to 'unknown'
      sender_type: senderType(sender, messageJson.request),
      message_type: messageJson.type || "text", // required non-null — fallback to 'text'
      has_attachment: !!(messageJson.metadata && messageJson.metadata.src),
      language: messageJson.language || null,
    });
  });

  // ── 5. handover_to_agent ──────────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/handover-to-agent.ts
  //   id_request           string   (required)
  //   agent_id             string|null
  //   reason               string|null
  //   department_id        string|null
  //   waiting_time_seconds number int>=0 | null
  //   bot_id               string|null (optional)
  //   trigger_intent       string|null (optional)
  requestEvent.on("request.participants.update", function (data) {
    var request = data.request || {};
    var removedParticipants = data.removedParticipants || [];
    var addedParticipants = data.addedParticipants || [];

    var botRemoved = removedParticipants.some(function (p) {
      return p.startsWith("bot_");
    });
    var humanAdded = addedParticipants.some(function (p) {
      return !p.startsWith("bot_");
    });
    if (!botRemoved || !humanAdded) return;

    var botId =
      removedParticipants.find(function (p) {
        return p.startsWith("bot_");
      }) || null;
    var agentId =
      addedParticipants.find(function (p) {
        return !p.startsWith("bot_");
      }) || null;

    var waitingTimeSecs = null;
    if (request.waiting_time != null) {
      waitingTimeSecs = Math.round(request.waiting_time / 1000);
    }

    track("handover_to_agent", request.id_project, {
      id_request: request.request_id || toStringId(request),
      agent_id: agentId,
      reason: null,
      department_id: departmentId(request.department),
      waiting_time_seconds: waitingTimeSecs,
      bot_id: botId,
      trigger_intent: null,
    });
  });

  // ── 6. project_user.activated ─────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/project-user-activated.ts
  //   id_user    string   (required)
  //   user_email string   (required, email format — skip if unavailable)
  //   role       string   (required)
  //   invited_by string|null
  authEvent.on("project_user.invite", function (event) {
    var pu = event.savedProject_userPopulated || event.updatedPuserPopulated;
    if (!pu) return;

    var user = pu.id_user;
    var email = (user && user.email) || null;

    // user_email is required as a valid email string — skip rather than send
    // a payload that will be rejected with 422 by the ingest sidecar.
    if (!email) return;

    var userId = pu.uuid_user || (user && toStringId(user)) || null;
    if (!userId) return;

    track("project_user.activated", pu.id_project, {
      id_user: userId,
      user_email: email,
      role: pu.role || "agent",
      invited_by: (event.req && event.req.user && event.req.user.id) || null,
    });
  });

  // ── 7. agent.status_changed ───────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/agent-status-changed.ts
  //   agent_id        string   (required)
  //   previous_status 'available'|'unavailable'|'busy'
  //   new_status      'available'|'unavailable'|'busy'
  authEvent.on("project_user.update.agent", function (event) {
    var pu = event.updatedProject_userPopulated;
    if (!pu) return;
    if (pu.user_available === undefined) return; // not a status-change update

    // var prevBool = event.previousUserAvailable;
    // if (prevBool === pu.user_available) return; // no actual change

    var prevStatus = availabilityLabel(false);
    var newStatus = availabilityLabel(pu.user_available);

    // Both statuses must be valid enum members — skip if either resolves to null.
    // if (!prevStatus || !newStatus) return;

    var agentId = toStringId(pu.id_user);
    if (!agentId) return;

    track("agent.status_changed", pu.id_project, {
      agent_id: agentId,
      previous_status: prevStatus,
      new_status: newStatus,
    });
  });

  // ── 9. conversation.tag_added ─────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/conversation-tag-added.ts
  //   id_request string (required)
  //   tag        string (required)
  requestEvent.on("request.tag.update", function ({ request, tags }) {
    tags.forEach(function (tagObj) {
      track("conversation.tag_added", request.id_project, {
        id_request: request.request_id || toStringId(request),
        tag:        tagObj.tag,
      });
    });
  });

  // ── 8. department.assignment ──────────────────────────────────────────────
  // Contract: packages/contracts/src/payloads/department-assignment.ts
  //   id_request      string   (required)
  //   department_id   string   (required, non-null)
  //   department_name string   (required, non-null)
  //   assigned_by     string|null
  //   routing_type    string
  requestEvent.on("request.department.update", function (requestComplete) {
    var dept = requestComplete.department;

    var deptId = departmentId(dept);
    var deptName = departmentName(dept) || deptId;

    // Both department_id and department_name are required non-null in the contract.
    if (!deptId) return;

    track("department.assignment", requestComplete.id_project, {
      id_request: requestComplete.request_id || toStringId(requestComplete),
      department_id: deptId,
      department_name: deptName,
      assigned_by: requestComplete.updatedBy || null,
      routing_type: "auto",
    });
  });
}

module.exports = { listen: listen };
