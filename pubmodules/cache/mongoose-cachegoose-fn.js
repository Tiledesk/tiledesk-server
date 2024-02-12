 var requestEvent = require("../../event/requestEvent");   
 var messageEvent = require("../../event/messageEvent");   
 var projectEvent = require("../../event/projectEvent");   
 var botEvent = require("../../event/botEvent");   
 const faqBotEvent = require('../../event/faqBotEvent');
 var departmentEvent = require("../../event/departmentEvent");   
 var authEvent = require("../../event/authEvent");   
 var labelEvent = require("../../event/labelEvent");
 var integrationEvent = require("../../event/integrationEvent");

 var triggerEventEmitter = require("../trigger/event/triggerEventEmitter");
 var subscriptionEvent = require("../../event/subscriptionEvent");   

 var winston = require('../../config/winston');

 var cachegoose = require('cachegoose');

 var cacheUtil = require('../../utils/cacheUtil');
 var RoleConstants = require("../../models/roleConstants");

 
 async function del(client, key, callback) {
    key = "cacheman:cachegoose-cache:" + key;
    winston.debug("key: "+key)
   
    // client.del(key, function (err, data) {
    //     if (err) {
    //         return callback(error);
    //     } else {
    //         winston.info("del data: "+ data)

    //         return callback(null, data);
    //     }
    // });

    // client.del(key).then(function(result) {
    //     winston.info("result", result)
    //     return callback(null, result);
    // }).catch(function(error) {
    //     winston.error("here3", error)
    //     return callback(error);
    // });

    var res = await client.del(key)
    winston.debug("result: "+ res)
    if (res) {
        return callback(null, res); 
    } else {
        var error = "error";
        return callback(error);
    }
 }

 function listen(client) {

    projectEvent.on("project.create", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Creating cache for project.create with key: " + key);
            client.set(key, project, cacheUtil.longTTL, (err, reply) => {
                winston.verbose("Created cache for project.create",{err:err});
                winston.debug("Created cache for project.create reply",reply);
            });

            // TODO COMMENTA NON USATO
            // key = "projects:query:*";
            // winston.verbose("Deleting cache for project.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.verbose("Deleted cache for project.create",{err:err});
            //     winston.debug("Deleted cache for project.create",reply);

            // }); 
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

            // TODO COMMENTA NON USATO
            // key = "projects:query:*";
            // winston.verbose("Deleting cache for project.update with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for project.update",reply);
            //     winston.verbose("Deleted cache for project.update",{err:err});
            // });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for project.update");
            invalidateWidgets(client, project.id); //tested
        });

    });

    projectEvent.on("project.delete", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Deleting cache for project.delete with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, (err, reply) => {
                winston.debug("Deleted cache for project.delete",reply);
                winston.verbose("Deleted cache for project.delete",{err:err});
            });

            // TODO COMMENTA NON USATO
            // key = "projects:query:*";
            // winston.verbose("Deleting cache for project.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for project.create",reply);
            //     winston.verbose("Deleted cache for project.create",{err:err});
            // });   
        });

        // TODO invalidate widgets here
        winston.verbose("Deleting widgets cache for project.delete");
        invalidateWidgets(client, project.id);
    });

    projectEvent.on("project.downgrade", function(project) {
        setImmediate(() => {
            var key = "projects:id:"+project.id;
            winston.verbose("Updating cache for project.downgrade with key: " + key);

            client.set(key, project, cacheUtil.longTTL, (err, reply) => {
                winston.debug("Updated cache for project.downgrade",reply);
                winston.verbose("Updated cache for project.downgrade",{err:err});
            });

            // TODO COMMENTA NON USATO
            // key = "projects:query:*";
            // winston.verbose("Deleting cache for project.downgrade with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for project.downgrade",reply);
            //     winston.verbose("Deleted cache for project.downgrade",{err:err});
            // }); 
            
            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for project.downgrade");
            invalidateWidgets(client, project.id);
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


            
            // TODO invalidate widgets headers
            // only if role is agent, owner, admin ATTENTION
            if (role == RoleConstants.OWNER || role == RoleConstants.ADMIN || role == RoleConstants.SUPERVISOR || role == RoleConstants.AGENT) {
                winston.verbose("Deleting widgets cache for project_user.update");
                invalidateWidgets(client, project_user.id_project);    //tested
            }else {
                winston.verbose("NOT invalidating widget cache for non admins project_user role");//tested
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

            // NOT IN USE (TESTED)
            // var key = "users:email:"+user.email;
            // winston.verbose("Creating cache for user.signup with key: " + key);
            // client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
            //     winston.debug("Created cache for user.signup",reply);
            //     winston.verbose("Created cache for user.signup",{err:err});
            // });
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

            // NOT IN USE (TESTED)
            // var key = "users:email:"+user.email;
            // winston.verbose("Updating cache for user.update with key: " + key);
            // client.set(key, user, cacheUtil.defaultTTL, (err, reply) => {
            //     winston.debug("Updated cache for user.update",reply);
            //     winston.verbose("Updated cache for user.update",{err:err});
            // });
        });
    });
   
    authEvent.on('user.delete', function(data) {
        setImmediate(() => {
            var user = data.user;

            var key = "users:id:"+user.id;
            winston.verbose("Deleting cache for user.delete with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, (err, reply) => {
                winston.debug("Deleted cache for user.delete",reply);
                winston.verbose("Deleted cache for user.delete",{err:err});
            });

            // NOT IN USE (TESTED)
            // var key = "users:email:"+user.email;
            // winston.verbose("Deleting cache for user.delete with key: " + key);
            // client.del(key, (err, reply) => {
            //     winston.debug("Deleted cache for user.delete",reply);
            //     winston.verbose("Deleted cache for user.delete",{err:err});
            // });
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


            var key = "requests:request_id:"+request.request_id+":simple";  //without project for chat21 webhook
            winston.verbose("Creating cache for request.create.simple without project with key : " + key);

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

    function invalidatRequestSimple(client, project_id, rid, request_id) {
        var key = project_id+":requests:id:"+rid+":simple";
        winston.verbose("Deleting cache for widgets with key: " + key);

        // found del
        winston.debug("Deleted4545");
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for invalidatRequestSimple",reply);
            winston.verbose("Deleted cache for invalidatRequestSimple",{err:err});
        });   

        key = "requests:request_id:"+request_id+":simple";  //without project for chat21 webhook
        winston.verbose("Creating cache for request.create.simple for invalidatRequestSimple without project with key : " + key);
        // found del
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for invalidatRequestSimple",reply);
            winston.verbose("Deleted cache for invalidatRequestSimple",{err:err});
        });   

        key = project_id+":requests:request_id:"+request_id+":simple";
        winston.verbose("Creating cache for request.create.simple for invalidatRequestSimple with key: " + key);
        // found del
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for invalidatRequestSimple",reply);
            winston.verbose("Deleted cache for invalidatRequestSimple",{err:err});
        });   


    }


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

            // TODO COMMENTA NON USATO
            // key = request.id_project+":requests:query:*";
            // winston.verbose("Deleting cache for request.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for request.create",reply);
            //     winston.verbose("Deleted cache for request.create",{err:err});
            // });   

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

            // TODO COMMENTA NON USATO
            // key = request.id_project+":requests:query:*";
            // winston.verbose("Deleting cache for request.update with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for request.update",reply);
            //     winston.verbose("Deleted cache for request.update",{err:err});
            // });   

            invalidatRequestSimple(client, request.id_project, request.id, request.request_id)

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

            // TODO COMMENTA NON USATO
            // key = request.id_project+":requests:query:*";
            // winston.verbose("Deleting cache for request.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for request.close",reply);
            //     winston.verbose("Deleted cache for request.close",{err:err});
            // });   

            invalidatRequestSimple(client, request.id_project, request.id, request.request_id)

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
            let clonedbot = Object.assign({}, faq_kb);
            delete clonedbot.secret;

            var key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id;
            winston.verbose("Creating cache for faq_kb.create with key: " + key);
            client.set(key, clonedbot, cacheUtil.defaultTTL, (err, reply) => {
                winston.debug("Created cache for faq_kb.create",reply);
                winston.verbose("Created cache for faq_kb.create",{err:err});
            });

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faqbot.create");
            invalidateWidgets(client, faq_kb.id_project); //tested
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
            

            key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id+":secret";
            winston.verbose("Deleting cache for faq_kb.update secret with key: " + key);
            // found del
            // winston.info("quiqui", client._cache);
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, function (err, reply) {  //tested
                winston.debug("Deleted cache for faq_kb.update secret",reply);
                winston.verbose("Deleted cache for faq_kb.update secret",{err:err});
            });   

            // without project for tilebot
            key = "faq_kbs:id:"+faq_kb._id;
            winston.verbose("Deleting cache for faq_kb.update without project for tilebot with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, function (err, reply) {  
                winston.debug("Deleted cache for faq_kb.update  without project for tilebot ",reply);
                winston.verbose("Deleted cache for faq_kb.update  without project for tilebot ",{err:err});
            });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faqbot.update");
            invalidateWidgets(client, faq_kb.id_project); //TESTED
        });
    });


    botEvent.on("faqbot.delete", function(faq_kb) {   //LOGIC deletion for chatbot is used
        setImmediate(() => {
            var key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id;
            winston.verbose("Deleting cache for faqbot.delete with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, (err, reply) => {
                winston.debug("Deleted cache for faqbot.delete",reply);
                winston.verbose("Deleted cache for faqbot.delete",{err:err});
            });


            key = faq_kb.id_project+":faq_kbs:id:"+faq_kb._id+":secret";
            winston.verbose("Deleting cache for faq_kb.delete secret with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, function (err, reply) {
                winston.debug("Deleted cache for faq_kb.delete secret",reply);
                winston.verbose("Deleted cache for faq_kb.delete secret",{err:err});
            });  
            

            // without project for tilebot
            key = "faq_kbs:id:"+faq_kb._id;
            winston.verbose("Deleting cache for faq_kb.update without project for tilebot with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, function (err, reply) {  
                winston.debug("Deleted cache for faq_kb.update  without project for tilebot ",reply);
                winston.verbose("Deleted cache for faq_kb.update  without project for tilebot ",{err:err});
            });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faqbot.delete");
            invalidateWidgets(client, faq_kb.id_project); //tested
        });
    });



    faqBotEvent.on("faq.create", function(faq) { 
        setImmediate(() => {            
            
            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faq.create");
            invalidateWidgets(client, faq.id_project); //tested
        });
    });

    faqBotEvent.on("faq.update", function(faq) { 
        setImmediate(() => {            
            invalidateFaq(client, faq);

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faq.update");
            invalidateWidgets(client, faq.id_project);//tested
        });
    });

    faqBotEvent.on("faq.delete", function(faq) { 
        setImmediate(() => {            
            invalidateFaq(client, faq);           

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for faq.delete",faq);
            invalidateWidgets(client, faq.id_project);//tested
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
            
            // TODO COMMENTA NON USATO
            // key = department.id_project+":departments:query:*";        
            // winston.verbose("Deleting cache for department.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for department.create",reply);
            //     winston.verbose("Deleted cache for department.create",{err:err});
            // });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for department.create");
            invalidateWidgets(client, department.id_project); 
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

            // TODO COMMENTA NON USATO
            // key = department.id_project+":departments:query:*";        
            // winston.verbose("Deleting cache for department.update with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for department.update",reply);
            //     winston.verbose("Deleted cache for department.update",{err:err});
            // });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for department.update");
            invalidateWidgets(client, department.id_project); //tested
        });
    });


    departmentEvent.on("department.delete", function(department) { 
        setImmediate(() => {
            var key = department.id_project+":departments:id:"+department._id;
            winston.verbose("Deleting cache for department.delete with key: " + key);
            // found del
            del(client._cache._engine.client, key, function (err, reply) {  //tested
            // client.del(key, (err, reply) => {
                winston.debug("Deleted cache for department.delete",reply);
                winston.verbose("Deleted cache for department.delete",{err:err});
            });

            // TODO COMMENTA NON USATO
            // key = department.id_project+":departments:query:*";        
            // winston.verbose("Deleting cache for department.delete with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for department.delete",reply);
            //     winston.verbose("Deleted cache for department.delete",{err:err});
            // });   

            // TODO invalidate widgets here
            winston.verbose("Deleting widgets cache for department.delete");
            invalidateWidgets(client, department.id_project);
        });
    });


    labelEvent.on("label.create", function(label) { 
        setImmediate(() => {    

            // TODO COMMENTA NON USATO
            // var key = label.id_project+":labels:query:*";        
            // winston.verbose("Deleting cache for label.create with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for label.create",reply);
            //     winston.verbose("Deleted cache for label.create",{err:err});
            // });   
        });
    });



    labelEvent.on("label.update", function(label) {        
        setImmediate(() => {    

            // TODO COMMENTA NON USATO
            // var key = label.id_project+":labels:query:*";        
            // winston.verbose("Deleting cache for label.update with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for label.update",reply);
            //     winston.verbose("Deleted cache for label.update",{err:err});
            // });   
        });
    });


    labelEvent.on("label.clone", function(label) {    
        setImmediate(() => {       
            
            // TODO COMMENTA NON USATO
            // var key = label.id_project+":labels:query:*";        
            // winston.verbose("Deleting cache for label.clone with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for label.clone",reply);
            //     winston.verbose("Deleted cache for label.clone",{err:err});
            // });   
        });
    });


    labelEvent.on("label.delete", function(label) {     
        setImmediate(() => {         

            // TODO COMMENTA NON USATO
            // var key = label.id_project+":labels:query:*";        
            // winston.verbose("Deleting cache for label.delete with key: " + key);
            // client.del(key, function (err, reply) {
            //     winston.debug("Deleted cache for label.delete",reply);
            //     winston.verbose("Deleted cache for label.delete",{err:err});
            // });   
        });
    });

    // l'evento è relativo a tutte le integrazioni, è sufficiente solo un evento
    // per create, update, delete di una singola creation
    integrationEvent.on("integration.update", (integrations, id_project) => {
        let key = "project:" + id_project + ":integrations";
        winston.verbose("Creating cache for integration.create with key: " + key);
        client.set(key, integrations, cacheUtil.longTTL, (err, reply) => {
            winston.verbose("Created cache for integration.create", {err: err} );
            winston.debug("Created cache for integration.create reply", reply);
        })
    })

    // fai cache per subscription.create, .update .delete


    if (subscriptionEvent) {
        subscriptionEvent.on('subscription.create', function(subscription) {   
            setImmediate(() => {    
                
                //TODO i think you must clone trigger and remove .secret before caching
                // q.cache(cacheUtil.longTTL, id_project+":subscriptions:event:"+event);  //CACHE_SUBSCRIPTION
                var key =subscription.id_project+":subscriptions:event:"+subscription.event;    

                // var key =trigger.id_project+":subscriptions:*";        //wildcardcache //tested
                winston.verbose("Deleting cache for subscription.create with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.create",reply);
                    winston.verbose("Deleted cache for subscription.create",{err:err});
                });   
            });
        });
    
        subscriptionEvent.on('subscription.update', function(subscription) {   
            setImmediate(() => {         
                var key =subscription.id_project+":subscriptions:event:"+subscription.event;    

                // var key =subscription.id_project+":subscriptions:*";         //wildcardcache //tested
                winston.verbose("Deleting cache for subscription.update with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.update",reply);
                    winston.verbose("Deleted cache for subscription.update",{err:err});
                });   
            });
        });
    
        subscriptionEvent.on("subscription.delete", function(subscription) {     
            setImmediate(() => {         
                var key =subscription.id_project+":subscriptions:event:"+subscription.event;    

                // var key =subscription.id_project+":subscriptions:*";          //wildcardcache //tested
                winston.verbose("Deleting cache for subscription.delete with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for subscription.delete",reply);
                    winston.verbose("Deleted cache for subscription.delete",{err:err});
                });   
            });
        });
    
    }


    if (triggerEventEmitter) {
        triggerEventEmitter.on('trigger.create', function(trigger) {   
            setImmediate(() => {    
                var key =trigger.id_project+":triggers:trigger.key:"+trigger.trigger.key;

                // var key =trigger.id_project+":triggers:*";         //wildcardcache //tested
                winston.verbose("Deleting cache for trigger.create with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.create",reply);
                    winston.verbose("Deleted cache for trigger.create",{err:err});
                });   
            });
        });
    
        triggerEventEmitter.on('trigger.update', function(trigger) {   
            setImmediate(() => {         
                var key =trigger.id_project+":triggers:trigger.key:"+trigger.trigger.key;
                // var key =trigger.id_project+":triggers:*";         //wildcardcache //tested

                winston.verbose("Deleting cache for trigger.update with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.update",reply);
                    winston.verbose("Deleted cache for trigger.update",{err:err});
                });   
            });
        });
    
        triggerEventEmitter.on("trigger.delete", function(trigger) {     
            setImmediate(() => {      
                var key =trigger.id_project+":triggers:trigger.key:"+trigger.trigger.key;

                // var key =trigger.id_project+":triggers:*";          //wildcardcache
                winston.verbose("Deleting cache for trigger.delete with key: " + key);
                // found del
                del(client._cache._engine.client, key, function (err, reply) {  //tested
                // client.del(key, function (err, reply) {
                    winston.debug("Deleted cache for trigger.delete",reply);
                    winston.verbose("Deleted cache for trigger.delete",{err:err});
                });   
            });
        });
    
    }
    

    function invalidateFaq(client, faq) {

        // let faqCacheKey = "cacheman:cachegoose-cache:faqs:botid:"+ botId + ":faq:id:" + key;
                            //cacheman:cachegoose-cache:faqs:botid:647dc3e8da041c001396f764:faq:id:647dc3ea61ad510014ca0b46
        key = "faqs:botid:"+faq.id_faq_kb+":faq:id:"+faq.intent_display_name;
        // key = "faqs:botid:"+faq.id_faq_kb+":faq:id:"+faq._id;
        // key = "faqs:botid:"+faq.id_faq_kb+":faq:id:*";
        winston.verbose("Deleting cache for faq with key: " + key);
        // found del
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for faq",reply);
            winston.verbose("Deleted cache for faq",{err:err});
        });   



        key = "faqs:botid:"+faq.id_faq_kb+":faq:id:#"+faq.intent_id;       
        winston.verbose("Deleting cache for faq with key: " + key);
        // found del
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for faq",reply);
            winston.verbose("Deleted cache for faq",{err:err});
        });   
        
    }

    function invalidateWidgets(client, project_id) {
        let key = project_id+":widgets";
        winston.verbose("Deleting cache for widgets with key: " + key);
        // found del
        del(client._cache._engine.client, key, function (err, reply) {  //tested
        // client.del(key, function (err, reply) {
            winston.debug("Deleted cache for widgets",reply);
            winston.verbose("Deleted cache for widgets",{err:err});
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
        // winston.info("client client", client);
        // winston.info("client _cache._engine", client._cache._engine);
        // winston.info("client _cache._engine.client", client._cache._engine.client);
        listen(client);

        return cachegoose;
    }else {
        winston.info("Mongoose Cachegoose disabled");

        return;
    }

    // console.log("init",init);  
    // console.log("cachegoose._cache",cachegoose._cache);  
    // cachegoose._cache.get("/projects/5ea800091147f28c72b90c5e", (err, cachedResults) => { //
    //     console.log("cachedResults",cachedResults);  
    // });

  
}