'use strict';

const assert = require('assert');
const activityTargetUtil = require('../activityTargetUtil');
const activityMessageUtil = require('../activityMessageUtil');

describe('activityTargetUtil', function () {

  const request = {
    _id: 'req123',
    request_id: 'support-group-abc',
    subject: 'Quanto costa l\'abbonamento?',
    first_text: 'Quanto costa l\'abbonamento?',
    participatingAgents: [{
      _id: '661e366ccba3c70013202856',
      firstname: 'Giovanni',
      lastname: 'Rossi'
    }]
  };

  it('builds user target for auto assignment', function () {
    const data = {
      assigneeId: '661e366ccba3c70013202856',
      assigneeType: 'user',
      request: request
    };
    const target = activityTargetUtil.buildAssignmentTarget(data, 'REQUEST_ASSIGNED_AUTO');

    assert.equal(target.type, 'user');
    assert.equal(target.id, '661e366ccba3c70013202856');
    assert.equal(target.object.id_user._id, '661e366ccba3c70013202856');
    assert.equal(target.object.id_user.firstname, 'Giovanni');
  });

  it('keeps request target for self join', function () {
    const data = {
      assigneeId: '661e366ccba3c70013202856',
      assigneeType: 'user',
      request: request
    };
    const target = activityTargetUtil.buildAssignmentTarget(data, 'REQUEST_ASSIGNED_SELF');

    assert.equal(target.type, 'request');
    assert.equal(target.object.subject, request.subject);
  });

  it('puts conversation in actionObj without noisy empty fields', function () {
    const data = {
      assigneeId: '661e366ccba3c70013202856',
      assigneeType: 'user',
      assignmentType: 'auto',
      previousAssigneeId: null,
      removedParticipants: [],
      request: request
    };
    const actionObj = activityTargetUtil.buildAssignmentActionObj(data, { source: 'system' });

    assert.equal(actionObj.source, 'system');
    assert.equal(actionObj.conversation.subject, request.subject);
    assert.equal(actionObj.assigneeId, undefined);
    assert.equal(actionObj.previousAssigneeId, undefined);
    assert.equal(actionObj.removedParticipants, undefined);
  });
});

describe('activityMessageUtil', function () {

  it('builds auto assignment message with user target and conversation actionObj', function () {
    const activity = {
      actor: { type: 'system', id: 'system', name: 'System' },
      verb: 'REQUEST_ASSIGNED_AUTO',
      actionObj: {
        source: 'system',
        conversation: {
          subject: 'Quanto costa l\'abbonamento?',
          request_id: 'support-group-abc'
        }
      },
      target: {
        type: 'user',
        id: '661e366ccba3c70013202856',
        object: {
          id_user: {
            _id: '661e366ccba3c70013202856',
            firstname: 'Giovanni',
            lastname: 'Rossi'
          }
        }
      }
    };

    const message = activityMessageUtil.buildDefaultActivityMessage(activity);
    assert.ok(message.includes('System assigned conversation "Quanto costa l\'abbonamento?" to Giovanni Rossi'));
  });

  it('supports legacy assignment records', function () {
    const activity = {
      actor: { type: 'system', id: 'system', name: 'System' },
      verb: 'REQUEST_ASSIGNED_AUTO',
      actionObj: {
        source: 'system',
        assigneeId: '661e366ccba3c70013202856',
        assigneeName: 'Giovanni Rossi'
      },
      target: {
        type: 'request',
        id: 'req123',
        object: {
          first_text: 'Quanto costa l\'abbonamento?',
          request_id: 'support-group-abc'
        }
      }
    };

    const message = activityMessageUtil.buildDefaultActivityMessage(activity);
    assert.ok(message.includes('Giovanni Rossi'));
    assert.ok(message.includes('Quanto costa l\'abbonamento?'));
  });

  it('builds active availability system message', function () {
    const activity = {
      actor: { type: 'system', id: 'system', name: 'System' },
      verb: 'PROJECT_USER_AVAILABILITY_SYSTEM',
      actionObj: { newStatus: 'available' },
      target: {
        type: 'project_user',
        object: {
          id_user: {
            _id: '661e366ccba3c70013202856',
            firstname: 'Giovanni',
            lastname: 'Rossi'
          }
        }
      }
    };

    const message = activityMessageUtil.buildDefaultActivityMessage(activity);
    assert.equal(message, 'System set Giovanni Rossi availability status to available');
  });
});
