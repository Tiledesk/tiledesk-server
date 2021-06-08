'use strict';

const nodemailer = require('nodemailer');
var config = require('../config/email');
var winston = require('../config/winston');
var handlebars = require('handlebars');

// handlebars.registerHelper('ifCond', function(v1, v2, options) {
//   if(v1 === v2) {
//     return options.fn(this);
//   }
//   return options.inverse(this);
// });


var fs = require('fs');
var appRoot = require('app-root-path');

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


class EmailService {

  constructor() {

    this.enabled = process.env.EMAIL_ENABLED || false;
    winston.info('EmailService enabled: '+ this.enabled);

    this.baseUrl = process.env.EMAIL_BASEURL || config.baseUrl;
    winston.info('EmailService baseUrl: '+ this.baseUrl);

    this.from = process.env.EMAIL_FROM_ADDRESS || config.from;
    winston.info('EmailService from email: '+ this.from);

    this.bcc = process.env.EMAIL_BCC || config.bcc;
    winston.info('EmailService bcc address: '+ this.bcc);

    this.replyTo = process.env.EMAIL_REPLY_TO || config.replyTo;
    winston.info('EmailService replyTo address: '+ this.replyTo);

    this.replyToDomain = process.env.EMAIL_REPLY_TO_DOMAIN || config.replyToDomain;
    winston.info('EmailService replyToDomain : '+ this.replyToDomain);

    this.emailPassword = process.env.EMAIL_PASSWORD;

    var maskedemailPassword;
    if (this.emailPassword) {
      maskedemailPassword = MaskData.maskPhone(this.emailPassword, maskOptions);
    }else {
      maskedemailPassword = this.emailPassword;
    }

    winston.info('EmailService emailPassword: ' + maskedemailPassword);

    this.host = process.env.EMAIL_HOST || config.host;
    winston.info('EmailService host: ' + this.host);

    this.secureEmail  = process.env.EMAIL_SECURE || false;
    winston.info('EmailService secureEmail: ' + this.secureEmail);

    this.user  = process.env.EMAIL_USERNAME || config.username;
    winston.info('EmailService username: ' + this.user);

    this.port  = process.env.EMAIL_PORT;
    winston.info('EmailService port: ' + this.port);

  }


  readTemplateFile(templateName, callback) {
    fs.readFile(appRoot + '/template/email/'+templateName, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            winston.error('error readTemplateFile getting ', err);
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};


  getTransport(config) {

    if (!config) {
      config = {
        host: this.host,
        port: this.port, // defaults to 587 if is secure is false or 465 if true
        secure: this.secureEmail,         
        user: this.user,
        pass: this.emailPassword      
      }
    }

    winston.verbose("getTransport config", config);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port, // defaults to 587 if is secure is false or 465 if true
      secure: config.secureEmail, 
      auth: {
        user: config.user,
        pass: config.emailPassword
      }
    });
    return transporter;
  }

  // @deprecated
  // send(to, subject, html) {
  //   return this.sendMail({to:to, subject:subject, html:html});
  // }

  send(mail) {

    if (!this.enabled) {
      winston.info('EmailService is disabled. Not sending email');
      return 0;
    }
    if (process.env.NODE_ENV == 'test')  {	
      return winston.warn("EmailService not sending email for testing");
    }

    let mailOptions = {
      from: mail.from || this.from, // sender address
      to: mail.to,
      // bcc: config.bcc,
      replyTo: mail.replyTo || this.replyTo,
      subject: mail.subject, // Subject line
      text: mail.text, // plain text body
      html: mail.html
    };

    winston.debug('mailOptions', mailOptions);

    if (!mail.to) {
      return winston.warn("EmailService send method. to field is not defined", mailOptions);
    }

    // send mail with defined transport object
    this.getTransport(mail.config).sendMail(mailOptions, (error, info) => {
      if (error) {
        return winston.error("Error sending email ", {error:error,  mailOptions:mailOptions});
      }
      winston.debug('Email sent: %s', info);
      // Preview only available when sending through an Ethereal account
      // winston.debug('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }


  sendTest(to) {      

    var that = this;

    this.readTemplateFile('test.html', function(err, html) {

      var template = handlebars.compile(html);

      var replacements = {        
        user: {name: "andrea"},
        enabled: true   
      };

      var html = template(replacements);

      that.send(to, `TileDesk test email`, html);

      that.send(that.bcc, `TileDesk test email - notification`, html);

    });
   

    
  }


// ok
  sendNewAssignedRequestNotification(to, savedRequest, project) {      

    var that = this;

    this.readTemplateFile('assignedRequest.html', function(err, html) {


      var envTemplate = process.env.EMAIL_ASSIGN_REQUEST_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

      // passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email

      var replacements = {        
        savedRequest: savedRequest.toJSON(),
        project: project.toJSON(),
        baseScope: baseScope    
      };

      winston.debug("replacements ", replacements);

      var html = template(replacements);
      winston.debug("html after: " + html);

      let config;
      if (project && project.settings && project.settings.email && project.settings.email.config) {
        config = project.settings.email.config;
        winston.verbose("custom email setting found: ", config);
      }

      that.send({to:to, subject: `[TileDesk ${project ? project.name : '-'}] New Assigned Request`, html:html, config: config});

      that.send({to: that.bcc, subject: `[TileDesk ${project ? project.name : '-'}] New Assigned Request ${to}  - notification`, html:html});

    });
    
  }

  // ok
  sendNewPooledRequestNotification(to, savedRequest, project) {

    var that = this;

    this.readTemplateFile('pooledRequest.html', function(err, html) {


      var envTemplate = process.env.EMAIL_POOLED_REQUEST_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

// passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email
      var replacements = {        
        savedRequest: savedRequest.toJSON(),
        project: project.toJSON(),
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send({to: to, subject: `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html:html });
    // this.send(config.bcc, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);

    });
  }


  sendNewMessageNotification(to, message, project, tokenQueryString) {

    var that = this;

    this.readTemplateFile('newMessage.html', function(err, html) {


      var envTemplate = process.env.EMAIL_NEW_MESSAGE_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

      var replacements = {        
        message: message,
        project: project.toJSON(),
        tokenQueryString: tokenQueryString,
        baseScope: baseScope    
      };

      var html = template(replacements);
      winston.debug("html: " + html);

      let replyTo;
      if (message.request) {
        if (message.request.ticket_id) {
          replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
        } else {
          replyTo = message.request.request_id+"@"+that.replyToDomain;
        }
        
        winston.info("replyTo: " + replyTo);
      }
      

      that.send({to:to, replyTo: replyTo, subject:`[TileDesk ${project ? project.name : '-'}] New Offline Message`, html:html});
      that.send({to: config.bcc, replyTo: replyTo, subject: `[TileDesk ${project ? project.name : '-'}] New Offline Message - notification`, html:html});

    });
  }


  
  sendEmailChannelNotification(to, message, project, tokenQueryString) {

    var that = this;

    this.readTemplateFile('ticket.txt', function(err, html) {
      // this.readTemplateFile('ticket.html', function(err, html) {


      var envTemplate = process.env.EMAIL_TICKET_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

      var replacements = {        
        message: message,
        project: project.toJSON(),
        tokenQueryString: tokenQueryString,
        baseScope: baseScope    
      };

      var html = template(replacements);
      winston.debug("html: " + html);

      let replyTo;
      if (message.request) {
        if (message.request.ticket_id) {
          replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
        } else {
          replyTo = message.request.request_id+"@"+that.replyToDomain;
        }
        
        winston.info("replyTo: " + replyTo);
      }

      // if (message.request && message.request.lead && message.request.lead.email) {
      //   winston.info("message.request.lead.email: " + message.request.lead.email);
      //   replyTo = replyTo + ", "+ message.request.lead.email;
      // }
      

      that.send({to:to, replyTo: replyTo, subject:`R: ${message.request ? message.request.subject : '-'}`, text:html }); //html:html
      that.send({to: config.bcc, replyTo: replyTo, subject: `R: ${message.request ? message.request.subject : '-'} - notification`, text:html});//html:html

    });
  }


/*
  sendEmailChannelTakingNotification(to, request, project, tokenQueryString) {

    var that = this;

    this.readTemplateFile('ticket-taking.txt', function(err, html) {
      // this.readTemplateFile('ticket.html', function(err, html) {


      var envTemplate = process.env.EMAIL_TICKET_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

      var replacements = {        
        request: request,
        project: project.toJSON(),
        tokenQueryString: tokenQueryString,
        baseScope: baseScope    
      };

      var html = template(replacements);
      winston.debug("html: " + html);

      let replyTo;
      if (request) {
        replyTo = request.request_id+"@"+that.replyToDomain;
        winston.info("replyTo: " + replyTo);
      }

      // if (message.request && message.request.lead && message.request.lead.email) {
      //   winston.info("message.request.lead.email: " + message.request.lead.email);
      //   replyTo = replyTo + ", "+ request.lead.email;
      // }
      

      that.send({to:to, replyTo: replyTo, subject:`R: ${request ? request.subject : '-'}`, text:html }); //html:html
      that.send({to: config.bcc, replyTo: replyTo, subject: `R: ${request ? request.subject : '-'} - notification`, text:html});//html:html

    });
  }
*/

  // ok
  sendPasswordResetRequestEmail(to, resetPswRequestId, userFirstname, userLastname) {

    var that = this;

    this.readTemplateFile('resetPassword.html', function(err, html) {


      var envTemplate = process.env.EMAIL_RESET_PASSWORD_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        resetPswRequestId: resetPswRequestId,
        userFirstname: userFirstname,
        userLastname: userLastname,
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send({to: to, subject: '[TileDesk] Password reset request', html:html});
      that.send({to:that.bcc, subject: '[TileDesk] Password reset request - notification', html:html });

    });
  }

  // ok
  sendYourPswHasBeenChangedEmail(to, userFirstname, userLastname) {

    var that = this;

    this.readTemplateFile('passwordChanged.html', function(err, html) {


      var envTemplate = process.env.EMAIL_PASSWORD_CHANGED_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        userFirstname: userFirstname,
        userLastname: userLastname,
        to: to,
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send({to: to, subject:'[TileDesk] Your password has been changed', html:html });
      that.send({to: that.bcc, subject: '[TileDesk] Your password has been changed - notification', html: html });

    });

  }


    // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT  ***
   */
  sendYouHaveBeenInvited(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserFirstname, invitedUserLastname, invitedUserRole) {

    var that = this;

    this.readTemplateFile('beenInvitedExistingUser.html', function(err, html) {


      var envTemplate = process.env.EMAIL_EXUSER_INVITED_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        currentUserFirstname: currentUserFirstname,
        currentUserLastname: currentUserLastname,
        projectName: projectName,
        id_project: id_project,
        invitedUserFirstname: invitedUserFirstname,
        invitedUserLastname: invitedUserLastname,
        invitedUserRole: invitedUserRole,
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send({to:to, subject: `[TileDesk] You have been invited to the '${projectName}' project`, html:html});
      that.send({to: that.bcc, subject: `[TileDesk] You have been invited to the '${projectName}' project - notification`, html: html});

    });
  }

    // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT (USER NOT REGISTERED) ***
   */
  sendInvitationEmail_UserNotRegistered(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserRole, pendinginvitationid) {

   
    var that = this;

    this.readTemplateFile('beenInvitedNewUser.html', function(err, html) {


      var envTemplate = process.env.EMAIL_NEWUSER_INVITED_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        currentUserFirstname: currentUserFirstname,
        currentUserLastname: currentUserLastname,
        projectName: projectName,
        id_project: id_project,
        invitedUserRole: invitedUserRole,
        pendinginvitationid: pendinginvitationid,
        baseScope: baseScope    
      };

      var html = template(replacements);

      that.send({to:to, subject: `[TileDesk] You have been invited to the '${projectName}' project`, html:html });
      that.send({to: that.bcc, subject: `[TileDesk] You have been invited to the '${projectName}' project - notification`, html: html});

    });
  }

  // ok
  sendVerifyEmailAddress(to, savedUser) {

   
    var that = this;

    this.readTemplateFile('verify.html', function(err, html) {


      var envTemplate = process.env.EMAIL_VERIFY_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        savedUser: savedUser.toJSON(),      
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send({to: to, subject: `[TileDesk] Verify your email address`, html:html });
      that.send({to: that.bcc, subject: `[TileDesk] Verify your email address `+to + " - notification", html:html });

    });
  }







// ok

  sendRequestTranscript(to, messages, request) {

    var transcriptAsHtml = ""; //https://handlebarsjs.com/guide/expressions.html#html-escaping
    messages.forEach(message => {
      transcriptAsHtml = transcriptAsHtml + '['+ message.createdAt.toLocaleTimeString('en', { timeZone: 'UTC' }) +'] ' + message.senderFullname + ': ' + message.text + '<br>';
    });
    winston.debug("transcriptAsHtml: " + transcriptAsHtml);
    
   
      
    var that = this;

    this.readTemplateFile('sendTranscript.html', function(err, html) {


      var envTemplate = process.env.EMAIL_SEND_TRANSCRIPT_HTML_TEMPLATE;
       winston.debug("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

       winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        messages: messages,    
        request: request.toJSON(),  
        formattedCreatedAt: request.createdAt.toLocaleString('en', { timeZone: 'UTC' }),
        transcriptAsHtml: transcriptAsHtml,
        baseScope: baseScope    
      };

      var html = template(replacements);



      that.send({to:to, subject: '[TileDesk] Transcript', html:html});
      that.send({to: that.bcc, subject: '[TileDesk] Transcript - notification', html:html });


    });
}




}


var emailService = new EmailService();

module.exports = emailService;
