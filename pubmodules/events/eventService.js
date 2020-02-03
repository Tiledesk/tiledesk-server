'use strict';

var Event = require("./event");
const eventEvent = require('./eventEvent');
const event2Event = require('./event2Event');
var winston = require('../../config/winston');


class EventService {


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
        eventEvent.emit(name, savedEvent);
        event2Event.emit(name, savedEvent);
        return resolve(savedEvent);
      });
    });

  }

}
var eventService = new EventService();


module.exports = eventService;
