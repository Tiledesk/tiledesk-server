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
const faq_kb = require('../models/faq_kb');
const project_user = require('../models/project_user');

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
const default_assets_allowed_extensions = process.env.ASSETS_FILES_ALLOW_LIST || ".jpg,.jpeg,.png,.gif,.pdf,.txt,.csv,.doc,.docx"; //,.xls,.xlsx,.ppt,.pptx,.zip,.rar
const images_extensions = [ ".png", ".jpg", ".jpeg", ".gif" ];

const fileFilter = (extensionsSource = 'chat') => {
  return (req, file, cb) => {

    const project = req.project;
    const pu = req.projectuser;

    let allowed_extensions;
    let allowed_mime_types;

    if (extensionsSource === 'avatar') {
      // Avatar only accepts image extensions
      allowed_extensions = images_extensions.join(',');
    } else if (extensionsSource === 'assets') {
      allowed_extensions = default_assets_allowed_extensions;
    } else if (pu.roleType === 2 || pu.role === roleConstants.GUEST) {
      allowed_extensions = project?.widget?.allowedUploadExtentions || default_chat_allowed_extensions;
    } else {
      allowed_extensions = project?.settings?.allowed_upload_extentions || default_chat_allowed_extensions;
    }

    if (allowed_extensions !== "*/*") {
      allowed_mime_types = getMimeTypes(allowed_extensions);
      if (!file.originalname) {
        return cb(new Error("File original name is required"));
      }
      const ext = path.extname(file.originalname).toLowerCase();

      if (!allowed_extensions.includes(ext)) {
        const error = new Error(`File extension ${ext} is not allowed${extensionsSource === 'avatar' ? ' for avatar' : ''}`);
        error.status = 403;
        return cb(error);
      }

      const expectedMimeType = mime.lookup(ext);
      if (expectedMimeType && file.mimetype !== expectedMimeType) {
        const error = new Error(`File content does not match mimetype. Detected: ${file.mimetype}, provided: ${expectedMimeType}`);
        error.status = 403;
        return cb(error);
      }

      return cb(null, true);
    } else {
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

const uploadAssets = multer({
  storage: fileService.getStorageProjectAssets("files"),
  fileFilter: fileFilter('assets'),
  limits: uploadlimits
}).single('file');

const uploadAvatar = multer({
  storage: fileService.getStorageAvatarFiles("files"),
  fileFilter: fileFilter('avatar'),
  limits: uploadlimits
}).single('file');


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
  roleChecker.hasRoleOrTypes('admin', ['bot','subscription'])
], async (req, res) => {
  // Assets have no retention by default, but can be set via query parameter
  let customExpiration = parseInt(req.query?.expiration, 10);
  if (customExpiration && !isNaN(customExpiration) && customExpiration > 0) {
    req.expireAt = new Date(Date.now() + customExpiration * 1000);
  }


  uploadAssets(req, res, async (err) => {
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

      if (req.file.metadata && req.file.metadata.expireAt) {
        await mongoose.connection.db.collection('files.chunks').updateMany(
          { files_id: req.file.id },
          { $set: { "metadata.expireAt": req.file.metadata.expireAt }}
        );
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      let thumbnail;

      // Generate thumbnail for images
      if (images_extensions.includes(ext)) {
        const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
        const thumbFilename = req.file.filename.replace(/([^/]+)$/, "thumbnails_200_200-$1");
        const resized = await sharp(buffer).resize(200, 200).toBuffer();
        
        const thumbMetadata = req.expireAt ? { metadata: { expireAt: req.expireAt } } : undefined;
        // Use the same contentType as the original file for the thumbnail
        await fileService.createFile(thumbFilename, resized, undefined, req.file.mimetype, thumbMetadata);
        
        if (req.expireAt) {
          await mongoose.connection.db.collection('files.chunks').updateMany(
            { files_id: ( await fileService.find(thumbFilename))._id },
            { $set: { "metadata.expireAt": req.expireAt }}
          );
        }
        thumbnail = thumbFilename;
      }

      return res.status(201).send({
        message: 'File uploaded successfully',
        filename: encodeURIComponent(req.file.filename),
        thumbnail: thumbnail ? encodeURIComponent(thumbnail) : undefined
      })

    } catch (err) {
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

/**
 * Upload user profile photo or bot avatar
 * Path: uploads/users/{user_id|bot_id}/images/photo.jpg
 * This maintains compatibility with clients that expect fixed paths.
 * Profile photos/avatars have no retention.
 */
router.post('/users/photo', [
  passport.authenticate(['basic', 'jwt'], { session: false }),
  validtoken,
  roleChecker.hasRoleOrTypes('agent', ['bot','subscription'])
], async (req, res) => {

  uploadAvatar(req, res, async (err) => {
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
      winston.debug("/users/photo");
  
      if (!req.file) {
        return res.status(400).send({ success: false, error: 'No file uploaded' });
      }
  
      let userid = req.user.id;
      let bot_id;
      let entity_id = userid;
  
      if (req.query.bot_id) {
        bot_id = req.query.bot_id;
  
        let chatbot = await faq_kb.findById(bot_id).catch((err) => {
          winston.error("Error finding bot ", err);
          return res.status(500).send({ success: false, error: "Unable to find chatbot with id " + bot_id });
        });
  
        if (!chatbot) {
          return res.status(404).send({ success: false, error: "Chatbot not found" });
        }
  
        let id_project = chatbot.id_project;
  
        let puser = await project_user.findOne({ id_user: userid, id_project: id_project }).catch((err) => {
          winston.error("Error finding project user: ", err);
          return res.status(500).send({ success: false, error: "Unable to find project user for user " + userid + "in project " + id_project });
        });
  
        if (!puser) {
          winston.warn("User " + userid + " doesn't belong to the project " + id_project);
          return res.status(401).send({ success: false, error: "You don't belong to the chatbot's project" });
        }
  
        if ((puser.role !== roleConstants.ADMIN) && (puser.role !== roleConstants.OWNER)) {
          winston.warn("User with role " + puser.role + " can't modify the chatbot");
          return res.status(403).send({ success: false, error: "You don't have the role required to modify the chatbot" });
        }
  
        entity_id = bot_id;
      }
  
      var destinationFolder = 'uploads/users/' + entity_id + "/images/";
      winston.debug("destinationFolder:" + destinationFolder);
  
      var thumFilename = destinationFolder + 'thumbnails_200_200-photo.jpg';
  
      winston.debug("req.file.filename:" + req.file.filename);
      const buffer = await fileService.getFileDataAsBuffer(req.file.filename);
  
      try {
        const resizeImage = await sharp(buffer).resize(200, 200).toBuffer();
        // Use the same contentType as the original file for the thumbnail
        await fileService.createFile(thumFilename, resizeImage, undefined, req.file.mimetype);
        let thumFile = await fileService.find(thumFilename);
        winston.debug("thumFile", thumFile);
  
        return res.status(201).json({
          message: 'Image uploaded successfully',
          filename: encodeURIComponent(req.file.filename),
          thumbnail: encodeURIComponent(thumFilename)
        });
      } catch (thumbErr) {
        winston.error("Error generating or creating thumbnail", thumbErr);
        // Still return success for the main file, but log thumbnail error
        return res.status(201).json({
          message: 'Image uploaded successfully',
          filename: encodeURIComponent(req.file.filename),
          thumbnail: undefined
        });
      }
  
    } catch (error) {
      winston.error('Error uploading user image.', error);
      return res.status(500).send({ success: false, error: 'Error uploading user image.' });
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

/**
 * Delete a file (and its thumbnail if it's an image)
 * Works for both profile photos/avatars and project assets
 * 
 * Example:
 * curl -v -X DELETE -u user:pass \
 *   http://localhost:3000/filesp?path=uploads%2Fusers%2F65c5f3599faf2d04cd7da528%2Fimages%2Fphoto.jpg
 * 
 * curl -v -X DELETE -u user:pass \
 *   http://localhost:3000/filesp?path=uploads%2Fprojects%2F65c5f3599faf2d04cd7da528%2Ffiles%2Fuuid%2Flogo.png
 */
router.delete("/", [
  passport.authenticate(['basic', 'jwt'], { session: false }), 
  validtoken,
], async (req, res) => {
  try {
    winston.debug("delete file");
    
    let filePath = req.query.path;
    if (!filePath) {
      return res.status(400).send({ success: false, error: 'Path parameter is required' });
    }
    
    winston.debug("path:" + filePath);

    let filename = pathlib.basename(filePath);
    winston.debug("filename:" + filename);

    if (!filename) {
      winston.warn('Error deleting file. No filename specified:' + filePath);
      return res.status(400).send({ success: false, error: 'No filename specified in path' });
    }

    // Determine which service to use based on path
    // Try primary service first (files bucket)
    let fService = fileService;
    let fileExists = false;
    
    try {
      await fileService.find(filePath);
      fileExists = true;
    } catch (e) {
      if (e.code == "ENOENT") {
        winston.debug(`File ${filePath} not found on primary file service. Trying fallback.`);
        try {
          await fallbackFileService.find(filePath);
          fService = fallbackFileService;
          fileExists = true;
        } catch (e2) {
          if (e2.code == "ENOENT") {
            winston.debug(`File ${filePath} not found on fallback file service.`);
            return res.status(404).send({ success: false, error: 'File not found.' });
          } else {
            winston.error('Error checking file on fallback service: ', e2);
            return res.status(500).send({ success: false, error: 'Error checking file existence.' });
          }
        }
      } else {
        winston.error('Error checking file on primary service: ', e);
        return res.status(500).send({ success: false, error: 'Error checking file existence.' });
      }
    }

    // Delete the main file
    try {
      const deletedFile = await fService.deleteFile(filePath);
      winston.debug("File deleted successfully:", deletedFile.filename);

      // Check if this is an image and try to delete thumbnail
      // Thumbnail pattern: thumbnails_200_200-{filename}
      // For profile photos: thumbnails_200_200-photo.jpg
      // For assets: thumbnails_200_200-{original_filename}
      const isImage = images_extensions.some(ext => filename.toLowerCase().endsWith(ext));
      
      if (isImage) {
        let thumbFilename = 'thumbnails_200_200-' + filename;
        let thumbPath = filePath.replace(filename, thumbFilename);
        winston.debug("thumbPath:" + thumbPath);

        try {
          // Try to delete thumbnail from the same service
          await fService.deleteFile(thumbPath);
          winston.debug("Thumbnail deleted successfully:" + thumbPath);
        } catch (thumbErr) {
          // Thumbnail might not exist or be in different service, try fallback
          if (thumbErr.code == "ENOENT" || thumbErr.msg == "File not found") {
            winston.debug(`Thumbnail ${thumbPath} not found on ${fService === fileService ? 'primary' : 'fallback'} service. Trying other service.`);
            
            const otherService = fService === fileService ? fallbackFileService : fileService;
            try {
              await otherService.deleteFile(thumbPath);
              winston.debug("Thumbnail deleted from fallback service:" + thumbPath);
            } catch (fallbackThumbErr) {
              // Thumbnail doesn't exist, that's ok
              winston.debug(`Thumbnail ${thumbPath} not found on fallback service either. Skipping.`);
            }
          } else {
            winston.error('Error deleting thumbnail:', thumbErr);
            // Don't fail the whole request if thumbnail deletion fails
          }
        }
      }

      return res.status(200).json({
        message: 'File deleted successfully',
        filename: encodeURIComponent(deletedFile.filename)
      });

    } catch (deleteErr) {
      winston.error('Error deleting file:', deleteErr);
      return res.status(500).send({ success: false, error: 'Error deleting file.' });
    }

  } catch (error) {
    winston.error('Error in delete endpoint:', error);
    return res.status(500).send({ success: false, error: 'Error deleting file.' });
  }
});


module.exports = router;