const express = require('express');
const router = express.Router();
const multer = require('multer');
const passport = require('passport');
require('../middleware/passport')(passport);
const validtoken = require('../middleware/valid-token')
const roleChecker = require('../middleware/has-role.js')
const winston = require('../config/winston');
const pathlib = require('path');
const sharp = require('sharp');
const FileGridFsService = require('../services/fileGridFsService.js');
const faq_kb = require('../models/faq_kb');
const project_user = require('../models/project_user');
const roleConstants = require('../models/roleConstants');
const fileService = new FileGridFsService("images");


let MAX_UPLOAD_FILE_SIZE = process.env.MAX_UPLOAD_FILE_SIZE;
let uploadlimits = undefined;
let images_allowed = process.env.UPLOAD_IMAGES_ALLOW_LIST || "image/jpeg,image/png,image/gif,image/vnd.microsoft.icon,image/webp";

if (MAX_UPLOAD_FILE_SIZE) {
  uploadlimits = { fileSize: parseInt(MAX_UPLOAD_FILE_SIZE) };
  winston.debug("Max upload file size is : " + MAX_UPLOAD_FILE_SIZE);
} else {
  winston.debug("Max upload file size is infinity");
}

const fileFilter = (req, file, cb) => {

  console.log("\n project: ", req.project)
  console.log("\n project user: ", req.projectuser);
  console.log("\n file: ", file.originalname);
  

  winston.debug("fileFilter " + images_allowed);
  const ext = file.originalname.toLowerCase().endsWith('.html') || file.originalname.toLowerCase().endsWith('.htm');

  if (ext) {
    winston.debug("file extension not allowed: " + file.originalname);
    cb(new multer.MulterError('fileFilter not allowed'));
    return;
  }

  if (images_allowed === "*" ||
    (images_allowed && images_allowed.length > 0 && images_allowed.split(",").indexOf(file.mimetype) > -1)) {
    winston.debug("file.mimetype allowed: " + file.mimetype);
    cb(null, true);
  } else {
    winston.debug("file.mimetype not allowed. " + file.mimetype);
    cb(new multer.MulterError('fileFilter not allowed'));
  }
};



function checkAllowedExtensions(req, res, next) {
  console.log("\n check allowed")
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  
}

const upload = multer({ storage: fileService.getStorage("images"), fileFilter: fileFilter, limits: uploadlimits }).single('file');
//const upload = multer({ storage: fileService.getStorage("images"), limits: uploadlimits });

router.post('/users',
  [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken, roleChecker.hasRoleOrTypes('guest', ['bot','subscription'])],
  upload,
  // checkAllowedExtensions,
  async (req, res) => {
    console.log("\nIMAGES")
    console.log("\nreq.file.originalname: ", req.file)

    console.log("\n--> project: ", req.project)
    console.log("\n--> project user: ", req.projectuser);
    
    return res.status(201).send({
      message: 'Image uploaded successfully',
      filename: req.file.originalname,
      //thumbnail: base64Thumb
    });
  }
)





// router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken],
//   // bodymiddleware, 
//   (req, res, next) => {

//     upload(req, res, function (err) {
//       winston.debug('upload:' + err);
//       if (err instanceof multer.MulterError) {
//         // A Multer error occurred when uploading.
//         winston.error('Permission denied uploading the image.', err);
//         return res.status(403).send({ success: false, msg: 'Permission denied uploading the image.' });
//       } else if (err) {
//         // An unknown error occurred when uploading.
//         winston.error('Error uploading the image.', err);
//         return res.status(500).send({ success: false, msg: 'Error uploading the image.' });
//       }

//       try {
//         // winston.info("req.query.folder1:"+req.body.folder);

//         var folder = req.folder || "error";
//         winston.debug("folder:" + folder);

//         var destinationFolder = 'uploads/users/' + req.user.id + "/images/" + folder + "/";
//         winston.debug("destinationFolder", destinationFolder);

//         var thumFilename = destinationFolder + 'thumbnails_200_200-' + req.file.originalname;


//         fileService.getFileDataAsBuffer(req.file.filename).then(function (buffer) {

//           sharp(buffer).resize(200, 200).toBuffer((err, resizeImage, info) => {
//             //in prod nn genera thumb
//             if (err) { winston.error("Error generating thumbnail", err); }
//             fileService.createFile(thumFilename, resizeImage, undefined, undefined);
//           });

//           return res.status(201).json({
//             message: 'Image uploded successfully',
//             filename: encodeURIComponent(req.file.filename),
//             thumbnail: encodeURIComponent(thumFilename)
//           });
//         });
//       } catch (error) {
//         winston.error('Error uploading user image.', error);
//         return res.status(500).send({ success: false, msg: 'Error uploading user image.' });
//       }
//     });
//   });


module.exports = router;