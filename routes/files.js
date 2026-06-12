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
const { path } = require('../models/tag');

const fileService = new FileGridFsService("files");
const fallbackFileService = new FileGridFsService("images");




let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.info("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.info("Max upload file size is infinity");
}

let files_allowed = process.env.UPLOAD_FILES_ALLOW_LIST || "text/plain,application/octet-stream,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,audio/mpeg,application/json,application/pdf";
winston.info("Files upload allowed list " + files_allowed);

// const fileFilter = (req, file, cb) => {
//   winston.debug("fileFilter " + files_allowed);
//   const ext = file.originalname.toLowerCase().endsWith('.html') || file.originalname.toLowerCase().endsWith('.htm');

// DEPRECATED FROM VERSION 2.14.24
// router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], upload.single('file'), (req, res, next) => {

//   winston.verbose("files/users")
//   return res.status(201).json({
//     message: 'File uploded successfully',
//     filename: req.file.filename
//   });

// });

/*


curl \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/public/



  */

// DEPRECATED FROM VERSION 2.14.24
// router.post('/public', upload.single('file'), (req, res, next) => {
//   winston.debug("files/public")
//       return res.status(201).json({
//           message: 'File uploded successfully',
//           filename: req.file.filename
//       });    
// });




router.get("/", async (req, res) => {
  winston.debug('path', req.query.path);
  
  let fService = fileService;
  try {
    let file = await fileService.find(req.query.path);
    res.set({ "Content-Length": file.length});
    res.set({ "Content-Type": file.contentType});
  } catch (e) {
    if (e.code == "ENOENT") {
      winston.debug(`File ${req.query.path} not found on primary file service. Fallback to secondary.`)
      
      try {
        let file = await fallbackFileService.find(req.query.path)
        res.set({ "Content-Length": file.length });
        res.set({ "Content-Type": file.contentType });
        fService = fallbackFileService;
      } catch (e) {
        if (e.code == "ENOENT") {
          winston.debug(`File ${req.query.path} not found on secondary file service.`)
          return res.status(404).send({ success: false, error: 'File not found.' });
        } else {
          winston.error('Error getting file: ', e);
          return res.status(500).send({success: false, error: 'Error getting file.'});
        }
      }
    } else {
      winston.error('Error getting file', e);
      return res.status(500).send({success: false, error: 'Error getting file.'});
    }
  }
  
  fService.getFileDataAsStream(req.query.path).on('error', (e)=> {
    if (e.code == "ENOENT") {
      winston.debug('File not found: '+req.query.path);
      return res.status(404).send({success: false, error: 'File not found.'});
    } else {
      winston.error('Error getting the file', e);
      return res.status(500).send({success: false, error: 'Error getting file.'});
    }      
  }).pipe(res);
});


router.get("/download", async (req, res) => {
  winston.debug('path', req.query.path);
  let filename = pathlib.basename(req.query.path);
  winston.debug("filename:"+filename);

  let fService = fileService;
  try {
    await fileService.find(req.query.path);
  } catch (e) {
    if (e.code == "ENOENT") {
      winston.debug(`File ${req.query.path} not found on primary file service. Fallback to secondary.`)
      try {
        await fallbackFileService.find(req.query.path);
        fService = fallbackFileService;
      } catch (e) {
        if (e.code == "ENOENT") {
          winston.debug(`File ${req.query.path} not found on secondary file service.`)
          return res.status(404).send({ success: false, error: 'File not found.' });
        } else {
          winston.error('Error getting file: ', e);
          return res.status(500).send({success: false, error: 'Error getting file.'});
        }
      }
    } else {
      winston.error('Error getting file', e);
      return res.status(500).send({success: false, error: 'Error getting file.'});
    }
  }

  res.attachment(filename);
  fService.getFileDataAsStream(req.query.path).on('error', (e)=> {
    if (e.code == "ENOENT") {
      winston.debug('File not found: '+req.query.path);
      return res.status(404).send({success: false, error: 'File not found.'});
    } else {
      winston.error('Error getting the file', e);
      return res.status(500).send({success: false, error: 'Error getting file.'});
    }      
  }).pipe(res);
});



module.exports = router;