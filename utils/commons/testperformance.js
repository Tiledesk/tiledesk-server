
var mongoose = require('mongoose');

var Request = require("./models/request");
var User = require("./models/user");
var faqkb = require("./models/faq_kb");
var department = require("./models/department");
var lead = require("./models/lead");

mongoose.connect("mongodb://localhost:27017/tiledesk", { "useNewUrlParser": true, "autoIndex": false }, function(err) {
  if (err) { return winston.error('Failed to connect to MongoDB on '+databaseUri);}
});

(async () => {
try {
var query = { } ;
// var query = { id_project: '5e7fc0d5045a6a5021a7e4be','$or':[ { 'agents.id_user': '5e9eab435170bc3889c948ce' },{ participants: '5e9eab435170bc3889c948ce' } ] } ;
    //console.log("start",new Date())
        var started = new Date();    
var rs = await Request      
    .find(query)    
    .populate('lead')
    .populate('department')
    .populate('participatingBots')
    .populate('participatingAgents')  
    .populate({path:'requester',populate:{path:'id_user'}})
    .sort({updatedAt: 'desc'})
    .limit(1000).lean()
   .exec();
   //  .exec( function(err, requests) {
   //     console.log("requests",requests);
   //  });   
   console.log("end rs", rs,rs.length,started, new Date()); 
} catch (e) {
console.log(e);
  }
 
})();

function wait () {
//   if (!EXITCONDITION)
        setTimeout(wait, 1000);
};
wait();


