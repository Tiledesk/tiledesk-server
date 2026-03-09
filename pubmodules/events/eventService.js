'use strict';

var Event = require("./event");
const eventEvent = require('./eventEvent');
const event2Event = require('./event2Event');
var winston = require('../../config/winston');
var Project_user = require('../../models/project_user');

var cacheUtil = require('../../utils/cacheUtil');
var cacheEnabler = require("../../services/cacheEnabler");

const uuidv4 = require('uuid/v4');

class EventService {


  // emit2(name, attributes, id_project, project_user, id_user, createdBy) {

  //   return new Promise(function (resolve, reject) {

  
  //     var newEvent = new Event({
  //       name: name,
  //       attributes: attributes,
  //       id_project: id_project,
  //       project_user: project_user,
  //       id_user: id_user,
  //       createdBy: createdBy,
  //       updatedBy: createdBy
  //     });
    
  //     newEvent.save(function(err, savedEvent) {
  //       if (err) {
  //         winston.error('Error saving the event '+ JSON.stringify(savedEvent), err)
  //         return reject(err);
  //       }
  //       savedEvent.populate('project_user',function (err, savedEventPopulated){
  //         eventEvent.emit('event.emit', savedEventPopulated);
  //         event2Event.emit(name, savedEventPopulated);
  //       });
       
  //       return resolve(savedEvent);
  //     });
  //   });

  // }

  emit(name, attributes, id_project, project_user, createdBy, status, user) {

    return new Promise(function (resolve, reject) {
  
      var id = uuidv4();

      var newEvent = {
        _id: id,
        id: id,
        name: name,
        attributes: attributes,
        id_project: id_project,
        project_user: project_user,
        createdAt: new Date(),
        createdBy: createdBy,
        updatedBy: createdBy,
        status: status
      };
    
      //TODO do not save volatile events
      winston.debug("eventService emit");

     
      winston.info("main_flow_cache_1  eventService emit");

      // old code
      // Project_user.findOne({ _id: project_user }).populate('id_user').exec(function (err, pu) {
        
        
       
      let q = Project_user.findOne({ _id: project_user }).populate('id_user');

      if (cacheEnabler.project_user) {
        var cacheKey =  id_project+":project_users:id:"+project_user;
        winston.info("cacheKey: "+cacheKey);
        q.cache(cacheUtil.defaultTTL, cacheKey);
        winston.debug("cacheEnabler.project_user enabled");
      }
      q.exec(function (err, pu) {
      
      winston.info("eventService pu", pu);




          if (user) {
            newEvent.user = user;
          }else {
            winston.debug("Attention eventService emit user is empty");
          }
          
          newEvent.project_user = pu;

          winston.debug("newEvent", newEvent);
          if (name === 'new_conversation') {
            console.log('[WELCOME_MSG_FLOW] eventService.emit: new_conversation event received', { id_project, request_id: attributes?.request_id });
          }
          eventEvent.emit('event.emit', newEvent);
          eventEvent.emit('event.emit.'+name, newEvent);
          
          event2Event.emit(name, newEvent);
        });

       
        return resolve(newEvent);
    });
  }

  emitPersistent(name, attributes, id_project, project_user, createdBy, status, user) {

    return new Promise(function (resolve, reject) {
  
      var newEvent = new Event({
        name: name,
        attributes: attributes,
        id_project: id_project,
        project_user: project_user,
        createdBy: createdBy,
        updatedBy: createdBy,
        status: status
      });
    
      //TODO do not save volatile events
      winston.debug("eventService emit");

      newEvent.save(function(err, savedEvent) {
        if (err) {
          winston.error('Error saving the event '+ JSON.stringify(savedEvent), err)
          return reject(err);
        }
        savedEvent.populate({path:'project_user', 
          populate:{path:'id_user'}                
        },function (err, savedEventPopulated) {
          
          var savedEventPopulatedJson = savedEventPopulated.toJSON();

          if (user) {
            savedEventPopulatedJson.user = user;
          }else {
            winston.debug("Attention eventService emit user is empty");
          }
          
          savedEventPopulatedJson.id = savedEventPopulatedJson._id;
          winston.debug("savedEventPopulatedJson", savedEventPopulatedJson);
          eventEvent.emit('event.emit', savedEventPopulatedJson);
          eventEvent.emit('event.emit.'+name, savedEventPopulatedJson);
          
          event2Event.emit(name, savedEventPopulatedJson);
        });

       
        return resolve(savedEvent);
      });
    });

  }

}
var eventService = new EventService();




module.exports = eventService;
