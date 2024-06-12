const authEvent = require('../../event/authEvent');
const requestEvent = require('../../event/requestEvent');
var Project = require('../../models/project');
var Project_user = require('../../models/project_user');
var winston = require('../../config/winston');

var ProjectUserUtil = require("../../utils/project_userUtil");

// var request = require('retry-request', {
//     request: require('request')
//   });

// TODO riabilitare questo

// const ROUTE_QUEUE_ENDPOINT = process.env.ROUTE_QUEUE_ENDPOINT;
// winston.debug("ROUTE_QUEUE_ENDPOINT: " + ROUTE_QUEUE_ENDPOINT);

// if (ROUTE_QUEUE_ENDPOINT) {
//   winston.info("Route queue endpoint: " + ROUTE_QUEUE_ENDPOINT);
// } else {
//    winston.info("Route queue endpoint not configured");
// }




// TODO web socket is not supported with queue
class Listener {

 
  constructor() {
    this.enabled = true;
    if (process.env.ROUTE_QUEUE_ENABLED=="false" || process.env.ROUTE_QUEUE_ENABLED==false) {
        this.enabled = false;
    }
    winston.debug("Listener this.enabled: "+ this.enabled);
}

 
      // db.getCollection('project_users').find({"number_assigned_requests" : {"$lt":0}}).count()


    updateProjectUser(id_user, id_project, operation) {
      winston.info("Route queue updateProjectUser start operation: " +operation+ "id_user "+ id_user + " id_project " + id_project );
      return Project_user       
                    .findOneAndUpdate({id_user: id_user, id_project: id_project}, {$inc : {'number_assigned_requests' : operation}}, {new: true, upsert:false}, function(err, updatedPU) {
                    if (err) {
                     return winston.error(err);
                    }
                    winston.info("Route queue number_assigned_requests +1 :" + updatedPU.id);
                     winston.info("Route queue number_assigned_requests +1 :" + updatedPU.id);

                    updatedPU.populate({path:'id_user', select:{'firstname':1, 'lastname':1}},function (err, updatedProject_userPopulated){    

                      var pu = updatedProject_userPopulated.toJSON();

                      return Project.findById(id_project).exec(function(err, project) {
                        pu.isBusy = ProjectUserUtil.isBusy(updatedProject_userPopulated, project.settings && project.settings.max_agent_assigned_chat);                  
                        winston.debug("Route queue pu.isBusy: "+ pu.isBusy);
                                               
                        authEvent.emit('project_user.update', {updatedProject_userPopulated:pu, req: undefined, skipArchive: true}); //if queued with jobs -> websocket notification on project_user.update doesn't work??? forse si in quanto viene convertito in .pub.queue e poi rifunziiona


                        // project_user.update triggers activityArchiver(tested), cache invalidation(tested), subscriptionNotifierQueued and websocket(tested works from queue i trigger ws)
                        if (requestEvent.queueEnabled) {  //force to .queue to be catched into the queue (activity archiver, subscriptionNotifierQueued )
                          authEvent.emit('project_user.update.queue', {updatedProject_userPopulated:pu, req: undefined, skipArchive: true});
                        }

                      })
                      
                    });

                });
    }

    updateParticipatingProjectUsers(request, operation) {
        winston.info("Route queue request.participatingAgents", request.participatingAgents);
        if (request.participatingAgents.length>0) {
            request.participatingAgents.forEach(user => {
              winston.info("request.participatingAgents user",user); //it is a user and not a project_user
                var userid = user.id || user._id;
                winston.info("updateParticipatingProjectUsers userid: "+userid); 

                this.updateProjectUser(userid, request.id_project, operation);                
            });
        } 
      }  

    listen() {

      if (this.enabled==true) {
        winston.info("Route queue with queue Listener listen");
      } else {
          return winston.info("Route queue with queue Listener disabled");
      }

        var that = this;
 
        // TODO fai versione che passa anche project
        var requestCreateKey = 'request.create';
        if (requestEvent.queueEnabled) {
          requestCreateKey = 'request.create.queue';
        }
        winston.info('Route queue requestCreateKey: ' + requestCreateKey);
   
        requestEvent.on(requestCreateKey, async (request) => {
            setImmediate(() => {
              winston.debug('Route queue requestCreate');
              this.updateParticipatingProjectUsers(request, +1);  
            });
        });

          // TODO usa versione complete con project per evitare query??
        var requestCloseKey = 'request.close';   //request.close event here queued under job
        if (requestEvent.queueEnabled) {
          requestCloseKey = 'request.close.queue';
        }
        winston.info('Route queue requestCloseKey: ' + requestCloseKey);

        requestEvent.on(requestCloseKey, async (request) => {    //request.close event here noqueued
          winston.debug("request.close event here 4")
          setImmediate(() => {
            winston.info('Route queue requestClose');
            this.updateParticipatingProjectUsers(request, -1);          
          });
        });


        var requestParticipantsJoinKey = 'request.participants.join';
        if (requestEvent.queueEnabled) {
          requestParticipantsJoinKey = 'request.participants.join.queue';
        }
        winston.info('Route queue  requestParticipantsJoinKey: ' + requestParticipantsJoinKey);
   
        requestEvent.on(requestParticipantsJoinKey, async (data) => {
          winston.info('Route queue ParticipantsJoin', data);

          var request = data.request;
          var member = data.member;
          setImmediate(() => {
            this.updateProjectUser(member, request.id_project, 1);          
          });
        });

        var requestParticipantsLeaveKey = 'request.participants.leave';
        if (requestEvent.queueEnabled) {
          requestParticipantsLeaveKey = 'request.participants.leave.queue';
        }
        winston.info('Route queue  requestParticipantsLeaveKey: ' + requestParticipantsLeaveKey);
   
        requestEvent.on(requestParticipantsLeaveKey, async (data) => {
          winston.info('Route queue ParticipantsLeave', data);

          var request = data.request;
          var member = data.member;
          setImmediate(() => {
            this.updateProjectUser(member, request.id_project, -1);          
          });
        });

        var requestParticipantsUpdateKey = 'request.participants.update';
        if (requestEvent.queueEnabled) {
         requestParticipantsUpdateKey = 'request.participants.update.queue';
        }
        winston.debug('Route queue  requestParticipantsUpdateKey: ' + requestParticipantsUpdateKey);
   
        requestEvent.on(requestParticipantsUpdateKey, async (data) => {
          winston.info('Route queue Participants Update', data);

          var request = data.request;
          var removedParticipants = data.removedParticipants;
          var addedParticipants = data.addedParticipants;

          setImmediate(() => {

            addedParticipants.forEach(participant => {
              winston.debug('addedParticipants participant', participant);
              this.updateProjectUser(participant, request.id_project, 1);          
            });

            removedParticipants.forEach(participant => {
              winston.debug('removedParticipants participant', participant);
              this.updateProjectUser(participant, request.id_project, -1);          
            });

          });
        });

     
       
    }

}

var listener = new Listener();


module.exports = listener;
