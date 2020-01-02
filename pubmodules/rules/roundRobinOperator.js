const Request = require('../../models/request');

const departmentEvent = require('../../event/departmentEvent');
var winston = require('../../config/winston');
// var sleep = require('thread-sleep');

// let getLastRequest=async function(query){
//     try {
//     let lastRequests = await Request.find(query).sort({_id:-1}).limit(1);
//         console.log('lastRequests',lastRequests); // contains user object
//         return lastRequests;
//     }catch(e) {
//         console.log(e);
//     }
// }






// unused
class RoundRobinOperator {

    
    start() {

        var that = this;
        departmentEvent.on('operator.select',  function(operatorSelectedEvent) {
            winston.debug('operatorSelectedEvent', operatorSelectedEvent); 
            // https://stackoverflow.com/questions/14789684/find-mongodb-records-where-array-field-is-not-empty
            let query = {id_project: operatorSelectedEvent.id_project, participants: { $exists: true, $ne: [] }};
            
            winston.info('query', query);            

            // let lastRequests = await 
            Request.find(query).sort({_id:-1}).limit(1).exec(function (err, lastRequests) {
                if (err) {
                    winston.error('Error getting request for RoundRobinOperator', err); 
                }
               
                let lastRequests =  getLastRequest(query);

                if (lastRequests.length==0) {
                    winston.info('lastRequest not found'); 
                    //first request use default random algoritm
                    return 0;
                }

                var start = Date.now();
                var res = sleep(5000);
                var end = Date.now();
                // res is the actual time that we slept for
                console.log(res + ' ~= ' + (end - start) + ' ~= 1000');


                let lastRequest = lastRequests[0];
                winston.info('lastRequest:'+ JSON.stringify(lastRequest)); 

                let lastOperatorId = lastRequest.participants[0];
                winston.info('lastOperatorId: ' + lastOperatorId);

                // var picked = lodash.filter(operatorSelectedEvent.available_agents, projectUser => projectUser.id_user === lastOperatorId);

                // https://stackoverflow.com/questions/15997879/get-the-index-of-the-object-inside-an-array-matching-a-condition
                let lastOperatorIndex = operatorSelectedEvent.available_agents.findIndex(projectUser => projectUser.id_user.toString() === lastOperatorId);

                // console.log(projectUser.toObject()


                // var lastOperatorIndex = operatorSelectedEvent.available_agents.filter(function(projectUser, index) {
                //     if (projectUser.id_user ===lastOperatorId) {
                //         return index;
                //     }                      
                // });

                winston.info('lastOperatorIndex: ' + lastOperatorIndex);

                let nextOperator = that.next(operatorSelectedEvent.available_agents, lastOperatorIndex);
                winston.info('nextOperator: ' ,nextOperator.toJSON());


                // operatorSelectedEvent.operators = [{id_user: nextOperator.id_user}];
                operatorSelectedEvent.operators = [nextOperator];
                return operatorSelectedEvent;
            });
        });
        

    }

    next (array, index) {
        index = index || 0;
      
        if (array === undefined || array === null)
          array = [];
        else if (!Array.isArray(array))
          throw new Error('Expecting argument to RoundRound to be an Array');
      
        // return function () {
            index++;
          if (index >= array.length) index = 0;
          winston.info('index: ' + index);
          return array[index];
        // };
    }
}

var roundRobinOperator = new RoundRobinOperator();
module.exports = roundRobinOperator;