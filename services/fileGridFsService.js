



const mongoose = require("mongoose");
const GridFsStorage = require("multer-gridfs-storage");
const uuidv4 = require('uuid/v4');

const FileService = require("./fileService");



class FileGridFsService extends FileService {

    constructor(bucketName) {
        super();
        // DB
        this.mongoURI = "mongodb://localhost:27017/tiledesk";

        // // connection
        this.conn = mongoose.createConnection(this.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });


        // init gfs
        
        this.conn.once("open", () => {
            console.log("mongoURI connected")
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

    getFileDataAsStream (filename) {
        var stream = this.gfs.openDownloadStreamByName(filename);
        return stream;
    }
    getFileDataAsBuffer (filename) {
        var that = this;
        return new Promise((resolve, reject) => {
            var stream = that.getFileDataAsStream(filename);
            

            const bufs = [];
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
                var uuidv4_storage = uuidv4();

                var subfolder = "/public";
                if (req.user && req.user.id) {
                  subfolder = "/users/"+req.user.id;
                }
                const path = 'uploads'+ subfolder + "/" + folderName + "/" + uuidv4_storage ;
                req.uuidv4_storage = uuidv4_storage;

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

}


module.exports = FileGridFsService;