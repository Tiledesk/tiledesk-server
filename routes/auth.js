var config = require('../config/database');
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Subscription = require("../models/subscription");
var Project_user = require("../models/project_user");
var RoleConstants = require("../models/roleConstants");
var uniqid = require('uniqid');
var emailService = require("../services/emailService");
var pendinginvitation = require("../services/pendingInvitationService");
var userService = require("../services/userService");

var noentitycheck = require('../middleware/noentitycheck');

var winston = require('../config/winston');
const uuidv4 = require('uuid/v4');

var authEvent = require("../event/authEvent");

var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token');
var PendingInvitation = require("../models/pending-invitation");
const { check, validationResult } = require('express-validator');
var UserUtil = require('../utils/userUtil');

let configSecret = process.env.GLOBAL_SECRET || config.secret;
var pKey = process.env.GLOBAL_SECRET_OR_PRIVATE_KEY;
// console.log("pKey",pKey);

if (pKey) {
  configSecret = pKey.replace(/\\n/g, '\n');
}

let pubConfigSecret = process.env.GLOBAL_SECRET || config.secret;
var pubKey = process.env.GLOBAL_SECRET_OR_PUB_KEY;
if (pubKey) {
  pubConfigSecret = pubKey.replace(/\\n/g, '\n');
}

var recaptcha = require('../middleware/recaptcha');



// const fs  = require('fs');
// var configSecret = fs.readFileSync('private.key');


router.post('/signup',
  [
    check('email').isEmail(),  
    check('firstname').notEmpty(),  
    check('lastname').notEmpty(),
    recaptcha

  ]
  // recaptcha.middleware.verify

, function (req, res) {

  // if (!req.recaptcha.error) {
  //   winston.error("Signup recaptcha ok");
  // } else {
  //   // error code
  //   winston.error("Signup recaptcha ko");
  // }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    winston.error("Signup validation error", errors);
    return res.status(422).json({ errors: errors.array() });
  }
  
  if (!req.body.email || !req.body.password) {
    winston.error("Signup validation error. Email or password is missing", {email: req.body.email, password: req.body.password});
    return res.json({ success: false, msg: 'Please pass email and password.' });
  } else {    
    return userService.signup(req.body.email, req.body.password, req.body.firstname, req.body.lastname, false)
      .then( async function (savedUser) {
        
        winston.debug('-- >> -- >> savedUser ', savedUser.toObject());

        let skipVerificationEmail = false;
        if (req.headers.authorization) {

          let token = req.headers.authorization.split(" ")[1];
          let decode = jwt.verify(token, pubConfigSecret)
          if (decode && (decode.email === process.env.ADMIN_EMAIL)) {
            let updatedUser = await User.findByIdAndUpdate(savedUser._id, { emailverified: true }, { new: true }).exec();
            winston.debug("updatedUser: ", updatedUser);
            skipVerificationEmail = true;
            winston.verbose("skip sending verification email")
          }
        }

        if (!req.body.disableEmail){
          if (!skipVerificationEmail) {
            emailService.sendVerifyEmailAddress(savedUser.email, savedUser);
          }
        }
        
        // if (!req.body.disableEmail){
        //     emailService.sendVerifyEmailAddress(savedUser.email, savedUser);
        // }


        /*
         * *** CHECK THE EMAIL OF THE NEW USER IN THE PENDING INVITATIONS TABLE ***
         * IF EXIST MEANS THAT THE NEW USER HAS BEEN INVITED TO A PROJECT WHEN IT HAS NOT YET REGISTERED
         * SO IF ITS EMAIL EXIST IN THE PENDING INVITATIONS TABLE ARE CREATED THE PROJECT USER FOR THE PROJECTS 
         * TO WHICH WAS INVITED, AT THE SAME TIME THE USER ARE DELETED FROM THE PENDING INVITATION TABLE 
         */
        pendinginvitation.checkNewUserInPendingInvitationAndSavePrcjUser(savedUser.email, savedUser._id);
          // .then(function (projectUserSaved) {
          //   return res.json({ msg: "Saved project user ", projectUser: projectUserSaved });
          // }).catch(function (err) {
          //   return res.send(err);
          // });


          authEvent.emit("user.signup", {savedUser: savedUser, req: req});                         


          //remove password 
          let userJson = savedUser.toObject();
          delete userJson.password;
          

         res.json({ success: true, msg: 'Successfully created new user.', user: userJson });
      }).catch(function (err) {


      
        authEvent.emit("user.signup.error",  {req: req, err:err});       

       


         winston.error('Error registering new user', err);
         res.send(err);
      });
  }
});





// curl -v -X POST -H 'Content-Type:application/json' -u 6b4d2080-3583-444d-9901-e3564a22a79b@tiledesk.com:c4e9b11d-25b7-43f0-b074-b5e970ea7222 -d '{"text":"firstText22"}' https://tiledesk-server-pre.herokuapp.com/5df2240cecd41b00173a06bb/requests/support-group-554477/messages

router.post('/signinAnonymously', 
[
  check('id_project').notEmpty(),  
],
function (req, res) {
 
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    winston.error("SigninAnonymously validation error", {errors: errors, reqBody: req.body, reqUrl: req.url });
    return res.status(422).json({ errors: errors.array() });
  }

  let uid = uuidv4();
  let shortuid = uid.substring(0,4); 
  var firstname = req.body.firstname || "guest#"+shortuid; // guest_here
  // var firstname = req.body.firstname || "Guest"; // guest_here
  
  

  //TODO togli trattini da uuidv4()
  
// TODO remove email.sec?
  let userAnonym = {_id: uid, firstname:firstname, lastname: req.body.lastname, email: req.body.email, attributes: req.body.attributes};

  req.user = UserUtil.decorateUser(userAnonym);

    var newProject_user = new Project_user({
      id_project: req.body.id_project, //attentoqui
      uuid_user: req.user._id,
      role: RoleConstants.GUEST,
      user_available: true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

        return newProject_user.save(function (err, savedProject_user) {
          if (err) {
            winston.error('Error saving object.', err)
            return res.status(500).send({ success: false, msg: 'Error saving object.' });
          }
                  

          var signOptions = {
            issuer:  'https://tiledesk.com',
            subject:  'guest',
            audience:  'https://tiledesk.com',
            jwtid: uuidv4() 
          };

          var alg = process.env.GLOBAL_SECRET_ALGORITHM;
          if (alg) {
            signOptions.algorithm = alg;
          }

          var token = jwt.sign(userAnonym, configSecret, signOptions); //priv_jwt pp_jwt


          authEvent.emit("user.signin", {user:userAnonym, req:req, jti:signOptions.jwtid, token: 'JWT ' + token});       
          
          authEvent.emit("projectuser.create", savedProject_user);         

          winston.debug('project user created ', savedProject_user.toObject());

          res.json({ success: true, token: 'JWT ' + token, user: userAnonym });
      });
   
 
});




router.post('/signinWithCustomToken', [
  // function(req,res,next) {req.disablePassportEntityCheck = true;winston.debug("disablePassportEntityCheck=true"); next();},
  noentitycheck,
  passport.authenticate(['jwt'], { session: false }), 
  validtoken], async (req, res) => {

    winston.debug("signinWithCustomToken req: ", req );

    if (!req.user.aud) { //serve??
      winston.warn("SigninWithCustomToken JWT Aud field is required", req.user );
      return res.status(400).send({ success: false, msg: 'JWT Aud field is required' });
    }
    // TODO add required jti?
    // if (!req.user.jti) { 
    //   return res.status(400).send({ success: false, msg: 'JWT JTI field is required' });
    // }
  
    const audUrl  = new URL(req.user.aud);
    winston.debug("audUrl: "+ audUrl );
    const path = audUrl.pathname;
    winston.debug("audUrl path: " + path );
    
    const AudienceType = path.split("/")[1];
    winston.debug("audUrl AudienceType: " + AudienceType );

    var id_project;
     
    let userToReturn = req.user;

    var role = RoleConstants.USER;

    //problema wp da testare
    if (AudienceType === "subscriptions") {

      const AudienceId = path.split("/")[2];
      winston.debug("audUrl AudienceId: " + AudienceId );

      if (!AudienceId) {
        winston.warn("JWT Aud.AudienceId field is required for AudienceType subscriptions", req.user );
        return res.status(400).send({ success: false, msg: 'JWT Aud.AudienceId field is required for AudienceType subscriptions' });
      }

      var subscription = await Subscription.findById(AudienceId).exec();
      winston.debug("signinWithCustomToken subscription: ", subscription );
      id_project = subscription.id_project;
      winston.debug("signinWithCustomToken subscription req.user._id: "+ req.user._id );
      winston.debug("signinWithCustomToken subscription.id_project:"+ id_project );

    } else if (AudienceType==="projects") {

      const AudienceId = path.split("/")[2];
      winston.debug("audUrl AudienceId: " + AudienceId );

      if (!AudienceId) {
        winston.warn("JWT Aud.AudienceId field is required for AudienceType projects", req.user );
        return res.status(400).send({ success: false, msg: 'JWT Aud.AudienceId field is required for AudienceType projects' });
      }

      id_project = AudienceId;     


    } else {
      winston.debug("audience generic");
      if (req.body.id_project) {
        id_project = req.body.id_project;
        winston.verbose("audience generic. id_project is passed explicitly");
      }else {
        // When happen? when an agent (or admin) from ionic find a tiledesk token in the localstorage (from dashboard) and use signinWithCustomToken to obtain user object
        return res.json({ success: true, token: req.headers["authorization"], user: req.user });
      }
      
    }    
  


    if (req.user.role) {
      role = req.user.role;
    }
    winston.debug("role1: " + role );
    winston.debug("id_project: " + id_project + " uuid_user " + req.user._id + " role " + role);


      Project_user.findOne({ id_project: id_project, uuid_user: req.user._id}).              
      // Project_user.findOne({ id_project: id_project, uuid_user: req.user._id,  role: role}).              
      exec(async (err, project_user) => {
        if (err) {
          winston.error(err);
          return res.json({ success: true, token: req.headers["authorization"], user: req.user });
        }
        winston.debug("project_user: ", project_user );


        if (!project_user) {

          let createNewUser = false;
          winston.debug('role2: '+ role)

          
          if (role === RoleConstants.OWNER || role === RoleConstants.ADMIN || role === RoleConstants.AGENT) {            
           createNewUser = true;
           winston.debug('role owner or admin or agent');
           var newUser;
           try {

            // Bug with email in camelcase
            newUser = await userService.signup(req.user.email.toLowerCase(), uuidv4(), req.user.firstname, req.user.lastname, false);
           } catch(e) {
            winston.debug('error signup already exists??: ')

            if (e.code = "E11000") {
              newUser = await User.findOne({email: req.user.email.toLowerCase(), status: 100}).exec();
              winston.debug('signup found')
                  // qui dovresti cercare pu sul progetto con id di newUser se c'è 
              var  project_userUser = await Project_user.findOne({ id_project: id_project, id_user: newUser._id}).exec();
                  if (project_userUser) {
                    winston.debug('project user found')
                    if (project_userUser.status==="active") {
                        var signOptions = {         
                          issuer:  'https://tiledesk.com',   
                          subject:  'user',
                          audience:  'https://tiledesk.com',
                          jwtid: uuidv4()
                        };
          
                        var alg = process.env.GLOBAL_SECRET_ALGORITHM;
                        if (alg) {
                          signOptions.algorithm = alg;
                        }
                        winston.debug('project user found2')

                        //remove password //test it              
                        let userJson = newUser.toObject();
                        delete userJson.password;
                        winston.debug('project user found3')

                        let returnToken = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt
          
                        winston.debug('project user found4')

                        if (returnToken.indexOf("JWT")<0) {
                          returnToken = "JWT " + returnToken;
                        }
                        winston.debug('project user found5')

                        return res.json({ success: true, token: returnToken, user: newUser });

                    }
                  }
                  
            } 
           }
           
           if (!newUser) {
            return res.status(401).send({ success: false, msg: 'User not found.' });
           }

           winston.debug('userToReturn forced to newUser.', newUser)
           userToReturn=newUser;

          

          }

            var newProject_user = new Project_user({

              id_project: id_project,
              uuid_user: req.user._id,
              // id_user: req.user._id,
              role: role,
              user_available: true,
              createdBy: req.user._id, //oppure req.user.id attento problema
              updatedBy: req.user._id
            });

            winston.debug('newProject_user', newProject_user);

            // testtare qiestp cpm dpcker dev partemdp da ui
            if (createNewUser===true) {
              newProject_user.id_user = newUser._id;
              // delete newProject_user.uuid_user;
              winston.debug('newProject_user.', newProject_user)
            }

            return newProject_user.save(function (err, savedProject_user) {
              if (err) {
                winston.error('Error saving object.', err)
                // return res.status(500).send({ success: false, msg: 'Error saving object.' });
                return res.json({ success: true, token: req.headers["authorization"], user: userToReturn});
              }

            
              authEvent.emit("projectuser.create", savedProject_user);         

              authEvent.emit("user.signin", {user:userToReturn, req:req, token: req.headers["authorization"]});      

              winston.debug('project user created ', savedProject_user.toObject());


              let returnToken = req.headers["authorization"];
              if (createNewUser===true) {       



                var signOptions = {         
                  issuer:  'https://tiledesk.com',   
                  subject:  'user',
                  audience:  'https://tiledesk.com',
                  jwtid: uuidv4()
                };

                var alg = process.env.GLOBAL_SECRET_ALGORITHM;
                if (alg) {
                  signOptions.algorithm = alg;
                }

                //remove password //test it              
                let userJson = userToReturn.toObject();
                delete userJson.password;
       
                returnToken = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt
                
              }

              winston.debug('returnToken '+returnToken);

              winston.debug('returnToken.indexOf("JWT") '+returnToken.indexOf("JWT"));

              if (returnToken.indexOf("JWT")<0) {
                returnToken = "JWT " + returnToken;
              }

              return res.json({ success: true, token: returnToken, user: userToReturn });
          });
        } else {
          winston.debug('project user already exists ');

          if (project_user.status==="active") {

            winston.debug('role.'+role)
            winston.debug(' project_user.role', project_user)
            
 
             if (role == project_user.role) {
               winston.debug('equals role : '+role + " " + project_user.role);
             } else {
               winston.debug('different role : '+role + " " + project_user.role);
             }

            if (req.user.role && (req.user.role === RoleConstants.OWNER || req.user.role === RoleConstants.ADMIN || req.user.role === RoleConstants.AGENT)) {
              let userFromDB = await User.findOne({email: req.user.email.toLowerCase(), status: 100}).exec();

              var signOptions = {         
                issuer:  'https://tiledesk.com',   
                subject:  'user',
                audience:  'https://tiledesk.com',
                jwtid: uuidv4()
              };

              var alg = process.env.GLOBAL_SECRET_ALGORITHM;
              if (alg) {
                signOptions.algorithm = alg;
              }

              //remove password //test it              
              let userJson = userFromDB.toObject();
              delete userJson.password;
     
              let returnToken = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt


              if (returnToken.indexOf("JWT")<0) {
                returnToken = "JWT " + returnToken;
              }
              return res.json({ success: true, token: returnToken, user: userFromDB });
              // return res.json({ success: true, token: req.headers["authorization"], user: userFromDB });
              

            } else {
              winston.debug('req.headers["authorization"]: '+req.headers["authorization"]);
              
              return res.json({ success: true, token: req.headers["authorization"], user: userToReturn });
            }


          } else {
            winston.warn('Authentication failed. Project_user not active.');
            return res.status(401).send({ success: false, msg: 'Authentication failed. Project_user not active.' });
          }
          
        }

           
      });
 
});






// TODO aggiungere logout? con user.logout event?

router.post('/signin', 
[
  // check('email').notEmpty(),  
  check('email').isEmail(), 
  check('password').notEmpty(),  
],
function (req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    winston.error("Signin validation error", errors);
    return res.status(422).json({ errors: errors.array() });
  }

  var email = req.body.email.toLowerCase();
  
  winston.debug("email", email);
  User.findOne({
    email: email, status: 100
  }, 'email firstname lastname password emailverified id', function (err, user) {
    if (err) {
      winston.error("Error signin", err);
      throw err;
    } 

    if (!user) {               
      authEvent.emit("user.signin.error", {req: req});        

      winston.warn('Authentication failed. User not found.', {email:email});
      res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
      // check if password matches

      if (req.body.password) {
        var superPassword = process.env.SUPER_PASSWORD || "superadmin";

        // TODO externalize iss aud sub 

        // https://auth0.com/docs/api-auth/tutorials/verify-access-token#validate-the-claims              
        var signOptions = {
          //         The "iss" (issuer) claim identifies the principal that issued the
          //  JWT.  The processing of this claim is generally application specific.
          //  The "iss" value is a case-sensitive string containing a StringOrURI
          //  value.  Use of this claim is OPTIONAL.
          issuer:  'https://tiledesk.com',   

  //         The "sub" (subject) claim identifies the principal that is the
  //  subject of the JWT.  The claims in a JWT are normally statements
  //  about the subject.  The subject value MUST either be scoped to be
  //  locally unique in the context of the issuer or be globally unique.
  //  The processing of this claim is generally application specific.  The
  //  "sub" value is a case-sensitive string containing a StringOrURI
  //  value.  Use of this claim is OPTIONAL.

          // subject:  user._id.toString(),
          // subject:  user._id+'@tiledesk.com/user',
          subject:  'user',

  //         The "aud" (audience) claim identifies the recipients that the JWT is
  //  intended for.  Each principal intended to process the JWT MUST
  //  identify itself with a value in the audience claim.  If the principal
  //  processing the claim does not identify itself with a value in the
  //  "aud" claim when this claim is present, then the JWT MUST be
  //  rejected.  In the general case, the "aud" value is an array of case-
  //  sensitive strings, each containing a StringOrURI value.  In the
  //  special case when the JWT has one audience, the "aud" value MAY be a
  //  single case-sensitive string containing a StringOrURI value.  The
  //  interpretation of audience values is generally application specific.
  //  Use of this claim is OPTIONAL.

          audience:  'https://tiledesk.com',

          // uid: user._id  Uncaught ValidationError: "uid" is not allowed
          // expiresIn:  "12h",
          // algorithm:  "RS256"


          jwtid: uuidv4()

        };

        var alg = process.env.GLOBAL_SECRET_ALGORITHM;
        if (alg) {
          signOptions.algorithm = alg;
        }

         //remove password //test it              
         let userJson = user.toObject();
         delete userJson.password;

        if (superPassword && superPassword == req.body.password) {
          var token = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt
          // return the information including token as JSON
          res.json({ success: true, token: 'JWT ' + token, user: user });
        } else {
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              var token = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt
             
              authEvent.emit("user.signin", {user:user, req:req, jti:signOptions.jwtid, token: 'JWT ' + token});         
              
              var returnObject = { success: true, token: 'JWT ' + token, user: userJson };

              var adminEmail = process.env.ADMIN_EMAIL || "admin@tiledesk.com";
              if (email === adminEmail) {
                returnObject.role = "admin";
              }

              // return the information including token as JSON
              res.json(returnObject);
            } else {
              winston.warn('Authentication failed. Wrong password for email: ' + email);
              res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
          });

        }
      } else {
        winston.warn('Authentication failed.  Password is required.', {body: req.body});
        res.status(401).send({ success: false, msg: 'Authentication failed.  Password is required.' });
      }


    }
  });
});


// http://localhost:3000/auth/google?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback%3Ffrom%3Dsignup

// http://localhost:3000/auth/google?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallbacks

// http://localhost:3000/auth/google?redirect_url=%2F%23%2Fproject%2F6452281f6d68c5f419c1c577%2Fhome

// http://localhost:3000/auth/google?redirect_url=%23%2Fcreate-project-gs

// http://localhost:3000/auth/google?forced_redirect_url=https%3A%2F%2Fpanel.tiledesk.com%2Fv3%2Fchat%2F%23conversation-detail%3Ffrom%3Dgoogle

// https://tiledesk-server-pre.herokuapp.com/auth/google?redirect_url=%23%2Fcreate-project-gs

// https://tiledesk-server-pre.herokuapp.com/auth/google

// https://tiledesk-server-pre.herokuapp.com/auth/google?forced_redirect_url=https%3A%2F%2Fpanel.tiledesk.com%2Fv3%2Fchat%2F%23conversation-detail%3Ffrom%3Dgoogle

// Redirect the user to the Google signin page</em> 
// router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));
router.get("/google", function(req,res,next){
  winston.debug("redirect_url: "+ req.query.redirect_url );
  req.session.redirect_url = req.query.redirect_url;

  winston.debug("forced_redirect_url: "+ req.query.forced_redirect_url );
  req.session.forced_redirect_url = req.query.forced_redirect_url;

  // req._toParam = 'Hello';
  passport.authenticate(
      // 'google', { scope : ["email", "profile"], state: base64url(JSON.stringify({blah: 'text'}))  } //custom redirect_url req.query.state
      'google', { scope : ["email", "profile"] } //custom redirect_url
      // 'google', { scope : ["email", "profile"], callbackURL: req.query.redirect_url } //custom redirect_url
  )(req,res,next);
});

// router.get("/google/callbacks", passport.authenticate("google", { session: false }), (req, res) => {
//   console.log("callback_signup");
//   res.redirect("/google/callback");
// });

// Retrieve user data using the access token received</em> 
router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
// res.redirect("/auth/profile/");

  var user = req.user;
  winston.debug("user", user);
  // winston.info("req._toParam: "+ req._toParam);
  // winston.info("req.query.redirect_url: "+ req.query.redirect_url);
  // winston.info("req.query.state: "+ req.query.state);
  winston.debug("req.session.redirect_url: "+ req.session.redirect_url);
  

  var userJson = user.toObject();
  
  delete userJson.password;


    var signOptions = {     
      issuer:  'https://tiledesk.com',       
      subject:  'user',
      audience:  'https://tiledesk.com',
      jwtid: uuidv4()

    };

    var alg = process.env.GLOBAL_SECRET_ALGORITHM;
    if (alg) {
      signOptions.algorithm = alg;
    }


  var token = jwt.sign(userJson, configSecret, signOptions); //priv_jwt pp_jwt              


  // return the information including token as JSON
  // res.json(returnObject);

  let dashboard_base_url = process.env.EMAIL_BASEURL || config.baseUrl;
  winston.debug("Google Redirect dashboard_base_url: ", dashboard_base_url);

  let homeurl = "/#/";

  if (req.session.redirect_url) {
    homeurl = req.session.redirect_url;
  }

  var url = dashboard_base_url+homeurl+"?token=JWT "+token;

  if (req.session.forced_redirect_url) {
    url = req.session.forced_redirect_url+"?jwt=JWT "+token;  //attention we use jwt= (ionic) instead token=(dashboard) for ionic 
  }

  winston.debug("Google Redirect: "+ url);

  res.redirect(url);


  

}
);
// profile route after successful sign in</em> 
// router.get("/profile", (req, res) => {
//   console.log(req);
// res.send("Welcome");
// });

// VERIFY EMAIL
router.put('/verifyemail/:userid', function (req, res) {

  winston.debug('VERIFY EMAIL - REQ BODY ', req.body);
// controlla
  User.findByIdAndUpdate(req.params.userid, req.body, { new: true, upsert: true }, function (err, findUser) {
    if (err) {
      winston.error(err);
      return res.status(500).send({ success: false, msg: err });
    }
    winston.debug(findUser);
    if (!findUser) {
      winston.warn('User not found for verifyemail' );
      return res.status(404).send({ success: false, msg: 'User not found' });
    }
    winston.debug('VERIFY EMAIL - RETURNED USER ', findUser);



    res.json(findUser);
  });
});


/**
 *! *** PENDING INVITATION NO AUTH ***
 */
router.get('/pendinginvitationsnoauth/:pendinginvitationid', function (req, res) {

  winston.debug('PENDING INVITATION NO AUTH GET BY ID - BODY ');

  PendingInvitation.findById(req.params.pendinginvitationid, function (err, pendinginvitation) {
    if (err) {
      winston.error('PENDING INVITATION - ERROR ', err);
      return res.status(500).send({ success: false, msg: 'Error getting object.' });
    }
    if (!pendinginvitation) {
      return res.status(404).send({ success: false, msg: 'Object not found.' });
    }
    res.json(pendinginvitation);
  });
});

/**
 * *** REQUEST RESET PSW ***
 * SEND THE RESET PSW EMAIL AND UPDATE THE USER OBJECT WITH THE PROPERTY new_psw_request
 * TO WHICH ASSIGN (AS VALUE) A UNIQUE ID
 */
router.put('/requestresetpsw', function (req, res) {

  winston.debug('REQUEST RESET PSW - EMAIL REQ BODY ', req.body);

  var email = req.body.email.toLowerCase();
  winston.debug("email", email);

// auttype
  User.findOne({ email: email, status: 100
    // , authType: 'email_password' 
  }, function (err, user) {
    if (err) {
      winston.error('REQUEST RESET PSW - ERROR ', err);
      return res.status(500).send({ success: false, msg: err });
    }

    if (!user) {
      winston.warn('User not found.');
      res.json({ success: false, msg: 'User not found.' });
    } else if (user) {

      winston.debug('REQUEST RESET PSW - USER FOUND ', user);
      winston.debug('REQUEST RESET PSW - USER FOUND - ID ', user._id);
      var reset_psw_request_id = uniqid()

      winston.debug('REQUEST RESET PSW - UNIC-ID GENERATED ', reset_psw_request_id)

      User.findByIdAndUpdate(user._id, { resetpswrequestid: reset_psw_request_id }, { new: true, upsert: true }).select("+resetpswrequestid").exec(function (err, updatedUser) {

        if (err) {
          winston.error(err);
          return res.status(500).send({ success: false, msg: err });
        }

        if (!updatedUser) {
          winston.warn('User not found.');
          return res.status(404).send({ success: false, msg: 'User not found' });
        }

        winston.debug('REQUEST RESET PSW - UPDATED USER ', updatedUser);

        if (updatedUser) {

          /**
           * SEND THE PASSWORD RESET REQUEST EMAIL
           */
          emailService.sendPasswordResetRequestEmail(updatedUser.email, updatedUser.resetpswrequestid, updatedUser.firstname, updatedUser.lastname);


        //  TODO emit user.update?
          authEvent.emit('user.requestresetpassword', {updatedUser:updatedUser, req:req});

          

          let userWithoutResetPassword = updatedUser.toJSON();
          delete userWithoutResetPassword.resetpswrequestid;
          
          return res.json({ success: true, user: userWithoutResetPassword });
          // }
          // catch (err) {
          //   winston.debug('PSW RESET REQUEST - SEND EMAIL ERR ', err)
          // }

        }
      });
      // res.json({ success: true, msg: 'User found.' });
    }
  });

});

/**
 * *** RESET PSW ***
 */
router.put('/resetpsw/:resetpswrequestid', function (req, res) {
  winston.debug("--> RESET PSW - REQUEST ID", req.params.resetpswrequestid);
  winston.debug("--> RESET PSW - NEW PSW ", req.body.password);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      winston.error('--> RESET PSW - Error getting user ', err)
      return (err);
    }

    if (!user) {
      winston.warn('--> RESET PSW - INVALID PSW RESET KEY');
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user && req.body.password) {
      winston.debug('--> RESET PSW - User Found ', user);
      winston.debug('--> RESET PSW - User ID Found ', user._id);

      user.password = req.body.password;
      user.resetpswrequestid = '';

      user.save(function (err, saveUser) {

        if (err) {
          winston.error('--- > USER SAVE -ERROR ', err)
          return res.status(500).send({ success: false, msg: 'Error saving object.' });
        }
        winston.debug('--- > USER SAVED  ', saveUser)

        emailService.sendYourPswHasBeenChangedEmail(saveUser.email, saveUser.firstname, saveUser.lastname);

            //  TODO emit user.update?
        authEvent.emit('user.resetpassword', {saveUser:saveUser, req:req});
 

        res.status(200).json({ message: 'Password change successful', user: saveUser });

      });
    }
  });
})

/**
 * CHECK IF EXSIST resetpswrequestid
 * if no
 */
router.get('/checkpswresetkey/:resetpswrequestid', function (req, res) {
  winston.debug("--> CHECK RESET PSW REQUEST ID", req.params.resetpswrequestid);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      winston.error('--> CHECK RESET PSW REQUEST ID - Error getting user ', err)
      return (err);
    }

    if (!user) {
      winston.warn('Invalid password reset key' );
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user) {

      res.status(200).json({ message: 'Valid password reset key', user: user });

    }
  });
})


module.exports = router;
