const authEvent = require('../../event/authEvent');
const requestEvent = require('../../event/requestEvent');
const assignmentContextUtil = require('../../utils/assignmentContextUtil');
const projectUserUpdateContextUtil = require('../../utils/projectUserUpdateContextUtil');
const botEvent = require('../../event/botEvent');
const kbEvent = require('../../event/kbEvent');
const Activity = require('./models/activity');
const winston = require('../../config/winston');

function resolveEventKey(baseKey, queueEnabled) {
  return queueEnabled ? `${baseKey}.queue` : baseKey;
}

async function save(activity) {
  try {
    await activity.save();
    winston.debug('Activity saved', activity.toObject());
  } catch (err) {
    winston.error('Error saving activity ', { activity: activity.toObject(), err: err });
  }
}

class ActivityArchiver {

  listen() {

    winston.debug('ActivityArchiver listen');

    const enabled = process.env.ACTIVITY_HISTORY_ENABLED || "false";
    winston.debug('ActivityArchiver enabled:' + enabled);

    if (enabled === "true") {
      winston.verbose('ActivityArchiver enabled');
    } else {
      winston.info('ActivityArchiver disabled');
      return 0;
    }

    if (process.env.MONGOOSE_SYNCINDEX) {
      Activity.syncIndexes();
      winston.info("Activity.syncIndexes called");
    }


    // ********** AUTH EVENTS **********

    // Works only if worker is disabled
    // Doesn't work if job_worker enabled because queue.worker is disabled
    const authProjectUserInvitePendingKey = resolveEventKey('project_user.invite.pending', false);
    winston.debug('ActivityArchiver authProjectUserInvitePendingKey: ' + authProjectUserInvitePendingKey);

    authEvent.on(authProjectUserInvitePendingKey, function (event) {
      setImmediate(() => {
        if (event.skipArchive) {
          return 0;
        }
        let activity = new Activity({
          id_project: event.req.projectid,
          actor: {
            type: "user",
            id: event.req.user.id,
            name: event.req.user.fullName
          },
          verb: "PROJECT_USER_INVITE",
          actionObj: event.req.body,
          target: {
            type: "pendinginvitation",
            id: event.savedPendingInvitation._id.toString(),
            object: event.savedPendingInvitation
          }
        });
        save(activity);
      });
    });


    // Works only if worker is disabled
    // Doesn't work if job_worker enabled because queue.worker is disabled
    const authProjectUserInviteKey = resolveEventKey('project_user.invite', false);
    winston.debug('ActivityArchiver authProjectUserInviteKey: ' + authProjectUserInviteKey);

    authEvent.on(authProjectUserInviteKey, function (event) {
      setImmediate(() => {
        if (event.skipArchive) {
          return 0;
        }
        let activity = new Activity({
          actor: { type: "user", id: event.req.user.id, name: event.req.user.fullName },
          verb: "PROJECT_USER_INVITE", actionObj: event.req.body,
          target: { type: "project_user", id: event.savedProject_userPopulated._id.toString(), object: event.savedProject_userPopulated },
          id_project: event.req.projectid
        });
        save(activity);
      });
    });


    const authProjectUserUpdateKey = resolveEventKey('project_user.update', authEvent.queueEnabled);
    winston.debug('ActivityArchiver authProjectUserUpdateKey: ' + authProjectUserUpdateKey);

    authEvent.on(authProjectUserUpdateKey, function (event) {
      setImmediate(() => {
        if (event.skipArchive) {
          return 0;
        }

        let project_user = undefined;
        if (event.updatedProject_userPopulated.toObject) {
          project_user = event.updatedProject_userPopulated.toObject()
        } else {
          project_user = event.updatedProject_userPopulated;
        }

        winston.debug('ActivityArchiver authProjectUserUpdateKey event: ', event);

        if (!event.req.user) {
          return winston.debug('ActivityArchiver skipping archive empty user'); //from i think chat21webhook
        }

        const updateContext = event.updateContext || projectUserUpdateContextUtil.buildProjectUserUpdateContext(
          event.req,
          event.previousUserAvailable,
          null,
          project_user.id_user
        );
        const actor = projectUserUpdateContextUtil.actorFromUpdateContext(event.req, updateContext);
        const verb = projectUserUpdateContextUtil.verbForProjectUserUpdate(event.req.body, updateContext);
        const previousStatus = projectUserUpdateContextUtil.availabilityStatusLabel({
          user_available: updateContext.previousUserAvailable,
          profileStatus: updateContext.previousProfileStatus
        });
        const newStatus = projectUserUpdateContextUtil.availabilityStatusLabel({
          user_available: project_user.user_available,
          profileStatus: project_user.profileStatus
        });

        var activity = new Activity({
          id_project: event.updatedProject_userPopulated.id_project,
          actor: actor,
          verb: verb,
          actionObj: Object.assign({}, event.req.body, {
            previousUserAvailable: updateContext.previousUserAvailable,
            previousProfileStatus: updateContext.previousProfileStatus,
            previousStatus: previousStatus,
            newStatus: newStatus,
            updateType: updateContext.updateType,
            source: updateContext.source
          }),
          target: { 
            type: "project_user", 
            id: event.updatedProject_userPopulated._id.toString(), 
            object: project_user 
          }
        });
        save(activity);
      });
    });


    // Works only if worker is disabled
    // Doesn't work if job_worker enabled because queue.worker is disabled
    const authProjectUserDeleteKey = resolveEventKey('project_user.delete', false);
    winston.debug('ActivityArchiver authProjectUserDeleteKey: ' + authProjectUserDeleteKey);

    authEvent.on(authProjectUserDeleteKey, function (event) {
      setImmediate(() => {
        if (event.skipArchive) {
          return 0;
        }

        let activity = new Activity({
          id_project: event.req.projectid,
          actor: {
            type: "user",
            id: event.req.user.id,
            name: event.req.user.fullName
          },
          verb: "PROJECT_USER_DELETE",
          actionObj: event.req.body,
          target: {
            type: "project_user",
            id: event.req.params.project_userid,
            object: event.project_userPopulated.toObject()
          }
        });
        save(activity);
      });
    });


    // ********** REQUEST EVENTS **********

    const requestCreateKey = resolveEventKey('request.create', requestEvent.queueEnabled);
    winston.debug('ActivityArchiver requestCreateKey: ' + requestCreateKey);

    requestEvent.on(requestCreateKey, function (request) {
      setImmediate(() => {
        winston.debug('ActivityArchiver requestCreate triggered');

        try {

          if (request.preflight === true) {
            winston.debug("preflight request disable archiver")
            return 0;
          }
          let activity = new Activity({
            id_project: request.id_project,
            actor: {
              type: "user",
              id: request.requester_id,
              name: request.requester_name
            },
            verb: "REQUEST_CREATE",
            actionObj: request,
            target: {
              type: "request",
              id: request._id,
              object: request
            }
          });
          save(activity);

        } catch (e) {
          winston.error('ActivityArchiver error saving activity', e);
        }
      });
    });


    const requestUpdatePreflightKey = resolveEventKey('request.update.preflight', requestEvent.queueEnabled);
    winston.debug('ActivityArchiver requestUpdatePreflightKey: ' + requestUpdatePreflightKey);

    requestEvent.on(requestUpdatePreflightKey, function (request) {
      winston.debug('ActivityArchiver request.update.preflight: ');

      setImmediate(() => {

        try {

          if (request.preflight === true) {
            winston.debug("preflight request disable archiver")
            return 0;
          }
          let activity = new Activity({
            id_project: request.id_project,
            actor: {
              type: "user",
              id: request.requester_id,
              name: request.requester_name
            },
            verb: "REQUEST_CREATE",
            actionObj: request,
            target: {
              type: "request",
              id: request._id,
              object: request
            }
          });
          that.save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving activity', e);
        }
      });
    });


    const requestCloseKey = resolveEventKey('request.close', requestEvent.queueEnabled);
    winston.debug('ActivityArchiver requestCloseKey: ' + requestCloseKey);

    requestEvent.on(requestCloseKey, function (request) {

      setImmediate(() => {

        try {
          winston.debug('ActivityArchiver close');

          let activity = new Activity({
            id_project: request.id_project,
            actor: {
              type: "user",
              id: request.closed_by,
              name: request.closed_by_name
            },
            verb: "REQUEST_CLOSE",
            actionObj: request,
            target: {
              type: "request",
              id: request._id,
              object: request
            }
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving activity', e);
        }
      });
    });

    // Chatbot activities (routes/faq_kb.js)
    var faqbotDeleteActivityKey = 'faqbot.delete.activity';
    if (botEvent.queueEnabled) {
      faqbotDeleteActivityKey = 'faqbot.delete.activity.queue';
    }
    botEvent.on(faqbotDeleteActivityKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var faq_kb = event.faq_kb;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'CHATBOT_DELETE',
          actionObj: {},
          target: { type: 'chatbot', id: event.chatbot_id, object: faq_kb?.toObject ? faq_kb.toObject() : faq_kb },
          id_project: event.id_project
        });
        that.save(activity);
      });
    });

    var faqbotPublishActivityKey = 'faqbot.publish.activity';
    if (botEvent.queueEnabled) {
      faqbotPublishActivityKey = 'faqbot.publish.activity.queue';
    }
    botEvent.on(faqbotPublishActivityKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'CHATBOT_PUBLISH',
          actionObj: { root_id: event.id_faq_kb, bot_id: event.forkedChatBotId, release_note: event.release_note },
          target: { type: 'chatbot', id: event.id_faq_kb, object: { bot_id: event.forkedChatBotId } },
          id_project: event.id_project
        });
        that.save(activity);
      });
    });

    // KB activities (routes/kb.js)
    var kbNamespaceCreateKey = 'kb.namespace.create';
    if (kbEvent.queueEnabled) {
      kbNamespaceCreateKey = 'kb.namespace.create.queue';
    }
    kbEvent.on(kbNamespaceCreateKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var savedNamespace = event.savedNamespace;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'KB_NAMESPACE_CREATE',
          actionObj: { name: event.body?.name },
          target: { type: 'kb_namespace', id: String(event.namespace_id), object: savedNamespace?.toObject ? savedNamespace.toObject() : savedNamespace },
          id_project: event.project_id
        });
        that.save(activity);
      });
    });

    var kbNamespaceDeleteKey = 'kb.namespace.delete';
    if (kbEvent.queueEnabled) {
      kbNamespaceDeleteKey = 'kb.namespace.delete.queue';
    }
    kbEvent.on(kbNamespaceDeleteKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var namespace = event.namespace;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'KB_NAMESPACE_DELETE',
          actionObj: { namespace: event.namespace_id, deletedContentsCount: event.deletedCount },
          target: { type: 'kb_namespace', id: event.namespace_id, object: namespace?.toObject ? namespace.toObject() : {} },
          id_project: event.project_id
        });
        that.save(activity);
      });
    });

    var kbContentsDeleteKey = 'kb.contents.delete';
    if (kbEvent.queueEnabled) {
      kbContentsDeleteKey = 'kb.contents.delete.queue';
    }
    kbEvent.on(kbContentsDeleteKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'KB_CONTENTS_DELETE',
          actionObj: { namespace: event.namespace_id, deletedCount: event.deletedCount },
          target: { type: 'kb_namespace', id: event.namespace_id, object: { namespace: event.namespace_id } },
          id_project: event.project_id
        });
        that.save(activity);
      });
    });

    var kbContentDeleteKey = 'kb.content.delete';
    if (kbEvent.queueEnabled) {
      kbContentDeleteKey = 'kb.content.delete.queue';
    }
    kbEvent.on(kbContentDeleteKey, function (event) {
      setImmediate(() => {
        if (!event.req?.user) return;
        var actorId = event.req.user.id || event.req.user._id;
        var kb = event.kb;
        var activity = new Activity({
          actor: { type: 'user', id: actorId, name: event.req.user.fullName },
          verb: 'KB_CONTENT_DELETE',
          actionObj: { namespace: event.namespace_id },
          target: { type: 'kb_content', id: event.kb_id, object: kb?.toObject ? kb.toObject() : { _id: event.kb_id, namespace: event.namespace_id } },
          id_project: event.project_id
        });
        console.log("kb.content.delete activity: ", activity);
        that.save(activity);
      });
    });


    const requestAssignedKey = resolveEventKey('request.assigned', requestEvent.queueEnabled);
    winston.debug('ActivityArchiver requestAssignedKey: ' + requestAssignedKey);

    requestEvent.on(requestAssignedKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.request) {
            return winston.debug('ActivityArchiver skipping request.assigned: missing request');
          }

          const verb = assignmentContextUtil.verbFromAssignmentType(data.assignmentType);
          if (!verb) {
            return winston.debug('ActivityArchiver skipping request.assigned: unknown assignmentType', data.assignmentType);
          }

          const activity = new Activity({
            id_project: data.request.id_project,
            actor: data.actor || assignmentContextUtil.systemActor(),
            verb: verb,
            actionObj: {
              assigneeId: data.assigneeId,
              assignmentType: data.assignmentType,
              source: data.source,
              previousAssigneeId: data.previousAssigneeId,
              removedParticipants: data.removedParticipants
            },
            target: {
              type: 'request',
              id: data.request._id,
              object: data.request
            }
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving request.assigned activity', e);
        }
      });
    });


    winston.info('ActivityArchiver listening');

  }
}

var activityArchiver = new ActivityArchiver();
module.exports = activityArchiver;