
class FilesystemService extends FileService {

    createFile ( fileName, data, contentType, options);
    getFileData (filename);

}

let filesystemService = new FilesystemService();

module.exports = filesystemService;