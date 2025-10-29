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
const mime = require('mime-types');
const path = require('path');

// Bucket selector
function getBucketByFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  if (mimeType.startsWith("image/") || [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
    return "images";
  }
  return "files";
}

let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE || 1024000;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = { fileSize: parseInt(MAX_UPLOAD_FILE_SIZE) };
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

/**
 * Default: ".jpg,.jpeg,.png,.gif,.pdf,.txt"
 * Examples: 
 * - '* /*' (all extension) (without spaces)
 * Deprecated: "application/pdf,image/png,..."
 */
const default_allowed_extensions = process.env.UPLOAD_FILES_ALLOW_LIST || ".pdf,.png,.jpeg";


const fileFilter = (req, file, cb) => {
  const project = req.project;
  const pu = req.projectuser;

  let allowed_extensions;
  let allowed_mime_types;

  if (pu.roleType === 2 || pu.role === roleConstants.GUEST) {
    allowed_extensions = project?.widget?.allowedUploadExtentions || default_allowed_extensions;
  } else {
    allowed_extensions = project?.settings?.allowed_upload_extentions || default_allowed_extensions;
  }

  if (allowed_extensions !== "*/*") {
    allowed_mime_types = getMimeTypes(allowed_extensions);
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowed_extensions.includes(ext)) {
      const error = new Error("Extension not allowed");
      error.status = 403;
      return cb(error);
    }

    if (!allowed_mime_types.includes(file.mimetype)) {
      const error = new Error("Mimetype mismatch detected");
      error.status = 403;
      return cb(error);
    }
    cb(null, true);
  } else {
    cb(null, true);
  }
};

// multer dinamico in base al tipo di file
const getUploader = (req, file) => {
  const bucket = getBucketByFile(file);
  const fileService = new FileGridFsService(bucket);
  return multer({ storage: fileService.getStorage(bucket), fileFilter, limits: uploadlimits }).single('file');
};

router.post('/chat', [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
  roleChecker.hasRoleOrTypes('guest', ['bot','subscription']),
], async (req, res) => {

  const expireAt = new Date(Date.now() + chatFileExpirationTime * 1000);
  req.expireAt = expireAt;

  const upload = getUploader(req, req.file || { mimetype: req.headers['content-type'] || '' });
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      winston.error(`Multer replied with code ${err?.code} and message "${err?.message}"`);
      let status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).send({ success: false, msg: err.message, code: err.code });
    } else if (err) {
      winston.error(`General upload error: ${err?.message}`);
      return res.status(err?.status || 400).send({ success: false, msg: err.message });
    }

    try {
      const collection = getBucketByFile(req.file) + '.chunks';
      await mongoose.connection.db.collection(collection).updateMany(
        { files_id: req.file.id },
        { $set: { "metadata.expireAt": req.file.metadata.expireAt } }
      );
      return res.status(201).send({ message: "File uploaded successfully", filename: req.file.filename });
    } catch (err) {
      return res.status(500).send({ success: false, msg: "Error updating file chunks" });
    }
  });
});

router.post('/assets', [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
  roleChecker.hasRoleOrTypes('admin', ['bot','subscription']), 
], async (req, res) => {

  // expiration management
  let customExpiration = parseInt(req.query?.expiration, 10); // seconds
  const expireAt = !isNaN(customExpiration) 
    ? new Date(Date.now() + customExpiration*1000) 
    : new Date(Date.now() + 10*365*24*60*60*1000); // default 10 anni
  req.expireAt = expireAt;

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      let status = (err.code === "LIMIT_FILE_SIZE") ? 413 : 400;
      return res.status(status).send({ success: false, msg: err.message, code: err.code });
    } else if (err) {
      return res.status(err?.status || 400).send({ success: false, msg: err.message || "Error uploading file" });
    }

    try {
      // metadata update
      await mongoose.connection.db.collection('files.chunks').updateMany(
        { files_id: req.file.id },
        { $set: { "metadata.expireAt": req.file.metadata.expireAt } }
      );

      const ext = path.extname(req.file.originalname).toLowerCase();
      let thumbnail;

      // generate thumb for images
      if ([".png", ".jpg", ".jpeg", ".gif"].includes(ext)) {
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

    } catch(e) {
      winston.error("Error uploading asset", e);
      return res.status(500).send({ success: false, msg: "Error processing file" });
    }
  });
});


// router.post('/assets', [
//   passport.authenticate(['basic', 'jwt'], { session: false }),
//   validtoken,
//   roleChecker.hasRoleOrTypes('admin', ['bot','subscription']),
// ], async (req, res) => {
//   let customExpiration = parseInt(req.query?.expiration, 10);
//   req.expireAt = !isNaN(customExpiration)
//     ? new Date(Date.now() + customExpiration * 1000)
//     : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

//   const upload = getUploader(req, req.file || { mimetype: req.headers['content-type'] || '' });
//   upload(req, res, async (err) => {
//     if (err instanceof multer.MulterError) {
//       let status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
//       return res.status(status).send({ success: false, msg: err.message, code: err.code });
//     } else if (err) {
//       return res.status(err?.status || 400).send({ success: false, msg: err.message });
//     }

//     try {
//       const collection = getBucketByFile(req.file) + '.chunks';
//       await mongoose.connection.db.collection(collection).updateMany(
//         { files_id: req.file.id },
//         { $set: { "metadata.expireAt": req.file.metadata.expireAt } }
//       );
//       return res.status(201).send({ message: "File uploaded successfully", filename: req.file.filename });
//     } catch (err) {
//       return res.status(500).send({ success: false, msg: "Error updating file chunks" });
//     }
//   });
// });

router.get("/", [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
], (req, res) => {
  winston.debug('path', req.query.path);
  const fileService = new FileGridFsService("files");
  fileService.getFileDataAsStream(req.query.path).pipe(res);
});

router.get("/download", [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
], (req, res) => {
  winston.debug('path', req.query.path);
  let filename = pathlib.basename(req.query.path);
  res.attachment(filename);
  const fileService = new FileGridFsService("files");
  fileService.getFileDataAsStream(req.query.path).pipe(res);
});

function getMimeTypes(allowed_extension) {
  const extension = allowed_extension.split(',').map(e => e.trim().toLowerCase());
  const allowedMimeTypes = extension.map(ext => mime.lookup(ext)).filter(Boolean);
  return allowedMimeTypes;
}

module.exports = router;
