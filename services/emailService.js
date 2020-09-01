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


  readHTMLFile(templateName, callback) {
    fs.readFile(appRoot + '/template/email/'+templateName, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};


  getTransport() {


    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port, // defaults to 587 if is secure is false or 465 if true
      secure: this.secureEmail, 
      auth: {
        user: this.user,
        pass: this.emailPassword
      }
    });
    return transporter;
  }

  send(to, subject, html) {

    if (!this.enabled) {
      winston.info('EmailService is disabled. Not sending email');
      return 0;
    }

    let mailOptions = {
      from: this.from, // sender address
      to: to,
      // bcc: config.bcc,
      subject: subject, // Subject line
      //text: 'Hello world?', // plain text body
      html: html
    };
    winston.debug('mailOptions', mailOptions);

    // send mail with defined transport object
    this.getTransport().sendMail(mailOptions, (error, info) => {
      if (error) {
        return winston.error("Error sending email ", error);
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

    this.readHTMLFile('test.html', function(err, html) {

      var template = handlebars.compile(html);

      var replacements = {        
        user: {name: "andrea"},
        enabled: true   
      };

      var html = template(replacements);

      that.send(to, `TileDesk test email`, html);

      that.send(that.bcc, `TileDesk test email`, html);

    });
   

    
  }


// TODO externalize template

  sendNewAssignedRequestNotification(to, savedRequest, project) {      

    var that = this;

    this.readHTMLFile('assignedRequest.html', function(err, html) {


      var envTemplate = process.env.EMAIL_ASSIGN_REQUEST_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;

      var replacements = {        
        savedRequest: savedRequest.toJSON(),
        project: project.toJSON(),
        baseScope: baseScope    
      };

      winston.debug("replacements ", replacements);

      var html = template(replacements);
      winston.debug("html after: " + html);


      that.send(to, `[TileDesk ${project ? project.name : '-'}] New Assigned Request`, html);

      that.send(that.bcc, `[TileDesk ${project ? project.name : '-'}] New Assigned Request ${to}`, html);

    });
    
  }

  sendNewPooledRequestNotification(to, savedRequest, project) {

    var that = this;

    this.readHTMLFile('pooledRequest.html', function(err, html) {


      var envTemplate = process.env.EMAIL_POOLED_REQUEST_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.debug("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        savedRequest: savedRequest.toJSON(),
        project: project.toJSON(),
        baseScope: baseScope    
      };

      var html = template(replacements);


      that.send(to, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);
    // this.send(config.bcc, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);

    });
  }

  /**
   *! *** EMAIL: PASSWORD RESET REQUEST ***
   */
  sendPasswordResetRequestEmail(to, resetPswRequestId, userFirstname, userLastname) {

    var that = this;

    this.readHTMLFile('resetPassword.html', function(err, html) {


      var envTemplate = process.env.EMAIL_RESET_PASSWORD_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

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


      that.send(to, '[TileDesk] Password reset request', html);
      that.send(this.bcc, '[TileDesk] Password reset request', html);

    });
  }

  /**
   * ********  EMAIL: YOUR PASSWORD HAS BEEN CHANGED ********
   */
  sendYourPswHasBeenChangedEmail(to, userFirstname, userLastname) {

    var that = this;

    this.readHTMLFile('passwordChanged.html', function(err, html) {


      var envTemplate = process.env.EMAIL_PASSWORD_CHANGED_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

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


    this.send(to, '[TileDesk] Your password has been changed', html);
    this.send(this.bcc, '[TileDesk] Your password has been changed', html);

    });

  }


  
  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT  ***
   */
  sendYouHaveBeenInvited(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserFirstname, invitedUserLastname, invitedUserRole) {

    var that = this;

    this.readHTMLFile('beenInvitedExistingUser.html', function(err, html) {


      var envTemplate = process.env.EMAIL_BEEN_INVITED_EXUSER_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

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


      this.send(to, `[TileDesk] You have been invited to the '${projectName}' project`, html);
      this.send(this.bcc, `[TileDesk] You have been invited to the '${projectName}' project`, html);

    });
  }

  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT (USER NOT REGISTERED) ***
   */
  sendInvitationEmail_UserNotRegistered(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserRole, pendinginvitationid) {

   
    var that = this;

    this.readHTMLFile('beenInvitedNewUser.html', function(err, html) {


      var envTemplate = process.env.EMAIL_BEEN_INVITED_NEWUSER_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

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

      this.send(to, `[TileDesk] You have been invited to the '${projectName}' project`, html);
      this.send(this.bcc, `[TileDesk] You have been invited to the '${projectName}' project`, html);

    });
  }

  sendVerifyEmailAddress(to, savedUser) {

   
    var that = this;

    this.readHTMLFile('verify.html', function(err, html) {


      var envTemplate = process.env.EMAIL_VERIFY_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        savedUser: savedUser.toJSON(),      
        baseScope: baseScope    
      };

      var html = template(replacements);


      this.send(to, `[TileDesk] Verify your email address`, html);
      this.send(this.bcc, `[TileDesk] Verify your email address `+to, html);

    });
  }









  sendRequestTranscript(to, messages, request) {

    var transcriptAsHtml = "";
    messages.forEach(message => {
      transcriptAsHtml = transcriptAsHtml + '['+ message.createdAt.toLocaleTimeString('it', { timeZone: 'UTC' }) +'] ' + message.senderFullname + ': ' + message.text + '<br>';
    });

   
      
    var that = this;

    this.readHTMLFile('sendTranscript.html', function(err, html) {


      var envTemplate = process.env.EMAIL_SEND_TRANSCRIPT_HTML_TEMPLATE;
      winston.info("envTemplate: " + envTemplate);

      if (envTemplate) {
          html = envTemplate;
      }

      winston.info("html: " + html);

      var template = handlebars.compile(html);

      var baseScope = JSON.parse(JSON.stringify(that));
      delete baseScope.emailPassword;


      var replacements = {        
        messages: messages.toJSON(),    
        request: request.toJSON(),  
        baseScope: baseScope    
      };

      var html = template(replacements);



    this.send(to, '[TileDesk] Transcript', html);
    this.send(this.bcc, '[TileDesk] Transcript', html);


    });
}




}


var emailService = new EmailService();

module.exports = emailService;
