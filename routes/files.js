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

let files_allowed = process.env.UPLOAD_FILES_ALLOW_LIST || "text/html,text/plain,application/octet-stream,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,audio/mpeg,application/json,application/pdf";
winston.info("Files upload allowed list "+ files_allowed);


//  curl -u andrea.leo@f21.it:123456 -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/public/wstest/index.html;type=text/plain"   http://localhost:3000/files/users/

const fileFilter = (req, file, cb) => {
  winston.debug("fileFilter "+ files_allowed);
  winston.debug("fileFilter file" , file);

  winston.debug("req.file ",req.file);

  

  if (files_allowed==="*" || (files_allowed && files_allowed.length>0 && files_allowed.split(",").indexOf(file.mimetype)>-1) ) {
     winston.debug("file.mimetype allowed: "+ file.mimetype);
      cb(null, true);
  } else {
      winston.debug("file.mimetype not allowed. " + file.mimetype);
      // cb(null, false);
      cb(new multer.MulterError('fileFilter not allowed'))
  }
}


const upload = multer({ storage: fileService.getStorage("files"),  fileFilter: fileFilter, limits: uploadlimits}).single('file');

/*

curl -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/users/

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




router.get("/", (req, res) => {
  winston.debug('path', req.query.path);
  // if (path.indexOf("/users/"))
  fileService.getFileDataAsStream(req.query.path).pipe(res);
  // const file = gfs
  //   .find({
  //     filename: req.query.path
  //   })
  //   .toArray((err, files) => {
  //     if (!files || files.length === 0) {
  //       return res.status(404).json({
  //         err: "no files exist"
  //       });
  //     }
  //     gfs.openDownloadStreamByName(req.query.path).pipe(res);
  //   });
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