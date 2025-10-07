
let mongoose = require('mongoose');

let Request = require("./models/request");
let User = require("./models/user");
let faqkb = require("./models/faq_kb");
let department = require("./models/department");
let lead = require("./models/lead");

mongoose.connect("mongodb://localhost:27017/tiledesk", { "useNewUrlParser": true, "autoIndex": false }, function(err) {
  if (err) { return winston.error('Failed to connect to MongoDB on '+databaseUri);}
});

(async () => {
try {
let query = { } ;
// let query = { id_project: '5e7fc0d5045a6a5021a7e4be','$or':[ { 'agents.id_user': '5e9eab435170bc3889c948ce' },{ participants: '5e9eab435170bc3889c948ce' } ] } ;
    //console.log("start",new Date())
        let started = new Date();    
let rs = await Request      
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


