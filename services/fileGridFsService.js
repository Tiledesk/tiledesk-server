



const mongoose = require("mongoose");
const GridFsStorage = require("multer-gridfs-storage");
const uuidv4 = require('uuid/v4');
var config = require('../config/database');
var winston = require('../config/winston');
var pathlib = require('path');

const FileService = require("./fileService");



class FileGridFsService extends FileService {

    constructor(bucketName) {
        super();
        // DB
        this.mongoURI = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

        if (process.env.NODE_ENV === 'test') {
            this.mongoURI = config.databasetest;
        }
       

        this.retentionPeriod = 2592000; //30 days
                            //    2147483647 //max accepted
        if (process.env.ATTACHMENT_RETENTION_PERIOD) {
            this.retentionPeriod = parseInt(process.env.ATTACHMENT_RETENTION_PERIOD);
        }

 
        this.enable_retention = false;
        if (process.env.ENABLE_ATTACHMENT_RETENTION === true || process.env.ENABLE_ATTACHMENT_RETENTION === 'true' ) {
            this.enable_retention = true;
            winston.info("Attachments retention enabled with period " + this.retentionPeriod + " seconds");
        } else {
            winston.info("Attachments retention disabled");
        }

        // // connection
        this.conn = mongoose.createConnection(this.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });


        // init gfs
        
        this.conn.once("open", () => {
            // console.log("mongoURI connected")
        // init stream
            this.gfs = new mongoose.mongo.GridFSBucket(this.conn.db, {
                bucketName: bucketName
            });

            if (this.enable_retention===true) {
                this.createRetentionIndex("files.files");
                this.createRetentionIndex("files.chunks");
                this.createRetentionIndex("images.files");
                this.createRetentionIndex("images.chunks");
               
            }
        });

   

    }

    createRetentionIndex(name) {
        this.conn.db.collection(name)

            .createIndex( { "metadata.expireAt": 1 },
                          { expireAfterSeconds: 0 }, 
            // .createIndex( { "uploadDate": 1 },
            //               { expireAfterSeconds: this.retentionPeriod }, 


                          (err, result) => {
            if (err) {
                winston.error('Error creating index with name ' + name, err);
                return;
            }

            winston.info('Index ' + name +'  created successfully:', result);
        });
    }

    async createFile ( filename, data, path, contentType, options) {

        var metadata = undefined;
        if (options && options.metadata) {
            metadata = options.metadata;
        }
        const streamOptions = {
            metadata: metadata,
        };
        if (contentType) {
            streamOptions.contentType = contentType;
        }
        const stream = await this.gfs.openUploadStream(filename, streamOptions);
        
        await stream.write(data);
        stream.end();
        // console.log("stream",stream)
        return new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
          });
    }

    async find(filename) {
        return new Promise(async (resolve, reject) => {
            let files = await this.gfs.find({filename: filename}).toArray();
            winston.debug("files", files);
                if (files.length>0) {                     
                        return resolve(files[0]);                                       
                } else {
                    return reject({code:"ENOENT", msg:"File not found"});
                }
        });
    }
    async deleteFile(filename) {
        return new Promise(async (resolve, reject) => {
            let files = await this.gfs.find({filename: filename}).toArray();
            winston.debug("files", files);
                if (files.length>0) {
                    this.gfs.delete(files[0]._id, function(error) {   
                        if (error) {
                            winston.error("Error deleting gfs file", error);
                            return reject(error);
                        }                     
                        return resolve(files[0]);
                    });
                   
                } else {
                    return reject({msg:"File not found"});
                }
        });
    }

    getFileDataAsStream (filename) {
        // try {
        var stream = this.gfs.openDownloadStreamByName(filename);

        // stream.on('error', function(e) {
        //     console.error("TTTTT",e);
        // });
        // } catch (e) {
        //     console.error("Error0000 getFileDataAsStream");
        //     return reject(e);
        // }
        return stream;
    }
    getFileDataAsBuffer (filename) {
        var that = this;
        return new Promise((resolve, reject) => {

            try {
                var stream = that.getFileDataAsStream(filename);
            } catch (e) {
                console.error("Error getFileDataAsStream");
                return reject(e);
            }
            
            // if (!stream) {
            //     console.error("Error getFileDataAsStream");
            //     return reject(e);
            // }
            

            const bufs = [];
            stream.on('error', function(e){
                console.error("Error getFileDataAsStream");
                return reject(e);
            })
            stream.on('data', (data) => {
                bufs.push(data);
            });
            stream.on('end', () => {

                var buffer = Buffer.concat(bufs);
                return resolve(buffer);
            });
        });
    }

    getStorage(folderName) {
        const storageMongo = new GridFsStorage({
            url: this.mongoURI,
            options: { useNewUrlParser: true, useUnifiedTopology: true },
            file: (req, file) => {
                var folder = uuidv4();

                // var form = new multiparty.Form();

                // form.parse(req, function(err, fields, files) {
                //     console.log("XXX fields",fields)
                //     console.log("XXX files",files)
                // });

                // console.log("XXX req",req)
                // console.log("XXX req.query",JSON.stringify(req.query))
                // console.log("XXX req.body",JSON.stringify(req.body))
                // console.log("XXX req.folder",JSON.stringify(req.folder))
                // console.log("XXX req.headers",JSON.stringify(req.headers))
                // console.log("XXX file",file)

                // if (req.body.folder) {

                //     folder = req.body.folder;
                // }

                var subfolder = "/public";
                if (req.user && req.user.id) {
                    subfolder = "/users/" + req.user.id;
                }
                const path = 'uploads' + subfolder + "/" + folderName + "/" + folder;
                req.folder = folder;
                // const match = ["image/png", "image/jpeg"];

                // if (match.indexOf(file.mimetype) === -1) {
                //     const filename = `${Date.now()}-${file.originalname}`;
                //     return filename;
                // }

                // console.log("Date.now()",Date.now())
                // console.log("this.retentionPeriod*1000",this.retentionPeriod*1000)
                // console.log("Date.now()+this.retentionPeriod*1000",Date.now()+this.retentionPeriod*1000)

                let expireAt = new Date(Date.now()+ this.retentionPeriod*1000) ;
                if (req.expireAt) {
                    expireAt = req.expireAt;
                }

                return {
                    bucketName: folderName,
                    filename: `${path}/${file.originalname}`,
                    metadata: {'expireAt': expireAt}
                };
            }
        });

        return storageMongo;
    }







    getStorageFixFolder(folderName) {
        const storageMongo = new GridFsStorage({ 
            url : this.mongoURI,
            options: { useNewUrlParser: true, useUnifiedTopology: true },
            file: async (req, file) => {
                // var folder = uuidv4();

                // var form = new multiparty.Form();

                // form.parse(req, function(err, fields, files) {
                //     console.log("XXX fields",fields)
                //     console.log("XXX files",files)
                // });

                // console.log("XXX req",req)
                // console.log("XXX req.query",JSON.stringify(req.query))
                // console.log("XXX req.body",JSON.stringify(req.body))
                // console.log("XXX req.folder",JSON.stringify(req.folder))
                // console.log("XXX req.headers",JSON.stringify(req.headers))
                // console.log("XXX file",file)

                // if (req.query.folder) {                    
                //     folder = req.query.folder;
                // }

               

                var subfolder = "/public";
                if (req.user && req.user.id) {
                  subfolder = "/users/"+req.user.id;
                }
                const path = 'uploads'+ subfolder + "/" + folderName ;
                // req.folder = folder;

                // const match = ["image/png", "image/jpeg"];
    
                // if (match.indexOf(file.mimetype) === -1) {
                //     const filename = `${Date.now()}-${file.originalname}`;
                //     return filename;
                // }
    
                var pathExists = `${path}/${file.originalname}`;
                winston.debug("pathExists", pathExists);

                let fileExists = await this.gfs.find({filename: pathExists}).toArray();
                winston.debug("fileExists", fileExists);
                
                if (fileExists && fileExists.length>0) {
                    req.upload_file_already_exists = true;
                    winston.debug("file already exists", pathExists);
                    return;
                }
                

                 let expireAt = new Date(Date.now()+ this.retentionPeriod*1000) ;
                if (req.expireAt) {
                    expireAt = req.expireAt;
                }

                return {
                    bucketName: folderName,
                    filename: `${path}/${file.originalname}`,
                    metadata: {'expireAt': expireAt}
                };
            }
            });

       return storageMongo;     
    }










    getStorageAvatar(folderName) {
        const storageMongo = new GridFsStorage({ 
            url : this.mongoURI,
            options: { useNewUrlParser: true, useUnifiedTopology: true },
            file: async (req, file) => {
                var filename = "photo.jpg";
                // var folder = uuidv4();

                // var form = new multiparty.Form();

                // form.parse(req, function(err, fields, files) {
                //     console.log("XXX fields",fields)
                //     console.log("XXX files",files)
                // });

                // console.log("XXX req",req)
                // console.log("XXX req.query",JSON.stringify(req.query))
                // console.log("XXX req.body",JSON.stringify(req.body))
                // console.log("XXX req.folder",JSON.stringify(req.folder))
                // console.log("XXX req.headers",JSON.stringify(req.headers))
                // console.log("XXX file",file)

                // if (req.body.folder) {
                    
                //     folder = req.body.folder;
                // }

               

                var subfolder = "/public";
                if (req.user && req.user.id) {
                  var userid = req.user.id;

                  if (req.query.bot_id) {
                    winston.debug("req.query.user_id: "+ req.query.user_id);
                    // winston.info("req.projectuser ",req.projectuser);

                    // TODO pass also project_id ?user_id=abc&project_id=123 and find PU
                    // if (req.project_user && req.project_user.role === ) {

                    // }
                    userid = req.query.bot_id;
                  }
                  subfolder = "/users/"+userid;
                }
                const path = 'uploads'+ subfolder + "/" + folderName ;
                // req.folder = folder;

                // const match = ["image/png", "image/jpeg"];
    
                // if (match.indexOf(file.mimetype) === -1) {
                //     const filename = `${Date.now()}-${file.originalname}`;
                //     return filename;
                // }
    
                var pathExists = `${path}/${filename}`;
                winston.debug("pathExists: "+ pathExists);

                let fileExists = await this.gfs.find({filename: pathExists}).toArray();
                winston.debug("fileExists", fileExists);
                
                if (fileExists && fileExists.length>0) {

                    if (req.query.force) {
                        try {
                            await this.deleteFile(pathExists);
                        
                            let thumbFilename = 'thumbnails_200_200-'+filename;
                            winston.info("thumbFilename:"+thumbFilename);
                        
                            let thumbPath = pathExists.replace(filename,thumbFilename);
                            winston.info("thumbPath:"+thumbPath);
                        
                            await this.deleteFile(thumbPath);
                        } catch(e) {
                            winston.error("Error deleting forced old image:",e);
                        }
                        
    
                    } else {

                        req.upload_file_already_exists = true;
                        winston.debug("file already exists", pathExists);
                        return;
                    }
                    

                }
                

                // let expireAt = new Date(Date.now()+ this.retentionPeriod*1000) ;
                // if (req.expireAt) {
                //     expireAt = req.expireAt;
                // }


                return {
                    bucketName: folderName,
                    filename: `${path}/${filename}`,
                    // metadata: {'expireAt': expireAt}
                };
            }
            });

       return storageMongo;     
    }

    /**
     * Storage for avatar/profile photos in files bucket but with fixed path structure
     * Path: uploads/users/{user_id|bot_id}/images/photo.jpg
     * This maintains compatibility with clients that expect fixed paths
     */
    getStorageAvatarFiles(folderName) {
        const storageMongo = new GridFsStorage({ 
            url : this.mongoURI,
            options: { useNewUrlParser: true, useUnifiedTopology: true },
            file: async (req, file) => {
                var filename = "photo.jpg";
               
                var subfolder = "/public";
                if (req.user && req.user.id) {
                  var userid = req.user.id;

                  if (req.query.bot_id) {
                    winston.debug("req.query.bot_id: "+ req.query.bot_id);
                    userid = req.query.bot_id;
                  }
                  subfolder = "/users/"+userid;
                }
                // Use "images" in path for backward compatibility with clients
                const path = 'uploads'+ subfolder + "/images" ;
    
                var pathExists = `${path}/${filename}`;
                winston.debug("pathExists: "+ pathExists);

                let fileExists = await this.gfs.find({filename: pathExists}).toArray();
                winston.debug("fileExists", fileExists);
                
                // Always delete old photo and thumbnail if they exist (allow profile photo updates)
                if (fileExists && fileExists.length>0) {
                    try {
                        await this.deleteFile(pathExists);
                        winston.debug("Deleted old profile photo:", pathExists);
                    
                        let thumbFilename = 'thumbnails_200_200-'+filename;
                        let thumbPath = pathExists.replace(filename,thumbFilename);
                        winston.debug("thumbPath:"+thumbPath);
                    
                        try {
                            await this.deleteFile(thumbPath);
                            winston.debug("Deleted old thumbnail:", thumbPath);
                        } catch(thumbErr) {
                            // Thumbnail might not exist, that's ok
                            winston.debug("Thumbnail not found or already deleted:", thumbPath);
                        }
                    } catch(e) {
                        winston.error("Error deleting old profile photo:",e);
                        // Continue anyway - the new upload will overwrite
                    }
                }

                // Avatar/profile photos have no retention by default
                // Only set expireAt if explicitly provided in req.expireAt
                let returnObj = {
                    bucketName: folderName,
                    filename: `${path}/${filename}`
                };
                
                if (req.expireAt) {
                    returnObj.metadata = {'expireAt': req.expireAt};
                }

                return returnObj;
            }
        });

       return storageMongo;     
    }

    /**
     * Storage for project assets (logos, documents, etc.)
     * Path: uploads/projects/{project_id}/assets/{uuid}/filename
     * Assets belong to the project, not to the user who uploads them
     */
    getStorageProjectAssets(folderName) {
        const storageMongo = new GridFsStorage({
            url: this.mongoURI,
            options: { useNewUrlParser: true, useUnifiedTopology: true },
            file: (req, file) => {
                var folder = uuidv4();

                // Try to get project ID from req.project._id or req.projectid
                let projectId;
                if (req.project && req.project._id) {
                    projectId = req.project._id.toString();
                } else if (req.projectid) {
                    projectId = req.projectid.toString();
                } else {
                    winston.error("Project not found in request for asset upload");
                    throw new Error("Project is required for asset upload");
                }

                const path = 'uploads/projects/' + projectId + "/" + folderName + "/" + folder;
                req.folder = folder;

                // Assets have no retention by default
                // Only set expireAt if explicitly provided in req.expireAt
                let returnObj = {
                    bucketName: folderName,
                    filename: `${path}/${file.originalname}`
                };
                
                if (req.expireAt) {
                    returnObj.metadata = {'expireAt': req.expireAt};
                }

                return returnObj;
            }
        });

        return storageMongo;
    }

}


module.exports = FileGridFsService;