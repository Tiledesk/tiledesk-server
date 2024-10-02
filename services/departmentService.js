
var Department = require("../models/department");
var Project_user = require("../models/project_user");
var Project = require("../models/project");
var Group = require("../models/group");
var operatingHoursService = require("./operatingHoursService");
var winston = require('../config/winston');
const departmentEvent = require('../event/departmentEvent');
const Request = require('../models/request');
const RoleConstants = require ('../models/roleConstants')
var cacheEnabler = require("../services/cacheEnabler");
var cacheUtil = require("../utils/cacheUtil");

class DepartmentService {

  createDefault(project_id, createdBy) {
    return this.create('Default Department', project_id, 'assigned', createdBy, true);
  }

  create(name, id_project, routing, createdBy, isdefault) {

    if (!isdefault) {
      isdefault = false;
    }
    
    var that = this;
    return new Promise(function (resolve, reject) {
        var newDepartment = new Department({
          routing: routing,
          name: name,
          id_project: id_project,
          default: isdefault,
          createdBy: createdBy,
          updatedBy: createdBy
        });
    
        return newDepartment.save(function (err, savedDepartment) {
          if (err) {
            winston.error('--- > ERROR ', err);
            reject(err);
          }
          winston.verbose('Default Department created', savedDepartment.toObject());
          return resolve(savedDepartment);
        });
      });
  }

  nextOperator (array, index) {
    winston.debug('array: ', array);
    winston.debug('index: ' + index);

    index = index || 0;
  
    if (array === undefined || array === null)
      array = [];
    else if (!Array.isArray(array))
      throw new Error('Expecting argument to RoundRound to be an Array');
  
    // return function () {
        index++;
      if (index >= array.length) index = 0;
      winston.debug('index: ' + index);
      return array[index];
    // };
}


roundRobin(operatorSelectedEvent) {

  var that = this;
 

  return new Promise(function (resolve, reject) {

    if (operatorSelectedEvent.department.routing !== 'assigned') {       
      winston.debug('It isnt an assigned request');  
      return resolve(operatorSelectedEvent);
    }

    // db.getCollection('requests').find({id_project: "5c12662488379d0015753c49", participants: { $exists: true, $ne: [] }}).sort({_id:-1}).limit(1)
    
      // https://stackoverflow.com/questions/14789684/find-mongodb-records-where-array-field-is-not-empty
      let query = {id_project: operatorSelectedEvent.id_project, 
        hasBot:false, preflight:false, status: { $gt: 100 }, 
        participants: { $exists: true, $ne: [] }};
      
      winston.debug('query', query);            

      // let lastRequests = await 
      // requestcachefarequi nocachepopulatereqired
      Request.find(query).sort({_id:-1}).limit(1).exec(function (err, lastRequests) {  // cache_attention  use_lean use_select
          if (err) {
              winston.error('Error getting request for RoundRobinOperator', err); 
              return reject(err);
          }
         
          
          winston.debug('lastRequests',lastRequests); 

          if (lastRequests.length==0) {
              winston.debug('roundRobin lastRequest not found. fall back to random info',operatorSelectedEvent); 
              winston.verbose('roundRobin lastRequest not found. fall back to random'); 
              //first request use default random algoritm
              // return 0;
              return resolve(operatorSelectedEvent);
          }

          // var start = Date.now();
          // var res = sleep(5000);
          // var end = Date.now();
          // // res is the actual time that we slept for
          // console.log(res + ' ~= ' + (end - start) + ' ~= 1000');


          let lastRequest = lastRequests[0];
          winston.debug('lastRequest:'+ JSON.stringify(lastRequest)); 

          let lastOperatorId = lastRequest.participants[0];
          winston.debug('lastOperatorId: ' + lastOperatorId);


          // BUGFIX (node:74274) UnhandledPromiseRejectionWarning: TypeError: Cannot read property 'id_user' of undefined
          //   at /Users/andrealeo/dev/chat21/tiledesk-server/services/requestService.js:55:56
          //   at processTicksAndRejections (internal/process/next_tick.js:81:5)
          // (node:74274) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)          
          if (operatorSelectedEvent.available_agents && operatorSelectedEvent.available_agents.length==0) {
            winston.debug('operatorSelectedEvent.available_agents empty ', operatorSelectedEvent.available_agents);
            return resolve(operatorSelectedEvent);
          }          


            //when the agent has a custom auth jwt. so he has uuid_user and not id_user
          // error: uncaughtException: Cannot read property 'toString' of undefined
          // 2021-10-14T08:54:00.099370+00:00 app[web.1]: TypeError: Cannot read property 'toString' of undefined
          // 2021-10-14T08:54:00.099371+00:00 app[web.1]:     at /app/services/departmentService.js:130:119
          // 2021-10-14T08:54:00.099372+00:00 app[web.1]:     at Array.findIndex (<anonymous>)
          // 2021-10-14T08:54:00.099372+00:00 app[web.1]:     at /app/services/departmentService.js:130:74
          // 2021-10-14T08:54:00.099372+00:00 app[web.1]:     at /app/node_modules/mongoose/lib/model.js:5074:18
          // 2021-10-14T08:54:00.099381+00:00 app[web.1]:     at processTicksAndRejections (internal/process/task_q

          // https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
          let lastOperatorIndex = operatorSelectedEvent.available_agents.findIndex(projectUser =>  {
                if (projectUser.id_user) {
                  return projectUser.id_user.toString() === lastOperatorId;
                } else { //when the agent has a custom auth jwt. so he has uuid_user and not id_user
                  return projectUser.uuid_user === lastOperatorId;
                }
              }
            );

          
          // if lastOperatorIndex is -1(last operator is not available)->  that.nextOperator increment index +1 so it's work


  

          winston.debug('lastOperatorIndex: ' + lastOperatorIndex);

          winston.debug('operatorSelectedEvent.available_agents: ', operatorSelectedEvent.available_agents);

          
          let nextOperator = that.nextOperator(operatorSelectedEvent.available_agents, lastOperatorIndex);

          
          winston.debug('roundRobin nextOperator: ' ,nextOperator.toJSON());
          
          


          // operatorSelectedEvent.operators = [{id_user: nextOperator.id_user}];
          operatorSelectedEvent.operators = [nextOperator];

          operatorSelectedEvent.lastOperatorId = lastOperatorId;
          operatorSelectedEvent.lastRequest = lastRequest;
          operatorSelectedEvent.lastOperatorIndex = lastOperatorIndex;


          return resolve(operatorSelectedEvent);
      });
  
    });
}



getOperators(departmentid, projectid, nobot, disableWebHookCall, context) {

  winston.debug('context0.0',context);

  var that = this;
  return new Promise(function (resolve, reject) {
       // console.log("»»» »»» --> DEPT ID ", departmentid);


    let q = Project.findOne({_id: projectid, status: 100})
    if (cacheEnabler.project) { 
      q.cache(cacheUtil.longTTL, "projects:id:"+projectid)  //project_cache
      winston.debug('project cache enabled for getOperators');
    }
    return q.exec(function(err, project){
      if (err) {
        winston.error('Project findById ', err);
        return reject(err);
      }
      if (!project) {
        winston.error("Project not found with id ", projectid);
        return reject({ success: false, msg: "Project not found with id "});
      }


      // if not defined
      // TODO questo lo abiliterei solo esplicitamete se si flagga opzione su progetto per performance
      if (disableWebHookCall==undefined) {
              //if pro enabled disableWebHookCall = false
                              //secondo me qui manca un parentesi tonda per gli or
        if (project.profile && (project.profile.type === 'free' && project.trialExpired === false) || (project.profile.type === 'payment' && project.isActiveSubscription === true)) {
          // winston.info('disableWebHookCall pro');
          disableWebHookCall = false;
        } else {
          disableWebHookCall = true;
        }
      }
      
   


      let query;
      if (departmentid == 'default' || departmentid == undefined) {
        query = { default: true, id_project: projectid };
      } else {
        query = { _id: departmentid };
      }
       // console.log('query', query);
      return Department.findOne(query).exec(function (err, department) {
        // return Department.findOne(query).exec().then(function (department) {

        if (err) {
          winston.error('-- > 1 DEPT FIND BY ID ERR ', err)
          return reject(err);
        }
        // console.log("department", department);
        if (!department) {
          winston.error("Department not found for projectid: "+ projectid +" for query: ", query, context);
          return reject({ success: false, msg: 'Department not found for projectid: '+ projectid +' for query: ' + JSON.stringify(query) });
        }
        // console.log('OPERATORS - »»» DETECTED ROUTING ', department.routing)
        // console.log('OPERATORS - »»» DEPARTMENT - ID BOT ', department.id_bot)

        // start code FOR DEBUG
        // NOTE: TO TEST '?nobot = true' see in the tiledesk dashboard: mongodb-department.service > testAssignesFunction
        if (nobot) {
          // console.log('nobot IS == true ? ', nobot)
          // console.log('»»»» »»»» nobot is == TRUE - JUMP TO ASSIGNED / POOLED ')
        } else if (!nobot) {
          // console.log('nobot IS != true ', nobot)
          if ((department.id_bot == null || department.id_bot == undefined)) {
            // console.log('»»»» »»»» BOT IS UNDEFINED or NULL and nobot is != TRUE - JUMP TO ASSIGNED / POOLED')
          } else {
            // console.log('»»»» »»»» BOT EXIST and nobot is != TRUE - ASSIGN THE SELECTED BOT ')
          }
        }
        // /.end code FOR DEBUG 

        // IF EXIST THE BOT AND nobot IS NOT UNDEFINED IN OPERATORS IS RETURNED THE ID OF THE BOT
        if ((department.id_bot != null || department.id_bot != undefined) && (!nobot)) {

          // if (department.id_group == null || department.id_group == undefined) {
          // MAKE X 'BOT' AS FOR 'ASSIGNED' AND 'POOLED': IF THERE IS A GROUP THE BOT WILL BE VISIBLE ONLY BY THE GROUP MEMBERS 
          // OTHERWISE THE BOT WILL BE VISIBLE TO ALL USERS (BECAUSE THERE IS NO GROUP)

          // console.log('OPERATORS - »»»» BOT IS DEFINED - !!! DEPT HAS NOT GROUP ID')
          // console.log('OPERATORS - »»»» BOT IS DEFINED -> ID BOT', department.id_bot);
          // console.log('OPERATORS - »»»» nobot ', nobot)
          var role = [RoleConstants.OWNER, RoleConstants.ADMIN,RoleConstants.SUPERVISOR, RoleConstants.AGENT];
// attento indice
          return Project_user.find({ id_project: projectid, role: { $in : role }, status: "active" }).exec(function (err, project_users) {
            if (err) {
              winston.error('-- > 2 DEPT FIND BY ID ERR ', err)
              return reject(err);
            }
            // console.log('OPERATORS - BOT IS DEFINED - MEMBERS ', project_users)
            // console.log('OPERATORS - BOT IS DEFINED - MEMBERS LENGHT ', project_users.length);

            // getAvailableOperatorsWithOperatingHours: IN BASE ALLE 'OPERATING HOURS' DEL PROGETTO ESEGUE 
            // getAvailableOperator CHE RITORNA I PROJECT USER DISPONIBILI
            return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {

              // console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", _available_agents);

              // here subscription notifier??              
              return resolve ({ 
                              department: department, available_agents: _available_agents, agents: project_users, 
                              id_bot:department.id_bot, project: project,
                              context: context,
                              // botprefix
                              operators: [{ id_user: 'bot_' + department.id_bot }] 
                             });
            }).catch(function (error) {

              // winston.error("Write failed: ", error);

              winston.error("Error D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", error);

              return reject(error);
            });
            
          });
        }

        else { // if (department.routing === 'assigned' || department.routing === 'pooled') {
          // console.log('OPERATORS - routing ', department.routing, ' - PRJCT-ID ', projectid)
          // console.log('OPERATORS - routing ', department.routing, ' - DEPT GROUP-ID ', department.id_group)


          /* ---------------------------------------------------------------------------------
          *  findProjectUsersAllAndAvailableWithOperatingHours return: 
          *  * available_agents (available project users considering personal availability in the range of the operating hours) 
          *  * agents (i.e., all the project users) 
          *  * operators (i.e. the id of a user selected random from the available project users considering personal availability in the range of the operating hours)
          * --------------------------------------------------------------------------------*/
         winston.debug("context0",context);
          return that.findProjectUsersAllAndAvailableWithOperatingHours(projectid, department, disableWebHookCall, project, context).then(function (value) {

            // console.log('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, '] ', value);
            value['department'] = department
            return resolve(value);

          }).catch(function (error) {
            winston.error('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ] -> ERROR: ', error);
            return reject(error);
          });
        }
      });
    });
  });
};

 findProjectUsersAllAndAvailableWithOperatingHours(projectid, department, disableWebHookCall, project, context) {
  var that = this;

  return new Promise(function (resolve, reject) {
    // console.log('D-1 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ], - ID GROUP', department.id_group);

    if (department.id_group != null) {

      return resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department, disableWebHookCall, project, context));

    } else {

      return resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department, disableWebHookCall, project, context));

    }

  });
};

 findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department, disableWebHookCall, project, context) {
  var that = this;

  return new Promise(function (resolve, reject) {

    return Group.find({ _id: department.id_group }).exec(function (err, group) {
      if (err) {
        winston.error('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        return reject(err);
      }
      if (group) {
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> GROUP FOUND:: ', group);
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS LENGHT: ', group[0].members.length);
        // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS ID: ', group[0].members);

        // , user_available: true
        //Project_user.findAllProjectUsersByProjectIdWhoBelongsToMembersOfGroup(id_prject, group[0]);
        // riprodurre su v2
         return Project_user.find({ id_project: projectid, id_user: { $in : group[0].members}, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT]}, status: "active" }).exec(function (err, project_users) {          
          // uni error round robin
        //return Project_user.find({ id_project: projectid, id_user: group[0].members, role: { $in : [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.AGENT]} }).exec(function (err, project_users) {

          // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT ID ', projectid);
          if (err) {
            // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER - ERR ', err);
            return reject(err);
          }
          winston.debug("project_users",project_users);
          
          if (project_users && project_users.length > 0) {
            // console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER (IN THE GROUP) LENGHT ', project_users.length);

            return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
              var _available_agents = _available_agents
              // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

              var selectedoperator = []
              if (department.routing === 'assigned') {                
                selectedoperator = that.getRandomAvailableOperator(_available_agents);
              }

              let objectToReturn = { available_agents: _available_agents, agents: project_users, operators: selectedoperator, department: department, group: group, id_project: projectid, project: project,  context: context };

              // var objectToReturnRoundRobin = objectToReturn;
              that.roundRobin(objectToReturn).then(function(objectToReturnRoundRobin){

                winston.debug("context2",context);
                departmentEvent.emit('operator.select.base1', {result:objectToReturnRoundRobin, disableWebHookCall: disableWebHookCall, resolve: resolve, reject: reject, context: context});

                //is resolved by departmentEvent or SubscriptionNotifier
                // return resolve(objectToReturnRoundRobin);
              });
              

            }).catch(function (error) {

              // winston.error("Write failed: ", error);
              winston.error('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_group ] - AVAILABLE AGENT - ERROR ', error);

              return reject(error);
              //sendError(error, res);
            });
           
          } else {
            // here subscription notifier??
            var objectToReturn = { available_agents: [], agents: [], operators: [], context: context };
            return resolve(objectToReturn);
          }

        })
      }
    });
  });
}


 findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department, disableWebHookCall, project, context) {

  var that = this;

  return new Promise(function (resolve, reject) {

    var role = [RoleConstants.OWNER, RoleConstants.ADMIN, RoleConstants.SUPERVISOR, RoleConstants.AGENT];
    return Project_user.find({ id_project: projectid , role: { $in : role }, status: "active" }).exec(function (err, project_users) {
      if (err) {
        winston.error('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        return reject(err);
      }
      // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS LENGHT ', project_users.length)
      // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS ', project_users)


      if (project_users && project_users.length > 0) {
        
        return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
          var _available_agents = _available_agents
          // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

          var selectedoperator = []
          if (department.routing === 'assigned') {
            selectedoperator = that.getRandomAvailableOperator(_available_agents);
          }

          let objectToReturn = { available_agents: _available_agents, agents: project_users, operators: selectedoperator, department: department, id_project: projectid, project: project, context: context };

          // var objectToReturnRoundRobin = objectToReturn;

          that.roundRobin(objectToReturn).then(function(objectToReturnRoundRobin) {
            winston.debug("context2",context);
            departmentEvent.emit('operator.select.base1', {result:objectToReturnRoundRobin,  disableWebHookCall: disableWebHookCall, resolve: resolve, reject: reject, context: context});

            // attento qui            
            // if (objectToReturnRoundRobin.department._id == "5e5d40b2bd0a9b00179ff3cf" ) {
            //   objectToReturnRoundRobin.operators = [];
            // }
          

            //is resolved by departmentEvent or SubscriptionNotifier
            // return resolve(objectToReturnRoundRobin);
          });
          
        }).catch(function (error) {

          // winston.error("Write failed: ", error);
          winston.error('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_nogroup ] - AVAILABLE AGENT - ERROR ', error);
          return reject(error);

        });

       
      } else {
        // here subscription notifier??
        let objectToReturn = { available_agents: [], agents: [], operators: [], context: context };
        return resolve(objectToReturn);
      }

    });
  });
}



 getAvailableOperatorsWithOperatingHours(project_users, projectid) {

  var that = this;


  return new Promise(function (resolve, reject) {

    if (project_users && project_users.length > 0) {

      return operatingHoursService.projectIsOpenNow(projectid, function (isOpen, err) {
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> PROJECT ID: ', projectid);
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT: ', isOpen);
        // console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT - ERROR: ', err)

        if (err) {
          winston.error(err); 
          return reject(err);
          // sendError(err, res);

        } 
        
        if (isOpen) {

          var _available_agents = that.getAvailableOperator(project_users);

          return resolve(_available_agents);
        } else {
          // console.logO ---> [ OHS ] -> PROJECT NOT FOUND("HERERERERERERE");
          return resolve([]);
        }
      });
    } else {
      return resolve([]);
    }

  });
}

// FILTER ALL THE PROJECT USERS FOR AVAILABLE = TRUE
 getAvailableOperator(project_users) {
  var project_users_available = project_users.filter(function (projectUser) {
    if (projectUser.user_available == true) {
      return true;
    }
  });
  // console.log('D -> [GET AVAILABLE PROJECT-USER ] - AVAILABLE PROJECT USERS (getAvailableOperator): ', project_users_available)
  return project_users_available
}



 
getDefaultDepartment(projectid) {
  return new Promise(function (resolve, reject) {
    let query = { default: true, id_project: projectid };
    winston.debug('query ', query)
    // console.log('query', query);
    return Department.findOne(query).exec(function (err, department) {
      // return Department.findOne(query).exec().then(function (department) {

      if (err) {
        winston.error('-- > 1 DEPT FIND BY ID ERR ', err)
        return reject(err);
      }
      // console.log("department", department);
      if (!department) {
        winston.error("Department not found for projectid: "+ projectid +" for query: ", query, context);
        return reject({ success: false, msg: 'Department not found for projectid: '+ projectid +' for query: ' + JSON.stringify(query) });
      }
      winston.debug('department ', department);

      return resolve(department);
    });
  });
}

 getRandomAvailableOperator(project_users_available) {

  // console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE LENGHT ', project_users_available.length);
  if (project_users_available.length > 0) {


    // new
                                  // num between 0 and 1 * es 3 -> 
    // let randomIndex =  Math.round(Math.random() * project_users_available.length);
    // // let randomIndex =  Math.floor(Math.random() * project_users_available.length);
    
    // console.log("randomIndex",randomIndex);
    // var operator = project_users_available[randomIndex];
    // // console.log('OPERATORS - SELECTED MEMBER ID', operator.id_user);

    var operator = project_users_available[Math.floor(Math.random() * project_users_available.length)];


    return [{ id_user: operator.id_user }];
    // return [operator];

  }
  else {

    return []

  }
}



}


var departmentService = new DepartmentService();


module.exports = departmentService;
