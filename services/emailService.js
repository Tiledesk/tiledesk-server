'use strict';

const nodemailer = require('nodemailer');
var config = require('../config/email');
var configGlobal = require('../config/global');
var winston = require('../config/winston');
var marked = require('marked');
var handlebars = require('handlebars');
var encode = require('html-entities').encode;
const emailEvent = require('../event/emailEvent');

handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper('dateFormat', require('handlebars-dateformat'));


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
  maskWith: "*",
  // If the starting 'n' digits needs to be unmasked
  // Default value is 4
  unmaskedStartDigits: 3, //Should be positive Integer
  //If the ending 'n' digits needs to be unmasked
  // Default value is 1
  unmaskedEndDigits: 3 // Should be positive Integer
};

// const X_REQUEST_ID_HEADER_KEY = "X-TILEDESK-REQUEST-ID";
// const X_TICKET_ID_HEADER_KEY = "X-TILEDESK-TICKET-ID";
// const X_PROJECT_ID_HEADER_KEY = "X-TILEDESK-PROJECT-ID";

const MESSAGE_ID_DOMAIN = "tiledesk.com";

// const hcustomization = require('../utils/hcustomization');

class EmailService {

  constructor() {

    this.enabled = false;
    if (process.env.EMAIL_ENABLED === "true" || process.env.EMAIL_ENABLED === true) {
      this.enabled = true;
    }

    winston.info('EmailService enabled: ' + this.enabled);

    this.baseUrl = process.env.EMAIL_BASEURL || config.baseUrl;
    winston.info('EmailService baseUrl: ' + this.baseUrl);

    this.apiUrl = process.env.API_URL || configGlobal.apiUrl;
    winston.info('EmailService apiUrl: ' + this.apiUrl);

    this.from = process.env.EMAIL_FROM_ADDRESS || config.from;
    winston.info('EmailService from email: ' + this.from);

    this.bcc = process.env.EMAIL_BCC || config.bcc;
    winston.info('EmailService bcc address: ' + this.bcc);

    this.replyEnabled = config.replyEnabled;
    if (process.env.EMAIL_REPLY_ENABLED === "true" || process.env.EMAIL_REPLY_ENABLED === true) {
      this.replyEnabled = true;
    }
    winston.info('EmailService replyEnabled : ' + this.replyEnabled);

    // this is used as fixed reply to url, but this is unused we always return support-group-dynamic
    this.replyTo = process.env.EMAIL_REPLY_TO || config.replyTo;
    winston.info('EmailService replyTo address: ' + this.replyTo);

    this.inboundDomain = process.env.EMAIL_INBOUND_DOMAIN || config.inboundDomain;
    winston.info('EmailService inboundDomain : ' + this.inboundDomain);

    this.inboundDomainDomainWithAt = "@" + this.inboundDomain;
    winston.verbose('EmailService inboundDomainDomainWithAt : ' + this.inboundDomainDomainWithAt);

    this.pass = process.env.EMAIL_PASSWORD;

    var maskedemailPassword;
    if (this.pass) {
      maskedemailPassword = MaskData.maskPhone(this.pass, maskOptions);
    } else {
      maskedemailPassword = this.pass;
    }

    winston.info('EmailService pass: ' + maskedemailPassword);

    this.host = process.env.EMAIL_HOST || config.host;
    winston.info('EmailService host: ' + this.host);

    this.secure = false;
    if (process.env.EMAIL_SECURE == "true" || process.env.EMAIL_SECURE == true) {
      this.secure = true;
    }
    // this.secure  = process.env.EMAIL_SECURE || false;     
    winston.info('EmailService secure: ' + this.secure);

    this.user = process.env.EMAIL_USERNAME || config.username;
    winston.info('EmailService username: ' + this.user);

    this.port = process.env.EMAIL_PORT;  //default is 587
    winston.info('EmailService port: ' + this.port);


    this.markdown = true;
    if (process.env.EMAIL_MARKDOWN == "false" || process.env.EMAIL_MARKDOWN == false) {
      this.markdown = false;
    }
    // this.markdown = process.env.EMAIL_MARKDOWN || true;
    winston.info('EmailService markdown: ' + this.markdown);

    this.headers = {
      // "X-Mailer": "Tiledesk Mailer",
    }
    winston.info('EmailService headers: ' + JSON.stringify(this.headers));

    this.ccEnabled = false //cc creates loop when you send an email with cc: support@tiledesk.com -> Tiledesk generates an email with ticket id with in cc support@tiledesk.com that loop 

    if (process.env.EMAIL_CC_ENABLED === "true" || process.env.EMAIL_CC_ENABLED === true) {
      this.ccEnabled = true;
    }
    winston.info('EmailService ccEnabled: ' + this.ccEnabled);

    this.brand_name = "Tiledesk"
    if (process.env.BRAND_NAME) {
      this.brand_name = process.env.BRAND_NAME;
    }

  }

  readTemplate(templateName, settings, environmentVariableKey) {
    // aggiunsta questo
    var that = this;
    winston.debug('EmailService readTemplate: ' + templateName + ' environmentVariableKey:  ' + environmentVariableKey + ' setting ' + JSON.stringify(settings));

    if (settings && settings.email && settings.email.templates) {

      var templates = settings.email.templates;
      winston.debug('EmailService templates: ', templates);

      var templateDbName = templateName.replace(".html", "");
      winston.debug('EmailService templateDbName: ' + templateDbName);


      var template = templates[templateDbName];
      winston.debug('EmailService template: ' + template);

      if (template) {
        // that.callback(template);
        return new Promise(function (resolve, reject) {
          return resolve(template);
        });
      } 
      else {
        var envTemplate = process.env[environmentVariableKey];
        winston.debug('EmailService envTemplate: ' + envTemplate);

        if (envTemplate) {
          winston.debug('EmailService return envTemplate: ' + envTemplate);

          return envTemplate;
        } else {
          winston.debug('EmailService return file: ' + templateName);

          return that.readTemplateFile(templateName);
        }  
      }
      
      // else {
      //   return that.readTemplateFile(templateName);
      // }
    } else {
      var envTemplate = process.env[environmentVariableKey];
      winston.debug('EmailService envTemplate: ' + envTemplate);

      if (envTemplate) {
        winston.debug('EmailService return envTemplate: ' + envTemplate);

        return envTemplate;
      } else {
        winston.debug('EmailService return file: ' + templateName);

        return that.readTemplateFile(templateName);
      }
      
    }
  }
  readTemplateFile(templateName) {
    // var that = this;
    return new Promise(function (resolve, reject) {
      fs.readFile(appRoot + '/template/email/' + templateName, { encoding: 'utf-8' }, function (err, html) {
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

    winston.debug("getTransport configEmail: " + JSON.stringify(configEmail));

    let transport = {
      host: configEmail.host,
      port: configEmail.port, // defaults to 587 if is secure is false or 465 if true
      secure: configEmail.secure,
      auth: {
        user: configEmail.user,
        pass: configEmail.pass
      },
      // secureConnection: false,
      // tls:{
      //   ciphers:'SSLv3'
      // },

      // openssl genrsa -out dkim_private.pem 2048   
      // openssl rsa -in dkim_private.pem -pubout -outform der 2>/dev/null | openssl base64 -A
      // -> 
      // v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAunT2EopDAYnHwAOHd33KhlzjUXJfhmA+fK+cG85i9Pm33oyv1NoGrOynsni0PO6j7oRxxHqs6EMDOw4I/Q0C7aWn20oBomJZehTOkCV2xpuPKESiRktCe/MIZqbkRdypis4jSkFfFFkBHwgkAg5tb11E9elJap0ed/lN5/XlpGedqoypKxp+nEabgYO5mBMMNKRvbHx0eQttRYyIaNkTuMbAaqs4y3TkHOpGvZTJsvUonVMGAstSCfUmXnjF38aKpgyTausTSsxHbaxh3ieUB4ex+svnvsJ4Uh5Skklr+bxLVEHeJN55rxmV67ytLg5XCRWqdKIcJHFvSlm2YwJfcwIDAQABMacAL
      // testdkim._domainkey.tiledesk.com. 86400 IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAunT2EopDAYnHwAOHd33KhlzjUXJfhmA+fK+cG85i9Pm33oyv1NoGrOynsni0PO6j7oRxxHqs6EMDOw4I/Q0C7aWn20oBomJZehTOkCV2xpuPKESiRktCe/MIZqbkRdypis4jSkFfFFkBHwgkAg5tb11E9elJap0ed/lN5/XlpGedqoypKxp+nEabgYO5mBMMNKRvbHx0eQttRYyIaNkTuMbAaqs4y3TkHOpGvZTJsvUonVMGAstSCfUmXnjF38aKpgyTausTSsxHbaxh3ieUB4ex+svnvsJ4Uh5Skklr+bxLVEHeJN55rxmV67ytLg5XCRWqdKIcJHFvSlm2YwJfcwIDAQABMacAL"

      // dkim: {
      //   domainName: "example.com",
      //   keySelector: "2017",
      //   privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...",
      //   cacheDir: "/tmp",
      //   cacheTreshold: 100 * 1024
      // }
    };

    winston.debug("getTransport transport: ", transport);

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport(transport);
    return transporter;
  }

  // @deprecated
  // send(to, subject, html) {
  //   return this.sendMail({to:to, subject:subject, html:html});
  // }

  async send(mail, quoteEnabled, project, quoteManager) {

    if (!this.enabled) {
      winston.info('EmailService is disabled. Not sending email');
      return 0;
    }
    if (process.env.NODE_ENV == 'test') {
      return winston.warn("EmailService not sending email for testing");
    }

    let payload = { project: project }
    if (quoteEnabled && quoteEnabled === true) {
      mail.createdAt = new Date();
      payload.email = mail;

      if (quoteManager) {
        let result = await quoteManager.checkQuote(project, mail, 'email');
        if (result === false) {
          // Stop
          winston.verbose('Unable to send email - Quota exceeded')
          return false;
        }
      }
    }


    let mailOptions = {
      from: mail.from || this.from, // sender address
      to: mail.to,
      cc: mail.cc,
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
    winston.debug(' mail.config', mail.config);

    if (!mail.to) {
      // return winston.warn("EmailService send method. to field is not defined", mailOptions);
      return winston.warn("EmailService send method. to field is not defined");
    }

    // send mail with defined transport object
    this.getTransport(mail.config).sendMail(mailOptions, (error, info) => {
      if (error) {
        if (mail.callback) {
          mail.callback(error, { info: info });
        }
        return winston.error("Error sending email ", { error: error, mailConfig: mail.config, mailOptions: mailOptions });
      }
      winston.verbose('Email sent:', { info: info });
      winston.debug('Email sent:', { info: info, mailOptions: mailOptions });

      if (quoteEnabled && quoteEnabled === true) {
        emailEvent.emit('email.send.quote', payload);
        winston.verbose("email.send.quote event emitted");
      }

      if (mail.callback) {
        mail.callback(error, { info: info });
      }

      // Preview only available when sending through an Ethereal account
      // winston.debug('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  }


  async sendTest(to, configEmail, callback) {

    var that = this;

    // var html = await this.readTemplate('test.html', { "email": { "templates": { test: "123" } } }, "EMAIL_TEST_HTML_TEMPLATE");
    var html = await this.readTemplate('test.html', undefined, "EMAIL_TEST_HTML_TEMPLATE");

    var template = handlebars.compile(html);

    var replacements = {
    };

    var html = template(replacements);

    return that.send({ to: to, subject: `${this.brand_name} test email`, config: configEmail, html: html, callback: callback });

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

    var html = await this.readTemplate('assignedRequest.html', project.settings, "EMAIL_ASSIGN_REQUEST_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    // passa anche tutti i messages in modo da stampare tutto
    // Stampa anche contact.email


    let msgText = request.first_text;//.replace(/[\n\r]/g, '<br>');
    // winston.verbose("msgText: " + msgText);
    msgText = encode(msgText);
    // winston.verbose("msgText: " + msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }


    winston.debug("msgText: " + msgText);

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
    if (this.replyEnabled) { //fai anche per gli altri
      replyTo = request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (request) {

      messageId = request.request_id + "+" + messageId;

      if (request.attributes && request.attributes.email_replyTo) {
        replyTo = request.attributes.email_replyTo;
      }

      headers = {
        "X-TILEDESK-PROJECT-ID": project._id,
        "X-TILEDESK-REQUEST-ID": request.request_id,
        "X-TILEDESK-TICKET-ID": request.ticket_id,
      };

      winston.debug("messageId: " + messageId);
      winston.debug("replyTo: " + replyTo);
      winston.debug("email headers", headers);
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
    winston.debug("email inReplyTo: " + inReplyTo);
    winston.debug("email references: " + references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }

    // troncare nome utnete e nome progetto a max 10 caratteri
    // cambiare in [Nicky:Dashboard Support] Assigned Chat
    // serve per aggiornare native... fai aggiornamento 

    let subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] New Assigned Chat`;

    if (request.subject) {
      subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] ${request.subject}`;
    }

    let subject = that.formatText("assignedRequestSubject", subjectDef, request, project.settings);


    // if (request.ticket_id) {
    //   subject = `[Ticket #${request.ticket_id}] New Assigned Chat`;
    // }

    // if (request.ticket_id && request.subject) {
    //   subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    // }

    that.send({
      messageId: messageId,
      from: from,
      to: to,
      replyTo: replyTo,
      subject: subject,
      html: html,
      config: configEmail,
      headers: headers
    });

    messageId = "notification" + messageId;


    // togliere bcc 
    that.send({
      messageId: messageId,
      to: that.bcc,
      replyTo: replyTo,
      subject: subject + ` ${to}  - notification`,
      html: html,
      headers: headers
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

    var html = await this.readTemplate('assignedEmailMessage.html', project.settings, "EMAIL_ASSIGN_MESSAGE_EMAIL_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    // passa anche tutti i messages in modo da stampare tutto
    // Stampa anche contact.email

    let msgText = message.text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
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
    if (this.replyEnabled) {
      replyTo = message.request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (message.request) {

      messageId = message.request.request_id + "+" + messageId;

      if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID": message.request.ticket_id };

      winston.debug("sendNewAssignedAgentMessageEmailNotification messageId: " + messageId);
      winston.debug("sendNewAssignedAgentMessageEmailNotification replyTo: " + replyTo);
      winston.debug("sendNewAssignedAgentMessageEmailNotification email headers", headers);
    }

    let inReplyTo;
    let references;
    if (message.request.attributes) {
      if (message.request.attributes.email_messageId) {
        inReplyTo = message.request.attributes.email_messageId;
      }
      if (message.request.attributes.email_references) {
        references = message.request.attributes.email_references;
      }
    }
    winston.debug("sendNewAssignedAgentMessageEmailNotification email inReplyTo: " + inReplyTo);
    winston.debug("sendNewAssignedAgentMessageEmailNotification email references: " + references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("sendNewAssignedAgentMessageEmailNotification custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("sendNewAssignedAgentMessageEmailNotification custom from email setting found: " + from);
      }
    }


    let subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] New message`;

    if (request.subject) {
      subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] ${request.subject}`;
    }
    if (request.ticket_id) {
      subjectDef = `[${this.brand_name} #${request.ticket_id}] New message`;
    }

    if (request.ticket_id && request.subject) {
      subjectDef = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }

    let subject = that.formatText("assignedEmailMessageSubject", subjectDef, request, project.settings);



    that.send({
      messageId: messageId,
      from: from,
      to: to,
      replyTo: replyTo,
      // inReplyTo: inReplyTo,???
      // references: references,??
      subject: subject,
      html: html,
      config: configEmail,
      headers: headers
    });



    messageId = "notification" + messageId;

    that.send({
      messageId: messageId,
      to: that.bcc,
      replyTo: replyTo,
      subject: subject + ` - notification`,
      html: html,
      headers: headers
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

    var html = await this.readTemplate('pooledRequest.html', project.settings, "EMAIL_POOLED_REQUEST_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    // passa anche tutti i messages in modo da stampare tutto
    // Stampa anche contact.email

    let msgText = request.first_text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);

    var replacements = {
      request: request,
      project: project,
      msgText: msgText,
      baseScope: baseScope
    };

    var html = template(replacements);


    let messageId = "notification-pooled" + new Date().getTime() + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    if (this.replyEnabled) {
      replyTo = request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (request) {

      messageId = request.request_id + "+" + messageId;

      if (request.attributes && request.attributes.email_replyTo) {
        replyTo = request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": request.request_id, "X-TILEDESK-TICKET-ID": request.ticket_id };

      winston.debug("sendNewPooledRequestNotification messageId: " + messageId);
      winston.debug("sendNewPooledRequestNotification replyTo: " + replyTo);
      winston.debug("sendNewPooledRequestNotification email headers", headers);
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
    winston.debug("sendNewPooledRequestNotification email inReplyTo: " + inReplyTo);
    winston.debug("sendNewPooledRequestNotification email references: " + references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("sendNewPooledRequestNotification custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("sendNewPooledRequestNotification custom from email setting found: " + from);
      }
    }

    let subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] New Pooled Chat`;

    if (request.subject) {
      subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] ${request.subject}`;
    }

    let subject = that.formatText("pooledRequestSubject", subjectDef, request, project.settings);


    // if (request.ticket_id) {
    //   subject = `[Ticket #${request.ticket_id}] New Pooled Chat`;
    // }

    // if (request.ticket_id && request.subject) {
    //   subject = `[Ticket #${request.ticket_id}] ${request.subject}`;
    // }



    that.send({
      messageId: messageId,
      from: from,
      to: to,
      replyTo: replyTo,
      subject: subject,
      html: html,
      config: configEmail,
      headers: headers
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

    var html = await this.readTemplate('pooledEmailMessage.html', project.settings, "EMAIL_POOLED_MESSAGE_EMAIL_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    let msgText = message.text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);

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
    if (this.replyEnabled) {
      replyTo = message.request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (message.request) {

      messageId = message.request.request_id + "+" + messageId;

      if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID": message.request.ticket_id };

      winston.debug("sendNewPooledMessageEmailNotification messageId: " + messageId);
      winston.debug("sendNewPooledMessageEmailNotification replyTo: " + replyTo);
      winston.debug("sendNewPooledMessageEmailNotification email headers", headers);
    }

    let inReplyTo;
    let references;
    if (message.request.attributes) {
      if (message.request.attributes.email_messageId) {
        inReplyTo = message.request.attributes.email_messageId;
      }
      if (message.request.attributes.email_references) {
        references = message.request.attributes.email_references;
      }
    }
    winston.debug("sendNewPooledMessageEmailNotification email inReplyTo: " + inReplyTo);
    winston.debug("sendNewPooledMessageEmailNotification email references: " + references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("sendNewPooledMessageEmailNotification custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("sendNewPooledMessageEmailNotification custom from email setting found: " + from);
      }
    }


    let subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] New Message`;

    if (request.subject) {
      subjectDef = `[${this.brand_name} ${project ? project.name : '-'}] ${request.subject}`;
    }
    if (request.ticket_id) {
      subjectDef = `[Ticket #${request.ticket_id}] New Message`;
    }

    if (request.ticket_id && request.subject) {
      subjectDef = `[Ticket #${request.ticket_id}] ${request.subject}`;
    }

    let subject = that.formatText("pooledEmailMessageSubject", subjectDef, request, project.settings);


    that.send({
      messageId: messageId,
      from: from,
      to: to,
      replyTo: replyTo,
      // inReplyTo: inReplyTo,???
      // references: references,??
      subject: subject,
      html: html,
      config: configEmail,
      headers: headers
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

    var html = await this.readTemplate('newMessage.html', project.settings, "EMAIL_NEW_MESSAGE_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    let msgText = message.text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);

    var replacements = {
      message: message,
      project: project,
      msgText: msgText,
      seamlessPage: sourcePage,
      tokenQueryString: tokenQueryString,
      baseScope: baseScope
    };

    var html = template(replacements);
    winston.debug("html: " + html);


    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    if (this.replyEnabled) {
      replyTo = message.request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (message.request) {

      messageId = message.request.request_id + "+" + messageId;

      if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID": message.request.ticket_id };

      winston.debug("messageId: " + messageId);
      winston.debug("replyTo: " + replyTo);
      winston.debug("email headers", headers);
    }

    let inReplyTo;
    let references;
    winston.debug("message.request.attributes", message.request.attributes);
    if (message.request.attributes) {
      if (message.request.attributes.email_messageId) {
        inReplyTo = message.request.attributes.email_messageId;
      }
      if (message.request.attributes.email_references) {
        references = message.request.attributes.email_references;
      }
    }
    winston.debug("email inReplyTo: " + inReplyTo);
    winston.debug("email references: " + references);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }


    let subject = that.formatText("newMessageSubject", `[${this.brand_name} ${project ? project.name : '-'}] New Offline Message`, message, project.settings);

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      from: from,
      to: to,
      replyTo: replyTo,
      inReplyTo: inReplyTo,
      references: references,
      subject: subject,    //TODO (anche per il cloud) aggiungere variabile env per cambiare i subjects
      html: html,
      config: configEmail,
      headers: headers
    });

    messageId = "notification" + messageId;

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      to: that.bcc,
      replyTo: replyTo,
      inReplyTo: inReplyTo,
      references: references,
      subject: `[${this.brand_name} ${project ? project.name : '-'}] New Offline Message - notification`,
      html: html,
      headers: headers
    });

  }



  async sendEmailChannelNotification(to, message, project, tokenQueryString, sourcePage) {

    var that = this;


    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('ticket.html', project.settings, "EMAIL_TICKET_HTML_TEMPLATE");
    // this.readTemplateFile('ticket.txt', function(err, html) {

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    let msgText = message.text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);
    winston.debug("baseScope: " + JSON.stringify(baseScope));


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
    if (this.replyEnabled) {
      replyTo = message.request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (message.request) {

      messageId = message.request.request_id + "+" + messageId;

      if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID": message.request.ticket_id };

      winston.debug("messageId: " + messageId);
      winston.debug("replyTo: " + replyTo);
      winston.debug("email headers", headers);
    }


    let inReplyTo;
    let references;
    let cc;
    let ccString;

    if (message.request && message.request.attributes) {
      winston.debug("email message.request.attributes: ", message.request.attributes);

      if (message.request.attributes.email_messageId) {
        inReplyTo = message.request.attributes.email_messageId;
      }
      if (message.request.attributes.email_references) {
        references = message.request.attributes.email_references;
      }

      if (that.ccEnabled == true) {
        if (message.request.attributes.email_cc) {
          cc = message.request.attributes.email_cc;
        }
        winston.debug("email message.request.attributes.email_ccStr: " + message.request.attributes.email_ccStr);
        if (message.request.attributes.email_ccStr != undefined) {
          ccString = message.request.attributes.email_ccStr;
          winston.debug("email set ccString");
        }
      }

    }
    winston.debug("email inReplyTo: " + inReplyTo);
    winston.debug("email references: " + references);
    winston.debug("email cc: ", cc);
    winston.debug("email ccString: " + ccString);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }

    //gmail uses subject
    let subject = that.formatText("ticketSubject", `R: ${message.request ? message.request.subject : '-'}`, message, project.settings);

    //ocf 
    //prod                                                      //pre
    // if (project._id =="6406e34727b57500120b1bd6" || project._id == "642c609f179910002cc56b3e") {
    //   subject = "Richiesta di supporto #" + message.request.ticket_id;
    //   if (message.request.subject) {
    //     subject = subject + " - " + message.request.subject;
    //   } 
    //   // console.log("subject",subject);
    // }

    // if (message.request && message.request.lead && message.request.lead.email) {
    //   winston.info("message.request.lead.email: " + message.request.lead.email);
    //   replyTo = replyTo + ", "+ message.request.lead.email;
    // }

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      from: from,
      to: to,
      cc: ccString,
      replyTo: replyTo,
      inReplyTo: inReplyTo,
      references: references,
      // subject:`${message.request ? message.request.subject : '-'}`, 
      subject: subject,
      text: html,
      html: html,
      config: configEmail,
      headers: headers
    });

    messageId = "notification" + messageId;

    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      to: that.bcc,
      replyTo: replyTo,
      inReplyTo: inReplyTo,
      references: references,
      // subject: `${message.request ? message.request.subject : '-'} - notification`, 
      subject: `R: ${message.request ? message.request.subject : '-'} - notification`,
      text: html,
      html: html,
      headers: headers
    });

  }











  async sendFollowerNotification(to, message, project) {

    var that = this;


    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('newMessageFollower.html', project.settings, "EMAIL_FOLLOWER_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    let msgText = message.text;//.replace(/[\n\r]/g, '<br>');
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);
    winston.debug("baseScope: " + JSON.stringify(baseScope));


    var replacements = {
      message: message,
      project: project,
      msgText: msgText,
      baseScope: baseScope
    };

    var html = template(replacements);
    winston.debug("html: " + html);

    const fs = require('fs');
    fs.writeFileSync('tem1111.html', html);



    let messageId = message._id + "@" + MESSAGE_ID_DOMAIN;

    let replyTo;
    if (this.replyEnabled) {
      replyTo = message.request.request_id + this.inboundDomainDomainWithAt;
    }

    let headers;
    if (message.request) {

      messageId = message.request.request_id + "+" + messageId;

      if (message.request.attributes && message.request.attributes.email_replyTo) {
        replyTo = message.request.attributes.email_replyTo;
      }

      headers = { "X-TILEDESK-PROJECT-ID": project._id, "X-TILEDESK-REQUEST-ID": message.request.request_id, "X-TILEDESK-TICKET-ID": message.request.ticket_id };

      winston.debug("messageId: " + messageId);
      winston.debug("replyTo: " + replyTo);
      winston.debug("email headers", headers);
    }


    let inReplyTo;
    let references;
    let cc;
    let ccString;

    if (message.request && message.request.attributes) {
      winston.debug("email message.request.attributes: ", message.request.attributes);

      if (message.request.attributes.email_messageId) {
        inReplyTo = message.request.attributes.email_messageId;
      }
      if (message.request.attributes.email_references) {
        references = message.request.attributes.email_references;
      }

      if (that.ccEnabled == true) {
        if (message.request.attributes.email_cc) {
          cc = message.request.attributes.email_cc;
        }
        winston.debug("email message.request.attributes.email_ccStr: " + message.request.attributes.email_ccStr);
        if (message.request.attributes.email_ccStr != undefined) {
          ccString = message.request.attributes.email_ccStr;
          winston.debug("email set ccString");
        }
      }
    }
    winston.debug("email inReplyTo: " + inReplyTo);
    winston.debug("email references: " + references);
    winston.debug("email cc: ", cc);
    winston.debug("email ccString: " + ccString);

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }


    let subject = that.formatText("newMessageFollowerSubject", `${message.request ? message.request.ticket_id : '-'}`, message, project.settings);



    that.send({
      messageId: messageId,
      // sender: message.senderFullname, //must be an email
      from: from,
      to: to,
      cc: ccString,
      replyTo: replyTo,
      inReplyTo: inReplyTo,
      references: references,
      // subject:`${message.request ? message.request.subject : '-'}`, 
      subject: subject,  //gmail uses subject
      text: html,
      html: html,
      config: configEmail,
      headers: headers
    });

    // // messageId =  "notification" + messageId;

    // // that.send({
    // //   messageId: messageId,
    // //   // sender: message.senderFullname, //must be an email
    // //   to: that.bcc, 
    // //   replyTo: replyTo, 
    // //   inReplyTo: inReplyTo,
    // //   references: references,
    // //   // subject: `${message.request ? message.request.subject : '-'} - notification`, 
    // //   subject: `${message.request ? message.request.subject : '-'} - notification`, 
    // //   text:html, 
    // //   html:html,
    // //   headers:headers
    // // });


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
  
  
        // if (message.request && message.request.lead && message.request.lead.email) {
        //   winston.info("message.request.lead.email: " + message.request.lead.email);
        //   replyTo = replyTo + ", "+ request.lead.email;
        // }
        
  
        that.send({to:to, replyTo: replyTo, subject:`R: ${request ? request.subject : '-'}`, text:html }); //html:html
        that.send({to: that.bcc, replyTo: replyTo, subject: `R: ${request ? request.subject : '-'} - notification`, text:html});//html:html
  
      });
    }
  */







  async sendEmailDirect(to, text, project, request_id, subject, tokenQueryString, sourcePage, payload, replyTo, quoteManager) {

    var that = this;


    if (project.toJSON) {
      project = project.toJSON();
    }

    var html = await this.readTemplate('emailDirect.html', project.settings, "EMAIL_DIRECT_HTML_TEMPLATE");


    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    let msgText = text;
    msgText = encode(msgText);
    if (this.markdown) {
      msgText = marked(msgText);
    }

    winston.debug("msgText: " + msgText);
    winston.debug("baseScope: " + JSON.stringify(baseScope));


    var replacements = {
      project: project,
      request_id: request_id,
      seamlessPage: sourcePage,
      msgText: msgText,
      tokenQueryString: tokenQueryString,
      baseScope: baseScope,
      payload: payload
    };

    var html = template(replacements);
    winston.debug("html: " + html);


    // let replyTo;

    if (!replyTo && this.replyEnabled && request_id) {
      replyTo = request_id + this.inboundDomainDomainWithAt;
    }

    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }

    let subjectParsed = that.parseText(subject, payload);

    // if (message.request && message.request.lead && message.request.lead.email) {
    //   winston.info("message.request.lead.email: " + message.request.lead.email);
    //   replyTo = replyTo + ", "+ message.request.lead.email;
    // }

    // if (!subject) {
    //   subject = "Tiledesk"
    // }

    let email_enabled = true;

    that.send({
      from: from,
      to: to,
      replyTo: replyTo,
      subject: subjectParsed,
      text: html,
      html: html,
      config: configEmail,
    }, email_enabled, project, quoteManager);

  }



  // ok
  async sendPasswordResetRequestEmail(to, resetPswRequestId, userFirstname, userLastname) {

    var that = this;

    var html = await this.readTemplate('resetPassword.html', undefined, "EMAIL_RESET_PASSWORD_HTML_TEMPLATE");

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


    that.send({ to: to, subject: `[${this.brand_name}] Password reset request`, html: html });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] Password reset request - notification`, html: html });

  }

  // ok
  async sendYourPswHasBeenChangedEmail(to, userFirstname, userLastname) {

    var that = this;

    var html = await this.readTemplate('passwordChanged.html', undefined, "EMAIL_PASSWORD_CHANGED_HTML_TEMPLATE");

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


    that.send({ to: to, subject: `[${this.brand_name}] Your password has been changed`, html: html });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] Your password has been changed - notification`, html: html });

  }


  // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT  ***
   */
  async sendYouHaveBeenInvited(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserFirstname, invitedUserLastname, invitedUserRole) {

    var that = this;

    var html = await this.readTemplate('beenInvitedExistingUser.html', undefined, "EMAIL_EXUSER_INVITED_HTML_TEMPLATE");

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


    that.send({ to: to, subject: `[${this.brand_name}] You have been invited to the '${projectName}' project`, html: html });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] You have been invited to the '${projectName}' project - notification`, html: html });
  }

  // ok


  /**
   *! *** EMAIL: YOU HAVE BEEN INVITED AT THE PROJECT (USER NOT REGISTERED) ***
   */
  async sendInvitationEmail_UserNotRegistered(to, currentUserFirstname, currentUserLastname, projectName, id_project, invitedUserRole, pendinginvitationid) {


    var that = this;

    var html = await this.readTemplate('beenInvitedNewUser.html', undefined, "EMAIL_NEWUSER_INVITED_HTML_TEMPLATE");

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

    that.send({ to: to, subject: `[${this.brand_name}] You have been invited to the '${projectName}' project`, html: html });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] You have been invited to the '${projectName}' project - notification`, html: html });

  }

  // ok
  async sendVerifyEmailAddress(to, savedUser, code) {


    var that = this;

    if (savedUser.toJSON) {
      savedUser = savedUser.toJSON();
    }
    var html = await this.readTemplate('verify.html', undefined, "EMAIL_VERIFY_HTML_TEMPLATE");

    winston.debug("html: " + html);

    var template = handlebars.compile(html);

    var baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;


    var replacements = {
      savedUser: savedUser,
      baseScope: baseScope,
      code: code
    };

    var html = template(replacements);


    that.send({ to: to, subject: `[${this.brand_name}] Verify your email address`, html: html });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] Verify your email address ` + to + " - notification", html: html });

  }







  // ok

  async sendRequestTranscript(to, messages, request, project) {
    winston.debug("sendRequestTranscript: " + to);

    //if the request came from rabbit mq?
    if (request.toJSON) {
      request = request.toJSON();
    }

    // if (project.toJSON) {
    //   project = project.toJSON();
    // }

    var transcriptAsHtml = ""; //https://handlebarsjs.com/guide/expressions.html#html-escaping
    messages.forEach(message => {
      transcriptAsHtml = transcriptAsHtml + '[' + message.createdAt.toLocaleTimeString('en', { timeZone: 'UTC' }) + '] ' + message.senderFullname + ': ' + message.text + '<br>';
    });
    winston.debug("transcriptAsHtml: " + transcriptAsHtml);



    var that = this;

    var html = await this.readTemplate('sendTranscript.html', project.settings, "EMAIL_SEND_TRANSCRIPT_HTML_TEMPLATE");

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



    let from;
    let configEmail;
    if (project && project.settings && project.settings.email) {
      if (project.settings.email.config) {
        configEmail = project.settings.email.config;
        winston.debug("custom email configEmail setting found: ", configEmail);
      }
      if (project.settings.email.from) {
        from = project.settings.email.from;
        winston.debug("custom from email setting found: " + from);
      }
    }



    //custom ocf here
    // console.log("ocf",project._id);
    let subject = that.formatText("sendTranscriptSubject", `[${this.brand_name}] Transcript`, request, project.settings);

    //prod                                               //pre
    // if (project._id =="6406e34727b57500120b1bd6" || project._id == "642c609f179910002cc56b3e") {
    //   subject = "Segnalazione #" + request.ticket_id;
    //   // subject = "Richiesta di supporto #" + request.ticket_id;
    //   if (request.subject) {
    //     subject = subject + " - " + request.subject;
    //   } 
    //   // console.log("subject",subject);
    // }
    // hcustomization.emailTranscript(to, subject, html, configEmail)

    that.send({ from: from, to: to, subject: subject, html: html, config: configEmail });
    that.send({ to: that.bcc, subject: `[${this.brand_name}] Transcript - notification`, html: html });

  }

  async sendEmailRedirectOnDesktop(to, token, project_id, chatbot_id, namespace_id) {
    winston.debug("sendEmailRedirectOnDesktop: " + to);

    var that = this;

    let html = await this.readTemplate('redirectToDesktopEmail.html', undefined, "EMAIL_REDIRECT_TO_DESKTOP_TEMPLATE");


    winston.debug("html: " + html);

    let template = handlebars.compile(html);

    let baseScope = JSON.parse(JSON.stringify(that));
    delete baseScope.pass;

    let redirect_url;
    if (chatbot_id) {
      redirect_url = `https://panel.tiledesk.com/v3/cds/#/project/${project_id}/chatbot/${chatbot_id}/intent/0?jwt=${token}`;
    } else {
      redirect_url = `${baseScope.baseUrl}/#/project/${project_id}/knowledge-bases/${namespace_id}?token=${token}`;
    }

    let replacements = {
      baseScope: baseScope,
      redirect_url: redirect_url,
      token: token,
      project_id: project_id,
      chatbot_id: chatbot_id
    }

    html = template(replacements);

    that.send({ to: to, subject: `Join ${this.brand_name} from Desktop`, html: html });

  }

  async sendEmailQuotaCheckpointReached(to, firstname, project_name, resource_name, checkpoint, quotes) {

    winston.info("sendEmailQuotaCheckpointReached: " + to);
    
    var that = this;

    let html = await this.readTemplate('checkpointReachedEmail.html', undefined, "EMAIL_QUOTA_CHECKPOINT_REACHED_TEMPLATE");
    winston.debug("html: " + html);

    let template = handlebars.compile(html);

    let requests_quote = quotes.requests.quote;
    let requests_perc = quotes.requests.perc;

    let tokens_quote = quotes.tokens.quote;
    let tokens_perc = quotes.tokens.perc;

    let email_quote = quotes.email.quote;
    let email_perc = quotes.email.perc;

    let replacements = {
      firstname: firstname,
      project_name: project_name,
      resource_name: resource_name,
      checkpoint: checkpoint,
      requests_quote: requests_quote,
      requests_perc: requests_perc,
      tokens_quote: tokens_quote,
      tokens_perc: tokens_perc,
      email_quote: email_quote,
      email_perc: email_perc
    }

    html = template(replacements);

    that.send({ to: to, subject: "Update on resources usage", html: html });
  }

  parseText(text, payload) {



    var baseScope = JSON.parse(JSON.stringify(this));
    delete baseScope.pass;

    winston.debug("parseText text: " + text);

    var templateHand = handlebars.compile(text);

    var replacements = {
      payload: payload,
      baseScope: baseScope,
      test: "test"
    };

    var textTemplate = templateHand(replacements);
    winston.debug("parseText textTemplate: " + textTemplate);

    return textTemplate;


  }

  formatText(templateName, defaultText, payload, settings) {

    let text = defaultText;
    winston.debug("formatText defaultText: " + defaultText);

    let template = this.getTemplate(templateName, settings);

    winston.debug("formatText template: " + template);

    if (template) {
      text = template;
    }

    var baseScope = JSON.parse(JSON.stringify(this));
    delete baseScope.pass;

    winston.debug("formatText text: " + text);

    var templateHand = handlebars.compile(text);

    var replacements = {
      payload: payload,
      baseScope: baseScope,
      test: "test"
    };

    var textTemplate = templateHand(replacements);
    winston.debug("formatText textTemplate: " + textTemplate);

    return textTemplate;

  }

  getTemplate(templateName, settings) {

    var that = this;
    winston.debug('getTemplate formatSubject: ' + JSON.stringify(settings));


    if (settings && settings.email && settings.email.templates) {
      winston.debug('getTemplate settings.email.templates: ', settings.email.templates);

      var templates = settings.email.templates;
      winston.debug('getTemplate templates: ', templates);

      var templateDbName = templateName.replace(".subject", "");
      winston.debug('getTemplate templateDbName: ' + templateDbName);


      var template = templates[templateDbName];
      winston.debug('getTemplate template: ' + template);

      if (template) {
        // that.callback(template);
        // return new Promise(function (resolve, reject) {
        // return resolve(template);
        return template;
        // });
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }

  }



}


var emailService = new EmailService();

// var subject = "abc";
// hcustomization.emailTranscript({subject: subject});
// console.log("subject", subject);

module.exports = emailService;
