const EventEmitter = require('events');

class DepartmentEvent extends EventEmitter {}
var winston = require('../config/winston');

const departmentEvent = new DepartmentEvent();


// rules engine ascolta evento operators.select ed in base a regole custom riassegna oggetto operators

departmentEvent.on('operator.select', function(operatorSelectedEvent) {
    winston.debug('operatorSelectedEvent', operatorSelectedEvent);    
  });


module.exports = departmentEvent;
