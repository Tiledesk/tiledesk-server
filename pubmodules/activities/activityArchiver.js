const authEvent = require('../../event/authEvent');
const requestEvent = require('../../event/requestEvent');
var Activity = require('./models/activity');
var winston = require('../../config/winston');

class ActivityArchiver {

    listen() {

        winston.debug('ActivityArchiver listen');   

        var enabled = process.env.ACTIVITY_HISTORY_ENABLED || "false";
        winston.debug('ActivityArchiver enabled:'+enabled);
    
        if (enabled==="true") {
          winston.debug('ActivityArchiver enabled');
        }else {
          winston.info('ActivityArchiver disabled');
          return 0;
        }

        if (process.env.MONGOOSE_SYNCINDEX) {
          Activity.syncIndexes();
          winston.info("Activity.syncIndexes called");
        }
        
        var that = this;
        
        //modify all to async
      
      
/*
        activityEvent.on('user.verify.email', this.save);
  
        activityEvent.on('group.create', this.save);
        activityEvent.on('group.update', this.save);
        activityEvent.on('group.delete', this.save);

        // activityEvent.on('lead.create', this.save);
        activityEvent.on('lead.update', this.save);
        activityEvent.on('lead.delete', this.save);
        activityEvent.on('lead.download.csv', this.save);
*/
      
        authEvent.on('project_user.invite.pending',  function(event) { 
          setImmediate(() => {
            if (event.skipArchive) {
              return 0;
            }
              var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
              verb: "PROJECT_USER_INVITE", actionObj: event.req.body, 
              target: {type:"pendinginvitation", id:event.savedPendingInvitation._id.toString(), object: event.savedPendingInvitation }, 
              id_project: event.req.projectid });
              that.save(activity);    
               
          });
       
        });
      
        authEvent.on('project_user.invite',  function(event) { 
          setImmediate(() => {
            if (event.skipArchive) {
              return 0;
            }


            var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
                        verb: "PROJECT_USER_INVITE", actionObj: event.req.body, 
                        target: {type:"project_user", id: event.savedProject_userPopulated._id.toString(), object: event.savedProject_userPopulated }, 
                        id_project: event.req.projectid });
              that.save(activity);   
            
          });
        });
      
      
       authEvent.on('project_user.update',  function(event) { 
        setImmediate(() => {         
          console.log("project_user.update");
         /*
         2019-11-20T10:40:52.686991+00:00 app[web.1]: TypeError: Cannot read property '_id' of undefined
*/
          if (event.skipArchive) {
            return 0;
          }

          var project_user = undefined;
          if (event.updatedProject_userPopulated.toObject) {
            project_user = event.updatedProject_userPopulated.toObject() 
          }else {
            project_user = event.updatedProject_userPopulated;
          }
          var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
                verb: "PROJECT_USER_UPDATE", actionObj: event.req.body, 
                target: {type:"project_user", id: event.updatedProject_userPopulated._id.toString(), object: project_user}, 
                id_project: event.req.projectid });
          that.save(activity);    
        
      });
        
       });
      
      authEvent.on('project_user.delete',  function(event) { 
        setImmediate(() => {
          if (event.skipArchive) {
            return 0;
          }

            var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
            verb: "PROJECT_USER_DELETE", actionObj: event.req.body, 
            target: {type:"project_user", id:event.req.params.project_userid, object: event.project_userPopulated.toObject() }, //Error saving activity Maximum call stack size exceeded
            id_project: event.req.projectid });
            that.save(activity);    
          
        });
      });
      

        authEvent.on('user.signin',  function(event) { 
            winston.debug('ActivityArchiver user.login');
          setImmediate(() => {
           
            
            if (event.skipArchive) {
              return 0;
            }

              var activity = new Activity({actor: {type:"user", id: event.user._id, name: event.user.fullName }, 
                      verb: "USER_SIGNIN", actionObj: event.req.body, 
                      target: {type:"user", id:event.user._id.toString(), object: null }, 
                      id_project: '*' });
                that.save(activity);   
            
          });   
        });
        authEvent.on('user.login.error',  function(event) { 
          setImmediate(() => {
            
            if (event.skipArchive) {
              return 0;
            }

              var activity = new Activity({actor: {type:"user"}, 
              verb: "USER_SIGNIN_ERROR", actionObj: event.req.body, 
              target: {type:"user", id:null, object: null }, 
              id_project: '*' });
              that.save(activity);     
            
          });
        });
      
       authEvent.on('user.requestresetpassword',  function(event) {   
        setImmediate(() => {   
         
          if (event.skipArchive) {
            return 0;
          }

            var activity = new Activity({actor: {type:"user", id: event.updatedUser._id, name: event.updatedUser.fullName }, 
              verb: "USER_REQUEST_RESETPASSWORD", actionObj: event.req.body, 
              target: {type:"user", id:event.updatedUser._id.toString(), object: null }, 
              id_project: '*' });
            that.save(activity);       
        
        });
       });
      
      authEvent.on('user.resetpassword',  function(event) {     
        setImmediate(() => {     
         
          if (event.skipArchive) {
            return 0;
          }

          var activity = new Activity({actor: {type:"user", id: event.saveUser._id, name: event.saveUser.fullName }, 
            verb: "USER_RESETPASSWORD", actionObj: null, //req.body otherwise print password  
            target: {type:"user", id:event.saveUser._id.toString(), object: null }, 
            id_project: '*' });
          that.save(activity);     
          
        });
      });
      
      
       authEvent.on('user.signup',  function(event) { 
        setImmediate(() => {      
          if (event.skipArchive) {
            return 0;
          }

            var activity = new Activity({actor: {type:"user", id: event.savedUser._id, name: event.savedUser.fullName }, 
                  verb: "USER_SIGNUP", actionObj: event.req.body, 
                  target: {type:"user", id: event.savedUser._id.toString(), object: null }, 
                  id_project: '*' });
              that.save(activity);      
           
        });
       });
      
      authEvent.on('user.signup.error',  function(event) { 
        setImmediate(() => {     
          if (event.skipArchive) {
            return 0;
          }


          var activity = new Activity({actor: {type:"user"}, 
              verb: "USER_SIGNUP_ERROR", actionObj: event.req.body, 
              target: {type:"user", id:null, object: null }, 
              id_project: '*' });
            that.save(activity);    
          
        });
       });
      
        requestEvent.on('request.create',  function(request) {   
          setImmediate(() => {           
          // problema requester_id

          // Error saving activity  {"_id":"5e06189c6e226d358896d733","actor":{"_id":"5e06189c6e226d358896d734","type":"user","id":null},"verb":"REQUEST_CREATE","actionObj":{"status":200,"participants":["5e06189c6e226d358896d728"],"messages_count":0,"tags":[],"_id":"5e06189c6e226d358896d72e","request_id":"request_id-closeRequest","first_text":"first_text","department":{"routing":"assigned","default":true,"status":1,"_id":"5e06189c6e226d358896d72b","name":"Default Department","id_project":"5e06189c6e226d358896d729","createdBy":"5e06189c6e226d358896d728","createdAt":"2019-12-27T14:43:40.327Z","updatedAt":"2019-12-27T14:43:40.327Z","__v":0},"agents":[{"_id":"5e06189c6e226d358896d72a","id_project":"5e06189c6e226d358896d729","id_user":"5e06189c6e226d358896d728","role":"owner","user_available":true,"createdBy":"5e06189c6e226d358896d728","createdAt":"2019-12-27T14:43:40.324Z","updatedAt":"2019-12-27T14:43:40.324Z","__v":0}],"id_project":"5e06189c6e226d358896d729","createdBy":"requester_id1","channel":{"name":"chat21"},"createdAt":"2019-12-27T14:43:40.586Z","updatedAt":"2019-12-27T14:43:40.586Z","__v":0},"target":{"type":"request","id":"5e06189c6e226d358896d72e","object":{"status":200,"participants":["5e06189c6e226d358896d728"],"messages_count":0,"tags":[],"_id":"5e06189c6e226d358896d72e","request_id":"request_id-closeRequest","first_text":"first_text","department":{"routing":"assigned","default":true,"status":1,"_id":"5e06189c6e226d358896d72b","name":"Default Department","id_project":"5e06189c6e226d358896d729","createdBy":"5e06189c6e226d358896d728","createdAt":"2019-12-27T14:43:40.327Z","updatedAt":"2019-12-27T14:43:40.327Z","__v":0},"agents":[{"_id":"5e06189c6e226d358896d72a","id_project":"5e06189c6e226d358896d729","id_user":"5e06189c6e226d358896d728","role":"owner","user_available":true,"createdBy":"5e06189c6e226d358896d728","createdAt":"2019-12-27T14:43:40.324Z","updatedAt":"2019-12-27T14:43:40.324Z","__v":0}],"id_project":"5e06189c6e226d358896d729","createdBy":"requester_id1","channel":{"name":"chat21"},"createdAt":"2019-12-27T14:43:40.586Z","updatedAt":"2019-12-27T14:43:40.586Z","__v":0}},"id_project":"5e06189c6e226d358896d729"}

          // TODO error: Error saving activity  {"activity":{"_id":"5e273b31f13e801703d52515","actor":{"_id":"5e273b31f13e801703d52516","type":"user","id":null},"verb":"REQUEST_CREATE","actionObj":{"status":200,"participants":["5e273b30f13e801703d52508"],"messages_count":0,"tags":[],"_id":"5e273b31f13e801703d52511","request_id":"request_id1","first_text":"first_text","department":{"routing":"assigned","default":false,"status":1,"_id":"5e273b31f13e801703d5250f","name":"PooledDepartment-for-createWithIdWith","id_project":"5e273b31f13e801703d5250a","createdBy":"5e273b30f13e801703d52507","createdAt":"2020-01-21T17:56:01.471Z","updatedAt":"2020-01-21T17:56:01.471Z","__v":0},"agents":[{"_id":"5e273b31f13e801703d5250b","id_project":"5e273b31f13e801703d5250a","id_user":"5e273b30f13e801703d52507","role":"owner","user_available":true,"createdBy":"5e273b30f13e801703d52507","createdAt":"2020-01-21T17:56:01.465Z","updatedAt":"2020-01-21T17:56:01.465Z","__v":0},{"_id":"5e273b31f13e801703d5250e","id_project":"5e273b31f13e801703d5250a","id_user":"5e273b30f13e801703d52508","role":"agent","user_available":true,"createdBy":"5e273b30f13e801703d52508","createdAt":"2020-01-21T17:56:01.469Z","updatedAt":"2020-01-21T17:56:01.469Z","__v":0}],"id_project":"5e273b31f13e801703d5250a","createdBy":"requester_id1","channel":{"name":"chat21"},"createdAt":"2020-01-21T17:56:01.480Z","updatedAt":"2020-01-21T17:56:01.480Z","__v":0},"target":{"type":"request","id":"5e273b31f13e801703d52511","object":{"status":200,"participants":["5e273b30f13e801703d52508"],"messages_count":0,"tags":[],"_id":"5e273b31f13e801703d52511","request_id":"request_id1","first_text":"first_text","department":{"routing":"assigned","default":false,"status":1,"_id":"5e273b31f13e801703d5250f","name":"PooledDepartment-for-createWithIdWith","id_project":"5e273b31f13e801703d5250a","createdBy":"5e273b30f13e801703d52507","createdAt":"2020-01-21T17:56:01.471Z","updatedAt":"2020-01-21T17:56:01.471Z","__v":0},"agents":[{"_id":"5e273b31f13e801703d5250b","id_project":"5e273b31f13e801703d5250a","id_user":"5e273b30f13e801703d52507","role":"owner","user_available":true,"createdBy":"5e273b30f13e801703d52507","createdAt":"2020-01-21T17:56:01.465Z","updatedAt":"2020-01-21T17:56:01.465Z","__v":0},{"_id":"5e273b31f13e801703d5250e","id_project":"5e273b31f13e801703d5250a","id_user":"5e273b30f13e801703d52508","role":"agent","user_available":true,"createdBy":"5e273b30f13e801703d52508","createdAt":"2020-01-21T17:56:01.469Z","updatedAt":"2020-01-21T17:56:01.469Z","__v":0}],"id_project":"5e273b31f13e801703d5250a","createdBy":"requester_id1","channel":{"name":"chat21"},"createdAt":"2020-01-21T17:56:01.480Z","updatedAt":"2020-01-21T17:56:01.480Z","__v":0}},"id_project":"5e273b31f13e801703d5250a"},"err":{"errors":{"actor.id":{"message":"Path `id` is required.","name":"ValidatorError","properties":{"message":"Path `id` is required.","type":"required","path":"id","value":null},"kind":"required","path":"id","value":null},"actor":{"errors":{"id":{"message":"Path `id` is required.","name":"ValidatorError","properties":{"message":"Path `id` is required.","type":"required","path":"id","value":null},"kind":"required","path":"id","value":null}},"_message":"Validation failed","message":"Validation failed: id: Path `id` is required.","name":"ValidationError"}},"_message":"activity validation failed","message":"activity validation failed: actor.id: Path `id` is required., actor: Validation failed: id: Path `id` is required.","name":"ValidationError"}}

// request is plain object must be mongoose object oto populate

          // if (event.skipArchive) {
          //   return 0;
          // }

          //TODO remove preflight   

              try {

                if (request.preflight === true) {
                  winston.debug("preflight request disable archiver")
                  return 0;
                }
                var activity = new Activity({actor: {type:"user", id: request.requester_id}, 
                verb: "REQUEST_CREATE", actionObj: request, 
                target: {type:"request", id:request._id, object: request }, 
                id_project: request.id_project });
                that.save(activity);    
              } catch(e) {
                winston.error('ActivityArchiver error saving activity',e);
              }
          
                
          });                           
        });


        requestEvent.on('request.update.preflight',  function(request) {   
          setImmediate(() => {           
       
              try {

                if (request.preflight === true) {
                  winston.debug("preflight request disable archiver")
                  return 0;
                }
                var activity = new Activity({actor: {type:"user", id: request.requester_id}, 
                verb: "REQUEST_CREATE", actionObj: request, 
                target: {type:"request", id:request._id, object: request }, 
                id_project: request.id_project });
                that.save(activity);    
              } catch(e) {
                winston.error('ActivityArchiver error saving activity',e);
              }
          
                
          });                           
        });


        

        winston.info('ActivityArchiver listening');

    }

    save(activity) {
        activity.save(function(err, savedActivity) {
            if (err) {
                winston.error('Error saving activity ', {activity: activity.toObject(), err:err});
            }else {
                winston.debug('Activity saved', savedActivity.toObject());
            }
        });
    }
}

var activityArchiver = new ActivityArchiver();


module.exports = activityArchiver;