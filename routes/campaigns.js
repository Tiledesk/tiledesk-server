let express = require('express');
let router = express.Router();
let Group = require("../models/group");
let Segment = require("../models/segment");
let Lead = require("../models/lead");
let User = require("../models/user");
let winston = require('../config/winston');
let requestService = require("../services/requestService");
let messageService = require("../services/messageService");
let MessageConstants = require("../models/messageConstants");
let UIDGenerator = require("../utils/UIDGenerator");
let LeadConstants = require("../models/leadConstants");
let Segment2MongoConverter = require("../utils/segment2mongoConverter");

let JobManager = require("jobs-worker-queued");

let JOB_RABBITURI = process.env.JOB_RABBITURI;
winston.verbose("JobWorkerQueued uri: " + JOB_RABBITURI);

let jobManager = new JobManager(JOB_RABBITURI,
  {
  // debug:true,
  // topic: "test22",
  // exchange: "test333"
  });


// this endpoint supports support-group- or groups. this create a conversation for the sender (agent console)
router.post('/', function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);
  let request_id = req.body.request_id || 'support-group-' + req.projectid + "-" + UIDGenerator.generate();

  // TODO cicla su segment


  // createWithIdAndRequester(request_id, project_user_id, lead_id, id_project, first_text, departmentid, sourcePage, language, userAgent, status, createdBy, attributes, subject, preflight, channel) {

  //TODO USE NEW requestService.create()
  return requestService.createWithIdAndRequester(request_id, req.projectuser._id, req.body.leadid, req.projectid,
    req.body.text, req.body.departmentid, req.body.sourcePage,
    req.body.language, req.body.userAgent, null, req.user._id, req.body.attributes, req.body.subject, true, req.body.channel).then(function (savedRequest) {

      winston.debug("savedRequest", savedRequest);

      // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
      return messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, savedRequest.request_id, req.body.text,
        req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel).then(function (savedMessage) {
          res.json(savedMessage);
        });

    });
});



/*
Invio di una campagna (il bot invia a tutti i membri del gruppo News dei messaggi direct)
E' l'equivalente del bot "Telegram" che viene usato per aggiornare gli utenti delle ultime funzionalità. E' indicato per inviare news unidirezionali

curl -v -X POST -H 'Content-Type:application/json' -u XYZ:XYZ -d '{"text":"Tiledesk new feature. See here https://tiledesk.com", "group_id":"XYZ"}' https://api.tiledesk.com/v2/XYZ/campaigns/direct

Specifica nel campo text il messaggio.
*/

router.post('/directDEPRECATED?', async function (req, res) {

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;

  winston.debug(req.body);
  winston.debug("req.user", req.user);

  let recipients = [];

  let recipient = req.body.recipient;
  if (recipient) {
    recipients.push(recipient);
  }

  // TODO cicla su segment
  let segment_id = req.body.segment_id;
  if (segment_id) {
      winston.info("segment_id: "+ segment_id);
      
      let queryLead = {};

      let segment = await Segment.findOne({id_project: req.projectid, _id: segment_id }).exec();
      if (!segment) {
        return res.status(404).send({ success: false, msg: 'Error segment not found' });
      }
      Segment2MongoConverter.convert(queryLead, segment);
  
      queryLead["id_project"] = req.projectid;
      queryLead["status"] = LeadConstants.NORMAL;
      winston.info("queryLead", queryLead);

      let leads = await Lead.find(queryLead).exec();
      let recipients = leads;
  }

  let group_id = req.body.group_id;
  if (group_id) {
    let group = await Group.findOne({ _id: group_id, id_project: req.projectid }).exec();
    winston.info("group", group);

    if (!group) {
      return res.status(404).send({ success: false, msg: 'Error group not found' });
    }

    let recipients = group.members;
    // winston.info("members", members);


  }


  winston.info("recipients", recipients);
  winston.info("recipients.length: " + recipients.length);

  let message = {
    sender: req.body.sender || req.user._id, 
    senderFullname: req.body.senderFullname || req.user.fullName, 
    recipient: req.body.recipient, 
    recipientFullname: req.body.recipientFullname,
    text: req.body.text, 
    id_project: req.projectid, // rendilo opzionale?
    createdBy: req.user._id, 
    status:  messageStatus,
    attributes: req.body.attributes, 
    type: req.body.type, 
    metadata: req.body.metadata, 
    language: req.body.language, 
    channel_type: MessageConstants.CHANNEL_TYPE.DIRECT, 
    channel: req.body.channel
};
  

  if (recipients.length == 0) {
    // return res  XXX
  }

  if (recipients.length == 1) {

    // qui manca recipient?
    message.recipient = recipients[0];
    return messageService.save(message).then(function(savedMessage){                        
        if (req.body.returnobject) {
          return res.json(savedMessage);
        } else {
          return res.json({ success: true });
        }

      });
  }


  let promises = [];
  for (const recipient of recipients) {
  // recipients.forEach( async (recipient) => {

    // create(sender, senderFullname, recipient, text, id_project, createdBy, status, attributes, type, metadata, language, channel_type) {
    // let promise = messageService.create(req.body.sender || req.user._id, req.body.senderFullname || req.user.fullName, recipient, req.body.text,
    //   req.projectid, req.user._id, messageStatus, req.body.attributes, req.body.type, req.body.metadata, req.body.language, MessageConstants.CHANNEL_TYPE.DIRECT, req.body.channel);

    winston.info("recipient: " + recipient);

    message.recipient = recipient;

    let user = await User.findOne({_id:recipient}).exec();
    winston.info("user", user);
    
    message.recipientFullname = user.fullName;

    let promise = messageService.save(message);
    promises.push(promise);
    // .then(function(savedMessage){                    
    // result.push(savedMessage);
    // res.json(savedMessage);
  }
  //);

  Promise.all(promises).then(function (data) {
    if (req.body.returnobject) {
      return res.json(data);
    }
  });

  if (!req.body.returnobject) {
    return res.json({ success: true });
  }


});














 jobManager.run(async(data) => {
        winston.info("run job here with payload", data);

        let message = data.payload.message;

        // TODO cicla su segment
        let segment_id = data.payload.segment_id;
        if (segment_id) {
            winston.info("segment_id: "+ segment_id);
            
            
          
          
        
            let queryLead = {};

            let segment = await Segment.findOne({id_project: data.payload.project_id, _id: segment_id }).exec();
            if (!segment) {
              // return res.status(404).send({ success: false, msg: 'Error segment not found' });
              return winston.error("Error segment not found");
            }
            Segment2MongoConverter.convert(queryLead, segment);
        
            queryLead["id_project"] = data.payload.project_id;
            queryLead["status"] = LeadConstants.NORMAL;
            winston.info("queryLead", queryLead);


            //const cursor = Lead.find({}).cursor();
            //TODO RESTORE IT
            const cursor = Lead.find(queryLead).cursor();

            

            // if (doc!= null) {
            //   doc = await cursor.next()
            // }

            // cursor.next(function(error, doc) {
            //   console.log(doc);

            //   setTimout()
            // });
            

            function sleep(ms) {
              return new Promise((resolve) => {
                setTimeout(resolve, ms);
              });
            }

            for (let doc = await cursor.next(); doc != null; doc = await cursor.next() ) {
              winston.debug("doc", doc);

              // if (!message.recipient) {
                message.recipient = doc.lead_id;
              // }

              // if (!message.recipientFullname) {
                message.recipientFullname = doc.fullname;
              // }

              winston.debug("message to send", message);

              messageService.save(message);
            
              await sleep(1000); 
              winston.debug("finito 1000 sec");
            }


            // while(await cursor.hasNext()) {
            //   const doc = await cursor.next();
            //   // process doc here
            // }
        
            // let leads = await Lead.find(queryLead).exec();
            // let recipients = leads;
            // winston.info("recipients", recipients);


        }


    });



router.post('/direct', async function (req, res) {


  winston.debug(req.body);
  winston.debug("req.user", req.user);

  let segment_id = req.body.segment_id;
  winston.info("segment_id"+ segment_id);

  let messageStatus = req.body.status || MessageConstants.CHAT_MESSAGE_STATUS.SENDING;
  // winston.info("messageStatus"+ messageStatus);


  let message = {
    sender: req.body.sender || req.user._id, 
    senderFullname: req.body.senderFullname || req.user.fullName, 
    recipient: req.body.recipient, 
    recipientFullname: req.body.recipientFullname,
    text: req.body.text, 
    id_project: req.projectid, // rendilo opzionale?
    createdBy: req.user._id, 
    status:  messageStatus,
    attributes: req.body.attributes, 
    type: req.body.type, 
    metadata: req.body.metadata, 
    language: req.body.language, 
    channel_type: MessageConstants.CHANNEL_TYPE.DIRECT, 
    channel: req.body.channel
  };
  
  winston.info("message before", message);

  jobManager.publish(
        {segment_id: segment_id, project_id: req.projectid, message: message}
    );

    return res.json({ queued: true });


});









module.exports = router;
