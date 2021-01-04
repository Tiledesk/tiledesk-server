// UNUSED
var appRoot = require('app-root-path');
var winston = require('winston');
var config = require('./database');

// https://github.com/winstonjs/winston/issues/736
var loggers = {}

function getLogger(moduleName) {
  if (!loggers[moduleName]) {
    loggers[moduleName] = createNewLogger(moduleName)
  }

  return loggers[moduleName]
}


var level = process.env.LOG_LEVEL || 'info'
// console.log("level",level);




  function createNewLogger(moduleName) {  

    var options = {
      file: {
        level:level ,
        filename: `${appRoot}/logs/${moduleName}.log`,
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
        format: winston.format.simple()
      }
    };

    let logger = winston.createLogger({    
      transports: [
      new (winston.transports.File)(options.file),
      //new (winston.transports.MongoDB)( {db: logsDb, collection: "logs"}) 
      ],
      exitOnError: false, // do not exit on handled exceptions
    });
   
    return logger
  }
  
  


  // if (process.env.WRITE_LOG_TO_MONGODB=="true") {
  //   require('winston-mongodb');


  //   if (process.env.NODE_ENV == 'test')  {
  //     var logsDb = config.databasetest;
  //   }else {
  //     var logsDb = config.database;
  //   }
 

  //   console.log("Added winston MongoDB transport");
  //   logger.add(new winston.transports.MongoDB({db: logsDb, collection: "logsmt"}));
  // }
    


  // logger.stream = {
  //   write: function(message, encoding) {
  //     logger.info(message);
  //   },
  // };


  module.exports = getLogger
