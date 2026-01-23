const FileType = require('file-type');
const fs = require('fs');

async function verifyFileContent(buffer, mimetype) {
  if (!buffer) throw new Error("No file provided");

  try {

    const fileType = await FileType.fromBuffer(buffer);

    if (!fileType || (mimetype && fileType.mime !== mimetype)) {
        const err = new Error(`File content does not match mimetype. Detected: ${fileType?.mime || 'unknown'}, provided: ${mimetype}`);
        err.source = "FileContentVerification";
        throw err;
    }

    return true;
  } catch (err) {
    throw err;
  }
}

module.exports = verifyFileContent;
