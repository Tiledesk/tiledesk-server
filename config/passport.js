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

module.exports = function(passport) {
    
    // passport.serializeUser(function(user, done) {
    //     console.log("serializeUser");

    //     done(null, user);
    //   });
      
    //   passport.deserializeUser(function(user, done) {
    //     done(null, user);
    //   });

  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
  // ExtractJwt.fromAuthHeaderWithScheme("jwt")
  var secret = config.secret;

   var secret23 = process.env.SECRET || config.secret;
   winston.debug("secret23", secret23);

  opts.secretOrKey = secret;
  // console.log("here");

  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    // console.log("jwt_payload",jwt_payload);

    // console.log("jwt_payload._doc._id",jwt_payload._doc._id);
    User.findOne({_id: jwt_payload._doc._id}, function(err, user) {
        // console.log("here3");
          if (err) {
            // console.log("here3 err");
              return done(err, false);
          }
          if (user) {
            // console.log("here3 done user",user);
              return done(null, user);
          } else {
            // console.log("here3 false");
              return done(null, false);
          }
      });
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
