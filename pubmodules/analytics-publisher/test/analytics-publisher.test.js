// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const { expect } = require('chai');

// Intercept analyticsClient.track BEFORE requiring the publisher so the
// reference destructured inside the module body is our spy. No DB or broker
// is touched: the publisher's listeners are pure (event in -> track() out).
const analyticsClient = require('../../../lib/analyticsClient');
const uuidv5 = require('uuid/v5');

// Must match apps/backfill BACKFILL_UUID_NAMESPACE.
const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const calls = [];
analyticsClient.track = function (eventType, idProject, payload, eventId) {
  calls.push({ eventType: eventType, idProject: idProject, payload: payload, eventId: eventId });
};

// Fresh require so the module captures the patched track().
delete require.cache[require.resolve('../index')];
const publisher = require('../index');

const requestEvent = require('../../../event/requestEvent');
const messageEvent = require('../../../event/messageEvent');
const authEvent = require('../../../event/authEvent');

function callsFor(type) {
  return calls.filter((c) => c.eventType === type);
}

describe('analytics-publisher', function () {
  before(function () {
    publisher.listen();
  });

  beforeEach(function () {
    calls.length = 0;
  });

  describe('message.sent', function () {
    it('propagates department (id) and channel (name) from the populated request', function () {
      messageEvent.emit('message.create', {
        _id: 'msg-1',
        id_project: 'proj-1',
        recipient: 'req-1',
        sender: 'agent-1',
        type: 'text',
        request: {
          participantsAgents: ['agent-1'],
          participantsBots: [],
          department: { _id: 'dept-9', name: 'Sales' },
          channel: { name: 'whatsapp' },
        },
      });

      const sent = callsFor('message.sent');
      expect(sent).to.have.length(1);
      expect(sent[0].payload.department).to.equal('dept-9');
      expect(sent[0].payload.channel).to.equal('whatsapp');
    });

    it('sets department/channel to null when the message has no request', function () {
      messageEvent.emit('message.create', {
        _id: 'msg-2',
        id_project: 'proj-1',
        recipient: 'req-2',
        sender: 'visitor-1',
        type: 'text',
        // no .request (direct/group message)
      });

      const sent = callsFor('message.sent');
      expect(sent).to.have.length(1);
      expect(sent[0].payload.department).to.equal(null);
      expect(sent[0].payload.channel).to.equal(null);
    });
  });

  describe('conversation.satisfaction', function () {
    it('emits on request.satisfaction with a valid 1-5 rating', function () {
      requestEvent.emit('request.satisfaction', {
        request: {
          request_id: 'req-3',
          id_project: 'proj-1',
          rating: 4,
          rating_message: 'good',
        },
        patch: { rating: 4 },
      });

      const sat = callsFor('conversation.satisfaction');
      expect(sat).to.have.length(1);
      expect(sat[0].idProject).to.equal('proj-1');
      expect(sat[0].payload).to.deep.equal({
        id_request: 'req-3',
        request_id: 'req-3',
        rating: 4,
        rating_message: 'good',
      });
    });

    it('does not emit for an out-of-range rating', function () {
      requestEvent.emit('request.satisfaction', {
        request: { request_id: 'req-4', id_project: 'proj-1', rating: 9 },
        patch: { rating: 9 },
      });
      expect(callsFor('conversation.satisfaction')).to.have.length(0);
    });
  });

  describe('conversation.closed', function () {
    it('omits the (stripped, superseded) satisfaction_rating field', function () {
      requestEvent.emit('request.close', {
        request_id: 'req-5',
        id_project: 'proj-1',
        createdAt: new Date(Date.now() - 60000),
        closed_at: new Date(),
        rating: 5,
      });

      const closed = callsFor('conversation.closed');
      expect(closed).to.have.length(1);
      expect(closed[0].payload).to.not.have.property('satisfaction_rating');
    });
  });

  describe('conversation.tag_added', function () {
    it('emits on request.updated with comment TAG_ADD (object tag)', function () {
      requestEvent.emit('request.updated', {
        comment: 'TAG_ADD',
        request: { request_id: 'req-6', id_project: 'proj-1' },
        patch: { tags: { tag: 'urgent' } },
      });

      const tagged = callsFor('conversation.tag_added');
      expect(tagged).to.have.length(1);
      expect(tagged[0].payload).to.deep.equal({ id_request: 'req-6', tag: 'urgent' });
    });

    it('extracts a plain string tag from the patch', function () {
      requestEvent.emit('request.updated', {
        comment: 'TAG_ADD',
        request: { request_id: 'req-7', id_project: 'proj-1' },
        patch: { tags: 'vip' },
      });

      const tagged = callsFor('conversation.tag_added');
      expect(tagged).to.have.length(1);
      expect(tagged[0].payload.tag).to.equal('vip');
    });

    it('does not emit for TAG_REMOVE or other comments', function () {
      requestEvent.emit('request.updated', {
        comment: 'TAG_REMOVE',
        request: { request_id: 'req-8', id_project: 'proj-1' },
        patch: { tags: { tag: 'urgent' } },
      });
      requestEvent.emit('request.updated', {
        comment: 'PATCH',
        request: { request_id: 'req-9', id_project: 'proj-1' },
        patch: { status: 200 },
      });
      expect(callsFor('conversation.tag_added')).to.have.length(0);
    });
  });

  // handover_to_human is owned by tiledesk-chatbot (DirMoveToAgent), which emits
  // it reliably with full context (reason / agent_id / trigger_intent). The
  // server's participants-diff signal was routing-dependent (missed queue/pool
  // handovers) and double-counted bot escalations, so it is intentionally NOT
  // emitted here.
  describe('handover_to_human (owned by tiledesk-chatbot)', function () {
    it('does not emit handover_to_human on a bot->human participants update', function () {
      requestEvent.emit('request.participants.update', {
        request: { request_id: 'req-h1', id_project: 'proj-1', department: 'dept-1' },
        removedParticipants: ['bot_5e9d'],
        addedParticipants: ['agent_7f2a'],
      });
      expect(callsFor('handover_to_human')).to.have.length(0);
    });
  });

  // Deterministic event_ids let live + backfill events for the same entity
  // collapse to one row (idempotency). Keys must match the backfill mappers.
  describe('deterministic event_ids', function () {
    it('conversation.created -> uuidv5(request_id)', function () {
      requestEvent.emit('request.create', {
        request_id: 'req-c1', id_project: 'proj-1', participants: [], hasBot: false,
        channel: { name: 'web' },
      });
      const c = callsFor('conversation.created');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('req-c1', NS));
    });

    it('conversation.closed -> uuidv5(request_id:closed)', function () {
      requestEvent.emit('request.close', {
        request_id: 'req-c2', id_project: 'proj-1',
        createdAt: new Date(Date.now() - 1000), closed_at: new Date(),
      });
      const c = callsFor('conversation.closed');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('req-c2:closed', NS));
    });

    it('conversation.satisfaction -> uuidv5(request_id:satisfaction)', function () {
      requestEvent.emit('request.satisfaction', {
        request: { request_id: 'req-c3', id_project: 'proj-1', rating: 5 },
      });
      const c = callsFor('conversation.satisfaction');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('req-c3:satisfaction', NS));
    });

    it('conversation.tag_added -> uuidv5(request_id:tag)', function () {
      requestEvent.emit('request.updated', {
        comment: 'TAG_ADD', request: { request_id: 'req-c4', id_project: 'proj-1' },
        patch: { tags: { tag: 'vip' } },
      });
      const c = callsFor('conversation.tag_added');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('req-c4:vip', NS));
    });

    it('message.sent -> uuidv5(id_message)', function () {
      messageEvent.emit('message.create', {
        _id: 'msg-c5', id_project: 'proj-1', recipient: 'req-c5', sender: 'u1', type: 'text',
      });
      const c = callsFor('message.sent');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('msg-c5', NS));
    });

    it('project_user.activated -> uuidv5(id_project:pu_id:activated)', function () {
      authEvent.emit('project_user.invite', {
        savedProject_userPopulated: {
          _id: 'pu-c6', id_project: 'proj-1', role: 'agent',
          id_user: { _id: 'user-c6', email: 'a@b.com' },
        },
      });
      const c = callsFor('project_user.activated');
      expect(c).to.have.length(1);
      expect(c[0].eventId).to.equal(uuidv5('proj-1:pu-c6:activated', NS));
    });
  });
});
