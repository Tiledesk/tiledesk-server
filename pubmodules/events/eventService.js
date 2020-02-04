'use strict';

var Event = require("./event");
const eventEvent = require('./eventEvent');
const event2Event = require('./event2Event');
var winston = require('../../config/winston');


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

  emit(name, attributes, id_project, project_user, createdBy) {

    return new Promise(function (resolve, reject) {

  
      var newEvent = new Event({
        name: name,
        attributes: attributes,
        id_project: id_project,
        project_user: project_user,
        createdBy: createdBy,
        updatedBy: createdBy
      });
    
      newEvent.save(function(err, savedEvent) {
        if (err) {
          winston.error('Error saving the event '+ JSON.stringify(savedEvent), err)
          return reject(err);
        }
        savedEvent.populate({path:'project_user',populate:{path:'id_user'}},function (err, savedEventPopulated){
        // savedEvent.populate('project_user',function (err, savedEventPopulated){
          eventEvent.emit('event.emit', savedEventPopulated);
          event2Event.emit(name, savedEventPopulated);
        });
       
        return resolve(savedEvent);
      });
    });

  }

}
var eventService = new EventService();


module.exports = eventService;
