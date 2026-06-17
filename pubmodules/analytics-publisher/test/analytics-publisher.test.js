// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const { expect } = require('chai');

// Intercept analyticsClient.track BEFORE requiring the publisher so the
// reference destructured inside the module body is our spy. No DB or broker
// is touched: the publisher's listeners are pure (event in -> track() out).
const analyticsClient = require('../../../lib/analyticsClient');

const calls = [];
analyticsClient.track = function (eventType, idProject, payload) {
  calls.push({ eventType: eventType, idProject: idProject, payload: payload });
};

// Fresh require so the module captures the patched track().
delete require.cache[require.resolve('../index')];
const publisher = require('../index');

const requestEvent = require('../../../event/requestEvent');
const messageEvent = require('../../../event/messageEvent');

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
});
