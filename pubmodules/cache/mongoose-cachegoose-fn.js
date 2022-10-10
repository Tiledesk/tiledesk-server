 var requestEvent = require("../../event/requestEvent");   
 var messageEvent = require("../../event/messageEvent");   
 var projectEvent = require("../../event/projectEvent");   
 var botEvent = require("../../event/botEvent");   
 var departmentEvent = require("../../event/departmentEvent");   
 var authEvent = require("../../event/authEvent");   
 var labelEvent = require("../../event/labelEvent");

 var triggerEventEmitter = require("../trigger/event/triggerEventEmitter");
 var subscriptionEvent = require("../../event/subscriptionEvent");   

 var winston = require('../../config/winston');

 var cachegoose = require('cachegoose');

 var cacheUtil = require('../../utils/cacheUtil');

 

 function listen(client) {

    projectEvent.on("project.create", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Creating cache for project.create with key: " + key);
            client.set(key, project, cacheUtil.longTTL, (err, reply) => {
                winston.verbose("Created cache for project.create",{err:err});
                winston.debug("Created cache for project.create reply",reply);
            });

            key = "projects:query:*";
            winston.verbose("Deleting cache for project.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.verbose("Deleted cache for project.create",{err:err});
                winston.debug("Deleted cache for project.create",reply);

            }); 
        });  
    });

    projectEvent.on("project.update", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Updating cache for project.update with key: " + key);
            client.set(key, project, cacheUtil.longTTL, (err, reply) => {
                winston.verbose("Updated cache for project.update",{err:err});
                winston.debug("Updated cache for project.update",reply);

            });

            key = "projects:query:*";
            winston.verbose("Deleting cache for project.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for project.create",reply);
                winston.verbose("Deleted cache for project.create",{err:err});
            });   
        });

    });

    projectEvent.on("project.delete", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Deleting cache for project.delete with key: " + key);
            client.del(key, (err, reply) => {
                winston.debug("Deleted cache for project.delete",reply);
                winston.verbose("Deleted cache for project.delete",{err:err});
            });

            key = "projects:query:*";
            winston.verbose("Deleting cache for project.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for project.create",reply);
                winston.verbose("Deleted cache for project.create",{err:err});
            });   
        });
    });

    projectEvent.on("project.downgrade", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Updating cache for project.downgrade with key: " + key);

            client.set(key, project, cacheUtil.longTTL, (err, reply) => {
                winston.debug("Updated cache for project.downgrade",reply);
                winston.verbose("Updated cache for project.downgrade",{err:err});
            });

            key = "projects:query:*";
            winston.verbose("Deleting cache for project.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for project.create",reply);
                winston.verbose("Deleted cache for project.create",{err:err});
            });   
        });
    });




    

    authEvent.on('project_user.update', function(data) {
        setImmediate(() => {

            var project_user = data.updatedProject_userPopulated;

            var key = project_user.id_project+":project_users:id:"+project_user.id;
            winston.verbose("Updating cache for project_user.update with key: " + key);
            client.set(key, project_user, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Updated cache for project_user.update",reply);
                winston.verbose("Updated cache for project_user.update",{err:err});
            });

            if (project_user.id_user) {
                var key = project_user.id_project+":project_users:iduser:"+project_user.id_user;
                winston.verbose("Updating cache for project_user.update with key: " + key);
                client.set(key, project_user, cacheUtil.defaultTTL, (err, reply) => {
                    winston.debug("Updated cache for project_user.update",reply);
                    winston.verbose("Updated cache for project_user.update",{err:err});
                });
            }

            if (project_user.uuid_user) {
                var key = project_user.id_project+":project_users:uuid_user:"+project_user.uuid_user;
                winston.verbose("Updating cache for project_user.update with key: " + key);
                client.set(key, project_user, cacheUtil.defaultTTL, (err, reply) => {
                    winston.debug("Updated cache for project_user.update",reply);
                    winston.verbose("Updated cache for project_user.update",{err:err});
                });
            }
            


            var role = project_user.role;

            var TEAMMATE_ROLES =  {       
                "agent": ["guest","user","agent"],
                "admin": ["guest","user","agent", "admin",],
                "owner": ["guest","user","agent", "admin", "owner"],
            }
            // controllare bene

            var hierarchicalRoles = TEAMMATE_ROLES[role];
            winston.debug("hierarchicalRoles", hierarchicalRoles);
        
            if ( hierarchicalRoles && hierarchicalRoles.includes(role)) {

                var key = project_user.id_project+":project_users:role:teammate:"+project_user.id;
                winston.verbose("Updating cache for project_user.update with key: " + key);
                client.set(key, project_user, cacheUtil.defaultTTL, (err, reply) => {
                    winston.debug("Updated cache for project_user.update",reply);
                    winston.verbose("Updated cache for project_user.update",{err:err});
                });
            }
        });
    });
   




    authEvent.on('user.signup', function(data) {
        setImmediate(() => {
            var user = data.savedUser;

            var key = "users:id:"+user.id;
            winston.verbose("Creating cache for user.signup with key: " + key);
            client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for user.signup",reply);
                winston.verbose("Created cache for user.signup",{err:err});
            });

            var key = "users:email:"+user.email;
            winston.verbose("Creating cache for user.signup with key: " + key);
            client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for user.signup",reply);
                winston.verbose("Created cache for user.signup",{err:err});
            });
        });
    });


    authEvent.on('user.update', function(data) {
        setImmediate(() => {
            var user = data.updatedUser;

            var key = "users:id:"+user.id;
            winston.verbose("Updating cache for user.update with key: " + key);
            client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Updated cache for user.update",reply);
                winston.verbose("Updated cache for user.update",{err:err});
            });

            var key = "users:email:"+user.email;
            winston.verbose("Updating cache for user.update with key: " + key);
            client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Updated cache for user.update",reply);
                winston.verbose("Updated cache for user.update",{err:err});
            });
        });
    });
   
    authEvent.on('user.delete', function(data) {
        setImmediate(() => {
            var user = data.user;

            var key = "users:id:"+user.id;
            winston.verbose("Deleting cache for user.delete with key: " + key);
            client.del(key, (err, reply) => {
                winston.debug("Deleted cache for user.delete",reply);
                winston.verbose("Deleted cache for user.delete",{err:err});
            });

            var key = "users:email:"+user.email;
            winston.verbose("Deleting cache for user.delete with key: " + key);
            client.del(key, (err, reply) => {
                winston.debug("Deleted cache for user.delete",reply);
                winston.verbose("Deleted cache for user.delete",{err:err});
            });
        });
    });




    requestEvent.on("request.create.simple", function(request) {
        setImmediate(() => {
            var key = request.id_project+":requests:id:"+request.id+":simple";
            winston.verbose("Creating cache for request.create.simple with key: " + key);

            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.create.simple",reply);
                winston.verbose("Created cache for request.create.simple",{err:err});
            });


            var key = "requests:id:"+request.request_id+":simple";  //without project for chat21 webhook
            winston.verbose("Creating cache for request.create.simple with key: " + key);

            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.create.simple",reply);
                winston.verbose("Created cache for request.create.simple",{err:err});
            });

            var key = request.id_project+":requests:request_id:"+request.request_id+":simple";
            winston.verbose("Creating cache for request.create.simple with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.create.simple",reply);
                winston.verbose("Created cache for request.create.simple",{err:err});
            });

        })
    });

    requestEvent.on("request.create", function(request) {
        setImmediate(() => {
            var key = request.id_project+":requests:id:"+request.id;
            winston.verbose("Creating cache for request.create with key: " + key);

            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.create",reply);
                winston.verbose("Created cache for request.create",{err:err});
            });

            var key = request.id_project+":requests:request_id:"+request.request_id;
            winston.verbose("Creating cache for request.create with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.create",reply);
                winston.verbose("Created cache for request.create",{err:err});
            });

            key = request.id_project+":requests:query:*";
            winston.verbose("Deleting cache for request.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for request.create",reply);
                winston.verbose("Deleted cache for request.create",{err:err});
            });   
        });
    });



    requestEvent.on("request.update", function(request) {  
        setImmediate(() => {
            var key = request.id_project+":requests:id:"+request.id;
            winston.verbose("Creating cache for request.update with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.update",reply);
                winston.verbose("Created cache for request.update",{err:err});
            });

            var key = request.id_project+":requests:request_id:"+request.request_id;
            winston.verbose("Creating cache for request.update with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.update",reply);
                winston.verbose("Created cache for request.update",{err:err});
            });

            key = request.id_project+":requests:query:*";
            winston.verbose("Deleting cache for request.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for request.create",reply);
                winston.verbose("Deleted cache for request.create",{err:err});
            });   
        });
    });


    requestEvent.on("request.close", function(request) { 
        setImmediate(() => {
            var key = request.id_project+":requests:id:"+request.id;
            winston.verbose("Creating cache for request.close with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.close",reply);
                winston.verbose("Created cache for request.close",{err:err});
            });

            var key = request.id_project+":requests:request_id:"+request.request_id;
            winston.verbose("Creating cache for request.close with key: " + key);
            client.set(key, request, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for request.close",reply);
                winston.verbose("Created cache for request.close",{err:err});
            });

            key = request.id_project+":requests:query:*";
            winston.verbose("Deleting cache for request.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for request.create",reply);
                winston.verbose("Deleted cache for request.create",{err:err});
            });   
        });
    });




// non serve tanto
    // messageEvent.on("message.create", function(message) { 
    //     setImmediate(() => {
    //         var key = message.id_project+":requests:id:"+message.request._id + ":messages:id:" + message._id;
    //         winston.verbose("Creating cache for message.create with key: " + key);
    //         client.set(key, message, cacheUtil.defaultTTL, (err, reply) => {
    //             winston.verbose("Created cache for message.create",{err:err, reply:reply});
    //         });

    //         var key = message.id_project+":requests:request_id:"+message.request.request_id + ":messages:id:" + message._id;        
    //         winston.verbose("Creating cache for message.create with key: " + key);
    //         client.set(key, message, cacheUtil.defaultTTL, (err, reply) => {
    //             winston.verbose("Created cache for message.create",{err:err, reply:reply});
    //         });
    //     });
    // });



    botEvent.on("faqbot.create", function(faq_kb) {
        setImmediate(() => {
            var key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id;
            winston.verbose("Creating cache for faq_kb.create with key: " + key);
            client.set(key, faq_kb, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for faq_kb.create",reply);
                winston.verbose("Created cache for faq_kb.create",{err:err});
            });
        });
    });



    botEvent.on("faqbot.update", function(faq_kb) { 
        setImmediate(() => {
            var key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id;
            winston.verbose("Creating cache for faq_kb.update with key: " + key);
            client.set(key, faq_kb, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for faq_kb.create",reply);
                winston.verbose("Created cache for faq_kb.update",{err:err});
            });       
        });
    });


    botEvent.on("faqbot.delete", function(faq_kb) { 
        setImmediate(() => {
            var key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id;
            winston.verbose("Creating cache for faqbot.delete with key: " + key);
            client.set(key, faq_kb, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for faqbot.delete",reply);
                winston.verbose("Created cache for faqbot.delete",{err:err});
            });
        });
    });


    departmentEvent.on("department.create", function(department) {
        setImmediate(() => {
            var key = department.id_project+":departments:id:"+department._id;
            winston.verbose("Creating cache for department.create with key: " + key);
            client.set(key, department, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for department.create",reply);
                winston.verbose("Created cache for department.create",{err:err});
            });
            
            key = department.id_project+":departments:query:*";        
            winston.verbose("Deleting cache for department.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for department.create",reply);
                winston.verbose("Deleted cache for department.create",{err:err});
            });   
        });
    });



    departmentEvent.on("department.update", function(department) {  
        setImmediate(() => {
            var key = department.id_project+":departments:id:"+department._id;
            winston.verbose("Creating cache for department.update with key: " + key);
            client.set(key, department, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for department.update",reply);
                winston.verbose("Created cache for department.update",{err:err});
            });    

            key = department.id_project+":departments:query:*";        
            winston.verbose("Deleting cache for department.update with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for department.update",reply);
                winston.verbose("Deleted cache for department.update",{err:err});
            });   
        });
    });


    departmentEvent.on("department.delete", function(department) { 
        setImmediate(() => {
            var key = department.id_project+":departments:id:"+department._id;
            winston.verbose("Creating cache for department.delete with key: " + key);
            client.set(key, department, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for department.delete",reply);
                winston.verbose("Created cache for department.delete",{err:err});
            });

            key = department.id_project+":departments:query:*";        
            winston.verbose("Deleting cache for department.delete with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for department.delete",reply);
                winston.verbose("Deleted cache for department.delete",{err:err});
            });   
        });
    });


    labelEvent.on("label.create", function(label) { 
        setImmediate(() => {    
            var key = label.id_project+":labels:query:*";        
            winston.verbose("Deleting cache for label.create with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for label.create",reply);
                winston.verbose("Deleted cache for label.create",{err:err});
            });   
        });
    });



    labelEvent.on("label.update", function(label) {        
        setImmediate(() => {    
            var key = label.id_project+":labels:query:*";        
            winston.verbose("Deleting cache for label.update with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for label.update",reply);
                winston.verbose("Deleted cache for label.update",{err:err});
            });   
        });
    });


    labelEvent.on("label.clone", function(label) {    
        setImmediate(() => {         
            var key = label.id_project+":labels:query:*";        
            winston.verbose("Deleting cache for label.clone with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for label.clone",reply);
                winston.verbose("Deleted cache for label.clone",{err:err});
            });   
        });
    });


    labelEvent.on("label.delete", function(label) {     
        setImmediate(() => {         
            var key = label.id_project+":labels:query:*";        
            winston.verbose("Deleting cache for label.delete with key: " + key);
            client.del(key, function (err, reply) {
                winston.debug("Deleted cache for label.delete",reply);
                winston.verbose("Deleted cache for label.delete",{err:err});
            });   
        });
    });

    // fai cache per subscription.create, .update .delete


    if (subscriptionEvent) {
        subscriptionEvent.on('subscription.create', function(trigger) {   
            setImmediate(() => {    
                
                var key =trigger.id_project+":subscriptions:*";        
                winston.verbose("Deleting cache for subscription.create with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.create",reply);
                    winston.verbose("Deleted cache for subscription.create",{err:err});
                });   
            });
        });
    
        subscriptionEvent.on('subscription.update', function(trigger) {   
            setImmediate(() => {         
                var key =trigger.id_project+":subscriptions:*";        
                winston.verbose("Deleting cache for subscription.update with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.update",reply);
                    winston.verbose("Deleted cache for subscription.update",{err:err});
                });   
            });
        });
    
        subscriptionEvent.on("subscription.delete", function(trigger) {     
            setImmediate(() => {         
                var key =trigger.id_project+":subscriptions:*";         
                winston.verbose("Deleting cache for subscription.delete with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.delete",reply);
                    winston.verbose("Deleted cache for subscription.delete",{err:err});
                });   
            });
        });
    
    }


    if (triggerEventEmitter) {
        triggerEventEmitter.on('trigger.create', function(trigger) {   
            setImmediate(() => {    
                
                var key =trigger.id_project+":triggers:*";        
                winston.verbose("Deleting cache for trigger.create with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.create",reply);
                    winston.verbose("Deleted cache for trigger.create",{err:err});
                });   
            });
        });
    
        triggerEventEmitter.on('trigger.update', function(trigger) {   
            setImmediate(() => {         
                var key =trigger.id_project+":triggers:*";        
                winston.verbose("Deleting cache for trigger.update with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.update",reply);
                    winston.verbose("Deleted cache for trigger.update",{err:err});
                });   
            });
        });
    
        triggerEventEmitter.on("trigger.delete", function(trigger) {     
            setImmediate(() => {         
                var key =trigger.id_project+":triggers:*";         
                winston.verbose("Deleting cache for trigger.delete with key: " + key);
                client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.delete",reply);
                    winston.verbose("Deleted cache for trigger.delete",{err:err});
                });   
            });
        });
    
    }
    
    //jwt

    // fai cache faq

 }

module.exports = function (mongoose, option) {

    if (process.env.CACHE_ENABLED == true || process.env.CACHE_ENABLED == "true") {
        var engine = process.env.CACHE_ENGINE;
        winston.debug("Redis engine: "+ engine);

        // var endPoint = process.env.CACHE_REDIS_ENDPOINT || "redis://127.0.0.1:6379";
        // winston.debug("Redis endpoint: "+ endPoint);

        var port = process.env.CACHE_REDIS_PORT || 6379;
        winston.debug("Redis port: "+ port);

        var host = process.env.CACHE_REDIS_HOST || "127.0.0.1"
        winston.debug("Redis host: "+ host);

        var password = process.env.CACHE_REDIS_PASSWORD;
        winston.debug("Redis password: "+ password);
        
        winston.info("Mongoose Cachegoose fn initialized, engine: " + engine + ", port: "+ port + ", host: "+ host  + " defaultTTL: " +cacheUtil.defaultTTL + ", password: "+ password);
        // winston.info("Mongoose Cachegoose fn initialized, engine: " + engine + ", endpoint: "+endPoint +", port: "+ port + ", host: "+ host + ", password: "+ password);



        
        // cachegoose(mongoose, endPoint);
        
        cachegoose(mongoose, {
            engine: engine,    /* If you don't specify the redis engine,      */
            port: port,         /* the query results will be cached in memory. */            
            host: host,
            password: password           
          });

        var client = cachegoose._cache;
        listen(client);
    }else {
        winston.info("Mongoose Cachegoose disabled");
    }

    // console.log("init",init);  
    // console.log("cachegoose._cache",cachegoose._cache);  
    // cachegoose._cache.get("/projects/5ea800091147f28c72b90c5e", (err, cachedResults) => { //
    //     console.log("cachedResults",cachedResults);  
    // });

  
}