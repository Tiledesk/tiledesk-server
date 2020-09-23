
class FilesystemService extends FileService {

    createFile ( fileName, data, contentType, options);
    getFileData (filename);

}

var filesystemService = new FilesystemService();

module.exports = filesystemService;