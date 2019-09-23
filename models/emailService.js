'use strict';

const nodemailer = require('nodemailer');
var config = require('../config/email');
var winston = require('../config/winston');

class EmailService {



  getTransport() {

  
    // var emailPassword = "";
    var emailPassword = process.env.EMAIL_PASSWORD;

    // winston.debug('emailPassword ', emailPassword);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: config.host,
      //port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.username,
        pass: emailPassword
      }
    });
    return transporter;
  }

  send(to, subject, html) {
    let mailOptions = {
      from: config.from, // sender address
      to: to,
      // bcc: config.bcc,
      subject: subject, // Subject line
      //text: 'Hello world?', // plain text body
      html: html
    };
    // winston.debug('mailOptions', mailOptions);

    // send mail with defined transport object
    this.getTransport().sendMail(mailOptions, (error, info) => {
      if (error) {
        return winston.error("Error sending email ", error);
      }
      winston.debug('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      // winston.debug('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }




  sendNewAssignedRequestNotification(to, savedRequest, project) {
       //  <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    //    <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    //      Requester: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.requester_fullname}</strong>
                    //    </td>
                    //  </tr>


    var html = `
     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
     <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
     
       <head>
         <meta name="viewport" content="width=device-width" />
         <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
         <title>New request from TileDesk</title>
     
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
     
                     <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; margin: 0;" align="center"  valign="top">
                       <div>
                         <h2>New Request assigned to you</h2>
                       </div>
     
                     </td>
                   </tr>
                   
                   <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                     <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                       <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
     
                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                       <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                         Message: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.first_text}</strong>
                       </td>
                     </tr>

                                     


                     <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                     <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                       Project Name : <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${project ? project.name : '-'}</strong>
                     </td>
                     </tr>
                                       

                     <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                       <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                       Click <a href="https://support.tiledesk.com/dashboard/#/project/${savedRequest.id_project}/request/${savedRequest.request_id}/messages">here</a> to open the dashboard.
                         
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
                         <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
     `;

    this.send(to, `[TileDesk ${project ? project.name : '-'}] New Assigned Request`, html);

    this.send(config.bcc, `[TileDesk ${project ? project.name : '-'}] New Assigned Request ${to}`, html);
  }

  sendNewPooledRequestNotification(to, savedRequest, project) {
  // <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              //   <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                              //     Requester: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.requester_fullname}</strong>
                              //   </td>
                              // </tr>

    var html = `
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
              
                              <td class="alert alert-warning" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; margin: 0;" align="center"  valign="top">
                                <div>
                                  <h2>New Pooled Request</h2>
                                </div>
              
                              </td>
                            </tr>
                            
                            <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
              
                                
                              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                  Message: <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${savedRequest.first_text}</strong>
                                </td>
                              </tr>


                            

                              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                Project Name : <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${project ? project.name : '-'}</strong>
                              </td>
                              </tr>
                          


                              <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                  Click <a href="https://support.tiledesk.com/dashboard/#/project/${savedRequest.id_project}/request/${savedRequest.request_id}/messages">here</a> to open the dashboard.
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
                                  <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span> 
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
              `;

    this.send(to, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);
    //this.send(config.bcc, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);
  }

  /**
   * ******** EMAIL: PASSWORD RESET REQUEST ********
   */
  sendPasswordResetRequestEmail(to, resetPswRequestId, userFirstname, userLastname) {

    var html = `

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

                        <div style="text-align:center">
                          <a href="http://www.tiledesk.com" style="color:#2daae1;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank">
                            <img src="http://tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png" style="width:50%;outline:none;text-decoration:none;border:none;" class="CToWUd">
                          </a>
                        </div>

                        <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                         
                         <!-- <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          </tr> -->
  
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            

                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    <h2 style="text-align: center; letter-spacing: 1px; ">
                                      Password reset request
                                    </h2>

                                    <br> <br<strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Hi ${userFirstname} ${userLastname},</strong>
                                    
                                    <br> <br>
                                    Seems like  you forgot your password for TileDesk. If this is true, click below to reset your password
                                    <div style="text-align: center;">
                                      <br><br>
                                      <a href="https://support.tiledesk.com/dashboard/#/resetpassword/${resetPswRequestId}" style=" background-color: #ff8574 !important; border: none; color: white; padding: 12px 30px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; font-weight: 600; letter-spacing: 1px; margin: 4px 2px; cursor: pointer;">
                                      Reset My Password
                                      </a>
                                    </div>
                                    <!-- <br><br> To complete the setup, <span><a href="https://support.tiledesk.com/dashboard/#/resetpassword/${resetPswRequestId}"> click here to verify your email address. </a> </span> -->
                                    <br><br>If you did not forgot your password you can safely ignore this email.
                                    <br><br><span style="font-size:12px; ">If you're having trouble clicking the "Reset My Password" button, copy and paste the URL below into your web browser: </span>
                                    <br>
                                    <span style="color:#03a5e8; font-size:12px; ">https://support.tiledesk.com/dashboard/#/resetpassword/${resetPswRequestId}</span>
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
                                <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
            `;


    this.send(to, '[TileDesk] Password reset request', html);
    this.send(config.bcc, '[TileDesk] Password reset request', html);
  }

  /**
   * ********  EMAIL: YOUR PASSWORD HAS BEEN CHANGED ********
   */
  sendYourPswHasBeenChangedEmail(to, userFirstname, userLastname) {

    var html = `

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

                          <div style="text-align:center">
                            <a href="http://www.tiledesk.com" style="color:#2daae1;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank">
                            <img src="http://tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png" style="width:50%;outline:none;text-decoration:none;border:none;" class="CToWUd">
                          </a>
                        </div>
                        <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                         
                         <!-- <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              
                          </tr> -->
  
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            

                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    <h2 style="text-align: center; letter-spacing: 1px; ">
                                      Your password has been changed
                                    </h2>

                                    <br> <br<strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Hi ${userFirstname} ${userLastname},</strong>
                                    
                                    <br> <br>
                                    The password of your TileDesk account  ${to} was just changed. 
                                    <br><br>If this was you, then you can safely ignore this email.
                                    <br><br>If this wasn't you please contact <a href="mailto:info@frontiere21.it">our support team</a>
                                
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
                                <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
            `;


    this.send(to, '[TileDesk] Your password has been changed', html);
    this.send(config.bcc, '[TileDesk] Your password has been changed', html);
  }


  
  /**
   * ******** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT  ********
   */
  sendYouHaveBeenInvited(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserFirstname, invitedUserLastname, invitedUserRole) {

    var html = `

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

                          <div style="text-align:center">
                            <a href="http://www.tiledesk.com" style="color:#2daae1;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank">
                            <img src="http://tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png" style="width:50%;outline:none;text-decoration:none;border:none;" class="CToWUd">
                          </a>
                        </div>
                        <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                         
                         <!-- <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              
                          </tr> -->
  
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            

                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    <h2 style="text-align: center; letter-spacing: 1px; font-weight: 400; line-height:24px ">
                                      ${currentUserFirstname} ${currentUserLastname} has invited you to the TileDesk project <strong> ${projectName}</strong> 
                                    </h2>

                                    <br> <br<strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Hi ${invitedUserFirstname} ${invitedUserLastname},</strong>
                                    
                                    <br> <br>
                                    I invited you to take on the role of  ${invitedUserRole} of the TileDesk <strong> ${projectName}</strong> project
                                

                                    <div style="text-align: center;">
                                      <br><br>
                                      <a href="https://support.tiledesk.com/dashboard/#/project/${id_project}/home" style=" background-color: #ff8574 !important; border: none; color: white; padding: 12px 30px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; font-weight: 600; letter-spacing: 1px; margin: 4px 2px; cursor: pointer;">
                                        GO TO THE PROJECT
                                      </a>
                                    </div>

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
                                <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
            `;


    this.send(to, `[TileDesk] You have been invited to the '${projectName}' project`, html);
    this.send(config.bcc, `[TileDesk] You have been invited to the '${projectName}' project`, html);
  }

  /**
   * ******** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT (USER NOT REGISTERED) ********
   */
  sendInvitationEmail_UserNotRegistered(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserRole) {

    var html = `

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

                          <div style="text-align:center">
                            <a href="http://www.tiledesk.com" style="color:#2daae1;font-weight:bold;text-decoration:none;word-break:break-word" target="_blank">
                            <img src="http://tiledesk.com/wp-content/uploads/2018/03/tiledesk-logo.png" style="width:50%;outline:none;text-decoration:none;border:none;" class="CToWUd">
                          </a>
                        </div>
                        <table class="main" width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
                         
                         <!-- <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              
                          </tr> -->
  
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            

                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                                  <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                    <h2 style="text-align: center; letter-spacing: 1px; font-weight: 400; line-height:24px ">
                                      ${currentUserFirstname} ${currentUserLastname} has invited you to the TileDesk project <strong> ${projectName}</strong> 
                                    </h2>

                                    <br> <br<strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${to},</strong>
                                    
                                    <br> <br>
                                    I invited you to take on the role of ${invitedUserRole} of the TileDesk <strong> ${projectName}</strong> project
                                

                                    <div style="text-align: center;">
                                      <br><br>
                                      <a href="https://support.tiledesk.com/dashboard/#/project/${id_project}/home" style=" background-color: #ff8574 !important; border: none; color: white; padding: 12px 30px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; font-weight: 600; letter-spacing: 1px; margin: 4px 2px; cursor: pointer;">
                                        GO TO THE PROJECT
                                      </a>
                                    </div>

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
                                <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
            `;

    this.send(to, `[TileDesk] You have been invited to the '${projectName}' project`, html);
    this.send(config.bcc, `[TileDesk] You have been invited to the '${projectName}' project`, html);
  }

  sendVerifyEmailAddress(to, savedUser) {

    var html = `
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
                            <br><br>Give us your feedback! We need your advice. Send an email to <a href="mailto:info@frontiere21.it">info@frontiere21.it</a>
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
                        <br><span><a href="%unsubscribe_url%"  style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">Unsubscribe</a></span>
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
    `;

    this.send(to, `[TileDesk] Verify your email address`, html);
    this.send(config.bcc, `[TileDesk] Verify your email address `+to, html);
  }









  sendRequestTranscript(to, messages, request) {

var transcriptAsHtml = "";
messages.forEach(message => {
  transcriptAsHtml = transcriptAsHtml + '['+ message.createdAt.toLocaleTimeString('it', { timeZone: 'UTC' }) +'] ' + message.senderFullname + ': ' + message.text + '<br>';
});

 var html = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
  
    <head>
      <meta name="viewport" content="width=device-width" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Request transcript</title>
  
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
                  <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
  


                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">Hi,</strong>
                            <br><br> here's the transcript of your conversation.

                            </td>
                          </tr>


                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            Chat started on <span style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${request.createdAt.toLocaleString('it', { timeZone: 'UTC' })}</span>
                          </td>
                          </tr>

                      
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                              <strong style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                              ` +       
                              
                            transcriptAsHtml



                      
                        
                        

                          +
                          `


                          </strong>
                            </td>
                          </tr>

                            
                          <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            </td>
                          </tr>



                        
                          
                    </table>

                    </td>
                    </tr>


                 
    
                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                    <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;" valign="top">
                      
    
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            Department : <span style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${request.department && request.department.name ? request.department.name : '-'}</span>
                          </td>
                        </tr>

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            Source : <span style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${request.sourcePage ? request.sourcePage : '-'} </span>
                          </td>
                        </tr>

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                          <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                            User Agent : <span style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${request.userAgent ? request.userAgent : '-'}</span>
                          </td>
                        </tr>

                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                          Language : <span style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">${request.language ? request.language : '-'}</span>
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
  `;

 this.send(to, '[TileDesk] Transcript', html);
 this.send(config.bcc, '[TileDesk] Transcript', html);
}




}


var emailService = new EmailService();

// chatApi.CHAT_MESSAGE_STATUS = {
//             FAILED : -100,
//             SENDING : 0,
//             SENT : 100, //saved into sender timeline
//             DELIVERED : 150, //delivered to recipient timeline
//             RECEIVED : 200, //received from the recipient client
//             RETURN_RECEIPT: 250, //return receipt from the recipient client
//             SEEN : 300 //seen

//         }
module.exports = emailService;
