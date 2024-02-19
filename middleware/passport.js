var passportJWT = require("passport-jwt");  
var JwtStrategy = passportJWT.Strategy;
var ExtractJwt = passportJWT.ExtractJwt;

var passportHttp = require("passport-http");  
var BasicStrategy = passportHttp.BasicStrategy;
var GoogleStrategy = require('passport-google-oidc');

var winston = require('../config/winston');
// var AnonymousStrategy = require('passport-anonymous').Strategy;

// load up the user model
var User = require('../models/user');
var config = require('../config/database'); // get db config file
var Faq_kb = require("../models/faq_kb");
var Project = require('../models/project');
var Subscription = require('../models/subscription');

var Auth = require('../models/auth');
var userService = require('../services/userService');

var UserUtil = require('../utils/userUtil');
var jwt = require('jsonwebtoken');
const url = require('url');
var cacheUtil = require('../utils/cacheUtil');
var cacheEnabler = require("../services/cacheEnabler");

var uniqid = require('uniqid');


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

var alg = process.env.GLOBAL_SECRET_ALGORITHM;
winston.info('Authentication Global Algorithm : ' + alg);

// TODO STAMPA ANCHE PUBLIC

var configSecret = process.env.GLOBAL_SECRET || config.secret;

var pKey = process.env.GLOBAL_SECRET_OR_PUB_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecret = pKey.replace(/\\n/g, '\n');
}
// console.log("configSecret",configSecret);
// if (process.env.GLOBAL_SECRET_OR_PUB_KEY) {
//   console.log("GLOBAL_SECRET_OR_PUB_KEY defined");

// }else {
//   console.log("GLOBAL_SECRET_OR_PUB_KEY undefined");
// }

var maskedconfigSecret = MaskData.maskPhone(configSecret, maskOptions);
winston.info('Authentication Global Secret : ' + maskedconfigSecret);

var enableGoogleSignin = false;
if (process.env.GOOGLE_SIGNIN_ENABLED=="true" || process.env.GOOGLE_SIGNIN_ENABLED == true) {
  enableGoogleSignin = true;
}
winston.info('Authentication Google Signin enabled : ' + enableGoogleSignin);


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

                      winston.debug("bot id AudienceId: "+ AudienceId );
                      let qbot = Faq_kb.findById(AudienceId).select('+secret');
                      
                      if (cacheEnabler.faq_kb) {
                        let id_project = decoded.id_project;
                        winston.debug("decoded.id_project:"+decoded.id_project);
                        qbot.cache(cacheUtil.defaultTTL, id_project+":faq_kbs:id:"+AudienceId+":secret")
                        winston.debug('faq_kb AudienceId cache enabled');
                      }


                      qbot.exec(function (err, faq_kb){ //TODO add cache_bot_here
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
                      done(null, configSecret); //pub_jwt pp_jwt 
                    }

                    else {                
                      winston.debug("configSecret: "+ maskedconfigSecret );
                      done(null, configSecret); //pub_jwt pp_jwt
                    }
              }
              else {
                winston.debug("configSecret: "+ maskedconfigSecret );
                done(null, configSecret); //pub_jwt pp_jwt
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

        let qbot = Faq_kb.findOne({_id: identifier}); //TODO add cache_bot_here

          if (cacheEnabler.faq_kb) {
            let id_project = jwt_payload.id_project;
            winston.debug("jwt_payload.id_project:"+jwt_payload.id_project);
            qbot.cache(cacheUtil.defaultTTL, id_project+":faq_kbs:id:"+identifier)
            winston.debug('faq_kb cache enabled');
          }
  
          qbot.exec(function(err, faq_kb) {

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
      let quser = User.findOne({_id: identifier, status: 100})   //TODO user_cache_here
        //@DISABLED_CACHE .cache(cacheUtil.defaultTTL, "users:id:"+identifier)

        if (cacheEnabler.user) {
          quser.cache(cacheUtil.defaultTTL, "users:id:"+identifier)
          winston.debug('user cache enabled');
        }

        quser.exec(function(err, user) {
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

      User.findOne({ email: email, status: 100}, 'email firstname lastname password emailverified id') //TODO user_cache_here. NOT used frequently. ma attento select. ATTENTO QUI NN USEREI LA SELECT altrimenti con JWT ho tuttto USER mentre con basich auth solo aluni campi
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
    }));





if (enableGoogleSignin==true) {
  let googleClientId = process.env.GOOGLE_CLIENT_ID;
  let googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";
  
  winston.info("Enabling Google Signin strategy with ClientId: " +  googleClientId + " callbackURL: " + googleCallbackURL + " clientSecret: " + googleClientSecret );

  passport.use(new GoogleStrategy({
    clientID: googleClientId, 
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackURL,  // 'https://www.example.com/oauth2/redirect/google'
    // stateless: true ????
  },
  function(issuer, profile, cb) {

    winston.debug("issuer: "+issuer)
    winston.debug("profile", profile)
    // winston.info("cb", cb)

    var email = profile.emails[0].value;
    winston.debug("email: "+email)   

    var query = {providerId : issuer, subject: profile.id};
    winston.debug("query", query)

    Auth.findOne(query, function(err, cred){     
    winston.debug("cred", cred, err)

      // db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
      // issuer,
      // profile.id
    // ], function(err, cred) {

    winston.debug("11")


      if (err) { return cb(err); }

      winston.debug("12")

      if (!cred) {
        winston.debug("13")
        // The Google account has not logged in to this app before.  Create a
        // new user record and link it to the Google account.

        // db.run('INSERT INTO users (name) VALUES (?)', [
        //   profile.displayName
        // ], function(err) {

          var password = uniqid()

          
          // signup ( email, password, firstname, lastname, emailverified) {
          userService.signup(email, password,  profile.displayName, "", true)
          .then(function (savedUser) {


          // if (err) { return cb(err); }

          winston.debug("savedUser", savedUser)    

          var auth = new Auth({
            providerId: issuer,
            email: email,
            subject: profile.id,
          });
          auth.save(function (err, authSaved) {    
                
          // db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
          //   id,
          //   issuer,
          //   profile.id
          // ], function(err) {


            if (err) { return cb(err); }

            winston.debug("authSaved", authSaved)    

            // var user = {
            //   id: id.toString(),
            //   name: profile.displayName
            // };
            // var user = {
            //   id: "1232321321321321",
            //   name: "Google andrea"
            // };
            return cb(null, savedUser);
          });
        }).catch(function(err) {
          // if (err.code == 11000) {
          

            
          // } else {
            winston.error("Error signup google ", err);
            return cb(err); 
          // }
         
        });
      } else {

        winston.debug("else")
        // The Google account has previously logged in to the app.  Get the
        // user record linked to the Google account and log the user in.

        User.findOne({
          email: email, status: 100
        }, 'email firstname lastname password emailverified id', function (err, user) {

          winston.debug("user",user, err);
        // db.get('SELECT * FROM users WHERE id = ?', [ cred.user_id ], function(err, user) {
          if (err) { return cb(err); }
          if (!user) { return cb(null, false); }
          return cb(null, user);
        });
      }
    });
  }
));

}



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
