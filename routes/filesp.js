const express = require('express');
const router = express.Router();
const pathlib = require('path');
const mongoose = require('mongoose');
const multer  = require('multer');
const passport = require('passport');
const mime = require('mime-types');
const path = require('path');
const sharp = require('sharp');
const verifyFileContent = require('../middleware/file-type.js');

require('../middleware/passport.js')(passport);
const validtoken = require('../middleware/valid-token.js')
const roleChecker = require('../middleware/has-role.js');
const winston = require('../config/winston.js');
const FileGridFsService = require('../services/fileGridFsService.js');
const roleConstants = require('../models/roleConstants.js');

const fileService = new FileGridFsService("files");
const fallbackFileService = new FileGridFsService("images");;


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE || 1024000; // 1MB
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = { fileSize: parseInt(MAX_UPLOAD_FILE_SIZE) } ;
  winston.info("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.info("Max upload file size is infinity");
}

/**
 * Default: '2592000' (30 days)
 * Examples:
 * - '30' (30 seconds)
 */
const chatFileExpirationTime = parseInt(process.env.CHAT_FILE_EXPIRATION_TIME || '2592000', 10);

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
    console.log('[fileFilter] Starting file filter check', {
      extensionsSource,
      hasFile: !!file,
      fileName: file?.originalname,
      fileMimeType: file?.mimetype,
      fileFieldname: file?.fieldname,
      hasProject: !!req.project,
      hasProjectUser: !!req.projectuser
    });

    const project = req.project;
    const pu = req.projectuser;

    let allowed_extensions;
    let allowed_mime_types;

    if (extensionsSource === 'assets') {
      allowed_extensions = default_assets_allowed_extensions;
    } else {
      if (!pu) {
        console.log('[fileFilter] Project user not found');
        return cb(new Error("Project user not found"))
      }
      if (pu.roleType === 2 || pu.role === roleConstants.GUEST) {
        allowed_extensions = project?.widget?.allowedUploadExtentions || default_chat_allowed_extensions;
      } else {
        allowed_extensions = project?.settings?.allowed_upload_extentions || default_chat_allowed_extensions;
      }
    }
    
    console.log('[fileFilter] Allowed extensions:', allowed_extensions);
    
    if (allowed_extensions !== "*/*") {
      allowed_mime_types = getMimeTypes(allowed_extensions);
      if (!file.originalname) {
        return cb(new Error("File original name is required"));
      }
      const ext = path.extname(file.originalname).toLowerCase();

      if (!allowed_extensions.includes(ext)) {
        console.log('[fileFilter] Extension not allowed:', ext);
        const error = new Error(`File extension ${ext} is not allowed`);
        error.status = 403;
        return cb(error);
      }

      const expectedMimeType = mime.lookup(ext);
      if (expectedMimeType && file.mimetype !== expectedMimeType) {
        console.log('[fileFilter] Mime type mismatch:', { detected: file.mimetype, expected: expectedMimeType });
        const error = new Error(`File content does not match mimetype. Detected: ${file.mimetype}, provided: ${expectedMimeType}`);
        error.status = 403;
        return cb(error);
      }

      console.log('[fileFilter] File accepted');
      return cb(null, true);
    } else {
      console.log('[fileFilter] All extensions allowed (*/*)');
      return cb(null, true);
    }
  }
}

function getMimeTypes(allowed_extension) {
  const extension = allowed_extension.split(',').map(e => e.trim().toLowerCase());
  const allowedMimeTypes = extension.map(ext => mime.lookup(ext)).filter(Boolean);
  return allowedMimeTypes;
}

const uploadChat = multer({
  storage: fileService.getStorage("files"),
  fileFilter: fileFilter('chat'),
  limits: uploadlimits
}).single('file');

const uploadAssetsMulter = multer({
  storage: fileService.getStorage("files"),
  fileFilter: fileFilter('assets'),
  limits: uploadlimits
});

const uploadAssets = (req, res, next) => {
  const contentType = req.headers['content-type'];
  console.log('[uploadAssets middleware] Before multer processing', {
    contentType: contentType,
    contentLength: req.headers['content-length'],
    method: req.method,
    url: req.url,
    allHeaders: Object.keys(req.headers).reduce((acc, k) => {
      acc[k] = req.headers[k];
      return acc;
    }, {})
  });
  
  // Check if content-type is multipart/form-data
  if (!contentType || !contentType.includes('multipart/form-data')) {
    console.error('[uploadAssets middleware] Invalid content-type', {
      contentType: contentType,
      expected: 'multipart/form-data',
      allHeaders: req.headers
    });
    return res.status(400).send({ 
      success: false, 
      error: `Invalid content-type. Expected 'multipart/form-data', got '${contentType || 'undefined'}'` 
    });
  }
  
  uploadAssetsMulter.single('file')(req, res, (err) => {
    console.log('[uploadAssets middleware] After multer processing', {
      hasError: !!err,
      errorMessage: err?.message,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        id: req.file.id
      } : null,
      reqBody: req.body,
      contentType: req.headers['content-type']
    });
    next(err);
  });
};


// *********************** //
// ****** Endpoints ****** //
// *********************** //

router.post('/chat', [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
  roleChecker.hasRoleOrTypes('guest', ['bot','subscription'])
], async (req, res) => {

  const expireAt = new Date(Date.now() + chatFileExpirationTime * 1000);
  req.expireAt = expireAt;
  uploadChat(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      winston.error(`Multer replied with code ${err?.code} and message "${err?.message}"`);
      let status = 400;
      if (err?.code === 'LIMIT_FILE_SIZE') {
        status = 413;
      }
      return res.status(status).send({ success: false, error: err?.message || 'An error occurred while uploading the file', code: err.code });
    } else if (err) {
      // An unknown error occurred when uploading.
      winston.error(`Multer replied with status ${err?.status} and message "${err?.message}"`);
      let status = err?.status || 400;
      return res.status(status).send({ success: false, error: err.message || "An error occurred while uploading the file" })
    }
    try {
      const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
      await verifyFileContent(buffer, req.file.mimetype);
      await mongoose.connection.db.collection('files.chunks').updateMany(
        { files_id: req.file.id },
        { $set: { "metadata.expireAt": req.file.metadata.expireAt }}
      )
      return res.status(201).send({ message: "File uploaded successfully", filename: req.file.filename })
    } catch (err) {
      if (err?.source === "FileContentVerification") {
        let error_message = err?.message || "Content verification failed";
        winston.warn("File content verification failed. Message: ", error_message);
        return res.status(403).send({ success: false, error: error_message })
      }
      winston.error("Error saving file: ", err);
      return res.status(500).send({ success: false, error: "Error updating file chunks" });
    }
  })

})


router.post('/assets', [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
  roleChecker.hasRoleOrTypes('agent', ['bot','subscription']),
  (req, res, next) => {
    console.log('[POST /assets] Before uploadAssets middleware', {
      method: req.method,
      contentType: req.headers['content-type'],
      allContentHeaders: Object.keys(req.headers).filter(k => k.toLowerCase().includes('content')).reduce((acc, k) => {
        acc[k] = req.headers[k];
        return acc;
      }, {}),
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      query: req.query,
      hasProject: !!req.project,
      hasProjectUser: !!req.projectuser
    });
    next();
  }
], async (req, res) => {
  console.log('[POST /assets] Request received', {
    method: req.method,
    contentType: req.headers['content-type'],
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    query: req.query,
    hasProject: !!req.project,
    hasProjectUser: !!req.projectuser
  });

  let customExpiration = parseInt(req.query?.expiration, 10);
  let expireAt;
  if (customExpiration && !isNaN(customExpiration)) {
    expireAt = new Date(Date.now() + customExpiration * 1000);
  } else {
    expireAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // default 10 year
  }
  req.expireAt = expireAt;
  
  console.log('[POST /assets] Expiration set', { expireAt });

  uploadAssets(req, res, async (err) => {
    console.log('[uploadAssets] Callback invoked', {
      hasError: !!err,
      errorType: err?.constructor?.name,
      isMulterError: err instanceof multer.MulterError,
      errorCode: err?.code,
      errorMessage: err?.message,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        id: req.file.id,
        hasMetadata: !!req.file.metadata
      } : null,
      reqBody: req.body,
      reqFiles: req.files,
      reqFileKeys: Object.keys(req).filter(k => k.includes('file'))
    });

    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      winston.error(`Multer replied with code ${err?.code} and message "${err?.message}"`);
      let status = 400;
      if (err?.code === 'LIMIT_FILE_SIZE') {
        status = 413;
      }
      return res.status(status).send({ success: false, error: err?.message || 'An error occurred while uploading the file', code: err.code });
    } else if (err) {
      // An unknown error occurred when uploading.
      winston.error(`Multer replied with status ${err?.status} and message "${err?.message}"`);
      let status = err?.status || 400;
      return res.status(status).send({ success: false, error: err.message || "An error occurred while uploading the file" })
    }

    console.log('[uploadAssets] Before file processing', {
      hasFile: !!req.file,
      reqFileType: typeof req.file,
      reqFileValue: req.file
    });

    if (!req.file) {
      console.error('[uploadAssets] req.file is undefined!', {
        reqKeys: Object.keys(req),
        reqBody: req.body,
        reqFiles: req.files,
        contentType: req.headers['content-type'],
        method: req.method
      });
      winston.error("Error uploading asset: req.file is undefined");
      return res.status(400).send({ success: false, error: "No file was uploaded" });
    }

    try {
      console.log('[uploadAssets] Processing file', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
      console.log('[uploadAssets] File buffer retrieved', { bufferSize: buffer?.length });
      
      await verifyFileContent(buffer, req.file.mimetype);
      console.log('[uploadAssets] File content verified');

      // metadata update
      console.log('[uploadAssets] Updating metadata', {
        fileId: req.file.id,
        expireAt: req.file.metadata?.expireAt
      });
      
      await mongoose.connection.db.collection('files.chunks').updateMany(
        { files_id: req.file.id },
        { $set: { "metadata.expireAt": req.file.metadata.expireAt }}
      )
      console.log('[uploadAssets] Metadata updated');

      const ext = path.extname(req.file.originalname).toLowerCase();
      console.log('[uploadAssets] File extension:', ext);
      let thumbnail;

      // generate thumb for iages
      if (images_extensions.includes(ext)) {
        console.log('[uploadAssets] Generating thumbnail for image');
        const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
        const thumbFilename = req.file.filename.replace(/([^/]+)$/, "thumbnails_200_200-$1");
        console.log('[uploadAssets] Thumbnail filename:', thumbFilename);
        const resized = await sharp(buffer).resize(200, 200).toBuffer();
        await fileService.createFile(thumbFilename, resized, undefined, undefined, { metadata: { expireAt }});
        await mongoose.connection.db.collection('files.chunks').updateMany(
          { files_id: ( await fileService.find(thumbFilename))._id },
          { $set: { "metadata.expireAt": expireAt }}
        );
        thumbnail = thumbFilename;
        console.log('[uploadAssets] Thumbnail created');
      }

      return res.status(201).send({
        message: 'File uploaded successfully',
        filename: encodeURIComponent(req.file.filename),
        thumbnail: thumbnail ? encodeURIComponent(thumbnail) : undefined
      })

    } catch (err) {
      console.error('[uploadAssets] Error caught in try block', {
        errorMessage: err?.message,
        errorStack: err?.stack,
        errorSource: err?.source,
        hasFile: !!req.file,
        fileInfo: req.file ? {
          filename: req.file.filename,
          originalname: req.file.originalname
        } : null
      });

      if (err?.source === "FileContentVerification") {
        let error_message = err?.message || "Content verification failed";
        winston.warn("File content verification failed. Message: ", error_message);
        return res.status(403).send({ success: false, error: error_message })
      }

      winston.error("Error uploading asset", err);
      return res.status(500).send({ success: false, error: "Error uploading asset" });

    }
  })
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
          return res.status(404).send({ success: false, error: 'File not found.' });
        }else {
          winston.error('Error getting file: ', e);
          return res.status(500).send({success: false, error: 'Error getting file.'});
        }
      }

    } else {
      winston.error('Error getting file', e);
      return res.status(500).send({success: false, error: 'Error getting file.'});
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


module.exports = router;