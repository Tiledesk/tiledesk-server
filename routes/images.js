var express = require('express');
const multer  = require('multer');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var winston = require('../config/winston');


var router = express.Router();


const sharp = require('sharp');




const FileGridFsService = require('../services/fileGridFsService.js');

const fileService = new FileGridFsService("images");





const fileFilter = (req, file, cb) => {
  if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
      cb(null, true);
  } else {
      cb(null, false);
  }
}




const upload = multer({ storage: fileService.getStorage("images"), fileFilter: fileFilter });

/*
curl -u andrea.leo@f21.it:123456 \
  -F "userid=1" \
  -F "filecomment=This is an image file" \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  http://localhost:3000/images/users/


  curl -u andrea.leo@frontiere21.it:258456td \
  -F "userid=1" \
  -F "filecomment=This is an image file" \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  https://tiledesk-server-pre.herokuapp.com/images/users/

  */

router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], upload.single('file'), (req, res, next) => {
  try {
    var uuidv4_storage = req.uuidv4_storage || "error";
    winston.debug("uuidv4_storage",uuidv4_storage);

     var destinationFolder = 'uploads/users/' + req.user.id + "/images/" + uuidv4_storage +"/";
     winston.debug("destinationFolder",destinationFolder);

     var thumFilename = destinationFolder+'thumbnails_200_200-' + req.file.originalname;


     fileService.getFileDataAsBuffer(req.file.filename).then(function(buffer) {

      sharp(buffer).resize(200, 200).toBuffer((err, resizeImage, info) => {
        //in prod nn genera thumb
        if (err) { winston.error("Error generating thumbnail", err); }
        fileService.createFile ( thumFilename, resizeImage, undefined, undefined);
      });

      return res.status(201).json({
          message: 'Image uploded successfully',
          filename: req.file.filename,
          thumbnail: thumFilename
      });
    });
  } catch (error) {
    winston.error(error);
  }
});

/*
curl \
  -F "userid=1" \
  -F "filecomment=This is an image file" \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  http://localhost:3000/images/public/

  */

  
/*
{% api-method method="post" host="https://api.tiledesk.com" path="/v2/images/public" %}
{% api-method-summary %}
Upload a public image
{% endapi-method-summary %}

{% api-method-description %}
Allows to upload an image without autentication
{% endapi-method-description %}

{% api-method-spec %}
{% api-method-request %}
{% api-method-path-parameters %}
{% endapi-method-path-parameters %}

{% api-method-headers %}

{% api-method-parameter name="Content-Type" type="string" required=true %}
use "multipart/form-data" value
{% endapi-method-parameter %}
{% endapi-method-headers %}

{% api-method-body-parameters %}
{% api-method-parameter name="file" type="binary" required=true %}
the image binary file
{% endapi-method-parameter %}

{% endapi-method-body-parameters %}
{% endapi-method-request %}

{% api-method-response %}
{% api-method-response-example httpCode=200 %}
{% api-method-response-example-description %}

{% endapi-method-response-example-description %}

```text
  {
    "message":"File uploded successfully",
    "filename":"uploads/public/images/a96e1fc5-a331-4d3d-bb03-2244cbf71640/test.jpg"
  }
```
{% endapi-method-response-example %}
{% endapi-method-response %}
{% endapi-method-spec %}
{% endapi-method %}

Example:

```text
curl -v -X POST -H 'Content-Type: multipart/form-data' -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" https://api.tiledesk.com/v2/images/public
```
*/

router.post('/public', upload.single('file'), (req, res, next) => {
  try {
     winston.debug("req",req);
     var uuidv4_storage = req.uuidv4_storage || "error";
     winston.debug("uuidv4_storage",uuidv4_storage);

     var destinationFolder = "uploads/public/images/" + uuidv4_storage +"/";
     winston.debug("destinationFolder",destinationFolder);

     winston.debug("req.file.filename",req.file.filename);

     var thumFilename = destinationFolder+'thumbnails_200_200-' + req.file.originalname;          


     fileService.getFileDataAsBuffer(req.file.filename).then(function(buffer) {

        sharp(buffer).resize(200, 200).toBuffer((err, resizeImage, info) => {
            if (err) { winston.error("Error generating thumbnail", err); }
            fileService.createFile ( thumFilename, resizeImage, undefined, undefined);
        });


        return res.status(201).json({
            message: 'Image uploded successfully',
            filename: req.file.filename,
            thumbnail: thumFilename
        });
      });
      

     
  } catch (error) {
      console.error(error);
  }
});


// router.use('/uploads', express.static(path.join(__dirname, '/uploads')));
// router.use('/uploads', function timeLog(req, res, next) {
//   winston.debug('Time: ', Date.now());
//   var a = express.static(path.join(__dirname, '/uploads'))
//   winston.debug('Time2: ', a);
//   return a;
// }, express.static(path.join(__dirname, '/uploads')));

// curl -X GET 'http://localhost:3000/images/thumbnails?width=10&height=10'
router.get('/thumbnails', (req, res) => {
  // Extract the query-parameter
  const widthString = req.query.width
  const heightString = req.query.height
  const format = req.query.format

  // Parse to integer if possible
  let width, height
  if (widthString) {
    width = parseInt(widthString)
  }
  if (heightString) {
    height = parseInt(heightString)
  }
  // Set the content-type of the response
  res.type(`image/${format || 'png'}`)

  // Get the resized image
  sharp('test.jpg').resize(width, height).pipe(res)
  // sharp('nodejs.png').resize(format, width, height).pipe(res)
})


router.get("/", (req, res) => {
  winston.debug('path', req.query.path);
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

// router.get('/', 
//  function (req, res) {
//     res.send('{"success":true}');
// });
  
  
  // router.get('/', 
  // expresssharp.expressSharp({
  //     imageAdapter: new expresssharp.FsAdapter(path.join(__dirname, 'images')),
  //   })
  // );
  

module.exports = router;