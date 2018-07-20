var mongoose = require('mongoose');
var config = require('../config/database');
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Person = require("../models/person");
var uniqid = require('uniqid');
var emailService = require("../models/emailService");
const nodemailer = require('nodemailer');

//var emailTemplates = require('../config/email_templates');

router.post('/signup', function (req, res) {
  if (!req.body.email || !req.body.password) {
    res.json({ success: false, msg: 'Please pass email and password.' });
  } else {
    var newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      email: req.body.email,
      password: req.body.password,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      emailverified: false
    });
    // save the user
    newUser.save(function (err, savedUser) {
      if (err) {
        return res.json({ success: false, msg: 'Email already exists.', err: err });
      }
      console.log('-- >> -- >> savedUser ', savedUser);

      var emailPassword = process.env.EMAIL_PASSWORD;
      console.log('emailPassword ', emailPassword);

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        //port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'postmaster@mg.tiledesk.com',
          pass: emailPassword
        }
      });

      // setup email data with unicode symbols
      let mailOptions = {
        from: 'postmaster@mg.tiledesk.com', // sender address
        to: savedUser.email,
        bcc: 'info@frontiere21.it',
        subject: 'Verify your email address', // Subject line
        //text: 'Hello world?', // plain text body
        html: `
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
          
            <head>
              <meta name="viewport" content="width=device-width" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <title>New email from TileDesk</title>
          
              <style type="text/css">
                img {
                  max-width: 100%;
                  margin-left:16px;
                  margin-bottom:16px;
                  text-align:center !important;
                }
                body {
                  -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;
                }
                body {
                  background-color: #f6f6f6;
                }
          
                @media only screen and (max-width: 640px) {
                  body {
                    padding: 0 !important;
                  }
                  h1 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                    text-align:center !important;
                  }
                  h2 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h3 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h4 {
                    font-weight: 800 !important; margin: 20px 0 5px !important;
                  }
                  h1 {
                    font-size: 22px !important;
                  }
                  h2 {
                    font-size: 18px !important;
                  }
                  h3 {
                    font-size: 16px !important;
                  }
                  .container {
                    padding: 0 !important; width: 100% !important;
                  }
                  .content {
                    padding: 0 !important;
                  }
                  .content-wrap {
                    padding: 10px !important;
                  }
                  .invoice {
                    width: 100% !important;
                  }
                }
              </style>
            </head>
          
            <body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
          
              <table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                  <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                    <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                      <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                       
                      <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                          <div style="text-align:center">
                            <a href="http://www.tiledesk.com" style="color:#2daae1;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank">
                              <img src="http://tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png" style="width:50%;outline:none;text-decoration:none;border:none;min-height:36px" class="CToWUd">
                            </a>
                         </div>
                      </tr>

                    
                        <!-- <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
          
                           <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top;  font-weight: 500; text-align: center; border-radius: 3px 3px 0 0;  margin: 0;" align="center"; valign="top">
                             <div>
                               <h2>Welcome</h2>
                             </div>
          
                           </td>
                        </tr> -->
                   

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                            <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
          
                              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                  <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Hi ${savedUser.firstname} ${savedUser.lastname},</strong>
                                  <!-- <br> welcome on TileDesk.com. -->
                                  <br><br> Thank you for signin up with TileDesk.
                                  <br><br> To complete the setup, <span><a href="https://support.tiledesk.com/dashboard/#/verify/email/${savedUser._id}"> click here to verify your email address. </a> </span>
                                  <br><br>Give us your feedback! We need your advice. Send an email to info@frontiere21.it
                                  <br><br> Team TileDesk
                                </td>
                              </tr>
                             
                              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <div class="footer" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                        <table width="100%" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="aligncenter content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">
                              <span><a href="http://www.tiledesk.com" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;" > TileDesk.com </a></span>
                              <br><span>Powered by <a href="http://www.frontiere21.com" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Frontiere21</a></span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </div>
                  </td>
                  <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
                </tr>
              </table>
            </body>
          </html>
          `
      };
      console.log('mailOptions', mailOptions);


      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });

      return res.json({ success: true, msg: 'Successfully created new user.' });
      // savePerson(req, res, savedUser.id)
    });
  }
});

// function savePerson(req, res, userid) {
//   console.log('userid ', userid)
//   var newPerson = new Person({
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     userid: userid,
//     createdBy: 'Nicola',
//     updatedBy: 'Nicola'
//     // createdBy: req.user.username,
//     // updatedBy: req.user.username
//   });

//   newPerson.save(function (err, savedPerson) {
//     if (err) {
//       console.log('--- > ERROR ', err)
//       return res.status(500).send({ success: false, msg: 'Error saving object.' });
//     } else {
//       res.json({ success: true, msg: 'Successfully created new user.' });
//     }
//     // res.json(savedPerson);
//   });
// }

router.post('/signin', function (req, res) {
  console.log("req.body.email", req.body.email);

  User.findOne({
    email: req.body.email
  }, 'email firstname lastname password id', function (err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
      // check if password matches

      if (req.body.password) {
        var superPassword = process.env.SUPER_PASSWORD;

        if (superPassword && superPassword == req.body.password) {
          var token = jwt.sign(user, config.secret);
          // return the information including token as JSON
          res.json({ success: true, token: 'JWT ' + token, user: user });
        } else {
          user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
              // if user is found and password is right create a token
              var token = jwt.sign(user, config.secret);
              // return the information including token as JSON
              res.json({ success: true, token: 'JWT ' + token, user: user });
            } else {
              // console.log("my 401");
              res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
          });

        }
      } else {
        res.status(401).send({ success: false, msg: 'Authentication failed.  Password is required.' });
      }


    }
  });
});

// VERIFY EMAIL
router.put('/verifyemail/:userid', function (req, res) {

  console.log('VERIFY EMAIL REQ BODY ', req.body);

  User.findByIdAndUpdate(req.params.userid, req.body, { new: false, upsert: false }, function (err, findUser) {
    if (err) {
      console.log(err);
      return res.status(500).send({ success: false, msg: err });
    }
    console.log(findUser);
    if (!findUser) {
      return res.status(404).send({ success: false, msg: 'User not found' });
    }
    res.json(findUser);
  });
});


/**
 * *** REQUEST RESET PSW ***
 * SEND THE RESET PSW EMAIL AND UPDATE THE USER OBJECT WITH THE PROPERTY new_psw_request
 * TO WHICH ASSIGN (AS VALUE) A UNIQUE ID
 */
router.put('/requestresetpsw', function (req, res) {

  console.log('REQUEST RESET PSW - EMAIL REQ BODY ', req.body);

  User.findOne({ email: req.body.email }, function (err, user) {
    if (err) {
      console.log('REQUEST RESET PSW - ERROR ', err);
      return res.status(500).send({ success: false, msg: err });
    }

    if (!user) {
      res.json({ success: false, msg: 'User not found.' });
    } else if (user) {

      console.log('REQUEST RESET PSW - USER FOUND ', user);
      console.log('REQUEST RESET PSW - USER FOUND - ID ', user._id);
      var reset_psw_request_id = uniqid()

      console.log('REQUEST RESET PSW - UNIC-ID GENERATED ', reset_psw_request_id)

      User.findByIdAndUpdate(user._id, { resetpswrequestid: reset_psw_request_id }, { new: true, upsert: true }, function (err, updatedUser) {

        if (err) {
          console.log(err);
          return res.status(500).send({ success: false, msg: err });
        }

        if (!updatedUser) {
          return res.status(404).send({ success: false, msg: 'User not found' });
        }

        console.log('REQUEST RESET PSW - UPDATED USER ', updatedUser);

        if (updatedUser) {

         /**
          * SEND THE PASSWORD RESET REQUEST EMAIL
          */
          emailService.sendPasswordResetEmail(updatedUser.email, updatedUser.resetpswrequestid, updatedUser.firstname, updatedUser.lastname);

          return res.json({ success: true, user: updatedUser });
          // }
          // catch (err) {
          //   console.log('PSW RESET REQUEST - SEND EMAIL ERR ', err)
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
  console.log("--> RESET PSW - REQUEST ID", req.params.resetpswrequestid);
  console.log("--> RESET PSW - NEW PSW ", req.body.password);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      console.log('--> RESET PSW - Error getting user ', err)
      return (err);
    }

    if (!user) {
      console.log('--> RESET PSW - INVALID PSW RESET KEY', err)
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user && req.body.password) {
      console.log('--> RESET PSW - User Found ', user);
      console.log('--> RESET PSW - User ID Found ', user._id);

      user.password = req.body.password;
      user.resetpswrequestid = '';

      user.save(function (err, saveUser) {

        if (err) {
          console.log('--- > USER SAVE -ERROR ', err)
          return res.status(500).send({ success: false, msg: 'Error saving object.' });
        }
        console.log('--- > USER SAVED  ', saveUser)

        emailService.sendYourPswHasBeenChangedEmail(saveUser.email, saveUser.firstname, saveUser.lastname);

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
  console.log("--> CHECK RESET PSW REQUEST ID", req.params.resetpswrequestid);

  User.findOne({ resetpswrequestid: req.params.resetpswrequestid }, function (err, user) {

    if (err) {
      console.log('--> CHECK RESET PSW REQUEST ID - Error getting user ', err)
      return (err);
    }

    if (!user) {
      console.log('--> CHECK RESET PSW REQUEST ID - PSW RESET KEY is', err)
      return res.status(404).send({ success: false, msg: 'Invalid password reset key' });
    }

    if (user) {

      res.status(200).json({ message: 'Valid password reset key', user: user });

    }
  });
})


module.exports = router;
