var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var Request = require("../models/request");
const nodemailer = require('nodemailer');
// const Email = require('email-templates');

// var newRequest = {};
// newRequest.created_on = admin.firestore.FieldValue.serverTimestamp();
// newRequest.requester_id = message.sender;
// newRequest.requester_fullname = message.sender_fullname;
// newRequest.first_text = message.text;
// newRequest.members = group_members;
// newRequest.membersCount = Object.keys(group_members).length;
// newRequest.support_status = chatSupportApi.CHATSUPPORT_STATUS.UNSERVED;
// newRequest.app_id = app_id;

router.post('/', function(req, res) {

  console.log(req.body);
  var newRequest = new Request({
    requester_id: req.body.requester_id,
    requester_fullname: req.body.requester_fullname,
    first_text: req.body.first_text,
    // recipient: req.body.recipient,
    // recipientFullname: req.body.recipientFullname,
    support_status: req.body.support_status,
    id_project: req.projectid,
    createdBy: req.user.id,
    updatedBy: req.user.id
  });

  newRequest.save(function(err, savedRequest) {
    if (err) {
      console.log('Error saving object.',err);

      return res.status(500).send({success: false, msg: 'Error saving object.', err:err});
    }







    var emailPassword = process.env.EMAIL_PASSWORD;

    

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org',
        //port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            // user: 'postmaster@mg.tiledesk.com', 
            user:'postmaster@sandbox019eceb238bc4f0091d2f03f5c9e797c.mailgun.org',

            pass: emailPassword
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'postmaster@mg.tiledesk.com', // sender address
        to: "andrea.leo@frontiere21.it",
        bcc: 'info@frontiere21.it',
        subject: 'New Support Request from TileDesk', // Subject line
        //text: 'Hello world?', // plain text body
        html: `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
        
          <head>
            <meta name="viewport" content="width=device-width" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>New support request from TileDesk</title>
        
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

                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
        
                        <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; color: #fff; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; margin: 0;" align="center"  valign="top">
                          <div>
                            <h2>New Support Request</h2>
                          </div>
        
                        </td>
                      </tr>
                      
                      <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
        
                          

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            Richiedente: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.requester_fullname}</strong>
                          </td>
                        </tr>

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                         Id Richiedente: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.requester_id}</strong>
                        </td>
                        </tr>

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            Testo della richiesta: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.first_text}</strong>
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



    // https://github.com/niftylettuce/email-templates

    // var emailPassword = process.env.EMAIL_PASSWORD;

    // // create reusable transporter object using the default SMTP transport
    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.mailgun.org',
    //     //port: 587,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //         user: 'postmaster@mg.tiledesk.com', 
    //         pass: emailPassword
    //     }
    // });

    // // create template based sender function
    // // assumes text.{ext} and html.{ext} in template/directory
    // var sendNewRequestEmail = transporter.templateSender(new EmailTemplate('template/email/newrequest'), {
    //   from: 'sender@example.com',
    // });

    // // use template based sender to send a message
    // sendPwdReminder({
    //   to: 'receiver@example.com',
    //   // EmailTemplate renders html and text but no subject so we need to
    //   // set it manually either here or in the defaults section of templateSender()
    //   subject: 'Password reminder'
    // }, {
    //   username: 'Node Mailer',
    //   password: '!"\'<>&some-thing'
    // }, function(err, info){
    //   if(err){
    //     console.log('Error');
    //   }else{
    //       console.log('Password reminder sent');
    //   }
    // });
    
    

    res.json(savedRequest);
  });
});

// router.put('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.findByIdAndUpdate(req.params.messageid, req.body, {new: true, upsert:true}, function(err, updatedMessage) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error updating object.'});
//       }
//       res.json(updatedMessage);
//     });
//   });


//   router.delete('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.remove({_id:req.params.messageid}, function(err, Message) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error deleting object.'});
//       }
//       res.json(Message);
//     });
//   });


//   router.get('/:messageid', function(req, res) {
  
//     console.log(req.body);
    
//     Message.findById(req.params.messageid, function(err, message) {
//       if (err) {
//         return res.status(500).send({success: false, msg: 'Error getting object.'});
//       }
//       if(!message){
//         return res.status(404).send({success: false, msg: 'Object not found.'});
//       }
//       res.json(message);
//     });
//   });



// router.get('/', function(req, res) {

//     Message.find(function (err, messages) {
//       if (err) return next(err);
//       res.json(messages);
//     });
// });

module.exports = router;
