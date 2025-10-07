let express = require('express');
let router = express.Router();
let Message = require("../models/message");
let Request = require("../models/request");
let User = require("../models/user");
let winston = require('../config/winston');

let fonts = {
	Roboto: {
		normal: 'fonts/Roboto-Regular.ttf',
		bold: 'fonts/Roboto-Medium.ttf',
		italics: 'fonts/Roboto-Italic.ttf',
		bolditalics: 'fonts/Roboto-MediumItalic.ttf'
	}
};

let PdfPrinter = require('pdfmake');
let printer = new PdfPrinter(fonts);
// let fs = require('fs');






  router.get('/:requestid/messages', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.json(messages);
    });

  });


  router.get('/:requestid/messages.html', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.render('messages', 
        { title: 'Tiledesk', 
          messages: messages,
          brandName: process.env.BRAND_NAME || null,
          brandLogo: process.env.BRAND_LOGO || null
        });
    });

  });


  router.get('/:requestid/messages.csv', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).lean().exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      messages.forEach(function(element) {

        let channel_name = "";
        if (element.channel && element.channel.name) {
          channel_name = element.channel.name;
        }
        delete element.channel;
        element.channel_name = channel_name;

        delete element.attributes;
      });

      res.setHeader('Content-Type', 'applictext/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transcript.csv');

      return res.csv(messages, true);
    });

  });


  router.get('/:requestid/messages.txt', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      

      let text = "Chat transcript:\n" //+ req.project.name;
      
      messages.forEach(function(element) {
        text = text + "[ " + element.createdAt.toLocaleString('en', { timeZone: 'UTC' })+ "] " + element.senderFullname + ": " + element.text + "\n";
      });
    

      res.set({"Content-Disposition":"attachment; filename=\"transcript.txt\""});
      res.send(text);
    });

  });



  router.get('/:requestid/messages.pdf', function(req, res) {


    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }


      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }


      let docDefinition = {
        content: [
          { text: 'Chat Transcript', style: 'header' },
          {
            ul: [
              // 'item 1',
              // 'item 2',
              // 'item 3'
            ]
          },
          
        ],
        styles: {
          header: {
            bold: true,
            fontSize: 15
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      };

      

      messages.forEach(function(element) {
        docDefinition.content[1].ul.push("[ " + element.createdAt.toLocaleString('en', { timeZone: 'UTC' })+ "] " + element.senderFullname + ": " + element.text );
      });

      console.log(docDefinition);
   
    let pdfDoc = printer.createPdfKitDocument(docDefinition);
    // pdfDoc.pipe(fs.createWriteStream('lists.pdf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transcript.pdf');
            

    pdfDoc.pipe(res);
    pdfDoc.end();


      
    });

  });



  router.get('/:requestid/messages-user.html', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      let filteredMessages = messages.filter(m => m.sender != "system" );

      //skip info message

      return res.render('messages', { title: 'Tiledesk', messages: filteredMessages});
    });

  });



  router.get('/:requestid/messages-user.txt', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      

      let filteredMessages = messages.filter(m => m.sender != "system" );

      let text = "Chat transcript:\n" //+ req.project.name;

      filteredMessages.forEach(function(element) {
        text = text + "[ " + element.createdAt.toLocaleString('en', { timeZone: 'UTC' })+ "] " + element.senderFullname + ": " + element.text + "\n";
      });
    

      res.set({"Content-Disposition":"attachment; filename=\"transcript.txt\""});
      res.send(text);
    });

  });


  router.get('/:requestid/messages-user.pdf', function(req, res) {


    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      //skip info message
      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      let filteredMessages = messages.filter(m => m.sender != "system" );

      let docDefinition = {
        content: [
          { text: 'Chat Transcript', style: 'header' },
          {
            ul: [
              // 'item 1',
              // 'item 2',
              // 'item 3'
            ]
          },
          
        ],
        styles: {
          header: {
            bold: true,
            fontSize: 15
          }
        },
        defaultStyle: {
          fontSize: 12
        }
      };

      

      filteredMessages.forEach(function(element) {
        docDefinition.content[1].ul.push("[ " + element.createdAt.toLocaleString('en', { timeZone: 'UTC' })+ "] " + element.senderFullname + ": " + element.text );
      });

      console.log(docDefinition);
   
    let pdfDoc = printer.createPdfKitDocument(docDefinition);
    // pdfDoc.pipe(fs.createWriteStream('lists.pdf'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transcript.pdf');
    
    pdfDoc.pipe(res);
    pdfDoc.end();


      
    });

  });


  router.get('/:requestid/messages-user.csv', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).lean().exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      //skip info message
      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      let filteredMessages = messages.filter(m => m.sender != "system" );

      filteredMessages.forEach(function(element) {

        let channel_name = "";
        if (element.channel && element.channel.name) {
          channel_name = element.channel.name;
        }
        delete element.channel;
        element.channel_name = channel_name;

        delete element.attributes;
      });


      res.setHeader('Content-Type', 'applictext/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transcript.csv');

      return res.csv(filteredMessages, true);
    });

  });

module.exports = router;
