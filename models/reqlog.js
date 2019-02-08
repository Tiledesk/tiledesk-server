var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// db.getCollection('reqlogs').aggregate([ {$group:{_id:{id_project:"$id_project"},  "count":{$sum:1}}},{$sort:{"count":-1}}])
// db.getCollection('projects').find({"_id":ObjectId("5afeaf94404bff0014098f54")})

var ReqLogSchema = new Schema({
  path: {
    type: String,
    index: true 
  },
  ip: {
    type: String,
    index: true 
  },
  id_project: {
    type: String,
    index: true
    //required: true
  }
}, {
    timestamps: true
  }
);

module.exports = mongoose.model('reqLog', ReqLogSchema);
