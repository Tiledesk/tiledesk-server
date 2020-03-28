const EventEmitter = require('events');

class DepartmentEvent extends EventEmitter {}
var winston = require('../config/winston');
var Request = require('../models/request');

const departmentEvent = new DepartmentEvent();


// rules engine ascolta evento operators.select ed in base a regole custom riassegna oggetto operators

function callNextEvent(nextEventName, res) {
  var operatorSelectedEvent = res.result;
  var count = departmentEvent.listenerCount(nextEventName);
  winston.debug('count', count);   
  if (count<1) {
    winston.info('operator.select count <1 return default resolve');   
    return res.resolve(operatorSelectedEvent);
  } else {
    winston.info('operator.select count >1 launch ' + nextEventName);
    departmentEvent.emit(nextEventName, res);   
  }
}
departmentEvent.on('operator.select.base1', function(res) {

  return callNextEvent('operator.select.base2', res);
    // winston.info('operatorSelectedEvent', operatorSelectedEvent);    
    // console.log('resolve', res.resolve.toString());    
    // console.log('resolve', res.resolve);    
   
    // se pro e se attivate queue metti operator a []
    
  });


  // function start() {

  //   // const p1 = new Promise((resolve, reject) => {     
  //   //      resolve({a:"1"}); 
  //   // });
  //   // const p2 = new Promise((resolve, reject) => {     
  //   //   resolve({a:"2"}); 
  //   // });

  //   const p1 = (context) => {
  //     return new Promise((resolve, reject) => {     
  //       resolve({a:"1"}); 
  //     });
  //   }
  //   const p2 = (context) => {
  //     return new Promise((resolve, reject) => {     
  //       resolve({a:"2"}); 
  //     });
  //   }
  //   const tasks = [p1,p2];
  //   return tasks.reduce((promiseChain, currentTask) => {
  //       return promiseChain.then(chainResults =>
  //           currentTask.then(currentResult =>
  //               [ ...chainResults, currentResult ]
  //           )
  //       );
  //   }, Promise.resolve([])).then(arrayOfResults => {
  //     console.log("arrayOfResults",arrayOfResults);
  //       // Do something with all results
  //   });
  // }
  // start();





  function nextOperator(array, index) {
    // console.log('array: ', array);
    // console.log('index: ' + index);

    index = index || 0;

    if (array === undefined || array === null)
      array = [];
    else if (!Array.isArray(array))
      throw new Error('Expecting argument to RoundRound to be an Array');

    // return function () {
        index++;
      if (index >= array.length) index = 0;
      // console.log('index: ' + index);
      return array[index];
    // };
  }

departmentEvent.on('operator.select.base2', async (res) => {
  // departmentEvent.prependListener('operator.select', async (data) => {
  
    var operatorsResult = res.result;
    winston.debug('operator.select.base2 res', res);   


    var disableWebHookCall = res.disableWebHookCall;
    winston.debug("operator.select.base2 disableWebHookCall: "+ disableWebHookCall);

  if (disableWebHookCall===true) {      
    winston.info("operator.select.base2 disableWebHookCall enabled: "+ disableWebHookCall);
    // return callNextEvent('operator.select', res);
    return res.resolve(operatorsResult);

  }








  var project = operatorsResult.project;
  var max_agent_served_chat = undefined;

  
  // console.log("project: ", project);

  if (project && project.settings && project.settings.chat_limit_on && project.settings.max_agent_served_chat) {
    max_agent_served_chat = project.settings.max_agent_served_chat;
    winston.info('operator.select max_agent_served_chat: '+max_agent_served_chat);   

  }else {
    winston.info("chat_limit_on not defined calling next ");
    return callNextEvent('operator.select', res);
  }


   

  // winston.info('qui', operatorsResult.available_agents.length);   
  operatorsResult.available_agents_request  = [];

  if (operatorsResult && operatorsResult.available_agents && operatorsResult.available_agents.length > 0) {        

    // winston.info('qui1');   
    var query = {id_project: operatorsResult.id_project, status: {$lt:1000}};      
    // asyncForEach(operatorsResult.available_agents, async (aa) => {
    for (const aa of operatorsResult.available_agents) {
      query.participants = aa.id_user._id.toString();// attento qui
      winston.debug("department operators query:" , query);
      var count =  await Request.countDocuments(query);
      winston.debug("department operators count: "+ count);
      operatorsResult.available_agents_request.push({project_user: aa, openRequetsCount : count});

    }

  }



   

    var available_agents_request = operatorsResult.available_agents_request;
    var available_agents_not_busy = [];
    if (available_agents_request && available_agents_request.length>0) {
      for (const aa of available_agents_request) {
      // console.log("aa.openRequetsCount ", aa.openRequetsCount, " for:", aa.project_user.id_user);

        var maxservedchatForUser = max_agent_served_chat;

        var max_agent_served_chat_specific_user = aa.project_user.max_served_chat;
        // console.log("max_agent_served_chat_specific_user: ", max_agent_served_chat_specific_user);

        if (max_agent_served_chat_specific_user && max_agent_served_chat_specific_user!=-1 ) {
          maxservedchatForUser = max_agent_served_chat_specific_user;           
        }            
        
        winston.info("maxservedchatForUser: "+ maxservedchatForUser);

        if (aa.openRequetsCount < maxservedchatForUser) {
          winston.info("adding  "+ aa.project_user.id_user+ " with openRequetsCount: "+ aa.openRequetsCount +" and with maxservedchatForUser " + maxservedchatForUser +" to available_agents_not_busy" );
          available_agents_not_busy.push(aa.project_user);
        }
      }
    } else {
      winston.info("available_agents_request not defined");
    }

    winston.info("available_agents_not_busy", available_agents_not_busy);


    var lastOperatorId  = operatorsResult.lastOperatorId;

    let lastOperatorIndex = available_agents_not_busy.findIndex(projectUser => projectUser.id_user.toString() === lastOperatorId);
    winston.info("lastOperatorIndex: "+ lastOperatorIndex);
    var nextOper = nextOperator(available_agents_not_busy, lastOperatorIndex);
    // console.log("nextOper: ", nextOper);
    var nextOperatorId = undefined; 
    if (nextOper && nextOper.id_user) {
      nextOperatorId = nextOper.id_user;
      winston.info("nextOperatorId: "+ nextOperatorId);

      operatorsResult.operators = [{id_user: nextOperatorId}];

      // return resolve(result);
    } else {
      winston.info("nextOper is not defined");
      operatorsResult.operators = [];
      // return resolve(result);
    }


    return callNextEvent('operator.select', res);

    // operatorsResult.ciccio=123
    // winston.info('qua');   

    // var count = departmentEvent.listenerCount('operator.select.3');
    // winston.debug('count', count);   
    // if (count<1) {
    //   winston.info('count <1 return default resolve');   
    //   return data.resolve(operatorsResult);
    // } else {
    //   winston.info('count >1 launch .3');
    //   departmentEvent.emit('operator.select.3', data);   
    // }


});

module.exports = departmentEvent;
