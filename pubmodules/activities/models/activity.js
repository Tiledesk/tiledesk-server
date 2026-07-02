var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const DEFAULT_ACTIVITY_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

function ttlSecondsFromEnv(raw, fallbackSec) {
  if (raw == null || String(raw).trim() === '') return fallbackSec;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallbackSec;
}

let expireAfterSeconds = ttlSecondsFromEnv(
  process.env.ACTIVITY_EXPIRATION_TIME,
  DEFAULT_ACTIVITY_TTL_SEC
);

// https://getstream.io/blog/designing-activity-stream-newsfeed-w3c-spec/
// {
//   "@context": "http://www.w3.org/ns/activitystreams",
//   "type": "added",
//   "published": "2015-02-10T15:04:55Z",
//   "actor": {
//    "type": "Person",
//    "id": "http://www.test.example/jack",
//    "name": "Jack Hill",
//    "url": "http://example.org/jack",
//    "image": {
//      "type": "Link",
//      "href": "http://example.org/jack/profile.jpg",
//      "mediaType": "image/jpeg"
//    }
//   },
//   "object" : {
//    "id": "http://www.test.example/jack/hill_photos/the_hill1.jpg",
//    "type": "Photo",
//    "label": "Great Photo of The Hill"
//   },
//   "target" : {
//    "id": "http://example.org/jack/albums/great_hill_pics",
//    "type": "OrderedCollection",
//    "name": "Great Hill Pics"
//   }
//  }

//actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName },
var ActorActivitySchema = new Schema({
  type: { 
    type: String,
    required: true,
    index:true
  },
  id: {
    type: String,
    required: true,
    index:true
  },
  name: {
    type: String,
    required: false
  },
});

// Secondary entity involved in / affected by the activity (a "third party" beyond actor and target).
// Example: "user1 assigned conversation xyz to user2" -> actor=user1, target=conversation, related=user2.
// `role` is kept as a free String (no enum) on purpose, to avoid save failures when new roles appear.
// Suggested role values: 'assignee', 'unassigned_user', 'previous_assignee', 'removed_participant'.
var RelatedActivitySchema = new Schema({
  role: {
    type: String,
    required: false,
    index: true
  },
  type: {
    type: String,
    required: false
  },
  id: {
    type: String,
    required: false,
    index: true
  },
  name: {
    type: String,
    required: false
  },
  object: {
    type: Schema.Types.Mixed,
    required: false
  }
}, { _id: false });

function userIdFromEntity(entity) {
  if (!entity) {
    return null;
  }
  if (entity.object && entity.object.id_user) {
    var u = entity.object.id_user;
    return String((u && (u._id || u.id)) || u);
  }
  if ((entity.type === 'user') && entity.id) {
    return String(entity.id);
  }
  return null;
}

function computeInvolvedUserIds(doc) {
  var ids = new Set();
  if (doc.actor && doc.actor.type === 'user' && doc.actor.id) {
    ids.add(String(doc.actor.id));
  }
  var targetUserId = userIdFromEntity(doc.target);
  if (targetUserId) {
    ids.add(targetUserId);
  }
  var relatedUserId = userIdFromEntity(doc.related);
  if (relatedUserId) {
    ids.add(relatedUserId);
  }
  return Array.from(ids);
}

var ActivitySchema = new Schema({
  
  actor: { 
    // type: String,
    type: ActorActivitySchema,
    required: true,
    //index: true    //error saving activity Btree::insert: key too large to index, failing heroku_hwhg3xtx.activities.$target_1 2359 { : { object: { __v: 0, updatedAt: new Date(1555407053615), createdAt: new Date(1555407053615), request_id: "support-group-Lc_Tz_hoCZ9REHC9FbY", requester_id: "5c8a38012d8e6d0017bce22a", first_text: "test 81", department: ObjectId('5b8eb48b5ca4d300141fb2cb'), sourcePage: "https://www.tiledesk.com/", language: "it", 
  },
  verb: {
    type: String,
    required: true,
    index: true
  },

  actionObj: {
    type: Object,
    required: false
  },
  target: {
    // type: String,
    type: Object,
    required: true,
    // index: true
  },
  related: {
    type: RelatedActivitySchema,
    required: false
  },
  // Denormalized list of user ids involved in the activity (actor, target user, related user).
  // Auto-filled by the pre-save hook below. Indexed for efficient "activities of a user" queries.
  involvedUserIds: {
    type: [String],
    required: false,
    index: true,
    default: undefined
  },
  // summary  A natural language summarization of the object encoded as HTML. Multiple language tagged summaries may be provided.
  // summaryMap https://www.w3.org/TR/activitystreams-vocabulary/#dfn-summary
  id_project: {
    type: String,
    required: true,
    index: true
  }
},{
  timestamps: true
}
);

ActivitySchema.pre('save', function (next) {
  try {
    var ids = computeInvolvedUserIds(this);
    this.involvedUserIds = ids.length > 0 ? ids : undefined;
  } catch (e) {
    // never block saving an activity because of the denormalized field
  }
  next();
});

ActivitySchema.index({ id_project: 1, createdAt: -1 });
ActivitySchema.index({ id_project: 1, 'actor.id': 1, createdAt: -1 });
ActivitySchema.index({ id_project: 1, 'target.object.id_user._id': 1, createdAt: -1 });
ActivitySchema.index({ id_project: 1, involvedUserIds: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: expireAfterSeconds }); 


module.exports = mongoose.model('activity', ActivitySchema);
