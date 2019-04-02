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

var ActivitySchema = new Schema({
  
  actor: { 
    // type: String,
    type: Object,
    required: true,
    index: true
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
    index: true
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

module.exports = mongoose.model('activity', ActivitySchema);
