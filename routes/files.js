var express = require('express');
const multer  = require('multer');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var winston = require('../config/winston');


var router = express.Router();



const FileGridFsService = require('../services/fileGridFsService.js');
const { path } = require('../models/tag');

const fileService = new FileGridFsService("files");





const upload = multer({ storage: fileService.getStorage("files") });

/*
curl -u andrea.leo@f21.it:123456 \
  -F "userid=1" \
  -F "filecomment=This is an image file" \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/users/

  */

router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], upload.single('file'), (req, res, next) => {
 
      return res.status(201).json({
          message: 'File uploded successfully',
          filename: req.file.filename
      });    

});

/*
curl \
  -F "userid=1" \
  -F "filecomment=This is an image file" \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/README.md" \
  http://localhost:3000/files/public/

  */

router.post('/public', upload.single('file'), (req, res, next) => {
  
      return res.status(201).json({
          message: 'File uploded successfully',
          filename: req.file.filename
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


module.exports = router;