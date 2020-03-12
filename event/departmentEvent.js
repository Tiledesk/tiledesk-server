const EventEmitter = require('events');

class DepartmentEvent extends EventEmitter {}
var winston = require('../config/winston');

const departmentEvent = new DepartmentEvent();


// rules engine ascolta evento operators.select ed in base a regole custom riassegna oggetto operators

departmentEvent.on('operator.select', function(res) {
  var operatorSelectedEvent = res.result;
    // winston.info('operatorSelectedEvent', operatorSelectedEvent);    
    // console.log('resolve', res.resolve.toString());    
    // console.log('resolve', res.resolve);    
    var count = departmentEvent.listenerCount('operator.select');
    winston.debug('count', count);   
    if (count<=1) {
      winston.info('count <1 return default resolve');   
      return res.resolve(operatorSelectedEvent);
    } 
    
  });


module.exports = departmentEvent;
