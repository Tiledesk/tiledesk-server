const FileType = require('file-type');
const fs = require('fs');

async function verifyFileContent(file) {
  if (!file) throw new Error("No file provided");

  try {
    // Se multer è memoryStorage
    const buffer = file.buffer || fs.readFileSync(file.path);

    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType) {
        const err = new Error("File type could not be detected");
        err.source = "FileContentVerification";
        throw err;
    }

    if (file.mimetype && fileType.mime !== file.mimetype) {
        const err = new Error(`File content does not match mimetype. Detected: ${fileType.mime}, provided: ${file.mimetype}`);
        err.source = "FileContentVerification";
        throw err;
    }

    return true; // tutto ok
  } catch (err) {
    throw err;
  }
}

module.exports = verifyFileContent;
