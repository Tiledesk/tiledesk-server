const authEvent = require('../../event/authEvent');
const requestEvent = require('../../event/requestEvent');
const botEvent = require('../../event/botEvent');
const kbEvent = require('../../event/kbEvent');
const assignmentContextUtil = require('../../utils/assignmentContextUtil');
const projectUserUpdateContextUtil = require('../../utils/projectUserUpdateContextUtil');
const activityActorUtil = require('../../utils/activityActorUtil');
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

function toObject(doc) {
  if (!doc) {
    return doc;
  }
  if (doc.toObject) {
    return doc.toObject();
  }
  return doc;
}

function faqKbTarget(chatbot) {
  const object = toObject(chatbot);
  return {
    type: 'faq_kb',
    id: activityActorUtil.resolveId(object && object._id),
    object: object
  };
}

function namespaceTarget(namespaceId, namespaceObject) {
  const object = namespaceObject ? toObject(namespaceObject) : { id: namespaceId };
  return {
    type: 'kb_namespace',
    id: activityActorUtil.resolveId(namespaceId || (object && object.id)),
    object: object
  };
}

function kbContentTarget(kbId, kbObject) {
  const object = kbObject ? toObject(kbObject) : { _id: kbId };
  return {
    type: 'kb_content',
    id: activityActorUtil.resolveId(kbId || (object && object._id)),
    object: object
  };
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

        const fallbackTargetUserId = projectUserUpdateContextUtil.resolveUserId(
          project_user.id_user && project_user.id_user._id ? project_user.id_user : project_user.id_user
        );
        let updateContext = event.updateContext || projectUserUpdateContextUtil.buildProjectUserUpdateContext(
          event.req,
          event.previousUserAvailable,
          event.previousProfileStatus,
          fallbackTargetUserId
        );
        if (event.previousUserAvailable !== undefined && updateContext.previousUserAvailable === undefined) {
          updateContext.previousUserAvailable = event.previousUserAvailable;
        }
        if (event.previousProfileStatus !== undefined && updateContext.previousProfileStatus === undefined) {
          updateContext.previousProfileStatus = event.previousProfileStatus;
        }
        let verb = projectUserUpdateContextUtil.verbForProjectUserUpdate(event.req.body, updateContext);
        const reconciled = projectUserUpdateContextUtil.reconcileAvailabilityVerb(
          event,
          project_user,
          verb,
          updateContext
        );
        verb = reconciled.verb;
        updateContext = reconciled.updateContext;
        const actor = reconciled.actor ||
          projectUserUpdateContextUtil.actorFromProjectUserUpdate(event, verb, updateContext);
        const newStatus = projectUserUpdateContextUtil.availabilityStatusLabel({
          user_available: project_user.user_available,
          profileStatus: project_user.profileStatus
        });

        var activity = new Activity({
          id_project: event.updatedProject_userPopulated.id_project,
          actor: actor,
          verb: verb,
          actionObj: Object.assign({}, event.req.body, {
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
          save(activity);
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
              assigneeName: data.assigneeName,
              assigneeType: data.assigneeType || 'user',
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


    // ********** CHATBOT / FAQ_KB EVENTS **********

    const faqbotCreatedKey = resolveEventKey('faqbot.created', botEvent.queueEnabled);
    winston.debug('ActivityArchiver faqbotCreatedKey: ' + faqbotCreatedKey);

    botEvent.on(faqbotCreatedKey, function (data) {
      setImmediate(() => {
        try {
          const chatbot = data && (data.chatbot || data);
          if (!chatbot || !(data.id_project || chatbot.id_project)) {
            return winston.debug('ActivityArchiver skipping faqbot.created: missing chatbot');
          }

          const activity = new Activity({
            id_project: data.id_project || chatbot.id_project,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'FAQ_KB_CREATE',
            actionObj: {
              name: chatbot.name,
              type: chatbot.type,
              subtype: chatbot.subtype
            },
            target: faqKbTarget(chatbot)
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving faqbot.created activity', e);
        }
      });
    });

    const faqbotDeletedKey = resolveEventKey('faqbot.deleted', botEvent.queueEnabled);
    winston.debug('ActivityArchiver faqbotDeletedKey: ' + faqbotDeletedKey);

    botEvent.on(faqbotDeletedKey, function (data) {
      setImmediate(() => {
        try {
          const chatbot = data && data.chatbot;
          if (!chatbot || !chatbot.id_project) {
            return winston.debug('ActivityArchiver skipping faqbot.deleted: missing chatbot');
          }

          const activity = new Activity({
            id_project: chatbot.id_project,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'FAQ_KB_DELETE',
            actionObj: {
              name: chatbot.name,
              type: chatbot.type
            },
            target: faqKbTarget(chatbot)
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving faqbot.deleted activity', e);
        }
      });
    });

    const faqbotPublishKey = resolveEventKey('faqbot.publish', botEvent.queueEnabled);
    winston.debug('ActivityArchiver faqbotPublishKey: ' + faqbotPublishKey);

    botEvent.on(faqbotPublishKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.chatbot || !data.chatbot.id_project) {
            return winston.debug('ActivityArchiver skipping faqbot.publish: missing chatbot');
          }

          const activity = new Activity({
            id_project: data.chatbot.id_project,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'FAQ_KB_PUBLISH',
            actionObj: {
              name: data.chatbot.name,
              publishedBotId: data.publishedBotId,
              release_note: data.release_note
            },
            target: faqKbTarget(data.chatbot)
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving faqbot.publish activity', e);
        }
      });
    });


    // ********** KB / NAMESPACE EVENTS **********

    const kbNamespaceCreateKey = resolveEventKey('kb.namespace.create', kbEvent.queueEnabled);
    winston.debug('ActivityArchiver kbNamespaceCreateKey: ' + kbNamespaceCreateKey);

    kbEvent.on(kbNamespaceCreateKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.project_id || !data.savedNamespace) {
            return winston.debug('ActivityArchiver skipping kb.namespace.create: missing data');
          }

          const activity = new Activity({
            id_project: data.project_id,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'KB_NAMESPACE_CREATE',
            actionObj: {
              namespaceName: data.savedNamespace.name,
              hybrid: data.savedNamespace.hybrid,
              default: data.savedNamespace.default === true
            },
            target: namespaceTarget(data.namespace_id || data.savedNamespace.id, data.savedNamespace)
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving kb.namespace.create activity', e);
        }
      });
    });

    const kbNamespaceDeleteKey = resolveEventKey('kb.namespace.delete', kbEvent.queueEnabled);
    winston.debug('ActivityArchiver kbNamespaceDeleteKey: ' + kbNamespaceDeleteKey);

    kbEvent.on(kbNamespaceDeleteKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.project_id || !data.namespace_id) {
            return winston.debug('ActivityArchiver skipping kb.namespace.delete: missing data');
          }

          const activity = new Activity({
            id_project: data.project_id,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'KB_NAMESPACE_DELETE',
            actionObj: {
              namespaceName: data.namespace_name,
              deletedCount: data.deletedCount
            },
            target: namespaceTarget(data.namespace_id, { id: data.namespace_id, name: data.namespace_name })
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving kb.namespace.delete activity', e);
        }
      });
    });

    const kbContentsAddKey = resolveEventKey('kb.contents.add', kbEvent.queueEnabled);
    winston.debug('ActivityArchiver kbContentsAddKey: ' + kbContentsAddKey);

    kbEvent.on(kbContentsAddKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.project_id || !data.namespace_id) {
            return winston.debug('ActivityArchiver skipping kb.contents.add: missing data');
          }

          const activity = new Activity({
            id_project: data.project_id,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'KB_CONTENTS_ADD',
            actionObj: {
              contentAddType: data.contentAddType,
              namespaceName: data.namespace_name,
              count: data.count,
              type: data.type,
              source: data.source
            },
            target: namespaceTarget(data.namespace_id, { id: data.namespace_id, name: data.namespace_name })
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving kb.contents.add activity', e);
        }
      });
    });

    const kbContentsDeleteKey = resolveEventKey('kb.contents.delete', kbEvent.queueEnabled);
    winston.debug('ActivityArchiver kbContentsDeleteKey: ' + kbContentsDeleteKey);

    kbEvent.on(kbContentsDeleteKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.project_id || !data.namespace_id) {
            return winston.debug('ActivityArchiver skipping kb.contents.delete: missing data');
          }

          const activity = new Activity({
            id_project: data.project_id,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'KB_CONTENTS_DELETE',
            actionObj: {
              namespaceName: data.namespace_name,
              deletedCount: data.deletedCount,
              deleteMode: data.deleteMode || 'contents_only'
            },
            target: namespaceTarget(data.namespace_id, { id: data.namespace_id, name: data.namespace_name })
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving kb.contents.delete activity', e);
        }
      });
    });


    const kbContentDeleteKey = resolveEventKey('kb.content.delete', kbEvent.queueEnabled);
    winston.debug('ActivityArchiver kbContentDeleteKey: ' + kbContentDeleteKey);

    kbEvent.on(kbContentDeleteKey, function (data) {
      setImmediate(() => {
        try {
          if (!data || !data.project_id || !data.kb_id) {
            return winston.debug('ActivityArchiver skipping kb.content.delete: missing data');
          }

          const kb = data.kb || {};
          const activity = new Activity({
            id_project: data.project_id,
            actor: activityActorUtil.actorFromReq(data.req),
            verb: 'KB_CONTENT_DELETE',
            actionObj: {
              name: kb.name,
              source: kb.source,
              type: kb.type,
              namespaceId: data.namespace_id,
              namespaceName: data.namespace_name
            },
            target: kbContentTarget(data.kb_id, kb)
          });
          save(activity);
        } catch (e) {
          winston.error('ActivityArchiver error saving kb.content.delete activity', e);
        }
      });
    });


    winston.info('ActivityArchiver listening');

  }
}

var activityArchiver = new ActivityArchiver();
module.exports = activityArchiver;