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




let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = {fileSize: parseInt(MAX_UPLOAD_FILE_SIZE)} ;
  winston.info("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.info("Max upload file size is infinity");
}
const upload = multer({ storage: fileService.getStorage("files"),limits: uploadlimits});




router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], upload.single('file'), (req, res, next) => {
  winston.debug("files/users");

  //file_retention
  mongoose.connection.db.collection('files.chunks').updateMany({"files_id": req.file.id},{ "$set": { "uploadDate": req.file.uploadDate } }, function (err, updates) {
    // https://www.mongodb.com/docs/manual/tutorial/expire-data/#specify-expiration-with-a-ttl-index
     
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

/*
curl \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/public/



  */

router.post('/public', upload.single('file'), (req, res, next) => {
  winston.debug("files/public")

  //file_retention
  mongoose.connection.db.collection('files.chunks').updateMany({"files_id": req.file.id},{ "$set": { "uploadDate": req.file.uploadDate } }, function (err, updates) {
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