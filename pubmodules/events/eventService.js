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

  emit(name, attributes, id_project, project_user, createdBy, status, user) {

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
