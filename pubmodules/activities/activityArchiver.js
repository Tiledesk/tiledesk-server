const authEvent = require('../../event/authEvent');
const requestEvent = require('../../event/requestEvent');
const assignmentContextUtil = require('../../utils/assignmentContextUtil');
const projectUserUpdateContextUtil = require('../../utils/projectUserUpdateContextUtil');
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

        const fallbackTargetUserId = projectUserUpdateContextUtil.resolveUserId(
          project_user.id_user && project_user.id_user._id ? project_user.id_user : project_user.id_user
        );
        let updateContext = event.updateContext || projectUserUpdateContextUtil.buildProjectUserUpdateContext(
          event.req,
          event.previousUserAvailable,
          event.previousProfileStatus,
          fallbackTargetUserId
        );
        let verb = projectUserUpdateContextUtil.verbForProjectUserUpdate(event.req.body, updateContext);
        const reconciled = projectUserUpdateContextUtil.reconcileAvailabilityVerb(
          event,
          project_user,
          verb,
          updateContext
        );
        verb = reconciled.verb;
        updateContext = reconciled.updateContext;
        const actor = reconciled.actor || projectUserUpdateContextUtil.actorFromUpdateContext(event.req, updateContext);
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