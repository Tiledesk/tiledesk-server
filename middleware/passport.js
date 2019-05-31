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
var jwt = require('jsonwebtoken');

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
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
            // secretOrKey: config.secret,
            secretOrKeyProvider: function(request, rawJwtToken, done) {
              // winston.info("secretOrKeyProvider ", request );
              if (request.project) {
                winston.info("secretOrKeyProvider.request.project.jwtSecret: "+request.project.jwtSecret );
              }
              
              // winston.info("secretOrKeyProvider: "+request.project.name );
              // winston.info("secretOrKeyProvider: "+rawJwtToken );
              
              var decoded = jwt.decode(rawJwtToken);
              winston.info("decoded: ", decoded );

              // qui arriva questo 
              // decoded:  {"_id":"5ce3ee855c520200176c189e","updatedAt":"2019-05-31T09:50:22.949Z","createdAt":"2019-05-21T12:26:45.192Z","name":"botext","url":"https://tiledesk-v2-simple--andrealeo83.repl.co","id_project":"5ce3d1ceb25ad30017274bc5","trashed":false,"createdBy":"5ce3d1c7b25ad30017274bc2","__v":0,"external":true,"iat":1559297130,"aud":"https://tiledesk.com","iss":"https://tiledesk.com","sub":"5ce3ee855c520200176c189e@tiledesk.com/bot"}

              if (decoded && decoded.sub && decoded.sub.endsWith('/bot')) {
                winston.info("bot: ", decoded.sub );
                Faq_kb.findOne({_id: decoded._id}, function(err, faq_kb) {
                  winston.info("faq_kb: ", faq_kb );
                  winston.info("faq_kb.secret: ", faq_kb.secret );
                  done(null, faq_kb.secret);
                });
              }
              // if (request.url=="uni" && request.project && request.project.jwtSecret) {
              //   winston.info("uni config.jwtSecret: "+ config.jwtSecret );
              //   done(null, request.project.jwtSecret);
              // } 
              else {
                winston.info("config.jwtSecret: "+ config.secret );
                done(null, config.secret);
              }             
            }
       }

  //  var secret23 = process.env.SECRET || config.secret;
  //  winston.debug("secret23", secret23);

  winston.info("passport opts: ", opts);

  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    // console.log("jwt_payload",jwt_payload);

    // console.log("jwt_payload._doc._id",jwt_payload._doc._id);


    if (jwt_payload.sub.endsWith('/bot')) {
      winston.info("Passport JWT bot");
      Faq_kb.findOne({_id: jwt_payload._id}, function(err, faq_kb) {
        // console.log("here3");
          if (err) {
            winston.info("here3 err");
              return done(err, false);
          }
          if (faq_kb) {
            // console.log("here3 done user",user);
              return done(null, faq_kb);
          } else {
            // console.log("here3 false");
              return done(null, false);
          }
      });
    } else if (jwt_payload.sub.endsWith('/visitor')) {
    } else if (jwt_payload.sub.endsWith('/lead')) {
    } else {
      winston.info("Passport JWT generic");
      User.findOne({_id: jwt_payload._doc._id}, function(err, user) {
        // console.log("here3");
          if (err) {
              winston.info("Passport JWT generic err", err);
              return done(err, false);
          }
          if (user) {
            winston.info("Passport JWT generic user", user);
              return done(null, user);
          } else {
            winston.info("Passport JWT generic not user");
              return done(null, false);
          }
      });

    }
   


  }));



  passport.use(new BasicStrategy(function(userid, password, done) {
        // console.log("BasicStrategy");

      User.findOne({ email: userid }, 'email firstname lastname password emailverified id', function (err, user) {
        // console.log("BasicStrategy user",user);
        // console.log("BasicStrategy err",err);

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
  
  // https://github.com/jaredhanson/passport-anonymous

  // passport.use(new AnonymousStrategy());

};
