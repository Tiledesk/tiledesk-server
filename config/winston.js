var appRoot = require('app-root-path');
var winston = require('winston');
var config = require('./database');

var level = process.env.LOG_LEVEL || 'info'
// console.log("level",level);

var options = {
    file: {
      level:level ,
      filename: `${appRoot}/logs/app.log`,
      handleExceptions: true,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      format: winston.format.simple()
    },
    console: {
      level: level,
      handleExceptions: true,
      json: true,
      colorize: true,
      // timestamp: true,
      format: winston.format.simple()     
    },
  };

//   https://stackoverflow.com/questions/51074805/typeerror-winston-logger-is-not-a-constructor-with-winston-and-morgan
//   var logger = new winston.Logger({
//     transports: [
//       new winston.transports.File(options.file),
//       new winston.transports.Console(options.console)
//     ],
//     exitOnError: false, // do not exit on handled exceptions
//   });



  let logger = winston.createLogger({    
    transports: [
     new (winston.transports.Console)(options.console),
     new (winston.transports.File)(options.file),
     //new (winston.transports.MongoDB)( {db: logsDb, collection: "logs"}) 
    ],
    exitOnError: false, // do not exit on handled exceptions
  });

    
  if (process.env.WRITE_LOG_TO_MONGODB=="true") {
    require('winston-mongodb');
    // require('../utils/winston-mongodb/winston-mongodb');

    if (process.env.NODE_ENV == 'test')  {
      var logsDb = process.env.DATABASE_LOG_URI || process.env.DATABASE_URI || process.env.MONGODB_URI || config.databasetest;
    }else {
      var logsDb = process.env.DATABASE_LOG_URI || process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;
    }

    console.log("Added winston MongoDB transport");
    logger.add(new winston.transports.MongoDB({db: logsDb, level: process.env.LOG_MONGODB_LEVEL || 'info', collection: "logs"}));
  }


  logger.stream = {
    write: function(message, encoding) {
      logger.info(message);
    },
  };

  // if (process.env.NODE_ENV !== 'production') {
  //   logger.add(new winston.transports.Console({
  //     format: winston.format.simple()
  //   }));
  // }

    /**
   * Requiring `winston-mongodb` will expose
   * `winston.transports.MongoDB`
   */
  // require('winston-mongodb');
  // winston.add(winston.transports.MongoDB, 
  //     {
  //      // db: config.databasetest,
  //       db: 'mongodb://localhost/tiledesk-test',
  //       collection: "logs"
  //     }
  // );


  module.exports = logger;
