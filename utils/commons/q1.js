
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
let query = {  } ;
    //console.log("start",new Date())
        let started = new Date();    

    
let requests = await Request      
    .find(query)    
    // .populate('lead')
    // .populate('department')
    // .populate('participatingBots')
    // .populate('participatingAgents')  
    // .populate({path:'requester',populate:{path:'id_user'}})
    .sort({updatedAt: 'desc'})
    .limit(1).lean()
   .exec();
   //  .exec( function(err, requests) {
   //     console.log("requests",requests);
   //  });   

   if (requests && requests.length>0) {
    requests.forEach(request => {
    
      if (request.agents && request.agents.length>0) {
        let agentsnew = new Array;
        request.agents.forEach(a => {
          agentsnew.push({id_user: a.id_user})
        });

        console.log("agentsnew",agentsnew);
        request.agents = agentsnew;

      }
     
    });
  }


   console.log("end requests", JSON.stringify(requests),requests.length,started, new Date()); 
} catch (e) {
console.log(e);
  }
 
})();

function wait () {
//   if (!EXITCONDITION)
        setTimeout(wait, 1000);
};
wait();


