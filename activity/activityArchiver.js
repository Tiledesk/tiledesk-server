const authEvent = require('../event/authEvent');
const requestEvent = require('../event/requestEvent');
var Activity = require('./models/activity');
var winston = require('../config/winston');

class ActivityArchiver {

    listen() {

        winston.debug('ActivityArchiver listen');

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
         var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
                verb: "PROJECT_USER_INVITE", actionObj: event.req.body, 
                target: {type:"pendinginvitation", id:event.savedPendingInvitation._id.toString(), object: event.savedPendingInvitation }, 
                id_project: event.req.projectid });
        });
      
        authEvent.on('project_user.invite',  function(event) { 
           var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
                      verb: "PROJECT_USER_INVITE", actionObj: event.req.body, 
                      target: {type:"project_user", id: event.savedProject_userPopulated._id.toString(), object: event.savedProject_userPopulated.toObject() }, 
                      id_project: event.req.projectid });
       
        });
      
      
       authEvent.on('project_user.update',  function(event) { 
        var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
              verb: "PROJECT_USER_UPDATE", actionObj: event.req.body, 
              target: {type:"project_user", id: event.updatedProject_user._id.toString(), object: event.updatedProject_userPopulated.toObject() }, 
              id_project: event.req.projectid });
       });
      
      authEvent.on('project_user.delete',  function(event) { 
        var activity = new Activity({actor: {type:"user", id: event.req.user.id, name: event.req.user.fullName }, 
        verb: "PROJECT_USER_DELETE", actionObj: event.req.body, 
        target: {type:"project_user", id:event.req.params.project_userid, object: event.project_userPopulated.toObject() }, //Error saving activity Maximum call stack size exceeded
        id_project: event.req.projectid });
      });
      

        authEvent.on('user.login',  function(event) { 
           var activity = new Activity({actor: {type:"user", id: event.user._id, name: event.user.fullName }, 
                  verb: "USER_SIGNIN", actionObj: event.req.body, 
                  target: {type:"user", id:event.user._id.toString(), object: null }, 
                  id_project: '*' });
          that.save(activity);       
        });
        authEvent.on('user.login.error',  function(event) { 
           var activity = new Activity({actor: {type:"user"}, 
           verb: "USER_SIGNIN_ERROR", actionObj: event.req.body, 
           target: {type:"user", id:null, object: null }, 
           id_project: '*' });
          that.save(activity);       
        });
      
       authEvent.on('user.requestresetpassword',  function(event) {        
          var activity = new Activity({actor: {type:"user", id: event.updatedUser._id, name: event.updatedUser.fullName }, 
            verb: "USER_REQUEST_RESETPASSWORD", actionObj: event.req.body, 
            target: {type:"user", id:event.updatedUser._id.toString(), object: null }, 
            id_project: '*' });
         that.save(activity);       
       });
      
      authEvent.on('user.resetpassword',  function(event) {       
         var activity = new Activity({actor: {type:"user", id: event.saveUser._id, name: event.saveUser.fullName }, 
          verb: "USER_RESETPASSWORD", actionObj: null, //req.body otherwise print password  
          target: {type:"user", id:event.saveUser._id.toString(), object: null }, 
          id_project: '*' });
        that.save(activity);       
      });
      
      
       authEvent.on('user.signup',  function(event) { 
       var activity = new Activity({actor: {type:"user", id: event.savedUser._id, name: event.savedUser.fullName }, 
            verb: "USER_SIGNUP", actionObj: event.req.body, 
            target: {type:"user", id: event.savedUser._id.toString(), object: null }, 
            id_project: '*' });
         that.save(activity);       
       });
      
      authEvent.on('user.signup.error',  function(event) { 
       var activity = new Activity({actor: {type:"user"}, 
           verb: "USER_SIGNUP_ERROR", actionObj: event.req.body, 
           target: {type:"user", id:null, object: null }, 
           id_project: '*' });
        that.save(activity);       
       });
      
        requestEvent.on('request.create',  function(request) {          
            var activity = new Activity({actor: {type:"user", id: request.requester_id}, 
               verb: "REQUEST_CREATE", actionObj: request, 
               target: {type:"request", id:request._id, object: request }, 
               id_project: request.id_project });
               that.save(activity);                                    
        });

        winston.info('ActivityArchiver listening');

    }

    save(activity) {
        activity.save(function(err, savedActivity) {
            if (err) {
                winston.error('Error saving activity ', err);
            }else {
                winston.debug('Activity saved', savedActivity.toObject());
            }
        });
    }
}

var activityArchiver = new ActivityArchiver();
module.exports = activityArchiver;