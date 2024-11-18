var express = require('express');
const multer  = require('multer');
var passport = require('passport');
require('../middleware/passport')(passport);
var validtoken = require('../middleware/valid-token')
var winston = require('../config/winston');
var pathlib = require('path');

var router = express.Router();


const sharp = require('sharp');




const FileGridFsService = require('../services/fileGridFsService.js');
const faq_kb = require('../models/faq_kb');
const project_user = require('../models/project_user');
const roleConstants = require('../models/roleConstants');

const fileService = new FileGridFsService("images");





const fileFilter = (req, file, cb) => {
  if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png' 
      || file.mimetype == 'image/gif'|| file.mimetype == 'image/vnd.microsoft.icon'
      || file.mimetype == 'image/webp') {
      cb(null, true);
  } else {
      cb(null, false);
  }
}

// const bodymiddleware = function(req, res, next) {
//   winston.info("YYYYYY req.body.folder:"+req.body.folder);
//   winston.info("YYYYYY req.body:",req.body);
//   next();
// }


const upload = multer({ storage: fileService.getStorage("images"), fileFilter: fileFilter });

/*
curl -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  http://localhost:3000/images/users/


  curl -u andrea.leo@frontiere21.it:123 \ 
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  https://tiledesk-server-pre.herokuapp.com/images/users/

  */

router.post('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken],
// bodymiddleware, 
upload.single('file'), (req, res, next) => {
  try {
    // winston.info("req.query.folder1:"+req.body.folder);

    var folder = req.folder || "error";
    winston.debug("folder:"+folder);

     var destinationFolder = 'uploads/users/' + req.user.id + "/images/" + folder +"/";
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
          filename: encodeURIComponent(req.file.filename),
          thumbnail: encodeURIComponent(thumFilename)
      });
    });
  } catch (error) {
    winston.error('Error uploading user image.',error);
    return res.status(500).send({success: false, msg: 'Error uploading user image.'});
  }
});






const uploadFixedFolder = multer({ storage: fileService.getStorageFixFolder("images"), fileFilter: fileFilter });

/*
curl -v -X PUT -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  http://localhost:3000/images/users/


  curl -v -X PUT -u andrea.leo@frontiere21.it:123 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
    https://tiledesk-server-pre.herokuapp.com/images/users/

  */
router.put('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken],
// bodymiddleware, 
uploadFixedFolder.single('file'), (req, res, next) => {
  try {
    winston.debug("/users/folder");
    // winston.info("req.query.folder1:"+req.body.folder);

    // var folder = req.folder || "error";
    // winston.info("folder:"+folder);

    if (req.upload_file_already_exists) {
      winston.warn('Error uploading photo image, file already exists',req.file.filename );
      return res.status(409).send({success: false, msg: 'Error uploading user image, file already exists'});
    }

     var destinationFolder = 'uploads/users/' + req.user.id + "/images/";
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
          filename: encodeURIComponent(req.file.filename),
          thumbnail: encodeURIComponent(thumFilename)
      });
    });
  } catch (error) {
    winston.error('Error uploading user image.',error);
    return res.status(500).send({success: false, msg: 'Error uploading user image.'});
  }
});









const uploadAvatar= multer({ storage: fileService.getStorageAvatar("images"), fileFilter: fileFilter });

/*
curl -v -X PUT -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
  http://localhost:3000/images/users/photo

  curl -v -X PUT -u andrea.leo@f21.it:123456 \
  -F "file=@/Users/andrealeo/Downloads/aa2.jpg" \
  http://localhost:3000/images/users/photo

  curl -v -X PUT -u andrea.leo@frontiere21.it:258456td \
  -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" \
    https://tiledesk-server-pre.herokuapp.com/images/users/photo

  */
router.put('/users/photo', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken],
// bodymiddleware, 
uploadAvatar.single('file'), async (req, res, next) => {
  try {
    winston.debug("/users/photo");

    if (req.upload_file_already_exists) {
      winston.warn('Error uploading photo image, file already exists',req.file.filename );
      return res.status(409).send({success: false, msg: 'Error uploading photo image, file already exists'});
    }

    let userid = req.user.id;
    let bot_id;
    let entity_id = userid;

    // if (req.query.user_id) {
    //   userid = req.query.user_id;
    // }
    
    if (req.query.bot_id) {
      bot_id = req.query.bot_id;

      let chatbot = await faq_kb.findById(bot_id).catch((err) => {
        winston.error("Error finding bot ", err);
        return res.status(500).send({ success: false, error: "Unable to find chatbot with id " + bot_id });
      })

      if (!chatbot) {
        return res.status(404).send({ success: false, error: "Chatbot not found" })
      }

      let id_project = chatbot.id_project;

      let puser = await project_user.findOne({ id_user: userid, id_project: id_project }).catch((err) => {
        winston.error("Error finding project user: ", err);
        return res.status(500).send({ success: false, error: "Unable to find project user for user " + userid + "in project " + id_project });
      })
      if (!puser) {
        winston.warn("User" + userid + "don't belongs the project " + id_project);
        return res.status(401).send({ success: false, error: "You don't belong the chatbot's project" })
      }

      if ((puser.role !== roleConstants.ADMIN) && (puser.role !== roleConstants.OWNER)) {
        winston.warn("User with role " + puser.role + "can't modify the chatbot");
        return res.status(403).send({ success: false, error: "You don't have the role required to modify the chatbot" });
      }

      entity_id = bot_id;
    }

     var destinationFolder = 'uploads/users/' + entity_id + "/images/";
     winston.debug("destinationFolder:"+destinationFolder);

     var thumFilename = destinationFolder+'thumbnails_200_200-photo.jpg';

     winston.debug("req.file.filename:"+req.file.filename);
     fileService.getFileDataAsBuffer(req.file.filename).then(function(buffer) {

      sharp(buffer).resize(200, 200).toBuffer((err, resizeImage, info) => {
        //in prod nn genera thumb
        if (err) { winston.error("Error generating thumbnail", err); }
        fileService.createFile ( thumFilename, resizeImage, undefined, undefined);
      });

      return res.status(201).json({
          message: 'Image uploded successfully',
          filename: encodeURIComponent(req.file.filename),
          thumbnail: encodeURIComponent(thumFilename)
      }); 
    });
  } catch (error) {
    winston.error('Error uploading user image.',error);
    return res.status(500).send({success: false, msg: 'Error uploading user image.'});
  }
});






/*
curl -v -X DELETE -u andrea.leo@f21.it:123456 \
  http://localhost:3000/images/users/?path=uploads%2Fusers%2F609bf8157bf5ca7ef7160197%2Fimages%2Ftest.jpg

curl -v -X DELETE  -u andrea.leo@frontiere21.it:123 \
   https://tiledesk-server-pre.herokuapp.com/images/users/?path=uploads%2Fusers%2F5aaa99024c3b110014b478f0%2Fimages%2Fphoto.jpg
 
*/

router.delete('/users', [passport.authenticate(['basic', 'jwt'], { session: false }), validtoken], (req, res, next) => {
  try {
    winston.debug("delete /users");

    let path = req.query.path;
    winston.debug("path:"+path);

    // TODO later if enabled there is problem when admin delete a bot image
    // if (path.indexOf("/"+req.user.id+"/")==-1) {
    //   winston.warn('Permission denied to delete image:'+path);
    //   return res.status(403).send({success: false, msg: 'Permission denied to delete image:'+path});
    // }

    let filename = pathlib.basename(path);
    winston.debug("filename:"+filename);

    if (!filename) {
      winston.warn('Error delete image. No filename specified:'+path);
      return res.status(500).send({success: false, msg: 'Error delete image. No filename specified:'+path});
    }

  

    fileService.deleteFile(path).then(function(data) {

      let thumbFilename = 'thumbnails_200_200-'+filename;
      winston.debug("thumbFilename:"+thumbFilename);

      let thumbPath = path.replace(filename,thumbFilename);
      winston.debug("thumbPath:"+thumbPath);

      fileService.deleteFile(thumbPath).then(function(data) {
        winston.debug("thumbFilename deleted:"+thumbPath);
      }).catch(function(error) {
        winston.error('Error deleting thumbnail image.',error);
      });

      return res.status(200).json({
          message: 'Image deleted successfully',
          filename: encodeURIComponent(data.filename)
      });
    }).catch(function(error) {
      winston.error('Error deleting image.',error);
      return res.status(500).send({success: false, msg: 'Error deleting image.'});
    });

  } catch (error) {
    winston.error('Error deleting image.',error);
    return res.status(500).send({success: false, msg: 'Error deleting image.'});
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

/*
curl -v -X POST -H 'Content-Type: multipart/form-data' -F "file=@/Users/andrealeo/dev/chat21/tiledesk-server-dev-org/test.jpg" https://tiledesk-server-pre.herokuapp.com/images/public/
*/

router.post('/public', upload.single('file'), (req, res, next) => {
  try {
     winston.debug("req",req);
     var folder = req.folder || "error";
     winston.debug("folder",folder);

     var destinationFolder = "uploads/public/images/" + folder +"/";
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
            filename: encodeURIComponent(req.file.filename),
            thumbnail: encodeURIComponent(thumFilename)
        });
      });
      

     
  } catch (error) {
    winston.error('Error deleting public image.',error);
    return res.status(500).send({success: false, msg: 'Error deleting public image.'});
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


// curl -X GET 'http://localhost:3000/images?path=123'
router.get("/", async (req, res) => {
  winston.debug('path', req.query.path);

  if (req.query.as_attachment) {
    res.set({ "Content-Disposition": "attachment; filename=\""+req.query.path+"\"" });

  }


  try {
    let file = await fileService.find(req.query.path);
    // console.log("file", file);

    res.set({ "Content-Length": file.length});
    res.set({ "Content-Type": file.contentType});

  } catch (e) {
    if (e.code == "ENOENT") {
      winston.debug('Image not found: '+req.query.path);
      return res.status(404).send({success: false, msg: 'Image not found.'});
    }else {
      winston.error('Error getting the image', e);
      return res.status(500).send({success: false, msg: 'Error getting image.'});
    }      
  }

  fileService.getFileDataAsStream(req.query.path).on('error', (e)=> {
      if (e.code == "ENOENT") {
        winston.debug('Image not found: '+req.query.path);
        return res.status(404).send({success: false, msg: 'Image not found.'});
      }else {
        winston.error('Error getting the image', e);
        return res.status(500).send({success: false, msg: 'Error getting image.'});
      }      
    }).pipe(res);
  // } catch (e) {
  //   winston.error('Error getting the image', e);
  //   return res.status(500).send({success: false, msg: 'Error getting image.'});
  // }
  
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