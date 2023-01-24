var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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

ActivitySchema.index({id_project: 1, createdAt: -1});

// TODO metti indice per query è lentina

module.exports = mongoose.model('activity', ActivitySchema);
