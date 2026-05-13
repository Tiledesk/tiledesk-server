var express = require('express');
var router = express.Router();
var csvExpress = require('csv-express');
var Message = require("../models/message");
var Request = require("../models/request");
var User = require("../models/user");
var winston = require('../config/winston');
var transcriptTz = require('../utils/transcriptTimezone');

var fonts = {
	Roboto: {
		normal: 'fonts/Roboto-Regular.ttf',
		bold: 'fonts/Roboto-Medium.ttf',
		italics: 'fonts/Roboto-Italic.ttf',
		bolditalics: 'fonts/Roboto-MediumItalic.ttf'
	}
};

var PdfPrinter = require('pdfmake');
var printer = new PdfPrinter(fonts);
// var fs = require('fs');

router.get('/:requestid/test/error', async (req, res) => {
  
    return res.status(500).render('error', {
      title: 'Tiledesk',
      error: "An error occurred while getting the request"
    });

});

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


router.get('/:requestid/messages.html', async (req, res) => {

  winston.debug(req.params);
  winston.debug("here");
  
  try {
    let messages = await Message.find({ "recipient": req.params.requestid }).sort({createdAt: 'asc'}).exec();

    let filteredMessages = await filterMessages(messages);

    let idProject = filteredMessages[0] && filteredMessages[0].id_project ? String(filteredMessages[0].id_project) : undefined;
    let tz = await transcriptTz.resolveTranscriptTimezone(req, idProject);
    let messagesForView = attachTranscriptDisplayTimes(filteredMessages, tz);

    return res.render('messages', 
      { 
        title: 'Tiledesk', 
        messages: messagesForView,
        brandName: process.env.BRAND_NAME || null,
        brandLogo: process.env.BRAND_LOGO || null
      });

  } catch (error) {
    winston.error("Error getting messages: ", error);
    
    return res.status(500).render('error', {
      title: 'Tiledesk',
      error: "An error occurred while getting the messages"
    });

  }
  
});




router.get('/:requestid/messages.csv', async function(req, res) {

  var requestid = req.params.requestid;
  var csvFilename = requestid.replace(/["\\\r\n]/g, '_') + '.csv';

  try {
    let messages = await Message.find({"recipient": requestid}).sort({createdAt: 'asc'}).lean().exec();

    if (!messages) {
      return res.status(404).send({success: false, msg: 'Object not found.'});
    }

    let tz = await transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages));

    let rows = messages.map(function(m) {
      return {
        createdAt: transcriptTz.formatTranscriptInstant(m.createdAt, tz),
        senderFullname: m.senderFullname != null ? String(m.senderFullname) : '',
        text: m.text != null ? String(m.text) : ''
      };
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + csvFilename + '"');

    if (rows.length === 0) {
      return res.send(['createdAt', 'senderFullname', 'text'].join(csvExpress.separator) + '\r\n');
    }

    return res.csv(rows, true);

  } catch (err) {
    winston.error('public-request messages.csv', err);
    return res.status(500).send({success: false, msg: 'Error getting object.'});
  }

});


router.get('/:requestid/messages.txt', function(req, res) {

  winston.debug(req.params);
  winston.debug("here");
  Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec()
    .then(function (messages) {
      if (!messages) {
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      return transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages))
        .then(function (tz) {
          var text = "Chat transcript:\n";
          messages.forEach(function(element) {
            text = text + "[ " + transcriptTz.formatTranscriptInstant(element.createdAt, tz) + "] " + element.senderFullname + ": " + element.text + "\n";
          });
          res.set({"Content-Disposition":"attachment; filename=\"transcript.txt\""});
          res.send(text);
        });
    })
    .catch(function (err) {
      winston.error('public-request messages.txt', err);
      return res.status(500).send({success: false, msg: 'Error getting object.'});
    });

});



router.get('/:requestid/messages.pdf', async function(req, res) {

  var requestid = req.params.requestid;
  var pdfFilename = requestid.replace(/["\\\r\n]/g, '_') + '.pdf';

  winston.debug(req.params);
  winston.debug("here");

  try {
    let messages = await Message.find({"recipient": requestid}).sort({createdAt: 'asc'}).exec();

    if (!messages) {
      return res.status(404).send({success: false, msg: 'Object not found.'});
    }

    let tz = await transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages));
    let docDefinition = buildTranscriptPdfDocDefinition(messages, tz);
    let pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + pdfFilename + '"');

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    winston.error('public-request messages.pdf', err);
    return res.status(500).send({success: false, msg: 'Error getting object.'});
  }

});



router.get('/:requestid/messages-user.html', async function(req, res) {

  winston.debug(req.params);
  winston.debug("here");
  try {
    let messages = await Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec();
    messages = messages.filter(m => m.sender != "system" );

    if (!messages || messages.length === 0) {
      return res.status(404).send({success: false, msg: 'Object not found.'});
    }

    var idProject = messages[0] && messages[0].id_project ? String(messages[0].id_project) : undefined;
    var tz = await transcriptTz.resolveTranscriptTimezone(req, idProject);
    var messagesForView = attachTranscriptDisplayTimes(messages, tz);

    return res.render('messages', { title: 'Tiledesk', messages: messagesForView,
      brandName: process.env.BRAND_NAME || null,
      brandLogo: process.env.BRAND_LOGO || null
    });
  } catch (err) {
    winston.error('public-request messages-user.html', err);
    return res.status(500).send({success: false, msg: 'Error getting object.'});
  }

});



router.get('/:requestid/messages-user.txt', function(req, res) {

  winston.debug(req.params);
  winston.debug("here");
  Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec()
    .then(function (messages) {
      if (!messages || messages.length === 0) {
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      messages = messages.filter(m => m.sender != "system" );
      if (messages.length === 0) {
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      return transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages))
        .then(function (tz) {
          var text = "Chat transcript:\n";
          messages.forEach(function(element) {
            text = text + "[ " + transcriptTz.formatTranscriptInstant(element.createdAt, tz) + "] " + element.senderFullname + ": " + element.text + "\n";
          });
          res.set({"Content-Disposition":"attachment; filename=\"transcript.txt\""});
          res.send(text);
        });
    })
    .catch(function (err) {
      winston.error('public-request messages-user.txt', err);
      return res.status(500).send({success: false, msg: 'Error getting object.'});
    });

});


router.get('/:requestid/messages-user.pdf', async function(req, res) {

  var requestid = req.params.requestid;
  var pdfFilename = requestid.replace(/["\\\r\n]/g, '_') + '.pdf';

  winston.debug(req.params);
  winston.debug("here");

  try {
    let messages = await Message.find({"recipient": requestid}).sort({createdAt: 'asc'}).exec();

    if (!messages || messages.length === 0) {
      return res.status(404).send({success: false, msg: 'Object not found.'});
    }

    messages = messages.filter(m => m.sender != "system" );

    if (messages.length === 0) {
      return res.status(404).send({success: false, msg: 'Object not found.'});
    }

    let tz = await transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages));
    let docDefinition = buildTranscriptPdfDocDefinition(messages, tz);
    let pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + pdfFilename + '"');

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    winston.error('public-request messages-user.pdf', err);
    return res.status(500).send({success: false, msg: 'Error getting object.'});
  }

});


router.get('/:requestid/messages-user.csv', function(req, res) {

  var requestid = req.params.requestid;
  var csvFilename = requestid.replace(/["\\\r\n]/g, '_') + '.csv';

  winston.debug(req.params);
  winston.debug("here");
  Message.find({"recipient": requestid}).sort({createdAt: 'asc'}).lean().exec()
    .then(function (messages) {
      if (!messages || messages.length === 0) {
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      messages = messages.filter(m => m.sender != "system" );
      if (messages.length === 0) {
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }
      return transcriptTz.resolveTranscriptTimezone(req, firstMessageProjectId(messages))
        .then(function (tz) {
          var rows = messages.map(function(m) {
            return {
              createdAt: transcriptTz.formatTranscriptInstant(m.createdAt, tz),
              senderFullname: m.senderFullname != null ? String(m.senderFullname) : '',
              text: m.text != null ? String(m.text) : ''
            };
          });

          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="' + csvFilename + '"');

          if (rows.length === 0) {
            return res.send(['createdAt', 'senderFullname', 'text'].join(csvExpress.separator) + '\r\n');
          }

          return res.csv(rows, true);
        });
    })
    .catch(function (err) {
      winston.error('public-request messages-user.csv', err);
      return res.status(500).send({success: false, msg: 'Error getting object.'});
    });

});

function filterMessages(messages) {

  if (messages[0].text === "welcome" || messages[0].text === "/start") {
    messages = messages.slice(1);
  }
  return messages.filter(m => m.sender !== "system" );

}

function firstMessageProjectId(messages) {
  return messages && messages[0] && messages[0].id_project ? String(messages[0].id_project) : undefined;
}

function attachTranscriptDisplayTimes(messages, timeZone) {
  return messages.map(function (m) {
    var o = typeof m.toObject === 'function' ? m.toObject() : m;
    return Object.assign({}, o, {
      transcriptDisplayTime: transcriptTz.formatTranscriptInstant(m.createdAt, timeZone)
    });
  });
}

/** Footer line aligned with views/messages.jade (Powered by …). */
function transcriptPdfFooterLine() {
  var brand = process.env.BRAND_NAME;
  if (brand) {
    return 'Powered by ' + brand;
  }
  return 'Powered by Tiledesk';
}

/**
 * pdfmake document for a chat transcript: title, message blocks (sender, body, time), footer.
 * Simplified layout inspired by messages.jade / messages-layout.jade.
 */
function buildTranscriptPdfDocDefinition(messages, tz) {
  var innerWidthPt = 515;
  var content = [
    { text: 'Chat transcript', style: 'pdfTitle', alignment: 'center', margin: [0, 0, 0, 18] }
  ];

  messages.forEach(function (element, index) {
    if (index > 0) {
      content.push({
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: innerWidthPt, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }
        ],
        margin: [0, 4, 0, 12]
      });
    }

    var sender = element.senderFullname || 'Unknown';
    var body = element.text != null ? String(element.text) : '';
    var timeStr = transcriptTz.formatTranscriptInstant(element.createdAt, tz);

    content.push({
      stack: [
        { text: sender, style: 'pdfSender' },
        { text: body, style: 'pdfBody', margin: [0, 6, 0, 2] },
        {
          columns: [
            { width: '*', text: '' },
            { width: 'auto', text: timeStr, style: 'pdfMeta' }
          ],
          columnGap: 0
        }
      ],
      margin: [0, 0, 0, 2]
    });
  });

  content.push({
    text: transcriptPdfFooterLine(),
    style: 'pdfFooter',
    alignment: 'center',
    margin: [0, 24, 0, 0]
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 44, 40, 44],
    content: content,
    styles: {
      pdfTitle: { fontSize: 20, bold: true, color: '#0f172a' },
      pdfSender: { fontSize: 11, bold: true, color: '#0f172a' },
      pdfBody: { fontSize: 10, color: '#334155' },
      pdfMeta: { fontSize: 8, color: '#64748b', alignment: 'right' },
      pdfFooter: { fontSize: 9, color: '#64748b' }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      lineHeight: 1.4
    }
  };
}

module.exports = router;
