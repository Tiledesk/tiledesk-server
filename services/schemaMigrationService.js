'use strict';

var winston = require('../config/winston');
var config = require('../config/database');
var migrateMongoose = require('migrate-mongoose');

class SchamaMigrationService {


    isEmptyObject(obj) {

      if (obj.length && obj.length > 0)
          return false;          

      if (obj.length === 0)
        return true;           
  }  

    async checkSchemaMigration(currentSchamaVersion) {

      if (process.env.DISABLE_AUTO_SHEMA_MIGRATION === "true") {
        winston.info("SchemaMigration auto migrate schema is disabled");
        return;
      }
      
      winston.info("SchemaMigration checking for schema updates.");

      // Define all your variables
      var 
      //  migrationsDir = '/path/to/migrations/',
      // templatePath,
      dbUrl = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database,
      collectionName = 'schemaMigrations',
      autosync = true;
      
      let migrator = new migrateMongoose({
          // migrationsPath:  migrationsDir, // Path to migrations directory
          // templatePath: templatePath, // The template to use when creating migrations needs up and down functions exposed
          dbConnectionUri: dbUrl, // mongo url
          collectionName:  collectionName, // collection name to use for migrations (defaults to 'migrations')
          autosync: autosync // if making a CLI app, set this to false to prompt the user, otherwise true
      });
      
      var list = await migrator.list();
      winston.debug("SchemaMigration script list", list);

      list.forEach(async(script)=> { 
        winston.debug("script", script);
        var runScript = await migrator.run('up', script.name);
        if (runScript && !this.isEmptyObject(runScript)) {
          winston.info("SchemaMigration script " + script.name + " executed.");
        }
      }); 
    // // Create a new migration
    // migrator.create(migrationName).then(()=> {
    //   console.log(`Migration created. Run `+ `mongoose-migrate up ${migrationName}`.cyan + ` to apply the migration.`);
    // });
    
    // // Migrate Up
    // promise = migrator.run('up', migrationName);
    
    // // Migrate Down
    // promise = migrator.run('down', migrationName);
    
    // // List Migrations
    // /*
    // Example return val
    
    // Promise which resolves with
    // [
    //  { name: 'my-migration', filename: '149213223424_my-migration.js', state: 'up' },
    //  { name: 'add-cows', filename: '149213223453_add-cows.js', state: 'down' }
    // ]
    
    // */
    // promise = migrator.list();
    
    
    // // Prune extraneous migrations from file system
    // promise = migrator.prune();
    
    // // Synchronize DB with latest migrations from file system
    // /*
    // Looks at the file system migrations and imports any migrations that are
    // on the file system but missing in the database into the database
    
    // This functionality is opposite of prune()
    // */
    // var promise = await migrator.sync();
    // console.log("SchemaMigration synched", promise)
    

  
  }
    // async checkSchemaMigration(currentSchamaVersion) {
    //   var migrationUpdateOperation = [
    //     {
    //       schemaVersion: 300000,
    //       operation: `db.requests.update(
    //         { preflight : { $exists: false }},
    //         { $set: {"preflighttest": false} },
    //         false,
    //         true
    //       )`
    //     },
    //     {
    //       schemaVersion: 200000,
    //       operation: `db.requests.update(
    //         { preflight : { $exists: false }},
    //         { $set: {"preflighttest": false} },
    //         false,
    //         true
    //       )`
    //     }
    //   ];
  
    //   migrationUpdateOperation.sort((a, b) => a > b);
  
    //   winston.info("migrationUpdateOperation", migrationUpdateOperation);
  
      
  
      
    //     const db  = mongoose.connection;
    //     winston.info("db",db);
  
      
    //     db.once('open', function callback () {
  
    //       migrationUpdateOperation.forEach(async(migOperation)=> {
    //         try {
    //           var operation = migOperation.operation;
    //           winston.info("Schema migration operation:"+ operation);
    //           const result = await db.db.command(operation);
    //           winston.info("Schema migration result", result);
    //         } catch(e) {
    //           winston.error("Error during schema migration", e);
    //         }
    //       });
    //     });
        
    
    
     
    //   // var bulk = Setting.collection.initializeUnorderedBulkOp();
    //   //   bulk.find({<query>}).update({<update>});
    //   //   bulk.find({<query2>}).update({<update2>});
        
    //   //   bulk.execute(function(err) {
    //   //       ...
    //   //   });
  
    // }

}

var schamaMigrationService = new SchamaMigrationService();


module.exports = schamaMigrationService;
