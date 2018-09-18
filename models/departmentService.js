
var Department = require("../models/department");
var Project_user = require("../models/project_user");
var Group = require("../models/group");
var operatingHoursService = require("../models/operatingHoursService");

class DepartmentService {

// START - GET OPERATORS OF A DEPT - 3 giu 2018 Nikola - Andrea L. - Andrea S.
getOperators(departmentid, projectid, nobot) {

  var that = this;
  return new Promise(function (resolve, reject) {
      console.log("»»» »»» --> DEPT ID ", departmentid);

      let query;
      if (departmentid == 'default' || departmentid == undefined) {
        query = { default: true, id_project: projectid };
      } else {
        query = { _id: departmentid };
      }
      console.log('query', query);
      return Department.findOne(query, function (err, department) {
        if (err) {
          console.log('-- > 1 DEPT FIND BY ID ERR ', err)
          reject(err);
        }
        if (!department) {
          reject({ success: false, msg: 'Object not found.' });
        }
        console.log('OPERATORS - »»» DETECTED ROUTING ', department.routing)
        console.log('OPERATORS - »»» DEPARTMENT - ID BOT ', department.id_bot)

        // start code FOR DEBUG
        // NOTE: TO TEST '?nobot = true' see in the tiledesk dashboard: mongodb-department.service > testChat21AssignesFunction
        if (nobot) {
          console.log('nobot IS == true ? ', nobot)
          console.log('»»»» »»»» nobot is == TRUE - JUMP TO ASSIGNED / POOLED ')
        } else if (!nobot) {
          console.log('nobot IS != true ', nobot)
          if ((department.id_bot == null || department.id_bot == undefined)) {
            console.log('»»»» »»»» BOT IS UNDEFINED or NULL and nobot is != TRUE - JUMP TO ASSIGNED / POOLED')
          } else {
            console.log('»»»» »»»» BOT EXIST and nobot is != TRUE - ASSIGN THE SELECTED BOT ')
          }
        }
        // /.end code FOR DEBUG 

        // IF EXIST THE BOT AND nobot IS NOT UNDEFINED IN OPERATORS IS RETURNED THE ID OF THE BOT
        if ((department.id_bot != null || department.id_bot != undefined) && (!nobot)) {

          // if (department.id_group == null || department.id_group == undefined) {
          // MAKE X 'BOT' AS FOR 'ASSIGNED' AND 'POOLED': IF THERE IS A GROUP THE BOT WILL BE VISIBLE ONLY BY THE GROUP MEMBERS 
          // OTHERWISE THE BOT WILL BE VISIBLE TO ALL USERS (BECAUSE THERE IS NO GROUP)
          console.log('OPERATORS - »»»» BOT IS DEFINED - !!! DEPT HAS NOT GROUP ID')
          console.log('OPERATORS - »»»» BOT IS DEFINED -> ID BOT', department.id_bot);
          console.log('OPERATORS - »»»» nobot ', nobot)

          return Project_user.find({ id_project: projectid }, function (err, project_users) {
            if (err) {
              console.log('-- > 2 DEPT FIND BY ID ERR ', err)
              reject(err);
            }
            console.log('OPERATORS - BOT IS DEFINED - MEMBERS ', project_users)
            // if (project_users && project_users.length > 0) {
            console.log('OPERATORS - BOT IS DEFINED - MEMBERS LENGHT ', project_users.length);

            // getAvailableOperatorsWithOperatingHours: IN BASE ALLE 'OPERATING HOURS' DEL PROGETTO ESEGUE 
            // getAvailableOperator CHE RITORNA I PROJECT USER DISPONIBILI
            return that.findProjectUsersAllAndAvailableWithOperatingHoursgetAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {

              console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", _available_agents);

              resolve ({ department: department, available_agents: _available_agents, agents: project_users, operators: [{ id_user: 'bot_' + department.id_bot }] });
            }).catch(function (error) {

              console.error("Write failed: ", error);

              console.log("D -> [ OPERATORS - BOT IS DEFINED ] -> AVAILABLE PROJECT-USERS: ", error);

              reject(error);
            });
            
          });
        }

        else { // if (department.routing === 'assigned' || department.routing === 'pooled') {
          console.log('OPERATORS - routing ', department.routing, ' - PRJCT-ID ', projectid)
          console.log('OPERATORS - routing ', department.routing, ' - DEPT GROUP-ID ', department.id_group)


          /* ---------------------------------------------------------------------------------
          *  findProjectUsersAllAndAvailableWithOperatingHours return: 
          *  * available_agents (available project users considering personal availability in the range of the operating hours) 
          *  * agents (i.e., all the project users) 
          *  * operators (i.e. the id of a user selected random from the available project users considering personal availability in the range of the operating hours)
          * --------------------------------------------------------------------------------*/
          return that.findProjectUsersAllAndAvailableWithOperatingHours(projectid, department).then(function (value) {

            console.log('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, '] ', value);
            value['department'] = department
            resolve(value);

          }).catch(function (error) {
            console.error('D-0 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ] -> ERROR: ', error);
            reject(error);
          });
        }
      });
  });
};

 findProjectUsersAllAndAvailableWithOperatingHours(projectid, department) {
  var that = this;

  return new Promise(function (resolve, reject) {
    console.error('D-1 -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) - ROUTING - ', department.routing, ' ], - ID GROUP', department.id_group);

    if (department.id_group != null) {

      resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department));

    } else {

      resolve(that.findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department));

    }

  });
};

 findProjectUsersAllAndAvailableWithOperatingHours_group(projectid, department) {
  var that = this;

  return new Promise(function (resolve, reject) {

    return Group.find({ _id: department.id_group }, function (err, group) {
      if (err) {
        console.error('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        reject(err);
      }
      if (group) {
        console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> GROUP FOUND:: ', group);
        console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS LENGHT: ', group[0].members.length);
        console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> MEMBERS ID: ', group[0].members);
        // , user_available: true
        //Project_user.findAllProjectUsersByProjectIdWhoBelongsToMembersOfGroup(id_prject, group[0]);
        return Project_user.find({ id_project: projectid, id_user: group[0].members }, function (err, project_users) {
          console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT ID ', projectid);
          if (err) {
            console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER - ERR ', err);
            reject(err);
          }
          if (project_users && project_users.length > 0) {
            console.log('D-2 GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> PROJECT USER (IN THE GROUP) LENGHT ', project_users.length);

            // var _available_agents = getAvailableOperatorsWithOperatingHours(project_users, projectid);
            // NK NEW
            return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
              var _available_agents = _available_agents
              // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

              var selectedoperator = []
              if (department.routing === 'assigned') {
                selectedoperator = that.getRandomAvailableOperator(_available_agents);
              }
              resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

            }).catch(function (error) {

              // console.error("Write failed: ", error);
              console.log('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_group ] - AVAILABLE AGENT - ERROR ', error);

              reject(error);
              //sendError(error, res);
            });
            // NK NEW

            // var selectedoperator = []
            // if (department.routing === 'assigned') {
            //   selectedoperator = getRandomAvailableOperator(_available_agents);
            // }
            // resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

          } else {
            resolve({ available_agents: [], agents: [], operators: [] })
          }

        })
      }
    });
  });
}


 findProjectUsersAllAndAvailableWithOperatingHours_nogroup(projectid, department) {

  var that = this;

  return new Promise(function (resolve, reject) {
    return Project_user.find({ id_project: projectid }, function (err, project_users) {
      if (err) {
        console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> ERR ', err)
        reject(err);
      }
      console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS LENGHT ', project_users.length)
      console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] ->  MEMBERS ', project_users)


      if (project_users && project_users.length > 0) {
        // var _available_agents = getAvailableOperatorsWithOperatingHours(project_users, projectid);
        // NK NEW
        return that.getAvailableOperatorsWithOperatingHours(project_users, projectid).then(function (_available_agents) {
          var _available_agents = _available_agents
          // console.log('D-3 NO GROUP -> [ FIND PROJECT USERS: ALL and AVAILABLE (with OH) ] -> AVAILABLE AGENT ', _available_agents);

          var selectedoperator = []
          if (department.routing === 'assigned') {
            selectedoperator = that.getRandomAvailableOperator(_available_agents);
          }
          resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })

        }).catch(function (error) {

          // console.error("Write failed: ", error);
          console.log('D-3 -> [ findProjectUsersAllAndAvailableWithOperatingHours_nogroup ] - AVAILABLE AGENT - ERROR ', error);
          reject(error);

        });

        // NK NEW


        // var selectedoperator = []
        // if (department.routing === 'assigned') {
        //   selectedoperator = getRandomAvailableOperator(_available_agents);
        // }
        // console.log('D-1-B -> [ findProjectUsersForAssignedPooledRouting_nogroup ] - AVAILABLE AGENT ', _available_agents);
        // resolve({ available_agents: _available_agents, agents: project_users, operators: selectedoperator })
      } else {
        resolve({ available_agents: [], agents: [], operators: [] })
      }

    });
  });
}



 getAvailableOperatorsWithOperatingHours(project_users, projectid) {

  var that = this;


  return new Promise(function (resolve, reject) {

    if (project_users && project_users.length > 0) {

      return operatingHoursService.projectIsOpenNow(projectid, function (isOpen, err) {
        console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> PROJECT ID: ', projectid);
        console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT: ', isOpen);
        console.log('D -> [ OHS ] -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> IS OPEN THE PROJECT - ERROR: ', err)

        if (err) {
          console.error(err); 
          reject(err);
          // sendError(err, res);

        } else if (isOpen) {

          var _available_agents = that.getAvailableOperator(project_users);

          resolve(_available_agents);
          // console.log('D -> [ GET AVAILABLE PROJECT-USER WITH OPERATING H ] -> AVAILABLE PROJECT USERS (returned by getAvailableOperator): ', _available_agents)
          // resolve(findProjectUsersForAssignedPooledRouting_nogroup(projectid, department));
        } else {
          // resolve({ available_agents: [], agents: [], operators: [] });
          resolve([]);
        }
      });
    } else {
      resolve([]);
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



 


 getRandomAvailableOperator(project_users_available) {
  // var project_users_available = project_users.filter(function (projectUser) {
  //   if (projectUser.user_available == true) {
  //     return true;
  //   }
  //   //return projectUser.user_available;
  // })
  // var project_users_available = getAvailableOperator(project_users);

  // console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE ', project_users_available);
  console.log('-- > OPERATORS [ getRandomAvailableOperator ] - PROJECT USER AVAILABLE LENGHT ', project_users_available.length);
  if (project_users_available.length > 0) {
    var operator = project_users_available[Math.floor(Math.random() * project_users_available.length)];
    console.log('OPERATORS - SELECTED MEMBER ID', operator.id_user);

    // return operator.id_user
    return [{ id_user: operator.id_user }]

  }
  else {

    return []

  }
}



}


var departmentService = new DepartmentService();


module.exports = departmentService;
