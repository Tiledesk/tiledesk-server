var express = require('express');
const multer  = require('multer');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var winston = require('../config/winston');
var pathlib = require('path');
var mongoose = require('mongoose');
var router = express.Router();
const FileGridFsService = require('../services/fileGridFsService.js');
const fileService = new FileGridFsService("files");
const fallbackFileService = new FileGridFsService("images");
const mime = require('mime-types');
const path = require('path');
const faq_kb = require('../models/faq_kb');
const project_user = require('../models/project_user');
const roleConstants = require('../models/roleConstants');
const sharp = require('sharp');


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE || 1024000;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.info("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.info("Max upload file size is infinity");
}

const default_assets_allowed_extensions = process.env.ASSETS_FILE_ALLOW_LISTALLOWED_EXTENSIONS || ".jpg,.jpeg,.png,.gif,.pdf,.txt,.csv,.doc,.docx"; //,.xls,.xlsx,.ppt,.pptx,.zip,.rar

//const images_extensions = [ ".png", ".jpg", ".jpeg", ".gif" ];
const images_extensions = ".png,.jpg,.jpeg,.gif";

const fileFilter = (extensionsSource = 'assets') => {

  return (req, file, cb) => {
  
    const project = req.project;
    const pu = req.projectuser;
    
    let allowed_extensions = images_extensions;
    let allowed_mime_types;
  
    if (allowed_extensions !== "*/*") {
      allowed_mime_types = getMimeTypes(allowed_extensions);
      const ext = path.extname(file.originalname).toLowerCase();
  
      if (!allowed_extensions.includes(ext)) {
        const error = new Error("Extension not allowed");
        error.status = 403;
        return cb(error);
      }
  
      const expectedMimetype = mime.lookup(ext);
      if (expectedMimetype && file.mimetype !== expectedMimetype) {
        const error = new Error("Mimetype mismatch detected");
        error.status = 403;
        return cb(error);
      }

      return cb(null, true)
    } else {
      return cb(null, true);
    }
  }
}

const uploadAssets = multer({ 
  storage: fileService.getStorage("files"), 
  fileFilter: fileFilter("assets"), 
  limits: uploadlimits
}).single('file');

const uploadAvatar = multer({
  storaga: fileService.getStorageAvatar("files"),
  fileFilter: fileFilter("assets"),
  limits: uploadlimits
}).single('file');







// let files_allowed = process.env.UPLOAD_FILES_ALLOW_LIST || "text/html,text/plain,application/octet-stream,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,audio/mpeg,application/json,application/pdf";
// winston.info("Files upload allowed list "+ files_allowed);


//  curl -u andrea.leo@f21.it:123456 -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/public/wstest/index.html;type=text/plain"   http://localhost:3000/files/users/

// const fileFilter = (req, file, cb) => {
//   winston.debug("fileFilter "+ files_allowed);
//   winston.debug("fileFilter file" , file);

//   winston.debug("req.file ",req.file);

  

//   if (files_allowed==="*" || (files_allowed && files_allowed.length>0 && files_allowed.split(",").indexOf(file.mimetype)>-1) ) {
//      winston.debug("file.mimetype allowed: "+ file.mimetype);
//       cb(null, true);
//   } else {
//       winston.debug("file.mimetype not allowed. " + file.mimetype);
//       // cb(null, false);
//       cb(new multer.MulterError('fileFilter not allowed'))
//   }
// }


// const upload = multer({ storage: fileService.getStorage("files"),  fileFilter: fileFilter, limits: uploadlimits}).single('file');


router.post('/users/photo', [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken
], async (req, res, next) => {

  console.log("\n/users/photo")
  uploadAssets(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      winston.error(`Multer replied with code ${err?.code} and message "${err?.message}"`);
      let status = 400;
      if (err.code === "LIMIT_FILE_SIZE") {
        status = 413;
      }
      return res.status(status).send({ success: false, msg: err.message || "Error on file uploading", code: err.code })
    } else if (err) {
      // An unknown error occurred when uploading.
      winston.error(`Multer replied with status ${err?.status} and message "${err?.message}"`);
      let status = err?.status || 400;
      return res.status(status).send({ success: false, msg: err.message || "Error on file uploading" })
    }

    try {

      if (req.upload_file_already_exists) {
        winston.warn('Error uploading photo image, file already exists', req.file.filename);
        return res.status(409).send({ success: false, msg: 'Error uploading photo image, file already exists' });
      }

      let userid = req.user.id;
      let bot_id;
      let entity_id = userid;

      // if (req.query.user_id) {
      //   userid = req.query.user_id;
      // }

      if (req.query.bot_id) {
        bot_id = req.query.bot_id;
        console.log("bot_id: ", bot_id)

        let chatbot = await faq_kb.findById(bot_id).catch((err) => {
          winston.error("Error finding bot ", err);
          return res.status(500).send({ success: false, error: "Unable to find chatbot with id " + bot_id });
        })
        console.log("chatbot: ", chatbot)

        if (!chatbot) {
          return res.status(404).send({ success: false, error: "Chatbot not found" })
        }

        let id_project = chatbot.id_project;

        let puser = await project_user.findOne({ id_user: userid, id_project: id_project }).catch((err) => {
          winston.error("Error finding project user: ", err);
          return res.status(500).send({ success: false, error: "Unable to find project user for user " + userid + "in project " + id_project });
        })
        if (!puser) {
          winston.warn("User" + userid + "don't belongs the project " + id_project);
          return res.status(401).send({ success: false, error: "You don't belong the chatbot's project" })
        }

        if ((puser.role !== roleConstants.ADMIN) && (puser.role !== roleConstants.OWNER)) {
          winston.warn("User with role " + puser.role + "can't modify the chatbot");
          return res.status(403).send({ success: false, error: "You don't have the role required to modify the chatbot" });
        }

        entity_id = bot_id;
        console.log("entity_id: ", entity_id)
      }

      var destinationFolder = 'uploads/users/' + entity_id + "/files/";
      winston.debug("destinationFolder:" + destinationFolder);
      console.log("destinationFolder: ", destinationFolder)

      var thumFilename = destinationFolder + 'thumbnails_200_200-photo.jpg';

      winston.debug("req.file.filename:" + req.file.filename);
      console.log("req.file.filename:" + req.file.filename);
      fileService.getFileDataAsBuffer(req.file.filename).then(function (buffer) {

        sharp(buffer).resize(200, 200).toBuffer((err, resizeImage, info) => {
          //in prod nn genera thumb
          if (err) { winston.error("Error generating thumbnail", err); }
          fileService.createFile(thumFilename, resizeImage, undefined, undefined);
        });

        return res.status(201).json({
          message: 'Image uploded successfully',
          filename: encodeURIComponent(req.file.filename),
          thumbnail: encodeURIComponent(thumFilename)
        });
      });
    } catch (error) {
      if (err?.source === "FileContentVerification") {
        let error_message = err.message || "Content verification failed";
        winston.warn("File content verification failed. Message: ", error_message);
        return res.status(403).send({ success: false, msg: error_message });
      }

      winston.error("Error uploading asset", err);
      console.error("Error uploading asset", err);
      return res.status(500).send({ success: false, msg: "Error processing file" });
    }
  });
});


// router.get("/", (req, res) => {
//   winston.debug('path', req.query.path);
//   // if (path.indexOf("/users/"))
//   fileService.getFileDataAsStream(req.query.path).pipe(res);
//   // const file = gfs
//   //   .find({
//   //     filename: req.query.path
//   //   })
//   //   .toArray((err, files) => {
//   //     if (!files || files.length === 0) {
//   //       return res.status(404).json({
//   //         err: "no files exist"
//   //       });
//   //     }
//   //     gfs.openDownloadStreamByName(req.query.path).pipe(res);
//   //   });
// });

router.get("/", async (req, res) => {
  winston.debug('path', req.query.path);

  if (req.query.as_attachment) {
    res.set({ "Content-Disposition": "attachment; filename=\""+req.query.path+"\"" });
  }
  
  let fService = fileService;
  try {
    let file = await fileService.find(req.query.path);
    res.set({ "Content-Length": file.length});
    res.set({ "Content-Type": file.contentType});
  } catch (e) {
    if (e.code == "ENOENT") {
      winston.debug(`File ${req.query.path} not found on primary file service. Fallback to secondary.`)
      
      // To instantiate fallbackFileService here where needed you need to wait for the open event.
      // Instance moved on top
      // await new Promise(r => fallbackFileService.conn.once("open", r));

      try {
        let file = await fallbackFileService.find(req.query.path)
        res.set({ "Content-Length": file.length });
        res.set({ "Content-Type": file.contentType });
        fService = fallbackFileService;
      } catch (e) {
        if (e.code == "ENOENT") {
          winston.debug(`File ${req.query.path} not found on seconday file service.`)
          return res.status(404).send({ success: false, msg: 'File not found.' });
        }else {
          winston.error('Error getting file: ', e);
          return res.status(500).send({success: false, msg: 'Error getting file.'});
        }
      }

    } else {
      winston.error('Error getting file', e);
      return res.status(500).send({success: false, msg: 'Error getting file.'});
    }
  }
  
  fService.getFileDataAsStream(req.query.path).pipe(res);
});



router.get("/download", (req, res) => {
  winston.debug('path', req.query.path);

  let filename = pathlib.basename(req.query.path);
  winston.debug("filename:"+filename);

  res.attachment(filename);
  fileService.getFileDataAsStream(req.query.path).pipe(res);
});


function getMimeTypes(allowed_extension) {
  const extension = allowed_extension.split(',').map(e => e.trim().toLowerCase());
  const allowedMimeTypes = extension.map(ext => mime.lookup(ext)).filter(Boolean);
  return allowedMimeTypes;
}




/*

curl -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/users/

const fileFilter = (req, file, cb) => {
  winston.debug("fileFilter " + files_allowed);
  const ext = file.originalname.toLowerCase().endsWith('.html') || file.originalname.toLowerCase().endsWith('.htm');

  if (ext) {
      winston.debug("file extension not allowed: " + file.originalname);
      cb(new multer.MulterError('fileFilter not allowed'));
      return;
  }

  if (files_allowed === "*" ||
      (files_allowed && files_allowed.length > 0 && files_allowed.split(",").indexOf(file.mimetype) > -1)) {
      winston.debug("file.mimetype allowed: " + file.mimetype);
      cb(null, true);
  } else {
      winston.debug("file.mimetype not allowed. " + file.mimetype);
      cb(new multer.MulterError('fileFilter not allowed'));
  }
};


const upload = multer({ storage: fileService.getStorage("files"),  fileFilter: fileFilter, limits: uploadlimits}).single('file');





router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken],  (req, res, next) => {

/**
 * IN DEPRECATION
 */
router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], (req, res, next) => {
  winston.debug("files/users");
  if (req.query.forever) {
    req.expireAt = new Date(8640000000000000); //max javascript date
  }
  
   upload(req, res, function (err) {
    winston.info('upload req.file', req.file);
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      winston.error('Permission denied uploading the file.', err);
      return res.status(403).send({success: false, msg: 'Permission denied uploading the file.'});
    } else if (err) {
      // An unknown error occurred when uploading.
      winston.error('Error uploading the file.', err);
      return res.status(500).send({success: false, msg: 'Error uploading the file.'});
    }


     //file_retention
    mongoose.connection.db.collection('files.chunks').updateMany({"files_id": req.file.id},{ "$set": { "metadata.expireAt": req.file.metadata.expireAt } }, function (err, updates) {
      // https://www.mongodb.com/docs/manual/tutorial/expire-data/#specify-expiration-with-a-ttl-index
      
      if (err) {
        winston.error("Error updating files.chunks");
      }
        winston.debug("files.chunks updated", updates);

    });

      // Everything went fine.
      return res.status(201).json({
        message: 'File uploded successfully',
        filename: req.file.filename
      });
    })

});

/*


curl \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/public/



  */


  // used by SMTP SERVER
/**
 * IN DEPRECATION
 */
router.post('/public',  (req, res, next) => {
  winston.debug("files/public")

  if (req.query.forever) {
    req.expireAt = new Date(8640000000000000); //max javascript date
  }

   upload(req, res, function (err) {
    winston.debug('upload req.file', req.file);
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      winston.error('Permission denied uploading the file.', err);
      return res.status(403).send({success: false, msg: 'Permission denied uploading the file.'});
    } else if (err) {
      // An unknown error occurred when uploading.
      winston.error('Error uploading the file.', err);
      return res.status(500).send({success: false, msg: 'Error uploading the file.'});
    }

    //file_retention
    mongoose.connection.db.collection('files.chunks').updateMany({"files_id": req.file.id},{ "$set": { "metadata.expireAt": req.file.metadata.expireAt } }, function (err, updates) {
      if (err) {
        winston.error("Error updating files.chunks");
      }
        winston.debug("files.chunks updated", updates);

    });


    return res.status(201).json({
        message: 'File uploded successfully',
        filename: req.file.filename
    });    
  });
});




router.get("/", async (req, res) => {
  winston.debug('path', req.query.path);
  

  try {
    let file = await fileService.find(req.query.path);
    // console.log("file", file);

    res.set({ "Content-Length": file.length});
    res.set({ "Content-Type": file.contentType});

  } catch (e) {
    if (e.code == "ENOENT") {
      winston.debug('File not found: '+req.query.path);
      return res.status(404).send({success: false, msg: 'File not found.'});
    }else {
      winston.error('Error getting the image', e);
      return res.status(500).send({success: false, msg: 'Error getting file.'});
    }      
  }
  
  fileService.getFileDataAsStream(req.query.path).on('error', (e)=> {
        if (e.code == "ENOENT") {
          winston.debug('File not found: '+req.query.path);
          return res.status(404).send({success: false, msg: 'File not found.'});
        }else {
          winston.error('Error getting the file', e);
          return res.status(500).send({success: false, msg: 'Error getting file.'});
        }      
      }).pipe(res);
  
});


router.get("/download", (req, res) => {
  winston.debug('path', req.query.path);
  // if (path.indexOf("/users/"))
  let filename = pathlib.basename(req.query.path);
  winston.debug("filename:"+filename);

  res.attachment(filename);
  fileService.getFileDataAsStream(req.query.path).pipe(res);
});



module.exports = router;