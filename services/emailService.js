'use strict';

const nodemailer = require('nodemailer');
var config = require('../config/email');
var winston = require('../config/winston');
var marked = require('marked');
var handlebars = require('handlebars');

handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// var options = {};
// handlebars.registerHelper('markdown', markdown(options));

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

// const X_REQUEST_ID_HEADER_KEY = "X-TILEDESK-REQUEST-ID";
// const X_TICKET_ID_HEADER_KEY = "X-TILEDESK-TICKET-ID";
// const X_PROJECT_ID_HEADER_KEY = "X-TILEDESK-PROJECT-ID";

const MESSAGE_ID_DOMAIN = "tiledesk.com";

class EmailService {

  constructor() {

    // controlla se è string da kuberntes nn funziona
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

    this.pass = process.env.EMAIL_PASSWORD;

    var maskedemailPassword;
    if (this.pass) {
      maskedemailPassword = MaskData.maskPhone(this.pass, maskOptions);
    }else {
      maskedemailPassword = this.pass;
    }

    winston.info('EmailService pass: ' + maskedemailPassword);

    this.host = process.env.EMAIL_HOST || config.host;
    winston.info('EmailService host: ' + this.host);

    this.secure  = process.env.EMAIL_SECURE || false;
    winston.info('EmailService secure: ' + this.secure);

    this.user  = process.env.EMAIL_USERNAME || config.username;
    winston.info('EmailService username: ' + this.user);

    this.port  = process.env.EMAIL_PORT;
    winston.info('EmailService port: ' + this.port);


    this.markdown = process.env.EMAIL_MARKDOWN || true;
    winston.info('EmailService markdown: '+ this.markdown);

    this.headers = {
      // "X-Mailer": "Tiledesk Mailer",
    }
    winston.info('EmailService headers: ' + JSON.stringify(this.headers));

  }

  readTemplate(templateName, settings) {
    var that = this;
    winston.debug('EmailService readTemplate: '+ templateName + '  ' + JSON.stringify(settings)); 
    
      if (settings && settings.email && settings.email.templates) {
       var templates = settings.email.templates;
       winston.debug('EmailService templates: ',templates); 
       var template = templates[templateName];
       winston.debug('EmailService template: '+template); 
        if (template) {
        // that.callback(template);
          return new Promise(function (resolve, reject) {
            return resolve(template);
          });
        }else {
          return that.readTemplateFile(templateName);
        }      
      } else {
        return that.readTemplateFile(templateName);
      } 
  }
  readTemplateFile(templateName) {
    // var that = this;
    return new Promise(function (resolve, reject) {
      fs.readFile(appRoot + '/template/email/'+templateName, {encoding: 'utf-8'}, function (err, html) {
          if (err) {
              winston.error('error readTemplateFile getting ', err);
              // callback(err);
              return reject(err);
          }
          else {
              // callback(null, html);
              return resolve(html);
          }
      }); 
    });
};


  getTransport(configEmail) {

    if (configEmail === undefined) {
      configEmail = {
        host: this.host,
        port: this.port, // defaults to 587 if is secure is false or 465 if true
        secure: this.secure,         
        user: this.user,
        pass: this.pass      
      }
      winston.debug("getTransport initialized with default");
    } else {
      winston.verbose("getTransport custom", configEmail);
    }

    winston.debug("getTransport configEmail: "+ JSON.stringify(configEmail));

    let transport = {
      host: configEmail.host,
      port: configEmail.port, // defaults to 587 if is secure is false or 465 if true
      secure: configEmail.secure, 
      auth: {
        user: configEmail.user,
        pass: configEmail.pass
      },


    };

    winston.debug("getTransport transport: ",transport);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport(transport);
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
      inReplyTo: mail.inReplyTo,
      references: mail.references,
      subject: mail.subject, // Subject line
      text: mail.text, // plain text body
      html: mail.html,

      headers: mail.headers || this.headers,
      
      messageId: mail.messageId,
      sender: mail.sender
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
      winston.verbose('Email sent: %s', {info: info, mailOptions: mailOptions});
      // Preview only available when sending through an Ethereal account
      // winston.debug('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }


  async sendTest(to) {      

    var that = this;

    var html = await this.readTemplateFile('test.html');

    var template = handlebars.compile(html);

    var replacements = {        
      user: {name: "andrea"},
      enabled: true   
    };

    var html = template(replacements);

    that.send({to:to, subject:`TileDesk test email`,html: html});

    //that.send(that.bcc, `TileDesk test email - notification`, html);



    
  }



  async sendNewAssignedRequestNotification(to, request, project) {      

    var that = this;

    //if the request came from rabbit mq?
    if (request.toJSON) {
      request = request.toJSON();
    }

    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('assignedRequest.html', project.settings);

    var envTemplate = process.env.EMAIL_ASSIGN_REQUEST_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

    winston.verbose("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    // passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email


    let msgText = request.first_text.replace(/[\n\r]/g, '<br>');

    if (this.markdown) {
      msgText = marked(msgText);
    }
    
    
    winston.verbose("msgText: " + msgText);

    var replacements = {        
      request: request,
      project: project,
      msgText: msgText,
      baseScope: baseScope,
      // tools: {marked:marked}    
    };

    winston.debug("replacements ", replacements);

    var html = template(replacements);
    winston.debug("html after: " + html);

  
    let messageId = "notification" + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (request) { 
      
        messageId = request.request_id + "+" + messageId;

        if (request.attributes && request.attributes.email_replyTo) {
        replyTo = request.attributes.email_replyTo;
        }         
      // if (request.ticket_id) {
      //   replyTo = "support+"+request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": request.request_id, "X-TILEDESK-TICKET-ID":request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }

    let inReplyTo;
    let references;
    if (request.attributes) {
      if (request.attributes.email_messageId) {
        inReplyTo = request.attributes.email_messageId;
        }
        if (request.attributes.email_references) {
        references = request.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }

    let subject = `[TileDesk ${project ? project.name : '-'}] New Assigned Chat`;

    if (request.subject) {
      subject = `[TileDesk ${project ? project.name : '-'}] ${request.subject}`;
    }

    if (request.ticket_id) {
      subject = `[Ticket #${request.ticket_id}] New Assigned Chat`;
    }
    
    if (request.ticket_id && request.subject) {
      subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }

    that.send({
      messageId: messageId,
      from:from, 
      to:to, 
      replyTo: replyTo,
      subject: subject, 
      html:html, 
      config: configEmail,
      headers:headers 
    });

    messageId =  "notification" + messageId;


    // togliere bcc 
    that.send({
      messageId: messageId,
      to: that.bcc, 
      replyTo: replyTo,
      subject: subject + ` ${to}  - notification`, 
      html:html,
      headers:headers 
    });

    
  }


  async sendNewAssignedAgentMessageEmailNotification(to, request, project, message) {      

    var that = this;

    //if the request came from rabbit mq?
    if (request.toJSON) {
      request = request.toJSON();
    }

    if (project.toJSON) {
      project = project.toJSON();
    }
    
    var html = await this.readTemplate('assignedEmailMessage.html', project.settings);


    var envTemplate = process.env.EMAIL_ASSIGN_MESSAGE_EMAIL_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    // passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email

  let msgText = message.text.replace(/[\n\r]/g, '<br>');

  if (this.markdown) {
    msgText = marked(msgText);
  }

  winston.debug("msgText: " + msgText);

    var replacements = {        
      request: request,
      project: project,
      message: message,
      msgText: msgText,
      baseScope: baseScope    
    };

    winston.debug("replacements ", replacements);

    var html = template(replacements);
    winston.debug("html after: " + html);


    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (message.request) { 
      
        messageId = message.request.request_id + "+" + messageId;

        if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
        }         
      // if (message.request.ticket_id) {
      //   replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = message.request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID":message.request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }

    let inReplyTo;
    let references;
    if (message.attributes) {
      if (message.attributes.email_messageId) {
        inReplyTo = message.attributes.email_messageId;
        }
        if (message.attributes.email_references) {
        references = message.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }


    let subject = `[TileDesk ${project ? project.name : '-'}] New message`;

    if (request.subject) {
      subject = `[TileDesk ${project ? project.name : '-'}] ${request.subject}`;
    }
    if (request.ticket_id) {
      subject = `[Ticket #${request.ticket_id}] New message`;
    }
    
    if (request.ticket_id && request.subject) {
      subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }



    that.send({
      messageId: messageId,
      from:from, 
      to:to, 
      replyTo: replyTo,
      // inReplyTo: inReplyTo,???
      // references: references,??
      subject: subject,
      html:html, 
      config: configEmail,        
      headers:headers 
    });


  
    messageId =  "notification" + messageId;

    that.send({
      messageId: messageId,
      to: that.bcc, 
      replyTo: replyTo,
      subject: subject + ` - notification`, 
      html:html,
      headers:headers 
    });

    
  }

  
  async sendNewPooledRequestNotification(to, request, project) {

    //if the request came from rabbit mq?
    if (request.toJSON) {
      request = request.toJSON();
    }

    if (project.toJSON) {
      project = project.toJSON();
    }

    var that = this;

    var html = await this.readTemplate('pooledRequest.html', project.settings);

    var envTemplate = process.env.EMAIL_POOLED_REQUEST_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

// passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email

    let msgText = request.first_text.replace(/[\n\r]/g, '<br>');

    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.verbose("msgText: " + msgText);

    var replacements = {        
      request: request,
      project: project,
      msgText: msgText,
      baseScope: baseScope    
    };
  
    var html = template(replacements);

    
    let messageId = "notification-pooled" + new Date().getTime() + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (request) { 
      
        messageId = request.request_id + "+" + messageId;

        if (request.attributes && request.attributes.email_replyTo) {
        replyTo = request.attributes.email_replyTo;
        }         
      // if (request.ticket_id) {
      //   replyTo = "support+"+request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": request.request_id, "X-TILEDESK-TICKET-ID":request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }

    let inReplyTo;
    let references;
    if (request.attributes) {
      if (request.attributes.email_messageId) {
        inReplyTo = request.attributes.email_messageId;
        }
        if (request.attributes.email_references) {
        references = request.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }

    let subject = `[TileDesk ${project ? project.name : '-'}] New Pooled Chat`;

    if (request.subject) {
      subject = `[TileDesk ${project ? project.name : '-'}] ${request.subject}`;
    }
    if (request.ticket_id) {
      subject = `[Ticket #${request.ticket_id}] New Pooled Chat`;
    }
    
    if (request.ticket_id && request.subject) {
      subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }



    that.send({
      messageId: messageId,
      from:from, 
      to: to, 
      replyTo: replyTo,
      subject: subject, 
      html:html, 
      config:configEmail,
      headers:headers 
    });
  // this.send(that.bcc, `[TileDesk ${project ? project.name : '-'}] New Pooled Request`, html);
  
  }





  async sendNewPooledMessageEmailNotification(to, request, project, message) {

    var that = this;

    
    //if the request came from rabbit mq?
    if (request.toJSON) {
      request = request.toJSON();
    }

    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('pooledEmailMessage.html', project.settings);


    var envTemplate = process.env.EMAIL_POOLED_MESSAGE_EMAIL_HTML_TEMPLATE;
    winston.debug("envTemplate: " + envTemplate);


    if (envTemplate) {
        html = envTemplate;
    }

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    let msgText = message.text.replace(/[\n\r]/g, '<br>');

    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.verbose("msgText: " + msgText);

    // passa anche tutti i messages in modo da stampare tutto
// Stampa anche contact.email

    var replacements = {        
      request: request,
      project: project,
      message: message,
      msgText: msgText,
      baseScope: baseScope    
    };

    winston.debug("replacements ", replacements);

    var html = template(replacements);
    winston.debug("html after: " + html);



    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (message.request) { 
      
        messageId = message.request.request_id + "+" + messageId;

        if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
        }         
      // if (message.request.ticket_id) {
      //   replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = message.request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID":message.request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }

    let inReplyTo;
    let references;
    if (message.attributes) {
      if (message.attributes.email_messageId) {
        inReplyTo = message.attributes.email_messageId;
        }
        if (message.attributes.email_references) {
        references = message.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }


    let subject = `[TileDesk ${project ? project.name : '-'}] New Message`;

    if (request.subject) {
      subject = `[TileDesk ${project ? project.name : '-'}] ${request.subject}`;
    }
    if (request.ticket_id) {
      subject = `[Ticket #${request.ticket_id}] New Message`;
    }
    
    if (request.ticket_id && request.subject) {
      subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }


    that.send({
      messageId: messageId,
      from:from, 
      to:to, 
      replyTo: replyTo,
      // inReplyTo: inReplyTo,???
      // references: references,??
      subject: subject,
      html:html, 
      config: configEmail,        
      headers:headers 
    });


  
    // messageId =  "notification" + messageId;

    // that.send({
    //   messageId: messageId,
    //   to: that.bcc, 
    //   replyTo: replyTo,
    //   subject: `[TileDesk ${project ? project.name : '-'}] - ${request.subject ? request.subject : 'New message'} - notification`, 
    //   html:html,
    //   headers:headers 
    // });

    
  }


  async sendNewMessageNotification(to, message, project, tokenQueryString, sourcePage) {

    var that = this;

    //if the request came from rabbit mq?
   
    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('newMessage.html', project.settings);



    var envTemplate = process.env.EMAIL_NEW_MESSAGE_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    let msgText = message.text.replace(/[\n\r]/g, '<br>');

    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.verbose("msgText: " + msgText);

    var replacements = {        
      message: message,
      project: project,
      msgText:msgText, 
      seamlessPage: sourcePage,
      tokenQueryString: tokenQueryString,
      baseScope: baseScope    
    };

    var html = template(replacements);
    winston.debug("html: " + html);


    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (message.request) { 
      
        messageId = message.request.request_id + "+" + messageId;

        if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
        }         
      // if (message.request.ticket_id) {
      //   replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = message.request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID":message.request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }

    let inReplyTo;
    let references;
    if (message.attributes) {
      if (message.attributes.email_messageId) {
        inReplyTo = message.attributes.email_messageId;
        }
        if (message.attributes.email_references) {
        references = message.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }


    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      from:from, 
      to:to, 
      replyTo: replyTo, 
      inReplyTo: inReplyTo,
      references: references,
      subject:`[TileDesk ${project ? project.name : '-'}] New Offline Message`, 
      html:html, 
      config:configEmail, 
      headers: headers
    });

    messageId =  "notification" + messageId;

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      to: that.bcc, 
      replyTo: replyTo,
      inReplyTo: inReplyTo, 
      references: references,
      subject: `[TileDesk ${project ? project.name : '-'}] New Offline Message - notification`, 
      html:html, 
      headers: headers
    });

  }


  
  async sendEmailChannelNotification(to, message, project, tokenQueryString, sourcePage) {

    var that = this;


    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('ticket.html', project.settings);
    // this.readTemplateFile('ticket.txt', function(err, html) {


    var envTemplate = process.env.EMAIL_TICKET_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    let msgText = message.text.replace(/[\n\r]/g, '<br>');

    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);

    var replacements = {        
      message: message,
      project: project,
      seamlessPage: sourcePage,
      msgText: msgText,
      tokenQueryString: tokenQueryString,
      baseScope: baseScope    
    };

    var html = template(replacements);
    winston.debug("html: " + html);

    
  
    
    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    let headers;
    if (message.request) { 
      
        messageId = message.request.request_id + "+" + messageId;

        if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
        }
      // if (message.request.ticket_id) {
      //   replyTo = "support+"+message.request.ticket_id+"@"+that.replyToDomain;
      // } else {
      //   replyTo = message.request.request_id+"@"+that.replyToDomain;
      // }
      
      headers = {"X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID":message.request.ticket_id };

      winston.verbose("messageId: " + messageId);
      winston.verbose("replyTo: " + replyTo);
      winston.verbose("email headers", headers);
    }
    

    let inReplyTo;
    let references;
    if (message.attributes) {

      // per email touching manca
      if (message.attributes.email_messageId) {
        inReplyTo = message.attributes.email_messageId;
        }
        if (message.attributes.email_references) {
        references = message.attributes.email_references;
        }
    }
    winston.verbose("email inReplyTo: "+ inReplyTo);
    winston.verbose("email references: "+ references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.verbose("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.verbose("custom from email setting found: "+ from);
      }
    }


    // if (message.request && message.request.lead && message.request.lead.email) {
    //   winston.info("message.request.lead.email: " + message.request.lead.email);
    //   replyTo = replyTo + ", "+ message.request.lead.email;
    // }
    
    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      from:from, 
      to:to, 
      replyTo: replyTo, 
      inReplyTo: inReplyTo,
      references: references,
      // subject:`${message.request ? message.request.subject : '-'}`, 
      subject:`R: ${message.request ? message.request.subject : '-'}`,  //gmail uses subject
      text:html, 
      html:html,
      config:configEmail, 
      headers:headers 
    }); 
    
    messageId =  "notification" + messageId;

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      to: that.bcc, 
      replyTo: replyTo, 
      inReplyTo: inReplyTo,
      references: references,
      // subject: `${message.request ? message.request.subject : '-'} - notification`, 
      subject: `R: ${message.request ? message.request.subject : '-'} - notification`, 
      text:html, 
      html:html,
      headers:headers
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
      delete baseScope.pass;

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
      that.send({to: that.bcc, replyTo: replyTo, subject: `R: ${request ? request.subject : '-'} - notification`, text:html});//html:html

    });
  }
*/

  // ok
  async sendPasswordResetRequestEmail(to, resetPswRequestId, userFirstname, userLastname) {

    var that = this;

    var html = await this.readTemplate('resetPassword.html', project.settings);


    var envTemplate = process.env.EMAIL_RESET_PASSWORD_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    var replacements = {        
      resetPswRequestId: resetPswRequestId,
      userFirstname: userFirstname,
      userLastname: userLastname,
      baseScope: baseScope    
    };

    var html = template(replacements);


    that.send({to: to, subject: '[TileDesk] Password reset request', html:html});
    that.send({to:that.bcc, subject: '[TileDesk] Password reset request - notification', html:html });

  }

  // ok
  async sendYourPswHasBeenChangedEmail(to, userFirstname, userLastname) {

    var that = this;

    var html = await this.readTemplateFile('passwordChanged.html');


    var envTemplate = process.env.EMAIL_PASSWORD_CHANGED_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    var replacements = {        
      userFirstname: userFirstname,
      userLastname: userLastname,
      to: to,
      baseScope: baseScope    
    };

    var html = template(replacements);


    that.send({to: to, subject:'[TileDesk] Your password has been changed', html:html });
    that.send({to: that.bcc, subject: '[TileDesk] Your password has been changed - notification', html: html });

  }


    // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT  ***
   */
   async sendYouHaveBeenInvited(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserFirstname, invitedUserLastname, invitedUserRole) {

    var that = this;

    var html = await this.readTemplateFile('passwordChanged.html');

    var envTemplate = process.env.EMAIL_EXUSER_INVITED_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


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
  }

    // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT (USER NOT REGISTERED) ***
   */
   async sendInvitationEmail_UserNotRegistered(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserRole, pendinginvitationid) {

   
    var that = this;

    var html = await this.readTemplateFile('passwordChanged.html');

    var envTemplate = process.env.EMAIL_NEWUSER_INVITED_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


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

  }

  // ok
  async sendVerifyEmailAddress(to, savedUser) {

   
    var that = this;

    if (savedUser.toJSON) {
      savedUser = savedUser.toJSON();
    }
    var html = await this.readTemplateFile('verify.html');

    var envTemplate = process.env.EMAIL_VERIFY_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    var replacements = {        
      savedUser: savedUser,      
      baseScope: baseScope    
    };

    var html = template(replacements);


    that.send({to: to, subject: `[TileDesk] Verify your email address`, html:html });
    that.send({to: that.bcc, subject: `[TileDesk] Verify your email address `+to + " - notification", html:html });

  }







// ok

async sendRequestTranscript(to, messages, request, project) {


     //if the request came from rabbit mq?
     if (request.toJSON) {
      request = request.toJSON();
    }

    // if (project.toJSON) {
    //   project = project.toJSON();
    // }

    var transcriptAsHtml = ""; //https://handlebarsjs.com/guide/expressions.html#html-escaping
    messages.forEach(message => {
      transcriptAsHtml = transcriptAsHtml + '['+ message.createdAt.toLocaleTimeString('en', { timeZone: 'UTC' }) +'] ' + message.senderFullname + ': ' + message.text + '<br>';
    });
    winston.debug("transcriptAsHtml: " + transcriptAsHtml);
    
   
      
    var that = this;

    var html = await this.readTemplate('sendTranscript.html', project.settings);

    var envTemplate = process.env.EMAIL_SEND_TRANSCRIPT_HTML_TEMPLATE;
      winston.debug("envTemplate: " + envTemplate);

    if (envTemplate) {
        html = envTemplate;
    }

      winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    var replacements = {        
      messages: messages,    
      request: request,  
      formattedCreatedAt: request.createdAt.toLocaleString('en', { timeZone: 'UTC' }),
      transcriptAsHtml: transcriptAsHtml,
      baseScope: baseScope    
    };

    var html = template(replacements);

    let configEmail;
    if (project && project.settings && project.settings.email && project.settings.email.config) {
      configEmail = project.settings.email.config;
      winston.verbose("custom email setting found: ", configEmail);
    }

    that.send({to:to, subject: '[TileDesk] Transcript', html:html, config: configEmail});
    that.send({to: that.bcc, subject: '[TileDesk] Transcript - notification', html:html });

}




}


var emailService = new EmailService();

//emailService.sendTest("al@f21.it");

module.exports = emailService;
