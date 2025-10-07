const departmentEvent = require('../../event/departmentEvent');
let Request = require('../../models/request');
let winston = require('../../config/winston');


// let request = require('retry-request', {
//     request: require('request')
//   });

// TODO riabilitare questo

// const ROUTE_QUEUE_ENDPOINT = process.env.ROUTE_QUEUE_ENDPOINT;
// winston.debug("ROUTE_QUEUE_ENDPOINT: " + ROUTE_QUEUE_ENDPOINT);

// if (ROUTE_QUEUE_ENDPOINT) {
//   winston.info("Route queue endpoint: " + ROUTE_QUEUE_ENDPOINT);
// } else {
//    winston.info("Route queue endpoint not configured");
// }


class Listener {

 
  constructor() {
    this.enabled = true;
    if (process.env.ROUTE_QUEUE_ENABLED=="false" || process.env.ROUTE_QUEUE_ENABLED==false) {
        this.enabled = false;
    }
    winston.debug("Listener this.enabled: "+ this.enabled);
}

     nextOperator(array, index) {
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


    listen() {

      if (this.enabled==true) {
        winston.info("Route queue Listener listen");
      } else {
          return winston.info("Route queue Listener disabled");
      }

        let that = this;

        departmentEvent.on('operator.select.base2', async (res) => {
            // departmentEvent.prependListener('operator.select', async (data) => {
            
              let operatorsResult = res.result;
              winston.debug('operator.select.base2 res', res);   
          
          
              let disableWebHookCall = res.disableWebHookCall;
              winston.debug("operator.select.base2 disableWebHookCall: "+ disableWebHookCall);
          
            if (disableWebHookCall===true) {      
              winston.debug("operator.select.base2 disableWebHookCall enabled: "+ disableWebHookCall);
              // return callNextEvent('operator.select', res);
              return res.resolve(operatorsResult);
          
            }
          
        
          
          
          
          
            let project = operatorsResult.project;
            let max_agent_assigned_chat = undefined;
          
            
            // console.log("project: ", project);
          
            if (project && project.settings && project.settings.chat_limit_on && project.settings.max_agent_assigned_chat) {
              max_agent_assigned_chat = project.settings.max_agent_assigned_chat;
              winston.debug('operator.select max_agent_assigned_chat: '+max_agent_assigned_chat);   
          
            } else {
              winston.debug("chat_limit_on not defined calling next ");
              return departmentEvent.callNextEvent('operator.select', res);
            }
          
          
             
          
            // winston.info('qui', operatorsResult.available_agents.length);   
            operatorsResult.available_agents_request  = [];
          
            if (operatorsResult && operatorsResult.available_agents && operatorsResult.available_agents.length > 0) {        
          
              // winston.info('qui1');   
               //  qui1000
              let query = {id_project: operatorsResult.id_project, status: {$lt:1000}};      
              // asyncForEach(operatorsResult.available_agents, async (aa) => {
              for (const aa of operatorsResult.available_agents) {
                query.participants = aa.id_user._id.toString();// attento qui
                winston.debug("department operators query:" , query);


                // questa cosa nn va bene. nn puoi usare ? number_assigned_requests??
                let count =  await Request.countDocuments(query);
                winston.debug("department operators count: "+ count);
                operatorsResult.available_agents_request.push({project_user: aa, openRequetsCount : count});
          
              }
          
            }
          
          

         
             
          
              let available_agents_request = operatorsResult.available_agents_request;
              let available_agents_not_busy = [];
              if (available_agents_request && available_agents_request.length>0) {
                for (const aa of available_agents_request) {
                // console.log("aa.openRequetsCount ", aa.openRequetsCount, " for:", aa.project_user.id_user);
          
                  let maxAssignedchatForUser = max_agent_assigned_chat;
          
                  let max_agent_assigned_chat_specific_user = aa.project_user.max_assigned_chat;
                  // console.log("max_agent_assigned_chat_specific_user: ", max_agent_assigned_chat_specific_user);
          
                  if (max_agent_assigned_chat_specific_user && max_agent_assigned_chat_specific_user!=-1 ) {
                    maxAssignedchatForUser = max_agent_assigned_chat_specific_user;           
                  }            
                  
                  winston.debug("maxAssignedchatForUser: "+ maxAssignedchatForUser);
          
                  if (aa.openRequetsCount < maxAssignedchatForUser) {
                    winston.debug("adding  "+ aa.project_user.id_user+ " with openRequetsCount: "+ aa.openRequetsCount +" and with maxAssignedchatForUser " + maxAssignedchatForUser +" to available_agents_not_busy" );
                    available_agents_not_busy.push(aa.project_user);
                  }
                }
              } else {
                winston.debug("available_agents_request not defined");
              }
          
              winston.debug("available_agents_not_busy", available_agents_not_busy);
          
          

                 // TODO non riassegnare allo stesso utente usa history oppure lastabandonedby in attributes 
            // in project_user sengni il numero di abandoni se uguale a psettng lo metto offline
            winston.debug("res.context",res.context);  

            winston.debug("res.context.request.attributes",res.context.request.attributes);  

              if (res.context && res.context.request  && res.context.request && 
                res.context.request.attributes && res.context.request.attributes.abandoned_by_project_users ) {  //&& res.context.request.attributes.queue_important==false  (vip sla continuo reassign)
                  
                  // let abandoned_by_project_users= {"5ecd44cfa3f5670034109b44":true,"5ecd56a10e7d2d00343203cc":true}

                  winston.debug("res.context.request.attributes.abandoned_by_project_users: ", res.context.request.attributes.abandoned_by_project_users );
                  
                  let abandoned_by_project_usersAsArray = Object.keys(res.context.request.attributes.abandoned_by_project_users);

                  if (abandoned_by_project_usersAsArray.length>0 )  {
                    winston.debug("abandoned_by_project_usersAsArray", abandoned_by_project_usersAsArray);

                    let available_agents_not_busy = available_agents_not_busy.filter(projectUser=> !abandoned_by_project_usersAsArray.includes(projectUser._id.toString()))
                    
                    if (available_agents_not_busy.length == 0) {
                      res.context.request.attributes.fully_abandoned = true;
                    }

                    winston.debug("available_agents_not_busy after: ", available_agents_not_busy );                           
                  }
              }

              // if (res.context && res.context.request  && res.context.request && 
              //   res.context.request.attributes && res.context.request.attributes.last_abandoned_by )  {
              //     winston.debug("res.context.request.attributes.last_abandoned_by: "+res.context.request.attributes.last_abandoned_by );
              //     let last_abandoned_by_index = available_agents_not_busy.findIndex(projectUser => projectUser._id.toString() === res.context.request.attributes.last_abandoned_by);
              //     winston.debug("last_abandoned_by_index: "+last_abandoned_by_index );
              //     if (last_abandoned_by_index>-1) {
              //       available_agents_not_busy.splice(last_abandoned_by_index, 1);
              //       winston.debug("available_agents_not_busy after", available_agents_not_busy );
              //     }                  

              // }


              let lastOperatorId  = operatorsResult.lastOperatorId;
          
              let lastOperatorIndex = available_agents_not_busy.findIndex(projectUser => projectUser.id_user.toString() === lastOperatorId);
              winston.debug("lastOperatorIndex: "+ lastOperatorIndex);
              let nextOper = that.nextOperator(available_agents_not_busy, lastOperatorIndex);
              // console.log("nextOper: ", nextOper);
              let nextOperatorId = undefined; 
              if (nextOper && nextOper.id_user) {
                nextOperatorId = nextOper.id_user;
                winston.verbose("nextOperatorId: "+ nextOperatorId);
          
                operatorsResult.operators = [{id_user: nextOperatorId}];
          
                // return resolve(result);
              } else {
                winston.debug("nextOper is not defined");
                operatorsResult.operators = [];
                // return resolve(result);
              }
          
          
              return departmentEvent.callNextEvent('operator.select', res);
          
           
          
          });

       
    }

}

let listener = new Listener();


module.exports = listener;