



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
        });

   

    }


    async createFile ( filename, data, path, contentType, options) {
        const stream = await this.gfs.openUploadStream(filename, {
            // metadata: options.metadata,
            });
        
        await stream.write(data);
        stream.end();
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
            url : this.mongoURI,
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
                  subfolder = "/users/"+req.user.id;
                }
                const path = 'uploads'+ subfolder + "/" + folderName + "/" + folder ;
                req.folder = folder;

                // const match = ["image/png", "image/jpeg"];
    
                // if (match.indexOf(file.mimetype) === -1) {
                //     const filename = `${Date.now()}-${file.originalname}`;
                //     return filename;
                // }
    
                return {
                    bucketName: folderName,
                    filename: `${path}/${file.originalname}`
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
                


                return {
                    bucketName: folderName,
                    filename: `${path}/${file.originalname}`
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

                  if (req.query.user_id) {
                    winston.debug("req.query.user_id: "+ req.query.user_id);
                    // winston.info("req.projectuser ",req.projectuser);

                    // TODO pass also project_id ?user_id=abc&project_id=123 and find PU
                    // if (req.project_user && req.project_user.role === ) {

                    // }
                    userid = req.query.user_id;
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
                


                return {
                    bucketName: folderName,
                    filename: `${path}/${filename}`
                };
            }
            });

       return storageMongo;     
    }

}


module.exports = FileGridFsService;