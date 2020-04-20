var config = require('../config/database');
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
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


router.post('/signup',
[
  check('email').isEmail(),  
]
, function (req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  
  if (!req.body.email || !req.body.password) {
    return res.json({ success: false, msg: 'Please pass email and password.' });
  } else {    
    return userService.signup(req.body.email, req.body.password, req.body.firstname, req.body.lastname, false)
      .then(function (savedUser) {


        winston.debug('-- >> -- >> savedUser ', savedUser.toObject());

        if (!req.body.disableEmail){
          emailService.sendVerifyEmailAddress(savedUser.email, savedUser);
        }
        


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
    return res.status(422).json({ errors: errors.array() });
  }
  var firstname = req.body.firstname || "Guest";
  
// TODO remove email.sec?
  let userAnonym = {_id: uuidv4(), firstname:firstname, lastname: req.body.lastname, email: req.body.email, attributes: req.body.attributes};

  req.user = UserUtil.decorateUser(userAnonym);

    var newProject_user = new Project_user({
      // _id: new mongoose.Types.ObjectId(),
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

    
          authEvent.emit("user.signin", {user:userAnonym, req:req});       
          
          authEvent.emit("projectuser.create", savedProject_user);         

          winston.info('project user created ', savedProject_user.toObject());

          
          // JWT_HERE
          var signOptions = {
            issuer:  'https://tiledesk.com',
            // subject:  'guest',
            subject:  userAnonym.id,            
            //audience:  'https://tiledesk.com',           
            audience:  '/users',           
          };

          var token = jwt.sign(userAnonym, config.secret, signOptions);

          res.json({ success: true, token: 'JWT ' + token, user: userAnonym });
      });
   
 
});



router.post('/signinWithCustomToken', [
  // function(req,res,next) {req.disablePassportEntityCheck = true;winston.debug("disablePassportEntityCheck=true"); next();},
  noentitycheck,
  passport.authenticate(['jwt'], { session: false }), 
  validtoken], function (req, res) {

    winston.debug("signinWithCustomToken req: ", req );

    if (!req.user.aud) { //serve??
      return res.status(400).send({ success: false, msg: 'JWT Aud field is required' });
    }
  
    const audUrl  = new URL(req.user.aud);
    winston.debug("audUrl: "+ audUrl );
    const path = audUrl.pathname;
    winston.debug("audUrl path: " + path );
    
    const AudienceType = path.split("/")[1];
    winston.debug("audUrl AudienceType: " + AudienceType );

    const AudienceId = path.split("/")[2];
    winston.debug("audUrl AudienceId: " + AudienceId );
    
    if (!AudienceId) {
      return res.status(400).send({ success: false, msg: 'JWT Aud.AudienceId field is required' });
    }

  
// evitare inserimenti multipli
    Project_user.findOne({ id_project: AudienceId, uuid_user: req.user._id,  role: RoleConstants.USER}).              
      exec(function (err, project_users) {
      if (err) {
        winston.error(err);
        return res.json({ success: true, token: req.headers["authorization"], user: req.user });
      }
      if (!project_users) {
          var newProject_user = new Project_user({

            // id_project: req.body.id_project, //attentoqui
            id_project: AudienceId,
            uuid_user: req.user._id,
            // id_user: req.user._id,
            role: RoleConstants.USER,
            user_available: true,
            createdBy: req.user._id, //oppure req.user.id attento problema
            updatedBy: req.user._id
          });

          return newProject_user.save(function (err, savedProject_user) {
            if (err) {
              winston.error('Error saving object.', err)
              // return res.status(500).send({ success: false, msg: 'Error saving object.' });
              return res.json({ success: true, token: req.headers["authorization"], user: req.user });
            }

          
            authEvent.emit("projectuser.create", savedProject_user);         

              winston.info('project user created ', savedProject_user.toObject());

              

            return res.json({ success: true, token: req.headers["authorization"], user: req.user });
        });
      }else {
        winston.info('project user already exists ');
        return res.json({ success: true, token: req.headers["authorization"], user: req.user });
      }

           
      });
 
});












//caso UNI. pass jwt token with project secret sign. so aud=project/id subject=user
// router.post('/signinWithCustomTokenAndCreateUser', [
//   // function(req,res,next) {req.disablePassportEntityCheck = true;winston.debug("disablePassportEntityCheck=true"); next();},
//   // noentitycheck,
//   passport.authenticate(['jwt'], { session: false }), 
//   validtoken], function (req, res) {


//     if (!req.user.aud) {
//       return res.status(400).send({ success: false, msg: 'JWT Aud field is required' });
//     }
  
//     const audUrl  = new URL(req.user.aud);
//     winston.debug("audUrl: "+ audUrl );
//     const path = audUrl.pathname;
//     winston.debug("audUrl path: " + path );
    
//     const AudienceType = path.split("/")[1];
//     winston.debug("audUrl AudienceType: " + AudienceType );

//     const AudienceId = path.split("/")[2];
//     winston.debug("audUrl AudienceId: " + AudienceId );
    
//     if (!AudienceId) {
//       return res.status(400).send({ success: false, msg: 'JWT Aud.AudienceId field is required' });
//     }

//     // winston.info('signinWithCustomToken req: ' , req);

//     var email = uuidv4() + '@tiledesk.com';
//     if (req.user.email) {
//       email = req.user.email;
//     }
  
//   winston.info('signinWithCustomToken email: ' + email);

//   var password = uuidv4();
//   winston.info('signinWithCustomToken password: ' + password);

//   // signup ( email, password, firstname, lastname, emailverified)
//   return userService.signup(email, password, req.user.firstname, req.user.lastname, false, "custom")
//     .then(function (savedUser) {


//       winston.debug('-- >> -- >> savedUser ', savedUser.toObject());


//       var newProject_user = new Project_user({

//         // id_project: req.body.id_project, //attentoqui
//         id_project: AudienceId,
        
//         id_user: savedUser._id,
//         role: RoleConstants.USER,
//         user_available: true,
//         createdBy: savedUser.id,
//         updatedBy: savedUser.id
//       });

//       return newProject_user.save(function (err, savedProject_user) {
//         if (err) {
//           winston.error('Error saving object.', err)
//           return res.status(500).send({ success: false, msg: 'Error saving object.' });
//         }

//         authEvent.emit("user.signin", {user:savedUser, req:req});     
        
        
//         authEvent.emit("projectuser.create", savedProject_user);         

//           winston.info('project user created ', savedProject_user.toObject());

          
//         //remove password 
//         let userJson = savedUser.toObject();
//         delete userJson.password;
        

//         var signOptions = {
//           issuer:  'https://tiledesk.com',
//           subject:  'user',
//           audience:  'https://tiledesk.com',           
//         };

//         var token = jwt.sign(userJson, config.secret, signOptions);

//         res.json({ success: true, token: 'JWT ' + token, user: userJson });
//     });
//   }).catch(function (err) {

//     authEvent.emit("user.signin.error", {body: req.body, err:err});             

//      winston.error('Error registering new user', err);
//      res.send(err);
//   }).finally(function () {
// // anche se utente già esiste devi fare join su progetto 
//   });
// });




router.post('/signin', function (req, res) {
  winston.debug("req.body.email", req.body.email);
// authType
  User.findOne({
    email: req.body.email, status: 100
    //authType: 'email_password'
  }, 'email firstname lastname password emailverified id', function (err, user) {
    if (err) {
      winston.error("Error signin", err);
      throw err;
    } 

    if (!user) {
     
      
    
      authEvent.emit("user.signin.error", {req: req});        


      winston.warn('Authentication failed. User not found.');
      res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
      // check if password matches

      if (req.body.password) {
        var superPassword = process.env.SUPER_PASSWORD || "superadmin";

  
      
    // JWT_HERE

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

//  Subject - In a security context, a subject is any entity that requests access to an object. These are generic terms used to denote the thing requesting access and the thing the request is made against. When you log onto an application you are the subject and the application is the object. When someone knocks on your door the visitor is the subject requesting access and your home is the object access is requested of.
// Principal - A subset of subject that is represented by an account, role or other unique identifier. When we get to the level of implementation details, principals are the unique keys we use in access control lists. They may represent human users, automation, applications, connections, etc.

          // subject:  user._id.toString(),
          // subject:  user._id+'@tiledesk.com/user',
          // subject:  'user',
          subject:  user.id,

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

          audience:  '/users',
          // audience:  'https://tiledesk.com',

          // uid: user._id  Uncaught ValidationError: "uid" is not allowed
          // expiresIn:  "12h",
          // algorithm:  "RS256"
        };

         //remove password //test it              
         let userJson = user.toObject();
         delete userJson.password;

        if (superPassword && superPassword == req.body.password) {
          // TODO add subject
          var token = jwt.sign(userJson, config.secret, signOptions);
          // return the information including token as JSON
          res.json({ success: true, token: 'JWT ' + token, user: user });
        } else {
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              // TODO use userJSON 
              // TODO add subject
              var token = jwt.sign(userJson, config.secret, signOptions);
             
              authEvent.emit("user.signin", {user:user, req:req});         
              
               

              // return the information including token as JSON
              res.json({ success: true, token: 'JWT ' + token, user: userJson });
            } else {
              winston.warn('Authentication failed. Wrong password.' );
              res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
          });

        }
      } else {
        winston.warn('Authentication failed.  Password is required.');
        res.status(401).send({ success: false, msg: 'Authentication failed.  Password is required.' });
      }


    }
  });
});

// VERIFY EMAIL
router.put('/verifyemail/:userid', function (req, res) {

  winston.debug('VERIFY EMAIL - REQ BODY ', req.body);

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

  console.log('PENDING INVITATION NO AUTH GET BY ID - BODY ');

  PendingInvitation.findById(req.params.pendinginvitationid, function (err, pendinginvitation) {
    if (err) {
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
// auttype
  User.findOne({ email: req.body.email, status: 100
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

      User.findByIdAndUpdate(user._id, { resetpswrequestid: reset_psw_request_id }, { new: true, upsert: true }, function (err, updatedUser) {

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


         
          authEvent.emit('user.requestresetpassword', {updatedUser:updatedUser, req:req});

          

          return res.json({ success: true, user: updatedUser });
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