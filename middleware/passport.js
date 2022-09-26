var passportJWT = require("passport-jwt");  
var JwtStrategy = passportJWT.Strategy;
var ExtractJwt = passportJWT.ExtractJwt;

var passportHttp = require("passport-http");  
var BasicStrategy = passportHttp.BasicStrategy;

var winston = require('../config/winston');
// var AnonymousStrategy = require('passport-anonymous').Strategy;

// load up the user model
var User = require('../models/user');
var config = require('../config/database'); // get db config file
var Faq_kb = require("../models/faq_kb");
var Project = require('../models/project');
var Subscription = require('../models/subscription');
var UserUtil = require('../utils/userUtil');
var jwt = require('jsonwebtoken');
const url = require('url');
var cacheUtil = require('../utils/cacheUtil');


const MaskData = require("maskdata");

const maskOptions = {
  // Character to mask the data. default value is '*'
  maskWith : "*",
  // If the starting 'n' digits needs to be unmasked
  // Default value is 4
  unmaskedStartDigits : 3, //Should be positive Integer
  //If the ending 'n' digits needs to be unmasked
  // Default value is 1
  unmaskedEndDigits : 3 // Should be positive Integer
  };


var configSecret = process.env.GLOBAL_SECRET || config.secret;

var maskedconfigSecret = MaskData.maskPhone(configSecret, maskOptions);
winston.info('Authentication Global Secret : ' + maskedconfigSecret);




var jwthistory = undefined;
try {
  jwthistory = require('@tiledesk-ent/tiledesk-server-jwthistory');
} catch(err) {
  winston.debug("jwthistory not present");
}

module.exports = function(passport) {
    
    // passport.serializeUser(function(user, done) {
    //     console.log("serializeUser");

    //     done(null, user);
    //   });
      
    //   passport.deserializeUser(function(user, done) {
    //     done(null, user);
    //   });

  var opts = {
            // jwtFromRequest: ExtractJwt.fromAuthHeader(),
            jwtFromRequest:ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderWithScheme("jwt"), ExtractJwt.fromUrlQueryParameter('secret_token')]),            
            //this will help you to pass request body to passport
            passReqToCallback: true, //https://stackoverflow.com/questions/55163015/how-to-bind-or-pass-req-parameter-to-passport-js-jwt-strategy
            // secretOrKey: configSecret,
            secretOrKeyProvider: function(request, rawJwtToken, done) {
              // winston.info("secretOrKeyProvider ", request );

              // if (request.project) {
              //   winston.info("secretOrKeyProvider.request.project.jwtSecret: "+request.project.jwtSecret );
              // }
              
              // winston.info("secretOrKeyProvider: "+request.project.name );
              // winston.info("secretOrKeyProvider: "+rawJwtToken );
              
              var decoded = request.preDecodedJwt
              winston.debug("decoded: ", decoded );
              if (!decoded) { //fallback
                winston.debug("load decoded after: ");
                decoded = jwt.decode(rawJwtToken);
              }
              
              winston.debug("decoded after: ", decoded );

              // qui arriva questo 
              // decoded:  {"_id":"5ce3ee855c520200176c189e","updatedAt":"2019-05-31T09:50:22.949Z","createdAt":"2019-05-21T12:26:45.192Z","name":"botext","url":"https://tiledesk-v2-simple--andrealeo83.repl.co","id_project":"5ce3d1ceb25ad30017274bc5","trashed":false,"createdBy":"5ce3d1c7b25ad30017274bc2","__v":0,"external":true,"iat":1559297130,"aud":"https://tiledesk.com","iss":"https://tiledesk.com","sub":"5ce3ee855c520200176c189e@tiledesk.com/bot"}


              if (decoded && decoded.aud) {

                winston.debug("decoded.aud: "+ decoded.aud );

                
                const audUrl  = new URL(decoded.aud);
                winston.debug("audUrl: "+ audUrl );
                const path = audUrl.pathname;
                winston.debug("audUrl path: " + path );
                
                const AudienceType = path.split("/")[1];
                winston.debug("audUrl AudienceType: " + AudienceType );

                const AudienceId = path.split("/")[2];
                winston.debug("audUrl AudienceId: " + AudienceId );

                    if (AudienceType == "bots") {

                      if (!AudienceId) {
                        winston.error("AudienceId for bots is required: ", decoded);
                        return done(null, null);
                      }

                      winston.debug("bot id: "+ AudienceId );
                      Faq_kb.findById(AudienceId).select('+secret').exec(function (err, faq_kb){
                        if (err) {
                          winston.error("auth Faq_kb err: ", {error: err, decoded:decoded} );
                          return done(null, null);
                        }
                        if (!faq_kb) {
                          winston.warn("faq_kb not found with id: " +  AudienceId, decoded);
                          return done(null, null);
                        }

                        winston.debug("faq_kb: ", faq_kb );
                        // winston.debug("faq_kb.secret: "+ faq_kb.secret );
                        done(null, faq_kb.secret);
                      });
                    }

                    else if (AudienceType == "projects") {
                      if (!AudienceId) {
                        winston.error("AudienceId for projects is required: ", decoded);
                        return done(null, null);
                      }

                      winston.debug("project id: "+ AudienceId );
                      Project.findOne({_id: AudienceId, status: 100}).select('+jwtSecret')
                      //@DISABLED_CACHE .cache(cacheUtil.queryTTL, "projects:query:id:status:100:"+AudienceId+":select:+jwtSecret") //project_cache
                      .exec(function (err, project){
                        if (err) {
                          winston.error("auth Project err: ", {error:err, decoded: decoded} );
                          return done(null, null);
                        }
                        if (!project) {
                          winston.warn("Project not found with id: " +  AudienceId, decoded);
                          return done(null, null);
                        }
                        winston.debug("project: ", project );
                        winston.debug("project.jwtSecret: "+ project.jwtSecret );
                        done(null, project.jwtSecret);
                      });

                    }
                    else if (AudienceType == "subscriptions") {
                      
                      if (!AudienceId) {
                        winston.error("AudienceId for subscriptions is required: ", decoded);
                        return done(null, null);
                      }

                      winston.debug("Subscription id: "+ AudienceId );
                      Subscription.findById(AudienceId).select('+secret').exec(function (err, subscription){
                        if (err) {
                          winston.error("auth Subscription err: ", {error: err, decoded: decoded} );
                          return done(null, null);
                        }
                        if (!subscription) {
                          winston.warn("subscription not found with id: " +  AudienceId, decoded);
                          return done(null, null);
                        }
                        winston.debug("subscription: ", subscription );
                        winston.debug("subscription.secret: "+ subscription.secret );
                        done(null, subscription.secret);
                      });
                    }             

                    else if (decoded.aud == "https://tiledesk.com") {                
                      winston.debug("configSecret: "+ maskedconfigSecret );
                      done(null, configSecret);
                    }

                    else {                
                      winston.debug("configSecret: "+ maskedconfigSecret );
                      done(null, configSecret);
                    }
              }
              else {
                winston.debug("configSecret: "+ maskedconfigSecret );
                done(null, configSecret);
              }             
            }
       }


  winston.debug("passport opts: ", opts);

  passport.use(new JwtStrategy(opts, async(req, jwt_payload, done)  => {
  // passport.use(new JwtStrategy(opts, function(req, jwt_payload, done) {
    winston.debug("jwt_payload",jwt_payload);
    // console.log("req",req);
    

    // console.log("jwt_payload._doc._id",jwt_payload._doc._id);


    if (jwt_payload._id == undefined  && (jwt_payload._doc == undefined || (jwt_payload._doc && jwt_payload._doc._id==undefined))) {
      var err = "jwt_payload._id or jwt_payload._doc._id can t be undefined" ;
      winston.error(err);
      return done(null, false);
    }
                                                            //JWT OLD format
     const identifier = jwt_payload._id || jwt_payload._doc._id;
    
    // const subject = jwt_payload.sub || jwt_payload._id || jwt_payload._doc._id;
    winston.debug("passport identifier: " + identifier);

    const subject = jwt_payload.sub;
    winston.debug("passport subject: " + subject);

    winston.debug("passport identifier: " + identifier + " subject " + subject);

    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    winston.debug("fullUrl:"+ fullUrl);

    winston.debug("req.disablePassportEntityCheck:"+req.disablePassportEntityCheck);

    if (req && req.disablePassportEntityCheck) { //req can be null
      // jwt_payload.id = jwt_payload._id; //often req.user.id is used inside code. req.user.id  is a mongoose getter of _id
      // is better to rename req.user.id to req.user._id in all files
      winston.debug("req.disablePassportEntityCheck enabled");
      return done(null, jwt_payload);
    }

    //TODO check into DB if JWT is revoked 
    if (jwthistory) {
      var jwtRevoked = await jwthistory.isJWTRevoked(jwt_payload.jti);
      winston.debug("passport jwt jwtRevoked: "+ jwtRevoked);
      if (jwtRevoked) {
        winston.warn("passport jwt is revoked with jti: "+ jwt_payload.jti);
        return done(null, false);
      }
    }

    if (subject == "bot") {
      winston.debug("Passport JWT bot");
      Faq_kb.findOne({_id: identifier}, function(err, faq_kb) {
          if (err) {
            winston.error("Passport JWT bot err", err);
            return done(err, false);
          }
          if (faq_kb) {
            winston.debug("Passport JWT bot user", faq_kb);
            return done(null, faq_kb);
          } else {
            winston.warn("Passport JWT bot not user");
            return done(null, false);
          }
      });
    // } else if (subject=="projects") {      

    } else if (subject=="subscription") {
    
      Subscription.findOne({_id: identifier}, function(err, subscription) {
        if (err) {
          winston.error("Passport JWT subscription err", err);
          return done(err, false);
        }
        if (subscription) {
          winston.debug("Passport JWT subscription user", subscription);
          return done(null, subscription);
        } else {
          winston.warn("Passport JWT subscription not user", subscription);
          return done(null, false);
        }
      });              

    } else if (subject=="userexternal") {
    
     
        if (jwt_payload) {

          // const audUrl  = new URL(jwt_payload.aud);
          // winston.info("audUrl: "+ audUrl );

          // const path = audUrl.pathname;
          // winston.info("audUrl path: " + path );
          
          // const AudienceType = path.split("/")[1];
          // winston.info("audUrl AudienceType: " + AudienceType );

          // const AudienceId = path.split("/")[2];
          // winston.info("audUrl AudienceId: " + AudienceId );

          // jwt_payload._id = AudienceId + "-" + jwt_payload._id;
          


          winston.debug("Passport JWT userexternal", jwt_payload);
          var userM = UserUtil.decorateUser(jwt_payload);
          winston.debug("Passport JWT userexternal userM", userM);

          return done(null, userM );
        }  else {
          var err = {msg: "No jwt_payload passed. Its required"};
          winston.error("Passport JWT userexternal err", err);
          return done(err, false);
        }                

     } else if (subject=="guest") {
    
     
        if (jwt_payload) {
          winston.debug("Passport JWT guest", jwt_payload);
          var userM = UserUtil.decorateUser(jwt_payload);
          winston.debug("Passport JWT guest userM", userM);
          return done(null, userM );
        }  else {
          var err = {msg: "No jwt_payload passed. Its required"};
          winston.error("Passport JWT guest err", err);
          return done(err, false);
        }                   

    } else {
      winston.debug("Passport JWT generic user");
      User.findOne({_id: identifier, status: 100})
        //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+identifier)
        .exec(function(err, user) {
          if (err) {
            winston.error("Passport JWT generic err ", err);
            return done(err, false);
          }
          if (user) {
            winston.debug("Passport JWT generic user ", user);
            return done(null, user);
          } else {
            winston.debug("Passport JWT generic not user");
            return done(null, false);
          }
      });

    }
   


  }));



  passport.use(new BasicStrategy(function(userid, password, done) {
      
      winston.debug("BasicStrategy: " + userid);
      

      var email = userid.toLowerCase();
      winston.debug("email lowercase: " + email);

      User.findOne({ email: email, status: 100}, 'email firstname lastname password emailverified id')
      //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:email:"+email)
      .exec(function (err, user) {
       
        if (err) {
            // console.log("BasicStrategy err.stop");
            return done(err); 
        }
        if (!user) { return done(null, false); }
        
        user.comparePassword(password, function (err, isMatch) {
            if (isMatch && !err) {

              // if user is found and password is right create a token
              // console.log("BasicStrategy ok");
              return done(null, user);

            } else {
                return done(err); 
            }
          });

      


        // if (user) { return done(null, user); }
        // if (!user) { return done(null, false); }
        // if (!user.verifyPassword(password)) { return done(null, false); }
      });
    }
    
    
    
  ));


  // var OidcStrategy = require('passport-openidconnect').Strategy;


  
  // https://github.com/jaredhanson/passport-anonymous

  // passport.use(new AnonymousStrategy());



// link utili
// https://codeburst.io/how-to-implement-openid-authentication-with-openid-client-and-passport-in-node-js-43d020121e87?gi=4bb439e255a7
  // https://developer.wordpress.com/docs/oauth2/



  // openidconnect
  // https://docs.simplelogin.io/docs/passport/




 
  // oauth2
/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 */

  /*
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;

function verifyClient(clientId, clientSecret, done) {
  
  db.clients.findByClientId(clientId, (error, client) => {
    if (error) return done(error);
    if (!client) return done(null, false);
    if (client.clientSecret !== clientSecret) return done(null, false);
    return done(null, client);
  });
}

//passport.use(new BasicStrategy(verifyClient));

passport.use(new ClientPasswordStrategy(verifyClient));


*/





};
