const express = require('express');
const router = express.Router();
const multer  = require('multer');
const passport = require('passport');
require('../middleware/passport.js')(passport);
const validtoken = require('../middleware/valid-token.js')
const roleChecker = require('../middleware/has-role.js');
const winston = require('../config/winston.js');
const pathlib = require('path');
const mongoose = require('mongoose');
const FileGridFsService = require('../services/fileGridFsService.js');
const roleConstants = require('../models/roleConstants.js');
const fileService = new FileGridFsService("files");
const fallbackFileService = new FileGridFsService("images");
const mime = require('mime-types');
const path = require('path');
const sharp = require('sharp');
const verifyFileContent = require('../middleware/file-type.js');


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE || 1024000;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.info("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.info("Max upload file size is infinity");
}

/**
 * Default: '2592000' (30 days)
 * Examples:
 * - '30' (30 seconds)
 */
const chatFileExpirationTime = parseInt(process.env.CHAT_FILE_EXPIRATION_TIME || '2592000', 10)
//const default_allowed_extension = process.env.UPLOAD_FILES_ALLOW_LIST || "application/pdf,image/png";
/**
 * Default: ".jpg,.jpeg,.png,.gif,.pdf,.txt"
 * Examples: 
 * - '* /*' without spaces (all extension)
 * Deprecated: "application/pdf,image/png,..."
 */
const default_chat_allowed_extensions = process.env.CHAT_FILES_ALLOW_LIST || ".jpg,.jpeg,.png,.gif,.pdf,.txt"; 
const default_assets_allowed_extensions = process.env.ASSETS_FILE_ALLOW_LISTALLOWED_EXTENSIONS || ".jpg,.jpeg,.png,.gif,.pdf,.txt,.csv,.doc,.docx"; //,.xls,.xlsx,.ppt,.pptx,.zip,.rar

const images_extensions = [ ".png", ".jpg", ".jpeg", ".gif" ];


const fileFilter = (extensionsSource = 'chat') => {

  return (req, file, cb) => {
  
    const project = req.project;
    const pu = req.projectuser;
    
    let allowed_extensions;
    let allowed_mime_types;
  
    if (extensionsSource === 'assets') {
      allowed_extensions = default_assets_allowed_extensions;
    }
    else if (pu.roleType === 2 || pu.role === roleConstants.GUEST) {
      allowed_extensions = project?.widget?.allowedUploadExtentions || default_chat_allowed_extensions;
    } 
    else {
      allowed_extensions = project?.settings?.allowed_upload_extentions || default_chat_allowed_extensions;
    }
  
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

const uploadChat = multer({ 
  storage: fileService.getStorage("files"), 
  fileFilter: fileFilter("chat"), 
  limits: uploadlimits
}).single('file');

const uploadAssets = multer({ 
  storage: fileService.getStorage("files"), 
  fileFilter: fileFilter("assets"), 
  limits: uploadlimits
}).single('file');


router.post('/chat', [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
  roleChecker.hasRoleOrTypes('guest', ['bot','subscription']),
], async (req, res) => {

  const expireAt = new Date(Date.now() + chatFileExpirationTime * 1000);
  req.expireAt = expireAt;


  uploadChat(req, res, async (err) => {
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

      const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
      await verifyFileContent(buffer, req.file.mimetype);

      await mongoose.connection.db.collection('files.chunks').updateMany(
        { files_id: req.file.id }, 
        { $set: { "metadata.expireAt": req.file.metadata.expireAt }}
      )
      return res.status(201).send({ message: "File uploaded successfully", filename: req.file.filename });

    } catch(err) {
      if (err?.source === "FileContentVerification") {
        let error_message = err.message || "Content verification failed";
        winston.warn("File content verification failed. Message: ", error_message);
        return res.status(403).send({ success: false, msg: error_message });  
      }
      winston.error("Error saving file: ", err);
      return res.status(500).send({ success: false, msg: "Error updating file chunks" });
    }
  })
})

router.post('/assets', [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
  roleChecker.hasRoleOrTypes('admin', ['bot','subscription']), 
], async (req, res) => {
  
  let customExpiration = parseInt(req.query?.expiration, 10); // seconds
  let expireAt;
  if (customExpiration && !isNaN(customExpiration)) {
    expireAt = new Date(Date.now() + customExpiration * 1000);
  } else {
    expireAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // default 10 year
  }
  req.expireAt = expireAt;

  uploadAssets(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      let status = (err.code === "LIMIT_FILE_SIZE") ? 413 : 400;
      return res.status(status).send({ success: false, msg: err.message, code: err.code });
    } else if (err) {
      return res.status(err?.status || 400).send({ success: false, msg: err.message || "Error uploading file" });
    }

    try {
      
      const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
      await verifyFileContent(buffer, req.file.mimetype);
      // metadata update
      await mongoose.connection.db.collection('files.chunks').updateMany(
        { files_id: req.file.id },
        { $set: { "metadata.expireAt": req.file.metadata.expireAt } }
      );

      const ext = path.extname(req.file.originalname).toLowerCase();
      let thumbnail;

      // generate thumb for images
      if (images_extensions.includes(ext)) {
        const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
        const thumFilename = req.file.filename.replace(/([^/]+)$/, "thumbnails_200_200-$1");
        const resized = await sharp(buffer).resize(200,200).toBuffer();
        await fileService.createFile(thumFilename, resized, undefined, undefined, {metadata: {expireAt}});
        await mongoose.connection.db.collection('files.chunks').updateMany(
          { files_id: (await fileService.find(thumFilename))._id },
          { $set: { "metadata.expireAt": expireAt } }
        );
        thumbnail = thumFilename;
      }

      return res.status(201).json({
        message: 'File uploaded successfully',
        filename: encodeURIComponent(req.file.filename),
        thumbnail: thumbnail ? encodeURIComponent(thumbnail) : undefined
      });

    } catch(err) {
      if (err?.source === "FileContentVerification") {
        let error_message = err.message || "Content verification failed";
        winston.warn("File content verification failed. Message: ", error_message);
        return res.status(403).send({ success: false, msg: error_message });  
      }

      winston.error("Error uploading asset", err);
      return res.status(500).send({ success: false, msg: "Error processing file" });
    }
  });
})

router.get("/", [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
], async (req, res) => {
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

router.get("/download", [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
], (req, res) => {
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

module.exports = router;