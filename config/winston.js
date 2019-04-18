var appRoot = require('app-root-path');
var winston = require('winston');
// var config = require('../config/database');


var options = {
    file: {
      level: 'info',
      filename: `${appRoot}/logs/app.log`,
      handleExceptions: true,
      json: false,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      format: winston.format.simple()
    },
    console: {
      level: 'info',
      handleExceptions: true,
      json: true,
      colorize: true,
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





//   require('winston-mongodb');

//   if (process.env.NODE_ENV == 'test')  {
//     var logsDb = config.databasetest;
//   }else {
//     var logsDb = config.database;
//   }

  let logger = winston.createLogger({
    transports: [
     new (winston.transports.Console)(options.console),
    //   new (winston.transports.File)(options.errorFile),
      new (winston.transports.File)(options.file),
     // new (winston.transports.MongoDB)( {db: logsDb, collection: "logs"}) 
    ],
    exitOnError: false, // do not exit on handled exceptions
  });

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
