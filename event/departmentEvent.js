const EventEmitter = require('events');

class DepartmentEvent extends EventEmitter {}
let winston = require('../config/winston');
let Request = require('../models/request');

const departmentEvent = new DepartmentEvent();


// rules engine ascolta evento operators.select ed in base a regole custom riassegna oggetto operators

DepartmentEvent.prototype.callNextEvent = function(nextEventName, res) {
  let operatorSelectedEvent = res.result;
  let count = departmentEvent.listenerCount(nextEventName);
  winston.debug('count', count);   
  if (count<1) {
    winston.debug('operator.select count <1 return default resolve');   
    return res.resolve(operatorSelectedEvent);
  } else {
    winston.debug('operator.select count >1 launch ' + nextEventName);
    departmentEvent.emit(nextEventName, res);   
  }
}

departmentEvent.on('operator.select.base1', function(res) {

  return departmentEvent.callNextEvent('operator.select.base2', res);

    
  });



module.exports = departmentEvent;
